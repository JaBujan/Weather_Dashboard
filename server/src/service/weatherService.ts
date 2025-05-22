import dotenv from 'dotenv';
import dayjs from 'dayjs'; // Added import
dotenv.config();

// Retrieve API keys from environment variables
const API_KEY = process.env.API_KEY;
const API_BASE_URL = process.env.API_BASE_URL;

// Define an interface for the Coordinates object
interface Coordinates {
  lat: number,
  lon: number
}

// TODO: Define a class for the Weather object
class Weather {

}

// TODO: Complete the WeatherService class
class WeatherService {
  // Define the baseURL, API key, and city name properties
  apiUrl: string = process.env.API_BASE_URL as string;
  apiKey: string = process.env.API_KEY as string;
  cityName: string; // This will get specified on initialization

  weather!: Weather; // This we'll need to figure out later...

  // Variables for queries
  geocodeQuery!: string;
  locationData!: any;
  cityCoords!: Coordinates | undefined;
  weatherQuery!: string;
  weatherData!: any[];

  constructor(cityName: string) {
    this.cityName = cityName;
  }

  // Create buildGeocodeQuery method
  private buildGeocodeQuery(cityName: string) {
    // Use this.cityName to build a query that allows us to get that city's coordinates.
    this.geocodeQuery = this.apiUrl + `/geo/1.0/direct?q=${cityName}&limit=1&appid=${this.apiKey}`;
    console.log(`geocodeQuery updated: ${this.geocodeQuery}`);
  }

  // Create fetchLocationData method
  private async fetchLocationData(geocodeQuery: string): Promise<any> {
    // Make sure our geocodeQuery is valid
    if (geocodeQuery === undefined) {
      this.buildGeocodeQuery(this.cityName);
      geocodeQuery = this.geocodeQuery;
    }

    // It's just a simple fetch, we don't need to do much here...
    const respJSON = await (await fetch(geocodeQuery)).json() as any[];
    const locationData = respJSON[0];
    console.log(`locationData updated: ${locationData}`);

    return locationData;
  }

  // Create destructureLocationData method
  private destructureLocationData(locationData: any): Coordinates | undefined {

    if (locationData !== undefined) {
      const cityCoords: Coordinates = {
        lat: locationData.lat,
        lon: locationData.lon
      }

      return cityCoords;
    } else {
      return undefined;
    }
    // console.log(`cityCoords updated: (${cityCoords.lat}, ${cityCoords.lon})`);
  }

  // TODO: Create fetchAndDestructureLocationData method
  private async fetchAndDestructureLocationData(geocodeQuery: string) {
    const locationData = await this.fetchLocationData(geocodeQuery);
    return this.destructureLocationData(locationData);
  }

  // TODO: Create buildWeatherQuery method
  private async buildWeatherQuery(coords: Coordinates) {
    if (coords === undefined) {
      await this.fetchAndDestructureLocationData(this.geocodeQuery);
      coords = this.cityCoords as Coordinates;
    }
    // Use a set of coordinates to construct a string we can use for making calls to the owm API
    this.weatherQuery = this.apiUrl + `/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${this.apiKey}`;
    // console.log(`weatherQuery updated: ${this.weatherQuery}`);
  }

  // Create fetchWeatherData method
  private async fetchWeatherData(weatherQuery: string) {
    // It's just a simple fetch, we don't need to do much here...
    const respJSON = await (await fetch(weatherQuery)).json() as any[];
    const weatherData = respJSON;
    // console.log(`weatherData updated: ${weatherData}`);
    return weatherData;
  }

  // TODO: Build parseCurrentWeather method
  private parseCurrentWeather(weatherData: any) {
    const arr = weatherData.list;
    const parseArr: any[] = [];

    const ktv = (kelvin: number): number => {
      return (kelvin - 273.15)*(9/5) + 32;
    }

    // My hope in that doing this, I can generate an array of length 6 elements. 
    // If I can't generate such an array... I'll need to revisit this code...
    for (let i=0; i < arr.length; i = i + 8) {
      if (i === 8) {
        i--;
      }
      const info = arr[i];
      parseArr.push({
        city: this.cityName, 
        date: (new Date(info.dt * 1000)).toLocaleDateString("en-US"), 
        icon: info.weather[0].icon, 
        iconDescription: info.weather[0].description, 
        tempF: ktv(info.main.temp).toFixed(1), 
        windSpeed: info.wind.speed.toFixed(1), 
        humidity: info.main.humidity.toFixed(1)
      })
    }
    
    // console.log(`parseArr: ${parseArr[0].city}`);
    return parseArr;
  }

  // TODO: Complete buildForecastArray method
  // private buildForecastArray(currentWeather: Weather, weatherData: any[]) {}

  // TODO: Complete getWeatherForCity method
  // TODO: How will the helper calls work in this function?
  async getWeatherForCity() {
    
    // First, build a Geocode query based on our city
    this.buildGeocodeQuery(this.cityName);

    // Next, with our query, fetch and destructure location data, which we need to build a weather query
    this.cityCoords = await this.fetchAndDestructureLocationData(this.geocodeQuery);

    if (this.cityCoords !== undefined) {
      // Next, build our weather query
      this.buildWeatherQuery(this.cityCoords);

      // Next, fetch weather data with our weather query 
      this.weatherData = await this.fetchWeatherData(this.weatherQuery);

      // Next, we need to parse the response we get from the weather data
      return this.parseCurrentWeather(this.weatherData);

      // Finally, we build a forecast array with the parsed data
      // this.buildForecastArray(this.parseData);
    } else {
      return undefined;
    }
  }

  static async getWeather(cityName: string) {
    console.log(`[WeatherService] getWeather called for city: ${cityName}`);
    if (!API_KEY || !API_BASE_URL) {
      console.error('[WeatherService] API_KEY or API_BASE_URL is not defined. Check .env variables on server.');
      console.log(`[WeatherService] Current API_KEY: ${API_KEY}, API_BASE_URL: ${API_BASE_URL}`); // Log current values
      throw new Error('API configuration is missing on the server');
    }

    const weatherUrl = `${API_BASE_URL}/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=imperial`;
    console.log(`[WeatherService] Fetching current weather from URL: ${weatherUrl}`);

    try {
      const weatherResponse = await fetch(weatherUrl);
      console.log(`[WeatherService] Current weather API response status: ${weatherResponse.status} for ${cityName}`);
      if (!weatherResponse.ok) {
        const errorBody = await weatherResponse.text(); // Read error body as text
        console.error(`[WeatherService] Error fetching current weather for ${cityName}. Status: ${weatherResponse.status}, Response Body: ${errorBody}`);
        throw new Error(
          `Failed to fetch current weather for ${cityName}. Status: ${weatherResponse.status}. Message: ${errorBody}`
        );
      }
      const currentWeatherData = await weatherResponse.json();
      console.log(`[WeatherService] Successfully fetched current weather for ${cityName}:`, currentWeatherData);

      // Ensure coordinates are present before fetching forecast
      if (!currentWeatherData.coord || typeof currentWeatherData.coord.lat === 'undefined' || typeof currentWeatherData.coord.lon === 'undefined') {
        console.error(`[WeatherService] Missing coordinates for ${cityName}. Cannot fetch forecast.`);
        throw new Error(`Missing coordinates for ${cityName}. Cannot fetch forecast.`);
      }

      const forecastData = await this.getForecast(currentWeatherData.coord.lat, currentWeatherData.coord.lon);
      console.log(`[WeatherService] Forecast data received for ${cityName}:`, forecastData);

      return [
        {
          id: currentWeatherData.id,
          city: currentWeatherData.name,
          date: dayjs.unix(currentWeatherData.dt).format('M/D/YYYY'),
          icon: currentWeatherData.weather[0].icon,
          iconDescription: currentWeatherData.weather[0].description,
          tempF: currentWeatherData.main.temp,
          humidity: currentWeatherData.main.humidity,
          windSpeed: currentWeatherData.wind.speed,
        },
        ...forecastData,
      ];
    } catch (error) {
      console.error(`[WeatherService] Error in getWeather for ${cityName}:`, error);
      throw error; // Re-throw the error to be caught by the route handler
    }
  }

  static async getForecast(lat: number, lon: number) {
    console.log(`[WeatherService] getForecast called for lat: ${lat}, lon: ${lon}`);
    if (!API_KEY || !API_BASE_URL) {
      console.error('[WeatherService] API_KEY or API_BASE_URL is not defined for forecast. Check .env variables on server.');
      console.log(`[WeatherService] Current API_KEY (forecast): ${API_KEY}, API_BASE_URL (forecast): ${API_BASE_URL}`);
      throw new Error('API configuration is missing for forecast on the server');
    }
    const forecastUrl = `${API_BASE_URL}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;
    console.log(`[WeatherService] Fetching forecast from URL: ${forecastUrl}`);

    try {
      const forecastResponse = await fetch(forecastUrl);
      console.log(`[WeatherService] Forecast API response status: ${forecastResponse.status}`);
      if (!forecastResponse.ok) {
        const errorBody = await forecastResponse.text();
        console.error(`[WeatherService] Error fetching forecast. Status: ${forecastResponse.status}, Response Body: ${errorBody}`);
        throw new Error(
          `Failed to fetch forecast data. Status: ${forecastResponse.status}. Message: ${errorBody}`
        );
      }
      const forecastData = await forecastResponse.json();
      console.log(`[WeatherService] Successfully fetched forecast data:`, forecastData);

      const fiveDayForecast = [];
      if (forecastData && forecastData.list) { // Check if forecastData.list exists
        for (let i = 0; i < forecastData.list.length; i++) {
          const dayData = forecastData.list[i];
          if (dayData.dt_txt.includes('12:00:00')) {
            fiveDayForecast.push({
              date: dayjs(dayData.dt_txt).format('M/D/YYYY'),
              icon: dayData.weather[0].icon,
              iconDescription: dayData.weather[0].description,
              tempF: dayData.main.temp,
              humidity: dayData.main.humidity,
              windSpeed: dayData.wind.speed,
            });
          }
        }
      } else {
        console.warn('[WeatherService] Forecast data list is missing or empty.');
      }
      return fiveDayForecast;
    } catch (error) {
      console.error(`[WeatherService] Error in getForecast:`, error);
      throw error; // Re-throw the error
    }
  }
}

export default WeatherService;
