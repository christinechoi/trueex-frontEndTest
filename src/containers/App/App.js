import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Cell, Column, ColumnGroup, Table } from 'fixed-data-table';
import '../../../node_modules/fixed-data-table/dist/fixed-data-table.css';
import _ from 'lodash';

  @connect(
      state => ({rows: state.rows, cols: state.cols || new Array(10)})
  )
export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      rows: [],
      cols: new Array(10)
    };
    this.onSnapshotReceived = this.onSnapshotReceived.bind(this);
    this.onUpdateReceived = this.onUpdateReceived.bind(this);
    this.throttledUpdate = this.throttle(this.onUpdateReceived, 500);
    this._cell = this._cell.bind(this);
    this._headerCell = this._headerCell.bind(this);
    this._generateCols = this._generateCols.bind(this);
    this.throttle = this.throttle.bind(this);
  }

  onSnapshotReceived(data) {
    let rows = [];
    data.forEach(row => {
      rows[row.id] = row;
    });
    // const rows = this.state.rows.concat(data);
    console.log('snapshot' + rows);
    console.log('in snapshot');
    const cols = Object.keys(rows[0]);
    this.setState({rows, cols});
  };

  onUpdateReceived(data) {
    // const rows = this.state.rows.concat(data);
    console.log('in update handler');
    let rows = this.state.rows;

    data.forEach(newRow => {
      rows[newRow.id] = newRow;
    });

    this.setState({rows});
  };

  throttle(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : Date.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = Date.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  _cell(cellProps) {
    const rowIndex = cellProps.rowIndex;
    const rowData = this.state.rows[rowIndex];  
    const col = this.state.cols[cellProps.columnKey]; 
    const content = rowData[col]; 

    // Stubbed below; maybe move color change logic to onUpdateReceived?

    let hasIncreased = null;
    let previousContent = 50000;

    if (previousContent >= content) {
      hasIncreased = true;
    } else {
      hasIncreased = false;
    };

    return (
      <Cell style={hasIncreased ? {color: 'green'} : {color: 'red'}}>{content}</Cell>
    );
  }

  _headerCell(cellProps) {
    const col = this.state.cols[cellProps.columnKey];
    return (
      <Cell>{col}</Cell>
    );
  }

  _generateCols() {
    console.log('generating...');
    let cols = [];
    this.state.cols.forEach((row, index) => {
      cols.push(
        <Column
          width={100}
          flexGrow={1}
          cell={this._cell}
          header={this._headerCell}
          columnKey={index}>
        </Column>
      );
    });
    console.log(cols);
    return cols;
  };


  componentDidMount() {
    if (socket) {
      socket.on('snapshot', this.onSnapshotReceived);
      socket.on('updates', this.throttledUpdate);
    }
  };
  componentWillUnmount() {
    if (socket) {
      socket.removeListener('snapshot', this.onSnapshotReceived);
      socket.removeListener('updates', this.throttledUpdate);
    }
  };

  render() {
    const columns = this._generateCols();
    return (
      <Table
        rowHeight={30}
        width={window.innerWidth}
        maxHeight={window.innerHeight}
        headerHeight={35}
        rowsCount={this.state.rows.length}
        >
        {columns}
      </Table>
    );
  }
}