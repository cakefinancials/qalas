import React from 'react';
import moment from 'moment';
import { Row, Col } from 'antd';

import * as R from 'ramda';

export class PathViewer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { requestDetails, pathToValue, viewEventClicked } = this.props;

    return (
      <Row className="path-viewer-summary">
        <Col span={8}>
          <span>{moment(requestDetails.timeStamp).format('MM/DD h:mm:ss a')}</span>
        </Col>
        <Col span={16}>
          <span
            style={{ overflowWrap: 'break-word', color: '#d8d8d8', cursor: 'pointer' }}
            onClick={() => {
              viewEventClicked();
            }}
          >
            {JSON.stringify(R.path(pathToValue, requestDetails.parsedBody))}
          </span>
        </Col>
      </Row>
    );
  }
}
