/*global chrome*/
import * as R from 'ramda';

/**
 * Converts asynchronous chrome api based callbacks to promises
 *
 * @param {function} fn
 * @param {arguments} arguments to function
 * @returns {Promise} Pending promise returned by function
 */
const promisify = function(chromeFnPath) {
  const fn = R.path(chromeFnPath, chrome);
  if (fn === undefined) {
    return Promise.reject('NOT A VALID CHROME FUNCTION IS THIS CONTEXT');
  }

  const args = Array.prototype.slice.call(arguments).slice(1);
  return new Promise(function(resolve, reject) {
    fn.apply(
      null,
      args.concat(function(res) {
        console.log(chrome.runtime.lastError);
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        return resolve(res);
      })
    );
  });
};

const promisifyChromeFn = chromeFnPath => (...args) => promisify(chromeFnPath, ...args);

export const chromep = {
  tabs: {
    query: promisifyChromeFn([ 'tabs', 'query' ]),
    captureVisibleTab: promisifyChromeFn([ 'tabs', 'captureVisibleTab' ]),
    sendMessage: promisifyChromeFn([ 'tabs', 'sendMessage' ])
  },
  identity: {
    launchWebAuthFlow: promisifyChromeFn([ 'identity', 'launchWebAuthFlow' ])
  },
  storage: {
    sync: {
      set: promisifyChromeFn([ 'storage', 'sync', 'set' ]),
      get: promisifyChromeFn([ 'storage', 'sync', 'get' ])
    }
  }
};
