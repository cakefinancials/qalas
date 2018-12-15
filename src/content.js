/* src/content.js */
/*global chrome*/
import React from 'react';
import ReactDOM from 'react-dom';
import './content.css';

class Main extends React.Component {
  render() {
    return (
      <div className={'my-extension'}>
        <h1>Hello world - My first Extension suck !!!!!</h1>
        <button
          onClick={() =>
            chrome.extension.sendMessage({
              action: 'launchOauth'
            })
          }
        >
                    SIGN IN TO SLACK
        </button>
      </div>
    );
  }
}

const app = document.createElement('div');
app.id = 'my-extension-root';
document.body.appendChild(app);
ReactDOM.render(<Main />, app);

app.style.display = 'none';
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message === 'clicked_browser_action') {
    toggle();
  }

  console.log({ request, sender, sendResponse });
});

function toggle() {
  if (app.style.display === 'none') {
    app.style.display = 'block';
  } else {
    app.style.display = 'none';
  }
}
