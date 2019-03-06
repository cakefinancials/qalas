/*global chrome*/
import { chromep } from '../helpers/chrome_promisify';
import { arrayBufferToData } from '../helpers/array_buffer_to_data';
import { CHROME_MESSAGES } from '../helpers/constants';
import { getRequestsManager } from './requests_manager';

// Called when the user clicks on the browser action
const tabsWithExtensionOpen = new Set();
chrome.browserAction.onClicked.addListener(async function() {
  const tabs = await chromep.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (tabsWithExtensionOpen.has(activeTab.id)) {
    tabsWithExtensionOpen.delete(activeTab.id);
  } else {
    tabsWithExtensionOpen.add(activeTab.id);
    await sendMessageToTab({
      message: CHROME_MESSAGES.ANSWERING_EXISTING_REQUESTS,
      data: { existingRequests: requestsManager.getAllRequests({ tabId: activeTab.id }) },
      tabId: activeTab.id
    });
  }

  await sendMessageToActiveTab({
    message: CHROME_MESSAGES.TOGGLE_EXTENSION,
    data: { open: tabsWithExtensionOpen.has(activeTab.id) }
  });
});

const requestsManager = getRequestsManager();
requestsManager.addFullRequestReceivedListener(async ({ tabId, request }) => {
  await sendMessageToTab({ tabId, message: CHROME_MESSAGES.RECEIVED_REQUEST, data: { request } });
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
  { fromContentScript, message /*data*/},
  { tab: { id: tabId } },
  sendResponse
) {
  sendResponse();

  if (!fromContentScript) {
    // do nothing
  } else if (message === CHROME_MESSAGES.REQUESTING_OPEN_STATUS) {
    await sendMessageToTab({
      message: CHROME_MESSAGES.ANSWERING_OPEN_STATUS,
      data: { open: tabsWithExtensionOpen.has(tabId) },
      tabId
    });
  } else if (message === CHROME_MESSAGES.REQUESTING_EXISTING_REQUESTS) {
    await sendMessageToTab({
      message: CHROME_MESSAGES.ANSWERING_EXISTING_REQUESTS,
      data: { existingRequests: requestsManager.getAllRequests({ tabId }) },
      tabId
    });
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    const { tabId } = details;
    if (!tabsWithExtensionOpen.has(tabId)) {
      return;
    }

    let parsedBody = null;
    if (details && details.type === 'xmlhttprequest') {
      try {
        parsedBody = arrayBufferToData.toJSON(details.requestBody.raw[0].bytes);
      } catch (e) {
        // do nothing
      }
    }

    Object.assign(details, { parsedBody });

    requestsManager.registerRequestReceived({ tabId, requestDetails: details });
  },
  { urls: [ '<all_urls>' ] },
  [ 'requestBody' ]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    const { tabId } = details;
    if (!tabsWithExtensionOpen.has(details.tabId)) {
      return;
    }

    requestsManager.registerHeaderReceived({ tabId, headerDetails: details });
  },
  { urls: [ '<all_urls>' ] },
  [ 'requestHeaders', 'extraHeaders' ]
);
