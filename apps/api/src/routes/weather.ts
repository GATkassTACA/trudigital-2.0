import { Router } from 'express';
import { getWeatherByCoords, getWeatherByCity } from '../services/weather';

const router = Router();

// Get weather by coordinates (no auth required - for player)
router.get('/coords', async (req, res) => {
  try {
    const { lat, lon, units = 'imperial' } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    const weather = await getWeatherByCoords(
      parseFloat(lat as string),
      parseFloat(lon as string),
      units as 'imperial' | 'metric'
    );

    res.json({ success: true, weather });
  } catch (error: any) {
    console.error('Weather coords error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch weather' });
  }
});

// Get weather by city name (no auth required - for player)
router.get('/city', async (req, res) => {
  try {
    const { q, units = 'imperial' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'City name (q) is required' });
    }

    const weather = await getWeatherByCity(
      q as string,
      units as 'imperial' | 'metric'
    );

    res.json({ success: true, weather });
  } catch (error: any) {
    console.error('Weather city error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch weather' });
  }
});

// Get weather by location string (auto-detect coords or city)
router.get('/', async (req, res) => {
  try {
    const { location, units = 'imperial' } = req.query;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    const locationStr = location as string;

    // Check if it's coordinates (format: lat,lon)
    const coordMatch = locationStr.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);

    let weather;
    if (coordMatch) {
      weather = await getWeatherByCoords(
        parseFloat(coordMatch[1]),
        parseFloat(coordMatch[2]),
        units as 'imperial' | 'metric'
      );
    } else {
      weather = await getWeatherByCity(locationStr, units as 'imperial' | 'metric');
    }

    res.json({ success: true, weather });
  } catch (error: any) {
    console.error('Weather error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch weather' });
  }
});

export default router;
