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
import { EffectsPanel } from './components/effects/EffectsPanel';
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
  requestSilenceDetection,
  requestTranscription,
  requestVisionAnalysis,
  searchTrendingSongs,
  uploadPhotos,
  uploadVideoFile,
} from './services/api';

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

  // Vision Analysis State
  const [visionFrames, setVisionFrames] = useState<KeyframeItem[]>([]);
  const [visionAnalysis, setVisionAnalysis] = useState<VisionAnalysis | null>(null);

  // Asset Library State (Memes, B-Roll, Trending Audio)
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);

  // Video State
  const [videoUrl, setVideoUrl] = useState<string>('/uploads/sample_editron.mp4');
  const [videoPath, setVideoPath] = useState<string>('uploads/sample_editron.mp4');
  const [reelAudioUrl, setReelAudioUrl] = useState<string | undefined>(undefined);
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
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Hidden File Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  // Keyboard Shortcuts (DaVinci Resolve style: Space, C, Delete, Left/Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
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
  }, [selectedClipId, currentTime, duration, clips]);

  const splitCurrentClip = () => {
    const clipToSplit = clips.find((c) => currentTime > c.start + 0.1 && currentTime < c.end - 0.1);
    if (!clipToSplit) return;

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

    setIsProcessing(true);
    setProcessingStatus('Uploading & probing video with FFmpeg...');

    try {
      const media = await uploadVideoFile(file);
      setVideoUrl(media.videoUrl);
      setVideoPath(media.videoPath);
      setDuration(media.metadata.duration || 15);
      setCurrentTime(0);

      // Create initial timeline clip
      const initialClip: VideoClip = {
        id: `clip-${Date.now()}`,
        name: media.originalName,
        trackId: 'v1',
        start: 0,
        end: media.metadata.duration,
        sourceStart: 0,
        sourceEnd: media.metadata.duration,
        speed: 1.0,
      };
      setClips([initialClip]);
      setSelectedClipId(initialClip.id);

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

      setProcessingStatus('');
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // AI Prompt Bar Submission
  const handleAIPrompt = async (prompt: string) => {
    setIsProcessing(true);
    const p = prompt.toLowerCase();

    // Check if user requested photo montage / 10 photos attitude reel
    if (
      p.includes('photo') ||
      p.includes('image') ||
      p.includes('montage')
    ) {
      await handlePhotosToReel();
      return;
    }

    // Check if user requested a trending song / attitude reel (Human-In-The-Loop Flow)
    if (
      p.includes('attitude') ||
      p.includes('trending') ||
      p.includes('song') ||
      p.includes('hindi') ||
      p.includes('music') ||
      p.includes('reel')
    ) {
      setProcessingStatus('Scanning internet charts for trending attitude tracks...');
      try {
        const songs = await searchTrendingSongs(prompt);
        if (songs && songs.length > 0) {
          setTrendingSongs(songs);
          setTrendingQuery(prompt);
          setIsTrendingPickerOpen(true);
          setIsProcessing(false);
          setProcessingStatus('');
          return;
        }
      } catch (err) {
        console.warn('Trending search fallback:', err);
      }
    }

    // Check if user requested auto-cutting silences / jump cuts
    if (
      p.includes('silence') ||
      p.includes('auto-cut') ||
      p.includes('autocut') ||
      p.includes('jump cut') ||
      p.includes('remove pause') ||
      p.includes('trim silence')
    ) {
      setProcessingStatus('Running FFmpeg precision silence detection filter...');
      try {
        const result = await requestSilenceDetection(videoPath);
        if (result && result.speechSegments && result.speechSegments.length > 0) {
          const cutClips: VideoClip[] = result.speechSegments.map((seg, i) => ({
            id: `speech-cut-${i}-${Date.now()}`,
            name: seg.label || `Speech Part ${i + 1}`,
            trackId: 'v1',
            start: seg.start,
            end: seg.end,
            sourceStart: seg.start,
            sourceEnd: seg.end,
            speed: 1.0,
            label: `Speech Part ${i + 1}`,
          }));
          setClips(cutClips);
          setSelectedClipId(cutClips[0]?.id || null);
          setAiSummary(`Auto-cut complete: Removed ${result.silencesCount} silent pauses, preserved ${result.speechCount} active speech segments.`);
          setIsProcessing(false);
          setProcessingStatus('');
          return;
        }
      } catch (err: any) {
        console.warn('Auto-cut silence detection fallback:', err);
      }
    }

    setProcessingStatus(`Consulting AI Director (${config?.llmModel || 'gpt-oss-120b'})...`);

    try {
      const plan = await requestAIEdits({
        prompt,
        transcript: subtitles,
        duration,
      });

      if (plan) {
        if (plan.summary) {
          setAiSummary(plan.summary);
        }

        // Apply Color Grading
        if (plan.colorGrading) {
          setColorGrading((prev) => ({
            ...prev,
            ...plan.colorGrading,
          }));
        }

        // Apply Subtitle Style
        if (plan.subtitleStyle) {
          setSubtitleStyle((prev) => ({
            ...prev,
            ...plan.subtitleStyle,
          }));
        }

        // Apply Smart Cuts
        if (plan.cuts && plan.cuts.length > 0) {
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

        // Apply Zoom punch-in if requested
        if (plan.zooms && plan.zooms.length > 0) {
          setTransform((prev) => ({
            ...prev,
            scale: plan.zooms[0].scale || 1.15,
          }));
        }
      }
    } catch (err: any) {
      console.error('AI Edit failed:', err);
      alert(`AI Edit error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Human-in-the-Loop Selection: Apply selected song to generate full Attitude Reel
  const handleSelectTrendingSong = async (song: TrendingSong) => {
    setIsApplyingReel(true);
    setProcessingStatus(`Crafting Attitude Reel with "${song.title}"...`);

    try {
      const reel = await applyAttitudeReel({ songId: song.id, duration });
      if (reel) {
        setAspectRatio('9:16');
        setColorGrading(reel.colorGrading);
        setSubtitleStyle(reel.subtitleStyle);
        setAiSummary(reel.summary);

        if (reel.cuts && reel.cuts.length > 0) {
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

        if (reel.audioTrack?.url) {
          setReelAudioUrl(reel.audioTrack.url);
        }

        setIsTrendingPickerOpen(false);
      }
    } catch (err: any) {
      console.error('Failed to apply attitude reel:', err);
      alert(`Could not create attitude reel: ${err.message}`);
    } finally {
      setIsApplyingReel(false);
      setProcessingStatus('');
    }
  };

  // Handle 10-Photos to Attitude Reel Montage
  const handlePhotosToReel = async (uploadedPhotos?: any[], songId = 'trend-hindi-1') => {
    setIsProcessing(true);
    setProcessingStatus('AI Director assembling 10-photo attitude reel with beat drops & transitions...');

    try {
      const montage = await generatePhotosToReel({
        photos: uploadedPhotos || [],
        prompt: '10 photos attitude reel with trending song and transitions',
        songId,
      });

      if (montage) {
        setAspectRatio('9:16');
        setDuration(montage.duration || 12.0);
        setCurrentTime(0);
        setClips(montage.clips || []);
        setSelectedClipId(montage.clips?.[0]?.id || null);
        setTransitions(montage.transitions || []);
        setSubtitles(montage.subtitles || []);
        if (montage.colorGrading) setColorGrading(montage.colorGrading);
        if (montage.subtitleStyle) setSubtitleStyle(montage.subtitleStyle);
        if (montage.effects) setEffects(montage.effects);
        if (montage.audioTrack?.url) setReelAudioUrl(montage.audioTrack.url);
        if (montage.summary) setAiSummary(montage.summary);
      }
    } catch (err: any) {
      console.error('Failed to create photo montage reel:', err);
      alert(`Photo montage error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Batch Photo Upload Handler
  const handlePhotoBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setProcessingStatus(`Uploading ${files.length} photos...`);

    try {
      const fileList = Array.from(files);
      const uploaded = await uploadPhotos(fileList);
      await handlePhotosToReel(uploaded);
    } catch (err: any) {
      console.error('Photo batch upload error:', err);
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
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
        onUploadClick={() => fileInputRef.current?.click()}
        isProcessing={isProcessing}
        processingStatus={processingStatus}
      />

      {/* AI Prompt Input Bar */}
      <AIPromptBar
        onSubmitPrompt={handleAIPrompt}
        isProcessing={isProcessing}
        modelName={config?.llmModel || 'gpt-oss-120b'}
        aiSummary={aiSummary}
        onUploadPhotos={() => photoInputRef.current?.click()}
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
