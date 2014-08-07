/** @jsx React.DOM */

var scope = new Scope();
var connectionDelegate = new ConnectionDelegate(scope, socket);

$(document).ready(function() {
	initScope();
  initBostonAirport();
  //initSanFransiscoAirport();
	initScopeZoom();
	initScopeResize();
	initScopeDrag();
	initKeyDetection();
	initSlewDetection();
  initSettings();
});

function initScope() {
	scope.bind('#scope');
	scope.addMap('22L27', '', 'maps/a90.map', function() {
		scope.render();
		setInterval(function() {
			scope.render();
		}, 1000 / 30);
    React.renderComponent(<MasterDCB />, document.getElementById('wahoo'));
	});
	//scope.setSituation('situations/a90.sit');
  scope._radar.setPosition(new LatLon(42.3629722, -71.0064167));
  // scope._trafficSimulator.loadSituation('situations/a90.sit', function() {
    //scope._trafficSimulator.run(scope.renderer());
    scope.turnOn();
  // });
	//scope.situation().run();
}

function initSanFransiscoAirport() {
  var KSFO = new Airport('KSFO', 'SFO', 37.6191050, -122.3752372, 13);
  scope.addAirport(KSFO);
  //scope.situation().setSlaveFeed(new RWTraffic(KSFO, scope.situation(), scope.renderer()));
  //scope.situation().enableSlaveMode();
  scope.renderer().setRadarCenter(KSFO.lat(), KSFO.lon());
}

function initBostonAirport() {
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
  var R27R22L = new CRDA(scope.airport('KBOS'), '27', '22L');
  scope.setCRDA(R27R22L);
  //var R4R27 = new CRDA(KBOS, '4R', '27', scope.renderer());
  //scope.situation().setCRDA(R4R27);
  //scope.situation().setSlaveFeed(new RWTraffic(KBOS, scope.situation(), scope.renderer()));
  //scope.situation().enableSlaveMode();
  scope.renderer().setRadarCenter(KBOS.lat(), KBOS.lon());
}

function initScopeZoom() {
	$('#scope').bind('mousewheel wheel', function(e) {
		var scale = 1 + e.originalEvent.wheelDelta / 1000;
		scale = Math.min(Math.max(scale, .5), 2);
		scope.renderer().setGlobalScale(scope.renderer().globalScale() * scale);
		scope.render();
	});
}

function initScopeResize() {
	$(window).resize(function() {
		scope.render();
	});
}

function initScopeDrag() {
	$('#scope').bind('mousedown touchstart', function(e) {
		e = e.type == 'touchstart' ? e.touches[0] : e;
		scope.renderer().setMouseDown(true);
		scope.renderer().setLastMousePosition({
			x: e.clientX,
			y: e.clientY
		});
		return false;
	});
	$('#scope').bind('mouseup mouseover mouseout touchend touchcancel', function(e) {
    scope.renderer().setMouseDown(false);
  });
	$('#scope').bind('mousemove touchmove', function(e) {
    e = e.type === 'touchmove' ? e.touches[0] : e;
		if (scope.renderer().mouseDown()) {
      scope.renderer().dragging();
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

function initSlewDetection() {
	$('#scope').click(function(e) {
    if (!scope.renderer().wasDragging())
      Command.run(e, scope.textOverlay().previewSegments());
	});
}

function initKeyDetection() {
  $(document).keypress(function(e) {
    scope.textOverlay().addPreviewChar(String.fromCharCode(e.which).toUpperCase());
    scope.render();
  });
	$(document).keydown(function(e) {
    if (e.which === Keyboard.KEYS.ENTER) {
      e.preventDefault();
      Command.run(e, scope.textOverlay().previewSegments());
    } else {
      Command.cleanup();
      var keyCommands = Keyboard[e.which];
      if (keyCommands) {
        var command = keyCommands[Keyboard.combo(e)];
        if (command) {
          e.preventDefault();
          command(e);
          scope.render();
        }
      }
    }
	});
}

function initSettings() {
  $(document).ready(function() {
    $('#setting-compass-brightness').change(function(e) {
      scope.compass().setBrite($(this).val());
      scope.render();
    });
    $('#setting-map-brightness').change(function(e) {
      for (var i in scope.maps())
        scope.maps()[i].setBrite($(this).val());
      scope.render();
    });
  });
}