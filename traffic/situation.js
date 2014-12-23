function Situation(situation) {
	this._aircraft = {};
	this._situation;
	this._paused = true;
	this._lastRun = 0;
	this._elapsed = 0;
	this._cde = new ConflictDetectionEngine();
	this._crda;
	this._conflictsEnabled = false;
	this._slaveFeed;
	this._slaveMode = false;
  this._slaveFeedUpdated = 0;
  this._lastSlaveFeedAircraftList = {};

	if (typeof situation == 'string')
		this.loadFromFile(situation);
}

Situation.prototype.setSlaveFeed = function(feed) {
  this._slaveFeed = feed;
};

Situation.prototype.enableSlaveMode = function() {
	this._slaveMode = true;
};

Situation.prototype.disableSlaveMode = function() {
  this._slaveMode = false;
};

Situation.prototype.setCRDA = function(crda) {
	this._crda = crda;
};

Situation.prototype.CRDA = function() {
	return this._crda;
};

Situation.prototype.CDE = function() {
	return this._cde;
};

Situation.prototype.aircraft = function(callsign) {
	return callsign ? this._aircraft[callsign] : this._aircraft;
};

Situation.prototype.loadFromFile = function(filename) {
	var situation = this;
	$.get(filename, function(data) {
		situation._situation = data.split('\n');
		situation.load();
	});
};

Situation.prototype.load = function() {
	this._aircraft = {};
	for (var i in this._situation) {
		var aircraft = new Aircraft(this._situation[i]);
		this._aircraft[aircraft.callsign()] = aircraft;
	}
}

Situation.prototype.elapsed = function() {
	return this._elapsed + (this._paused ? 0 : new Date().getTime() - this._lastRun);
};

Situation.prototype.run = function() {
	if (this._paused) {
		this._paused = false;
		this._lastRun = new Date().getTime();
	}
};

Situation.prototype.pause = function() {
	if (!this._paused) {
		this._paused = true;
		this._elapsed += new Date().getTime() - this._lastRun;
	}
};

Situation.prototype.select = function(x, y, r) {
	var callsigns = Object.keys(this._aircraft);
	var numAircraft = callsigns.length;
	var selectedAircraft = null;
	var i = 0;
	for (i; i < numAircraft; i++) {
		this._aircraft[callsigns[i]].deselect();
		var coordinates = r.gtoc(this._aircraft[callsigns[i]].lat(), this._aircraft[callsigns[i]].lon());
		var dx = coordinates.x - x;
		var dy = coordinates.y - y;
		var distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
		if (distance < 15) {
      selectedAircraft = this._aircraft[callsigns[i]];
			selectedAircraft.select();
      this._cde.muteAircraft(selectedAircraft, this._aircraft);
      break;
		}
	}
	for (i = i + 1; i < numAircraft; i++)
		this._aircraft[callsigns[i]].deselect();
	return selectedAircraft;
};

Situation.prototype.detectAndRenderConflicts = function() {
	if (this._conflictsEnabled) {
		this._cde.detect(this._aircraft);
		for (var i in this._aircraft)
			this._aircraft[i].setConflicting(this._cde.singleAircraftInConflict(this._aircraft[i]));
		this._cde.manageAlarm();
	}
};

Situation.prototype.updateSlaveFeed = function() {
  if (this._slaveMode) {
    var situation = this;
    this._slaveFeed.inbound(150, function(aircraft, updated) {
      if (updated > situation._slaveFeedUpdated) {
        situation._slaveFeedUpdated = updated;
        for (var callsign in situation._aircraft) {
          if (aircraft[callsign])
            situation._aircraft[callsign].update(aircraft[callsign], this._lastSlaveFeedAircraftList, situation.elapsed());
          else
            delete situation._aircraft[callsign];
        }
        for (var callsign in aircraft)
          if (situation._aircraft[callsign] === undefined)
            situation._aircraft[callsign] = aircraft[callsign];
        this._lastSlaveFeedAircraftList = aircraft;
      }
    });
  }
};

Situation.prototype.render = function(r) {
  this.updateSlaveFeed();
	var elapsedRenderer = r.elapsed();
	var elapsedSituation = this.elapsed();
	for (var i in this._aircraft)
		this._aircraft[i].fly(r, elapsedSituation);
	var aircraftInRange = [];
	this.detectAndRenderConflicts();
	for (var i in this._aircraft) {
		if (this._crda)
			this._crda.ghostAircraft(this._aircraft[i]);
		if (r.inBounds(this._aircraft[i].lat(), this._aircraft[i].lon()))
			aircraftInRange.push(this._aircraft[i]);
	}
	for (var i in aircraftInRange)
		aircraftInRange[i].renderHistory(r);
	for (var i in aircraftInRange)
		aircraftInRange[i].renderTarget(r);
	for (var i in aircraftInRange)
		aircraftInRange[i].renderPosition(r);
	for (var i in aircraftInRange)
		aircraftInRange[i].renderDataBlock(r, elapsedRenderer);
};