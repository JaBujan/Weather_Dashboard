import { writeFile } from "fs";
import { promises as fs } from "fs";
// I need this to know what __dirname is
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO: Define a City class with name and id properties
interface City {
  name: string,
  id: number
}

// TODO: Complete the HistoryService class
class HistoryService {
  // TODO: Define a read method that reads from the searchHistory.json file
  cities: City[] = [];
  targetFile: string = path.join(__dirname, "..", "..", "db", "searchHistory.json");
  id: number = 0;
  
  private async read(): Promise<any> {
    // Reads the .json and returns a basic parsed response.
    try {
      const data = await fs.readFile(this.targetFile, 'utf8');
      return JSON.parse(data);
    } catch (err) {
        console.error('Error reading or parsing JSON:', err);
        return null;
    }
}

  // TODO: Define a write method that writes the updated cities array to the searchHistory.json file
  private async write(cities: City[]): Promise<void> {
    console.log(`Writing: ${cities}`);
    writeFile(this.targetFile, JSON.stringify(cities, null, 1), 'utf8',  (err) => {
      if (err) {
          console.error('Error writing file:', err);
          return;
      }
      console.log('File written successfully!');
    });
  }

  // TODO: Define a getCities method that reads the cities from the searchHistory.json file and returns them as an array of City objects
  async getCities(): Promise<City[]> {
    // To begin, we need to read the searchHistory file
    const response = await this.read(); 

    // For now, we don't fully understand what the response actually is, so let's try this...
    console.log(response);
    
    // What cities did we actually get? 
    console.log("Current cities in search history: ");
    for (let i=0; i < response.length; i++) {
      console.log(response[i].name);
    }
    return response;
  }

  // TODO Define an addCity method that adds a city to the searchHistory.json file
  async addCity(city: string) {
    // Let's update the cities array.
    console.log('Updating cities array!');
    this.cities = await this.getCities();
    if (this.cities === undefined) {
      this.cities = [];
    }

    // Check that the city isn't already in our list of cities...
    let alreadyThere = false;
    for (let i = 0; i < this.cities.length; i++) {
      if (this.cities[i].name === city) {
        alreadyThere = true;
      }
    }

    if (!alreadyThere) {
      this.cities.push({
        name: city,
        id: this.id
      });
      this.id++;
      console.log(`Updated cities array: ${this.cities}`);
      // Next, let's write our cities array to the .json;
      this.write(this.cities);
    }
  }

  // * BONUS TODO: Define a removeCity method that removes a city from the searchHistory.json file
  async removeCity(id: string) {
    this.cities = await this.getCities();
    
    let target = -1;
    for (let i=0; i< this.cities.length; i++) {
      if (String(this.cities[i].id) === id) {
        console.log('Found target!');
        target = i;
      };
    }

    this.cities.splice(target);
    this.write(this.cities);
  }
}

export default new HistoryService();
