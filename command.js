var Command = Command || {};

Command.ERROR = {
  FORMAT: 0,
  TAKE_NO_ACTION: 1
};

Command.SEGMENT_TYPE = {
  PLACEHOLDER: 0,
  CALLSIGN: 0,
  HEADING: 0,
  ALTITUDE: 0,
  SPEED: 0,
  SECTOR: 0,
  RUNWAY: 0,
  PATH_NAME: 0
};

Command.SEGMENT = {
  ILS: 'ILS',
  VISUAL_APPROACH: 'VA',
  INITIATE_CONTROL: 'IC',
  TERMINATE_CONTROL: 'TC',
  FLY_HEADING: 'FH',
  MAINTAIN_ALTITUDE: 'MA',
  SPEED: 'SPD',
  PATH: 'PATH',
  MEASURE_DISTANCE: '*'
};

Command.SEGMENT_RAW = {
  ILS: true,
  VA: true,
  IC: true,
  TC: true,
  FH: true,
  MA: true,
  SPD: true,
  PATH: true,
  '*': true
};

Command.ALIAS = {
  TL: Command.SEGMENT.FLY_HEADING,
  TR: Command.SEGMENT.FLY_HEADING,
  CM: Command.SEGMENT.MAINTAIN_ALTITUDE,
  DM: Command.SEGMENT.MAINTAIN_ALTITUDE,
  SLOW: Command.SEGMENT.SPEED
};

Command.currentCommand = [];
Command.lastCommand = [];

Command.cleanupFunction = null;

Command.registerCleanupFunction = function(fn, skipOnCurrent) {
  Command.cleanup(skipOnCurrent);
  Command.cleanupFunction = fn;
};

Command.cleanup = function(skipOnCurrent) {
  Command.clearCleanupTimeout();
  if (Command.cleanupFunction) {
    if (!skipOnCurrent || JSON.stringify(Command.currentCommand) !== JSON.stringify(Command.lastCommand))
      Command.cleanupFunction();
    Command.cleanupFunction = null;
    scope.render();
  }
};

Command.cleanupTimeout = null;

Command.clearCleanupTimeout = function() {
  if (Command.cleanupTimeout) {
    clearTimeout(Command.cleanupTimeout);
    Command.cleanupTimeout = null;
  }
};

Command.cleanupIn = function(milliseconds) {
  Command.clearCleanupTimeout();
  Command.cleanupTimeout = setTimeout(function() {
    Command.cleanup();
    Command.clearCleanupTimeout();
  }, milliseconds);
};

Command.run = function(e, args) {
  if (args[0] === '')
    return;
  var command = [];
  for (var i in args) {
    arg = args[i];
    if (!Command.SEGMENT_RAW[arg])
      arg = Command.ALIAS[arg] || Command.SEGMENT_TYPE.PLACEHOLDER;
    command.push(arg);
  }
  Command.currentCommand = command;
  var fn = Command;
  for (var j in command) {
    fn = fn[command[j]];
    if (!fn)
      scope.textOverlay().formatError();
  }
  try {
    fn(e, args);
    scope.textOverlay().clearPreview();
  } catch (err) {
    switch (err) {
      case Command.ERROR.FORMAT:
        scope.textOverlay().formatError();
        break;
    }
  }
  Command.lastCommand = command;
};

Command[Command.SEGMENT_TYPE.PLACEHOLDER] = {};

Command[Command.SEGMENT.MEASURE_DISTANCE] = function(e, args) {
  if (e.type === 'click') {
    var headingAndDistance = scope.measureHeadingAndDistance(e);
    if (headingAndDistance) {
      scope.addRenderPoint(scope.selectPosition(e));
      scope.textOverlay().clearPreview();
      scope.textOverlay().setPreviewAreaMessage(headingAndDistance.heading + '/' + headingAndDistance.distance);
      Command.registerCleanupFunction(function() {
        scope.textOverlay().clearPreviewAreaMessage();
        scope.clearRenderPoints();
      });
      Command.cleanupIn(15000);
    }
    throw Command.ERROR.TAKE_NO_ACTION;
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT.INITIATE_CONTROL] = function(e, args) {
  if (e.type === 'click') {
    var target = scope.select(e);
    if (target) {
      target.setController(scope._controller);
      return;
    }
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT.TERMINATE_CONTROL] = function(e, args) {
  if (e.type === 'click') {
    var target = scope.select(e);
    if (target) {
      target.setController(null);
      return;
    }
  }
  throw Command.ERROR.FORMAT;
};


Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.ILS] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.ILS][Command.SEGMENT_TYPE.RUNWAY] = function(e, args) {
  var callsign = args[0],
      runwayID = args[2],
      target = scope.targetManager().getTargetByCallsign(callsign),
      runway = scope.airport('KBOS').runway(runwayID);
  if (target && runway) {
    socket.emit('TS.ILS', {
      callsign: callsign,
      runway: runway
    });
    return;
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.VISUAL_APPROACH] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.VISUAL_APPROACH][Command.SEGMENT_TYPE.RUNWAY] = function(e, args) {

};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.FLY_HEADING] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.FLY_HEADING][Command.SEGMENT_TYPE.HEADING] = function(e, args) {
  var callsign = args[0],
      heading = args[2],
      target = scope.targetManager().getTargetByCallsign(callsign);
  if (target && 0 <= heading && heading <= 360) {
    socket.emit('TS.heading', {
      callsign: callsign,
      heading: heading
    });
    return;
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.MAINTAIN_ALTITUDE] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.MAINTAIN_ALTITUDE][Command.SEGMENT_TYPE.SPEED] = function(e, args) {
  var callsign = args[0],
      altitude = args[2],
      target = scope.targetManager().getTargetByCallsign(callsign);
  if (target && 0 <= altitude && altitude <= 99999) {
    socket.emit('TS.altitude', {
      callsign: callsign,
      altitude: altitude
    });
    return;
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.SPEED] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.SPEED][Command.SEGMENT_TYPE.SPEED] = function(e, args) {
  var callsign = args[0],
      speed = args[2],
      target = scope.targetManager().getTargetByCallsign(callsign);
  if (target && 0 <= speed && speed <= 9999) {
    socket.emit('TS.speed', {
      callsign: callsign,
      speed: speed
    });
    return;
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT.PATH] = {};
Command[Command.SEGMENT.PATH][Command.SEGMENT_TYPE.PATH_NAME] = (function() {
  var path = [],
      cleanup = function() {
        path = [];
        scope.clearRenderPath();
        scope.textOverlay().clearPreviewAreaMessage();
      };
  return function(e, args) {
    scope.textOverlay().clearPreviewAreaMessage();
    if (e.type === 'click') {
      Command.registerCleanupFunction(cleanup, true);
      var pos = scope.selectPosition(e),
          last = path[path.length - 1],
          secondToLast = path[path.length - 2];
      if (last) {
        if (last.distanceTo(pos) * 0.539957 < 1) {
          scope.textOverlay().setPreviewAreaMessage('ILL DIST');
          throw Command.ERROR.TAKE_NO_ACTION;
        }
        if (secondToLast) {
          var lastBearing = secondToLast.bearingTo(last),
              newBearing = last.bearingTo(pos);
          if (scope.renderer().angleBetweenHeadings(lastBearing, newBearing) >= 90) {
            scope.textOverlay().setPreviewAreaMessage('ILL TURN');
            throw Command.ERROR.TAKE_NO_ACTION;
          }
        }
      }
      path.push(pos);
      scope.setRenderPath(path);
      throw Command.ERROR.TAKE_NO_ACTION;
    } else if (path.length) {
      cleanup();
      return;
    }
    cleanup();
    throw Command.ERROR.FORMAT;
  };
})();