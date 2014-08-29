var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    request = require('request'),
    ClientManager = require('./ClientManager.js'),
    NavigationAPI = require('./NavigationAPI.js'),
    NavigationAPIV2 = require('./NavigationAPIV2.js'),
    WeatherAPI = require('./WeatherAPI.js'),
    FacilitiesAPI = require('./FacilitiesAPI.js'),
    CoastlineAPI = require('./CoastlineAPI.js'),
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

app.get('/api/fixes/*', Apiify(NavigationAPIV2.fix));
app.get('/api/navaids/*', Apiify(NavigationAPI.navaid));
app.get('/api/metars/*', Apiify(WeatherAPI.metar));
app.get('/api/airports/*', Apiify(FacilitiesAPI.airport));
app.get('/api/coastline', function(req, res) {
  CoastlineAPI.coastline(req.query.lat, req.query.lon, req.query.radius, function(lines) {
    res.send(lines);
  });
});
app.get('/api/fixes', function(req, res) {
  NavigationAPIV2.fixes(req.query.lat, req.query.lon, req.query.radius, function(fixes) {
    res.send(fixes);
  });
});

app.use('/', express.static('../'));

http.listen(8080);