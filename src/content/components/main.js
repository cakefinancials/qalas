import React, { Fragment } from 'react';
import * as R from 'ramda';
import { Button, Input, Row, Col, Icon } from 'antd';

import { RequestViewer } from './request_viewer';
import { PathViewer } from './path_viewer';
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
      REQUESTS: data.existingRequests
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

const Main = stateManagerContainer.withStateManagers({
  stateManagerNames: [ STATE_MANAGER_NAMES.REQUESTS, STATE_MANAGER_NAMES.APP_STATE ],
  WrappedComponent: class Main extends React.Component {
    constructor(props) {
      super(props);

      this.appStateManager = props.stateManagers[STATE_MANAGER_NAMES.APP_STATE];
      this.requestsStateManager = props.stateManagers[STATE_MANAGER_NAMES.REQUESTS];

      this.state = {
        urlFilter: '',
        pathToValue: null
      };
    }

    render() {
      let body;
      if (this.appStateManager.isLoading()) {
        body = this.renderLoading();
      } else if (this.appStateManager.getData().urlFilter === '') {
        body = this.renderEnterUrl();
      } else if (this.state.pathToValue !== null) {
        body = this.renderViewPath();
      } else {
        body = this.renderViewDataPayload();
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
          </div>
          {body}
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

    getOrderedRequestDetails() {
      const { REQUESTS } = this.requestsStateManager.getData();

      return R.pipe(
        R.values,
        R.map(R.prop('requestDetails')),
        R.sort((a, b) => a.timeStamp - b.timeStamp)
      )(REQUESTS);
    }

    getFilterChangeUI() {
      const { urlFilter } = this.appStateManager.getData();

      return (
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
      );
    }

    renderViewPath() {
      const orderedRequestDetails = this.getOrderedRequestDetails();

      const requestDetailsWithPath = R.reject(requestDetails => {
        const DOES_NOT_HAVE_PATH_OBJ = {};
        const valueAtPath = R.pathOr(
          DOES_NOT_HAVE_PATH_OBJ,
          this.state.pathToValue,
          requestDetails.parsedBody
        );

        return valueAtPath === DOES_NOT_HAVE_PATH_OBJ;
      }, orderedRequestDetails);

      return (
        <Fragment>
          {this.getFilterChangeUI()}
          <Row>
            <div
              style={{
                fontSize: '16px'
              }}
            >
              <Col span={8}>
                <Button
                  className="back-to-events-btn"
                  onClick={() => this.setState({ pathToValue: null })}
                >
                  <Icon type="arrow-left" />
                                    BACK
                </Button>
              </Col>
              <Col span={16}>
                <span
                  style={{
                    fontWeight: 'bold',
                    color: '#ea81ff',
                    marginLeft: '20px'
                  }}
                >
                  {this.state.pathToValue.join(' > ')}
                </span>
                <span> history</span>
              </Col>
            </div>
          </Row>
          {R.map(requestDetails => {
            return (
              <PathViewer
                key={requestDetails.requestId}
                pathToValue={this.state.pathToValue}
                requestDetails={requestDetails}
                viewEventClicked={() => {
                  this.requestIdToExpand = requestDetails.requestId;
                  this.setState({ pathToValue: null });
                }}
              />
            );
          }, requestDetailsWithPath).reverse()}
        </Fragment>
      );
    }

    renderViewDataPayload() {
      const orderedRequestDetails = this.getOrderedRequestDetails();

      return (
        <Fragment>
          {this.getFilterChangeUI()}
          {R.addIndex(R.map)(
            (requestDetails, idx) => (
              <RequestViewer
                key={requestDetails.requestId}
                requestDetails={requestDetails}
                expanded={this.requestIdToExpand === requestDetails.requestId}
                eventNumber={idx + 1}
                pathClicked={pathToValue => this.setState({ pathToValue })}
                ref={ref => {
                  if (ref === null) {
                    return;
                  }

                  if (this.requestIdToExpand === requestDetails.requestId) {
                    this.requestIdToExpand = undefined;
                    ref.containerRef.current.scrollIntoView(true);
                  }
                }}
              />
            ),
            orderedRequestDetails
          ).reverse()}
        </Fragment>
      );
    }
  }
});

export { Main };
