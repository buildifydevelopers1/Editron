import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = config.get('port');

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static file directories for video uploads & exports with explicit CORS headers
const uploadDir = config.get('uploadDir');
const outputDir = config.get('outputDir');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Auto-seed sample media into uploadDir if not present (handles fresh Render persistent disks)
const candidateSeeds = [
  path.join(__dirname, '../client/public/uploads'),
  path.join(__dirname, '../client/dist/uploads'),
  path.join(__dirname, '../../client/public/uploads')
];
for (const seedDir of candidateSeeds) {
  if (fs.existsSync(seedDir)) {
    try {
      const files = fs.readdirSync(seedDir);
      let copiedCount = 0;
      for (const file of files) {
        const src = path.join(seedDir, file);
        const dest = path.join(uploadDir, file);
        if (!fs.existsSync(dest) && fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dest);
          copiedCount++;
        }
      }
      if (copiedCount > 0) {
        console.log(`✅ Auto-seeded ${copiedCount} media assets from ${seedDir} into ${uploadDir}`);
      }
    } catch (err) {
      console.warn('Auto-seed notice:', err.message);
    }
  }
}

app.use('/uploads', cors(), express.static(uploadDir));
app.use('/outputs', cors(), express.static(outputDir));

// Routes
app.use('/api', apiRouter);

// Serve built frontend if client/dist exists (production all-in-one deploy)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    // Guard against returning index.html for missing asset or api routes
    if (req.path.startsWith('/uploads/') || req.path.startsWith('/outputs/') || req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start server
app.listen(port, () => {
  console.log(`=================================================`);
  console.log(`🎬 Editron Engine Server listening on port ${port}`);
  console.log(`🤖 AI LLM Model: ${config.get('groqLlmModel')}`);
  console.log(`🎙️ AI Whisper Model: ${config.get('groqWhisperModel')}`);
  console.log(`🌐 Base URL: ${config.get('groqBaseUrl')}`);
  console.log(`🔑 API Key Set: ${config.getAll().hasApiKey ? 'YES' : 'NO (Demo/Offline Mode Ready)'}`);
  console.log(`=================================================`);
});
