var Command = Command || {};

Command.ERROR = {
  FORMAT: 0
};

Command.SEGMENT_TYPE = {
  PLACEHOLDER: 0,
  CALLSIGN: 0,
  HEADING: 0,
  ALTITUDE: 0,
  SPEED: 0,
  SECTOR: 0,
  RUNWAY: 0
};

Command.SEGMENT = {
  ILS: 'ILS',
  VISUAL_APPROACH: 'VA',
  INITIATE_CONTROL: 'IC',
  TERMINATE_CONTROL: 'TC',
  FLY_HEADING: 'FH',
  MAINTAIN_ALTITUDE: 'MA',
  SPEED: 'SPD'
};

Command.SEGMENT_RAW = {
  ILS: true,
  VA: true,
  IC: true,
  TC: true,
  FH: true,
  MA: true,
  SPD: true
};

Command.ALIAS = {
  TL: Command.SEGMENT.FLY_HEADING,
  TR: Command.SEGMENT.FLY_HEADING,
  CM: Command.SEGMENT.MAINTAIN_ALTITUDE,
  DM: Command.SEGMENT.MAINTAIN_ALTITUDE,
  SLOW: Command.SEGMENT.SPEED
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
      default:
        scope.textOverlay().formatError();
    }
  }
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

Command[Command.SEGMENT_TYPE.CALLSIGN] = {};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.ILS] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.ILS][Command.SEGMENT_TYPE.RUNWAY] = function(e, args) {

};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.VISUAL_APPROACH] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.VISUAL_APPROACH][Command.SEGMENT_TYPE.RUNWAY] = function(e, args) {

};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.FLY_HEADING] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.FLY_HEADING][Command.SEGMENT_TYPE.HEADING] = function(e, args) {

};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.MAINTAIN_ALTITUDE] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.MAINTAIN_ALTITUDE][Command.SEGMENT_TYPE.SPEED] = function(e, args) {

};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.SPEED] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.SPEED][Command.SEGMENT_TYPE.SPEED] = function(e, args) {

};