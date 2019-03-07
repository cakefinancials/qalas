import React, { Fragment } from 'react';
import * as R from 'ramda';
import { Button, Input, Row } from 'antd';

import { JsonViewer } from './json_viewer';
import { config } from '../config';
import { CHROME_MESSAGES } from '../../helpers/constants';

const {
  stateManager: { container: stateManagerContainer, STATE_MANAGER_NAMES }
} = config;

const requestsOnCurrentTabStateManager = stateManagerContainer.getStateManager({
  name: STATE_MANAGER_NAMES.REQUESTS_ON_CURRENT_TAB
});

requestsOnCurrentTabStateManager.syncUpdate({ REQUESTS: {} });

window.addEventListener('message', ({ data: { fromParent, message, data } = { fromChild: false } }) => {
  if (!fromParent) {
    return;
  } else if (message === CHROME_MESSAGES.ANSWERING_EXISTING_REQUESTS) {
    requestsOnCurrentTabStateManager.syncUpdate({
      REQUESTS: R.merge(
        requestsOnCurrentTabStateManager.getData().REQUESTS,
        data.existingRequests
      )
    });
  } else if (message === CHROME_MESSAGES.RECEIVED_REQUEST) {
    const { request } = data;
    requestsOnCurrentTabStateManager.syncUpdate({
      REQUESTS: R.merge(requestsOnCurrentTabStateManager.getData().REQUESTS, {
        [request.requestDetails.requestId]: request
      })
    });
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

const DISPLAY_STATE = {
  ENTER_URL: 'ENTER_URL',
  VIEW_PAYLOAD_DATA: 'VIEW_PAYLOAD_DATA'
};

const Main = stateManagerContainer.withStateManagers({
  stateManagerNames: [ STATE_MANAGER_NAMES.REQUESTS_ON_CURRENT_TAB ],
  WrappedComponent: class Main extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        filter: '',
        displayState: DISPLAY_STATE.ENTER_URL
      };

      this.requestsOnCurrentTabStateManager =
                props.stateManagers[STATE_MANAGER_NAMES.REQUESTS_ON_CURRENT_TAB];
    }

    render() {
      const { displayState } = this.state;
      let body;
      if (displayState === DISPLAY_STATE.VIEW_PAYLOAD_DATA) {
        body = this.renderViewDataPayload();
      } else if (displayState === DISPLAY_STATE.ENTER_URL) {
        body = this.renderEnterUrl();
      }

      return <div className={'my-extension'}>{body}</div>;
    }

    renderEnterUrl() {
      const { filter } = this.state;
      return (
        <Fragment>
          <div style={{ textAlign: 'center' }}>
            <strong>
              <p style={{ fontSize: '20px', marginBottom: '0px' }}>Qala</p>
            </strong>
            <i>
              <p style={{ fontSize: '12px' }}>Change the way you QA</p>
            </i>
          </div>
          <Row type="flex" justify="center">
            <Input
              placeholder="https://example.com/evs"
              value={filter}
              onChange={e => this.setState({ filter: e.target.value })}
              ref={node => (this.userNameInput = node)}
            />
          </Row>
          <Row type="flex" justify="center">
            <Button
              className="start-tracking-events-btn"
              disabled={filter === ''}
              onClick={() =>
                this.setState({ displayState: DISPLAY_STATE.VIEW_PAYLOAD_DATA })
              }
            >
                            START TRACKING EVENTS
            </Button>
            <p style={{ fontSize: '12px', borderTop: '5px' }}>
                            Simply paste in your network request URL to start tracking events. No
                            more digging around in your console.
            </p>
          </Row>
        </Fragment>
      );
    }

    renderViewDataPayload() {
      const { filter } = this.state;
      const { REQUESTS } = this.requestsOnCurrentTabStateManager.getData();

      const filteredRequests = R.pipe(
        R.values,
        R.filter(({ requestDetails: { url } }) => url.indexOf(filter) >= 0)
      )(REQUESTS);

      return (
        <Fragment>
          <div style={{ textAlign: 'center' }}>
            <i>
              <p style={{ fontSize: '12px' }}>Request URL: {filter}</p>
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
