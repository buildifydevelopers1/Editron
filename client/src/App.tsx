import React, { useEffect, useRef, useState } from 'react';
import {
  WorkspaceHeader
} from './components/workspace/WorkspaceHeader';
import { VideoMonitor } from './components/monitor/VideoMonitor';
import { Timeline } from './components/timeline/Timeline';
import { ColorGradingPanel } from './components/color/ColorGradingPanel';
import { SubtitleStyler } from './components/subtitles/SubtitleStyler';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { AIPromptBar } from './components/ai/AIPromptBar';
import { SettingsModal } from './components/settings/SettingsModal';
import { ExportModal } from './components/export/ExportModal';
import { VisionAnalysisModal } from './components/vision/VisionAnalysisModal';
import { AssetLibraryPanel } from './components/media/AssetLibraryPanel';
import { TrendingSongPickerModal } from './components/audio/TrendingSongPickerModal';
import { SubtitleStyleGalleryModal } from './components/subtitles/SubtitleStyleGalleryModal';
import { MultiAssetComposerModal } from './components/composer/MultiAssetComposerModal';
import { EffectsPanel } from './components/effects/EffectsPanel';
import { CheckCircle2, Layers, Eye, Wand2, Sparkles } from 'lucide-react';
import { useTimelineHistory, TimelineSnapshot } from './hooks/useTimelineHistory';
import {
  AppConfig,
  AspectRatio,
  ColorGradingSettings,
  KeyframeItem,
  LibraryAsset,
  SubtitleStyle,
  SubtitleWord,
  TransformSettings,
  TrendingSong,
  VideoClip,
  VideoEffect,
  VideoTransition,
  VisionAnalysis,
  WorkspacePage,
} from './types';
import {
  applyAttitudeReel,
  fetchAssetLibrary,
  fetchConfig,
  generatePhotosToReel,
  requestAIEdits,
  requestAutonomousDirectorLoop,
  requestGenerateSubtitles,
  requestSilenceDetection,
  requestTranscription,
  requestVisionAnalysis,
  resolveAssetUrl,
  searchTrendingSongs,
  uploadPhotos,
  uploadVideoFile,
} from './services/api';
import { probeMediaFile } from './services/mediaMetadata';

export function App() {
  // Navigation
  const [currentPage, setCurrentPage] = useState<WorkspacePage>('edit');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);

  // Human-in-the-Loop Trending Audio State
  const [isTrendingPickerOpen, setIsTrendingPickerOpen] = useState(false);
  const [trendingSongs, setTrendingSongs] = useState<TrendingSong[]>([]);
  const [trendingQuery, setTrendingQuery] = useState('trending attitude hindi song');
  const [isApplyingReel, setIsApplyingReel] = useState(false);
  const [isSubtitleGalleryOpen, setIsSubtitleGalleryOpen] = useState(false);
  const [isMultiComposerOpen, setIsMultiComposerOpen] = useState(false);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false);

  // Vision Analysis State
  const [visionFrames, setVisionFrames] = useState<KeyframeItem[]>([]);
  const [visionAnalysis, setVisionAnalysis] = useState<VisionAnalysis | null>(null);

  // Asset Library State (Memes, B-Roll, Trending Audio)
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);

  // Video State
  const [videoUrl, setVideoUrl] = useState<string>('/uploads/sample_editron.mp4');
  const [videoPath, setVideoPath] = useState<string>('uploads/sample_editron.mp4');
  const [reelAudioUrl, setReelAudioUrl] = useState<string | undefined>(undefined);
  const [userPhotos, setUserPhotos] = useState<any[]>([]);
  const [duration, setDuration] = useState<number>(12.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  // Multi-Track Timeline Clips
  const [clips, setClips] = useState<VideoClip[]>([
    {
      id: 'clip-1',
      name: 'Hook Intro (Rec.709)',
      trackId: 'v1',
      start: 0.0,
      end: 4.8,
      sourceStart: 0.0,
      sourceEnd: 4.8,
      speed: 1.0,
      label: 'Intro Hook',
    },
    {
      id: 'clip-2',
      name: 'Main Feature Showcase',
      trackId: 'v1',
      start: 4.8,
      end: 12.0,
      sourceStart: 4.8,
      sourceEnd: 12.0,
      speed: 1.0,
      label: 'Core Demo',
    },
  ]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip-1');

  // Video Transitions on Timeline
  const [transitions, setTransitions] = useState<VideoTransition[]>([
    {
      id: 'trans-1',
      type: 'whip_pan',
      name: 'Whip Pan',
      timestamp: 4.8,
      duration: 0.8,
    },
  ]);

  // OpenFX Video Effects
  const [effects, setEffects] = useState<VideoEffect[]>([
    { id: 'fx-vignette', type: 'vignette', name: 'Cinematic Vignette', enabled: true, intensity: 35 },
    { id: 'fx-grain', type: 'film_grain', name: '35mm Organic Film Grain', enabled: true, intensity: 30 },
    { id: 'fx-shake', type: 'camera_shake', name: 'Camera Shake (Handheld)', enabled: false, intensity: 40 },
    { id: 'fx-glow', type: 'glow', name: 'Dream Glow & Bloom', enabled: false, intensity: 45 },
    { id: 'fx-vhs', type: 'vhs_scanlines', name: 'Retro VHS Scanlines', enabled: false, intensity: 35 },
    { id: 'fx-letterbox', type: 'cinematic_letterbox', name: '2.39:1 Cinema Letterbox', enabled: false, intensity: 100 },
    { id: 'fx-split', type: 'rgb_split', name: 'RGB Chromatic Aberration', enabled: false, intensity: 25 },
  ]);

  // DaVinci Resolve Color Grading Settings
  const [colorGrading, setColorGrading] = useState<ColorGradingSettings>({
    presetName: 'Default Rec.709',
    temperature: 0,
    tint: 0,
    contrast: 15,
    saturation: 10,
    brightness: 0,
    lift: { r: 0, g: 0, b: 0, master: 0 },
    gamma: { r: 0, g: 0, b: 0, master: 0 },
    gain: { r: 0, g: 0, b: 0, master: 0 },
    offset: { r: 0, g: 0, b: 0, master: 0 },
  });

  // Transform / Inspector
  const [transform, setTransform] = useState<TransformSettings>({
    scale: 1.0,
    positionX: 0,
    positionY: 0,
    rotation: 0,
    opacity: 1.0,
  });
  const [audioVolume, setAudioVolume] = useState<number>(1.0);

  // Subtitle Engine
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    preset: 'hormozi',
    fontFamily: "'Montserrat', Impact, sans-serif",
    fontSize: 34,
    textColor: '#FFFFFF',
    highlightColor: '#FACC15', // Vibrant Yellow
    strokeColor: '#000000',
    strokeWidth: 4,
    textCase: 'uppercase',
    animation: 'bounce',
    positionY: 18,
  });

  const [subtitles, setSubtitles] = useState<SubtitleWord[]>([
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
    { id: 'w-27', word: 'seconds!', start: 10.7, end: 11.4 },
  ]);

  // AI & Background Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingPass, setProcessingPass] = useState<number>(0); // 0: idle, 1: Draft, 2: Vision Critic, 3: Master Polish
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Hidden File Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Timeline Undo/Redo History Engine
  const {
    canUndo,
    canRedo,
    recordSnapshot,
    undo,
    redo,
  } = useTimelineHistory({
    clips,
    transitions,
    subtitles,
    subtitleStyle,
    colorGrading,
    effects,
    aspectRatio,
    transform,
    reelAudioUrl,
    duration,
    userPhotos,
  });

  const applyTimelineSnapshot = (s: TimelineSnapshot) => {
    setClips(s.clips);
    setTransitions(s.transitions);
    setSubtitles(s.subtitles);
    setSubtitleStyle(s.subtitleStyle);
    setColorGrading(s.colorGrading);
    setEffects(s.effects);
    setAspectRatio(s.aspectRatio);
    setTransform(s.transform);
    setReelAudioUrl(s.reelAudioUrl);
    setDuration(s.duration);
    if (s.userPhotos) setUserPhotos(s.userPhotos);
    if (s.clips.length > 0) setSelectedClipId(s.clips[0].id);
  };

  const handleUndo = () => {
    undo(applyTimelineSnapshot);
  };

  const handleRedo = () => {
    redo(applyTimelineSnapshot);
  };

  const saveCurrentSnapshot = () => {
    recordSnapshot({
      clips,
      transitions,
      subtitles,
      subtitleStyle,
      colorGrading,
      effects,
      aspectRatio,
      transform,
      reelAudioUrl,
      duration,
      userPhotos,
    });
  };

  // Initial config load & asset library load
  useEffect(() => {
    fetchConfig()
      .then((cfg) => setConfig(cfg))
      .catch((err) => console.warn('Could not fetch server config:', err));

    fetchAssetLibrary()
      .then((lib) => setLibraryAssets(lib))
      .catch((err) => console.warn('Could not load asset library:', err));
  }, []);

  // Handle Multimodal Vision Analysis
  const handleOpenVision = async () => {
    setIsProcessing(true);
    setProcessingStatus(`Analyzing video frames with ${config?.visionModel || 'llama-3.2-11b-vision-preview'}...`);

    try {
      const data = await requestVisionAnalysis({
        videoPath,
        duration,
        prompt: 'Analyze shot composition, lighting quality, emotion, and suggest meme/B-roll overlays.'
      });

      if (data && data.analysis) {
        setVisionFrames(data.frames || []);
        setVisionAnalysis(data.analysis);
        setIsVisionOpen(true);
      }
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      alert(`Vision analysis failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Insert Meme, B-Roll, or Audio Asset to Timeline
  const handleInsertAsset = (asset: LibraryAsset, trackId: 'v2' | 'a2') => {
    const newClip: VideoClip = {
      id: `${asset.id}-${Date.now()}`,
      name: `${asset.name} (${asset.category.toUpperCase()})`,
      trackId: trackId,
      start: currentTime,
      end: Math.min(duration, currentTime + asset.duration),
      sourceStart: 0,
      sourceEnd: asset.duration,
      speed: 1.0,
      label: asset.category,
      color: asset.category === 'meme' ? 'yellow' : asset.category === 'broll' ? 'cyan' : 'purple',
    };

    setClips((prev) => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  };

  // Apply Vision Recommended Color Grading
  const handleApplyVisionColor = (recs: any) => {
    if (!recs) return;
    setColorGrading((prev) => ({
      ...prev,
      presetName: recs.presetName || 'AI Vision Look',
      temperature: recs.temperature || prev.temperature,
      tint: recs.tint || prev.tint,
      contrast: recs.contrast || prev.contrast,
      saturation: recs.saturation || prev.saturation,
    }));
  };

  // Apply Vision Recommended Memes to Timeline
  const handleApplyVisionMemes = (suggestions: any[]) => {
    if (!suggestions) return;
    const newClips: VideoClip[] = suggestions.map((s, idx) => ({
      id: `ai-meme-${idx}-${Date.now()}`,
      name: s.name,
      trackId: s.type === 'broll' || s.type === 'meme' ? 'v2' : 'v1',
      start: s.timestamp,
      end: Math.min(duration, s.timestamp + 2.5),
      sourceStart: 0,
      sourceEnd: 2.5,
      speed: 1.0,
      label: s.reason,
    }));

    setClips((prev) => [...prev, ...newClips]);
  };

  // Keyboard Shortcuts (Space, C, Delete, Left/Right, and Ctrl+Z / Ctrl+Y Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Ctrl+Z or Cmd+Z for Undo / Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      // Ctrl+Y for Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'c' || e.key === 'C') {
        // Razor split at playhead
        splitCurrentClip();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          saveCurrentSnapshot();
          setClips((prev) => prev.filter((c) => c.id !== selectedClipId));
          setSelectedClipId(null);
        }
      } else if (e.key === 'ArrowLeft') {
        setCurrentTime((t) => Math.max(0, t - 1 / 30));
      } else if (e.key === 'ArrowRight') {
        setCurrentTime((t) => Math.min(duration, t + 1 / 30));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, currentTime, duration, clips, canUndo, canRedo]);

  const splitCurrentClip = () => {
    const clipToSplit = clips.find((c) => currentTime > c.start + 0.1 && currentTime < c.end - 0.1);
    if (!clipToSplit) return;
    saveCurrentSnapshot();

    const firstHalf: VideoClip = {
      ...clipToSplit,
      end: currentTime,
      sourceEnd: clipToSplit.sourceStart + (currentTime - clipToSplit.start),
    };

    const secondHalf: VideoClip = {
      id: `clip-${Date.now()}`,
      name: `${clipToSplit.name} (Cut)`,
      trackId: clipToSplit.trackId,
      start: currentTime,
      end: clipToSplit.end,
      sourceStart: firstHalf.sourceEnd,
      sourceEnd: clipToSplit.sourceEnd,
      speed: clipToSplit.speed,
      label: 'Cut Clip',
    };

    setClips((prev) => prev.filter((c) => c.id !== clipToSplit.id).concat([firstHalf, secondHalf]));
    setSelectedClipId(secondHalf.id);
  };

  // Video File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Instant local playback: create object URL so video plays immediately in browser
    const localBlobUrl = URL.createObjectURL(file);
    setVideoUrl(localBlobUrl);
    setCurrentTime(0);

    // 2. Client-side metadata probe
    try {
      const meta = await probeMediaFile(file);
      if (meta.duration && meta.duration > 0) {
        setDuration(meta.duration);
        const initialClip: VideoClip = {
          id: `clip-${Date.now()}`,
          name: file.name,
          trackId: 'v1',
          start: 0,
          end: meta.duration,
          sourceStart: 0,
          sourceEnd: meta.duration,
          speed: 1.0,
        };
        setClips([initialClip]);
        setSelectedClipId(initialClip.id);
      }
    } catch (metaErr) {
      console.warn('Client probe warning:', metaErr);
    }

    setIsProcessing(true);
    setProcessingStatus('Syncing video with AI engine...');

    try {
      const media = await uploadVideoFile(file);
      if (media.videoPath) {
        setVideoPath(media.videoPath);
      }
      if (media.metadata?.duration) {
        setDuration(media.metadata.duration);
      }

      // Auto transcribe if audio was extracted
      if (media.audioPath) {
        setProcessingStatus(`Transcribing with ${config?.whisperModel || 'whisper-large-v3'}...`);
        try {
          const transcriptResult = await requestTranscription(media.audioPath);
          if (transcriptResult && transcriptResult.words) {
            setSubtitles(transcriptResult.words);
          }
        } catch (tErr) {
          console.warn('Transcription failed:', tErr);
        }
      }
    } catch (err: any) {
      console.warn('Backend sync notice (continuing with client-side playback):', err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Dedicated Subtitle Generation (Whisper Audio Transcription or gpt-oss-120b Lyrics/Captions)
  const handleGenerateSubtitles = async (customPrompt?: string) => {
    saveCurrentSnapshot();
    setIsGeneratingSubtitles(true);
    setIsProcessing(true);
    setProcessingPass(1);

    const activePrompt = customPrompt || 'generate subtitles and sync to audio';
    const p = activePrompt.toLowerCase();
    const isHindi = p.includes('hindi') || p.includes('hinglish') || p.includes('punjabi') || p.includes('desi') || p.includes('devanagari');
    const targetPreset = isHindi ? 'hindi_attitude' : subtitleStyle.preset;

    setProcessingStatus(
      isHindi
        ? 'Pass 1/3: Synthesizing viral Hindi attitude captions & rhythm...'
        : `Pass 1/3: Audio transcription & speech recognition with ${config?.whisperModel || 'Whisper'}...`
    );

    const subTimer1 = setTimeout(() => {
      setProcessingPass(2);
      setProcessingStatus(
        isHindi
          ? 'Pass 2/3: Aligning Devanagari phrase cadence & syllable timestamps...'
          : 'Pass 2/3: Speech cadence analysis & word timestamp alignment...'
      );
    }, 1500);

    const subTimer2 = setTimeout(() => {
      setProcessingPass(3);
      setProcessingStatus(
        isHindi
          ? 'Pass 3/3: Applying high-impact Hindi Attitude Gold & bold stroke styling...'
          : `Pass 3/3: Styling kinetic typography with ${subtitleStyle.preset.toUpperCase()} preset...`
      );
    }, 3200);

    try {
      const result = await requestGenerateSubtitles({
        videoPath,
        prompt: activePrompt,
        duration,
        stylePreset: targetPreset,
      });

      clearTimeout(subTimer1);
      clearTimeout(subTimer2);

      if (result && result.subtitles && result.subtitles.length > 0) {
        setSubtitles(result.subtitles);
        if (result.subtitleStyle) {
          setSubtitleStyle((prev) => ({ ...prev, ...result.subtitleStyle }));
        }
        setAiSummary(
          result.summary ||
          `Generated ${result.subtitles.length} synchronized words using ${result.source === 'whisper' ? 'Whisper Audio Transcription' : 'AI Director Typography Engine'}.`
        );
      }
    } catch (err: any) {
      console.error('Subtitle generation failed:', err);
      alert(`Subtitle generation notice: ${err.message || 'Error generating subtitles'}`);
    } finally {
      clearTimeout(subTimer1);
      clearTimeout(subTimer2);
      setIsGeneratingSubtitles(false);
      setIsProcessing(false);
      setProcessingPass(0);
      setProcessingStatus('');
    }
  };

  // Autonomous Director Master Timeline Application
  const handleApplyAutonomousMaster = (masterPlan: any) => {
    saveCurrentSnapshot();
    if (!masterPlan) return;

    if (masterPlan.summary) {
      setAiSummary(masterPlan.summary);
    }
    if (masterPlan.aspectRatio) {
      setAspectRatio(masterPlan.aspectRatio);
    }
    if (masterPlan.colorGrading) {
      setColorGrading((prev) => ({ ...prev, ...masterPlan.colorGrading }));
    }
    if (masterPlan.subtitleStyle) {
      setSubtitleStyle((prev) => ({ ...prev, ...masterPlan.subtitleStyle }));
    }
    if (masterPlan.subtitles && masterPlan.subtitles.length > 0) {
      setSubtitles(masterPlan.subtitles);
    }
    if (masterPlan.transitions && masterPlan.transitions.length > 0) {
      setTransitions(masterPlan.transitions);
    }
    if (masterPlan.effects && masterPlan.effects.length > 0) {
      setEffects(masterPlan.effects);
    }
    const isPhotoTimeline = clips.some((c) => c.type === 'image');
    if (!isPhotoTimeline && masterPlan.cuts && masterPlan.cuts.length > 0) {
      const newClips: VideoClip[] = masterPlan.cuts.map((c: any, i: number) => ({
        id: `ai-clip-${i}-${Date.now()}`,
        name: c.label || `Cut ${i + 1}`,
        trackId: 'v1',
        start: c.start,
        end: c.end,
        sourceStart: c.start,
        sourceEnd: c.end,
        speed: c.speed || 1.0,
      }));
      setClips(newClips);
      setSelectedClipId(newClips[0]?.id || null);
    }
    if (masterPlan.zooms && masterPlan.zooms.length > 0) {
      setTransform((prev) => ({
        ...prev,
        scale: masterPlan.zooms[0].scale || 1.15,
      }));
    }
  };

  // AI Prompt Bar Submission
  const handleAIPrompt = async (prompt: string) => {
    saveCurrentSnapshot();
    setIsProcessing(true);
    const p = prompt.toLowerCase();

    // Check if user requested subtitle generation or speech-to-text
    if (
      p.includes('subtitle') ||
      p.includes('subtitles') ||
      p.includes('caption') ||
      p.includes('captions') ||
      p.includes('transcribe') ||
      p.includes('speech to text') ||
      p.includes('lyrics')
    ) {
      await handleGenerateSubtitles(prompt);
      setIsProcessing(false);
      setProcessingStatus('');
      return;
    }

    // Check if user explicitly requested photo montage / 10 photos attitude reel
    if (p.includes('photo') || p.includes('image') || p.includes('montage')) {
      if (userPhotos.length === 0) {
        setIsProcessing(false);
        setProcessingStatus('');
        setAiSummary('Please select photos from your device to assemble the AI photo reel.');
        photoInputRef.current?.click();
        return;
      }
      await handlePhotosToReel(userPhotos, undefined, prompt);
      return;
    }

    // Default 3-Pass Autonomous AI Loop (Pass 1 -> Pass 2 -> Pass 3)
    setProcessingPass(1);
    setProcessingStatus('Pass 1/3: Chief AI Director (gpt-oss-120b) synthesizing draft cuts & audio sync...');

    try {
      const stageTimer1 = setTimeout(() => {
        setProcessingPass(2);
        setProcessingStatus('Pass 2/3: Multimodal Vision Model (Llama 3.2 Vision) inspecting keyframes & composition...');
      }, 1600);

      const stageTimer2 = setTimeout(() => {
        setProcessingPass(3);
        setProcessingStatus('Pass 3/3: Incorporating vision critique & mastering final timeline...');
      }, 3600);

      const result = await requestAutonomousDirectorLoop({
        prompt,
        videoPath,
        duration,
        photos: userPhotos,
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      const plan = result.finalPlan || result.draftPlan;

      if (plan) {
        const modelNote = result.modelUsed ? ` • [Model: ${result.modelUsed}${result.fallbackTriggered ? ' (Rate-Limit Protected)' : ''}]` : '';
        const impCount = result.improvements?.length || 0;
        const impSummary = impCount > 0 ? ` • [Mastered: ${result.improvements.slice(0, 2).join(' • ')}]` : '';
        setAiSummary((plan.summary || 'AI Director successfully edited the video.') + modelNote + impSummary);

        // Apply Aspect Ratio
        if (plan.aspectRatio) {
          setAspectRatio(plan.aspectRatio);
        }

        // Apply Color Grading
        if (plan.colorGrading) {
          setColorGrading((prev) => ({
            ...prev,
            ...plan.colorGrading,
          }));
        }

        // Apply Subtitle Style (from all 18 presets)
        if (plan.subtitleStyle) {
          setSubtitleStyle((prev) => ({
            ...prev,
            ...plan.subtitleStyle,
          }));
        }

        // Apply Subtitles onto timeline
        if (plan.subtitles && plan.subtitles.length > 0) {
          setSubtitles(plan.subtitles);
        }

        // Apply Transitions (from all 18 cinematic transitions)
        if (plan.transitions && plan.transitions.length > 0) {
          setTransitions(plan.transitions);
        }

        // Apply OpenFX Effects
        if (plan.effects && plan.effects.length > 0) {
          setEffects(plan.effects);
        }

        // Apply Smart Cuts (only replace clips if not a photo montage, preserving user photos!)
        const isPhotoTimeline = clips.some((c) => c.type === 'image');
        if (!isPhotoTimeline && plan.cuts && plan.cuts.length > 0) {
          const newClips: VideoClip[] = plan.cuts.map((c: any, i: number) => ({
            id: `ai-clip-${i}-${Date.now()}`,
            name: c.label || `Cut ${i + 1}`,
            trackId: 'v1',
            start: c.start,
            end: c.end,
            sourceStart: c.start,
            sourceEnd: c.end,
            speed: c.speed || 1.0,
          }));
          setClips(newClips);
          setSelectedClipId(newClips[0]?.id || null);
        }

        // Apply Zoom punch-in
        if (plan.zooms && plan.zooms.length > 0) {
          setTransform((prev) => ({
            ...prev,
            scale: plan.zooms[0].scale || 1.15,
          }));
        }

        // Live Internet Music Query Handling
        const musicQuery = plan.musicQuery || (
          p.includes('song') || p.includes('music') || p.includes('hindi') || p.includes('punjabi') || p.includes('attitude') || p.includes('beat') || p.includes('audio')
            ? prompt
            : null
        );

        if (musicQuery) {
          setProcessingStatus(`Searching live internet music for "${musicQuery}"...`);
          try {
            const liveSongs = await searchTrendingSongs(musicQuery);
            if (liveSongs && liveSongs.length > 0) {
              setTrendingSongs(liveSongs);
              setTrendingQuery(musicQuery);

              // Auto-apply top live song
              const topSong = liveSongs[0];
              const soundUrl = topSong.previewUrl || resolveAssetUrl(topSong.audioUrl || (topSong.audioFileName ? `/uploads/${topSong.audioFileName}` : undefined));
              if (soundUrl) {
                setReelAudioUrl(soundUrl);
              }

              if (p.includes('picker') || p.includes('choose song') || p.includes('select song') || p.includes('show songs')) {
                setIsTrendingPickerOpen(true);
              }
            }
          } catch (mErr) {
            console.warn('Live music search notice:', mErr);
          }
        }
      }
    } catch (err: any) {
      console.error('AI Edit failed:', err);
      alert(`AI Edit error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      setProcessingPass(0);
    }
  };

  // Human-in-the-Loop Selection: Apply selected song to generate full Attitude Reel
  const handleSelectTrendingSong = async (song: TrendingSong) => {
    saveCurrentSnapshot();
    setIsApplyingReel(true);
    setProcessingStatus(`Crafting Attitude Reel with "${song.title}"...`);

    const soundUrl = song.previewUrl || resolveAssetUrl(song.audioUrl || (song.audioFileName ? `/uploads/${song.audioFileName}` : '/uploads/elevated_attitude_beat.mp3'));

    const applyLocalReel = () => {
      setAspectRatio('9:16');
      setColorGrading({
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
      });
      setSubtitleStyle({
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
      });
      setAiSummary(`Applied "${song.title}" by ${song.artist} directly from live internet stream. Configured 9:16 vertical framing, beat-drop punch-in at ${song.dropTime || 3.2}s, and aggressive Hormozi subtitles.`);

      // Only re-cut if video timeline, never wipe user's photo montage!
      if (!clips.some((c) => c.type === 'image')) {
        const dropTime = song.dropTime || 3.2;
        const newClips: VideoClip[] = [
          {
            id: `reel-cut-1-${Date.now()}`,
            name: 'Attitude Build-up',
            trackId: 'v1',
            start: 0.0,
            end: dropTime,
            sourceStart: 0.0,
            sourceEnd: dropTime,
            speed: 1.0,
          },
          {
            id: `reel-cut-2-${Date.now()}`,
            name: '🔥 BASS DROP CLIMAX',
            trackId: 'v1',
            start: dropTime,
            end: duration,
            sourceStart: dropTime,
            sourceEnd: duration,
            speed: 1.0,
          }
        ];
        setClips(newClips);
        setSelectedClipId(newClips[0]?.id || null);
      }

      setTransform((prev) => ({
        ...prev,
        scale: 1.25,
      }));

      setReelAudioUrl(soundUrl);
      setIsTrendingPickerOpen(false);
    };

    try {
      const reel = await applyAttitudeReel({ songId: song.id, duration, songData: song });
      if (reel) {
        setAspectRatio('9:16');
        if (reel.colorGrading) setColorGrading(reel.colorGrading);
        if (reel.subtitleStyle) setSubtitleStyle(reel.subtitleStyle);
        if (reel.summary) setAiSummary(reel.summary);

        if (!clips.some((c) => c.type === 'image') && reel.cuts && reel.cuts.length > 0) {
          const newClips: VideoClip[] = reel.cuts.map((c: any, i: number) => ({
            id: `reel-cut-${i}-${Date.now()}`,
            name: c.label || `Beat Cut ${i + 1}`,
            trackId: 'v1',
            start: c.start,
            end: c.end,
            sourceStart: c.start,
            sourceEnd: c.end,
            speed: c.speed || 1.0,
          }));
          setClips(newClips);
          setSelectedClipId(newClips[0]?.id || null);
        }

        // Add dynamic zoom at bass drop
        if (reel.zooms && reel.zooms.length > 0) {
          setTransform((prev) => ({
            ...prev,
            scale: reel.zooms[0].scale || 1.25,
          }));
        }

        const finalAudioUrl = reel.audioTrack?.url ? resolveAssetUrl(reel.audioTrack.url) : soundUrl;
        setReelAudioUrl(finalAudioUrl);
        setIsTrendingPickerOpen(false);
      } else {
        applyLocalReel();
      }
    } catch (err: any) {
      console.warn('Backend attitude reel fallback (applying live stream locally):', err.message);
      applyLocalReel();
    } finally {
      setIsApplyingReel(false);
      setProcessingStatus('');
    }
  };

  // Handle 10-Photos to Attitude Reel Montage
  const handlePhotosToReel = async (
    uploadedPhotos?: any[],
    songId = 'trend-hindi-1',
    promptText = '10 photos attitude reel with trending song and transitions',
    songData?: TrendingSong
  ) => {
    saveCurrentSnapshot();
    setIsProcessing(true);
    setProcessingPass(1);
    setProcessingStatus('Pass 1/3: AI Director arranging photo sequencing & beat markers...');

    const targetPhotos = (uploadedPhotos && uploadedPhotos.length > 0) ? uploadedPhotos : userPhotos;

    if (!targetPhotos || targetPhotos.length === 0) {
      setIsProcessing(false);
      setProcessingPass(0);
      setProcessingStatus('');
      photoInputRef.current?.click();
      return;
    }

    const reelTimer1 = setTimeout(() => {
      setProcessingPass(2);
      setProcessingStatus('Pass 2/3: Multimodal Vision inspecting aspect ratios & framing...');
    }, 1600);

    const reelTimer2 = setTimeout(() => {
      setProcessingPass(3);
      setProcessingStatus('Pass 3/3: Applying 18 cinematic transitions & master audio track...');
    }, 3600);

    // Offline / Local Photo Montage Assembler with all 18 Transitions
    const assembleLocalPhotoReel = (activeSong?: TrendingSong) => {
      const photoDuration = 1.2;
      const totalDuration = targetPhotos.length * photoDuration;

      const transitionTypes: { type: any; name: string }[] = [
        { type: 'whip_pan', name: 'Whip Pan' },
        { type: 'zoom_blur', name: 'Zoom Blur' },
        { type: 'dip_white', name: 'Flash Shutter' },
        { type: 'glitch', name: 'Cyber Glitch' },
        { type: 'film_burn', name: 'Film Burn' },
        { type: 'spin', name: 'Warp Spin' },
        { type: 'cube_flip', name: '3D Cube Flip' },
        { type: 'shake_impact', name: 'Shake Impact' },
        { type: 'rgb_split', name: 'RGB Split' },
        { type: 'cross_zoom', name: 'Cross Zoom' },
        { type: 'iris_wipe', name: 'Iris Wipe' },
        { type: 'split_slice', name: 'Split Slice' },
        { type: 'pixelate', name: 'Pixelate' },
        { type: 'lens_flare', name: 'Lens Flare' }
      ];

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

      const newClips: VideoClip[] = [];
      const newTransitions: VideoTransition[] = [];
      const newSubtitles: SubtitleWord[] = [];

      targetPhotos.forEach((photo, idx) => {
        const start = idx * photoDuration;
        const end = start + photoDuration;

        newClips.push({
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

        if (idx > 0) {
          const tType = transitionTypes[(idx - 1) % transitionTypes.length];
          newTransitions.push({
            id: `trans-${idx}-${Date.now()}`,
            type: tType.type,
            name: tType.name,
            timestamp: start,
            duration: 0.35,
          });
        }

        const captionText = attitudeCaptions[idx % attitudeCaptions.length];
        const words = captionText.split(' ');
        const wordTime = photoDuration / words.length;
        words.forEach((w, wIdx) => {
          newSubtitles.push({
            id: `sub-word-${idx}-${wIdx}-${Date.now()}`,
            word: w,
            start: start + (wIdx * wordTime),
            end: start + ((wIdx + 1) * wordTime)
          });
        });
      });

      setAspectRatio('9:16');
      setDuration(totalDuration);
      setCurrentTime(0);
      setClips(newClips);
      setSelectedClipId(newClips[0]?.id || null);
      setTransitions(newTransitions);
      setSubtitles(newSubtitles);
      setColorGrading({
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
      });
      setSubtitleStyle({
        preset: 'hormozi',
        fontFamily: "'Montserrat', Impact, sans-serif",
        fontSize: 40,
        textColor: '#FFFFFF',
        highlightColor: '#FACC15',
        strokeColor: '#000000',
        strokeWidth: 5,
        textCase: 'uppercase',
        animation: 'bounce',
        positionY: 22
      });
      setEffects([
        { id: 'fx-vignette', type: 'vignette', name: 'Cinematic Vignette', enabled: true, intensity: 45 },
        { id: 'fx-grain', type: 'film_grain', name: '35mm Film Grain', enabled: true, intensity: 35 },
        { id: 'fx-shake', type: 'camera_shake', name: 'Camera Shake', enabled: true, intensity: 45 },
        { id: 'fx-glow', type: 'glow', name: 'Dream Glow', enabled: false, intensity: 40 },
        { id: 'fx-vhs', type: 'vhs_scanlines', name: 'Retro VHS Scanlines', enabled: false, intensity: 35 },
        { id: 'fx-letterbox', type: 'cinematic_letterbox', name: '2.39:1 Cinema Letterbox', enabled: false, intensity: 100 },
        { id: 'fx-split', type: 'rgb_split', name: 'RGB Chromatic Aberration', enabled: true, intensity: 20 }
      ]);

      const audioSource = activeSong?.previewUrl || activeSong?.audioUrl || (activeSong?.audioFileName ? `/uploads/${activeSong.audioFileName}` : '/uploads/elevated_attitude_beat.mp3');
      setReelAudioUrl(resolveAssetUrl(audioSource));
      setAiSummary(`Compiled ${targetPhotos.length}-Photo Attitude Reel in 9:16 vertical ratio with cinematic transitions & Hormozi captions.`);
    };

    try {
      let targetSong = songData;
      if (!targetSong) {
        try {
          const liveSongs = await searchTrendingSongs('trending attitude hindi song');
          if (liveSongs && liveSongs.length > 0) {
            targetSong = liveSongs[0];
            setTrendingSongs(liveSongs);
          }
        } catch (err) {
          console.warn('Trending search fallback:', err);
        }
      }

      const montage = await generatePhotosToReel({
        photos: targetPhotos,
        prompt: promptText,
        songId,
        songData: targetSong,
      });

      if (montage) {
        setAspectRatio('9:16');
        setDuration(montage.duration || targetPhotos.length * 1.2);
        setCurrentTime(0);
        setClips(montage.clips || []);
        setSelectedClipId(montage.clips?.[0]?.id || null);
        setTransitions(montage.transitions || []);
        setSubtitles(montage.subtitles || []);
        if (montage.colorGrading) setColorGrading(montage.colorGrading);
        if (montage.subtitleStyle) setSubtitleStyle(montage.subtitleStyle);
        if (montage.effects) setEffects(montage.effects);
        const trackUrl = montage.audioTrack?.url || targetSong?.previewUrl || targetSong?.audioUrl;
        if (trackUrl) setReelAudioUrl(resolveAssetUrl(trackUrl));
        if (montage.summary) setAiSummary(montage.summary);
      } else {
        assembleLocalPhotoReel(targetSong);
      }
    } catch (err: any) {
      console.warn('Backend photo reel fallback (compiling locally):', err.message);
      assembleLocalPhotoReel();
    } finally {
      clearTimeout(reelTimer1);
      clearTimeout(reelTimer2);
      setIsProcessing(false);
      setProcessingPass(0);
      setProcessingStatus('');
    }
  };

  // Apply Reel from Simultaneous Multi-Asset AI Composer
  const handleApplyMultiAssetReel = (plan: any) => {
    if (!plan) return;
    saveCurrentSnapshot();

    if (plan.aspectRatio) setAspectRatio(plan.aspectRatio);
    if (plan.duration) {
      setDuration(plan.duration);
      setCurrentTime(0);
    }
    if (plan.clips && plan.clips.length > 0) {
      setClips(plan.clips);
      setSelectedClipId(plan.clips[0].id);
    }
    if (plan.transitions && plan.transitions.length > 0) setTransitions(plan.transitions);
    if (plan.subtitles && plan.subtitles.length > 0) setSubtitles(plan.subtitles);
    if (plan.subtitleStyle) setSubtitleStyle(plan.subtitleStyle);
    if (plan.colorGrading) setColorGrading(plan.colorGrading);
    if (plan.effects) setEffects(plan.effects);
    if (plan.audioTrack?.url) setReelAudioUrl(resolveAssetUrl(plan.audioTrack.url));
    if (plan.uploadedPhotos && plan.uploadedPhotos.length > 0) setUserPhotos(plan.uploadedPhotos);
    if (plan.summary) setAiSummary(plan.summary);
  };

  // Batch Photo Upload Handler
  const handlePhotoBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    // 1. Create immediate local object URLs so images work 100% offline without waiting
    const localPhotoItems = fileList.map((f, i) => ({
      id: `photo-${Date.now()}-${i}`,
      name: f.name,
      url: URL.createObjectURL(f),
      file: f,
    }));

    // 2. Persist in userPhotos state permanently for this session
    setUserPhotos(localPhotoItems);

    setIsProcessing(true);
    setProcessingStatus(`Processing ${files.length} uploaded photos...`);

    // 3. Try to upload to backend, fallback to localPhotoItems if offline
    let finalPhotos = localPhotoItems;
    try {
      const uploaded = await uploadPhotos(fileList);
      if (uploaded && uploaded.length > 0) {
        finalPhotos = uploaded;
        setUserPhotos(uploaded);
      }
    } catch (err: any) {
      console.warn('Backend photo upload notice (continuing with local photos):', err.message);
    }

    // 4. Assemble reel with the photos!
    await handlePhotosToReel(finalPhotos);
  };

  // Transition and OpenFX Handlers
  const handleAddTransition = (t: VideoTransition) => {
    setTransitions((prev) => [...prev, t]);
  };

  const handleRemoveTransition = (id: string) => {
    setTransitions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateEffect = (updatedEffect: VideoEffect) => {
    setEffects((prev) => prev.map((e) => (e.id === updatedEffect.id ? updatedEffect : e)));
  };

  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-resolve-950 text-gray-200 overflow-hidden font-sans">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="video/*"
        className="hidden"
      />

      {/* Hidden Batch Photos Input */}
      <input
        type="file"
        multiple
        ref={photoInputRef}
        onChange={handlePhotoBatchUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top DaVinci Resolve Navigation Header */}
      <WorkspaceHeader
        currentPage={currentPage}
        onPageChange={(page) => {
          if (page === 'deliver') {
            setIsExportOpen(true);
          } else {
            setCurrentPage(page);
          }
        }}
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenVision={handleOpenVision}
        onOpenMusic={() => setIsTrendingPickerOpen(true)}
        onOpenSubtitleGallery={() => setIsSubtitleGalleryOpen(true)}
        onOpenMultiComposer={() => setIsMultiComposerOpen(true)}
        onUploadClick={() => fileInputRef.current?.click()}
        isProcessing={isProcessing}
        processingStatus={processingStatus}
        processingPass={processingPass}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* AI Prompt Input Bar */}
      <AIPromptBar
        onSubmitPrompt={handleAIPrompt}
        isProcessing={isProcessing}
        modelName={config?.llmModel || 'gpt-oss-120b'}
        aiSummary={aiSummary}
        onUploadPhotos={() => photoInputRef.current?.click()}
        photosCount={userPhotos.length}
        onOpenMultiComposer={() => setIsMultiComposerOpen(true)}
      />

      {/* Main Workspace Dynamic Page Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* EDIT / CUT PAGE: Monitor + Inspector + Timeline */}
        {(currentPage === 'edit' || currentPage === 'cut') && (
          <>
            <div className="flex-1 flex overflow-hidden">
              <VideoMonitor
                videoUrl={videoUrl}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onSeek={(t) => setCurrentTime(t)}
                colorGrading={colorGrading}
                transform={transform}
                subtitleStyle={subtitleStyle}
                subtitles={subtitles}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                transitions={transitions}
                effects={effects}
                clips={clips}
                audioUrl={reelAudioUrl}
              />
              <InspectorPanel
                selectedClip={selectedClip}
                transform={transform}
                onTransformChange={setTransform}
                audioVolume={audioVolume}
                onAudioVolumeChange={setAudioVolume}
              />
            </div>

            {/* Bottom Multi-Track Timeline */}
            <Timeline
              duration={duration}
              currentTime={currentTime}
              onSeek={(t) => setCurrentTime(t)}
              clips={clips}
              onClipsChange={setClips}
              selectedClipId={selectedClipId}
              onSelectClip={setSelectedClipId}
              subtitles={subtitles}
              transitions={transitions}
              onRemoveTransition={handleRemoveTransition}
            />
          </>
        )}

        {/* COLOR PAGE: Monitor Top + 3-Way Color Wheels Bottom */}
        {currentPage === 'color' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-1/2 flex border-b border-resolve-800 overflow-hidden">
              <VideoMonitor
                videoUrl={videoUrl}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onSeek={(t) => setCurrentTime(t)}
                colorGrading={colorGrading}
                transform={transform}
                subtitleStyle={subtitleStyle}
                subtitles={subtitles}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                transitions={transitions}
                effects={effects}
                clips={clips}
                audioUrl={reelAudioUrl}
              />
            </div>
            <div className="h-1/2 overflow-hidden">
              <ColorGradingPanel
                settings={colorGrading}
                onChange={setColorGrading}
              />
            </div>
          </div>
        )}

        {/* EFFECTS PAGE: Monitor Top + OpenFX Effects & Transitions Bottom */}
        {currentPage === 'effects' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-1/2 flex border-b border-resolve-800 overflow-hidden">
              <VideoMonitor
                videoUrl={videoUrl}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onSeek={(t) => setCurrentTime(t)}
                colorGrading={colorGrading}
                transform={transform}
                subtitleStyle={subtitleStyle}
                subtitles={subtitles}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                transitions={transitions}
                effects={effects}
                clips={clips}
                audioUrl={reelAudioUrl}
              />
            </div>
            <div className="h-1/2 overflow-hidden">
              <EffectsPanel
                transitions={transitions}
                onAddTransition={handleAddTransition}
                onRemoveTransition={handleRemoveTransition}
                effects={effects}
                onUpdateEffect={handleUpdateEffect}
                currentTime={currentTime}
              />
            </div>
          </div>
        )}

        {/* SUBTITLES PAGE: Monitor Top + Subtitle Styler Bottom */}
        {currentPage === 'subtitles' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-1/2 flex border-b border-resolve-800 overflow-hidden">
              <VideoMonitor
                videoUrl={videoUrl}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onSeek={(t) => setCurrentTime(t)}
                colorGrading={colorGrading}
                transform={transform}
                subtitleStyle={subtitleStyle}
                subtitles={subtitles}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                transitions={transitions}
                effects={effects}
                clips={clips}
                audioUrl={reelAudioUrl}
              />
            </div>
            <div className="h-1/2 overflow-hidden">
              <SubtitleStyler
                style={subtitleStyle}
                onChange={setSubtitleStyle}
                subtitles={subtitles}
                onSubtitlesChange={setSubtitles}
                currentTime={currentTime}
                onSeek={(t) => setCurrentTime(t)}
                onGenerateSubtitles={handleGenerateSubtitles}
                isGeneratingSubtitles={isGeneratingSubtitles}
              />
            </div>
          </div>
        )}

        {/* MEDIA PAGE: Asset Library & B-Roll / Meme Pool */}
        {currentPage === 'media' && (
          <div className="flex-1 overflow-hidden">
            <AssetLibraryPanel
              assets={libraryAssets}
              currentTime={currentTime}
              onInsertAsset={handleInsertAsset}
              onUploadClick={() => fileInputRef.current?.click()}
            />
          </div>
        )}
      </div>

      {/* Human-in-the-Loop Trending Song Picker Modal */}
      <TrendingSongPickerModal
        isOpen={isTrendingPickerOpen}
        onClose={() => setIsTrendingPickerOpen(false)}
        query={trendingQuery}
        songs={trendingSongs}
        onSelectSong={handleSelectTrendingSong}
        isApplying={isApplyingReel}
      />

      {/* Vision Analysis Modal */}
      <VisionAnalysisModal
        isOpen={isVisionOpen}
        onClose={() => setIsVisionOpen(false)}
        frames={visionFrames}
        analysis={visionAnalysis}
        onApplyColorRecommendations={handleApplyVisionColor}
        onApplyMemeSuggestions={handleApplyVisionMemes}
        modelName={config?.visionModel || 'llama-3.2-11b-vision-preview'}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onConfigUpdated={(newConfig) => setConfig(newConfig)}
      />

      {/* Subtitle Styles Studio Modal (18 Presets) */}
      <SubtitleStyleGalleryModal
        isOpen={isSubtitleGalleryOpen}
        onClose={() => setIsSubtitleGalleryOpen(false)}
        currentStyle={subtitleStyle}
        onSelectStyle={(newStyle) => {
          setSubtitleStyle(newStyle);
        }}
      />

      {/* Simultaneous Multi-Asset + Prompt AI Reel Composer Modal */}
      <MultiAssetComposerModal
        isOpen={isMultiComposerOpen}
        onClose={() => setIsMultiComposerOpen(false)}
        onApplyReel={handleApplyMultiAssetReel}
      />

      {/* Intelligent AI Multi-Pass Loading Screen HUD */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-resolve-900 border border-resolve-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-resolve-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Sparkles className="w-5 h-5 text-black animate-spin" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-wide uppercase flex items-center space-x-2">
                    <span>Autonomous AI Director</span>
                    <span className="text-[10px] font-mono font-normal bg-resolve-800 text-resolve-orange px-2 py-0.5 rounded border border-resolve-700">
                      3-Pass Pipeline
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Drafting &bull; Vision Critic Inspection &bull; Master Polish
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-amber-400">
                  {processingPass > 0 ? `Pass ${processingPass} of 3` : 'AI Processing'}
                </span>
                <div className="text-[10px] text-gray-400 font-mono">{config?.llmModel || 'gpt-oss-120b'}</div>
              </div>
            </div>

            {/* 3 Passes Cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* Pass 1 */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  processingPass === 1
                    ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                    : processingPass > 1
                    ? 'bg-resolve-850/90 border-emerald-500/40 text-emerald-400'
                    : 'bg-resolve-850/50 border-resolve-800 text-gray-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-extrabold font-mono text-gray-200">PASS 1</span>
                  {processingPass > 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : processingPass === 1 ? (
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  ) : (
                    <Layers className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className="text-xs font-bold text-gray-100">Draft Edit Plan</div>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                  Cuts, timing, color & audio sync
                </p>
              </div>

              {/* Pass 2 */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  processingPass === 2
                    ? 'bg-cyan-500/10 border-cyan-500/60 ring-1 ring-cyan-500/30'
                    : processingPass > 2
                    ? 'bg-resolve-850/90 border-emerald-500/40 text-emerald-400'
                    : 'bg-resolve-850/50 border-resolve-800 text-gray-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-extrabold font-mono text-gray-200">PASS 2</span>
                  {processingPass > 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : processingPass === 2 ? (
                    <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className="text-xs font-bold text-gray-100">Vision Critic</div>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                  Multimodal keyframe & composition check
                </p>
              </div>

              {/* Pass 3 */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  processingPass === 3
                    ? 'bg-purple-500/10 border-purple-500/60 ring-1 ring-purple-500/30'
                    : 'bg-resolve-850/50 border-resolve-800 text-gray-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-extrabold font-mono text-gray-200">PASS 3</span>
                  {processingPass === 3 ? (
                    <Wand2 className="w-4 h-4 text-purple-400 animate-bounce" />
                  ) : (
                    <Wand2 className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className="text-xs font-bold text-gray-100">Master Polish</div>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                  Self-refinement & final delivery
                </p>
              </div>
            </div>

            {/* Dynamic Animated Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-resolve-950 rounded-full h-2 overflow-hidden border border-resolve-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    processingPass === 1
                      ? 'w-1/3 bg-gradient-to-r from-amber-500 to-orange-500'
                      : processingPass === 2
                      ? 'w-2/3 bg-gradient-to-r from-amber-500 via-cyan-500 to-blue-500'
                      : processingPass >= 3
                      ? 'w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400'
                      : 'w-1/4 bg-resolve-orange animate-pulse'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>{processingPass === 1 ? 'Pass 1 of 3 (Initial Plan)' : processingPass === 2 ? 'Pass 2 of 3 (Vision Critique)' : processingPass >= 3 ? 'Pass 3 of 3 (Master Polish)' : 'Analyzing'}</span>
                <span>{processingPass === 1 ? '33%' : processingPass === 2 ? '66%' : processingPass >= 3 ? '95%' : 'In progress...'}</span>
              </div>
            </div>

            {/* Status ticker */}
            <div className="p-3 bg-resolve-950/80 rounded-xl border border-resolve-800 flex items-center space-x-2.5">
              <div className="w-2 h-2 rounded-full bg-resolve-orange animate-ping" />
              <p className="text-xs font-mono text-gray-300 truncate">
                {processingStatus || 'Autonomous editing loop actively synthesizing...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Export / Deliver Master Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        videoPath={videoPath}
        clips={clips}
        colorGrading={colorGrading}
        subtitles={subtitles}
        aspectRatio={aspectRatio}
        audioTrackPath={reelAudioUrl ? (reelAudioUrl.startsWith('/') ? reelAudioUrl.slice(1) : reelAudioUrl) : null}
      />
    </div>
  );
}
