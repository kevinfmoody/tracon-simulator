using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrueNorth.Geographic;

namespace TargetGenerator
{
    class Position
    {
        public const double EARTH_RADIUS_KM = 6371000.0;
        public const double KM_TO_NM = 0.5399568034557235;
        public const double MS_IN_HR = 3600000.0;
        public const double FT_IN_KM = 3280.84;

        public static MagVar magVar = new MagVar();
        public static long today = JulianDay();

        public double latitude { get; set; }
        public double longitude { get; set; }

        public Position(double latitude, double longitude)
        {
            this.latitude = latitude;
            this.longitude = longitude;
        }

        public static double AngleBetween(double a, double b)
        {
            double gap = Math.Abs(a - b);
            return Math.Min(gap, 360 - gap);
        }

        public static double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }

        public static double RadiansToDegrees(double radians)
        {
            return radians * 180 / Math.PI;
        }

        public static long JulianDay()
        {
            return (long) (DateTime.Now.ToOADate() + 2415018.5);
        }

        public double magneticDeclination(double altitude)
        {
            double[] fields = new double[6];
            return magVar.SGMagVar(DegreesToRadians(this.latitude), DegreesToRadians(this.longitude), altitude / FT_IN_KM, today, 1, fields);
        }

        public double distanceTo(Position position)
        {
            double R = EARTH_RADIUS_KM;
            double φ1 = DegreesToRadians(latitude), λ1 = DegreesToRadians(longitude);
            double φ2 = DegreesToRadians(position.latitude), λ2 = DegreesToRadians(position.longitude);
            double Δφ = φ2 - φ1;
            double Δλ = λ2 - λ1;
            double a = Math.Sin(Δφ / 2) * Math.Sin(Δφ / 2) +
                       Math.Cos(φ1) * Math.Cos(φ2) *
                       Math.Sin(Δλ / 2) * Math.Sin(Δλ / 2);
            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            double d = R * c;
            return d * KM_TO_NM;
        }

        public Position destinationPoint(double heading, double distance)
        {
            var δ = distance / EARTH_RADIUS_KM;
            var θ = DegreesToRadians(heading);
            var φ1 = DegreesToRadians(this.latitude);
            var λ1 = DegreesToRadians(this.longitude);
            var φ2 = Math.Asin(Math.Sin(φ1) * Math.Cos(δ) +
                                Math.Cos(φ1) * Math.Sin(δ) * Math.Cos(θ));
            var λ2 = λ1 + Math.Atan2(Math.Sin(θ) * Math.Sin(δ) * Math.Cos(φ1),
                                     Math.Cos(δ) - Math.Sin(φ1) * Math.Sin(φ2));
            λ2 = (λ2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
            return new Position(RadiansToDegrees(φ2), RadiansToDegrees(λ2));
        }
    }
}