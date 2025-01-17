
import puppeteer from 'puppeteer-core';
import { api } from './adsApi.js';
import { errorHandler } from './errorHandler.js'
import { threads, instagram, delays } from './constant.js';
import { likeAndRepostMain } from './likeAndRepost/likeAndRepost.js'
import {threadsIsLoggedIn} from './threadsLogin.js'
import { delay, retry } from './helpers.js';

//1 - get active browsers
//2 - run actions for all active browsers
//3 - check if the threads is opened and logged in, if no - open the instagram - check if the instagram is opened, if no - open and check if the user logged in / log in - close instagram window and go to threads
// 3-2 - check after login if the password is wrong, to stop trying connect
//4 - check if the threads is opened and logged in, if no open the threads and log in
//5 - run like and repost actions

const DEFAULT_VIEWPORT = {
  width: 1200,
  height: 800,
  deviceScaleFactor: 1,
};

let intervalId

async function main() {
  try {
    // Fetch the active browsers list from AdsPower
    const browsers = await api.activeBrowsers();

    if (!browsers || browsers.length === 0) {
      errorHandler('No active browsers found.');
      return;
    }

    const results = await Promise.allSettled(browsers.map(connectActions));

    logResults(results);
  } catch (error) {
    errorHandler('Error in main function:', error);
  }
}

function logResults(results) {
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Browser ${index} connected successfully.`);
    } else {
      errorHandler(`Error connecting browser ${index}:`, result.reason);
    }
  });
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

async function connectActions(puppeteerBrowser) {
  try {
    const wsEndpoint = puppeteerBrowser?.ws?.puppeteer;
    const user_id = puppeteerBrowser?.user_id

    if (wsEndpoint) {
      console.log('Connecting to AdsPower browser:', wsEndpoint);
      console.log('user id', user_id);
      // Connect Puppeteer to AdsPower browser instance
      let browser = await connectToBrowser(wsEndpoint, user_id);

      let pages
      try {
        pages = await browser.pages();
      } catch (error) {
        console.log(`pages error - ${user_id}`)
        //try to close and open again
        await retry(async () => {
          const response = await closeBrowserAndConnectAgain(user_id)

          if (response?.link) {
            browser = await connectToBrowser(response.link, user_id);
            await delay(delays.waitForm)
            pages = await browser.pages();
          } else {
            throw new Error(`new browser not opened`);
          }
        }, 5, 5000)
      }
      
      if (!pages) {
        errorHandler('pages not found', user_id)
        throw new Error('pages not found')
      }

      let { threadsPage, instagramPage } = findPages(pages);

      // If the page with threads is not found, open a new one
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
          intervalId = setInterval(async () => {
            console.log('Running the script at:', new Date().toLocaleTimeString());
            await threadsPage.reload({ waitUntil: ['domcontentloaded'] });
            await delay(10000)
            await likeAndRepostMain(threadsPage, user_id);
          }, 5 * 60 * 1000);
        } else if (res?.isError && intervalId) {
          clearInterval(intervalId);
        }
      } else {
        errorHandler('something went wrong - could not log in to - ', user_id)
      }
    } else {
      errorHandler('WebSocket endpoint not provided by AdsPower:', acc);
    }
  } catch (error) {
    errorHandler('connectActions error', error.message)
    throw 'connectActions error'
  }
}

process.on('SIGINT', () => {
  console.log('Terminating the script...');
  clearInterval(intervalId);
  process.exit();
});

main();