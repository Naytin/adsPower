export const instagram = 'https://www.instagram.com/';
export const threads = 'https://www.threads.net/';

export const selectors = {
  repostedPath: 'm11.733 7.2-3.6 3.6L6.27 8.937',
  // openedModal: 'div[role="menu"] svg[aria-label="Repost"]',
  liked: 'x1lliihq x2lah0s x1f5funs x1n2onr6 x1bl4301 x18l41xo x117rol3 x73je2i x1pvypsb',
  openedModal: 'div[role="menu"] svg[role="img"]',
  postsLoading: '[data-visualcompletion="loading-state"]',
  threadsOpenedModal: 'div[role="menu"]',
  threadsLoginButton: 'a[href^="/login/"]',
  threadsLoginWithInstagram: 'div:has(header)',
  threadsConfirmLogin: '[role="button"]',
  threadsPage: '[href="/"]',
  instagramLoggedIn: '[aria-label="Notifications"]',
  instagramLoginForm: '#loginForm',

  //posts
  postsContainer: [0,0,1,1,0,0,0,0,0,0,0,1,0,3,0,0],
  postBackButton: [0,0,1,1,0,0,0,1,0,0,0,0,3,0,0,0,0],
  likeAttributes: ['Like', 'Подобається']
}

export const delays = {
  redirectToFollowing: 2000,
  openModal: 2000,
  newPostLoaded: 4000,
  waitThreadsLogin: 3000,
  waitIsThreadsLoggedIn: 3000,
  waitAfterLogIn: 10000,
  waitForm: 5000,
  afterReload: 10000,
  interval: 5 * 60 * 1000, //every 5 minutes
  checkNewBrowsersInterval: 10 * 60 * 1000
}
