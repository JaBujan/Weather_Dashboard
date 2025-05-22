import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// Define route to serve index.html
router.get('/', (_req, res) => {
  // Construct the path to index.html relative to the compiled htmlRoutes.js in the dist folder
  // server/dist/routes/htmlRoutes.js -> ../../../client/dist/index.html
  res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
});

export default router;
