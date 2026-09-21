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

// Static file directories for video uploads & exports
app.use('/uploads', express.static(config.get('uploadDir')));
app.use('/outputs', express.static(config.get('outputDir')));

// Routes
app.use('/api', apiRouter);

// Serve built frontend if client/dist exists (production all-in-one deploy)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
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
