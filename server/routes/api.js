import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import { AIService } from '../services/ai.js';
import { FFmpegService } from '../services/ffmpeg.js';
import { TrendingAudioService } from '../services/trending-audio.js';
import { AIDiffusionService } from '../services/ai-diffusion.js';

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
 * Resolves a client-supplied media path into an existing absolute file path
 */
function resolveMediaFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  // If absolute and exists
  if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
    return filePath;
  }
  // If relative to cwd and exists
  if (fs.existsSync(filePath)) {
    return path.resolve(filePath);
  }
  // Try directly inside uploadDir with leading slashes / 'uploads/' stripped
  const cleanRelative = filePath.replace(/^[\/\\]*(uploads[\/\\])?/, '');
  const inUploadDir = path.join(uploadDir, cleanRelative);
  if (fs.existsSync(inUploadDir)) {
    return inUploadDir;
  }
  // Try basename in uploadDir
  const baseInUpload = path.join(uploadDir, path.basename(filePath));
  if (fs.existsSync(baseInUpload)) {
    return baseInUpload;
  }
  // Try relative from project root
  const inProjectRoot = path.resolve(__dirname, '../../', cleanRelative);
  if (fs.existsSync(inProjectRoot)) {
    return inProjectRoot;
  }
  return null;
}

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
    const resolvedVideoPath = resolveMediaFilePath(videoPath);
    if (!resolvedVideoPath) {
      return res.status(400).json({ error: 'Valid videoPath is required for vision analysis' });
    }

    // 1. Extract keyframes across the video
    const frames = await FFmpegService.extractKeyframes(resolvedVideoPath, duration || 12, 4, uploadDir);

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
      url: '/uploads/elevated_attitude_beat.mp3',
      description: 'Fast-paced transition whoosh for scene cuts'
    },
    {
      id: 'sfx-2',
      name: 'Vinyl Scratch Stop',
      category: 'sfx',
      type: 'audio',
      duration: 1.2,
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
      url: '/uploads/baller_desi_trap.mp3',
      description: 'Classic record stop effect for funny interruptions'
    },
    {
      id: 'sfx-3',
      name: 'Deep Cinematic Sub Boom',
      category: 'sfx',
      type: 'audio',
      duration: 2.0,
      thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&q=80',
      url: '/uploads/dafa_406_anthem.mp3',
      description: 'Dramatic bass drop impact for epic reveals'
    },
    {
      id: 'audio-1',
      name: 'Viral Lo-Fi Chill Beats',
      category: 'audio',
      type: 'audio',
      duration: 15.0,
      thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80',
      url: '/uploads/big_dawgs_cut.mp3',
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
    const { songId, songData, duration = 12 } = req.body;
    let selectedSong = songData;
    if (!selectedSong) {
      const catalog = TrendingAudioService.getTrendingCatalog();
      selectedSong = catalog.find(s => s.id === songId) || catalog[0];
    }

    const dropTime = selectedSong.dropTime || 3.2;
    const soundUrl = selectedSong.audioUrl || selectedSong.previewUrl || `/uploads/${selectedSong.audioFileName || 'elevated_attitude_beat.mp3'}`;

    // Build the complete Attitude Reel edit specification
    const attitudeReel = {
      song: selectedSong,
      aspectRatio: '9:16', // Instagram Reel / YouTube Shorts standard
      summary: `Applied "${selectedSong.title}" by ${selectedSong.artist}. Auto-configured 9:16 vertical framing, high-contrast attitude color grade, dynamic beat-drop punch-in at ${dropTime}s, and aggressive Hormozi subtitles.`,
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
          end: dropTime,
          label: 'Attitude Build-up',
          speed: 1.0
        },
        {
          start: dropTime,
          end: duration,
          label: '🔥 BASS DROP CLIMAX',
          speed: 1.0
        }
      ],
      audioTrack: {
        id: `a2-${selectedSong.id || Date.now()}`,
        name: `${selectedSong.title} (Reel BGM)`,
        trackId: 'a2',
        start: 0.0,
        end: duration,
        volume: 0.95,
        url: soundUrl
      },
      zooms: [
        {
          timestamp: dropTime,
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
    const { photos = [], prompt = 'attitude reel', songId = 'trend-hindi-1', songData } = req.body;
    
    // Require real uploaded user photos (no mock bypass)
    if (!photos || photos.length < 2) {
      return res.status(400).json({ error: 'Please upload at least 2 real photos to compile a custom attitude reel montage.' });
    }
    const photoList = photos;

    let song = songData;
    if (!song) {
      const catalog = TrendingAudioService.getTrendingCatalog();
      song = catalog.find(s => s.id === songId) || catalog[0];
    }

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
        url: song.audioUrl || song.previewUrl || `/uploads/${song.audioFileName || 'elevated_attitude_beat.mp3'}`
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
    const resolvedAudioPath = resolveMediaFilePath(audioPath) || audioPath;
    const transcript = await AIService.transcribeAudio({
      audioFilePath: resolvedAudioPath,
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
 * Real Audio Silence Detection & Speech Auto-Cut Engine
 */
router.post('/ai-autocut', async (req, res) => {
  try {
    const { videoPath, noiseDb = -30, minDuration = 0.4 } = req.body;
    const resolvedVideoPath = resolveMediaFilePath(videoPath);
    if (!resolvedVideoPath) {
      return res.status(400).json({ error: 'Valid videoPath is required for silence detection' });
    }

    const result = await FFmpegService.detectSilences(resolvedVideoPath, noiseDb, minDuration);
    res.json({
      success: true,
      totalDuration: result.totalDuration,
      silencesCount: result.silences.length,
      speechCount: result.speechSegments.length,
      speechSegments: result.speechSegments,
      silences: result.silences
    });
  } catch (err) {
    console.error('Silence detection error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * AI Diffusion Video Generation
 */
router.post('/ai-generate/video', async (req, res) => {
  try {
    const { prompt, duration = 4.0, aspectRatio = '16:9', provider = 'auto', apiKey } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const result = await AIDiffusionService.generateVideoFromPrompt({
      prompt,
      duration,
      aspectRatio,
      provider,
      apiKey
    });
    res.json(result);
  } catch (err) {
    console.error('AI video generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * AI Diffusion Image Generation
 */
router.post('/ai-generate/image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9', apiKey } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const result = await AIDiffusionService.generateImageFromPrompt({
      prompt,
      aspectRatio,
      apiKey
    });
    res.json(result);
  } catch (err) {
    console.error('AI image generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Commercial Render & Export Master Pipeline
 */
router.post('/render', async (req, res) => {
  try {
    const {
      videoPath,
      cuts,
      audioTrackPath,
      videoAudioVolume = 1.0,
      bgAudioVolume = 0.8,
      colorGrading,
      subtitleTrack,
      resolution = '1080p',
      framerate = 30,
      aspectRatio = '16:9'
    } = req.body;

    const resolvedVideoPath = resolveMediaFilePath(videoPath);
    if (!resolvedVideoPath) {
      return res.status(400).json({ error: 'Valid videoPath is required for rendering' });
    }
    const resolvedAudioTrackPath = audioTrackPath ? resolveMediaFilePath(audioTrackPath) : null;

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

    const renderResult = await FFmpegService.renderTimeline({
      inputVideoPath: resolvedVideoPath,
      outputVideoPath: outputPath,
      cuts: cuts || [],
      audioTrackPath: resolvedAudioTrackPath,
      videoAudioVolume: parseFloat(videoAudioVolume) || 1.0,
      bgAudioVolume: parseFloat(bgAudioVolume) || 0.8,
      colorGrading: colorGrading || {},
      subtitleFile,
      resolution,
      framerate: parseInt(framerate, 10) || 30,
      aspectRatio
    });

    res.json({
      success: true,
      message: 'Commercial render completed successfully',
      downloadUrl: `/outputs/${outputFileName}`,
      filename: outputFileName,
      resolution: renderResult.resolution,
      framerate: renderResult.framerate
    });
  } catch (err) {
    console.error('Render error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Simultaneous Multi-Asset Uploader & AI Reel Composer
 * Accepts:
 *  - Mixed files: photos, videos, and music/audio
 *  - Simultaneous creative prompt: e.g. "20 sec reel with most suitable or viral part of this song"
 * Automatically analyzes audio, isolates peak chorus / viral hook with micro-fades,
 * synchronizes cuts & transitions to the beat, applies subtitle styling, and compiles the master reel!
 */
router.post('/multi-asset-reel', upload.any(), async (req, res) => {
  try {
    const files = req.files || [];
    let prompt = req.body.prompt || '20 sec viral attitude reel with most suitable part of song';
    let targetDuration = parseFloat(req.body.targetDuration);
    const aspectRatio = req.body.aspectRatio || '9:16';

    // Auto-detect target duration from prompt if not explicitly specified
    if (!targetDuration || isNaN(targetDuration)) {
      const secMatch = prompt.match(/(\d+)\s*(?:sec|second|s\b)/i);
      if (secMatch) {
        targetDuration = parseInt(secMatch[1], 10);
      } else {
        targetDuration = 20.0; // Default commercial reel duration
      }
    }
    targetDuration = Math.max(5, Math.min(120, targetDuration));

    // Categorize uploaded files
    const imageFiles = files.filter(f => f.mimetype.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(f.originalname));
    const videoFiles = files.filter(f => f.mimetype.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi)$/i.test(f.originalname));
    const audioFiles = files.filter(f => f.mimetype.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(f.originalname));

    // 1. Process Audio Track & Extract Viral Hook
    let audioTrackInfo = null;
    let audioTrackUrl = null;

    if (audioFiles.length > 0) {
      const audioFile = audioFiles[0];
      const originalAudioPath = audioFile.path;
      const trimmedFilename = `viral_hook_${Date.now()}_${targetDuration}s.mp3`;
      const trimmedAudioPath = path.join(uploadDir, trimmedFilename);

      try {
        const hookResult = await FFmpegService.extractViralHook({
          audioPath: originalAudioPath,
          outputAudioPath: trimmedAudioPath,
          targetDuration
        });

        audioTrackUrl = `/uploads/${trimmedFilename}`;
        audioTrackInfo = {
          name: audioFile.originalname,
          url: audioTrackUrl,
          duration: targetDuration,
          hookStart: hookResult.hookStart,
          hookEnd: hookResult.hookEnd,
          originalDuration: hookResult.originalDuration,
          description: hookResult.description
        };
      } catch (audioErr) {
        console.warn('Audio hook extraction fallback:', audioErr.message);
        audioTrackUrl = `/uploads/${audioFile.filename}`;
        audioTrackInfo = {
          name: audioFile.originalname,
          url: audioTrackUrl,
          duration: targetDuration,
          description: 'Uploaded audio track attached directly.'
        };
      }
    } else if (req.body.songData) {
      try {
        const songData = typeof req.body.songData === 'string' ? JSON.parse(req.body.songData) : req.body.songData;
        audioTrackUrl = songData.previewUrl || songData.audioUrl;
        audioTrackInfo = {
          name: `${songData.title} by ${songData.artist}`,
          url: audioTrackUrl,
          duration: targetDuration,
          description: `Live streaming audio from ${songData.artist}.`
        };
      } catch (sErr) {
        console.warn('songData parse fallback:', sErr.message);
      }
    } else {
      // Auto-search live internet for songs matching prompt
      try {
        const liveSongs = await TrendingAudioService.searchTrending(prompt);
        if (liveSongs && liveSongs.length > 0) {
          const topSong = liveSongs[0];
          audioTrackUrl = topSong.previewUrl || `/uploads/${topSong.audioFileName}`;
          audioTrackInfo = {
            name: `${topSong.title} (${topSong.artist})`,
            url: audioTrackUrl,
            duration: targetDuration,
            description: `Auto-selected top trending track: ${topSong.title}`
          };
        }
      } catch (liveErr) {
        console.warn('Live music fallback:', liveErr);
      }
    }

    // If still no audio, use default high-energy beat
    if (!audioTrackUrl) {
      audioTrackUrl = '/uploads/elevated_attitude_beat.mp3';
      audioTrackInfo = {
        name: 'Elevated (Attitude Bass Mix)',
        url: audioTrackUrl,
        duration: targetDuration,
        description: 'Standard 808 trap beat fallback.'
      };
    }

    // 2. Process Visual Media into Timeline Clips
    const clips = [];
    const transitions = [];
    const transitionTypes = [
      { type: 'whip_pan', name: 'Whip Pan' },
      { type: 'zoom_blur', name: 'Zoom Blur' },
      { type: 'dip_white', name: 'Flash Shutter' },
      { type: 'glitch', name: 'Cyber Glitch' },
      { type: 'cube_flip', name: '3D Cube Flip' },
      { type: 'film_burn', name: 'Film Burn' },
      { type: 'shake_impact', name: 'Shake Impact' },
      { type: 'rgb_split', name: 'RGB Split' },
      { type: 'spin', name: 'Warp Spin' },
      { type: 'cross_zoom', name: 'Cross Zoom' },
      { type: 'iris_wipe', name: 'Iris Wipe' },
      { type: 'split_slice', name: 'Split Slice' },
    ];

    const totalMediaCount = imageFiles.length + videoFiles.length;

    if (totalMediaCount > 0) {
      const slotDuration = targetDuration / totalMediaCount;
      let curTime = 0;
      let mediaIndex = 0;

      // Add photos first
      for (const img of imageFiles) {
        const start = curTime;
        const end = Math.min(targetDuration, curTime + slotDuration);

        clips.push({
          id: `multi-img-${mediaIndex}-${Date.now()}`,
          name: img.originalname || `Photo ${mediaIndex + 1}`,
          trackId: 'v1',
          type: 'image',
          imageUrl: `/uploads/${img.filename}`,
          start,
          end,
          sourceStart: 0,
          sourceEnd: slotDuration,
          speed: 1.0,
          label: `Photo ${mediaIndex + 1}`
        });

        if (mediaIndex > 0) {
          const tType = transitionTypes[(mediaIndex - 1) % transitionTypes.length];
          transitions.push({
            id: `trans-${mediaIndex}-${Date.now()}`,
            type: tType.type,
            name: tType.name,
            timestamp: start,
            duration: 0.35
          });
        }

        curTime = end;
        mediaIndex++;
      }

      // Add videos
      for (const vid of videoFiles) {
        const start = curTime;
        const end = Math.min(targetDuration, curTime + slotDuration);

        clips.push({
          id: `multi-vid-${mediaIndex}-${Date.now()}`,
          name: vid.originalname || `Video Clip ${mediaIndex + 1}`,
          trackId: 'v1',
          start,
          end,
          sourceStart: 0,
          sourceEnd: slotDuration,
          speed: 1.0,
          label: `Clip ${mediaIndex + 1}`
        });

        if (mediaIndex > 0) {
          const tType = transitionTypes[(mediaIndex - 1) % transitionTypes.length];
          transitions.push({
            id: `trans-${mediaIndex}-${Date.now()}`,
            type: tType.type,
            name: tType.name,
            timestamp: start,
            duration: 0.4
          });
        }

        curTime = end;
        mediaIndex++;
      }
    } else {
      // Default sample video cuts
      clips.push(
        {
          id: `clip-1-${Date.now()}`,
          name: 'Scene Hook',
          trackId: 'v1',
          start: 0,
          end: targetDuration * 0.4,
          sourceStart: 0,
          sourceEnd: targetDuration * 0.4,
          speed: 1.0,
          label: 'Hook'
        },
        {
          id: `clip-2-${Date.now()}`,
          name: 'Viral Peak / Drop',
          trackId: 'v1',
          start: targetDuration * 0.4,
          end: targetDuration,
          sourceStart: targetDuration * 0.4,
          sourceEnd: targetDuration,
          speed: 1.0,
          label: 'Climax'
        }
      );
      transitions.push({
        id: `trans-sample-${Date.now()}`,
        type: 'whip_pan',
        name: 'Whip Pan',
        timestamp: targetDuration * 0.4,
        duration: 0.45
      });
    }

    // 3. AI Director Reasoning (gpt-oss-120b)
    let aiPlan = null;
    try {
      aiPlan = await AIService.generateTimelineEdits(prompt, null, targetDuration);
    } catch (aiErr) {
      console.warn('AI Director fallback for multi-asset reel:', aiErr.message);
    }

    // 4. Dynamic Captions & Subtitles
    const subtitles = [];
    const captionPhrases = [
      'RULE NUMBER ONE',
      'NEVER DOUBT YOURSELF',
      'THEY TALK WE WORK',
      'SILENCE IS DEADLY',
      'FOCUS ON THE GOAL',
      'HUNGRY FOR SUCCESS',
      'BUILT DIFFERENT',
      'WATCH ME LEVEL UP 🔥'
    ];

    clips.forEach((clip, idx) => {
      const phrase = captionPhrases[idx % captionPhrases.length];
      const words = phrase.split(' ');
      const wordDuration = (clip.end - clip.start) / words.length;

      words.forEach((w, wIdx) => {
        subtitles.push({
          id: `sub-${idx}-${wIdx}-${Date.now()}`,
          word: w,
          start: clip.start + (wIdx * wordDuration),
          end: clip.start + ((wIdx + 1) * wordDuration)
        });
      });
    });

    const finalPlan = {
      summary: aiPlan?.summary || `Compiled ${totalMediaCount > 0 ? `${totalMediaCount} assets` : 'master scene'} into a ${targetDuration}s viral reel in ${aspectRatio} format with extracted music hook and 3D transitions.`,
      aspectRatio,
      duration: targetDuration,
      clips,
      transitions,
      subtitles,
      subtitleStyle: aiPlan?.subtitleStyle || {
        preset: 'hormozi',
        fontFamily: "'Montserrat', Impact, sans-serif",
        fontSize: 38,
        textColor: '#FFFFFF',
        highlightColor: '#FACC15',
        strokeColor: '#000000',
        strokeWidth: 5,
        textCase: 'uppercase',
        animation: 'bounce',
        positionY: 22
      },
      colorGrading: aiPlan?.colorGrading || {
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
      effects: aiPlan?.effects || [
        { id: 'fx-vignette', type: 'vignette', name: 'Cinematic Vignette', enabled: true, intensity: 40 },
        { id: 'fx-grain', type: 'film_grain', name: '35mm Film Grain', enabled: true, intensity: 30 },
        { id: 'fx-shake', type: 'camera_shake', name: 'Camera Shake', enabled: true, intensity: 35 },
        { id: 'fx-split', type: 'rgb_split', name: 'RGB Chromatic Aberration', enabled: true, intensity: 20 }
      ],
      audioTrack: audioTrackInfo,
      uploadedPhotos: imageFiles.map((img, i) => ({
        id: `photo-${i}-${Date.now()}`,
        name: img.originalname,
        url: `/uploads/${img.filename}`
      }))
    };

    res.json({
      success: true,
      reelPlan: finalPlan
    });
  } catch (err) {
    console.error('Multi-asset reel composer error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
