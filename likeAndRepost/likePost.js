import { delay, getRandomDelay, retry} from '../helpers.js';
import {errorHandler} from '../errorHandler.js'
import {scrollIntoView} from './scrollPostIntoView.js'
import { selectors } from '../constant.js';

export async function like(page,secondDiv, index) {
  try {
    await delay(getRandomDelay());

    return retry(async () => {
    const response = await page.evaluate((container, index, attributes) => {
      try {
        // const postElement = container.children[0]?.children[0]?.children[1]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.children[0]?.children[3]?.children[0]?.children[0]?.children[index];
        // const likeButton = postElement?.children[0]?.children[0]?.children[0]?.children[1]?.children[2]?.children[0]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.children[0];
        // const isLike = likeButton.getAttribute('aria-label') === 'Like'

        // const postElement = getPostElement(container, index)
        const postElement = container.children[0]?.children[0]?.children[1]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.children[0]?.children[3]?.children[0]?.children[0]?.children[index];
        const isVisible = postElement?.children[0]?.children?.length
        if (!isVisible) return { success: false, details: `post/like not visible - ${isVisible}`, isVisible: false, index};
        const isViolentContent = postElement?.children[0]?.children[0].hasAttribute('data-interactive-id')
        if (isViolentContent) return { success: false, details: `like this is violent content`, index};

        const fourthChildIndex = postElement?.children[0]?.children[0]?.children[0]?.children?.length - 1;
        const seventhChildIndex = postElement?.children[0]?.children[0]?.children[0]?.children[fourthChildIndex]?.children[2]?.children[0]?.children?.length - 1;
        const likeButton = postElement?.children[0]?.children[0]?.children[0]?.children[fourthChildIndex]?.children[2]?.children[0]?.children[seventhChildIndex]?.children[0]?.children[0]?.children[0]
        const twelfthChildIndex = likeButton?.children[0]?.children?.length - 1
        const svg = likeButton?.children[0]?.children[twelfthChildIndex].children[0]

       
        const attribute = svg.getAttribute('aria-label')
        const isLike = attributes?.includes(attribute);

        // return {success: false, details: 'like error', element: {
        //   tagName: postElement.tagName,
        //   id: postElement.id,
        //   className: postElement.className,
        //   isVisible: !!isVisible
        //   // fourthChildIndex 
        //   // innerText: form.innerText,
        // }}

        if (!isLike) {
          return { success: true, details: 'unlike button', isLike, index};
        } else if (likeButton && isLike) {
          likeButton?.click();
          return { success: true, details: 'like button clicked', isLike, index};
        } else {
          return { success: false, details: 'like button not found', index};
        }
      } catch (error) {
       return { success: false, details: error, index};
      }
   }, secondDiv, index, selectors.likeAttributes);

    if (!response?.success && response?.isVisible === false) {
         errorHandler(response?.details)
         await scrollIntoView(page, secondDiv, index)
         throw new Error(`post/like not visible - ${index}`);
       }
   
       return response
   },3, 3000)
  } catch (error) {
    errorHandler('like error', error)
  }
}
