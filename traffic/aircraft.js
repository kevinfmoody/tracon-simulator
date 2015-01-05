var AircraftPerformance,
		Autopilot,
		LatLon;

//var VATSIM = require('../server/vatsim/vatsim.js'),
//		Flow = require('../server/Flow.js');

if (typeof module !== 'undefined' && module.exports) {
  AircraftPerformance = require('./aircraftperformance.js');
  Autopilot = require('./autopilot.js');
  LatLon = require('../latlon.js');
}

function Aircraft(aircraftString, mio, pio) {
	// this._v = new VATSIM();
	// this._v.client().connect();
	// this._flow = currentFlow;
	this._mio = mio;
	this._pio = pio;

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
	this._controller = null;
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

	if (typeof aircraftString == 'string') {
		this.loadFromString(aircraftString);

		// this._v.pilot().addPilot({
		// 	from: this.callsign(),
		// 	cid: '5!MP!L0T',
		// 	password: '5!MTR@C0N',
		// 	name: 'Captain Sim'
		// });
	}

	if (this.callsign() === 'ICE98') {
		this._autopilot.ACTIVE_LEGS.unshift({
			startPosition: this.position(),
			endPosition: this._autopilot.ACTIVE_LEGS[0].startPosition
		});
	}

	setInterval(function() {
		var blip = this.blip();
		if (blip) {
			this._mio.emit('blip', blip);
			this._pio.emit('blip', blip);
		}
	}.bind(this), 5000);
}

Aircraft.prototype.controller = function() {
	return this._controller;
};

Aircraft.prototype.controllerIdentifier = function() {
	var controller = this.controller();
	return controller ? controller.getIdentifier() : '';
};

Aircraft.prototype.setController = function(controller) {
	this._controller = controller;
};

Aircraft.prototype.autopilot = function() {
	return this._autopilot;
};

Aircraft.prototype.blip = function() {
	// try {
	// 	var position = this._flow.project(this.position(), 5),
	// 			average = this._flow.average(position);
	// 	return {
	// 		callsign: this.callsign(),
	// 		mode: this.mode(),
	// 		type: this.type(),
	// 		arrival: this.arrival(),
	// 		position: position,
	// 		altitude: average.altitude !== -1 ? average.altitude : this.altitude(),
	// 		speed: average.speed !== -1 ? average.speed : this.groundspeed(),
	// 		squawk: this.squawk()
	// 	};
	// } catch (err) {
	// 	switch (err) {
	// 		case Flow.ERROR.NO_DATA:
				return {
					callsign: this.callsign(),
					mode: this.mode(),
					type: this.type(),
					arrival: this.arrival(),
					position: this.position(),
					altitude: this.altitude(),
					speed: this.groundspeed(),
					squawk: this.squawk(),
					controller: this.controllerIdentifier()
				};
	// 		default:
	// 			return null;
	// 	}
	// }
};

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

Aircraft.prototype.flyQuick = function(elapsedSituation, r) {
	this.updateElapsed(elapsedSituation);
	this._lastSimulated = elapsedSituation;
	if (!this._autopilot.fly(r)) {
		this.updateHistory();
		this.updatePosition(this.updateHeading(), this.updateSpeed(), this.updateAltitude(), r);
		this.updateAssignments();
	}
};

Aircraft.prototype.updateHistory = function() {
	this._history.unshift(this.position());
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

Aircraft.prototype.updatePositionQuick = function(pastHeading, pastSpeed, pastAltitude) {
	var averageHeading = (this._heading + pastHeading) / 2;
	var averageSpeed = this.groundspeed((this._speed + pastSpeed) / 2, (this._altitude + pastAltitude) / 2, averageHeading);
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
	this._callsign = segments[0].trim();
	this._type = segments[1].trim();
	this._category = segments[2].trim();
	this._flightRules = segments[3].trim();
	this._departure = segments[4].trim();
	this._arrival = segments[5].trim();
	this._cuiseAltitude = parseInt(segments[6].trim(), 10);
	this._route = segments[7].trim();
	this._remarks = segments[8].trim();
	this._squawk = segments[9].trim();
	this._squawkMode = segments[10].trim();
	this._lat = parseFloat(segments[11].trim());
	this._lon = parseFloat(segments[12].trim());
	this._altitude = parseInt(segments[13].trim(), 10);
	this._speed = parseInt(segments[14].trim(), 10);
	this._heading = parseInt(segments[15].trim(), 10);
	this._performance.loadFromCategory(this._category);
};

Aircraft.prototype.update = function(aircraft, aircraftList, elapsedSituation) {
  if (aircraftList[aircraft.callsign()] && (aircraftList[aircraft.callsign()].lat() != aircraft.lat()
      || aircraftList[aircraft.callsign()].lon() != aircraft.lon())) {
    this._lastSimulated = elapsedSituation;
    this._lat = aircraft.lat();
    this._lon = aircraft.lon();
    this._heading = aircraft.heading();
    this._altitude = aircraft.altitude();
    this._speed = aircraft.speed();
  }
};

Aircraft.prototype.mode = function() {
	return 1;
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

Aircraft.prototype.track = function() {
	var pos2 = this._history[0],
			pos1 = this._history[1];
	if (pos1 && pos2)
		return pos1.bearingTo(pos2);
	else
		return heading;
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

Aircraft.prototype.groundspeed = function(airspeed, altitude, heading) {
	var WIND_DIRECTION = 270,
			WIND_SPEED = 0;
	
	var radians = this._autopilot.angleBetween(WIND_DIRECTION, (heading ? heading : this._heading)) / 180 * Math.PI;
	var correction = WIND_SPEED * Math.cos(radians);
	
	return (altitude ? altitude : this._altitude) / 200 + (airspeed ? airspeed : this._speed)- correction;
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

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Aircraft;
}