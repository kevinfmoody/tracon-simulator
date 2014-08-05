/** @jsx React.DOM */


// SCOPE RANGE BUTTON CONTAINER ///////////////////////


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
      <DCBRangeButton
        style="full"
        label="Range"
        value={this.state.range}
        min={2}
        max={256}
        step={1}
        handleValueChange={this.handleValueChange}
      />
    );
  }
});

var DCBScopeRangeButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBScopeRangeButton />
      </ScopeButtonContainer>
    );
  }
});


// SCOPE CENTER BUTTON CONTAINER //////////////////////


var DCBPlaceScopeCenterButton = React.createClass({
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

var DCBOffScopeCenterButton = React.createClass({
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

var DCBScopeCenterButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBPlaceScopeCenterButton />
        <DCBOffScopeCenterButton />
      </ScopeButtonContainer>
    );
  }
});


// RANGE RINGS BUTTON GROUP ///////////////////////////


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
        steps={[
          2,
          5,
          10,
          20
        ]}
        handleValueChange={this.handleValueChange}
      />
    );
  }
});

var DCBRangeRingsDistanceButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBRangeRingsDistanceButton />
      </ScopeButtonContainer>
    );
  }
});

var DCBPlaceRangeRingsCenterButton = React.createClass({
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

var DCBOffRangeRingsCenterButton = React.createClass({
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

var DCBRangeRingsCenterButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBPlaceRangeRingsCenterButton />
        <DCBOffRangeRingsCenterButton />
      </ScopeButtonContainer>
    );
  }
});

var DCBRangeRingsButtonGroup = React.createClass({
  render: function() {
    return (
      <ScopeButtonGroup>
        <DCBRangeRingsDistanceButtonContainer />
        <DCBRangeRingsCenterButtonContainer />
      </ScopeButtonGroup>
    );
  }
});


// MAPS BUTTON GROUP //////////////////////////////////


var DCBMapsButton = React.createClass({
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
        style="full"
        label="Maps"
        selected={this.state.selected}
        handleToggle={this.handleToggle}
      />
    );
  }
});

var DCBMapsButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBMapsButton />
      </ScopeButtonContainer>
    );
  }
});

var DCBSingleMapButton = React.createClass({
  getInitialState: function() {
    return {
      selected: this.props.map ? this.props.map.enabled() : false
    };
  },
  handleToggle: function() {
    if (!this.props.map)
      return;
    this.props.map.toggle();
    scope.render();
    this.setState({
      selected: this.props.map.enabled()
    });
  },
  render: function() {
    return (
      <DCBToggleButton
        disabled={!this.props.map}
        style="split"
        label={
          this.props.map ?
          this.props.index + ' ' + this.props.map.id() :
          ''
        }
        selected={this.state.selected}
        handleToggle={this.handleToggle}
      />
    );
  }
});

var DCBMapsButtonGroup = React.createClass({
  render: function() {
    var maps = this.props.maps;
    var mapButtons = Object.keys(maps).reduce(function(mapButtons, id, index, ids) {
      if (index % 2 == 0) {
        var nextIndex = index + 1,
            newButtonContainer = (
              <ScopeButtonContainer>
                <DCBSingleMapButton index={nextIndex} map={maps[id]} />
                <DCBSingleMapButton index={nextIndex + 1} map={maps[ids[nextIndex]]} />
              </ScopeButtonContainer>
            );
        return mapButtons.concat([newButtonContainer]);
      }
      return mapButtons;
    }, []);
    return (
      <ScopeButtonGroup>
        {mapButtons}
      </ScopeButtonGroup>
    );
  }
});

var DCBFavoriteMapsButtonGroup = React.createClass({
  render: function() {
    return (
      <DCBMapsButtonGroup
        maps={scope.maps()}
      />
    );
  }
});


// WEATHER BUTTON GROUP ///////////////////////////////


var DCBWeatherButton = React.createClass({
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
        style="vertical"
        label={'WX' + this.props.index}
        selected={this.state.selected}
        handleToggle={this.handleToggle}
        disabled={true}
      />
    );
  }
});

var DCBWeatherButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBWeatherButton index={this.props.index} />
      </ScopeButtonContainer>
    );
  }
});

var DCBWeatherButtonGroup = React.createClass({
  render: function() {
    var weatherButtons = [1, 2, 3, 4, 5, 6].map(function(index) {
      return <DCBWeatherButtonContainer index={index} />
    });
    return (
      <ScopeButtonGroup>
        {weatherButtons}
      </ScopeButtonGroup>
    );
  }
});


// BRITE BUTTON CONTAINER /////////////////////////////


var DCBBriteButton = React.createClass({
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
        style="full"
        label="Brite"
        selected={this.state.selected}
        handleToggle={this.handleToggle}
      />
    );
  }
});

var DCBBriteButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBBriteButton />
      </ScopeButtonContainer>
    );
  }
});


// LEADER BUTTON CONTAINER ////////////////////////////


var DCBLeaderDirectionButton = React.createClass({
  getInitialState: function() {
    return {
      direction: TargetRenderer.getLeaderDirectionString()
    };
  },
  handleValueChange: function(newValue) {
    TargetRenderer.setLeaderDirection(newValue);
    scope.render();
    this.setState({
      direction: TargetRenderer.getLeaderDirectionString()
    });
  },
  render: function() {
    return (
      <DCBRangeButton
        style="split"
        label="LDR Dir"
        value={this.state.direction}
        steps={[
          'N',
          'NE',
          'E',
          'SE',
          'S',
          'SW',
          'W',
          'NW'
        ]}
        wrapSteps={true}
        handleValueChange={this.handleValueChange}
      />
    );
  }
});

var DCBLeaderDistanceButton = React.createClass({
  getInitialState: function() {
    return {
      distance: TargetRenderer.LEADER_LENGTH
    };
  },
  handleValueChange: function(newValue) {
    TargetRenderer.setLeaderLength(newValue);
    scope.render();
    this.setState({
      distance: TargetRenderer.LEADER_LENGTH
    });
  },
  render: function() {
    return (
      <DCBRangeButton
        style="split"
        label="LDR"
        value={this.state.distance}
        min={0}
        max={7}
        step={1}
        handleValueChange={this.handleValueChange}
      />
    );
  }
});

var DCBLeaderButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBLeaderDirectionButton />
        <DCBLeaderDistanceButton />
      </ScopeButtonContainer>
    );
  }
});


// CHAR SIZE BUTTON CONTAINER /////////////////////////


var DCBCharSizeButton = React.createClass({
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
        style="full"
        label="Char Size"
        selected={this.state.selected}
        handleToggle={this.handleToggle}
      />
    );
  }
});

var DCBCharSizeButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBCharSizeButton />
      </ScopeButtonContainer>
    );
  }
});


// SCOPE MODE BUTTON CONTAINER ////////////////////////


var DCBScopeModeButton = React.createClass({
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
        disabled={true}
        style="full"
        label="Mode FSL"
        selected={this.state.selected}
        handleToggle={this.handleToggle}
      />
    );
  }
});

var DCBScopeModeButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBScopeModeButton />
      </ScopeButtonContainer>
    );
  }
});


// PREF SET BUTTON CONTAINER //////////////////////////


var DCBPrefSetButton = React.createClass({
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
        style="full"
        label="Pref 22L"
        selected={this.state.selected}
        handleToggle={this.handleToggle}
      />
    );
  }
});

var DCBPrefSetButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBPrefSetButton />
      </ScopeButtonContainer>
    );
  }
});


// RADAR SITE BUTTON CONTAINER ////////////////////////


var DCBRadarSiteButton = React.createClass({
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
        style="full"
        label="Site BOS"
        selected={this.state.selected}
        handleToggle={this.handleToggle}
      />
    );
  }
});

var DCBRadarSiteButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBRadarSiteButton />
      </ScopeButtonContainer>
    );
  }
});


// SSA / GI TEXT BUTTON CONTAINER /////////////////////


var DCBSSAFilterButton = React.createClass({
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
        label="SSA Filter"
        selected={this.state.selected}
        handleToggle={this.handleToggle}
      />
    );
  }
});

var DCBGITextFilterButton = React.createClass({
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
        label="GI Text Filter"
        selected={this.state.selected}
        handleToggle={this.handleToggle}
      />
    );
  }
});

var DCBTextFiltersButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBSSAFilterButton />
        <DCBGITextFilterButton />
      </ScopeButtonContainer>
    );
  }
});


// SHIFT BUTTON CONTAINER /////////////////////////////


var DCBShiftButton = React.createClass({
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
        style="full"
        label="Shift"
        selected={this.state.selected}
        handleToggle={this.handleToggle}
      />
    );
  }
});

var DCBShiftButtonContainer = React.createClass({
  render: function() {
    return (
      <ScopeButtonContainer>
        <DCBShiftButton />
      </ScopeButtonContainer>
    );
  }
});


///////////////////////////////////////////////////////



// var DCBBriteButton = React.createClass({
//   getInitialState: function() {
//     return {
//       brite: 75
//     };
//   },
//   handleValueChange: function(newValue) {
//     this.setState({
//       brite: newValue
//     });
//   },
//   render: function() {
//     return (
//       <ScopeButtonContainer>
//         <DCBRangeButton
//           style="full"
//           label="Brite"
//           value={this.state.brite}
//           min={0}
//           max={100}
//           step={5}
//           minLabel="Off"
//           handleValueChange={this.handleValueChange}
//         />
//       </ScopeButtonContainer>
//     );
//   }
// });