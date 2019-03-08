import React from 'react';
import moment from 'moment';
import { Row, Col } from 'antd';

import * as R from 'ramda';

export class PathViewer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { requestDetails, pathToValue } = this.props;

    return (
      <Row className="path-viewer-summary">
        <Col span={8}>
          <span>{moment(requestDetails.timeStamp).format('MM/DD h:mm:ss a')}</span>
        </Col>
        <Col span={16}>
          <span style={{ marginLeft: '30px', color: '#d8d8d8' }}>
            {R.path(pathToValue, requestDetails.parsedBody)}
          </span>
        </Col>
      </Row>
    );
  }
}
