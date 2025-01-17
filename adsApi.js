import dotenv from 'dotenv'

dotenv.config();

import { errorHandler } from './errorHandler.js';
import { delay } from './helpers.js';

const local = process.env.LOCAL_API_URL || 'http://local.adspower.com:50325/';

const requests = {
  profileList: 'api/v1/user/list',
  start: 'api/v1/browser/start',
  activeBrowsers: 'api/v1/browser/local-active',
  group: 'api/v1/group/list',
  stopBrowser: 'api/v1/browser/stop',
};

const apiQueue = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || apiQueue.length === 0) return;

  isProcessingQueue = true;

  while (apiQueue.length > 0) {
    const { request, resolve, reject } = apiQueue.shift();

    try {
      const result = await request();
      resolve(result);
    } catch (error) {
      reject(error);
    }

    await delay(1000)
  }

  isProcessingQueue = false;
}

// A helper function to add requests to the queue
function addToQueue(request) {
  return new Promise((resolve, reject) => {
    apiQueue.push({ request, resolve, reject });
    processQueue();
  });
}

// Updated API object with rate-limiting via the queue
export const api = {
  activeBrowsers: function () {
    return addToQueue(async () => {
      const rawBrowsers = await fetch(local + requests.activeBrowsers);
      if (rawBrowsers.status === 200) {
        const active = await rawBrowsers.json();
        return active?.data?.list || [];
      } else {
        errorHandler('activeBrowsers error', rawBrowsers);
        throw new Error('Failed to fetch active browsers');
      }
    });
  },
  profile: function (user_id) {
    return addToQueue(async () => {
      const rawBrowsers = await fetch(`${local}${requests.profileList}?user_id=${user_id}`);
      if (rawBrowsers.status === 200) {
        const active = await rawBrowsers.json();
        return active?.data?.list || [];
      } else {
        errorHandler('profile error', rawBrowsers);
        throw new Error('Failed to fetch profile');
      }
    });
  },
  openBrowser: function (user_id) {
    return addToQueue(async () => {
      const rawBrowsers = await fetch(`${local}${requests.start}?user_id=${user_id}`);
      if (rawBrowsers.status === 200) {
        const active = await rawBrowsers.json();
        return active?.data?.ws?.puppeteer || null;
      } else {
        errorHandler('openBrowser error', rawBrowsers);
        throw new Error('Failed to open browser');
      }
    });
  },
  stopBrowser: function (user_id) {
    return addToQueue(async () => {
      const rawBrowsers = await fetch(`${local}${requests.stopBrowser}?user_id=${user_id}`);
      if (rawBrowsers.status === 200) {
        const active = await rawBrowsers.json();
        return active?.code;
      } else {
        errorHandler('stopBrowser error', rawBrowsers);
        throw new Error('Failed to stop browser');
      }
    });
  },
  profiles: function () {
    return addToQueue(async () => {
      const rawBrowsers = await fetch(`${local}${requests.profileList}?group_id=0`);
      if (rawBrowsers.status === 200) {
        const active = await rawBrowsers.json();
        return active?.data?.list || [];
      } else {
        errorHandler('profiles error', rawBrowsers);
        throw new Error('Failed to fetch profiles');
      }
    });
  },
  group: function () {
    return addToQueue(async () => {
      const rawBrowsers = await fetch(`${local}${requests.group}`);
      if (rawBrowsers.status === 200) {
        const active = await rawBrowsers.json();
        return active?.data?.list[0] || {};
      } else {
        errorHandler('group error', rawBrowsers);
        throw new Error('Failed to fetch group');
      }
    });
  },
};
