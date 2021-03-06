function Scope(socket) {
	this._socket = socket;
	this._maps = {};
	this._airports = {};
	// this._trafficSimulator = new TrafficSimulator;
	this._targetManager = new TargetManager();
	this._facilityManager = new FacilityManager();
	//this._mapManager = new MapManager(this);
	this._controller = null;
  this._controllers = [];
	//this._feed = new Feed;
	this._radar = new Radar();

	//this._situation = new Situation;
	this._renderer = new Renderer();
	this._compass = new Compass();
	this._textOverlay = new TextOverlay(this);
	this._flow = new Flow();
	this._pathManager = new PathManager();

	this._radarManager = null;
	this._isOn = false;

  this._CRDAManager = new CRDAManager();
  this._sounds = true;

	this._measureDistanceStartPosition = null;
	this._renderPoints = [];
	//this._renderPaths = [];
	this._renderPointsBlinker = new Date().getTime();
	//this._weatherOverlay = new WeatherOverlay;

	/*var self = this;
	setTimeout(function() {
		self._weatherOverlay.refresh(self._renderer);
	}, 5000);*/
}

// Situation.prototype.detectAndRenderConflicts = function() {
// 	if (this._conflictsEnabled) {
// 		this._cde.detect(this._aircraft);
// 		for (var i in this._aircraft)
// 			this._aircraft[i].setConflicting(this._cde.singleAircraftInConflict(this._aircraft[i]));
// 		this._cde.manageAlarm();
// 	}
// };

Scope.prototype.radar = function() {
  return this._radar;
};

Scope.prototype.setControllers = function(controllers) {
  controllers.sort(function(a, b) {
    if (a.getIdentifier() < b.getIdentifier())
      return -1;
    else
      return 1;
  }.bind(this));
  if (this._controller) {
    this._controllers = [this._controller];
    controllers.forEach(function(controller) {
      if (controller.getIdentifier() !== this._controller.getIdentifier())
        this._controllers.push(controller);
    }.bind(this));
  } else
    this._controllers = controllers;
};

Scope.prototype.getControllerByIdentifier = function(identifier) {
  for (var i in this._controllers)
    if (this._controllers[i].getIdentifier() === identifier)
      return this._controllers[i];
  return null;
};

Scope.prototype.controllers = function() {
  return this._controllers;
};

Scope.prototype.setControllerPosition = function(position, cb) {
  if (!this._controller) {
    this._socket.emit('ATC.addController', {
      position: position
    }, function(data) {
      this.setController(new Controller(data.position, data.targetCode, data.identifier, data.name, '199.98', null));
      if (cb)
        cb();
    }.bind(this));
  } else {
    this._socket.emit('ATC.deleteController', function() {
      this._targetManager.massHandoff(this._controller, null);
      this.setController(null);
      this.setControllerPosition(position, cb);
    }.bind(this));
  }
};

Scope.prototype.sounds = function() {
  return this._sounds;
};

Scope.prototype.setController = function(controller) {
	this._controller = controller;
};

Scope.prototype.controller = function() {
  return this._controller;
};

Scope.prototype.facilityManager = function() {
	return this._facilityManager;
};

Scope.prototype.CRDAManager = function() {
	return this._CRDAManager;
};

Scope.prototype.turnOn = function() {
	if (!this._isOn) {
		this._isOn = true;

		var batchRender = _.throttle(this.render.bind(this), 200);
    socket.on('blip', function(blip) {
			this._radar.sync(blip, this._targetManager);
			batchRender();
    }.bind(this));
    
    socket.on('heartbeat', function(callsign) {
			this._radar.heartbeat(callsign, this._targetManager);
    }.bind(this));

		// this._radarManager = setInterval(function() {
		// 	this._radar.sweep(this._trafficSimulator, this._targetManager, this.render.bind(this));
		// }.bind(this), 5000);
		// this._radar.sweep(this._trafficSimulator, this._targetManager, this.render.bind(this));
	}
};

Scope.prototype.turnOff = function() {
	if (this._isOn) {
		this._isOn = false;
		clearInterval(this._radarManager);
		this._targetManager.reset();
	}
};

Scope.prototype.targetManager = function() {
	return this._targetManager;
};

Scope.prototype.pathManager = function() {
	return this._pathManager;
};

Scope.prototype.select = function(e) {
	var offset = $(e.target).offset(),
			x = e.clientX - offset.left,
			y = e.clientY - offset.top;
	return this._targetManager.select(x, y, this._renderer);
};

Scope.prototype.selectPosition = function(e) {
	var offset = $(e.target).offset(),
			x = e.clientX - offset.left,
			y = e.clientY - offset.top,
			target = this._targetManager.select(x, y, this._renderer);
	if (target)
		return target.position();
	else {
		var position = this._renderer.ctop(x, y);
		return position;
	}
};

Scope.prototype.measureHeadingAndDistance = function(e) {
	if (this._measureDistanceStartPosition) {
		var endPosition = this.selectPosition(e),
				heading = Math.round(this._measureDistanceStartPosition.bearingTo(endPosition) - this._renderer.magVar()) % 360,
				distance = this._measureDistanceStartPosition.distanceTo(endPosition) * 0.539957;
		this._measureDistanceStartPosition = null;
		return {
			heading: this._renderer.pad(heading, 3, true),
			distance: distance.toFixed(2)
		};
	} else {
		this._measureDistanceStartPosition = this.selectPosition(e);
		return null;
	}
};

Scope.prototype.addRenderPoint = function(position) {
	this._renderPoints.push(position);
};

Scope.prototype.clearRenderPoints = function() {
	this._renderPoints = [];
};

Scope.prototype.addRenderPath = function(path) {
	this._renderPaths.push(path);
};

Scope.prototype.clearRenderPaths = function() {
	this._renderPaths = [];
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

Scope.prototype.addMap = function(id, name, map, callback) {
	this._maps[id] = new Map(id, name, map, this._renderer, callback);
};

Scope.prototype.enableSmartMap = function() {
	this._maps['SMART'] = new SmartMap('SMART', '', this);
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
	var width = $(window).width() - ($('.situation-controls').is(':visible') ? 250 : 0);
	var height = $(window).height() - ($('.scope-settings').is(':visible') ? 54 : 0);
	this._renderer.scope().width = width;
	this._renderer.scope().height = height;
	// this._renderer.scope().style.width = width + 'px';
	// this._renderer.scope().style.height = height + 'px';
	// this._renderer.context().scale(this._renderer.pixelRatio(), this._renderer.pixelRatio());
};

Scope.prototype.renderBackground = function() {
	this._renderer.context().fillStyle = this._renderer.background();
	this._renderer.context().strokeStyle = this._renderer.brite(this._compass._brite);
	this._renderer.context().lineWidth = 1;
	this._renderer.context().fillRect(0, 0, this._renderer.scope().width, this._renderer.scope().height);
	this._renderer.context().strokeRect(0, 0, this._renderer.scope().width, this._renderer.scope().height);
};

Scope.prototype.renderRangeRings = function() {
	this._renderer.context().moveTo();
};

Scope.prototype.renderOverlays = function() {
	this._textOverlay.renderTime(this._renderer, this._airports);
	this._textOverlay.renderTowerList(this._renderer, this.targetManager().getAllTargets());
	this._textOverlay.renderLACAMCI(this._renderer);
	this._textOverlay.renderCRDAStatus(this._renderer, this.CRDAManager());
	this._textOverlay.renderPreviewArea(this._renderer);
  this._textOverlay.renderControllers(this._renderer, this._controllers);
};

Scope.prototype.renderRenderPoints = function() {
	if (this._renderPoints.length) {
		var color = (new Date().getTime() - this._renderPointsBlinker) % 1000 < 667 ? '#0c0' : '#060';
		for (var i in this._renderPoints) {
			var pos = this._renderer.gtoc(this._renderPoints[i]._lat, this._renderPoints[i]._lon);
			this._renderer.context().beginPath();
			this._renderer.context().moveTo(pos.x - 3, pos.y - 3);
			this._renderer.context().lineTo(pos.x + 3, pos.y - 3);
			this._renderer.context().lineTo(pos.x + 3, pos.y + 3);
			this._renderer.context().lineTo(pos.x - 3, pos.y + 3);
			this._renderer.context().fillStyle = color;
			this._renderer.context().fill();
		}
	}
};

Scope.prototype.render = function() {
	this.fit();
	this.renderBackground();
	this._compass.render(this._renderer);
	for (var i in this._maps)
		this._maps[i].render(this._renderer);
	this._flow.render(this._renderer);
	this._pathManager.render(this._renderer);
	//this._weatherOverlay.render(this._renderer);
	//this._situation.render(this._renderer);
	//this.detectAndRenderConflicts();
	this.renderRenderPoints();
  this.renderOverlays();
  if (this._CRDAManager.isEnabled())
    this._CRDAManager.ghostTargets(this._targetManager, this._renderer);
	this._targetManager.render(this._renderer);
};
