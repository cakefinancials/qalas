/*global chrome*/
/**
 * Converts asynchronous chrome api based callbacks to promises
 *
 * @param {function} fn
 * @param {arguments} arguments to function
 * @returns {Promise} Pending promise returned by function
 */
const promisify = function(fn) {
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

const promisifyChromeFn = chromeFn => (...args) => promisify(chromeFn, ...args);

module.exports = {
  tabs: {
    query: promisifyChromeFn(chrome.tabs.query),
    captureVisibleTab: promisifyChromeFn(chrome.tabs.captureVisibleTab),
    sendMessage: promisifyChromeFn(chrome.tabs.sendMessage)
  },
  identity: {
    launchWebAuthFlow: promisifyChromeFn(chrome.identity.launchWebAuthFlow)
  },
  storage: {
    sync: {
      set: promisifyChromeFn(chrome.storage.sync.set),
      get: promisifyChromeFn(chrome.storage.sync.get)
    }
  }
};
