function Map(id, name, filename, r, callback) {
	this._id = id;
	this._name = name;
	this._path = [];
	this._brite = 5;
	this._enabled = true;

	if (typeof filename == 'string')
		this.loadFromFile(filename, r, callback);
}

Map.prototype.id = function() {
	return this._id;
};

Map.prototype.name = function() {
	return this._name;
};

Map.prototype.enabled = function() {
	return this._enabled;
};

Map.prototype.toggle = function() {
	this._enabled = !this._enabled;
};

Map.prototype.setBrite = function(brite) {
	this._brite = brite;
};

Map.prototype.loadFromFile = function(filename, r, callback) {
	var map = this;
	$.get(filename, function(data) {
		map.addMapPath(data.split('\n'), r);
		callback();
	});
};

Map.prototype.addMapPath = function(pathList, r) {
	// Loop through map file
	for (var line in pathList) {
		var lineData = pathList[line].trim().split(' ');
		if (lineData.length >= 4) {
			var subpath = [];
			// Loop through each coordinate in line
			subpath[0] = parseFloat(lineData[0]);
			if (!isNaN(subpath[0])) {
				for (var n = 1; n < 4; n++)
					subpath[n] = parseFloat(lineData[n]);
			} else {
				for (var i in lineData) {
					if (i < 4) {
						var lineDataParts = lineData[i].split('.');
						var p1 = parseInt(lineDataParts[0].replace('N', '+').replace('E', '+').replace('S', '-').replace('W', '-'));
						var p2 = parseInt(lineDataParts[1].replace('N', '+').replace('E', '+').replace('S', '-').replace('W', '-'));
						var p3 = parseInt(lineDataParts[2].replace('N', '+').replace('E', '+').replace('S', '-').replace('W', '-'));
						var p4 = parseInt(lineDataParts[3].replace('N', '+').replace('E', '+').replace('S', '-').replace('W', '-'));
						if (p1 < 0) {
							subpath[i] = -1 * (-1 * p1 + p2 / 60 + (parseFloat(p3 + '.' + p4)) / 3600);
						} else {
							subpath[i] = p1 + p2 / 60 + (parseFloat(p3 + '.' + p4)) / 3600;
						}
					}
				}
			}
			// Update the minimum and maximum coordinates
			r.setMinLat(Math.min(r.minLat(), subpath[0], subpath[2]));
			r.setMinLon(Math.min(r.minLon(), subpath[1], subpath[3]));
			r.setMaxLat(Math.max(r.maxLat(), subpath[0], subpath[2]));
			r.setMaxLon(Math.max(r.maxLon(), subpath[1], subpath[3]));
			// Add the line to the list of lines
			this._path[line] = subpath;
		}
	}
	// Calculate the midpoint of the rendered scope map	
	var scopeCorner = new LatLon(r.minLat(), r.minLon());
	var scopeMidpoint = scopeCorner.midpointTo(new LatLon(r.maxLat(), r.maxLon()));
	r.setMidLat(scopeMidpoint._lat);
	r.setMidLon(scopeMidpoint._lon);
};

Map.prototype.render = function(r) {
	if (this._enabled) {
		r.context().lineWidth = 1.5;
		r.context().strokeStyle = r.brite(this._brite);
		// Render each line
		for (var line in this._path) {
			var from = r.gtoc(this._path[line][0], this._path[line][1]);
			var to = r.gtoc(this._path[line][2], this._path[line][3]);
			// Draw a scaled line
			r.context().beginPath();
			r.context().moveTo(from.x, from.y);
			r.context().lineTo(to.x, to.y);
			r.context().stroke();
		}
	}
};