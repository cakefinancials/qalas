/*global chrome*/
import { chromep } from '../helpers/chrome_promisify';
//import { arrayBufferToData } from '../helpers/array_buffer_to_data';
import { CHROME_MESSAGES } from '../helpers/constants';

// Called when the user clicks on the browser action
const tabsWithExtensionOpen = new Set();

chrome.browserAction.onClicked.addListener(async function() {
  // Send a message to the active tab
  const tabs = await chromep.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (tabsWithExtensionOpen.has(activeTab.id)) {
    tabsWithExtensionOpen.delete(activeTab.id);
    await sendMessageToActiveTab({ message: 'BYEEE', data: { suck: 'it' } }).catch(() => {});
  } else {
    tabsWithExtensionOpen.add(activeTab.id);
    await sendMessageToActiveTab({ message: 'HIIIIIII', data: { suck: 'it' } }).catch(() => {});
  }

  await sendMessageToActiveTab({
    message: CHROME_MESSAGES.TOGGLE_EXTENSION,
    data: { open: tabsWithExtensionOpen.has(activeTab.id) }
  });
});

// setting storage
// await chromep.storage.sync.set({ slackAccessToken: response.data.access_token });
const sendMessageToActiveTab = async ({ message, data }) => {
  const tabs = await chromep.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  return await sendMessageToTab({ tabId: activeTab.id, message, data });
};

const sendMessageToTab = async ({ message, data, tabId }) => {
  return await chromep.tabs.sendMessage(tabId, { message, data });
};

chrome.extension.onMessage.addListener(async function(
  { fromContentScript, message, data },
  sender,
  sendResponse
) {
  if (!fromContentScript) {
    return;
  }

  if (message === CHROME_MESSAGES.REQUESTING_TOGGLE_POSITION) {
    console.log('SENDER', sender);
    sendResponse({ open: tabsWithExtensionOpen.has(sender.tab.id) });
  }

  console.log('GOT DATA FROM CONTENT SCRIPTS', { message, data });
  sendResponse();
});

/*
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (!tabsWithExtensionOpen.has(details.tabId)) {
      return;
    }
    console.log('REQUEST', details.method, details.url, details.requestId, { details });

    let parsedBody = null;
    if (details && details.type === 'xmlhttprequest') {
      parsedBody = arrayBufferToData.toJSON(details.requestBody.raw[0].bytes);
      console.log(details.url, parsedBody);
    }

    sendMessageToTab({
      message: CHROME_MESSAGES.RECEIVED_REQUEST,
      data: { details },
      tabId: details.tabId,
      parsedBody
    });
  },
  { urls: [ '<all_urls>' ] },
  [ 'requestBody' ]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    if (!tabsWithExtensionOpen.has(details.tabId)) {
      return;
    }

    console.log('HEADERS', details.requestId, details.url, { details });
    sendMessageToTab({
      message: CHROME_MESSAGES.RECEIVED_HEADERS,
      data: { details },
      tabId: details.tabId
    });
  },
  { urls: [ '<all_urls>' ] },
  [ 'requestHeaders', 'extraHeaders' ]
);
*/
