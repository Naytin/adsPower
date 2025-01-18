
import puppeteer from 'puppeteer-core';
import { api } from './adsApi.js';
import { errorHandler } from './errorHandler.js'
import { threads, instagram, delays } from './constant.js';
import { likeAndRepostMain } from './likeAndRepost/likeAndRepost.js'
import {threadsIsLoggedIn} from './login/threadsLogin.js'
import { delay, retry } from './helpers.js';

const DEFAULT_VIEWPORT = {
  width: 1200,
  height: 800,
  deviceScaleFactor: 1,
};

let intervalId
const activeBrowserIds = new Set(); 
const intervalMap = new Map(); // To track intervalId for each user


async function processBrowsers() {
  try {
    // Fetch the active browsers list from AdsPower
    const browsers = await api.activeBrowsers();
    // Clean up inactive browsers using the fetched list
    await cleanInactiveBrowsers(browsers);

    if (!browsers || browsers.length === 0) {
      errorHandler('No active browsers found.');
      return;
    }

    const newBrowsers = browsers.filter(browser => browser?.user_id && !activeBrowserIds.has(browser.user_id));
    console.log(`New browsers to process: ${newBrowsers.length}`, activeBrowserIds);

    const results = await Promise.allSettled(newBrowsers.map(connectActions));
 
    logResults(results, newBrowsers);
  } catch (error) {
    errorHandler('Error in main function:', error);
  }
}

async function cleanInactiveBrowsers(activeBrowsers = []) {
  try {
    console.log('Cleaning up inactive browsers...');

    // Fetch the list of active browser user IDs from AdsPower
    const activeUserIds = new Set(activeBrowsers.map(browser => browser.user_id));

    // Iterate through the current activeBrowserIds
    for (const userId of activeBrowserIds) {
      // If the userId is not in the active list, clean it up
      if (!activeUserIds.has(userId)) {
        console.log(`Cleaning up browser and interval for inactive user ID: ${userId}`);

        // Clear the interval for this userId, if it exists
        if (intervalMap.has(userId)) {
          clearInterval(intervalMap.get(userId));
          intervalMap.delete(userId);
        }

        // Remove the userId from the activeBrowserIds set
        activeBrowserIds.delete(userId);
      }
    }

    // If no active browsers are found, clean up all intervals and IDs
    if (activeUserIds.size === 0) {
      console.log('No active browsers found. Cleaning up all intervals and IDs...');
      for (const userId of activeBrowserIds) {
        if (intervalMap.has(userId)) {
          clearInterval(intervalMap.get(userId));
          intervalMap.delete(userId);
        }
      }
      activeBrowserIds.clear();
    }

  } catch (error) {
    errorHandler('Error while cleaning inactive browsers:', error);
  }
}


function logResults(results, newBrowsers) {
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const browser = newBrowsers[index];
      activeBrowserIds.add(browser.user_id);
      console.log(`Browser ${index} connected successfully.`);
    } else {
      errorHandler(`Error connecting browser ${index}:`, result.reason);
    }
  });
}

// Periodically check for new active browsers
async function scheduleBrowserChecks() {
  await processBrowsers();
  setInterval(async () => {
    console.log('Running periodic check for new browsers...');
    await processBrowsers();
  }, delays.checkNewBrowsersInterval);
}


async function connectToBrowser(wsEndpoint, userId) {
  try {
    return await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
      defaultViewport: DEFAULT_VIEWPORT,
    });
  } catch (error) {
    errorHandler(`Failed to connect Puppeteer for user ID: ${userId}`, error);
    return null;
  }
}

function findPages(pages) {
  let threadsPage = null;
  let instagramPage = null;

  for (const page of pages) {
    const url = page.url();
    if (url.includes(threads)) {
      threadsPage = page;
    } else if (url.includes(instagram)) {
      instagramPage = page;
    }
  }

  return { threadsPage, instagramPage };
}

async function closeBrowserAndConnectAgain(user_id) {
  try {
    console.log('close browser for the user id - ', user_id)
    const closed = await api.stopBrowser(user_id);

    if (closed === 0) {
      const browser = await api.openBrowser(user_id);

      if (browser) {
        console.log('new browser opened', browser);

        return {link: browser, user_id}
      } else {
        console.log('new browser not opened', user_id)
      }
    }
  } catch (error) {
    console.error('closeBrowserAndConnectAgain error', error)
  }
}

function scheduleRecurringActions(threadsPage, userId) {
  if (intervalMap.has(userId)) {
    console.log(`Clearing existing interval for user ID: ${userId}`);
    clearInterval(intervalMap.get(userId)); // Clear any existing interval for the user
  }

  const intervalId = setInterval(async () => {
    console.log(`Running actions for user ID: ${userId} at ${new Date().toLocaleTimeString()}`);
    try {
      await threadsPage.reload({ waitUntil: ['domcontentloaded'] });
      await delay(delays.afterReload);
      await likeAndRepostMain(threadsPage, userId);
    } catch (error) {
      console.error(`Error during scheduled actions for user ID: ${userId}:`, error);
      clearInterval(intervalId);
      intervalMap.delete(userId);
    }
  }, delays.interval);

  intervalMap.set(userId, intervalId); // Store intervalId for the user
}

async function connectActions(puppeteerBrowser) {
  return retry(async () => {
    const wsEndpoint = puppeteerBrowser?.ws?.puppeteer;
    const user_id = puppeteerBrowser?.user_id

    if (wsEndpoint) {
      console.log('Connecting to AdsPower browser:', wsEndpoint);
      // Connect Puppeteer to AdsPower browser instance
      let browser = await connectToBrowser(wsEndpoint, user_id);

      let pages
      try {
        pages = await browser.pages();
      } catch (error) {
        // console.log(`pages error - ${user_id}`)
        //if there are something wrong - try to close and open again this browser
        await retry(async () => {
          const response = await closeBrowserAndConnectAgain(user_id)

          if (response?.link) {
            browser = await connectToBrowser(response.link, user_id);
            await delay(delays.waitForm)
            pages = await browser.pages();
          } else {
            throw new Error(`new browser not opened`);
          }
        }, 5, delays.afterReload)
      }
      
      if (!pages) {
        errorHandler('pages not found', user_id)
        throw new Error('pages not found')
      }

      let { threadsPage, instagramPage } = findPages(pages);

      // If the page with threads has not found, open a new one
      if (!threadsPage) {
        console.log('Threads page not found. Opening a new one...');
        threadsPage = await browser.newPage();
      }
      
      //check if the threads is logged in
      let isLoggedIn = await threadsIsLoggedIn(threadsPage, user_id)
      
      //run actions
      if (isLoggedIn) {
        console.log('logged in and ready to like and repost', user_id)
        
        await threadsPage.reload({ waitUntil: ['domcontentloaded'] });

        const res = await likeAndRepostMain(threadsPage, user_id);

        if (!res?.isError) {
          scheduleRecurringActions(threadsPage, user_id);
        } else if (res?.isError && intervalId) {
          clearInterval(intervalMap.get(user_id));
          intervalMap.delete(user_id);
        }
      } else {
        errorHandler('something went wrong - could not log in to - ', user_id)
        throw new Error(`something went wrong - could not log in to - ${user_id}`)
      }
    } else {
      errorHandler('WebSocket endpoint not provided by AdsPower:', acc);
      throw new Error('WebSocket endpoint not provided by AdsPower:')
    }
     
  },5, delays.afterReload)
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('Terminating the script...');
  for (const [userId, intervalId] of intervalMap.entries()) {
    console.log(`Clearing interval for user ID: ${userId}`);
    clearInterval(intervalId);
  }
  intervalMap.clear();
  process.exit();
});

scheduleBrowserChecks();