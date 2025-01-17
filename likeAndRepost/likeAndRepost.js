import { delays, selectors } from '../constant.js';
import {errorHandler} from '../errorHandler.js'
import { delay, retry } from '../helpers.js';
import {reloadAndTryToGoToFollowingPage} from '../login/threadsLogin.js'
import {scrollIntoView} from './scrollPostIntoView.js'
import {like} from './likePost.js'
import {repost} from './repostPost.js'
import {getPosts} from './getPosts.js'

async function tryToLikeAndRepostAgain(page, secondDiv, notFound) {
  try {
    for (let index of notFound?.like) { 
      //scroll to post to avoid empty post and error
      await scrollIntoView(page, secondDiv, index)
      const container = await like(page,secondDiv,index)
      console.log('try like again', container);
    }

    for (let index of notFound?.repost) { 
      //scroll to post to avoid empty post and error
      await scrollIntoView(page, secondDiv, index)
      const repostRepopnse = await repost(page,secondDiv, index)
      console.log('try again repostRepopnse', repostRepopnse)
    }
  } catch (error) {
    errorHandler('tryToLikeAndRepostAgain error', error)
  }
}


async function likeAndRepost(page, user_id) {
  try {
    // console.log(`Starting likeAndRepost for user: ${user_id}`);

    let isEndOfPosts = false;
    let stopReposting = false;
    let maxScrollDown = 0
    let notFound = {
      like: [],
      repost: []
    }
    let stopLiking = false;
    let lastIndex = 0
    let need = {
      needToLike: 0,
      needToRepost: 0,
      allPosts: 0,
      allUnlike: 0,
      foundPosts: 0,
      user_id
    }

    const bodyDivs = await page.$$('body > div');
    const secondDiv = bodyDivs[1]; // The target container
    bodyDivs.length = 0; // Clear unused references


    while (!isEndOfPosts) {
      // Evaluate the posts container by traversing the nested structure
      const posts = await retry(async () => {
        const posts = await getPosts(page,secondDiv,lastIndex)
        if (posts?.length === undefined) {
          console.log('posts is undefined retry...', posts)
          throw new Error(`posts is undefined`);
        }

        return posts;
      },5, 3000)
      //increment scrolls, to 75 cycles and stop
      if (posts?.length === 0) {
        maxScrollDown++;
      } else {
        maxScrollDown = 0;
      }
      
      console.log(`Found ${posts?.length} posts. last index ${lastIndex}`);
      //if there are 75 cycles that means the script tried to scroll down about 3 minutes and no posts loaded
      if (maxScrollDown > 75) {
        isEndOfPosts = true
        stopLiking = true
        stopReposting = true
        break;  
      }
      // Perform actions (like and repost) on each post
      await delay(delays.newPostLoaded);
      for (let post of posts) {
        need.allPosts++;
    
        //scroll to post to avoid empty post and error
        await scrollIntoView(page, secondDiv, post?.index)
        console.log(`Interacting with post  - index - ${post?.index} (Tag: ${post.tagName}, ID: ${post.id}, className: ${post.className}), user - ${user_id}`);
        const container = await like(page,secondDiv,post?.index)
        // console.log('container', container, user_id);

        if (container?.success) {
          if (container?.isLike) need.needToLike++
          if (container?.isLike === false) {
            need.allUnlike++
            stopLiking = true
          }
        } else if (container?.index) {
          console.log('container is not success', container, user_id);
          notFound.like.push(container?.index)
        } else {
          console.log('container error', container, user_id);
        }

        const repostRepopnse = await repost(page,secondDiv,post?.index)
        // console.log('repostRepopnse', repostRepopnse, user_id)

        if (repostRepopnse?.success) {
          if (!repostRepopnse?.isClicked) need.needToRepost++
        } else if (repostRepopnse?.reload)  {
          console.log('need reload', repostRepopnse)
          //add the previous post
          lastIndex = repostRepopnse?.index > 0 ? repostRepopnse?.index - 1 : repostRepopnse?.index
          //reload and go to following page
          const result = await reloadAndTryToGoToFollowingPage(page, user_id)
          console.log(result)
        }  else if (repostRepopnse?.index) {
          console.log('repostRepopnse is not success', repostRepopnse, user_id)
          notFound.repost.push(repostRepopnse?.index)
        } else {
          console.log('repostRepopnse error', repostRepopnse, user_id)
        }
      }

      //check is there loading container and stop scrolling
      if (posts?.length === 0) {
        const isLoading = await page.$(selectors.postsLoading);

        if (isLoading === null) {
          stopLiking = true
          stopReposting = true
          isEndOfPosts = true
        }
      }

      // Scroll to load more posts
      if (!stopLiking) {
        lastIndex += posts?.length || 0
        
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);  // Scroll down by one viewport height
        });
  
        // Wait for a moment for new posts to load
        await delay(delays.newPostLoaded);
      } else {
        isEndOfPosts = true;
      }
    }
    //check if there are not liked or not reposted posts and try it to like/repost
    await tryToLikeAndRepostAgain(page, secondDiv, notFound)

    console.log(`Processed ${need.allPosts} posts., liked - ${need?.needToLike}, reposted - ${need?.needToRepost}, user - ${user_id}`);
    // console.log({...need, stopLiking, lastIndex});
    // console.log({notFound});
    return { success: true, postsProcessed: need.allPosts};
  } catch (error) {
    errorHandler('likeAndRepost error:', error.message);
    errorHandler('likeAndRepost error:', error);
    return { success: false, error: error.message };
  }
}

export async function likeAndRepostMain(page, user_id) {
  if (!page || !page?.url()?.includes('/following'))  {
    //reload the page and try to go to following page again
    const result = await reloadAndTryToGoToFollowingPage(page, user_id)
    if (!result) return {isError: true}
  };

  // if (user_id !== 'ks8s1e6') return
  return await likeAndRepost(page, user_id)
}