import { delay, retry } from '../helpers.js';
import {  selectors, threads, delays } from '../constant.js';
import {errorHandler} from '../errorHandler.js'

async function findFormAndClick(page) {
  try {
    const formHandle = await page.$('form');
    if (!formHandle) {
      console.log('Form not found');
      return;
    }

    const result = await page.evaluate(form => {
      try {
        // Navigate to the desired nested element
        const nestedElement = form.children[0]?.children[3]?.children[1];

        if (nestedElement) {
          nestedElement.click();
          return { success: true, details: 'Clicked the selector -' + '0.3.1 (form)' };
        }

        return { success: false, details: 'Nested element not found' };
      } catch (error) {
        return { success: false, details: `Error: ${error.message}` };
      }
    }, formHandle);

    console.log(result);
    let isSuccess = false
    if (result?.success) {
      await delay(3000)
      await retry(async () => { 
        const div = await page.$(selectors.threadsConfirmLogin);
        if (div) {
          div.click();
          console.log({ success: true, details: 'Clicked the Continue to Threads button' });
          isSuccess = true
        } else {
          errorHandler(`selector - ${selectors.threadsLoginWithInstagram} not found`)
          throw new Error(`selector - ${selectors.threadsLoginWithInstagram} not found`);
        }
      }, 3, 3000)
    }

    return result?.success && isSuccess
  } catch (error) {
    errorHandler('Error in findFormAndClick function:', error);
    return false
  }
}

async function openMenuAndGoToFollowingPage(page) {
  try {
    return await retry(async () => { 
      let bodyDivs = await page.$$('body > div');
      const secondDiv = bodyDivs[1];
      bodyDivs = null

      const haspopup = await page.evaluate((body) => {
        try {
          const nestedElement = body.children[0]?.children[0]?.children[1]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[3]?.children[1]?.children[2]?.children[0];
          if (nestedElement) {
            nestedElement.click();
            return { success: true, details: 'Clicked menu -' + '0.0.0.3.1.2.0 (form)', 
              //   element: {
              //   tagName: nestedElement.tagName,
              //   id: nestedElement.id,
              //   className: nestedElement.className,
              // //   // innerText: body.innerText,
              // } 
            };
          }
          return { success: false, details: 'menu element not found' };
        } catch (error) {
          return { success: false, details: `Error: ${error.message}` };
        }
      }, secondDiv);

      let isSuccess = false
      // console.log(haspopup)
      if (!haspopup.success) {
        await page.reload({ waitUntil: 'networkidle2' });
        throw new Error(haspopup.details);
      }

      if (haspopup?.success) {
        await page.waitForSelector(selectors.threadsOpenedModal)
        await delay(3000)
        const menu = await page.$(selectors.threadsOpenedModal);
        // const formHtml = await page.evaluate(form => form.outerHTML, menu);
        // const container = await page.evaluate(container => {
        //   try {
        //     const postsContainer = container.children[0]?.children[0]?.children[0]?.children[1];
        //     if (postsContainer) {
        //       return {
        //         tagName: postsContainer.tagName,
        //         id: postsContainer.id,
        //         className: postsContainer.className,
        //         innerText: postsContainer.innerText,
        //       }
        //     } else {
        //       return { success: false, details: 'postsContainer not found' };
        //     }
              
        //   } catch (error) {
        //     return {error}
        //   }
        // }, menu);
        // console.log({checkMenu: formHtml})
        // console.log({checkMenu: container})
        if (menu) {
          const menuResult = await page.evaluate(form => {
            try {
              // Navigate to the desired nested element
              const nestedElement = form.children[0]?.children[0]?.children[0]?.children[1];
      
              if (nestedElement) {
                  nestedElement.click();
                  isSuccess = true
                  return { success: true, details: 'Clicked following -' + '0.0.0.1 (form)', 
                  //   element: {
                  //   tagName: nestedElement.tagName,
                  //   id: nestedElement.id,
                  //   className: nestedElement.className,
                  //   // innerText: nestedElement.innerText,
                  // } 
                };
              }
      
              return { success: false, details: 'following element not found' };
            } catch (error) {
              return { success: false, details: `Error: ${error.message}` };
            }
          }, menu);
          // console.log(menuResult)
          if (!menuResult.success) {
            await page.reload({ waitUntil: 'networkidle2' });
            throw new Error(menuResult.details);
          }
        } else {
          console.error('modal menu no found')
          await page.reload({ waitUntil: 'networkidle2' });
          throw new Error('modal menu no found');
        }

      } else {
        console.error('the popup menu not found')
        await page.reload({ waitUntil: 'networkidle2' });
          throw new Error('popup menu no found');
      }

      if (isSuccess) return isSuccess;
      const isLoggedIn = await page.$(selectors.threadsLoginButton);
      return !isLoggedIn
    },5,3000)
    
  } catch (error) {
    errorHandler('openMenuAndGoToFollowingPage', error)
  }
}

async function openMainPage(page) {
  try {
    // console.log('open main')
    const main = await page.$(selectors.threadsPage);

    if (main) {
      // console.log('click to main page')
      await Promise.all([
        page.waitForNavigation({waitUntil: ['domcontentloaded']}),
        main.evaluate(b => b.click())
      ])
    } else {
      errorHandler('main page button not found')
    }
    // console.log('open main clicked')
    return !!main
  } catch (error) {
    errorHandler('openMainPage error', error)
  }
}

async function openLoginPage(page) {
  try {
    const login = await page.$(selectors.threadsLoginButton);
    if (login) {
      console.log('click to login page')
      login.click()
    } else {
      console.log('login page button not found')
    }

    return !!login
  } catch (error) {
    errorHandler('openLoginPage error', error)
  }
}

async function redirect(page, user_id) {
  try {
    if (page?.url()?.includes('/following')) {
      console.log('in following page already', user_id)
      return true
    } else if (page?.url()?.includes(`${threads}login`)) {
      console.log('redirect it is already login page', user_id)
      return false
    } else if (page?.url()?.includes('waterfall_id') || (page?.url()?.includes(threads) && !page?.url()?.includes('/following')) ) {
      console.log('redirect to following', page?.url())
      const isClicked = await openMainPage(page)
      if (isClicked) {
        await delay(delays.redirectToFollowing)
        return await openMenuAndGoToFollowingPage(page);
      }
      return false
    } else if (!page?.url()?.includes(threads)) {
      console.log('navigate to threads', user_id)
      //puppeteer error
      await Promise.all([
        page.waitForNavigation({waitUntil: ['domcontentloaded']}),
        page.goto(`${threads}following`)
      ])
    } else if (page?.url() === threads) {
      console.log('main menu - redirect to following', threads, user_id)
      return await openMenuAndGoToFollowingPage(page);
    }
    return null;
  } catch (error) {
    errorHandler('redirect error', error)
    return null;
  }
}

export async function threadsIsLoggedIn(page, user_id) {
  try {
    // console.log('start log in', user_id)
    const isRedirected = await redirect(page, user_id);
    // console.log({isRedirected, user_id})
    if (isRedirected !== null) return isRedirected
    console.log('threadsIsLoggedIn', user_id)
    //if there is no selector, it will give an error - perhaps we are already logged in
    await page.waitForSelector(selectors.threadsLoginButton);
    const isLoggedIn = await page.$(selectors.threadsLoginButton);

    console.log('threads is loggedIn', !isLoggedIn, user_id, isLoggedIn)
    //if there in no selector and we are not in a following page - redirect to it
    if (!isLoggedIn && page?.url() !== `${threads}following`) {
      console.log("Navigating to the 'following' page", user_id);
      await redirect(page, user_id);
    }
    
    return !isLoggedIn
  } catch (error) {
    errorHandler('threadsIsLoggedIn error the user_ud - ', user_id, error)
    const isLoggedIn = await page.$(selectors.threadsLoginButton);
    //if there is no selector and we are not in a following page - redirect to it
    if (!isLoggedIn && page?.url()?.includes(threads) && !page?.url()?.includes('/following')) {
      console.log('threadsIsLoggedIn double check', user_id)
      await redirect(page, user_id);
      console.log('threadsIsLoggedIn double check finished', page?.url(), user_id)
      return true;
    } else {
      return false;
    }    
  }
}

export async function reloadAndTryToGoToFollowingPage(page, user_id) {
  if (!page || !user_id) {
    errorHandler('Invalid parameters provided to reloadAndTryToGoToFollowingPage');
    return false;
  }

  try {
    await retry(async () => { 
      await page.reload({ waitUntil: 'networkidle2' });
      await threadsIsLoggedIn(page, user_id);

      if (!page?.url()?.includes('/following')) {
        throw new Error(`User ${user_id} not redirected to following page after reload`);
      }
    }, 3, 5000);

    console.log(`Successfully reloaded and redirected to following page for user ${user_id}`);
    return true;
  } catch (error) {
    errorHandler(`reloadAndTryToGoToFollowingPage error for user ${user_id}:`, error);
    return false;
  }
}



export async function threadsIsLoggedInV1(page, user_id) {
  try {
    const isRedirected = await redirect(page, user_id);
    if (isRedirected !== null) return isRedirected

    //if there is no selector, it will give an error - perhaps we are already logged in
    await page.waitForSelector(selectors.threadsLoginButton);
    const isLoggedIn = await page.$(selectors.threadsLoginButton);

    console.log('threads is loggedIn', !isLoggedIn, user_id, isLoggedIn)
    //if there in no selector and we are not in a following page - redirect to it
    if (!isLoggedIn && page?.url() !== `${threads}following`) {
      console.log("Navigating to the 'following' page", user_id);
      await redirect(page, user_id);
    }
    
    return !isLoggedIn
  } catch (error) {
    errorHandler('threadsIsLoggedIn error the user_ud - ', user_id, error)
    const isLoggedIn = await page.$(selectors.threadsLoginButton);
    //if there is no selector and we are not in a following page - redirect to it
    if (!isLoggedIn && !page?.url()?.includes('/following')) {
      console.log('threadsIsLoggedIn double check', user_id)
      await redirect(page, user_id);
      console.log('threadsIsLoggedIn double check finished', page?.url(), user_id)
      return true;
    } else {
      return false;
    }    
  }
}

export async function threadsLogin(page, user_id) {
  let isLoggedIn = await threadsIsLoggedIn(page, user_id);
  let attempt = 1
 
  if (!isLoggedIn) {
    await retry(async () => {    
      console.log("Navigating to the login page", isLoggedIn, user_id);
      let status = false;
      if (attempt > 1) {
        status = await instagramIsLoggedIn(page, user_id)
        attempt++
      }
      //if the status is not true (not logged in), navigate to login page and try to log in
      if (!status && !page?.url()?.includes('waterfall_id')) {
       if (!page?.url()?.includes(`${threads}login`)) {
        await openLoginPage(page)
       }
        console.log("Clicking 'Continue with Instagram' and 'Continue to Threads' buttons", page?.url(), user_id);
        await findFormAndClick(page);
      }
      
      await delay(delays.waitAfterLogIn);
      // await page.waitForNetworkIdle();//often fails
      console.log("threads check is logged in", user_id);
      isLoggedIn = await threadsIsLoggedIn(page, user_id);
      if (!isLoggedIn) {
        throw new Error("Login attempt failed");
      }
    }, 3, 5000); // Retry - attempts, timeout between attempts
  } else {

  }

  console.log(isLoggedIn ? "Successfully logged in " + user_id : "Already logged in " + user_id);
  return isLoggedIn;
}
