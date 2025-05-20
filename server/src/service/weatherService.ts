import dotenv from 'dotenv';
dotenv.config();

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
}

export default WeatherService;
