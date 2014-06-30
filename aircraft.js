function Aircraft(aircraftString) {
	this._conflicting = false;
	this._selected = false;
	this._lastSimulated = 0;
	this._elapsed = 0;
	this._callsign;
	this._type;
	this._category;
	this._flightRules;
	this._departure;
	this._arrival;
	this._cuiseAltitude;
	this._route;
	this._remarks;
	this._squawk;
	this._squawkMode;
	this._lat;
	this._lon;
	this._altitude;
	this._speed;
	this._heading;
	this._history = [];
	this._performance = new AircraftPerformance();
	this._autopilot = new Autopilot(this);
	this._controlled = false;
	this._assignments = {
		// altitude: {
		// 	value: 5000,
		// 	delay: 15000
		// },
		// speed: {
		// 	value: 140,
		// 	delay: 5000
		// },
		// heading: {
		// 	value: 360,
		// 	delay: 5500
		// }
	};
	this._styles = {
		uncontrolled: '#0f0',
		controlled: '#fff',
		selected: '#0ff',
		pointout: '#ff0'
	};

	if (typeof aircraftString == 'string')
		this.loadFromString(aircraftString);
}

Aircraft.prototype.initiateControl = function() {
	this._controlled = true;
};

Aircraft.prototype.terminateControl = function() {
	this._controlled = false;
};

Aircraft.prototype.updateElapsed = function(elapsedSituation) {
	this._elapsed = elapsedSituation - this._lastSimulated;
};

Aircraft.prototype.updateAssignments = function() {
	for (var i in this._assignments)
		if (this._assignments[i].delay >= 0)
			this._assignments[i].delay = Math.max(0, this._assignments[i].delay - this._elapsed);
};

Aircraft.prototype.assignmentFunction = function(t, type, rateFunction, updateAssignment) {
	if (this._assignments[type] && t >= this._assignments[type].delay) {
		var deltaTotal = this._assignments[type].value - this['_' + type];
		var deltaSign = deltaTotal < 0 ? -1 : 1;
		var elapsed = t - this._assignments[type].delay;
		var delta = deltaSign * rateFunction() * (elapsed / 1000);
		if (Math.abs(delta) >= Math.abs(deltaTotal) || deltaTotal == 0) {
			delta = deltaTotal;
			if (updateAssignment)
				delete this._assignments[type];
		}
		return this['_' + type] + delta;
	}
	return this['_' + type];
};

Aircraft.prototype.altitudeFunction = function(t, updateAssignment) {
	var aircraft = this;
	return this.assignmentFunction(t, 'altitude', function() {
		return aircraft._performance.climbRate();
	}, updateAssignment);
};

Aircraft.prototype.speedFunction = function(t, updateAssignment) {
	var aircraft = this;
	return this.assignmentFunction(t, 'speed', function() {
		return aircraft._performance.accelerationRate();
	}, updateAssignment);
};

Aircraft.prototype.headingFunction = function(t, updateAssignment) {
	if (this._assignments.heading && t >= this._assignments.heading.delay) {
		var deltaTotal = (this._assignments.heading.value - this._heading + 360) % 360;
		if (Math.abs(deltaTotal - 360) < deltaTotal)
			deltaTotal -= 360;
		var deltaSign = deltaTotal < 0 ? -1 : 1;
		var elapsed = t - this._assignments.heading.delay;
		var delta = deltaSign * this._performance.turnRate() * (elapsed / 1000);
		if (Math.abs(delta) >= Math.abs(deltaTotal) || deltaTotal == 0) {
			delta = deltaTotal;
			if (updateAssignment)
				delete this._assignments.heading;
		}
		return (this._heading + delta) % 360;
	}
	return this._heading;
};

Aircraft.prototype.positionFunction = function(t, updateAssignment) {
	var averageHeading = (this._heading + pastHeading) / 2 + r.magVar();
	var averageSpeed = this.groundspeed((this._speed + pastSpeed) / 2, (this._altitude + pastAltitude) / 2);
	var distance = averageSpeed * this._elapsed * 1.852 / 3600000;
	var destination = new LatLon(this._lat, this._lon).destinationPoint(averageHeading, distance);
	this._lat = destination._lat;
	this._lon = destination._lon;
};

Aircraft.prototype.trueAirspeedFunction = function(t) {
	return this.altitudeFunction(t) / 200 + this.speedFunction(t);
};

Aircraft.prototype.trueGroundspeedFunction = function(t) {
	return this.trueAirspeedFunction(t);
};

Aircraft.prototype.turnRadius = function() {
	var gravity = 9.80665; // meters per second
	var metersInNauticalMile = 1852;
	var metersPerSecondInKnot = 0.514444;
	var bankAngle = this._performance.bankAngle(this._altitude) * Math.PI / 180;
	return (Math.pow(this.groundspeed() * metersPerSecondInKnot, 2) / (gravity * Math.tan(bankAngle))) / metersInNauticalMile;
};

Aircraft.prototype.headingDelta = function(turnRadius) {
	var radius = turnRadius || this.turnRadius();
	return ((this.groundspeed() / 3600) * (this._elapsed / 1000)) / (radius * 2 * Math.PI) * 360;
};

Aircraft.prototype.fly = function(r, elapsedSituation) {
	this.updateElapsed(elapsedSituation);
	if (this._elapsed >= 5000) {
		this._lastSimulated = elapsedSituation;
		if (!this._autopilot.fly(r)) {
			this.updateHistory();
			this.updatePosition(this.updateHeading(), this.updateSpeed(), this.updateAltitude(), r);
			this.updateAssignments();
		}
	}
};

Aircraft.prototype.updateHistory = function() {
	this._history.unshift({
		lat: this._lat,
		lon: this._lon
	});
	if (this._history.length > 5)
		this._history.pop();
};

Aircraft.prototype.updatePosition = function(pastHeading, pastSpeed, pastAltitude, r) {
	var averageHeading = (this._heading + pastHeading) / 2 + r.magVar();
	var averageSpeed = this.groundspeed((this._speed + pastSpeed) / 2, (this._altitude + pastAltitude) / 2);
	var distance = averageSpeed * this._elapsed * 1.852 / 3600000;
	var destination = new LatLon(this._lat, this._lon).destinationPoint(averageHeading, distance);
	this._lat = destination._lat;
	this._lon = destination._lon;
};

Aircraft.prototype.updateHeading = function() {
	var heading = this._heading;
	this._heading = this.headingFunction(this._elapsed, true);
	return heading;
};

Aircraft.prototype.updateSpeed = function() {
	var speed = this._speed;
	this._speed = this.speedFunction(this._elapsed, true);
	return speed;
};

Aircraft.prototype.updateAltitude = function() {
	var altitude = this._altitude;
	this._altitude = this.altitudeFunction(this._elapsed, true);
	return altitude;
};

Aircraft.prototype.updateElapsed = function(elapsedSituation) {
	this._elapsed = elapsedSituation - this._lastSimulated;
};

Aircraft.prototype.assignHeading = function(heading, elapsedSituation, delay) {
	this.assign('heading', heading, elapsedSituation, delay);
};

Aircraft.prototype.assignSpeed = function(speed, elapsedSituation, delay) {
	this.assign('speed', speed, elapsedSituation, delay);
};

Aircraft.prototype.assignAltitude = function(altitude, elapsedSituation, delay) {
	this.assign('altitude', altitude, elapsedSituation, delay);
};

Aircraft.prototype.assign = function(type, value, elapsedSituation, delay) {
	this._assignments[type] = {
		value: value,
		delay: this.delay(elapsedSituation, delay)
	};
};

Aircraft.prototype.delay = function(elapsedSituation, delay) {
	return (delay || 0) + elapsedSituation - this._lastSimulated;
};

Aircraft.prototype.loadFromString = function(aircraftString) {
	var segments = aircraftString.split(':');
	this._callsign = $.trim(segments[0]);
	this._type = $.trim(segments[1]);
	this._category = $.trim(segments[2]);
	this._flightRules = $.trim(segments[3]);
	this._departure = $.trim(segments[4]);
	this._arrival = $.trim(segments[5]);
	this._cuiseAltitude = parseInt($.trim(segments[6]));
	this._route = $.trim(segments[7]);
	this._remarks = $.trim(segments[8]);
	this._squawk = $.trim(segments[9]);
	this._squawkMode = $.trim(segments[10]);
	this._lat = parseFloat($.trim(segments[11]));
	this._lon = parseFloat($.trim(segments[12]));
	this._altitude = parseInt($.trim(segments[13]));
	this._speed = parseInt($.trim(segments[14]));
	this._heading = parseInt($.trim(segments[15]));
	this._performance.loadFromCategory(this._category);
};

Aircraft.prototype.update = function(aircraft, aircraftList, elapsedSituation) {
  //console.log(aircraftList[aircraft.callsign()]);
  //console.log(aircraft);
  if (aircraftList[aircraft.callsign()] && (aircraftList[aircraft.callsign()].lat() != aircraft.lat()
      || aircraftList[aircraft.callsign()].lon() != aircraft.lon())) {
    //console.log('updating ' + this._callsign);
    this._lastSimulated = elapsedSituation;
    this._lat = aircraft.lat();
    this._lon = aircraft.lon();
    this._heading = aircraft.heading();
    this._altitude = aircraft.altitude();
    this._speed = aircraft.speed();
  }
};

Aircraft.prototype.callsign = function() {
	return this._callsign;
};

Aircraft.prototype.type = function() {
	return this._type;
};

Aircraft.prototype.category = function() {
	return this._category;
};

Aircraft.prototype.flightRules = function() {
	return this._flightRules;
};

Aircraft.prototype.departure = function() {
	return this._departure;
};

Aircraft.prototype.arrival = function() {
	return this._arrival;
};

Aircraft.prototype.cruiseAltitude = function() {
	return this._cruiseAltitude;
};

Aircraft.prototype.route = function() {
	return this._route;
};

Aircraft.prototype.remarks = function() {
	return this._remarks;
};

Aircraft.prototype.squawk = function() {
	return this._squawk;
};

Aircraft.prototype.squawkMode = function() {
	return this._squawkMode;
};

Aircraft.prototype.lat = function() {
	return this._lat;
};

Aircraft.prototype.lon = function() {
	return this._lon;
};

Aircraft.prototype.position = function() {
	return new LatLon(this._lat, this._lon);
};

Aircraft.prototype.altitude = function() {
	return this._altitude;
};

Aircraft.prototype.speed = function() {
	return this._speed;
};

Aircraft.prototype.heading = function() {
	return this._heading;
};

Aircraft.prototype.performance = function() {
	return this._performance;
};

Aircraft.prototype.setCallsign = function(callsign) {
	this._callsign = callsign;
};

Aircraft.prototype.setType = function(type) {
	this._type = type;
};

Aircraft.prototype.setCategory = function(category) {
	this._category = category;
};

Aircraft.prototype.setFlightRules = function(flightRules) {
	this._flightRules = flightRules;
};

Aircraft.prototype.setDeparture = function(departure) {
	this._departure = departure;
};

Aircraft.prototype.setArrival = function(arrival) {
	this._arrival = arrival;
};

Aircraft.prototype.setCruiseAltitude = function(cruiseAltitude) {
	this._cruiseAltitude = cruiseAltitude;
};

Aircraft.prototype.setRoute = function(route) {
	this._route = route;
};

Aircraft.prototype.setRemarks = function(remarks) {
	this._remarks = remarks;
};

Aircraft.prototype.setSquawk = function(squawk) {
	this._squawk = squawk;
};

Aircraft.prototype.setSquawkMode = function(squawkMode) {
	this._squawkMode = squawkMode;
};

Aircraft.prototype.setLat = function(lat) {
	this._lat = lat;
};

Aircraft.prototype.setLon = function(lon) {
	this._lon = lon;
};

Aircraft.prototype.setAltitude = function(altitude) {
	this._altitude = altitude;
};

Aircraft.prototype.setSpeed = function(speed) {
	this._speed = speed;
};

Aircraft.prototype.setHeading = function(heading) {
	this._heading = heading;
};

Aircraft.prototype.setLastSimulated = function(lastSimulated) {
  this._lastSimulated = lastSimulated;
};

Aircraft.prototype.groundspeed = function(airspeed, altitude) {
	//var radians = angleBetween(Setting.wind.direction, this.heading) / 180 * Math.PI;
	//var correction = Setting.wind.speed * Math.cos(radians);
	return (altitude ? altitude : this._altitude) / 200 + (airspeed ? airspeed : this._speed);// - correction;
};

Aircraft.prototype.airspeed = function(groundspeed, altitude) {
  //var radians = angleBetween(Setting.wind.direction, this.heading) / 180 * Math.PI;
  //var correction = Setting.wind.speed * Math.cos(radians);
  return groundspeed ? (groundspeed - (altitude ? altitude : this._altitude) / 200) : this._speed;// - correction;
};

Aircraft.prototype.targetColor = function() {
	return this._controlled ? this._styles.controlled : this._styles.uncontrolled;
};

Aircraft.prototype.targetCode = function() {
	return this._controlled ? 'A' : '*';
};

Aircraft.prototype.select = function() {
	this._selected = true;
};

Aircraft.prototype.deselect = function() {
	this._selected = false;
};

Aircraft.prototype.setConflicting = function(conflicting) {
	this._conflicting = conflicting;
};

Aircraft.prototype.renderHistory = function(r) {
	if (r.targetHistory()) {
		r.context().fillStyle = '#00f';
		for (var i in this._history) {
			var historyPos = r.gtoc(this._history[i].lat, this._history[i].lon);
			r.context().beginPath();
			r.context().arc(historyPos.x, historyPos.y, 5 - Math.floor(i / 2), 0, 2 * Math.PI);
			r.context().globalAlpha = .5 - i / 10;
			r.context().fill();
		}
		r.context().globalAlpha = 1;
	}
};

Aircraft.prototype.renderTarget = function(r) {
	// Determine size of beacon based on distance from radar site
	var radarDistance = r.radarCenterPosition().distanceTo(this.position()) * 0.539957;
	var beaconWidth = Math.min(Math.max(4 * Math.sqrt(radarDistance), 4), 32);
	var acPos = r.gtoc(this._lat, this._lon);
	var radarCenter = r.radarCenter();
	var theta = r.angleBetween(acPos.x, acPos.y, radarCenter.x, radarCenter.y) + Math.PI / 2;
	// Draw the beacon line
	var lineL = r.rotate(-beaconWidth, 0, 0, 0, theta);
	var lineR = r.rotate(beaconWidth, 0, 0, 0, theta);
	r.context().beginPath();
	r.context().moveTo(acPos.x + lineL.x, acPos.y + lineL.y);
	r.context().lineTo(acPos.x + lineR.x, acPos.y + lineR.y);
	r.context().strokeStyle = '#1e582f';
	r.context().lineWidth = 2;
	r.context().stroke();
	// Draw the beacon target
	var boxBL = r.rotate(-beaconWidth / 2, 0, 0, 0, theta);
	var boxTL = r.rotate(-beaconWidth / 2, 9, 0, 0, theta);
	var boxTR = r.rotate(beaconWidth / 2, 9, 0, 0, theta);
	var boxBR = r.rotate(beaconWidth / 2, 0, 0, 0, theta);
	r.context().beginPath();
	r.context().moveTo(acPos.x + boxBL.x, acPos.y + boxBL.y);
	r.context().lineTo(acPos.x + boxTL.x, acPos.y + boxTL.y);
	r.context().lineTo(acPos.x + boxTR.x, acPos.y + boxTR.y);
	r.context().lineTo(acPos.x + boxBR.x, acPos.y + boxBR.y);
	r.context().fillStyle = '#2d82ed';
	r.context().fill();
};

Aircraft.prototype.renderPosition = function(r) {
	var acPos = r.gtoc(this._lat, this._lon);
	r.context().beginPath();
	r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
	r.context().textAlign = 'center';
	r.context().textBaseline = 'middle';
	r.context().strokeStyle = '#000';
	r.context().lineWidth = 2;
	r.context().strokeText(this.targetCode(), acPos.x, acPos.y);
	r.context().fillStyle = this.targetColor();
	r.context().fillText(this.targetCode(), acPos.x, acPos.y);
};

Aircraft.prototype.renderDataBlock = function(r, elapsed) {
	var acPos = r.gtoc(this._lat, this._lon);
	var renderColor = this._conflicting ? '#f00' : this.targetColor();
	// Draw the leader line
	r.context().beginPath();
	r.context().moveTo(acPos.x + 10, acPos.y + -10);
	r.context().lineTo(acPos.x + 30, acPos.y + -30);
	r.context().lineWidth = 1;
	r.context().strokeStyle = renderColor;
	r.context().stroke();
	// Draw the target callsign
	r.context().beginPath();
	r.context().imageSmoothingEnabled= false;
	r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
	r.context().textAlign = 'left';
	r.context().textBaseline = 'middle';
	r.context().fillStyle = renderColor;
	r.context().fillText(this._callsign, acPos.x + 35, acPos.y + -35);
	r.context().imageSmoothingEnabled = true;
	// Draw the target aircraft, altitude, and speed data block
	r.context().beginPath();
	r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
	r.context().textAlign = 'left';
	r.context().textBaseline = 'middle';
	r.context().fillStyle = renderColor;
	var scopeSpeed = Math.floor(this.groundspeed() / 10);
	var scopeAltitude = Math.floor(this._altitude / 100);
	r.context().fillText(r.pad(scopeAltitude, 3) + '  ' + (elapsed % 4000 < 2000 ? r.pad(scopeSpeed, 2) : this._type), acPos.x + 35, acPos.y + -20);
};