import React from 'react';

import JSONTree from 'react-json-tree';
import './json_viewer.css';
import * as R from 'ramda';

const EVS_EXAMPLE = {
  src: 'website',
  events: [
    {
      code: 'web007101',
      campaign: {},
      visitor_id: '7711499883571470081',
      first_referrer_url: 'https://www.joinhoney.com/shop/ulta',
      first_referrer_ts: 1551393170655,
      session_id: '1551508182062',
      sub_src: 'web-shop-page',
      honey_gold: 1,
      indexation: true,
      logo: true,
      num_coupons: 13,
      num_deals: 50,
      num_invisible_coupons: 2,
      num_new_codes: 1,
      store: { id: '7357383677827636780', name: 'ULTA', label: 'ulta', country: 'US' },
      status: 200,
      unique_description: true,
      title: '10 Best ULTA Online Coupons, Promo Codes - Mar 2019 - Honey',
      free_shipping: true,
      return_policy: true,
      num_tips: 5,
      url: '/shop/ulta',
      referer: 'https://www.joinhoney.com/shop/ulta'
    }
  ],
  exv: 'ch.11.1.1.7658508525219735084.7686096613534849874'
};

export class JsonViewer extends React.Component {
  render() {
    return (
      <JSONTree
        data={EVS_EXAMPLE}
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
