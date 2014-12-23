var LatLon = require('../../latlon.js');

var Packet = {};

Packet.FIELD_DELIMETER = ':';

Packet.TYPE = {
  COMMUNICATIONS_MESSAGES_AND_ADVISORIES: '#',
  ADMINISTRATIVE_MESSAGES: '$',
  PILOT_POSITION: '@',
  ATC_POSITION: '%',
  SECONDARY_VISIBILITY_CENTER: '‘'
};

Packet.process = function(packet, socket) {
  var subPackets = packet.split('\n');
  for (var i in subPackets) {
    var subPacket = subPackets[i],
        type = Packet[subPacket[0]];
    if (type) {
      var command = type[subPacket.substr(1, 2)];
      if (command)
        command(subPacket.substr(3).split(':'), socket);
      else if (typeof type === 'function')
        type(subPacket.substr(1).split(':'), socket);
    }
  }
};

Packet[Packet.TYPE.COMMUNICATIONS_MESSAGES_AND_ADVISORIES] = {

  // 'AA': function addATC(packet) {
  //   // IGNORE
  // },

  'DA': function deleteATC(data) {

  },

  // 'AP': function addPilot(packet) {
  //   // IGNORE
  // },

  'DP': function deletePilot(data) {

  },

  'TM': function sendTextMessageBroadcast(data, socket) {
    var from = data.shift(),
        to = data.shift(),
        message = data.join(':');
    socket.emit('textMessage', {
      from: from,
      to: to,
      message: message
    });
  },

  // 'WX': function requestWeatherProfile(packet) {
  //   // IGNORE
  // },

  // 'DL': function windDelta(packet) {
  //   // IGNORE
  // },

  // 'TD': function temperatureData(packet) {
  //   // IGNORE
  // },

  // 'WD': function windData(packet) {
  //   // IGNORE
  // },

  'PC': function intraATCData(data) {
    
  },

  // 'SB': function intraPilotData(data) {
  //   // IGNORE
  // },

};

Packet[Packet.TYPE.ADMINISTRATIVE_MESSAGES] = function(packet) {


};

Packet[Packet.TYPE.PILOT_POSITION] = function(data, socket) {
  socket.emit('blip', {
    callsign: data[1],
    mode: data[0],
    type: 'B737',
    arrival: 'KBOS',
    position: new LatLon(data[4], data[5]),
    altitude: data[6],
    speed: data[7],
    squawk: data[2]
  });
};

Packet[Packet.TYPE.ATC_POSITION] = function(packet) {

};

Packet[Packet.TYPE.SECONDARY_VISIBILITY_CENTER] = function(packet) {

};

module.exports = Packet;