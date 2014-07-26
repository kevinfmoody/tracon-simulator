function AircraftPerformance(category) {
	this._climbRate = 2000; // feet per minute
	this._turnRate = 3; // degrees per second
	this._accelerationRate = 1; // knots per second
	this._bankAngle = 25; // degrees
	this._smoothAltitude = 18000;
	this._vref = 140;

	if (typeof category == 'string')
		this.loadFromCategory(category);
}

AircraftPerformance.prototype.loadFromCategory = function(category) {
	if (category == 'J') {
		this._climbRate = 2000; // feet per minute
		this._turnRate = 3; // degrees per second
		this._accelerationRate = 1; // knots per second
	}
};

AircraftPerformance.prototype.climbRate = function() {
	return this._climbRate / 60;
};

AircraftPerformance.prototype.turnRate = function() {
	return this._turnRate;
};

AircraftPerformance.prototype.accelerationRate = function() {
	return this._accelerationRate;
};

AircraftPerformance.prototype.bankAngle = function(alt) {
	var altitude = alt || 0;
	return alt >= this._smoothAltitude ? this._bankAngle * .4 : this._bankAngle;
};

AircraftPerformance.prototype.vref = function() {
	return this._vref;
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = AircraftPerformance;
}