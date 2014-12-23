function ATC(client) {
  this._client = client;
}

ATC.prototype.addController = function(data) {
  this._client.sendPacket('#AA', [
    data.from,
    'SERVER',
    data.name,
    data.cid,
    data.password,
    data.rating,
    9
  ]);
};

ATC.prototype.deleteController = function() {
  this._client.sendPacket('#DA', [
    data.from
  ]);
};

ATC.prototype.sendPosition = function(data) {
  this._client.sendPacket('%', [
    data.from,
    data.frequency,
    data.facility,
    data.visRange,
    data.rating,
    data.latitude,
    data.longitude,
    0
  ]);
};

ATC.prototype.requestHandoff = function(data) {
  this._client.sendPacket('$HO', [
    data.from,
    data.to,
    data.callsign
  ]);
};

ATC.prototype.acceptHandoff = function(data) {
  this._client.sendPacket('$HA', [
    data.from,
    data.to,
    data.callsign
  ]);
};

ATC.prototype.refuseHandoff = function(data) {
  this._client.sendPacket('#PC', [
    data.from,
    data.to,
    'CCP',
    'HC',
    data.callsign
  ]);
};

ATC.prototype.pointout = function(data) {
  this._client.sendPacket('#PC', [
    data.from,
    data.to,
    'CCP',
    'PT',
    data.callsign
  ]);
};

ATC.prototype.claimOwnership = function(data) {
  this._client.sendPacket('#PC', [
    data.from,
    data.to,
    'CCP',
    'IH',
    data.callsign
  ]);
};

ATC.prototype.scratchpad = function(data) {
  this._client.sendPacket('#PC', [
    data.from,
    data.to,
    'CCP',
    'SC',
    data.callsign,
    data.scratchpadText
  ]);
};

ATC.prototype.squawk = function(data) {
  this._client.sendPacket('#PC', [
    data.from,
    data.to,
    'CCP',
    'BC',
    data.callsign,
    data.squawk
  ]);
};

ATC.prototype.voiceType = function(data) {
  this._client.sendPacket('#PC', [
    data.from,
    data.to,
    'CCP',
    'VT',
    data.callsign,
    data.voiceType
  ]);
};

ATC.prototype.temporaryAltitude = function(data) {
  this._client.sendPacket('#PC', [
    data.from,
    data.to,
    'CCP',
    'TA',
    data.callsign,
    data.altitude
  ]);
};

ATC.prototype.amendFlightPlan = function(data) {
  this._client.sendPacket('$AM', [
    data.from,
    'SERVER',
    data.callsign,
    data.flightType,
    data.aircraftType,
    data.cruiseAirspeed,
    data.departureAirport,
    data.departureTimeEstimated,
    data.departureTimeActual,
    data.cruiseAltitude,
    data.destinationAirport,
    data.hoursEnroute,
    data.minutesEnroute,
    data.fuelAvailableHours,
    data.fuelAvailableMinutes,
    data.alternateAirport,
    data.remarks,
    data.route
  ]);
};

ATC.prototype.ping = function(data) {
  this._client.sendPacket('$PI', [
    data.from,
    data.to,
    data.data
  ]);
};

ATC.prototype.pong = function(data) {
  this._client.sendPacket('$PO', [
    data.from,
    data.to,
    data.echoData
  ]);
};

ATC.prototype.checkValidity = function(data) {
  var payload = [
    data.from,
    'SERVER',
    'ATC'
  ];
  if (data.controller)
    payload.push(data.controller);
  this._client.sendPacket('$CQ', payload);
};

ATC.prototype.checkCapabilities = function(data) {
  this._client.sendPacket('$CQ', [
    data.from,
    data.to,
    'CAPS'
  ]);
};

ATC.prototype.capabilities = function(data) {
  this._client.sendPacket('$CQ', [
    data.from,
    data.to,
    'CAPS'
  ].concat(ags.capabilities.map(function(capability) {
    return capability + '=1';
  })));
};

ATC.prototype.forceSquawk = function(data) {
  this._client.sendPacket('$CQ', [
    data.from,
    data.to,
    'IPC',
    'W',
    852,
    this.squawk
  ]);
};

module.exports = ATC;