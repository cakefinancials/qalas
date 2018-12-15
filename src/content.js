/* src/content.js */
/*global chrome*/
import React from 'react';
import ReactDOM from 'react-dom';
import './content.css';

import ImageEditor from 'tui-image-editor';
import Base64Binary from './helpers/base_64_binary';
import { CHROME_MESSAGES } from './helpers/constants';

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      slackAccessToken: undefined
    };
  }

  updateSlackAccessToken() {
    chrome.storage.sync.get([ 'slackAccessToken' ], ({ slackAccessToken }) => {
      this.setState({ slackAccessToken });
    });
  }

  componentWillUnmount() {
    chrome.runtime.onMessage.removeListener(this.slackAccessTokenListener);
  }

  componentDidMount() {
    const self = this;
    this.updateSlackAccessToken();
    this.slackAccessTokenListener = async function(request) {
      if (request.message === CHROME_MESSAGES.SLACK_ACCESS_TOKEN_UPDATE) {
        self.updateSlackAccessToken();
      }
    };
    chrome.runtime.onMessage.addListener(this.slackAccessTokenListener);
  }

  render() {
    return (
      <div className={'my-extension'}>
        <h1>Hello world - My first Extension suck !!!!!</h1>
        {this.state.slackAccessToken === undefined ? (
          <button
            onClick={() =>
              chrome.extension.sendMessage({
                message: CHROME_MESSAGES.LAUNCH_OAUTH
              })
            }
          >
                        SIGN IN TO SLACK
          </button>
        ) : (
          <React.Fragment>
            <button
              onClick={() =>
                chrome.storage.sync.remove([ 'slackAccessToken' ], () => {
                  // todo: listen to storage?
                  this.updateSlackAccessToken();
                })
              }
            >
                            Log Out Of Slack
            </button>
            <TuiTest />
          </React.Fragment>
        )}
      </div>
    );
  }
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (let key in changes) {
    var storageChange = changes[key];
    console.log(
      'Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
      key,
      namespace,
      storageChange.oldValue,
      storageChange.newValue
    );
  }
});

class TuiTest extends React.Component {
  constructor(props) {
    super(props);
    this.tuiContainer = React.createRef();
  }

  componentWillUnmount() {
    chrome.runtime.onMessage.removeListener(this.screenshotListener);
  }

  componentDidMount() {
    const self = this;
    self.imageEditor = new ImageEditor(self.tuiContainer.current, {
      cssMaxWidth: 500,
      cssMaxHeight: 500,
      selectionStyle: {
        cornerSize: 20,
        rotatingPointOffset: 70
      }
    });

    this.screenshotListener = async function(request) {
      try {
        if (request.message === CHROME_MESSAGES.HERE_IS_YOUR_SCREENSHOT) {
          const file = Base64Binary.generateJPEGFileFromDataURI({
            dataUri: request.dataUri,
            filename: 'blerg.jpg'
          });
          //const imgUrl = URL.createObjectURL(imgFile);
          await self.imageEditor.loadImageFromFile(file);
          await self.imageEditor.addImageObject(URL.createObjectURL(file));
        }
      } catch (err) {
        console.log(err);
      }
    };

    chrome.runtime.onMessage.addListener(this.screenshotListener);
  }

  render() {
    return (
      <React.Fragment>
        <div
          className={'tui-container'}
          ref={this.tuiContainer}
          style={{ height: '600px', width: '600px' }}
        />
        <button
          onClick={async () => {
            const dataUri = this.imageEditor.toDataURL({ format: 'jpeg' });
            chrome.extension.sendMessage({
              message: CHROME_MESSAGES.SEND_DATA_URI_TO_SLACK,
              dataUri
            });
          }}
        >
                    Send image to slack
        </button>
        <button
          onClick={() =>
            chrome.extension.sendMessage({
              message: CHROME_MESSAGES.SEND_OVER_SCREENSHOTS
            })
          }
        >
                    Send over screenshot
        </button>
      </React.Fragment>
    );
  }
}

const app = document.createElement('div');
app.id = 'my-extension-root';
document.body.appendChild(app);
ReactDOM.render(<Main />, app);

app.style.display = 'none';
chrome.runtime.onMessage.addListener(async function(request) {
  if (request.message === CHROME_MESSAGES.TOGGLE_EXTENSION) {
    toggle();
  }
});

function toggle() {
  if (app.style.display === 'none') {
    app.style.display = 'block';
  } else {
    app.style.display = 'none';
  }
}
