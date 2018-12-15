/*global chrome*/
import axios from 'axios';
import queryString from 'query-string';
import Slack from 'slack';

// Called when the user clicks on the browser action
chrome.browserAction.onClicked.addListener(function() {
  // Send a message to the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { message: 'clicked_browser_action' });
  });
});

const CLIENT_SECRET_WTF_GET_RID_OF_ME = 'da6995227c760f14692be1507fe2347e';
const client_id = '319498398531.504510603634';
const originalRedirectUri = chrome.identity.getRedirectURL();

const SCOPES = [
  'channels:history',
  'channels:read',
  'chat:write:user',
  'users:read',
  'files:write:user'
].join(', ');

chrome.extension.onMessage.addListener(function(request) {
  if (request.action === 'launchOauth') {
    const auth_url =
            'https://slack.com/oauth/authorize?client_id=' +
            client_id +
            '&redirect_uri=' +
            originalRedirectUri +
            '&scope=' +
            SCOPES +
            '&response_type=token';

    chrome.identity.launchWebAuthFlow(
      {
        url: auth_url,
        interactive: true
      },
      async function(redirectUri) {
        const {
          query: { code }
        } = queryString.parseUrl(redirectUri);

        const response = await axios.get('https://slack.com/api/oauth.access', {
          params: {
            client_id,
            client_secret: CLIENT_SECRET_WTF_GET_RID_OF_ME,
            code,
            redirect_uri: originalRedirectUri
          }
        });

        console.log({ response });

        const slackClient = new Slack({ token: response.data.access_token });
        const channels = await slackClient.channels.list();
        console.log({ channels });

        const dataUri =
                    'data:image/jpeg;base64,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';

        const file = new File(
          [ Base64Binary.decodeArrayBuffer(dataUri.split(',')[1]) ],
          'suckit.jpg',
          {
            type: 'image/jpeg'
          }
        );

        // put file into form data
        const data = new FormData();
        data.append('file', file, file.name);
        data.append('token', response.data.access_token);
        data.append('channels', 'CETGHT2TV');

        // now upload
        const config = {
          headers: { 'Content-Type': 'multipart/form-data' }
        };
        console.log({ file, data });
        const upload = await axios.post(
          'https://slack.com/api/files.upload',
          data,
          config
        );

        console.log({ upload });
      }
    );
  }
});

var Base64Binary = {
  _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

  /* will return a  Uint8Array type */
  decodeArrayBuffer: function(input) {
    var bytes = (input.length / 4) * 3;
    var ab = new ArrayBuffer(bytes);
    this.decode(input, ab);

    return ab;
  },

  removePaddingChars: function(input) {
    var lkey = this._keyStr.indexOf(input.charAt(input.length - 1));
    if (lkey == 64) {
      return input.substring(0, input.length - 1);
    }
    return input;
  },

  decode: function(input, arrayBuffer) {
    //get last chars to see if are valid
    input = this.removePaddingChars(input);
    input = this.removePaddingChars(input);

    var bytes = parseInt((input.length / 4) * 3, 10);

    var uarray;
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    var j = 0;

    if (arrayBuffer) {
      uarray = new Uint8Array(arrayBuffer);
    } else {
      uarray = new Uint8Array(bytes);
    }

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

    for (i = 0; i < bytes; i += 3) {
      //get the 3 octects in 4 ascii chars
      enc1 = this._keyStr.indexOf(input.charAt(j++));
      enc2 = this._keyStr.indexOf(input.charAt(j++));
      enc3 = this._keyStr.indexOf(input.charAt(j++));
      enc4 = this._keyStr.indexOf(input.charAt(j++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      uarray[i] = chr1;
      if (enc3 != 64) {
        uarray[i + 1] = chr2;
      }
      if (enc4 != 64) {
        uarray[i + 2] = chr3;
      }
    }

    return uarray;
  }
};
