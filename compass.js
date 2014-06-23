function Compass() {
	this._display = true;
	this._brite = 5;
	this._notchLength = 12;
}

Compass.prototype.render = function(r) {
	if (this._display) {
		r.context().strokeStyle = r.brite(this._brite);
		r.context().lineWidth = 1;
		var radius = Math.sqrt(Math.pow(r.scope().width / 2, 2) + Math.pow(r.scope().height / 2, 2));
		// Draw each notch on the scope
		for (var i = 0; i < 360; i += 5) {
			var from = (i - 95) / 180 * Math.PI;
			var to = (i - 90) / 180 * Math.PI;
			r.context().beginPath();
			r.context().arc(r.scope().width / 2, r.scope().height / 2, radius, from, to);
			r.context().lineTo(r.scope().width / 2, r.scope().height / 2);
			r.context().stroke();
		}
		// Erase the middle of the scope to show only the notches
		r.context().beginPath();
		r.context().rect(this._notchLength, this._notchLength, r.scope().width - this._notchLength * 2, r.scope().height - this._notchLength * 2);
		r.context().fillStyle = r.background();
		r.context().fill();
		// Draw each heading label on the scope
		for (var i = 0; i < 360; i += 10) {
			var radiusX = 1 / Math.abs(Math.cos(i / 180 * Math.PI)) * (r.scope().height / 2 - (this._notchLength + 15));
			var radiusY = 1 / Math.abs(Math.sin(i / 180 * Math.PI)) * (r.scope().width / 2 - (this._notchLength + 15));
			var radius = radiusX < radiusY ? radiusX : radiusY;
			var angle = (i - 90) / 180 * Math.PI;
			var x = r.scope().width / 2 + Math.cos(angle) * radius;
			var y = r.scope().height / 2 + Math.sin(angle) * radius;
			r.context().beginPath();
			r.context().font = '10px Oxygen Mono';
			r.context().textAlign = 'center';
			r.context().textBaseline = 'middle';
			r.context().fillStyle = r.brite(this._brite);
			r.context().fillText(r.pad(i, 3, true), x, y);
		}
	}
};