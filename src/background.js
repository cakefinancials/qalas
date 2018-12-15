/*global chrome*/
import axios from 'axios';
import queryString from 'query-string';
import Slack from 'slack';

import chromep from './helpers/chrome_promisify';
import Base64Binary from './helpers/base_64_binary';
import { CHROME_MESSAGES } from './helpers/constants';

// Called when the user clicks on the browser action
chrome.browserAction.onClicked.addListener(async function() {
  // Send a message to the active tab
  const tabs = await chromep.tabs.query({ active: true, currentWindow: true });
  var activeTab = tabs[0];
  await chromep.tabs.sendMessage(activeTab.id, { message: CHROME_MESSAGES.TOGGLE_EXTENSION });
});

const CLIENT_SECRET_WTF_GET_RID_OF_ME_AND_REGENERATE_ME = 'da6995227c760f14692be1507fe2347e';
const client_id = '319498398531.504510603634';
const originalRedirectUri = chrome.identity.getRedirectURL();

const SCOPES = [
  'channels:history',
  'channels:read',
  'chat:write:user',
  'users:read',
  'files:write:user'
].join(', ');

chrome.extension.onMessage.addListener(async function(request) {
  if (request.message === CHROME_MESSAGES.SEND_OVER_SCREENSHOTS) {
    const dataUri = await chromep.tabs.captureVisibleTab(undefined, undefined);

    const tabs = await chromep.tabs.query({ active: true, currentWindow: true });
    var activeTab = tabs[0];
    await chromep.tabs.sendMessage(activeTab.id, {
      message: CHROME_MESSAGES.HERE_IS_YOUR_SCREENSHOT,
      dataUri
    });
  }

  if (request.message === CHROME_MESSAGES.LAUNCH_OAUTH) {
    const auth_url =
            'https://slack.com/oauth/authorize?client_id=' +
            client_id +
            '&redirect_uri=' +
            originalRedirectUri +
            '&scope=' +
            SCOPES +
            '&response_type=token';

    const redirectUri = await chromep.identity.launchWebAuthFlow({
      url: auth_url,
      interactive: true
    });

    const {
      query: { code }
    } = queryString.parseUrl(redirectUri);

    const response = await axios.get('https://slack.com/api/oauth.access', {
      params: {
        client_id,
        client_secret: CLIENT_SECRET_WTF_GET_RID_OF_ME_AND_REGENERATE_ME,
        code,
        redirect_uri: originalRedirectUri
      }
    });

    console.log({ response });

    await chromep.storage.sync.set({ slackAccessToken: response.data.access_token });
    const tabs = await chromep.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    await chromep.tabs.sendMessage(activeTab.id, {
      message: CHROME_MESSAGES.SLACK_ACCESS_TOKEN_UPDATE
    });
  }

  if (request.message === CHROME_MESSAGES.SEND_DATA_URI_TO_SLACK) {
    const { slackAccessToken } = await chromep.storage.sync.get([ 'slackAccessToken' ]);
    const slackClient = new Slack({ token: slackAccessToken });
    const channels = await slackClient.channels.list();
    console.log({ channels });

    const dataUri = await chromep.tabs.captureVisibleTab(undefined, undefined);
    const file = Base64Binary.generateJPEGFileFromDataURI({
      dataUri,
      filename: 'suckit.jpg'
    });

    // put file into form data
    const data = new FormData();
    data.append('file', file, file.name);
    data.append('token', slackAccessToken);
    data.append('channels', 'CETGHT2TV');

    // now upload
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' }
    };
    await axios.post('https://slack.com/api/files.upload', data, config);
  }
});
