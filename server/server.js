var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    request = require('request'),
    ClientManager = require('./ClientManager.js'),
    NavigationAPI = require('./NavigationAPI.js'),
    WeatherAPI = require('./WeatherAPI.js'),
    FacilitiesAPI = require('./FacilitiesAPI.js'),
    Apiify = require('./Apiify.js');//,
    //Flow = require('./Flow.js');

// var currentFlow = new Flow();
// currentFlow.loadRecent();

io.on('connection', function(socket) {
  new ClientManager(socket, null/*currentFlow*/);
});

app.get('/proxy', function(req, res) {
  request.get(req.query.url, function(error, response, body) {
    res.send(body);
  });
});

app.get('/api/fixes/*', Apiify(NavigationAPI.fix, 'fix'));
app.get('/api/navaids/*', Apiify(NavigationAPI.navaid, 'navaid'));
app.get('/api/metars/*', Apiify(WeatherAPI.metar, 'metar'));
app.get('/api/airports/*', Apiify(FacilitiesAPI.airport, 'airport'));

app.use('/', express.static('../'));

http.listen(8080);