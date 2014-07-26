/** @jsx React.DOM */

var ScopeButtonGroup = React.createClass({
  render: function() {
    return (
      <div className="scope-button-group">
        {this.props.children}
      </div>
    );
  }
});

var ScopeButtonContainer = React.createClass({
  render: function() {
    return (
      <div className="scope-button-container">
        {this.props.children}
      </div>
    );
  }
});

var ScopeButton = React.createClass({
  getInitialState: function() {
    return {
      selected: false
    };
  },
  handleClick: function(e) {
    this.setState({
      selected: !this.state.selected
    });
  },
  render: function() {
    var classRules = {};
    classRules[this.props.className] = true;
    classRules['selected'] = this.state.selected;
    var classes = React.addons.classSet(classRules);
    return (
      <div className={classes} onClick={this.handleClick}>
        <p>
          {
            this.props.label.length === 1 ? 
            this.props.label[0] :
            [this.props.label[0], <br />, this.props.label[1]]
          }
        </p>
      </div>
    );
  }
});

var DCBManagedButton = React.createClass({
  render: function() {
    var classRules = {};
    classRules['scope-' + this.props.style + '-button'] = true;
    classRules['selected'] = this.props.selected;
    var classes = React.addons.classSet(classRules);
    return (
      <div 
        className={classes} 
        onClick={this.props.handleClick}
        onWheel={this.props.handleWheel}
        onMouseLeave={this.props.handleMouseLeave}
      >
        <p>
          {this.props.text}
        </p>
      </div>
    );
  }
});

var DCBRangeButton = React.createClass({
  getInitialState: function() {
    return {
      selected: this.props.selected || false
    };
  },
  handleClick: function(e) {
    this.setState({
      selected: !this.state.selected
    });
  },
  handleWheel: function(e) {
    this.moveNumSteps(e.deltaY > 0 ? 1 : -1);
  },
  handleMouseLeave: function(e) {
    if (this.state.selected) {
      this.setState({
        selected: false
      });
    }
  },
  moveNumSteps: function(steps) {
    if (this.state.selected) {
      var unboundedValue = this.props.value + steps * this.props.step,
          boundedValue = Math.min(Math.max(unboundedValue, this.props.min), this.props.max);
      this.props.handleValueChange(boundedValue);
    }
  },
  render: function() {
    var classRules = {};
    classRules['scope-' + this.props.style + '-button'] = true;
    classRules['selected'] = this.state.selected;
    var classes = React.addons.classSet(classRules);
    return (
      <DCBManagedButton
        style="full"
        selected={this.state.selected}
        text={[
          this.props.label,
          <br />,
          this.props.value
        ]}
        handleClick={this.handleClick}
        handleWheel={this.handleWheel}
        handleMouseLeave={this.handleMouseLeave}
      />
    );
  }
});

var DCBToggleButton = React.createClass({
  handleClick: function(e) {
    this.props.handleToggle();
  },
  render: function() {
    var classRules = {};
    classRules['scope-' + this.props.style + '-button'] = true;
    classRules['selected'] = this.props.selected;
    var classes = React.addons.classSet(classRules),
        textArray = this.props.label.split(' ');
    return (
      <DCBManagedButton
        style={this.props.style}
        selected={this.props.selected}
        text={
          textArray.length === 1 ? 
          textArray[0] :
          [textArray[0], <br />, textArray[1]]
        }
        handleClick={this.handleClick}
      />
    );
  }
});

// var DCBManagedToggleButton = React.createClass({
  
// });

// var DCBToggleButton = React.createClass({
  
// });

// var DCBMutexButtonGroup = React.createClass({
  
// });

// var DCBMultipleSelectButtonGroup = React.createClass({
  
// });

var ScopeFullButton = React.createClass({
  render: function() {
    return (
      <ScopeButton
        className="scope-full-button"
        label={this.props.label}
        selected={this.props.selected}
        onButtonPress={this.props.onButtonPress}
      />
    );
  }
});

var ScopeSplitButton = React.createClass({
  render: function() {
    return (
      <ScopeButton
        className="scope-split-button"
        label={this.props.label}
        selected={this.props.selected}
        onButtonPress={this.props.onButtonPress}
      />
    );
  }
});

var ScopeVerticalButton = React.createClass({
  render: function() {
    return (
      <ScopeButton
        className="scope-vertical-button"
        label={this.props.label}
        selected={this.props.selected}
        onButtonPress={this.props.onButtonPress}
      />
    );
  }
});