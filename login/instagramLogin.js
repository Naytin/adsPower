
import { delay, retry } from '../helpers.js';
import {errorHandler} from '../errorHandler.js'
import {  selectors, instagram, delays } from '../constant.js';

async function findFormAndClick(page, user_id) {
  try {
    await delay(delays.waitForm)
    const formHandle = await page.$(selectors.instagramLoginForm);
    if (!formHandle) {
      console.log('Form not found');
      return false;
    }

    //get user
    const user = 

    console.log('Typing username...');
    await page.type('input[name="username"]', 'your_username', { delay: 50 });

    console.log('Typing password...');
    await page.type('input[name="password"]', 'your_password', { delay: 50 });

    console.log('Submitting login form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    const result = await page.evaluate(form => {
      try {
        // Navigate to the desired nested element
        const nestedElement = form.children[0]?.children[2]?.children[0];

        if (nestedElement) {
          nestedElement.click();
          return { success: true, details: 'Clicked the selector - ' + '0.2.0 (form)'};
        }

        return { success: false, details: 'Nested element not found' };
      } catch (error) {
        return { success: false, details: `Error: ${error.message}` };
      }
    }, formHandle);

    console.log(result);

    return result?.success
  } catch (error) {
    errorHandler('Error in findFormAndClick function:', error);
  }
}


async function instagramIsLoggedIn(page, user_id) {
  try {
    //if there is selector that mean we are already logged in
    await page.waitForSelector(selectors.instagramLoggedIn);
    const isLoggedIn = await page.$(selectors.instagramLoggedIn);
    // const formHtml = await page.evaluate(form => form.outerHTML, isLoggedIn);
    // console.log('isLoggedIn form', formHtml);

    return !!isLoggedIn
  } catch (error) {
    errorHandler('instagramIsLoggedIn error', user_id)
    return false;
  }
}

export async function instagramLogin(page, user_id) {
  console.log('instagramLogin', user_id)
  const isLoginPage = await page.$(selectors.instagramLoginForm);
  console.log('instagram isLoginPage', Boolean(isLoginPage), user_id)
  let isLoggedIn = false;
  let attempt = 1
  
  if (!isLoginPage) {
    isLoggedIn = await instagramIsLoggedIn(page, user_id)
  }
  
  if (!isLoggedIn) {
    await retry(async () => {
      let status = false;
      console.log('retry instagramLogin', isLoggedIn, attempt)
      if (attempt > 1) {
        status = await instagramIsLoggedIn(page, user_id)
        attempt++
      }
      if (!status) {
        await findFormAndClick(page, user_id);
      }
      //
      await delay(delays.waitAfterLogIn);

      console.log('check is logged in', user_id)
      isLoggedIn = await instagramIsLoggedIn(page, user_id);
      if (!isLoggedIn) {
        throw new Error("Login attempt failed");
      }
    }, 3, 5000); // Retry - attempts, timeout between attempts
  }

  console.log(isLoggedIn ? "Instagram Successfully logged in " + user_id : "Instagram Already logged in " + user_id);
  return isLoggedIn;
}