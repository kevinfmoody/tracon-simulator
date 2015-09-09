var scope = new Scope(socket);
var connectionDelegate = new ConnectionDelegate(scope, socket);
//var radio = new SpeechCommands();

// var config = { 'worker_path': '/vendor/worker.min.js' };
// AudioRecorder.init(config);

// AudioRecorder.record();
// setTimeout(function() {
//   AudioRecorder.stopRecording(function(clip) {
//     AudioRecorder.playClip(clip, 0, 0);

//     console.log(clip.speex);
//   });
// }, 5000);


$(document).ready(function() {
	initScope();
	initScopeZoom();
	initScopeResize();
	initScopeDrag();
	initKeyDetection();
	initSlewDetection();
  initSettings();

  $('.control-section h1').click(function() {
    var $parent = $(this).parent();
    if ($parent.hasClass('expanded')) {
      $parent.removeClass('expanded');
    } else {
      $('.control-section').removeClass('expanded');
      $parent.addClass('expanded');
    }
  });
  $('.control-section .button').click(function() {
    var txt = $(this).text().trim();
    if (txt === 'On' || txt === 'Off')
      $(this).text(txt === 'On' ? 'Off' : 'On');
  });
  $('.control-section').keydown(function(e) {
    e.stopPropagation();
  });
  $('.control-section').keypress(function(e) {
    e.stopPropagation();
  });
  $('.control-section input').mouseout(function(e) {
    $(this).blur();
  });
});

function initScope() {
	scope.bind('#scope');
  // scope.addMap('22L27', '', 'maps/a90.map', function() {
  //   scope.render();
  // });
  
	//scope.addMap('BOSMHT', '', 'maps/bosmht.map', function() {
		//scope.render();
		setInterval(function() {
			scope.render();
		}, 1000 / 30);
    //React.renderComponent(<MasterDCB />, document.getElementById('wahoo'));
	//});
  scope.facilityManager().setPrimaryAirport('KBOS');
  scope.facilityManager().primaryAirport(function(airport) {
    if (!airport)
      return;
    scope.enableSmartMap();
    scope.radar().setPosition(airport.position());
    scope.renderer().setRadarCenter(scope.radar().position());
    //scope.CRDAManager().addRemoveCRDA(airport, '27', '22L');
    // scope.setControllerPosition('FEEDER', function() {
    //   scope.turnOn();
    // });
    //scope.setControllerPosition('FEEDER');
    scope.turnOn();
  });
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
    } else if (e.which === Keyboard.KEYS.SELECT_KEY) {
      e.preventDefault();
      //radio.transmit();
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
  $(document).keyup(function(e) {
    if (e.which === Keyboard.KEYS.SELECT_KEY) {
      e.preventDefault();
      //radio.release();
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