import { delays, selectors } from '../constant.js';
import { delay, getRandomDelay, retry} from '../helpers.js';
import {scrollIntoView} from './scrollPostIntoView.js'
import {errorHandler} from '../errorHandler.js'
import { backToFollowingPage } from './backToFollowing.js';


async function openRepostModal(page,secondDiv, index, isRetry) {
  try {
    const response = await retry(async () => {

      if (isRetry) {
        console.log('scroll')
        await scrollIntoView(page, secondDiv, index)
      }

      const response = await page.evaluate((container, index, isRetry) => {
        try { 
          const postElement = container.children[0]?.children[0]?.children[1]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.children[0]?.children[3]?.children[0]?.children[0]?.children[index];
          const isVisible = postElement?.children[0]?.children?.length
          if (!isVisible) return { success: false, details: `post not visible - ${isVisible}`, isVisible: false, index};
          const isViolentContent = postElement?.children[0]?.children[0].hasAttribute('data-interactive-id')
          if (isViolentContent) return { success: false, details: `repost this is violent content`, index};
          
          // if (isOpen) {
          //   const button = postElement?.children[0]?.children[0]?.children[0]
          //   button.click();
          //   return { success: true, details: 'repost button clicked', index};
          // }

          const fourthChildIndex = postElement?.children[0]?.children[0]?.children[0]?.children?.length - 1;
          const seventhChildIndex = postElement?.children[0]?.children[0]?.children[0]?.children[fourthChildIndex]?.children[2]?.children[0]?.children?.length - 1;
          const postButton = postElement?.children[0]?.children[0]?.children[0]?.children[fourthChildIndex]?.children[2]?.children[0]?.children[seventhChildIndex]?.children[0]?.children[2]?.children[0]
          // const twelfthChildIndex = postButton?.children[0]?.children?.length - 1
          // const svg = postButton?.children[0]?.children[twelfthChildIndex]
          // return {success: false, details: 'post error', element: {
          //   tagName: postButton.tagName,
          //   id: postButton.id,
          //   className: postButton.className,
          //   isVisible: !!isVisible,
          //   v: isVisible
          //   // innerText: form.innerText,
          //   // fourthChildIndex
          // }}
          
          if (postButton) {
              postButton?.click();
              return { success: true, details: 'repost button clicked', index};
            } else {
              return { success: false, details: 'repost button not found', index};
            }
        } catch (error) {
          return { success: false, details: error, index};
        }
    }, secondDiv, index, isRetry);

    if (!response?.success && response?.isVisible === false) {
      errorHandler(response?.details)
      await scrollIntoView(page, secondDiv, index)
      throw new Error(`post not visible - ${index}`);
    }

    return response
    },3, 3000)

   return response;
  } catch (error) {
    errorHandler('openRepostModal error', error)
  }
}

export async function repost(page, secondDiv, index) {
  let attempts = 1
  let response;
  try {
    return await retry(async () => {
      console.log({attempts})
      const status = await isReposted(page,secondDiv, index);

      // console.log({alreadyReposted})
      if (status?.success && status?.isReposted) return { success: true, details: 'repost button already clicked', isClicked: true, index}
      await delay(getRandomDelay());
    
      //check in we are in the post page
      const back = await backToFollowingPage(page, 'repostModal')
      if (!back?.success && back?.noFound !== false) {
        console.log('repostModal in the post page - try to come back')
        attempts++
        throw new Error(`post not in the following page - ${index}`);
      } else if (back?.noFound === false) {
        return { success: false, details: 'back button not found', reload: true, index};
      }

      response = await openRepostModal(page, secondDiv, index, attempts > 1)

      if (response?.success) {
        // console.log('url', page?.url())
        const modalResponse = await repostModal(page, index)

        if (!modalResponse?.success && modalResponse?.details?.includes('Waiting for selector'))  {
          attempts++
          throw new Error(`Waiting for selector error - ${index}`);
        }

        return modalResponse;
      } 
      // return response
      throw new Error(`open modal error - ${response?.details} - ${index}`);
    },3,3000)
  } catch (error) {
    errorHandler('repost error', error)
    return response;
  }
}

// export async function repost(page, secondDiv, index) {
//   try {
//     const status = await isReposted(page,secondDiv, index);

//     // console.log({alreadyReposted})
//     if (status?.success && status?.isReposted) return { success: true, details: 'repost button already clicked', isClicked: true, index}
//     await delay(getRandomDelay());
  
//     let response = await openRepostModal(page, secondDiv, index)

//    if (response.success) {
//     return await retry(async () => {
//       //check in we are in the post page
//       const back = await backToFollowingPage(page, 'repostModal')
//       if (!back?.success) {
//         console.log('repostModal in the post page - try to come back')

//         throw new Error(`post not in the following page - ${index}`);
//       } else if (back?.success && back?.isPost) {
//         console.log('try open again')
//         response = await openRepostModal(page, secondDiv, index, true)
//         console.log('try open again', response)
//       }
//       // console.log('url', page?.url())
//       const modalResponse = await repostModal(page, index)

//       if (!modalResponse?.success && modalResponse?.details?.includes('Waiting for selector'))  {
//         throw new Error(`Waiting for selector error - ${index}`);
//       }

//       return modalResponse;
//     },3,3000)
//    }

//    return response;
//   } catch (error) {
//     errorHandler('repost error', error)
//   }
// }

async function repostModal(page, index) {
  try {
    // Wait for any modal to appear
    await page.waitForSelector(selectors.openedModal, {
      visible: true,
    });
    await delay(delays.openModal)
    // Get all modals matching the selector
    const modal = await page.$(selectors.openedModal);

    if (modal) {
      // const response = await modal.evaluate(b => ({className: b?.children[0]?.className, className2: b?.className, tagName: b?.tagName}));
      // console.log('visible modal', response) 
      // const response = await modal.evaluate(b => b.click()); 
      await modal.click()
      await delay(delays.openModal)
      return { success: true, details: 'modal - repost button clicked', index };
    }

    return { success: false, details: 'No visible modal found', index };
  } catch (error) {
    errorHandler('repostModal error', error.message)
    return { success: false, details: error.message, index };
  }
}

async function isReposted(page, secondDiv, index) {
  if (!secondDiv) return false
  // Check both path elements inside the SVG
  const response = await page.evaluate((container, index) => {
    try {
      const postElement = container.children[0]?.children[0]?.children[1]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.children[0]?.children[3]?.children[0]?.children[0]?.children[index];
      const isViolentContent = postElement?.children[0]?.children[0].hasAttribute('data-interactive-id')
      if (isViolentContent) return { success: false, details: `repost this is violent content`, index};
      const fourthChildIndex = postElement?.children[0]?.children[0]?.children[0]?.children?.length - 1;
      const seventhChildIndex = postElement?.children[0]?.children[0]?.children[0]?.children[fourthChildIndex]?.children[2]?.children[0]?.children?.length - 1;
      const twelfthChildIndex = postElement?.children[0]?.children[0]?.children[0]?.children[fourthChildIndex]?.children[2]?.children[0]?.children[seventhChildIndex]?.children[0]?.children[2]?.children[0]?.children[0]?.children?.length - 1
      const element = postElement?.children[0]?.children[0]?.children[0]?.children[fourthChildIndex]?.children[2]?.children[0]?.children[seventhChildIndex]?.children[0]?.children[2]?.children[0]?.children[0]?.children[twelfthChildIndex]?.children[0]
      if (element?.tagName !== 'svg') return {success: false, details: 'isReposted svg element not found'}
      const paths = element?.querySelectorAll('path');
      // Return an array of 'd' attributes of both path elements 
      // reposted svg has such d="m11.733 7.2-3.6 3.6L6.27 8.937"s
      // return Array.from(paths).map(path => path.getAttribute('d'));
      return {success: true, tagName: element?.tagName, className: element?.className, twelfthChildIndex, paths: Array.from(paths).map(path => path.getAttribute('d'))}
    } catch (error) {
      return {success: false, error: error?.message || 'find svg path error'}
    }
  }, secondDiv, index);

  if (!response?.success) {
    errorHandler('isReposted error', response)
    return response
  }

  // Check if the second path has the reposted state
  const secondPathD = response?.paths[1];
  const repostedPath = selectors.repostedPath;
  // If the second path matches the reposted state, skip clicking
  if (secondPathD === repostedPath) {
    return {success: true, details: '', isReposted: true}
  }

  return  {success: true, details: '', isReposted: false}
}
