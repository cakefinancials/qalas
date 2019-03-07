import * as stateManagerLib from '../helpers/state_manager';

const STATE_MANAGER_NAMES = {
  REQUESTS: 'REQUESTS',
  APP_STATE: 'APP_STATE'
};

export const config = {
  stateManager: { STATE_MANAGER_NAMES, container: stateManagerLib.getStateManagerContainer() }
};
