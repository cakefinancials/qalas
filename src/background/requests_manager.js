import * as R from 'ramda';

const getRequestsManager = () => {
  const PENDING_REQUESTS_BY_TAB_ID = {};
  const REQUESTS_BY_TAB_ID = {};

  const propOrWithSet = ({ obj, propName, defaultSetValue }) => {
    const propValue = R.propOr(defaultSetValue, propName, obj);
    obj[propName] = propValue;

    return propValue;
  };

  const NOTIFIERS = [];
  const notify = ({ tabId, request }) => {
    if (request.headerDetails !== undefined && request.requestDetails !== undefined) {
      const requestsForTab = propOrWithSet({
        obj: REQUESTS_BY_TAB_ID,
        propName: tabId,
        defaultSetValue: {}
      });
      requestsForTab[request.requestDetails.requestId] = request;
      delete PENDING_REQUESTS_BY_TAB_ID[tabId][request.requestDetails.requestId];

      NOTIFIERS.forEach(notifier => notifier({ tabId, request }));
    }
  };

  return {
    addFullRequestReceivedListener: listener => {
      NOTIFIERS.push(listener);
    },

    registerHeaderReceived: ({ tabId, headerDetails }) => {
      const requestsByRequestId = propOrWithSet({
        defaultSetValue: {},
        obj: PENDING_REQUESTS_BY_TAB_ID,
        propName: tabId
      });

      const request = propOrWithSet({
        defaultSetValue: {},
        obj: requestsByRequestId,
        propName: headerDetails.requestId
      });

      Object.assign(request, { headerDetails });

      notify({ tabId, request });
    },

    registerRequestReceived: ({ tabId, requestDetails }) => {
      const requestsByRequestId = propOrWithSet({
        defaultSetValue: {},
        obj: PENDING_REQUESTS_BY_TAB_ID,
        propName: tabId
      });

      const request = propOrWithSet({
        defaultSetValue: {},
        obj: requestsByRequestId,
        propName: requestDetails.requestId
      });

      Object.assign(request, { requestDetails });

      notify({ tabId, request });
    },

    getAllRequests: ({ tabId }) => {
      return propOrWithSet({
        defaultSetValue: {},
        obj: REQUESTS_BY_TAB_ID,
        propName: tabId
      });
    }
  };
};

export { getRequestsManager };
