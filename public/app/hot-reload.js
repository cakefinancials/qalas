/*global chrome*/
const getReloadMeFile = dir =>
  new Promise(resolve =>
    dir.createReader().readEntries(entries =>
      Promise.all(
        entries
          .filter(e => {
            return e.name === 'reload.me';
          })
          .map(e => new Promise(resolve => e.file(resolve)))
      )
        .then(files => [].concat(...files))
        .then(resolve)
    )
  );

const timestampForReloadMeFile = dir =>
  getReloadMeFile(dir).then(files => files.map(f => f.lastModifiedDate).join());

const reload = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    // NB: see https://github.com/xpl/crx-hotreload/issues/5

    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }

    chrome.runtime.reload();
  });
};

let lastTimestamp = '';

const watchReloadMeChanges = dir => {
  timestampForReloadMeFile(dir).then(timestamp => {
    if (lastTimestamp === '' && timestamp !== '') {
      lastTimestamp = timestamp;
    }

    if (lastTimestamp === timestamp || timestamp === '') {
      setTimeout(() => watchReloadMeChanges(dir), 1000); // retry after 1s
    } else {
      reload();
    }
  });
};

chrome.management.getSelf(self => {
  if (self.installType === 'development') {
    chrome.runtime.getPackageDirectoryEntry(dir => watchReloadMeChanges(dir));
  }
});
