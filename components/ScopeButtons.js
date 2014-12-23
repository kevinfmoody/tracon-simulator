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
    classRules['disabled'] = this.props.disabled;
    var classes = React.addons.classSet(classRules);
    return (
      <div 
        className={classes}
        tabIndex={0}
        onClick={this.props.handleClick}
        onWheel={this.props.handleWheel}
        onMouseLeave={this.props.handleMouseLeave}
        onKeyDown={this.props.handleKeyDown}
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
    if (this.props.disabled)
      return;
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
  handleKeyDown: function(e) {
    switch (e.which) {
      case Keyboard.KEYS.UP_ARROW:
      case Keyboard.KEYS.RIGHT_ARROW:
        this.moveNumSteps(1);
        break;
      case Keyboard.KEYS.DOWN_ARROW:
      case Keyboard.KEYS.LEFT_ARROW:
        this.moveNumSteps(-1);
        break;
    }
  },
  moveNumSteps: function(steps) {
    if (this.props.disabled)
      return;
    if (this.state.selected) {
      var newValue;
      if (this.props.steps) {
        var unboundedIndex = 0,
            boundedIndex;
        for (var i = 0; i < this.props.steps.length; i++) {
          if (this.props.steps[i] === this.props.value) {
            unboundedIndex = i + steps;
            break;
          }
        }
        if (this.props.wrapSteps)
          boundedIndex = ((unboundedIndex % this.props.steps.length) + this.props.steps.length) % this.props.steps.length;
        else
          boundedIndex = Math.min(Math.max(unboundedIndex, 0), this.props.steps.length - 1);
        newValue = this.props.steps[boundedIndex];
      } else {
        var unboundedValue = this.props.value + steps * this.props.step,
            boundedValue = Math.min(Math.max(unboundedValue, this.props.min), this.props.max);
        newValue = boundedValue;
      }
      this.props.handleValueChange(newValue);
    }
  },
  render: function() {
    var value = this.props.value;
    if (value === this.props.min && this.props.minLabel)
      value = this.props.minLabel;
    else if (value === this.props.max && this.props.maxLabel)
      value = this.props.maxLabel;
    return (
      <DCBManagedButton
        style={this.props.style}
        selected={this.state.selected}
        disabled={this.props.disabled}
        text={[
          this.props.label,
          <br />,
          value
        ]}
        handleClick={this.handleClick}
        handleWheel={this.handleWheel}
        handleMouseLeave={this.handleMouseLeave}
        handleKeyDown={this.handleKeyDown}
      />
    );
  }
});

var DCBToggleButton = React.createClass({
  handleClick: function(e) {
    if (this.props.disabled)
      return;
    this.props.handleToggle();
  },
  render: function() {
    var spaceIndex = this.props.label.lastIndexOf(' ');
    return (
      <DCBManagedButton
        style={this.props.style}
        selected={this.props.selected}
        disabled={this.props.disabled}
        text={
          spaceIndex === -1 ? 
          this.props.label :
          [
            this.props.label.substring(0, spaceIndex), 
            <br />, 
            this.props.label.substring(spaceIndex + 1)
          ]
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