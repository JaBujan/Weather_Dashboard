import dotenv from 'dotenv';
import express from 'express';
dotenv.config();

// It seems to me I need these lines to correctly serve the dist folder...
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the routes
import routes from './routes/index.js';

const app = express();

const PORT = process.env.PORT || 3003;

// Serve static files of entire client dist folder
app.use(express.static(path.join(__dirname, "..", "..", "client", "dist")));

// Implement middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Implement middleware to connect the routes
// routes/index.ts and routes/api/index.ts define how our routes are mounted to the server
// Routes in routes/htmlRoutes.ts are mounted to /api.
// Routes in routes/api/weatherRoutes.ts are mounted to /api/weather.
app.use(routes);

// Start the server on the port
app.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));
