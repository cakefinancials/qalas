/* src/content.js */
/*global chrome*/
import React from 'react';
import ReactDOM from 'react-dom';
import '../App.css';
import './content.css';
import * as R from 'ramda';

import { CHROME_MESSAGES } from '../helpers/constants';
//import { chromep } from '../helpers/chrome_promisify';
import { config } from './config';
import { JsonViewer } from './json_viewer';

const {
  stateManager: { container: stateManagerContainer }
} = config;

const sendMessageToParent = ({ message, data }) => {
  window.parent.postMessage({
    fromChild: true,
    message,
    data
  });
};

const Main = stateManagerContainer.withStateManagers({
  stateManagerNames: [],
  WrappedComponent: class Main extends React.Component {
    constructor(props) {
      super(props);
    }

    componentDidMount() {
      window.addEventListener(
        'message',
        ({ data: { fromParent, message, data } = { fromChild: false } }) => {
          if (!fromParent) {
            return;
          }
          console.log('GOT MESSAGE FROM PARENT', message, data);
        }
      );

      console.log('SENDING MESSAGE TO PARENT');
      sendMessageToParent({ message: 'HELLO THERE', data: { suck: 'it' } });
    }

    render() {
      return (
        <div className={'my-extension'}>
          <JsonViewer />
          <h1>Hello world - My first Extension sucks!!!!!</h1>
        </div>
      );
    }
  }
});

if (window.parent === window) {
  let iframeContainer = document.createElement('iframe');
  iframeContainer.id = 'my-extension-root';
  iframeContainer.style.display = 'none';
  document.body.appendChild(iframeContainer);
  iframeContainer = document.getElementById('my-extension-root');

  const iframeHead = iframeContainer.contentDocument.getElementsByTagName('head')[0];
  const contentCSSLink = document.createElement('link');
  contentCSSLink.href = chrome.extension.getURL('/static/css/content.css');
  contentCSSLink.rel = 'stylesheet';
  contentCSSLink.type = 'text/css';
  iframeHead.appendChild(contentCSSLink);
  const chunkCSSLink = document.createElement('link');
  chunkCSSLink.href = chrome.extension.getURL('/static/css/0.chunk.css');
  chunkCSSLink.rel = 'stylesheet';
  chunkCSSLink.type = 'text/css';
  iframeHead.appendChild(chunkCSSLink);
  const chunkScript = document.createElement('script');
  chunkScript.src = chrome.extension.getURL('/static/js/0.chunk.js');
  iframeHead.appendChild(chunkScript);
  const contentScript = document.createElement('script');
  contentScript.src = chrome.extension.getURL('/static/js/content.js');
  iframeHead.appendChild(contentScript);

  const toggle = ({ open }) => {
    iframeContainer.style.display = open ? 'block' : 'none';
  };

  chrome.runtime.sendMessage(
    { fromContentScript: true, message: CHROME_MESSAGES.REQUESTING_TOGGLE_POSITION },
    function(response) {
      if (chrome.runtime.lastError) {
        // need to check lastError
        console.log('RESPONSE FROM BACKGROUND', response, chrome.runtime.lastError);
      } else {
        toggle({ open: response.open });
      }
    }
  );

  window.addEventListener(
    'message',
    ({ data: { fromChild, message, data } = { fromChild: false } }) => {
      if (!fromChild) {
        return;
      }

      chrome.runtime.sendMessage({ fromContentScript: true, message, data }, function(
        response
      ) {
        if (chrome.runtime.lastError) {
          // need to check lastError
          console.log('RESPONSE FROM BACKGROUND', response, chrome.runtime.lastError);
        }
      });
    },
    false
  );

  chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request.message === CHROME_MESSAGES.TOGGLE_EXTENSION) {
      toggle({ open: request.data.open });
    } else {
      console.log(
        'SENDING MESSAGE FROM BACKGROUND TO IFRAME',
        request,
        R.pathOr('N/A', [ 'data', 'details', 'requestId' ], request)
      );
      iframeContainer.contentWindow.postMessage(R.merge(request, { fromParent: true }));
    }

    sendResponse();
  });
} else {
  const app = document.createElement('div');
  app.id = 'my-extension-root';
  document.body.appendChild(app);
  ReactDOM.render(<Main />, app);
}
