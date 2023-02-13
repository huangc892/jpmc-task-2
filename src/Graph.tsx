import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
// we want this to behave like an HTML element for web purposes so we extend to this class
interface PerspectiveViewerElement extends HTMLElement{
  load: (table: Table) => void,

}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  // Perspective table
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element to attach the table from the DOM.
    // directly get result of document.getElementsByTagName since we extended the class
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.

      // added in the following attributes to the table element

      // view is the visualization of the graph. grid would be like what we had before, but now it becomes line graph
      elem.setAttribute('view', 'y_line');

      // separates different stocks into different columns because we group by ['stock']
      elem.setAttribute('column-pivots', '["stock"]');

      // row intervals are mapped with ['timestamp'] distinction
      elem.setAttribute('row-pivots', '["timestamp"]');

      // focuses on what value to graph on the y-axis for each stock
      elem.setAttribute('columns', '["top_ask_price"]');

      // removes duplicates by highlighting unique values of stock name, timestamp by consolidating into one
      elem.setAttribute('aggregates', `
                        {"stock": "distinct count",
                        "top_ask_price": "avg",
                        "top_bid_price": "avg",
                        "timestamp": "distinct count"}
                        `);
      // Add more Perspective configurations here.
      elem.load(this.table);
    }
  }

  componentDidUpdate() {
    // Everytime the data props is updated, insert the data into Perspective table
    if (this.table) {
      // As part of the task, you need to fix the way we update the data props to
      // avoid inserting duplicated entries into Perspective table again.
      this.table.update(this.props.data.map((el: any) => {
        // Format the data from ServerRespond to the schema
        return {
          stock: el.stock,
          top_ask_price: el.top_ask && el.top_ask.price || 0,
          top_bid_price: el.top_bid && el.top_bid.price || 0,
          timestamp: el.timestamp,
        };
      }));
    }
  }
}

export default Graph;
