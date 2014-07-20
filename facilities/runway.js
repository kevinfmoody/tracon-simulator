function Runway(id, lat, lon, elevation, length, width, course) {
	this._id = id;
	this._lat = lat;
	this._lon = lon;
	this._elevation = elevation;
	this._length = length;
	this._width = width;
	this._course = course;
	this._ILSCapable = false;
}

Runway.prototype.enableILS = function() {
	this._ILSCapable = true;
};

Runway.prototype.disableILS = function() {
	this._ILSCapable = false;
};

Runway.prototype.hasILS = function() {
	return this._ILSCapable;
};

Runway.prototype.id = function() {
	return this._id;
};

Runway.prototype.position = function() {
  return new LatLon(this._lat, this._lon);
};

Runway.prototype.lat = function() {
	return this._lat;
};

Runway.prototype.lon = function() {
	return this._lon;
};

Runway.prototype.elevation = function() {
	return this._elevation;
};

Runway.prototype.length = function() {
	return this._length;
};

Runway.prototype.width = function() {
	return this._width;
};

Runway.prototype.course = function() {
	return this._course;
};