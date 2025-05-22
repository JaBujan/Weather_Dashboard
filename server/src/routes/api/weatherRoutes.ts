import { Router } from 'express';
import WeatherService from '../../service/weatherService.js'; // Added import
import HistoryService from '../../service/historyService.js'; // Added import

const router = Router();

// POST Request with city name to retrieve weather data
router.post('/', async (req, res) => {
  console.log('[Server] POST /api/weather/ received. Body:', req.body);
  try {
    const { cityName } = req.body;
    if (!cityName) {
      console.log('[Server] City name is missing from request body');
      return res.status(400).json({ message: 'City name is required' });
    }

    console.log(`[Server] Fetching weather for city: ${cityName}`);
    const weatherData = await WeatherService.getWeather(cityName);
    console.log(`[Server] Weather data received from WeatherService for ${cityName}. Data:`, weatherData); // Log the actual data

    if (!weatherData || weatherData.length === 0) {
      console.log(`[Server] No weather data found for ${cityName}`);
      return res.status(404).json({ message: 'Weather data not found' });
    }

    // Save search to history
    // Ensure weatherData[0] and its properties exist before accessing them
    if (weatherData[0] && typeof weatherData[0].id !== 'undefined' && typeof weatherData[0].city !== 'undefined') {
      const cityToSave = {
        id: weatherData[0].id,
        name: weatherData[0].city,
      };
      console.log(`[Server] Saving city to history:`, cityToSave);
      await HistoryService.saveSearch(cityToSave);
      console.log(`[Server] City saved to history: ${cityToSave.name}`);
    } else {
      console.warn(`[Server] Could not save city to history for ${cityName} due to missing id or city name in weather data.`);
    }

    return res.json(weatherData); // Ensure response is sent
  } catch (error) {
    console.error('[Server] Error in POST /api/weather/ handler for city:', req.body?.cityName, error);
    // Ensure a response is sent even in case of an error
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to fetch weather data', error: (error as Error).message });
    }
  }
  // Fallback return to satisfy all code paths, though ideally, all paths above should return.
  // This might indicate a logic flaw if reached.
  if (!res.headersSent) {
     console.error('[Server] POST /api/weather/ handler reached end without sending response for city:', req.body?.cityName);
     return res.status(500).json({ message: 'Unknown server error' });
  }
});

// GET search history
router.get('/history', async (_req, res) => {
  console.log('[Server] GET /api/weather/history received'); // New log
  try {
    const history = await HistoryService.getSearchHistory();
    console.log('[Server] Search history retrieved:', history); // New log
    return res.json(history); // Ensure response is sent
  } catch (error) {
    console.error('[Server] Error in GET /api/weather/history handler:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to get search history', error: (error as Error).message });
    }
  }
  if (!res.headersSent) {
    console.error('[Server] GET /api/weather/history handler reached end without sending response');
    return res.status(500).json({ message: 'Unknown server error' });
  }
});

// DELETE city from search history
router.delete('/history/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[Server] DELETE /api/weather/history/${id} received`); // New log
  try {
    await HistoryService.deleteSearch(id);
    console.log(`[Server] City with id ${id} deleted from history`); // New log
    return res.status(204).send(); // Ensure response is sent (204 No Content)
  } catch (error) {
    console.error(`[Server] Error in DELETE /api/weather/history/${id} handler:`, error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to delete search history item', error: (error as Error).message });
    }
  }
  if (!res.headersSent) {
    console.error(`[Server] DELETE /api/weather/history/${id} handler reached end without sending response`);
    return res.status(500).json({ message: 'Unknown server error' });
  }
});

export default router;
