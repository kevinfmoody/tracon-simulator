function Pilot(client) {
  this._client = client;
}

Pilot.prototype.addPilot = function(data) {
  this._client.sendPacket('#AP', [
    data.from,
    'SERVER',
    data.cid,
    data.password,
    1,
    9,
    0,
    data.name
  ]);
};

Pilot.prototype.deletePilot = function() {
  this._client.sendPacket('#DP', [
    data.from
  ]);
};

Pilot.prototype.sendPosition = function(data) {
  this._client.sendPacket('@', [
    data.identFlag,
    data.from,
    data.squawk,
    1,
    data.latitude,
    data.longitude,
    data.altitude,
    data.groundSpeed,
    data.pitchBankHeading,
    data.pressureTrueDifference
  ]);
};

Pilot.prototype.fileFlightPlan = function(data) {
  this._client.sendPacket('$FP', [
    data.from,
    'SERVER',
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

module.exports = Pilot;