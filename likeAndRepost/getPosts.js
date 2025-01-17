import { selectors } from '../constant.js';
import {errorHandler} from '../errorHandler.js'

export async function getPosts(page, secondDiv, lastIndex) {
  try {
    return page.evaluate((container, last, selectors) => {
      const postElements = [];
      try {
        // const postsContainer = container.children[0]?.children[0]?.children[1]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.children[0]?.children[3]?.children[0]?.children[0];
        let postsContainer = container;

        for (const index of selectors) {
          postsContainer = postsContainer?.children[index]
          if (!postsContainer) {
            postsContainer = null
            break;
          }
        }

        if (postsContainer) {
          const totalPosts = postsContainer.children.length;
          //last + 3 - 3 posts at once
          // for (let i = last; i < last + 3 && i < totalPosts; i++) {
          //   const child = postsContainer.children[i];
          //   if (child.className) {
          //     postElements.push({
          //       tagName: child.tagName,
          //       id: child.id,
          //       className: child.className,
          //       index: i,
          //       // index:  Array.from(postsContainer.children).indexOf(child),
          //     });
          //   }
          // }
          for (let i = last; i < totalPosts; i++) {
            const child = postsContainer.children[i];
            if (child.className) {
              postElements.push({
                tagName: child.tagName,
                id: child.id,
                className: child.className,
                index: i,
                // index:  Array.from(postsContainer.children).indexOf(child),
              });
            }
          }
        } else {
          return { success: false, details: 'no posts found' };
        }
      } catch (error) {
        return { success: false, details: 'posts container not found' };
      }
      return postElements;
    }, secondDiv, lastIndex, selectors.postsContainer);
  } catch (error) {
    errorHandler('getPosts error', error)
  }
}
