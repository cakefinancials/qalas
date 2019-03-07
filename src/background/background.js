/*global chrome*/
import { chromep } from '../helpers/chrome_promisify';
import { arrayBufferToData } from '../helpers/array_buffer_to_data';
import { CHROME_MESSAGES } from '../helpers/constants';
import { getRequestsManager } from './requests_manager';

const APP_STATE = { urlFilter: '' };

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
      data: { existingRequests: requestsManager.getAllRequests() },
      tabId: activeTab.id
    });
  }

  await sendMessageToActiveTab({
    message: CHROME_MESSAGES.TOGGLE_EXTENSION,
    data: { open: tabsWithExtensionOpen.has(activeTab.id) }
  });
});

const requestsManager = getRequestsManager();
requestsManager.addFullRequestReceivedListener(async ({ request }) => {
  await sendMessageToAllTabsWithExtensionOpen({
    message: CHROME_MESSAGES.RECEIVED_REQUEST,
    data: { request }
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

const sendMessageToAllTabsWithExtensionOpen = async ({ message, data }) => {
  return await Promise.all(
    [ ...tabsWithExtensionOpen.values() ].map(tabId => sendMessageToTab({ message, data, tabId }))
  );
};

chrome.extension.onMessage.addListener(async function(
  { fromContentScript, message, data },
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
      data: { existingRequests: requestsManager.getAllRequests() },
      tabId
    });
  } else if (message === CHROME_MESSAGES.REQUESTING_APP_STATE) {
    await sendMessageToTab({
      message: CHROME_MESSAGES.ANSWERING_APP_STATE,
      data: { APP_STATE },
      tabId
    });
  } else if (message === CHROME_MESSAGES.UPDATE_APP_STATE) {
    Object.assign(APP_STATE, data.APP_STATE);
    return await Promise.all(
      [ ...tabsWithExtensionOpen.values() ]
        .filter(openTabId => openTabId !== tabId)
        .map(otherTabId =>
          sendMessageToTab({
            message: CHROME_MESSAGES.ANSWERING_APP_STATE,
            data: { APP_STATE },
            tabId: otherTabId
          })
        )
    );
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    let parsedBody = null;
    if (details && details.type === 'xmlhttprequest') {
      try {
        parsedBody = arrayBufferToData.toJSON(details.requestBody.raw[0].bytes);
      } catch (e) {
        // do nothing
      }
    }

    Object.assign(details, { parsedBody });

    requestsManager.registerRequestReceived({ requestDetails: details });
  },
  { urls: [ '<all_urls>' ] },
  [ 'requestBody' ]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    requestsManager.registerHeaderReceived({ headerDetails: details });
  },
  { urls: [ '<all_urls>' ] },
  [ 'requestHeaders', 'extraHeaders' ]
);
