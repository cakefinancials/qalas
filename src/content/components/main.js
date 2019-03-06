import React from 'react';
import * as R from 'ramda';
import { Input } from 'antd';

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

const Main = stateManagerContainer.withStateManagers({
  stateManagerNames: [ STATE_MANAGER_NAMES.REQUESTS_ON_CURRENT_TAB ],
  WrappedComponent: class Main extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        filter: ''
      };

      this.requestsOnCurrentTabStateManager =
                props.stateManagers[STATE_MANAGER_NAMES.REQUESTS_ON_CURRENT_TAB];
    }

        onChangeFilter = e => {
          this.setState({ filter: e.target.value });
        };

        render() {
          const { REQUESTS } = this.requestsOnCurrentTabStateManager.getData();
          const { filter } = this.state;

          const filteredRequests = R.pipe(
            R.values,
            R.filter(({ requestDetails: { url } }) => url.indexOf(filter) >= 0)
          )(REQUESTS);

          return (
            <div className={'my-extension'}>
              <Input
                placeholder="Enter your filter"
                value={filter}
                onChange={this.onChangeFilter}
                ref={node => (this.userNameInput = node)}
              />
              {JSON.stringify(
                {
                  REQUESTS: R.map(
                    ({ requestDetails: { requestId, url } }) => ({ requestId, url }),
                    filteredRequests
                  )
                },
                null,
                4
              )}
              <JsonViewer />
              <h1>Hello world - My first Extension sucks!!!!!</h1>
            </div>
          );
        }
  }
});

export { Main };
