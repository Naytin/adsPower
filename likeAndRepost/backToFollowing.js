import { selectors } from "../constant.js";
import { errorHandler } from "../errorHandler.js";

export async function backToFollowingPage(page, place) {
  try {
    //check in we are in the post page
    if (page.url()?.includes('/post/')) {
      console.log(`${place} in the post page - try to come back`)

      const bodyDivs = await page.$$('body > div');
      const secondDiv = bodyDivs[1]; // The target container
      bodyDivs.length = 0; // Clear unused references

      const response = await page.evaluate((container, selectors) => {
        try {
          let back = container //[0,0,1,1,0,0,0,0,0,0,0,0,3,0,0,0,0]

          for (const index of selectors) {
            back = back?.children[index]
            if (!back) {
              back = null
              break;
            }
          }

          if (back) {
            back.click();
            return {success: true, details: 'clicked back button'}
          } 

          return {success: false, details: 'back button not found', noFound: true}
        } catch (error) {
          return {success: false, error: error?.message || 'backToFollowing error'}
        }
      }, secondDiv, selectors.postBackButton);
      console.log(response)

      return {isPost: true, success: response?.success}
    }

    return {isPost: false, success: true}
  } catch (error) {
    errorHandler('backToFollowingPage error', error)
  }
}