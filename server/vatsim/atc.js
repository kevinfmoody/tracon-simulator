function ATC(client) {
  this._client = client;
}

ATC.prototype.add = function(callsign, name, cid, password, rating) {
  this._client.sendPacket('#AA', [
    callsign,
    'SERVER',
    name,
    cid,
    password,
    rating,
    9
  ]);
};

ATC.prototype.sendPosition = function(frequency, facility, visRange, rating, latitude, longitude) {
  this._client.sendPacket('%', [
    frequency,
    facility,
    visRange,
    rating,
    latitude,
    longitude,
    0
  ]);
};

ATC.prototype.delete = function() {
  this._client.sendPacket('#DA');
};

ATC.prototype.requestHandoff = function(controller, callsign) {
  this._client.sendPacket('$HO', [
    controller,
    callsign
  ]);
};

ATC.prototype.acceptHandoff = function(controller, callsign) {
  this._client.sendPacket('$HA', [
    controller,
    callsign
  ]);
};

ATC.prototype.refuseHandoff = function(controller, callsign) {
  this._client.sendPacket('#PC', [
    controller,
    'CCP',
    'HC',
    callsign
  ]);
};

ATC.prototype.pointout = function(controller, callsign) {
  this._client.sendPacket('#PC', [
    controller,
    'CCP',
    'PT',
    callsign
  ]);
};

ATC.prototype.claimOwnership = function(to, callsign) {
  this._client.sendPacket('#PC', [
    to,
    'CCP',
    'IH',
    callsign
  ]);
};

ATC.prototype.scratchpad = function(to, callsign, scratchpadText) {
  this._client.sendPacket('#PC', [
    to,
    'CCP',
    'SC',
    callsign,
    scratchpadText
  ]);
};

ATC.prototype.squawk = function(to, callsign, squawk) {
  this._client.sendPacket('#PC', [
    to,
    'CCP',
    'BC',
    callsign,
    squawk
  ]);
};

ATC.prototype.voiceType = function(to, callsign, voiceType) {
  this._client.sendPacket('#PC', [
    to,
    'CCP',
    'VT',
    callsign,
    voiceType
  ]);
};

ATC.prototype.temporaryAltitude = function(to, callsign, altitude) {
  this._client.sendPacket('#PC', [
    to,
    'CCP',
    'TA',
    callsign,
    altitude
  ]);
};

ATC.prototype.amendFlightPlan = function(callsign, flightType, aircraftType,
    cruiseAirspeed, departureAirport, departureTimeEstimated, departureTimeActual,
    cruiseAltitude, destinationAirport, hoursEnroute, minutesEnroute,
    fuelAvailableHours, fuelAvailableMinutes, alternateAirport, remarks, route) {
  this._client.sendPacket('$AM', [
    'SERVER',
    callsign,
    flightType,
    aircraftType,
    cruiseAirspeed,
    departureAirport,
    departureTimeEstimated,
    departureTimeActual,
    cruiseAltitude,
    destinationAirport,
    hoursEnroute,
    minutesEnroute,
    fuelAvailableHours,
    fuelAvailableMinutes,
    alternateAirport,
    remarks,
    route
  ]);
};

ATC.prototype.ping = function(to, data) {
  this._client.sendPacket('$PI', [
    to,
    data
  ]);
};

ATC.prototype.ping = function(to, echoData) {
  this._client.sendPacket('$PO', [
    to,
    echoData
  ]);
};

ATC.prototype.checkValidity = function(controller) {
  var payload = [
    'SERVER',
    'ATC'
  ];
  if (controller)
    payload.push(controller);
  this._client.sendPacket('$CQ', payload);
};

ATC.prototype.checkCapabilities = function(to) {
  this._client.sendPacket('$CQ', [
    to,
    'CAPS'
  ]);
};

ATC.prototype.capabilities = function(to, capabilities) {
  this._client.sendPacket('$CQ', [
    to,
    'CAPS'
  ].concat(capabilities.map(function(capability) {
    return capability + '=1';
  })));
};

module.exports = ATC;