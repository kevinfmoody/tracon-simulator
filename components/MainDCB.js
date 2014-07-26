/** @jsx React.DOM */

var DCBScopeRangeButton = React.createClass({
  getInitialState: function() {
    return {
      range: 80
    };
  },
  handleValueChange: function(newValue) {
    this.setState({
      range: newValue
    });
  },
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBRangeButton
          style="full"
          label="Range"
          value={this.state.range}
          min={2}
          max={256}
          step={1}
          handleValueChange={this.handleValueChange}
        />
      </ScopeButtonContainer>
    );
  }
});

var DCBPlaceCenterButton = React.createClass({
  getInitialState: function() {
    return {
      selected: false
    };
  },
  handleToggle: function() {
    this.setState({
      selected: !this.state.selected
    });
  },
  render: function() {
    return (
        <DCBToggleButton
          style="split"
          label="Place CNTR"
          selected={this.state.selected}
          handleToggle={this.handleToggle}
        />
    );
  }
});

var DCBOffCenterButton = React.createClass({
  getInitialState: function() {
    return {
      selected: false
    };
  },
  handleToggle: function() {
    this.setState({
      selected: !this.state.selected
    });
  },
  render: function() {
    return (
        <DCBToggleButton
          style="split"
          label="Off CNTR"
          selected={this.state.selected}
          handleToggle={this.handleToggle}
        />
    );
  }
});

var DCBScopeCenterButtonGroup = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBPlaceCenterButton />
        <DCBOffCenterButton />
      </ScopeButtonContainer>
    );
  }
});

var DCBRangeRingsDistanceButton = React.createClass({
  getInitialState: function() {
    return {
      distance: 5
    };
  },
  handleValueChange: function(newValue) {
    this.setState({
      distance: newValue
    });
  },
  render: function() {
    return (
      <DCBRangeButton
        style="full"
        label="RR"
        value={this.state.distance}
        min={5}
        max={20}
        step={5}
        handleValueChange={this.handleValueChange}
      />
    );
  }
});

var DCBRangeRingsButtonGroup = React.createClass({
  render: function() {
    return (
      <ScopeButtonGroup>
        <ScopeButtonContainer>
          <DCBRangeRingsDistanceButton />
        </ScopeButtonContainer>
        <ScopeButtonContainer>
          <ScopeSplitButton label={['place', 'cntr']} />
          <ScopeSplitButton label={['off', 'cntr']} />
        </ScopeButtonContainer>
      </ScopeButtonGroup>
    );
  }
});