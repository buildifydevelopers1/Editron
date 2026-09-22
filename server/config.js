import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// In-memory runtime configuration with fallback to process.env
class ConfigManager {
  constructor() {
    this.config = {
      port: parseInt(process.env.PORT || '3001', 10),
      host: process.env.HOST || '0.0.0.0',
      groqApiKey: process.env.GROQ_API_KEY || '',
      groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
      groqLlmModel: process.env.GROQ_LLM_MODEL || 'gpt-oss-120b',
      groqFallbackModel: process.env.GROQ_FALLBACK_MODEL || 'llama-3.1-8b-instant',
      groqWhisperModel: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3',
      groqVisionModel: process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview',
      uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads'),
      outputDir: process.env.OUTPUT_DIR || path.resolve(__dirname, '../outputs'),
    };
  }

  get(key) {
    return this.config[key];
  }

  getAll() {
    return {
      ...this.config,
      hasApiKey: Boolean(this.config.groqApiKey && this.config.groqApiKey.trim().length > 0)
    };
  }

  update(newConfig = {}) {
    if (newConfig.groqApiKey !== undefined) this.config.groqApiKey = newConfig.groqApiKey;
    if (newConfig.groqBaseUrl !== undefined) this.config.groqBaseUrl = newConfig.groqBaseUrl;
    if (newConfig.groqLlmModel !== undefined) this.config.groqLlmModel = newConfig.groqLlmModel;
    if (newConfig.groqFallbackModel !== undefined) this.config.groqFallbackModel = newConfig.groqFallbackModel;
    if (newConfig.groqWhisperModel !== undefined) this.config.groqWhisperModel = newConfig.groqWhisperModel;
    if (newConfig.groqVisionModel !== undefined) this.config.groqVisionModel = newConfig.groqVisionModel;
    return this.getAll();
  }
}

export const config = new ConfigManager();
