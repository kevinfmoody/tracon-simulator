/** @jsx React.DOM */

var MainDCB = React.createClass({
  render: function() {
    return (
      <div className="main-dcb">
        <DCBScopeRangeButton />
        <DCBScopeCenterButtonGroup />
        <DCBRangeRingsButtonGroup />
      </div>
    );
  }
});

var MasterDCB = React.createClass({
  getInitialState: function() {
    return {
      mode: 'main'
    };
  },
  render: function() {
    return (
      <div className="master-dcb">
        {
          this.state.mode === 'main' ?
          <MainDCB /> :
          <AuxDCB />
        }
      </div>
    );
  }
});

React.renderComponent(<MasterDCB />, document.getElementById('wahoo'));