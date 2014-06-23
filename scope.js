function Scope() {
	this._maps = {};
	this._airports = {};
	this._situation = new Situation;
	this._renderer = new Renderer;
	this._compass = new Compass;
	this._textOverlay = new TextOverlay(this);
	this._flow = new Flow();
	//this._weatherOverlay = new WeatherOverlay;

	/*var self = this;
	setTimeout(function() {
		self._weatherOverlay.refresh(self._renderer);
	}, 5000);*/
}

Scope.prototype.select = function(x, y) {
	var aircraft = this._situation.select(x, y, this._renderer);
	if (aircraft) {
		this._textOverlay.clearPreview();
		this._textOverlay.addPreviewChar(aircraft.callsign());
		this._textOverlay.addPreviewChar(' ');
		this.render();
		return true;
	}
	this.render();
	return false;
};

Scope.prototype.bind = function(scope) {
	this._renderer.bind(scope);
};

Scope.prototype.addAirport = function(airport) {
  this._airports[airport.icao()] = airport;
};

Scope.prototype.airport = function(icao) {
  return this._airports[icao];
};

Scope.prototype.addMap = function(map, callback) {
	this._maps[map] = new Map(map, this._renderer, callback);
};

Scope.prototype.setSituation = function(situation) {
	this._situation = typeof situation == 'string' ? new Situation(situation) : situation;
};

Scope.prototype.map = function(id) {
	return this._maps[id];
};

Scope.prototype.situation = function() {
	return this._situation;
};

Scope.prototype.renderer = function() {
	return this._renderer;
};

Scope.prototype.compass = function() {
	return this._compass;
};

Scope.prototype.textOverlay = function() {
	return this._textOverlay;
};

Scope.prototype.fit = function() {
	this._renderer.scope().width = $(window).width();
	this._renderer.scope().height = $(window).height();
}

Scope.prototype.renderBackground = function() {
	this._renderer.context().fillStyle = this._renderer.background();
	this._renderer.context().fillRect(0, 0, this._renderer.scope().width, this._renderer.scope().height);
};

Scope.prototype.renderOverlays = function() {
	this._textOverlay.renderTime(this._renderer, this._airports);
	this._textOverlay.renderTowerList(this._renderer, this._airports, this._situation.aircraft());
	this._textOverlay.renderLACAMCI(this._renderer, this._situation.CDE());
	this._textOverlay.renderCRDAStatus(this._renderer, this._situation.CRDA());
	this._textOverlay.renderPreviewArea(this._renderer);
};

Scope.prototype.render = function() {
	this.fit();
	this.renderBackground();
	this._compass.render(this._renderer);
	for (var i in this._maps)
		this._maps[i].render(this._renderer);
	this._flow.render(this._renderer);
	//this._weatherOverlay.render(this._renderer);
	this._situation.render(this._renderer);
	this.renderOverlays();
};