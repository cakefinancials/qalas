/* src/content.js */
/*global chrome*/
import React from 'react';
import ReactDOM from 'react-dom';
import '../App.css';
import './content.css';
import * as R from 'ramda';

import { CHROME_MESSAGES } from '../helpers/constants';
import { Main } from './components/main';

if (window.parent === window) {
  let iframeContainer = document.createElement('iframe');
  iframeContainer.id = 'my-extension-root';
  Object.assign(iframeContainer.style, {
    display: 'none',
    height: '50%',
    position: 'fixed',
    top: '0px',
    right: '0px',
    zIndex: '2147483647',
    backgroundColor: 'white',
    marginTop: '10px',
    marginRight: '10px',
    boxShadow: 'none',
    borderRadius: '10px',
    width: '350px',
    border: 'none'
  });
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

  window.addEventListener(
    'message',
    ({ data: { fromChild, message, data } = { fromChild: false } }) => {
      if (!fromChild) {
        return;
      }

      chrome.runtime.sendMessage({ fromContentScript: true, message, data }, () => {
        if (chrome.runtime.lastError) {
          // need to check lastError
        }
      });
    },
    false
  );

  chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    sendResponse();
    if (
      request.message === CHROME_MESSAGES.TOGGLE_EXTENSION ||
            request.message === CHROME_MESSAGES.ANSWERING_OPEN_STATUS
    ) {
      toggle({ open: request.data.open });
    } else {
      iframeContainer.contentWindow.postMessage(R.merge(request, { fromParent: true }));
    }
  });

  chrome.runtime.sendMessage(
    { fromContentScript: true, message: CHROME_MESSAGES.REQUESTING_OPEN_STATUS },
    () => {
      if (chrome.runtime.lastError) {
        // need to check lastError
      }
    }
  );
} else {
  const app = document.createElement('div');
  app.id = 'my-extension-root';
  document.body.appendChild(app);
  ReactDOM.render(<Main />, app);
}
