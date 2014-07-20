function Scope() {
	this._maps = {};
	this._airports = {};
	this._trafficSimulator = new TrafficSimulator;
	this._targetManager = new TargetManager;
	this._controller = new Controller('A', 'SR', 'BOS_APP', '118.25');
	//this._feed = new Feed;
	this._radar = new Radar;

	//this._situation = new Situation;
	this._renderer = new Renderer;
	this._compass = new Compass;
	this._textOverlay = new TextOverlay(this);
	this._flow = new Flow();

	this._radarManager;
	this._isOn = false;

	this._crda;
	//this._weatherOverlay = new WeatherOverlay;

	/*var self = this;
	setTimeout(function() {
		self._weatherOverlay.refresh(self._renderer);
	}, 5000);*/
}

Situation.prototype.detectAndRenderConflicts = function() {
	if (this._conflictsEnabled) {
		this._cde.detect(this._aircraft);
		for (var i in this._aircraft)
			this._aircraft[i].setConflicting(this._cde.singleAircraftInConflict(this._aircraft[i]));
		this._cde.manageAlarm();
	}
};

Scope.prototype.setCRDA = function(crda) {
	this._crda = crda;
};

Scope.prototype.CRDA = function() {
	return this._crda;
};

Scope.prototype.turnOn = function() {
	if (!this._isOn) {
		this._isOn = true;
		this._radarManager = setInterval(function() {
			this._radar.sweep(this._trafficSimulator, this._targetManager, this.render.bind(this));
		}.bind(this), 5000);
		this._radar.sweep(this._trafficSimulator, this._targetManager, this.render.bind(this));
	}
};

Scope.prototype.turnOff = function() {
	if (this._isOn) {
		this._isOn = false;
		clearInterval(this._radarManager);
		this._targetManager.reset();
	}
};

Scope.prototype.select = function(x, y) {
	var target = this._targetManager.select(x, y, this._renderer);
	if (target) {
		if (!this._textOverlay.processPreviewArea(target, this._controller)) {
			this._textOverlay.clearPreview();
			this._textOverlay.addPreviewChar(target.callsign());
			this._textOverlay.addPreviewChar(' ');
		} 
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
	//this._situation = typeof situation == 'string' ? new Situation(situation) : situation;
};

Scope.prototype.maps = function() {
	return this._maps;
};

Scope.prototype.map = function(id) {
	return this._maps[id];
};

Scope.prototype.situation = function() {
	//return this._situation;
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
	//this._textOverlay.renderTowerList(this._renderer, this._airports, this._situation.aircraft());
	//this._textOverlay.renderLACAMCI(this._renderer, this._situation.CDE());
	//this._textOverlay.renderCRDAStatus(this._renderer, this._situation.CRDA());
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
	//this._situation.render(this._renderer);
	//this.detectAndRenderConflicts();
	this._targetManager.render(this._renderer);
	if (this._crda)
			this._crda.ghostTargets(this._targetManager, this._renderer);
	this.renderOverlays();
};