using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TargetGenerator
{
    class Wind
    {
        public double direction { get; set; }
        public double velocity { get; set; }
        public double gust { get; set; }
    }

    class WeatherStation
    {
        public string identifier { get; set; }
        public Position position { get; set; }
        public Wind wind { get; set; }
    }

    class WeatherSituation
    {
        public WeatherStation[] stations { get; set; }

        public Wind windAtPosition(Position position)
        {
            Wind wind = new Wind();
            double closest = Double.MaxValue;
            foreach (WeatherStation station in stations)
            {
                double distance = station.position.distanceTo(position);
                if (distance < closest)
                {
                    closest = distance;
                    wind = station.wind;
                }
            }
            return wind;
        }
    }
}