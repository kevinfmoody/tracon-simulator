var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    TrafficSimulator = require('../traffic/TrafficSimulator.js'),
    VATSIM = require('./vatsim/vatsim.js'),
    v = new VATSIM(),
    r = {
      magVar: function() { return -15.24; }
    };

v.client().connect(function() {
  v.atc().add('BOS_APP', 'Kevin Moody', '1097238', '201815', '8');
  v.messages().send('BOS_APP1', 'Yo people. how are you?');
  v.weather().metar('KBOS');
  setInterval(function() {
    v.atc().sendPosition('18250', '5', '150', '8', '43.23414', '-71.2341');
  }, 15000);
});

var simulation = new TrafficSimulator();
simulation.loadSituation('../situations/a90.sit', function() {
  console.log('situation loaded');
  simulation.run(r);
});

io.on('connection', function(socket) {
  console.log('a user connected');
  socket.on('radar.sweep', function(radarReturn) {
    radarReturn(simulation.blips());
  });
});

app.use('/', express.static('../'));

http.listen(8080);