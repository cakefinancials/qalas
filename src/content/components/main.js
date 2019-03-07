import React, { Fragment } from 'react';
import * as R from 'ramda';
import { Button, Input, Row, Icon } from 'antd';

import { JsonViewer } from './json_viewer';
import { config } from '../config';
import { CHROME_MESSAGES } from '../../helpers/constants';

const {
  stateManager: { container: stateManagerContainer, STATE_MANAGER_NAMES }
} = config;

const requestsStateManager = stateManagerContainer.getStateManager({
  name: STATE_MANAGER_NAMES.REQUESTS
});

requestsStateManager.syncUpdate({ REQUESTS: {} });

const appStateManager = stateManagerContainer.getStateManager({
  name: STATE_MANAGER_NAMES.APP_STATE
});

appStateManager.clearData({ loading: true });

window.addEventListener('message', ({ data: { fromParent, message, data } = { fromChild: false } }) => {
  if (!fromParent) {
    return;
  } else if (message === CHROME_MESSAGES.ANSWERING_EXISTING_REQUESTS) {
    requestsStateManager.syncUpdate({
      REQUESTS: R.merge(requestsStateManager.getData().REQUESTS, data.existingRequests)
    });
  } else if (message === CHROME_MESSAGES.RECEIVED_REQUEST) {
    const { request } = data;
    requestsStateManager.syncUpdate({
      REQUESTS: R.merge(requestsStateManager.getData().REQUESTS, {
        [request.requestDetails.requestId]: request
      })
    });
  } else if (message === CHROME_MESSAGES.RECEIVED_REQUEST) {
    const { request } = data;
    requestsStateManager.syncUpdate({
      REQUESTS: R.merge(requestsStateManager.getData().REQUESTS, {
        [request.requestDetails.requestId]: request
      })
    });
  } else if (message === CHROME_MESSAGES.ANSWERING_APP_STATE) {
    const { APP_STATE } = data;
    console.log({ APP_STATE });
    appStateManager.syncUpdate(APP_STATE);
  }
});

const sendMessageToParent = ({ message, data }) => {
  window.parent.postMessage({
    fromChild: true,
    message,
    data
  });
};

sendMessageToParent({ message: CHROME_MESSAGES.REQUESTING_EXISTING_REQUESTS });
sendMessageToParent({ message: CHROME_MESSAGES.REQUESTING_APP_STATE });

const DISPLAY_STATE = {
  ENTER_URL: 'ENTER_URL',
  VIEW_PAYLOAD_DATA: 'VIEW_PAYLOAD_DATA',
  LOADING: 'LOADING'
};

const Main = stateManagerContainer.withStateManagers({
  stateManagerNames: [ STATE_MANAGER_NAMES.REQUESTS, STATE_MANAGER_NAMES.APP_STATE ],
  WrappedComponent: class Main extends React.Component {
    constructor(props) {
      super(props);

      this.appStateManager = props.stateManagers[STATE_MANAGER_NAMES.APP_STATE];
      this.requestsStateManager = props.stateManagers[STATE_MANAGER_NAMES.REQUESTS];

      this.state = {
        urlFilter: ''
      };
    }

    render() {
      let displayState;
      if (this.appStateManager.isLoading()) {
        displayState = DISPLAY_STATE.LOADING;
      } else if (this.appStateManager.getData().urlFilter === '') {
        displayState = DISPLAY_STATE.ENTER_URL;
      } else {
        displayState = DISPLAY_STATE.VIEW_PAYLOAD_DATA;
      }

      let body;
      if (displayState === DISPLAY_STATE.VIEW_PAYLOAD_DATA) {
        body = this.renderViewDataPayload();
      } else if (displayState === DISPLAY_STATE.ENTER_URL) {
        body = this.renderEnterUrl();
      } else if (displayState === DISPLAY_STATE.LOADING) {
        body = this.renderLoading();
      }

      return (
        <div className={'my-extension'}>
          <div style={{ textAlign: 'center' }}>
            <strong>
              <p
                style={{
                  fontSize: '21px',
                  marginBottom: '0px',
                  fontWeight: 'bold',
                  color: '#f1f1f4'
                }}
              >
                                Qala
              </p>
            </strong>
            {body}
          </div>
        </div>
      );
    }

    renderLoading() {
      return <div>LOADING...</div>;
    }

    renderEnterUrl() {
      const { urlFilter } = this.state;
      return (
        <Fragment>
          <div style={{ textAlign: 'center' }}>
            <i>
              <p style={{ fontSize: '14px', color: '#f1f1f4' }}>
                                Change the way you QA
              </p>
            </i>
          </div>
          <Row type="flex" justify="center">
            <Input
              placeholder="https://example.com/evs"
              value={urlFilter}
              onChange={e => {
                this.setState({ urlFilter: e.target.value });
              }}
              ref={node => (this.userNameInput = node)}
            />
          </Row>
          <Row type="flex" justify="center">
            <Button
              className="start-tracking-events-btn"
              disabled={urlFilter === ''}
              onClick={() => {
                const APP_STATE = R.merge(this.appStateManager.getData(), {
                  urlFilter
                });
                this.appStateManager.syncUpdate(APP_STATE);
                sendMessageToParent({
                  message: CHROME_MESSAGES.UPDATE_APP_STATE,
                  data: { APP_STATE }
                });
              }}
              style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '10px' }}
            >
                            START TRACKING EVENTS
            </Button>
            <p style={{ fontSize: '12px', marginTop: '10px' }}>
                            Simply paste in your network request URL to start tracking events. No
                            more digging around in your console.
            </p>
          </Row>
        </Fragment>
      );
    }

    renderViewDataPayload() {
      const { urlFilter } = this.appStateManager.getData();
      const { REQUESTS } = this.requestsStateManager.getData();

      const filteredRequests = R.pipe(
        R.values,
        R.filter(({ requestDetails: { url } }) => url.indexOf(urlFilter) >= 0)
      )(REQUESTS);

      return (
        <Fragment>
          <div style={{ textAlign: 'center' }}>
            <i>
              <p style={{ fontSize: '12px' }}>
                                Request URL: {urlFilter}
                <Icon
                  style={{
                    fontSize: '14px',
                    marginLeft: '5px',
                    cursor: 'pointer'
                  }}
                  type="edit"
                  onClick={() => {
                    const APP_STATE = R.merge(this.appStateManager.getData(), {
                      urlFilter: ''
                    });
                    this.appStateManager.syncUpdate(APP_STATE);
                    sendMessageToParent({
                      message: CHROME_MESSAGES.UPDATE_APP_STATE,
                      data: { APP_STATE }
                    });
                    this.setState({ urlFilter: '' });
                  }}
                />
              </p>
            </i>
          </div>
          {R.map(
            ({ requestDetails }) => (
              <JsonViewer key={requestDetails.requestId} jsonData={requestDetails} />
            ),
            filteredRequests
          )}
        </Fragment>
      );
    }
  }
});

export { Main };
