import * as R from 'ramda';

const getRequestsManager = () => {
  let PENDING_REQUESTS = {};
  let REQUESTS = {};

  const propOrWithSet = ({ obj, propName, defaultSetValue }) => {
    const propValue = R.propOr(defaultSetValue, propName, obj);
    obj[propName] = propValue;

    return propValue;
  };

  const NOTIFIERS = [];
  const notify = ({ request }) => {
    if (request.headerDetails !== undefined && request.requestDetails !== undefined) {
      REQUESTS[request.requestDetails.requestId] = request;
      delete PENDING_REQUESTS[request.requestDetails.requestId];

      NOTIFIERS.forEach(notifier => notifier({ request }));
    }
  };

  return {
    addFullRequestReceivedListener: listener => {
      NOTIFIERS.push(listener);
    },

    registerHeaderReceived: ({ headerDetails }) => {
      const request = propOrWithSet({
        defaultSetValue: {},
        obj: PENDING_REQUESTS,
        propName: headerDetails.requestId
      });

      Object.assign(request, { headerDetails });

      notify({ request });
    },

    registerRequestReceived: ({ requestDetails }) => {
      const request = propOrWithSet({
        defaultSetValue: {},
        obj: PENDING_REQUESTS,
        propName: requestDetails.requestId
      });

      Object.assign(request, { requestDetails });

      notify({ request });
    },

    getAllRequests: () => {
      return R.clone(REQUESTS);
    },

    flush: () => {
      PENDING_REQUESTS = {};
      REQUESTS = {};
    }
  };
};

export { getRequestsManager };
