/* src/content.js */
/*global chrome*/
import React from 'react';
import ReactDOM from 'react-dom';
import * as R from 'ramda';
import { Slider, Row, Col } from 'antd';
import 'rc-color-picker/assets/index.css';
import ColorPicker from 'rc-color-picker';
import '../App.css';
import './content.css';

import ImageEditor from 'tui-image-editor';
import { Base64Binary } from '../helpers/base_64_binary';
import { CHROME_MESSAGES } from '../helpers/constants';
//import { chromep } from '../helpers/chrome_promisify';
import { config } from './config';

import QalaCry from '../public/images/qala_cry.png';

const {
  stateManager: { container: stateManagerContainer, STATE_MANAGER_NAMES }
} = config;

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

function hexToRGBa(hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  var a = alpha || 1;

  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
}

class TuiTest extends React.Component {
  constructor(props) {
    super(props);
    this.tuiContainer = React.createRef();
    this.state = {
      edit_cropping: false,
      edit_drawing: false
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
          //app.style.display = 'block';
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

    //chrome.runtime.onMessage.addListener(this.screenshotListener);
  }

  render() {
    const inEditingMode = R.any(
      R.identity,
      R.map(
        ([ key, value ]) => key.startsWith('edit_') && value === true,
        R.toPairs(this.state)
      )
    );

    return (
      <React.Fragment>
        <button
          onClick={() => {
            //app.style.display = 'none';
            chrome.extension.sendMessage({
              message: CHROME_MESSAGES.SEND_OVER_SCREENSHOTS
            });
          }}
        >
                    Send over screenshot
        </button>
        <br />
        {inEditingMode ? null : (
          <React.Fragment>
            <button
              onClick={async () => {
                await this.imageEditor.addImageObject(
                  chrome.extension.getURL(QalaCry)
                );
              }}
            >
                            KOALA!
            </button>
            <button
              onClick={() => {
                this.setState({ edit_drawing: true });
                this.imageEditor.startDrawingMode('FREE_DRAWING', {
                  width: 10,
                  color: hexToRGBa('#a5a5a5', 1)
                });
              }}
            >
                            Draw
            </button>
            <button
              onClick={() => {
                this.setState({ edit_cropping: true });
                this.imageEditor.startDrawingMode('CROPPER');
              }}
            >
                            Crop
            </button>
          </React.Fragment>
        )}
        {this.state.edit_drawing && (
          <React.Fragment>
            <Row>
              <Col span={12}>
                <Slider min={1} max={20} onChange={console.log} />
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <ColorPicker color={'#36c'} onChange={console.log} />
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <button
                  onClick={() => {
                    this.setState({ edit_drawing: false });
                    this.imageEditor.stopDrawingMode();
                  }}
                >
                                    Exit Drawing
                </button>
              </Col>
            </Row>
          </React.Fragment>
        )}
        {this.state.edit_cropping && (
          <React.Fragment>
            <button
              onClick={() => {
                this.setState({ edit_cropping: false });
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
                this.setState({ edit_cropping: false });
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

if (window.parent === window) {
  console.log('I AM MYSELF');
  window.addEventListener(
    'message',
    stuff => {
      console.log('I GOT A MESSAGE');
      console.log({ stuff });
    },
    false
  );
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

  chrome.runtime.onMessage.addListener(async function(request) {
    if (request.message === CHROME_MESSAGES.TOGGLE_EXTENSION) {
      toggle();
    }
  });
  const toggle = () => {
    if (iframeContainer.style.display === 'none') {
      iframeContainer.style.display = 'block';
    } else {
      iframeContainer.style.display = 'none';
    }
  };
} else {
  console.log('I AM NOT MYSELF');

  const slackDataStateManager = stateManagerContainer.getStateManager({
    name: STATE_MANAGER_NAMES.SLACK_DATA
  });

  /*
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && R.has('slackAccessToken', changes)) {
      slackDataStateManager.syncUpdate({
        slackAccessToken: changes.slackAccessToken.newValue
      });
    }
  });
  */

  console.log('HERE!!!');
  window.parent.postMessage({ some: 'message' });

  slackDataStateManager.asyncUpdate(async () => {
    //const { slackAccessToken } = await chromep.storage.sync.get([ 'slackAccessToken' ]);
    return { slackAccessToken: 'asdf' };
  });

  const app = document.createElement('div');
  app.id = 'my-extension-root';
  document.body.appendChild(app);
  ReactDOM.render(<Main />, app);
}
