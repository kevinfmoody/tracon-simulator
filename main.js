var scope = new Scope;

$(document).ready(function() {
	initScope(scope);
  	initBostonAirport(scope);
  	//initSanFransiscoAirport(scope);
	initScopeZoom(scope);
	initScopeResize(scope);
	initScopeDrag(scope);
	initKeyDetection(scope);
	initSlewDetection(scope);
});

function initScope(scope) {
	scope.bind('#scope');
	scope.addMap('a90.map', function() {
		scope.render();
		setInterval(function() {
			scope.render();
		}, 1000);
	});
	scope.setSituation('crda.sit');
	scope.situation().run();
}

function initSanFransiscoAirport(scope) {
  var KSFO = new Airport('KSFO', 'SFO', 37.6191050, -122.3752372, 13);
  scope.addAirport(KSFO);
  scope.situation().setSlaveFeed(new RWTraffic(KSFO, scope.situation(), scope.renderer()));
  scope.situation().enableSlaveMode();
  scope.renderer().setRadarCenter(KSFO.lat(), KSFO.lon());
}

function initBostonAirport(scope) {
  var KBOS = new Airport('KBOS', 'BOS', 42.3629722, -71.0064167, 20);
  var R9 = new Runway('9', 42.3557542, -71.0128938, 17, 7000, 150, 93);
  var R27 = new Runway('27', 42.3602168, -70.9877037, 15, 7000, 150, 273);
  var R22L = new Runway('22L', 42.37690005, -70.9992913, 15, 10005, 150, 216);
  var R4R = new Runway('4R', 42.351059, -71.0117953, 19, 10005, 150, 36);
  R27.enableILS();
  R22L.enableILS();
  R4R.enableILS();
  KBOS.addRunway(R9, R27);
  KBOS.addRunway(R4R, R22L);
  scope.addAirport(KBOS);
  var R27R22L = new CRDA(scope.airport('KBOS'), '27', '22L', scope.renderer());
  scope.situation().setCRDA(R27R22L);
  //var R4R27 = new CRDA(KBOS, '4R', '27', scope.renderer());
  //scope.situation().setCRDA(R4R27);
  //scope.situation().setSlaveFeed(new RWTraffic(KBOS, scope.situation(), scope.renderer()));
  //scope.situation().enableSlaveMode();
  scope.renderer().setRadarCenter(KBOS.lat(), KBOS.lon());
}

function initScopeZoom(scope) {
	$('#scope').bind('mousewheel wheel', function(e) {
		var scale = 1 + e.originalEvent.wheelDelta / 1000;
		scale = Math.min(Math.max(scale, .5), 2);
		scope.renderer().setGlobalScale(scope.renderer().globalScale() * scale);
		scope.render();
	});
}

function initScopeResize(scope) {
	$(window).resize(function() {
		scope.render();
	});
}

function initScopeDrag(scope) {
	$('#scope').bind('mousedown touchstart', function(e) {
		e = e.type == 'touchstart' ? e.touches[0] : e;
		scope.renderer().setMouseDown(true);
		scope.renderer().setLastMousePosition({
			x: e.clientX,
			y: e.clientY
		});
		return false;
	});
	$('#scope').bind('mouseup mouseover mouseout touchend touchcancel', function() { scope.renderer().setMouseDown(false); });
	$('#scope').bind('mousemove touchmove', function(e) {
      	e = e.type == 'touchmove' ? e.touches[0] : e;
		if (scope.renderer().mouseDown()) {
			scope.renderer().setTranslationOffset({
				x: scope.renderer().translationOffset().x + scope.renderer().scale(e.clientX - scope.renderer().lastMousePosition().x),
				y: scope.renderer().translationOffset().y + scope.renderer().scale(scope.renderer().lastMousePosition().y - e.clientY)
			});
			scope.renderer().setLastMousePosition({
				x: e.clientX,
				y: e.clientY
			});
			scope.render();
		}
		return false;
	});
}

function initSlewDetection(scope) {
	$('#scope').click(function(e) {
		var x = e.clientX;
		var y = e.clientY;
		if (!scope.select(x, y)) {
      var pos = scope.renderer().ctop(x, y);
      console.log(scope._flow.altitude(pos));
      scope._textOverlay.clearPreview();
      scope._textOverlay.addPreviewChar(pos._lat);
      scope._textOverlay.addPreviewChar(' ');
      scope._textOverlay.addPreviewChar(pos._lon);
      scope.render();
    }
	});
}

function initKeyDetection(scope) {
	var keys = {};
	$(document).keydown(function(e) {
		keys[e.which] = true;
		console.log(e.which);
		if (keys[17] && keys[82])
			scope.situation().run();
		else if (keys[17] && keys[80])
			scope.situation().pause();
		else if (keys[17] && keys[18] && keys[49])
			scope.renderer().setPreset(1);
		else if (keys[17] && keys[49]) {
			scope.renderer().selectPreset(1);
			scope.render();
		}
		else if (keys[17] && keys[18] && keys[50])
			scope.renderer().setPreset(2);
		else if (keys[17] && keys[50]) {
			scope.renderer().selectPreset(2);
			scope.render();
		}
		else if (keys[17] && keys[18] && keys[51])
			scope.renderer().setPreset(3);
		else if (keys[17] && keys[51]) {
			scope.renderer().selectPreset(3);
			scope.render();
		}
		else if (keys[8]) {
			scope.textOverlay().removePreviewChar();
			scope.render();
		}
		else if (keys[9]) {
			scope.textOverlay().aircraftSelect();
			scope.render();
		}
		else if (keys[13]) {
			scope.textOverlay().processPreviewArea();
			scope.render();
		}
		else {
			console.log(String.fromCharCode(e.which));
			scope.textOverlay().addPreviewChar(String.fromCharCode(e.which));
			scope.render();
		}
		return false;
	});
	$(document).keyup(function(e) {
		keys[e.which] = false;
		return false;
	});
}