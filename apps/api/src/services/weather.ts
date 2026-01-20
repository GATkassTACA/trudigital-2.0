import axios from 'axios';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface WeatherCache {
  data: WeatherData;
  timestamp: number;
}

interface WeatherData {
  location: {
    city: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    description: string;
    icon: string;
    condition: string;
    sunrise: number;
    sunset: number;
  };
  forecast: ForecastDay[];
  units: 'imperial' | 'metric';
  updatedAt: string;
}

interface ForecastDay {
  date: string;
  dayName: string;
  high: number;
  low: number;
  description: string;
  icon: string;
  condition: string;
  precipitation: number;
}

// Simple in-memory cache
const weatherCache: Map<string, WeatherCache> = new Map();

// Weather condition to icon mapping
const conditionIcons: Record<string, string> = {
  '01d': 'sun',
  '01n': 'moon',
  '02d': 'cloud-sun',
  '02n': 'cloud-moon',
  '03d': 'cloud',
  '03n': 'cloud',
  '04d': 'clouds',
  '04n': 'clouds',
  '09d': 'cloud-drizzle',
  '09n': 'cloud-drizzle',
  '10d': 'cloud-rain',
  '10n': 'cloud-rain',
  '11d': 'cloud-lightning',
  '11n': 'cloud-lightning',
  '13d': 'snowflake',
  '13n': 'snowflake',
  '50d': 'cloud-fog',
  '50n': 'cloud-fog',
};

function getCacheKey(lat: number, lon: number, units: string): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)},${units}`;
}

function getDayName(timestamp: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(timestamp * 1000).getDay()];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export async function getWeatherByCoords(
  lat: number,
  lon: number,
  units: 'imperial' | 'metric' = 'imperial'
): Promise<WeatherData> {
  const cacheKey = getCacheKey(lat, lon, units);
  const cached = weatherCache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  if (!OPENWEATHER_API_KEY) {
    // Return mock data if no API key
    return getMockWeatherData(lat, lon, units);
  }

  try {
    // Fetch current weather
    const currentResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${OPENWEATHER_API_KEY}`
    );

    // Fetch 5-day forecast
    const forecastResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${OPENWEATHER_API_KEY}`
    );

    const current = currentResponse.data;
    const forecast = forecastResponse.data;

    // Process forecast into daily summaries
    const dailyForecasts = processForecast(forecast.list, units);

    const weatherData: WeatherData = {
      location: {
        city: current.name,
        country: current.sys.country,
        lat,
        lon,
      },
      current: {
        temp: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        windSpeed: Math.round(current.wind.speed),
        windDirection: current.wind.deg,
        description: current.weather[0].description,
        icon: conditionIcons[current.weather[0].icon] || 'cloud',
        condition: current.weather[0].main,
        sunrise: current.sys.sunrise,
        sunset: current.sys.sunset,
      },
      forecast: dailyForecasts,
      units,
      updatedAt: new Date().toISOString(),
    };

    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now(),
    });

    return weatherData;
  } catch (error) {
    console.error('Weather API error:', error);
    // Return mock data on error
    return getMockWeatherData(lat, lon, units);
  }
}

export async function getWeatherByCity(
  city: string,
  units: 'imperial' | 'metric' = 'imperial'
): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    return getMockWeatherData(40.7128, -74.006, units, city);
  }

  try {
    // Get coordinates from city name
    const geoResponse = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );

    if (geoResponse.data.length === 0) {
      throw new Error('City not found');
    }

    const { lat, lon } = geoResponse.data[0];
    return getWeatherByCoords(lat, lon, units);
  } catch (error) {
    console.error('Weather geocoding error:', error);
    return getMockWeatherData(40.7128, -74.006, units, city);
  }
}

function processForecast(list: any[], units: string): ForecastDay[] {
  const dailyMap = new Map<string, any[]>();

  // Group forecasts by day
  list.forEach((item) => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyMap.has(date)) {
      dailyMap.set(date, []);
    }
    dailyMap.get(date)!.push(item);
  });

  // Process each day
  const forecasts: ForecastDay[] = [];
  dailyMap.forEach((items, date) => {
    if (forecasts.length >= 5) return;

    const temps = items.map((i) => i.main.temp);
    const midday = items.find((i) => {
      const hour = new Date(i.dt * 1000).getHours();
      return hour >= 11 && hour <= 14;
    }) || items[Math.floor(items.length / 2)];

    forecasts.push({
      date: formatDate(items[0].dt),
      dayName: getDayName(items[0].dt),
      high: Math.round(Math.max(...temps)),
      low: Math.round(Math.min(...temps)),
      description: midday.weather[0].description,
      icon: conditionIcons[midday.weather[0].icon] || 'cloud',
      condition: midday.weather[0].main,
      precipitation: Math.round((midday.pop || 0) * 100),
    });
  });

  return forecasts;
}

function getMockWeatherData(
  lat: number,
  lon: number,
  units: 'imperial' | 'metric',
  city: string = 'New York'
): WeatherData {
  const tempUnit = units === 'imperial' ? 72 : 22;
  const windUnit = units === 'imperial' ? 8 : 13;

  return {
    location: {
      city,
      country: 'US',
      lat,
      lon,
    },
    current: {
      temp: tempUnit,
      feelsLike: tempUnit - 2,
      humidity: 45,
      windSpeed: windUnit,
      windDirection: 180,
      description: 'Partly cloudy',
      icon: 'cloud-sun',
      condition: 'Clouds',
      sunrise: Math.floor(Date.now() / 1000) - 21600,
      sunset: Math.floor(Date.now() / 1000) + 21600,
    },
    forecast: [
      { date: 'Today', dayName: 'Today', high: tempUnit + 3, low: tempUnit - 8, description: 'Partly cloudy', icon: 'cloud-sun', condition: 'Clouds', precipitation: 10 },
      { date: 'Tomorrow', dayName: 'Tomorrow', high: tempUnit + 5, low: tempUnit - 6, description: 'Sunny', icon: 'sun', condition: 'Clear', precipitation: 0 },
      { date: 'Day 3', dayName: 'Wednesday', high: tempUnit + 2, low: tempUnit - 10, description: 'Cloudy', icon: 'cloud', condition: 'Clouds', precipitation: 20 },
      { date: 'Day 4', dayName: 'Thursday', high: tempUnit - 2, low: tempUnit - 12, description: 'Rain', icon: 'cloud-rain', condition: 'Rain', precipitation: 80 },
      { date: 'Day 5', dayName: 'Friday', high: tempUnit + 1, low: tempUnit - 9, description: 'Partly cloudy', icon: 'cloud-sun', condition: 'Clouds', precipitation: 15 },
    ],
    units,
    updatedAt: new Date().toISOString(),
  };
}

export function clearWeatherCache(): void {
  weatherCache.clear();
}
