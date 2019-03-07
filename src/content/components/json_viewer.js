import React from 'react';

import JSONTree from 'react-json-tree';
import './json_viewer.css';
import * as R from 'ramda';

export class JsonViewer extends React.Component {
  render() {
    return (
      <JSONTree
        data={this.props.jsonData}
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
    );
  }
}
