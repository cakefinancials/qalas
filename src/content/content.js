/* src/content.js */
/*global chrome*/
import React from 'react';
import ReactDOM from 'react-dom';
import './content.css';
import * as R from 'ramda';

import ImageEditor from 'tui-image-editor';
import { Base64Binary } from '../helpers/base_64_binary';
import { CHROME_MESSAGES } from '../helpers/constants';
import { chromep } from '../helpers/chrome_promisify';
import { config } from './config';

import QalaCry from '../public/images/qala_cry.png';

const {
  stateManager: { container: stateManagerContainer, STATE_MANAGER_NAMES }
} = config;

const slackDataStateManager = stateManagerContainer.getStateManager({
  name: STATE_MANAGER_NAMES.SLACK_DATA
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && R.has('slackAccessToken', changes)) {
    slackDataStateManager.syncUpdate({ slackAccessToken: changes.slackAccessToken.newValue });
  }
});

slackDataStateManager.asyncUpdate(async () => {
  const { slackAccessToken } = await chromep.storage.sync.get([ 'slackAccessToken' ]);
  return { slackAccessToken };
});

const Main = stateManagerContainer.withStateManagers({
  stateManagerNames: [ STATE_MANAGER_NAMES.SLACK_DATA ],
  WrappedComponent: class Main extends React.Component {
    constructor(props) {
      super(props);

      this.slackDataStateManager = this.props.stateManagers[STATE_MANAGER_NAMES.SLACK_DATA];
    }

    render() {
      console.log(this.slackDataStateManager.getCurrentState());
      if (this.slackDataStateManager.isLoading()) {
        return <h3>Loading...</h3>;
      }

      const { slackAccessToken } = this.slackDataStateManager.getData();

      return (
        <div className={'my-extension'}>
          <h1>Hello world - My first Extension sucks!!!!!</h1>
          {slackAccessToken === undefined ? (
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
                onClick={() => chrome.storage.sync.remove([ 'slackAccessToken' ])}
              >
                                Log Out Of Slack
              </button>
              <br />
              <br />
              <br />
              <TuiTest />
            </React.Fragment>
          )}
        </div>
      );
    }
  }
});

class TuiTest extends React.Component {
  constructor(props) {
    super(props);
    this.tuiContainer = React.createRef();
    this.state = {
      cropping: false
    };
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
        cornerSize: 40,
        rotatingPointOffset: 190
      }
    });

    this.screenshotListener = async function(request) {
      try {
        if (request.message === CHROME_MESSAGES.HERE_IS_YOUR_SCREENSHOT) {
          app.style.display = 'block';
          const file = Base64Binary.generateJPEGFileFromDataURI({
            dataUri: request.dataUri,
            filename: 'blerg.jpg'
          });
          //const imgUrl = URL.createObjectURL(imgFile);
          await self.imageEditor.loadImageFromFile(file);
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
        <button
          onClick={() => {
            app.style.display = 'none';
            chrome.extension.sendMessage({
              message: CHROME_MESSAGES.SEND_OVER_SCREENSHOTS
            });
          }}
        >
                    Send over screenshot
        </button>
        <br />
        <button
          onClick={async () => {
            await this.imageEditor.addImageObject(chrome.extension.getURL(QalaCry));
          }}
        >
                    KOALA!
        </button>
        {!this.state.cropping ? (
          <button
            onClick={() => {
              this.setState({ cropping: true });
              this.imageEditor.startDrawingMode('CROPPER');
            }}
          >
                        Crop
          </button>
        ) : (
          <React.Fragment>
            <button
              onClick={() => {
                this.setState({ cropping: false });
                this.imageEditor
                  .crop(this.imageEditor.getCropzoneRect())
                  .then(() => {
                    this.imageEditor.stopDrawingMode();
                    this.tuiContainer.current.style.height = '500px';
                  });
              }}
            >
                            Apply
            </button>
            <button
              onClick={() => {
                this.setState({ cropping: false });
                this.imageEditor.stopDrawingMode();
              }}
            >
                            Cancel
            </button>
          </React.Fragment>
        )}
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
