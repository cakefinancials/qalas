import * as stateManagerLib from '../helpers/state_manager';

const STATE_MANAGER_NAMES = {
  REQUESTS_ON_CURRENT_TAB: 'requestsOnCurrentTab'
};

export const config = {
  stateManager: { STATE_MANAGER_NAMES, container: stateManagerLib.getStateManagerContainer() }
};
