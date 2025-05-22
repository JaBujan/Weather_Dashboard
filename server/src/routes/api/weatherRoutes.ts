import { Router } from 'express';
import WeatherService from '../../service/weatherService.js';
import HistoryServiceInstance from '../../service/historyService.js'; // Renamed import for clarity

const router = Router();

// Define a more specific type for the current weather part of the response
interface CurrentWeatherData {
  id: number; // Assuming id is present from OpenWeatherMap
  city: string; // OpenWeatherMap uses 'name' for city
  date: string;
  icon: string;
  iconDescription: string;
  tempF: number;
  humidity: number;
  windSpeed: number;
}

// Define a type for the forecast items (optional, but good practice)
interface ForecastItemData {
  date: string;
  icon: string;
  iconDescription: string;
  tempF: number;
  humidity: number;
  windSpeed: number;
}

// Combined type for the overall response from WeatherService.getWeather
type WeatherServiceResponse = [CurrentWeatherData, ...ForecastItemData[]];


// POST Request with city name to retrieve weather data
router.post('/', async (req, res) => {
  console.log('[Server] POST /api/weather/ received. Body:', req.body);
  try {
    const { cityName } = req.body;
    if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
      console.log('[Server] City name is missing or invalid from request body');
      return res.status(400).json({ message: 'City name is required and must be a non-empty string' });
    }

    console.log(`[Server] Fetching weather for city: ${cityName}`);
    const weatherDataResponse = await WeatherService.getWeather(cityName) as WeatherServiceResponse; 
    console.log(`[Server] Weather data received from WeatherService for ${cityName}.`);

    if (!weatherDataResponse || weatherDataResponse.length === 0) {
      console.log(`[Server] No weather data found for ${cityName}`);
      return res.status(404).json({ message: 'Weather data not found for ' + cityName });
    }

    const currentWeatherData = weatherDataResponse[0]; 

    // Save search to history
    // Ensure currentWeatherData and its properties 'city' (which is 'name') and 'id' are present
    if (currentWeatherData && typeof currentWeatherData.city === 'string' && currentWeatherData.id !== undefined) {
      console.log(`[Server] Saving city to history: ${currentWeatherData.city}`);
      await HistoryServiceInstance.addCity(currentWeatherData.city);
      console.log(`[Server] City saved to history: ${currentWeatherData.city}`);
    } else {
      console.warn(`[Server] Could not save city to history for ${cityName} due to missing or invalid city name or id in weather data. WeatherData[0]:`, currentWeatherData);
      // Decide if this is an error condition that should prevent sending weather data,
      // or just a warning. For now, we'll proceed to send weather data if available.
    }

    return res.json(weatherDataResponse);
  } catch (error: any) {
    console.error('[Server] Error in POST /api/weather/ handler for city:', req.body?.cityName, error);
    if (res.headersSent) {
      console.error('[Server] Headers already sent in POST /api/weather/ error handler. Cannot send new error response.');
      return; // Explicitly return if headers already sent
    }
    return res.status(500).json({ message: error.message || 'Failed to fetch weather data' });
  }
  // Fallback: This should ideally not be reached if try/catch is exhaustive.
  if (!res.headersSent) {
    console.error('[Server] POST /api/weather/ handler reached end without sending response for city:', req.body?.cityName);
    return res.status(500).json({ message: 'Unknown server error in POST /api/weather/' });
  }
});

// GET search history
router.get('/history', async (_req, res) => {
  console.log('[Server] GET /api/weather/history received');
  try {
    const history = await HistoryServiceInstance.getCities();
    console.log('[Server] Search history retrieved (count):', history?.length);
    return res.json(history);
  } catch (error: any) {
    console.error('[Server] Error in GET /api/weather/history handler:', error);
    if (res.headersSent) {
      console.error('[Server] Headers already sent in GET /history error handler. Cannot send new error response.');
      return; // Explicitly return if headers already sent
    }
    return res.status(500).json({ message: error.message || 'Failed to get search history' });
  }
   // Fallback: This should ideally not be reached if try/catch is exhaustive.
  if (!res.headersSent) {
    console.error('[Server] GET /api/weather/history handler reached end without sending response');
    return res.status(500).json({ message: 'Unknown server error in GET /history' });
  }
});

// DELETE city from search history
router.delete('/history/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[Server] DELETE /api/weather/history/${id} received`);
  try {
    await HistoryServiceInstance.removeCity(id); 
    console.log(`[Server] City with id ${id} attempted to be deleted from history`);
    return res.status(204).send(); 
  } catch (error: any) {
    console.error(`[Server] Error in DELETE /api/weather/history/${id} handler:`, error);
    if (res.headersSent) {
      console.error(`[Server] Headers already sent in DELETE /history/:id error handler. Cannot send new error response.`);
      return; // Explicitly return if headers already sent
    }
    return res.status(500).json({ message: error.message || 'Failed to delete search history item' });
  }
   // Fallback: This should ideally not be reached if try/catch is exhaustive.
  if (!res.headersSent) {
    console.error(`[Server] DELETE /api/weather/history/${id} handler reached end without sending response`);
    return res.status(500).json({ message: 'Unknown server error in DELETE /history/:id' });
  }
});

export default router;
