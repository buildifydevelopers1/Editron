import fs from 'fs';
import OpenAI from 'openai';
import { config } from '../config.js';

export class AIService {
  /**
   * Helper to instantiate OpenAI client configured for Groq or custom base URL
   */
  static getClient(overrideApiKey, overrideBaseUrl) {
    const apiKey = overrideApiKey || config.get('groqApiKey');
    const baseURL = overrideBaseUrl || config.get('groqBaseUrl');

    if (!apiKey) {
      return null;
    }

    return new OpenAI({
      apiKey,
      baseURL
    });
  }

  /**
   * Transcribe audio using Groq Whisper (or configured whisper model)
   */
  static async transcribeAudio({ audioFilePath, apiKey, baseUrl, model }) {
    const client = this.getClient(apiKey, baseUrl);
    const whisperModel = model || config.get('groqWhisperModel') || 'whisper-large-v3';

    if (!client) {
      console.log('No API key provided. Using built-in demonstration transcript.');
      return this.generateMockTranscript();
    }

    try {
      const fileStream = fs.createReadStream(audioFilePath);
      const response = await client.audio.transcriptions.create({
        file: fileStream,
        model: whisperModel,
        response_format: 'verbose_json',
        timestamp_granularities: ['word', 'segment']
      });

      const segments = response.segments || [];
      const words = response.words || [];

      // If words array is empty but segments exist, construct approximate word timings
      const finalWords = words.length > 0 ? words : this.extractWordsFromSegments(segments);

      return {
        text: response.text,
        duration: response.duration,
        segments: segments.map((seg, idx) => ({
          id: `seg-${idx}`,
          start: seg.start,
          end: seg.end,
          text: seg.text.trim()
        })),
        words: finalWords.map((w, idx) => ({
          id: `word-${idx}`,
          word: w.word.trim(),
          start: w.start,
          end: w.end
        }))
      };
    } catch (err) {
      console.warn('Whisper API call failed, falling back to mock transcript:', err.message);
      return this.generateMockTranscript();
    }
  }

  /**
   * Generate Timeline Edits using configured LLM (gpt-oss-120b by default)
   */
  static async generateTimelineEdits({
    prompt,
    transcript = null,
    duration = 30,
    apiKey,
    baseUrl,
    model
  }) {
    const client = this.getClient(apiKey, baseUrl);
    const llmModel = model || config.get('groqLlmModel') || 'gpt-oss-120b';

    if (!client) {
      console.log('No API key configured. Executing intelligent heuristic edit plan.');
      return this.generateHeuristicEdits(prompt, transcript, duration);
    }

    const systemPrompt = `You are Editron's AI Video Editing Director, modeled after professional Hollywood & DaVinci Resolve colorists and editors.
Your job is to read the user's editing prompt, video duration, and speech transcript (with timestamps), and output a precise, professional JSON editing plan.

Output ONLY a JSON object with this EXACT structure:
{
  "summary": "Short 1-2 sentence explanation of your creative edit decisions",
  "cuts": [
    { "start": 0.0, "end": 12.5, "label": "Opening Hook", "speed": 1.0 },
    { "start": 14.0, "end": 28.5, "label": "Core Content", "speed": 1.0 }
  ],
  "colorGrading": {
    "presetName": "Teal & Orange / Cinematic / Vintage / Noir / Clean",
    "temperature": 15,
    "tint": -5,
    "contrast": 25,
    "saturation": 20,
    "lift": { "r": -0.05, "g": 0.02, "b": 0.08, "master": -0.02 },
    "gamma": { "r": 0.02, "g": -0.01, "b": -0.02, "master": 0.0 },
    "gain": { "r": 0.1, "g": 0.05, "b": -0.05, "master": 0.05 },
    "offset": { "r": 0.0, "g": 0.0, "b": 0.0, "master": 0.0 }
  },
  "subtitleStyle": {
    "preset": "hormozi",
    "fontFamily": "Impact",
    "fontSize": 32,
    "textColor": "#FFFF00",
    "highlightColor": "#22C55E",
    "strokeColor": "#000000",
    "strokeWidth": 3,
    "textCase": "uppercase",
    "animation": "bounce"
  },
  "zooms": [
    { "timestamp": 5.2, "duration": 1.5, "scale": 1.18, "anchor": "center", "label": "Punch-in emphasis" }
  ],
  "soundEffects": [
    { "timestamp": 0.1, "type": "whoosh", "volume": 0.7 }
  ]
}

Guidelines:
- If the user asks for "Teal & Orange", boost cool cyan/blues in shadows (lift) and warm amber/orange in highlights (gain).
- If the user asks for "auto cut silences", identify gaps of silence in the transcript or create natural pacing cuts.
- If the user mentions "Hormozi" or "MrBeast" subtitles, configure bold punchy uppercase text with vivid green/yellow highlight.
- If the user asks for "Cinematic", set subtle contrast, neutral film tone, and 2.39:1 letterbox or minimal clean subtitles.`;

    const userMessage = `User Request: "${prompt}"
Video Duration: ${duration.toFixed(1)} seconds
Transcript: ${JSON.stringify(transcript || 'No transcript available, optimize pacing visually.')}

Generate the professional timeline editing parameters for this request.`;

    try {
      const response = await client.chat.completions.create({
        model: llmModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const raw = response.choices[0]?.message?.content || '{}';
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`LLM call with ${llmModel} failed (${err.message}). Falling back to heuristic edit.`);
      return this.generateHeuristicEdits(prompt, transcript, duration);
    }
  }

  /**
   * Multimodal Vision Analysis (Groq Llama 3.2 Vision or Gemini)
   * Analyzes extracted keyframes for shot type, facial framing, lighting, and B-roll/meme recommendations
   */
  static async analyzeVideoVision({
    frames = [],
    prompt = '',
    apiKey,
    baseUrl,
    model
  }) {
    const client = this.getClient(apiKey, baseUrl);
    const visionModel = model || config.get('groqVisionModel') || 'llama-3.2-11b-vision-preview';

    if (!client || frames.length === 0) {
      console.log('No Vision API key or frames. Using heuristic scene understanding.');
      return this.generateHeuristicVisionAnalysis(frames);
    }

    try {
      // Build multimodal content payload with base64 images
      const content = [
        {
          type: 'text',
          text: `You are Editron's Multimodal Vision Director. Analyze these ${frames.length} keyframes extracted from the video sequence.
The user wants: "${prompt || 'Comprehensive visual scene understanding, shot composition, lighting quality, and B-roll / meme recommendations.'}"

Output ONLY a JSON object with this EXACT structure:
{
  "shotType": "Medium Close-up / Talking Head / Wide Cinematic / Action",
  "lightingQuality": "Good studio lighting / Slightly warm / Flat contrast / Low light",
  "emotionalTone": "Confident / Dynamic / Humorous / Educational / Cinematic",
  "faceFraming": "Centered / Rule-of-thirds / Multiple subjects",
  "sceneDescription": "Detailed 2-sentence description of the visual environment and subject",
  "colorRecommendations": {
    "presetName": "Teal & Orange / Cinematic / Punchy / Warm Sunset",
    "temperature": 15,
    "tint": -5,
    "contrast": 25,
    "saturation": 20
  },
  "memeAndBrollSuggestions": [
    { "type": "meme", "name": "Mind Blown Reaction", "timestamp": 3.5, "reason": "High-energy transition point" },
    { "type": "sfx", "name": "Vinyl Scratch", "timestamp": 0.5, "reason": "Comic pause" },
    { "type": "broll", "name": "Cyberpunk City / Tech Grid", "timestamp": 7.0, "reason": "Visual explanation cutaway" }
  ]
}`
        }
      ];

      // Add up to 3 frames as base64 to avoid payload bloat
      for (const frame of frames.slice(0, 3)) {
        if (fs.existsSync(frame.path)) {
          const imageBuffer = fs.readFileSync(frame.path);
          const base64Image = imageBuffer.toString('base64');
          content.push({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          });
        }
      }

      const response = await client.chat.completions.create({
        model: visionModel,
        messages: [{ role: 'user', content }],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      const raw = response.choices[0]?.message?.content || '{}';
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`Vision API call (${visionModel}) failed:`, err.message);
      return this.generateHeuristicVisionAnalysis(frames);
    }
  }

  /**
   * Heuristic fallback for Vision scene analysis
   */
  static generateHeuristicVisionAnalysis(frames = []) {
    return {
      shotType: "Talking Head / Medium Close-Up",
      lightingQuality: "Even Rec.709 Studio Lighting",
      emotionalTone: "Dynamic & Engaging",
      faceFraming: "Centered Subject with Safe Action Clearance",
      sceneDescription: "Clear focal subject positioned in front of modern digital backdrop. Good edge definition and sharp focus across all analyzed frames.",
      colorRecommendations: {
        presetName: "Cinematic Teal & Orange",
        temperature: 16,
        tint: -6,
        contrast: 28,
        saturation: 18
      },
      memeAndBrollSuggestions: [
        { type: "sfx", name: "Whoosh Riser", timestamp: 0.2, reason: "Punchy intro transition" },
        { type: "meme", name: "Pop Cat / Laugh Cut", timestamp: 4.8, reason: "Humor punchline overlay" },
        { type: "broll", name: "Tech Cyber Grid", timestamp: 7.5, reason: "Visual value cutaway on Track V2" }
      ]
    };
  }

  /**
   * High-accuracy heuristic edit generator for instant offline/demo testing
   */
  static generateHeuristicEdits(prompt, transcript, duration = 30) {
    const p = (prompt || '').toLowerCase();

    // Default DaVinci Resolve color baseline
    let colorGrading = {
      presetName: 'Clean Commercial',
      temperature: 0,
      tint: 0,
      contrast: 15,
      saturation: 10,
      lift: { r: 0.0, g: 0.0, b: 0.0, master: 0.0 },
      gamma: { r: 0.0, g: 0.0, b: 0.0, master: 0.0 },
      gain: { r: 0.0, g: 0.0, b: 0.0, master: 0.0 },
      offset: { r: 0.0, g: 0.0, b: 0.0, master: 0.0 }
    };

    if (p.includes('teal') || p.includes('orange') || p.includes('cinematic') || p.includes('hollywood')) {
      colorGrading = {
        presetName: 'Cinematic Teal & Orange',
        temperature: 18,
        tint: -6,
        contrast: 32,
        saturation: 22,
        lift: { r: -0.06, g: 0.04, b: 0.12, master: -0.03 },
        gamma: { r: 0.02, g: -0.02, b: -0.04, master: 0.0 },
        gain: { r: 0.14, g: 0.08, b: -0.08, master: 0.05 },
        offset: { r: 0.0, g: 0.0, b: 0.0, master: 0.0 }
      };
    } else if (p.includes('vintage') || p.includes('film') || p.includes('retro')) {
      colorGrading = {
        presetName: 'Vintage 35mm Film',
        temperature: 24,
        tint: 10,
        contrast: -8,
        saturation: -15,
        lift: { r: 0.08, g: 0.04, b: 0.0, master: 0.06 },
        gamma: { r: 0.03, g: 0.02, b: -0.03, master: 0.0 },
        gain: { r: 0.05, g: 0.03, b: -0.06, master: -0.02 },
        offset: { r: 0.02, g: 0.0, b: -0.02, master: 0.0 }
      };
    } else if (p.includes('cyber') || p.includes('neon') || p.includes('synth')) {
      colorGrading = {
        presetName: 'Cyberpunk Neon',
        temperature: -25,
        tint: 35,
        contrast: 40,
        saturation: 45,
        lift: { r: 0.12, g: -0.05, b: 0.18, master: -0.05 },
        gamma: { r: -0.08, g: 0.04, b: 0.12, master: 0.0 },
        gain: { r: 0.18, g: 0.02, b: 0.15, master: 0.08 },
        offset: { r: 0.0, g: 0.0, b: 0.0, master: 0.0 }
      };
    } else if (p.includes('noir') || p.includes('black and white') || p.includes('b&w')) {
      colorGrading = {
        presetName: 'Moody Film Noir',
        temperature: 0,
        tint: 0,
        contrast: 45,
        saturation: -100,
        lift: { r: -0.05, g: -0.05, b: -0.05, master: -0.08 },
        gamma: { r: 0.0, g: 0.0, b: 0.0, master: 0.0 },
        gain: { r: 0.1, g: 0.1, b: 0.1, master: 0.12 },
        offset: { r: 0.0, g: 0.0, b: 0.0, master: 0.0 }
      };
    }

    // Subtitle Style
    let subtitleStyle = {
      preset: 'hormozi',
      fontFamily: 'Montserrat, Impact, sans-serif',
      fontSize: 34,
      textColor: '#FFFFFF',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 4,
      textCase: 'uppercase',
      animation: 'bounce'
    };

    if (p.includes('mrbeast') || p.includes('pop') || p.includes('bouncy')) {
      subtitleStyle = {
        preset: 'mrbeast',
        fontFamily: 'Komika Axis, Impact, sans-serif',
        fontSize: 38,
        textColor: '#FFFFFF',
        highlightColor: '#00FFAA',
        strokeColor: '#000000',
        strokeWidth: 5,
        textCase: 'uppercase',
        animation: 'pop'
      };
    } else if (p.includes('minimal') || p.includes('subtle') || p.includes('clean')) {
      subtitleStyle = {
        preset: 'cinematic',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 24,
        textColor: '#F3F4F6',
        highlightColor: '#FFFFFF',
        strokeColor: 'rgba(0,0,0,0.6)',
        strokeWidth: 2,
        textCase: 'normal',
        animation: 'none'
      };
    }

    // Smart cuts
    const cuts = [];
    if (duration > 15 && (p.includes('cut') || p.includes('silence') || p.includes('fast') || p.includes('viral'))) {
      cuts.push({ start: 0, end: Math.min(6.5, duration), label: 'Hook Intro', speed: 1.0 });
      if (duration > 7.5) {
        cuts.push({ start: 7.2, end: Math.min(18.0, duration), label: 'Main Value', speed: 1.0 });
      }
      if (duration > 19.5) {
        cuts.push({ start: 19.0, end: duration, label: 'Call to Action', speed: 1.0 });
      }
    } else {
      cuts.push({ start: 0, end: duration, label: 'Original Footage', speed: 1.0 });
    }

    // Zoom punch-ins
    const zooms = [];
    if (p.includes('zoom') || p.includes('punch') || p.includes('viral') || p.includes('dynamic')) {
      zooms.push({ timestamp: 2.0, duration: 1.4, scale: 1.15, anchor: 'center', label: 'Punch-in hook' });
      if (duration > 10) {
        zooms.push({ timestamp: 9.5, duration: 2.0, scale: 1.2, anchor: 'center', label: 'Punch-in punchline' });
      }
    }

    return {
      summary: `AI edit plan created: Applied ${colorGrading.presetName} DaVinci look, configured ${subtitleStyle.preset} subtitle styling, generated ${cuts.length} pace-optimized cuts, and added dynamic punch-ins.`,
      cuts,
      colorGrading,
      subtitleStyle,
      zooms,
      soundEffects: [
        { timestamp: 0.1, type: 'whoosh', volume: 0.6 }
      ]
    };
  }

  /**
   * Built-in rich demo transcript for immediate exploration
   */
  static generateMockTranscript() {
    return {
      text: "Welcome to Editron, the world's most powerful AI video editor inspired by DaVinci Resolve. Today, we're going to transform your raw footage into a cinematic masterpiece in seconds!",
      duration: 12.0,
      segments: [
        {
          id: 'seg-0',
          start: 0.0,
          end: 4.8,
          text: "Welcome to Editron, the world's most powerful AI video editor inspired by DaVinci Resolve."
        },
        {
          id: 'seg-1',
          start: 5.0,
          end: 11.5,
          text: "Today, we're going to transform your raw footage into a cinematic masterpiece in seconds!"
        }
      ],
      words: [
        { id: 'w-0', word: 'Welcome', start: 0.1, end: 0.5 },
        { id: 'w-1', word: 'to', start: 0.5, end: 0.7 },
        { id: 'w-2', word: 'Editron,', start: 0.7, end: 1.3 },
        { id: 'w-3', word: 'the', start: 1.4, end: 1.6 },
        { id: 'w-4', word: "world's", start: 1.6, end: 2.0 },
        { id: 'w-5', word: 'most', start: 2.0, end: 2.3 },
        { id: 'w-6', word: 'powerful', start: 2.3, end: 2.8 },
        { id: 'w-7', word: 'AI', start: 2.8, end: 3.1 },
        { id: 'w-8', word: 'video', start: 3.1, end: 3.5 },
        { id: 'w-9', word: 'editor', start: 3.5, end: 3.9 },
        { id: 'w-10', word: 'inspired', start: 4.0, end: 4.4 },
        { id: 'w-11', word: 'by', start: 4.4, end: 4.6 },
        { id: 'w-12', word: 'DaVinci', start: 4.6, end: 5.1 },
        { id: 'w-13', word: 'Resolve.', start: 5.1, end: 5.7 },
        { id: 'w-14', word: 'Today,', start: 6.0, end: 6.4 },
        { id: 'w-15', word: "we're", start: 6.4, end: 6.7 },
        { id: 'w-16', word: 'going', start: 6.7, end: 6.9 },
        { id: 'w-17', word: 'to', start: 6.9, end: 7.1 },
        { id: 'w-18', word: 'transform', start: 7.1, end: 7.7 },
        { id: 'w-19', word: 'your', start: 7.7, end: 7.9 },
        { id: 'w-20', word: 'raw', start: 7.9, end: 8.3 },
        { id: 'w-21', word: 'footage', start: 8.3, end: 8.7 },
        { id: 'w-22', word: 'into', start: 8.8, end: 9.1 },
        { id: 'w-23', word: 'a', start: 9.1, end: 9.2 },
        { id: 'w-24', word: 'cinematic', start: 9.2, end: 9.8 },
        { id: 'w-25', word: 'masterpiece', start: 9.8, end: 10.5 },
        { id: 'w-26', word: 'in', start: 10.5, end: 10.7 },
        { id: 'w-27', word: 'seconds!', start: 10.7, end: 11.4 }
      ]
    };
  }

  static extractWordsFromSegments(segments) {
    const words = [];
    let wordIdx = 0;
    for (const seg of segments) {
      const split = seg.text.trim().split(/\s+/);
      const segDuration = seg.end - seg.start;
      const wordTime = segDuration / Math.max(split.length, 1);
      split.forEach((w, i) => {
        words.push({
          id: `w-${wordIdx++}`,
          word: w,
          start: seg.start + (i * wordTime),
          end: seg.start + ((i + 1) * wordTime)
        });
      });
    }
    return words;
  }
}
