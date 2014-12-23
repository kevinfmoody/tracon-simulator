function TextOverlay(scope) {
  this._scope = scope;
  this._previewMessage = '';
  this._preview = [''];
  this._formatError = false;
  this._previewLine = 6;
	this._clock = new Date();
  this._brite = 3;
	var textOverlay = this;
	setInterval(function() {
		textOverlay._clock = new Date();
	}, 1000);
}



TextOverlay.prototype.setPreviewAreaMessage = function(message) {
  this._previewMessage = message;
};

TextOverlay.prototype.clearPreviewAreaMessage = function() {
  this._previewMessage = '';
};

TextOverlay.prototype.lines = function() {
  return this._preview.length;
};

TextOverlay.prototype.formatError = function() {
  this._formatError = true;
};

TextOverlay.prototype.previewSegments = function() {
  return this._preview;
};

TextOverlay.prototype.targetSelect = function() {
  if (this._preview.length == 1) {
    var targets = this._scope._targetManager.getAllTargets(),
        target;
    for (var i in targets) {
      if (targets[i].callsign().lastIndexOf(this._preview[0]) + this._preview[0].length == targets[i].callsign().length) {
        if (target)
          return;
        else
          target = targets[i];
      }
    }
    if (target) {
      this._preview[0] = target.callsign();
      this.addPreviewChar(' ');
    }
  }
};

TextOverlay.prototype.processPreviewArea = function(aircraft, controller) {
  // if (this._preview.length == 3) {
  //   var aircraft = this._scope._trafficSimulator.getAircraftByCallsign(this._preview[0]);
  //   var command = this._preview[1];
  //   var parameter = this._preview[2];
  //   if (aircraft && !isNaN(parameter)) {
  //     switch (command) {
  //       case 'TL':
  //       case 'TR':
  //       case 'FH':
  //         if (0 <= parameter && parameter <= 360) {
  //           aircraft.assignHeading(parameter, this._scope._trafficSimulator.elapsed(), 0);
  //           this.clearPreview();
  //           return true;
  //         }
  //         break;
  //       case 'CM':
  //       case 'DM':
  //         if (0 <= parameter && parameter <= 99999) {
  //           aircraft.assignAltitude(parameter, this._scope._trafficSimulator.elapsed(), 0);
  //           this.clearPreview();
  //           return true;
  //         }
  //         break;
  //       case 'SPD':
  //       case 'SLOW':
  //         if (0 <= parameter && parameter <= 9999) {
  //           aircraft.assignSpeed(parameter, this._scope._trafficSimulator.elapsed(), 0);
  //           this.clearPreview();
  //           return true;
  //         }
  //         break;
  //     }
  //   }
  // } else if (this._preview.length == 1) {
  //   var command = this._preview[0],
  //       coneCommand = /^\*P\d+$/,
  //       jRingCommand = /^\*J\d+$/;
  //   if (aircraft) {
  //     if (command == 'IC') {
  //       aircraft.setController(controller);
  //       this.clearPreview();
  //       return true;
  //     } else if (command == 'TC') {
  //       aircraft.setController(null);
  //       this.clearPreview();
  //       return true;
  //     } else if (coneCommand.test(command.substr(1))) {
  //       aircraft.enableCone(parseInt(command.substr(3)));
  //       this.clearPreview();
  //       return true;
  //     } else if (jRingCommand.test(command.substr(1))) {
  //       aircraft.enableJRing(parseInt(command.substr(3)));
  //       this.clearPreview();
  //       return true;
  //     }
  //   }
  // }
  // if (this._preview[0] == '')
  //   return false;
  // else {
  //   this._formatError = true;
  //   return true;
  // }
};

TextOverlay.prototype.clearPreview = function() {
  this._preview = [''];
  this._formatError = false;
};

TextOverlay.prototype.addPreviewChar = function(character) {
  if (character == ' ') {
    if (this._preview[this._preview.length - 1] != '')
      this._preview.push('');
  }
  else
    this._preview[this._preview.length - 1] += character;
  this._formatError = false;
};

TextOverlay.prototype.removePreviewChar = function() {
  if (this._preview[this._preview.length - 1].length == 0) {
    this._preview.splice(this._preview.length - 1);
    if (this._preview.length == 0)
      this.clearPreview();
  }
  else
    this._preview[this._preview.length - 1] =
      this._preview[this._preview.length - 1]
        .substr(0, this._preview[this._preview.length - 1].length - 1);
  this._formatError = false;
};

TextOverlay.prototype.brite = function(color) {
  if (color === 'red')
    return 'rgb(' + Math.round(255 * this._brite / 10) + ', 0, 0)';
  return 'rgb(0, ' + Math.round(255 * this._brite / 10) + ', 0)';
};

TextOverlay.prototype.line = function(r, top, line) {
  return r.scope().height * top + line * 20;
};

TextOverlay.prototype.renderPreviewArea = function(r) {
  r.context().beginPath();
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'left';
  r.context().textBaseline = 'top';
  r.context().fillStyle = '#0c0';
  r.context().fillText(this._formatError ? 'FORMAT' : this._previewMessage, 75, this.line(r, .14, this._previewLine - 1));
  for (var i = 0; i < this._preview.length; i++)
    r.context().fillText(this._preview[i], 75, this.line(r, .14, this._previewLine + i));
};

TextOverlay.prototype.renderTime = function(r, airports) {
	// var ICAOs = Object.keys(airports);
	// var iata = airports[ICAOs[0]].iata();
	// r.context().beginPath();
	// r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
	// r.context().textAlign = 'left';
	// r.context().textBaseline = 'top';
	// r.context().fillStyle = this.brite();
	// var date = this._clock;
	// var hours = '' + date.getUTCHours();
	// var minutes = '' + date.getUTCMinutes();
	// var seconds = '' + date.getUTCSeconds();
	// var timeString = (hours.length == 1 ? '0' + hours : hours) 
 //    + (minutes.length == 1 ? '0' + minutes : minutes) + '/' 
 //    + (seconds.length == 1 ? '0' + seconds : seconds);
	// r.context().fillText(timeString + ' ' + airports['KBOS'].altimeter(scope.render.bind(scope)), 75, this.line(r, .14, 0));
 //  r.context().fillStyle = this.brite('green');
	// r.context().fillText('OK/OK/OK ', 75, this.line(r, .14, 1));
 //  r.context().fillStyle = this.brite();
 //  r.context().fillText(iata, 75 + r.context().measureText('NA/NA/NA ').width, this.line(r, .14, 1));
	// r.context().fillText('22NM PTL: 3.0', 75, this.line(r, .14, 2));
	// r.context().fillText('N99 999 U N99 999 A', 75, this.line(r, .14, 3));
 //  for (var i = 0; i < ICAOs.length; i++)
 //    r.context().fillText(airports[ICAOs[i]].iata() + ' ' + airports[ICAOs[i]].altimeter(scope.render.bind(scope)), 75, this.line(r, .14, 4 + i));
 //  this._previewLine = 6 + ICAOs.length;
};

TextOverlay.prototype.renderControllers = function(r, controllers) {
  r.context().beginPath();
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'left';
  r.context().textBaseline = 'top';
  r.context().fillStyle = this.brite();
  var textLeft = r.scope().width - 200;
  controllers.forEach(function(controller, line) {
    r.context().fillText(controller.getIdentifier() + ' ' + controller.getName() , textLeft, this.line(r, 0.2, line));
  }.bind(this));
};

TextOverlay.prototype.renderLACAMCI = function(r, cde) {
  r.context().beginPath();
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'left';
  r.context().textBaseline = 'top';
  r.context().fillStyle = this.brite();
  var textLeft = r.scope().width - 200;
  r.context().fillText('LA/CA/MCI', textLeft, this.line(r, .8, 0));
  var conflicts = cde.conflicts();
  for (var i = 0; i < conflicts.length; i++)
    r.context().fillText(conflicts[i] + ' CA', textLeft, this.line(r, .8, 1 + i));
};

TextOverlay.prototype.renderTowerList = function(r, airports, aircraft) {
	var ICAOs = Object.keys(airports);
	var airport = airports[ICAOs[0]];
  var callsigns = Object.keys(aircraft);
  var line = 0;
  callsigns.sort(function(a, b) {
		return aircraft[a].position().distanceTo(airport.position())
		  - aircraft[b].position().distanceTo(airport.position());
	});
	r.context().beginPath();
	r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
	r.context().textAlign = 'left';
	r.context().textBaseline = 'top';
	r.context().fillStyle = this.brite();
	r.context().fillText(airport.iata() + ' TOWER', 75, this.line(r, .45, line++));
  if (callsigns.length > 6)
    r.context().fillText('MORE: 6/' + callsigns.length, 75, this.line(r, .45, line++));
  callsigns.splice(6);
  for (var i = 0; i < callsigns.length; i++) {
    var callsignString = callsigns[i];
    for (var j = 0; j < 7 - callsigns[i].length; j++)
      callsignString += ' ';
    r.context().fillText(callsignString + ' '
      + aircraft[callsigns[i]].type(), 75, this.line(r, .45, line + i));
  }
};

TextOverlay.prototype.renderCRDAStatus = function(r, crda) {
  r.context().beginPath();
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'left';
  r.context().textBaseline = 'top';
  r.context().fillStyle = this.brite();
  r.context().fillText('CRDA STATUS', 75, this.line(r, .8, 0));
  if (crda)
    r.context().fillText(' 1 ' + crda.airport().iata() + ' '
      + crda.master().id() + '/' + crda.slave().id(), 75, this.line(r, .8, 1));
};