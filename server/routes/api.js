import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import { AIService } from '../services/ai.js';
import { FFmpegService } from '../services/ffmpeg.js';
import { TrendingAudioService } from '../services/trending-audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload & output directories exist
const uploadDir = config.get('uploadDir');
const outputDir = config.get('outputDir');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });

/**
 * Health Check & Capabilities
 */
router.get('/health', async (req, res) => {
  const ffmpegStatus = await FFmpegService.checkFFmpeg();
  res.json({
    status: 'ok',
    appName: 'Editron Backend Engine',
    ffmpeg: ffmpegStatus,
    config: {
      hasApiKey: config.getAll().hasApiKey,
      llmModel: config.get('groqLlmModel'),
      whisperModel: config.get('groqWhisperModel'),
      visionModel: config.get('groqVisionModel'),
      baseUrl: config.get('groqBaseUrl')
    }
  });
});

/**
 * Get / Update Runtime Configuration (API Key, Model Name)
 */
router.get('/config', (req, res) => {
  const all = config.getAll();
  res.json({
    hasApiKey: all.hasApiKey,
    apiKeyMasked: all.groqApiKey ? `${all.groqApiKey.slice(0, 4)}...${all.groqApiKey.slice(-4)}` : '',
    baseUrl: all.groqBaseUrl,
    llmModel: all.groqLlmModel,
    whisperModel: all.groqWhisperModel,
    visionModel: all.groqVisionModel
  });
});

router.post('/config', (req, res) => {
  const { apiKey, baseUrl, llmModel, whisperModel, visionModel } = req.body;
  const updated = config.update({
    groqApiKey: apiKey,
    groqBaseUrl: baseUrl,
    groqLlmModel: llmModel,
    groqWhisperModel: whisperModel,
    groqVisionModel: visionModel
  });
  res.json({
    success: true,
    message: 'Configuration updated successfully',
    config: {
      hasApiKey: updated.hasApiKey,
      baseUrl: updated.groqBaseUrl,
      llmModel: updated.groqLlmModel,
      whisperModel: updated.groqWhisperModel,
      visionModel: updated.groqVisionModel
    }
  });
});

/**
 * Multimodal Vision Analysis Endpoint
 */
router.post('/vision-analyze', async (req, res) => {
  try {
    const { videoPath, duration, prompt } = req.body;
    if (!videoPath || !fs.existsSync(videoPath)) {
      return res.status(400).json({ error: 'Valid videoPath is required for vision analysis' });
    }

    // 1. Extract keyframes across the video
    const frames = await FFmpegService.extractKeyframes(videoPath, duration || 12, 4, uploadDir);

    // 2. Call multimodal vision AI
    const analysis = await AIService.analyzeVideoVision({
      frames,
      prompt
    });

    res.json({
      success: true,
      frames,
      analysis
    });
  } catch (err) {
    console.error('Vision analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Curated Assets Library: Memes, B-Roll, Trending Audio, SFX
 */
router.get('/assets/library', (req, res) => {
  const library = [
    // Memes / Reactions
    {
      id: 'meme-1',
      name: 'Mind Blown Explosion',
      category: 'meme',
      type: 'video',
      duration: 2.5,
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80',
      url: '/uploads/sample_editron.mp4',
      description: 'Viral cosmic explosion reaction for high-energy moments'
    },
    {
      id: 'meme-2',
      name: 'Confused Reaction Cut',
      category: 'meme',
      type: 'video',
      duration: 3.0,
      thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
      url: '/uploads/sample_editron.mp4',
      description: 'Humorous head turn pause for awkward or funny beats'
    },
    {
      id: 'meme-3',
      name: 'Pop Cat Bouncy',
      category: 'meme',
      type: 'video',
      duration: 1.8,
      thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80',
      url: '/uploads/sample_editron.mp4',
      description: 'Bouncy viral pop cat overlay for rhythmic cuts'
    },
    // Cinematic B-Roll
    {
      id: 'broll-1',
      name: 'Cyberpunk Neon City',
      category: 'broll',
      type: 'video',
      duration: 5.0,
      thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&q=80',
      url: '/uploads/sample_editron.mp4',
      description: 'Sleek night city aesthetic overlay for tech & futuristic talks'
    },
    {
      id: 'broll-2',
      name: 'Modern Tech Matrix Code',
      category: 'broll',
      type: 'video',
      duration: 4.0,
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80',
      url: '/uploads/sample_editron.mp4',
      description: 'Digital data streams and software development B-roll'
    },
    {
      id: 'broll-3',
      name: 'Golden Hour Mountain Aerial',
      category: 'broll',
      type: 'video',
      duration: 6.0,
      thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&q=80',
      url: '/uploads/sample_editron.mp4',
      description: 'Breathtaking 4K drone landscape for cinematic intros'
    },
    // Trending Audio & SFX
    {
      id: 'sfx-1',
      name: 'Punchy Cinematic Whoosh',
      category: 'sfx',
      type: 'audio',
      duration: 0.8,
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
      url: '',
      description: 'Fast-paced transition whoosh for scene cuts'
    },
    {
      id: 'sfx-2',
      name: 'Vinyl Scratch Stop',
      category: 'sfx',
      type: 'audio',
      duration: 1.2,
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
      url: '',
      description: 'Classic record stop effect for funny interruptions'
    },
    {
      id: 'sfx-3',
      name: 'Deep Cinematic Sub Boom',
      category: 'sfx',
      type: 'audio',
      duration: 2.0,
      thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&q=80',
      url: '',
      description: 'Dramatic bass drop impact for epic reveals'
    },
    {
      id: 'audio-1',
      name: 'Viral Lo-Fi Chill Beats',
      category: 'audio',
      type: 'audio',
      duration: 15.0,
      thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80',
      url: '',
      description: 'Smooth background study / tutorial music track'
    }
  ];

  res.json({ success: true, library });
});

/**
 * Search Trending Internet Audio (e.g. Attitude Hindi Songs for Reels)
 */
router.post('/trending-audio/search', async (req, res) => {
  try {
    const { query = 'trending attitude hindi song' } = req.body;
    const songs = await TrendingAudioService.searchTrending(query);
    res.json({
      success: true,
      query,
      songs
    });
  } catch (err) {
    console.error('Trending audio search error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Apply Selected Trending Attitude Song into Full Attitude Reel Timeline
 */
router.post('/trending-audio/apply-attitude-reel', async (req, res) => {
  try {
    const { songId, duration = 12 } = req.body;
    const catalog = TrendingAudioService.getTrendingCatalog();
    const selectedSong = catalog.find(s => s.id === songId) || catalog[0];

    // Build the complete Attitude Reel edit specification
    const attitudeReel = {
      song: selectedSong,
      aspectRatio: '9:16', // Instagram Reel / YouTube Shorts standard
      summary: `Applied "${selectedSong.title}" by ${selectedSong.artist}. Auto-configured 9:16 vertical framing, high-contrast attitude color grade, dynamic beat-drop punch-in at ${selectedSong.dropTime}s, and aggressive Hormozi subtitles.`,
      colorGrading: {
        presetName: 'Attitude Reel Contrast',
        temperature: 12,
        tint: -8,
        contrast: 42,
        saturation: 25,
        brightness: -2,
        lift: { r: -0.08, g: 0.02, b: 0.1, master: -0.04 },
        gamma: { r: 0.04, g: -0.02, b: -0.04, master: 0.0 },
        gain: { r: 0.16, g: 0.08, b: -0.06, master: 0.06 },
        offset: { r: 0.0, g: 0.0, b: 0.0, master: 0.0 }
      },
      subtitleStyle: {
        preset: 'hormozi',
        fontFamily: "'Montserrat', Impact, sans-serif",
        fontSize: 38,
        textColor: '#FFFFFF',
        highlightColor: '#FACC15', // Neon Yellow/Gold
        strokeColor: '#000000',
        strokeWidth: 5,
        textCase: 'uppercase',
        animation: 'bounce',
        positionY: 22
      },
      cuts: [
        {
          start: 0.0,
          end: selectedSong.dropTime,
          label: 'Attitude Build-up',
          speed: 1.0
        },
        {
          start: selectedSong.dropTime,
          end: duration,
          label: '🔥 BASS DROP CLIMAX',
          speed: 1.0
        }
      ],
      audioTrack: {
        id: `a2-${selectedSong.id}-${Date.now()}`,
        name: `${selectedSong.title} (Reel BGM)`,
        trackId: 'a2',
        start: 0.0,
        end: duration,
        volume: 0.85,
        url: `/uploads/${selectedSong.audioFileName}`
      },
      zooms: [
        {
          timestamp: selectedSong.dropTime,
          duration: 1.8,
          scale: 1.25,
          anchor: 'center',
          label: 'Bass Drop Punch-in'
        }
      ]
    };

    res.json({ success: true, attitudeReel });
  } catch (err) {
    console.error('Attitude reel generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Upload Multiple Photos for Reel Montage
 */
router.post('/upload-photos', upload.array('photos', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photo files uploaded' });
    }

    const uploadedPhotos = req.files.map((file, idx) => ({
      id: `photo-${Date.now()}-${idx}`,
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      url: `/uploads/${file.filename}`
    }));

    res.json({
      success: true,
      count: uploadedPhotos.length,
      photos: uploadedPhotos
    });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * AI Photos-To-Attitude-Reel Generator:
 * Takes up to 10-15 photos and generates a rich attitude reel with beat-synced cuts,
 * rich transitions at every cut, attitude subtitles, camera shake, film grain, and 9:16 crop!
 */
router.post('/photos-to-reel', async (req, res) => {
  try {
    const { photos = [], prompt = 'attitude reel', songId = 'trend-hindi-1' } = req.body;
    
    // If no photos uploaded, use curated high-fashion / attitude demo photos
    const photoList = photos.length > 0 ? photos : [
      { id: 'p-1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80', name: 'Alpha Stance' },
      { id: 'p-2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80', name: 'Cold Gaze' },
      { id: 'p-3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', name: 'Unstoppable' },
      { id: 'p-4', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80', name: 'Boss Walk' },
      { id: 'p-5', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80', name: 'Raw Energy' },
      { id: 'p-6', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80', name: 'Golden Hour Silhouette' },
      { id: 'p-7', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80', name: 'Rule The Game' },
      { id: 'p-8', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80', name: 'Silent Power' },
      { id: 'p-9', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80', name: 'Next Level' },
      { id: 'p-10', url: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&q=80', name: 'Final Drop' },
    ];

    const catalog = TrendingAudioService.getTrendingCatalog();
    const song = catalog.find(s => s.id === songId) || catalog[0];

    // Pacing: 1.2s per photo (total 12 seconds for 10 photos)
    const photoDuration = 1.2;
    const totalDuration = photoList.length * photoDuration;

    // Rich transitions pool: alternating high-energy transitions
    const transitionTypes = [
      { type: 'whip_pan', name: 'Whip Pan' },
      { type: 'zoom_blur', name: 'Zoom Blur' },
      { type: 'dip_white', name: 'Flash Shutter' },
      { type: 'glitch', name: 'Cyber Glitch' },
      { type: 'film_burn', name: 'Film Burn' },
      { type: 'spin', name: 'Warp Spin' }
    ];

    // Subtitle quotes for attitude reels
    const attitudeCaptions = [
      'RULE #1',
      'NEVER APOLOGIZE',
      'FOR BEING AMBITIOUS',
      'THEY DOUBTED ME',
      'NOW THEY WATCH',
      'SILENCE IS MY POWER',
      'SUCCESS IS MY NOISE',
      'BORN AN ORIGINAL',
      'NOT A COPY',
      'WATCH ME LEVEL UP 🔥'
    ];

    // Generate timeline clips for each photo
    const clips = [];
    const transitions = [];
    const subtitles = [];

    photoList.forEach((photo, idx) => {
      const start = idx * photoDuration;
      const end = start + photoDuration;

      clips.push({
        id: `photo-clip-${idx}-${Date.now()}`,
        name: photo.name || `Photo ${idx + 1}`,
        trackId: 'v1',
        type: 'image',
        imageUrl: photo.url,
        start,
        end,
        sourceStart: 0,
        sourceEnd: photoDuration,
        speed: 1.0,
        label: `Slide ${idx + 1}`
      });

      // Insert rich transition at every cut point
      if (idx > 0) {
        const transTemplate = transitionTypes[(idx - 1) % transitionTypes.length];
        transitions.push({
          id: `trans-${idx}-${Date.now()}`,
          type: idx === 3 ? 'dip_white' : transTemplate.type, // Big flash at beat drop!
          name: idx === 3 ? '⚡ BASS DROP FLASH' : transTemplate.name,
          timestamp: start,
          duration: 0.6
        });
      }

      // Add bold attitude captions synced to each slide
      const captionText = attitudeCaptions[idx % attitudeCaptions.length];
      const words = captionText.split(' ');
      const wordTime = photoDuration / words.length;

      words.forEach((w, wIdx) => {
        subtitles.push({
          id: `sub-word-${idx}-${wIdx}-${Date.now()}`,
          word: w,
          start: start + (wIdx * wordTime),
          end: start + ((wIdx + 1) * wordTime)
        });
      });
    });

    const montageReel = {
      summary: `Successfully generated rich 10-Photo Attitude Reel synced to "${song.title}". Configured 9:16 vertical crop, ${transitions.length} alternating transitions, bass drop punch at ${song.dropTime}s, 35mm grain, and bold Hormozi attitude typography.`,
      aspectRatio: '9:16',
      duration: totalDuration,
      clips,
      transitions,
      subtitles,
      colorGrading: {
        presetName: 'Attitude Reel Noir & Gold',
        temperature: 15,
        tint: -8,
        contrast: 45,
        saturation: 28,
        brightness: -2,
        lift: { r: -0.08, g: 0.02, b: 0.1, master: -0.04 },
        gamma: { r: 0.04, g: -0.02, b: -0.04, master: 0.0 },
        gain: { r: 0.18, g: 0.08, b: -0.06, master: 0.08 },
        offset: { r: 0.0, g: 0.0, b: 0.0, master: 0.0 }
      },
      subtitleStyle: {
        preset: 'hormozi',
        fontFamily: "'Montserrat', Impact, sans-serif",
        fontSize: 40,
        textColor: '#FFFFFF',
        highlightColor: '#FACC15', // Neon Gold
        strokeColor: '#000000',
        strokeWidth: 5,
        textCase: 'uppercase',
        animation: 'bounce',
        positionY: 22
      },
      effects: [
        { id: 'fx-vignette', type: 'vignette', name: 'Cinematic Vignette', enabled: true, intensity: 45 },
        { id: 'fx-grain', type: 'film_grain', name: '35mm Film Grain', enabled: true, intensity: 35 },
        { id: 'fx-shake', type: 'camera_shake', name: 'Camera Shake', enabled: true, intensity: 45 },
        { id: 'fx-glow', type: 'glow', name: 'Dream Glow', enabled: false, intensity: 40 },
        { id: 'fx-vhs', type: 'vhs_scanlines', name: 'Retro VHS Scanlines', enabled: false, intensity: 35 },
        { id: 'fx-letterbox', type: 'cinematic_letterbox', name: '2.39:1 Cinema Letterbox', enabled: false, intensity: 100 },
        { id: 'fx-split', type: 'rgb_split', name: 'RGB Chromatic Aberration', enabled: true, intensity: 20 }
      ],
      audioTrack: {
        id: `a2-photo-reel-${Date.now()}`,
        name: `${song.title} (Reel BGM)`,
        trackId: 'a2',
        start: 0,
        end: totalDuration,
        volume: 0.9,
        url: `/uploads/${song.audioFileName}`
      },
      song
    };

    res.json({ success: true, montageReel });
  } catch (err) {
    console.error('Photo reel montage error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Video Upload Endpoint
 */
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoPath = req.file.path;
    const fileId = path.parse(req.file.filename).name;
    const audioPath = path.join(uploadDir, `${fileId}_audio.wav`);
    const thumbPath = path.join(uploadDir, `${fileId}_thumb.jpg`);

    // Probe video
    const metadata = await FFmpegService.getVideoMetadata(videoPath);

    // Extract audio
    try {
      await FFmpegService.extractAudio(videoPath, audioPath);
    } catch (e) {
      console.warn('Audio extraction warning:', e.message);
    }

    // Extract thumbnail
    try {
      await FFmpegService.extractThumbnail(videoPath, Math.min(1.0, metadata.duration / 2), thumbPath);
    } catch (e) {
      console.warn('Thumbnail extraction warning:', e.message);
    }

    res.json({
      success: true,
      fileId,
      originalName: req.file.originalname,
      videoPath,
      videoUrl: `/uploads/${path.basename(videoPath)}`,
      audioPath: fs.existsSync(audioPath) ? audioPath : null,
      thumbnailUrl: fs.existsSync(thumbPath) ? `/uploads/${path.basename(thumbPath)}` : null,
      metadata
    });
  } catch (err) {
    console.error('Upload processing failed:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Transcribe Audio (Groq Whisper / Configured Whisper)
 */
router.post('/transcribe', async (req, res) => {
  try {
    const { audioPath, apiKey, baseUrl, model } = req.body;
    const transcript = await AIService.transcribeAudio({
      audioFilePath: audioPath,
      apiKey,
      baseUrl,
      model
    });
    res.json({ success: true, transcript });
  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * AI Video Editing Reasoning (Groq gpt-oss-120b / Configured LLM)
 */
router.post('/ai-edit', async (req, res) => {
  try {
    const { prompt, transcript, duration, apiKey, baseUrl, model } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const editPlan = await AIService.generateTimelineEdits({
      prompt,
      transcript,
      duration: duration || 30,
      apiKey,
      baseUrl,
      model
    });

    res.json({ success: true, editPlan });
  } catch (err) {
    console.error('AI edit generation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Render & Export Timeline
 */
router.post('/render', async (req, res) => {
  try {
    const { videoPath, cuts, colorGrading, subtitleTrack, aspectRatio = '16:9' } = req.body;

    if (!videoPath || !fs.existsSync(videoPath)) {
      return res.status(400).json({ error: 'Valid videoPath is required for rendering' });
    }

    const outputFileName = `render_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);

    // If subtitle track provided, write temporary .srt file for FFmpeg
    let subtitleFile = null;
    if (subtitleTrack && subtitleTrack.words && subtitleTrack.words.length > 0) {
      subtitleFile = path.join(uploadDir, `sub_${Date.now()}.srt`);
      let srtContent = '';
      const words = subtitleTrack.words;
      const groupSize = 3;
      let srtIndex = 1;

      for (let i = 0; i < words.length; i += groupSize) {
        const chunk = words.slice(i, i + groupSize);
        const start = chunk[0].start;
        const end = chunk[chunk.length - 1].end;
        const text = chunk.map(w => w.word).join(' ');

        const formatSrtTime = (s) => {
          const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
          const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
          const secs = Math.floor(s % 60).toString().padStart(2, '0');
          const ms = Math.floor((s % 1) * 1000).toString().padStart(3, '0');
          return `${hrs}:${mins}:${secs},${ms}`;
        };

        srtContent += `${srtIndex++}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${text}\n\n`;
      }
      fs.writeFileSync(subtitleFile, srtContent, 'utf-8');
    }

    await FFmpegService.renderTimeline({
      inputVideoPath: videoPath,
      outputVideoPath: outputPath,
      cuts: cuts || [],
      colorGrading: colorGrading || {},
      subtitleFile,
      aspectRatio
    });

    res.json({
      success: true,
      message: 'Render completed successfully',
      downloadUrl: `/outputs/${outputFileName}`,
      filename: outputFileName
    });
  } catch (err) {
    console.error('Render error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
