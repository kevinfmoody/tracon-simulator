function Renderer() {
	this._created = new Date().getTime();
	this._targetHistory = true;
	this._last = this._created;
	this._scope;
	this._context;
	this._background = '#000';
	this._magVar = 0;
	this._minLat = 90;
	this._minLon = 180;
	this._midLat = 0;
	this._midLon = 0;
	this._maxLat = -90;
	this._maxLon = -180;
	this._globalScale = 1.0;
	this._radarCenter = {};
	this._translation = {
		lastMousePosition: {
			x: 0,
			y: 0,
		},
		offset: {
			x: 0,
			y: 0
		}
	};
	this._presets = [];
	this._mouseDown = false;
}

Renderer.prototype.bind = function(scope) {
	this._scope = $(scope)[0];
	this._context = this._scope.getContext('2d');
};

Renderer.prototype.scope = function() {
	return this._scope;
};

Renderer.prototype.context = function() {
	return this._context;
};

Renderer.prototype.inBounds = function(lat, lon) {
	var pos = this.gtoc(lat, lon);
	return pos.x >= 0 && pos.y >= 0 && pos.x <= this._scope.width && pos.y <= this._scope.height;
};

Renderer.prototype.elapsed = function() {
	return new Date().getTime() - this._created;
};

Renderer.prototype.enableTargetHistory = function() {
	this._targetHistory = true;
};

Renderer.prototype.disableTargetHistory = function() {
	this._targetHistory = false;
};

Renderer.prototype.targetHistory = function() {
	return this._targetHistory;
};

Renderer.prototype.setMinLat = function(minLat) {
	this._minLat = minLat;
};

Renderer.prototype.setMinLon = function(minLon) {
	this._minLon = minLon;
};

Renderer.prototype.setMidLat = function(midLat) {
	this._midLat = midLat;
};

Renderer.prototype.setMidLon = function(midLon) {
	this._midLon = midLon;
};

Renderer.prototype.setMaxLat = function(maxLat) {
	this._maxLat = maxLat;
};

Renderer.prototype.setMaxLon = function(maxLon) {
	this._maxLon = maxLon;
};

Renderer.prototype.minLat = function() {
	return this._minLat;
};

Renderer.prototype.minLon = function() {
	return this._minLon;
};

Renderer.prototype.midLat = function() {
	return this._midLat;
};

Renderer.prototype.midLon = function() {
	return this._midLon;
};

Renderer.prototype.maxLat = function() {
	return this._maxLat;
};

Renderer.prototype.maxLon = function() {
	return this._maxLon;
};

Renderer.prototype.scope = function() {
	return this._scope;
};

Renderer.prototype.context = function() {
	return this._context;
};

Renderer.prototype.background = function() {
	return this._background;
};

Renderer.prototype.radarCenter = function() {
	var lat, lon;
	if (this._radarCenter.lat) {
		lat = this._radarCenter.lat;
		lon = this._radarCenter.lon;
	} else {
		lat = this._midLat;
		lon = this._midLon;
	}
	return this.gtoc(lat, lon);
};

Renderer.prototype.radarCenterPosition = function() {
	var lat, lon;
	if (this._radarCenter.lat) {
		lat = this._radarCenter.lat;
		lon = this._radarCenter.lon;
	} else {
		lat = this._midLat;
		lon = this._midLon;
	}
	return new LatLon(lat, lon);
};

Renderer.prototype.setRadarCenter = function(position) {
	this._radarCenter = {
		lat: position._lat,
		lon: position._lon
	};
};

Renderer.prototype.magVar = function() {
	return this._magVar;
};

Renderer.prototype.setMagVar = function(magVar) {
	this._magVar = magVar;
};

Renderer.prototype.globalScale = function() {
	return this._globalScale;
};

Renderer.prototype.setGlobalScale = function(globalScale) {
	this._globalScale = globalScale;
};

Renderer.prototype.lastMousePosition = function() {
	return this._translation.lastMousePosition;
};

Renderer.prototype.setLastMousePosition = function(lastMousePosition) {
	this._translation.lastMousePosition = lastMousePosition;
};

Renderer.prototype.translationOffset = function() {
	return this._translation.offset;
};

Renderer.prototype.setTranslationOffset = function(translationOffset) {
	this._translation.offset = translationOffset;
};

Renderer.prototype.mouseDown = function() {
	return this._mouseDown;
};

Renderer.prototype.setMouseDown = function(mouseDown) {
	if (mouseDown && !this._mouseDown)
		this._dragging = false;
	this._mouseDown = mouseDown;
};

Renderer.prototype.dragging = function() {
	this._dragging = true;
};

Renderer.prototype.wasDragging = function() {
	return this._dragging;
};

Renderer.prototype.latRange = function() {
	return this._maxLat - this._minLat;
};

Renderer.prototype.lonRange = function() {
	return this._maxLon - this._minLon;
};

Renderer.prototype.scaledLatRange = function(lat) {
	return this.latRange() * (1 / Math.cos(lat / 180 * Math.PI));
};

Renderer.prototype.multiplier = function(lat) {
	return this._scope.height / this.scaledLatRange(lat);
};

Renderer.prototype.scaleX = function(lat, lon) {
	return this.gtoc(lat, lon).x;
};

Renderer.prototype.scaleY = function(lat, lon) {
	return this.gtoc(lat, lon).y;
};

Renderer.prototype.brite = function(brite) {
	return '#' + brite * 111;
};

Renderer.prototype.rotate = function(x, y, cx, cy, theta) {
	var rx = x - cx;
	var ry = y - cy;
	theta *= -1;

	var fx = ((Math.cos(theta) * rx - Math.sin(theta) * ry));
	var fy = ((Math.sin(theta) * rx + Math.cos(theta) * ry));

	var mx = fx + cx;
	var my = fy + cy;

	return {
		x: mx,
		y: my
	};
};

Renderer.staticRotate = function(x, y, cx, cy, theta) {
	var rx = x - cx;
	var ry = y - cy;
	theta *= -1;

	var fx = ((Math.cos(theta) * rx - Math.sin(theta) * ry));
	var fy = ((Math.sin(theta) * rx + Math.cos(theta) * ry));

	var mx = fx + cx;
	var my = fy + cy;

	return {
		x: mx,
		y: my
	};
};

Renderer.prototype.gtoc = function(lat, lon) {
	var multiplier = this.multiplier(lat);
	var tx = (multiplier * (lon - this._minLon)) + this._scope.width / 2 - (this.lonRange() * multiplier) / 2;
	var ty = this._scope.height - (multiplier * (1 / Math.cos(lat / 180 * Math.PI)) * (lat - this._minLat));

	var rx = tx - this._scope.width / 2;
	var ry = this._scope.height / 2 - ty;
	var theta = this._magVar / 180 * Math.PI;

	var fx = ((Math.cos(theta) * rx - Math.sin(theta) * ry)) * this._globalScale + this._translation.offset.x * this._globalScale;
	var fy = ((Math.sin(theta) * rx + Math.cos(theta) * ry)) * this._globalScale + this._translation.offset.y * this._globalScale;

	var mx = fx + this._scope.width / 2;
	var my = this._scope.height / 2 - fy;

	return {
		x: mx,
		y: my
	};
};

Renderer.prototype.ctop = function(x, y) {
	var fy = this._scope.height / 2 - y;
	var fx = x - this._scope.width / 2;
	
	var bry = (fy - this._translation.offset.y * this._globalScale) / this._globalScale;
	var brx = (fx - this._translation.offset.x * this._globalScale) / this._globalScale;

	var theta = this._magVar / 180 * Math.PI;
	var ry = (Math.cos(theta) * bry - Math.sin(theta) * brx) /
		(Math.pow(Math.sin(theta), 2) + Math.pow(Math.cos(theta), 2));
	var rx = (bry - Math.cos(theta) * ry) / Math.sin(theta);

	var ty = this._scope.height / 2 - ry;
	var tx = rx + this._scope.width / 2;

	var lat = (this.latRange() * (this._scope.height - ty) + this._scope.height * this._minLat) / this._scope.height;
	var multiplier = this._scope.height * Math.cos(lat / 180 * Math.PI) / this.latRange();
	var lon = (2 * tx - this._scope.width + 2 * this._minLon * multiplier + this.lonRange() * multiplier) / (2 * multiplier);
	
	return new LatLon(lat, lon);
};

Renderer.prototype.distanceToPixels = function(position, course, distance) {
	var pos = this.gtoc(position._lat, position._lon),
			dest = position.destinationPoint(course, distance / 0.539957),
			nPos = this.gtoc(dest._lat, dest._lon);
	return Math.sqrt(Math.pow(nPos.x - pos.x, 2) + Math.pow(nPos.y - pos.y, 2));
};

Renderer.prototype.setPreset = function(slot) {
	this._presets[slot] = {
		scale: this._globalScale,
		translation: {
			x: this._translation.offset.x,
			y: this._translation.offset.y
		}
	};
};

Renderer.prototype.selectPreset = function(slot) {
	var preset = this._presets[slot];
	if (preset) {
		this._globalScale = preset.scale;
		this._translation.offset = preset.translation;
	}
};

Renderer.prototype.scale = function(value) {
	return value / this._globalScale;
};

Renderer.prototype.adjustForMagVar = function() {
	this._context.translate(this._scope.width / 2, this._scope.height / 2);
	this._context.rotate(-this._magVar / 180 * Math.PI);
	this._context.translate(-this._scope.width / 2, -this._scope.height / 2);
};

Renderer.prototype.pad = function (string, length, heading) {
	s = string == 0 && heading ? 360 : string;
	var s = "00000" + s;
  	return s.substr(s.length - length);
};

Renderer.prototype.angleBetweenHeadings = function(primaryHeading, secondaryHeading) {
  var gap = Math.abs(primaryHeading - secondaryHeading);
  return Math.min(gap, 360 - gap);
};

Renderer.prototype.angleBetween = function(ax, ay, bx, by) {
	// y's are flipped because the positive direction in HTML canvas is down
	return Math.atan2((ay - by), (bx - ax));
};