import {errorHandler} from '../errorHandler.js'
export async function scrollIntoView(page, posts, index) {
  try {
    return await page.evaluate((container, index) => {
      try {
        const postElement = container.children[0]?.children[0]?.children[1]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.children[0]?.children[3]?.children[0]?.children[0]?.children[index];

        if (postElement) {
          postElement.scrollIntoView({ behavior: 'auto', block: 'center' });
          return {
            success: true,
            index,
            details: 'Post element has found',
          };
        } else {
          return { success: false, details: 'Post element not found', index };
        }
      } catch (error) {
        return { success: false, details: error, index};
      }
   }, posts, index);
  } catch (error) {
    errorHandler('scrollIntoView error', error)
  }
}