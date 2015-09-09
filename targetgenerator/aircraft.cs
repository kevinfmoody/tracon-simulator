using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrueNorth.Geographic;

namespace TargetGenerator
{
    class Aircraft
    {
        public string callsign { get; set; }
        public Position position { get; set; }

        public double airspeed { get; set; }
        public double altitude { get; set; }
        public double heading { get; set; }

        public double airspeedTarget { get; set; }
        public double altitudeTarget { get; set; }
        public double headingTarget { get; set; }

        public double airspeedDelta { get; set; } // Knots/second
        public double altitudeDelta { get; set; } // Feet/min
        public double headingDelta { get; set; } // Degrees/second

        public double maxAirspeedDelta { get; set; } // Knots/second
        public double maxAltitudeDelta { get; set; } // Feet/min
        public double maxHeadingDelta { get; set; } // Degrees/second

        public double airspeedDeltaDelta { get; set; }
        public double altitudeDeltaDelta { get; set; }
        public double headingDeltaDelta { get; set; }

        public double groundspeed { get; set; }

        private Wind wind;

        public Aircraft(string callsign, Position position, double airspeed, double altitude, double heading)
        {
            this.callsign = callsign;
            this.position = position;
            this.airspeed = airspeed;
            this.altitude = altitude;
            this.heading = heading;
        }

        public void fly(WeatherSituation wx, double milliseconds)
        {
            this.updateWeather(wx);
            this.updateState(milliseconds);
            this.updateDeltaState(milliseconds);
        }

        public void updateWeather(WeatherSituation wx)
        {
            this.wind = wx.windAtPosition(this.position);
        }

        public void updateState(double milliseconds)
        {
            this.updateGroundspeed();
            this.updatePosition(milliseconds);
            this.updateAirspeed(milliseconds);
            this.updateAltitude(milliseconds);
            this.updateHeading(milliseconds);
        }

        public void updateDeltaState(double milliseconds)
        {

        }

        public void updateGroundspeed()
        {
            double radians = Position.DegreesToRadians(Position.AngleBetween(wind.direction, heading));
            double correction = wind.velocity * Math.Cos(radians);
            this.groundspeed = altitude / 200 + airspeed - correction;
        }

        public void updatePosition(double milliseconds)
        {
            double distance = this.groundspeed * milliseconds / Position.KM_TO_NM / Position.MS_IN_HR;
            this.position = this.position.destinationPoint(heading + this.position.magneticDeclination(altitude), distance);
        }

        public void updateAirspeed(double milliseconds)
        {
            double remaining = this.airspeedTarget - this.airspeed;
            int sign = remaining >= 0 ? 1 : -1;
            this.airspeed += sign * Math.Min(this.airspeedDelta, sign * remaining);
        }

        public void updateAltitude(double milliseconds)
        {
            double remaining = this.altitudeTarget - this.altitude;
            int sign = remaining >= 0 ? 1 : -1;
            this.altitude += sign * Math.Min(this.altitudeDelta, sign * remaining);
        }

        public void updateHeading(double milliseconds)
        {
            double remaining = (this.headingTarget - this.heading + 360) % 360;
            if (Math.Abs(remaining - 360) < remaining)
                remaining -= 360;
            int sign = remaining >= 0 ? 1 : -1;
            this.heading = (this.heading + sign * Math.Min(this.headingDelta, sign * remaining)) % 360;
        }
    }
}