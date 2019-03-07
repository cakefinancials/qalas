import React, { Fragment } from 'react';
import moment from 'moment';
import { Icon, Row } from 'antd';

import JSONTree from 'react-json-tree';
import './request_viewer.css';
import * as R from 'ramda';

const theme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#3a3a3a',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#d8d8d8',
  base09: '#349bdd',
  base0A: '#f4bf75',
  base0B: '#f96f48',
  base0C: '#a1efe4',
  base0D: '#ea81ff',
  base0E: '#ae81ff',
  base0F: '#cc6633'
};

export class RequestViewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: this.props.expanded
    };
  }

  render() {
    const { expanded } = this.state;
    const { requestDetails, eventNumber } = this.props;

    return (
      <Fragment>
        <Row>
          <div
            style={{
              fontSize: '11px',
              margin: '10px 0px 10px 0px',
              borderBottom: '1px solid white'
            }}
          >
            <span>{moment(requestDetails.timeStamp).format('MM/DD h:mm:ss a')}</span>
            <span style={{ float: 'right' }}>
                            Event {eventNumber}
              <Icon
                type={expanded ? 'caret-down' : 'caret-right'}
                style={{
                  marginLeft: '5px',
                  cursor: 'pointer'
                }}
                onClick={() => this.setState({ expanded: !expanded })}
              />
            </span>
          </div>
        </Row>
        {expanded ? (
          <JSONTree
            theme={theme}
            invertTheme={false}
            data={requestDetails.parsedBody || requestDetails.requestBody}
            shouldExpandNode={() => true}
            labelRenderer={function(reversePath) {
              const pathToNode = R.tail(R.reverse(reversePath));
              return (
                <strong
                  style={{ cursor: 'pointer' }}
                  onClick={() => console.log('LABEL', pathToNode)}
                >
                  {R.last(pathToNode)}
                </strong>
              );
            }}
            valueRenderer={function(rawValue, ...reversePath) {
              const pathToValue = R.init(R.tail(R.reverse(reversePath)));
              return (
                <em
                  style={{ cursor: 'pointer' }}
                  onClick={() => console.log('VALUE', pathToValue)}
                >
                  {rawValue}
                </em>
              );
            }}
          />
        ) : null}
      </Fragment>
    );
  }
}
