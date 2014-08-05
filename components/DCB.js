/** @jsx React.DOM */

var MainDCB = React.createClass({
  render: function() {
    return (
      <div className="main-dcb">
        <DCBScopeRangeButtonContainer />
        <DCBScopeCenterButtonContainer />
        <DCBRangeRingsButtonGroup />
        <DCBMapsButtonContainer />
        <DCBFavoriteMapsButtonGroup />
        <DCBWeatherButtonGroup />
        <DCBBriteButtonContainer />
        <DCBLeaderButtonContainer />
        <DCBCharSizeButtonContainer />
        <DCBScopeModeButtonContainer />
        <DCBPrefSetButtonContainer />
        <DCBRadarSiteButtonContainer />
        <DCBTextFiltersButtonContainer />
        <DCBShiftButtonContainer />
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