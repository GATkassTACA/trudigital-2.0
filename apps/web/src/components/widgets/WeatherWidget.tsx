'use client';

import { useEffect, useState } from 'react';
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSun,
  CloudMoon,
  Wind,
  Droplets,
  Thermometer,
  Loader2,
  MapPin,
  Snowflake
} from 'lucide-react';

interface WeatherData {
  location: {
    city: string;
    country: string;
  };
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    description: string;
    icon: string;
    condition: string;
  };
  forecast: {
    date: string;
    dayName: string;
    high: number;
    low: number;
    icon: string;
    precipitation: number;
  }[];
  units: 'imperial' | 'metric';
  updatedAt: string;
}

interface WeatherWidgetProps {
  location?: string;
  units?: 'imperial' | 'metric';
  style?: 'full' | 'compact' | 'minimal' | 'forecast';
  theme?: 'dark' | 'light' | 'glass';
  showForecast?: boolean;
  forecastDays?: number;
  refreshInterval?: number; // in seconds
  className?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Icon mapping
const weatherIcons: Record<string, React.ComponentType<any>> = {
  'sun': Sun,
  'moon': Moon,
  'cloud': Cloud,
  'clouds': Cloud,
  'cloud-sun': CloudSun,
  'cloud-moon': CloudMoon,
  'cloud-rain': CloudRain,
  'cloud-drizzle': CloudDrizzle,
  'cloud-lightning': CloudLightning,
  'cloud-fog': CloudFog,
  'snowflake': Snowflake,
};

function WeatherIcon({ icon, className }: { icon: string; className?: string }) {
  const IconComponent = weatherIcons[icon] || Cloud;
  return <IconComponent className={className} />;
}

export default function WeatherWidget({
  location = 'New York',
  units = 'imperial',
  style = 'full',
  theme = 'dark',
  showForecast = true,
  forecastDays = 5,
  refreshInterval = 600, // 10 minutes
  className = '',
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/weather?location=${encodeURIComponent(location)}&units=${units}`
      );
      const data = await response.json();

      if (data.success) {
        setWeather(data.weather);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch weather');
      }
    } catch (err) {
      setError('Failed to connect to weather service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [location, units, refreshInterval]);

  const tempUnit = units === 'imperial' ? '°F' : '°C';
  const speedUnit = units === 'imperial' ? 'mph' : 'km/h';

  // Theme classes
  const themeClasses = {
    dark: 'bg-gray-900/90 text-white',
    light: 'bg-white/90 text-gray-900',
    glass: 'bg-white/10 backdrop-blur-xl text-white border border-white/20',
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 rounded-2xl ${themeClasses[theme]} ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin opacity-50" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`flex items-center justify-center p-8 rounded-2xl ${themeClasses[theme]} ${className}`}>
        <p className="text-sm opacity-50">{error || 'Weather unavailable'}</p>
      </div>
    );
  }

  // Minimal style - just temp and icon
  if (style === 'minimal') {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-xl ${themeClasses[theme]} ${className}`}>
        <WeatherIcon icon={weather.current.icon} className="w-10 h-10" />
        <div>
          <div className="text-3xl font-bold">{weather.current.temp}{tempUnit}</div>
          <div className="text-sm opacity-70">{weather.location.city}</div>
        </div>
      </div>
    );
  }

  // Compact style - current weather only
  if (style === 'compact') {
    return (
      <div className={`p-6 rounded-2xl ${themeClasses[theme]} ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
              <MapPin className="w-4 h-4" />
              {weather.location.city}
            </div>
            <div className="text-5xl font-bold">{weather.current.temp}{tempUnit}</div>
            <div className="text-lg capitalize mt-1">{weather.current.description}</div>
          </div>
          <WeatherIcon icon={weather.current.icon} className="w-20 h-20 opacity-90" />
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm opacity-70">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Feels {weather.current.feelsLike}{tempUnit}
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4" />
            {weather.current.windSpeed} {speedUnit}
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            {weather.current.humidity}%
          </div>
        </div>
      </div>
    );
  }

  // Forecast only style
  if (style === 'forecast') {
    return (
      <div className={`p-6 rounded-2xl ${themeClasses[theme]} ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 opacity-70" />
          <span className="font-medium">{weather.location.city}</span>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {weather.forecast.slice(0, forecastDays).map((day, i) => (
            <div key={i} className="text-center">
              <div className="text-sm opacity-70 mb-2">{day.dayName.slice(0, 3)}</div>
              <WeatherIcon icon={day.icon} className="w-8 h-8 mx-auto mb-2" />
              <div className="font-bold">{day.high}°</div>
              <div className="text-sm opacity-50">{day.low}°</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full style - everything
  return (
    <div className={`p-8 rounded-3xl ${themeClasses[theme]} ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm opacity-70 mb-2">
        <MapPin className="w-4 h-4" />
        {weather.location.city}, {weather.location.country}
      </div>

      {/* Current Weather */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-7xl font-bold tracking-tight">
            {weather.current.temp}
            <span className="text-4xl font-normal opacity-70">{tempUnit}</span>
          </div>
          <div className="text-xl capitalize mt-2">{weather.current.description}</div>
        </div>
        <WeatherIcon icon={weather.current.icon} className="w-28 h-28 opacity-90" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 p-4 rounded-xl bg-black/10">
        <div className="text-center">
          <Thermometer className="w-5 h-5 mx-auto mb-1 opacity-70" />
          <div className="text-sm opacity-70">Feels Like</div>
          <div className="font-bold">{weather.current.feelsLike}{tempUnit}</div>
        </div>
        <div className="text-center">
          <Wind className="w-5 h-5 mx-auto mb-1 opacity-70" />
          <div className="text-sm opacity-70">Wind</div>
          <div className="font-bold">{weather.current.windSpeed} {speedUnit}</div>
        </div>
        <div className="text-center">
          <Droplets className="w-5 h-5 mx-auto mb-1 opacity-70" />
          <div className="text-sm opacity-70">Humidity</div>
          <div className="font-bold">{weather.current.humidity}%</div>
        </div>
      </div>

      {/* Forecast */}
      {showForecast && (
        <div>
          <div className="text-sm font-medium opacity-70 mb-4">{forecastDays}-Day Forecast</div>
          <div className="grid grid-cols-5 gap-3">
            {weather.forecast.slice(0, forecastDays).map((day, i) => (
              <div
                key={i}
                className="text-center p-3 rounded-xl bg-black/10 hover:bg-black/20 transition"
              >
                <div className="text-xs opacity-70 mb-2">
                  {i === 0 ? 'Today' : day.dayName.slice(0, 3)}
                </div>
                <WeatherIcon icon={day.icon} className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">{day.high}°</div>
                <div className="text-sm opacity-50">{day.low}°</div>
                {day.precipitation > 0 && (
                  <div className="text-xs text-blue-400 mt-1 flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3" />
                    {day.precipitation}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
