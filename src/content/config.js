import * as stateManagerLib from '../helpers/state_manager';

const STATE_MANAGER_NAMES = {
  SLACK_DATA: 'slackData'
};

export const config = {
  stateManager: { STATE_MANAGER_NAMES, container: stateManagerLib.getStateManagerContainer() }
};
