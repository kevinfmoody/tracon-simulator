var Position = function(latitude, longitude) {
  // public static MagVar magVar = new MagVar();
  // public static long today = JulianDay();
        
  this.latitude = latitude || 0.0;
  this.longitude = longitude || 0.0;
};

Position.EARTH_RADIUS_KM = 6371000.0;
Position.KM_TO_NM = 0.5399568034557235;
Position.MS_IN_HR = 3600000.0;
Position.FT_IN_KM = 3280.84;

Position.AngleBetween = function(a, b) {
    var gap = Math.Abs(a - b);
    return Math.Min(gap, 360 - gap);
};

Position.DegreesToRadians = function(degrees) {
    return degrees * Math.PI / 180;
};

Position.RadiansToDegrees = function(radians) {
    return radians * 180 / Math.PI;
};

// Position.JulianDay = function() {
//     return DateTime.Now.ToOADate() + 2415018.5;
// };

// Position.prototype.magneticDeclination = function(altitude) {
//     var fields = new double[6];
//     return magVar.SGMagVar(DegreesToRadians(this.latitude), DegreesToRadians(this.longitude), altitude / FT_IN_KM, today, 1, fields);
// };

Position.prototype.distanceTo = function(position) {
    var R = Position.EARTH_RADIUS_KM;
    var φ1 = Position.DegreesToRadians(this.latitude), λ1 = Position.DegreesToRadians(this.longitude);
    var φ2 = Position.DegreesToRadians(position.latitude), λ2 = Position.DegreesToRadians(position.longitude);
    var Δφ = φ2 - φ1;
    var Δλ = λ2 - λ1;
    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
               Math.cos(φ1) * Math.cos(φ2) *
               Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * Position.KM_TO_NM;
};

Position.prototype.destinationPoint = function(heading, distance) {
    var δ = distance / Position.EARTH_RADIUS_KM;
    var θ = Position.DegreesToRadians(heading);
    var φ1 = Position.DegreesToRadians(this.latitude);
    var λ1 = Position.DegreesToRadians(this.longitude);
    var φ2 = Math.Asin(Math.Sin(φ1) * Math.Cos(δ) +
                        Math.Cos(φ1) * Math.Sin(δ) * Math.Cos(θ));
    var λ2 = λ1 + Math.Atan2(Math.Sin(θ) * Math.Sin(δ) * Math.Cos(φ1),
                             Math.Cos(δ) - Math.Sin(φ1) * Math.Sin(φ2));
    λ2 = (λ2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    return new Position(Position.RadiansToDegrees(φ2), Position.RadiansToDegrees(λ2));
};

module.exports = Position;