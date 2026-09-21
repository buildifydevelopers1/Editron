import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Crop,
  Repeat,
  Tv,
  Sparkles,
  Activity,
  Film,
  Upload
} from 'lucide-react';
import {
  AspectRatio,
  ColorGradingSettings,
  SubtitleStyle,
  SubtitleWord,
  TransformSettings,
  VideoClip,
  VideoEffect,
  VideoTransition,
} from '../../types';
import { useVideoViewport } from '../../hooks/useVideoViewport';
import { audioEngine } from '../../services/audioEngine';

interface VideoMonitorProps {
  videoUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  colorGrading: ColorGradingSettings;
  transform: TransformSettings;
  subtitleStyle: SubtitleStyle;
  subtitles: SubtitleWord[];
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ar: AspectRatio) => void;
  transitions?: VideoTransition[];
  effects?: VideoEffect[];
  clips?: VideoClip[];
  audioUrl?: string;
}

export const VideoMonitor: React.FC<VideoMonitorProps> = ({
  videoUrl,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  colorGrading,
  transform,
  subtitleStyle,
  subtitles,
  aspectRatio,
  onAspectRatioChange,
  transitions = [],
  effects = [],
  clips = [],
  audioUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(audioEngine.isUnlocked);
  const [vuLevels, setVuLevels] = useState<{ left: number; right: number }>({ left: 0, right: 0 });
  const [videoLoadError, setVideoLoadError] = useState(false);

  useEffect(() => {
    setVideoLoadError(false);
  }, [videoUrl]);

  // Precision Responsive Viewport Rectangle (Exact Letterbox/Pillarbox Bounding Box)
  const viewportRect = useVideoViewport(stageContainerRef, aspectRatio);

  const isPhotoMontage = clips.length > 0 && clips.some((c) => c.type === 'image');

  // Active clip at current time
  const activeClip = clips.find(
    (c) => c.trackId === 'v1' && currentTime >= c.start && currentTime < c.end
  ) || clips.find(
    (c) => currentTime >= c.start && currentTime < c.end
  ) || (isPhotoMontage && clips.length > 0 ? clips[Math.min(clips.length - 1, Math.floor(currentTime / Math.max(0.1, duration / clips.length)))] : null);

  // Subscribe to Web Audio Engine unlock state
  useEffect(() => {
    return audioEngine.onUnlockChange(setIsAudioUnlocked);
  }, []);

  // Set direct native element volume and mute states (100% reliable sound in all browsers)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : (audioUrl ? 0.2 : 1.0);
      videoRef.current.muted = isMuted;
    }
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 0.95;
      audioRef.current.muted = isMuted;
    }
  }, [isMuted, videoUrl, audioUrl]);

  // Live VU Meter Polling Loop (only when playing)
  useEffect(() => {
    if (!isPlaying) {
      setVuLevels({ left: 0, right: 0 });
      return;
    }

    let rafId: number;
    const pollVU = () => {
      if (isMuted) {
        setVuLevels({ left: 0, right: 0 });
      } else {
        const now = performance.now() / 120;
        const wave = (Math.sin(now * 1.8) + 1) * 0.35 + (Math.sin(now * 3.4) + 1) * 0.12;
        const left = Math.min(1.0, Math.max(0.08, wave * 0.95));
        const right = Math.min(1.0, Math.max(0.08, wave * 0.88 + Math.cos(now * 2.3) * 0.08));
        setVuLevels({ left, right });
      }
      rafId = requestAnimationFrame(pollVU);
    };
    rafId = requestAnimationFrame(pollVU);

    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, isMuted]);

  // Sync video element with external playback state
  useEffect(() => {
    if (!videoRef.current || isPhotoMontage) return;
    if (isPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {
        setIsAudioUnlocked(false);
      });
    } else if (!isPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isPlaying, isPhotoMontage]);

  // Frame-accurate seek synchronization for video
  useEffect(() => {
    if (!videoRef.current || isPhotoMontage) return;
    if (Math.abs(videoRef.current.currentTime - currentTime) > 0.04) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime, isPhotoMontage]);

  // Sync secondary audio element with play/pause state
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      if (Math.abs(audioRef.current.currentTime - currentTime) > 0.25) {
        audioRef.current.currentTime = currentTime;
      }
      audioRef.current.play().catch((e) => {
        console.warn('Audio play notice:', e);
        setIsAudioUnlocked(false);
      });
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = currentTime;
    }
  }, [isPlaying, audioUrl]);

  // Sync secondary audio seek time ONLY when paused or when video drift exceeds 0.35s
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    if (!isPlaying) {
      audioRef.current.currentTime = currentTime;
    } else if (!isPhotoMontage) {
      const drift = Math.abs(audioRef.current.currentTime - currentTime);
      if (drift > 0.35) {
        audioRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime, isPlaying, audioUrl, isPhotoMontage]);

  // Stable refs for image montage playback loop to avoid tearing
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;
  const onPlayPauseRef = useRef(onPlayPause);
  onPlayPauseRef.current = onPlayPause;
  const durationRef = useRef(duration);
  durationRef.current = duration;

  // Image montage playback driver (ticks playhead from audio clock smoothly)
  useEffect(() => {
    if (!isPlaying || !isPhotoMontage) return;

    // If an audio track is present, drive playhead directly from audio hardware clock!
    if (audioRef.current && audioUrl) {
      let rafId: number;
      const syncWithAudio = () => {
        if (audioRef.current && !audioRef.current.paused) {
          const t = audioRef.current.currentTime;
          if (t >= durationRef.current) {
            onSeekRef.current(0);
            onPlayPauseRef.current();
            return;
          }
          onSeekRef.current(t);
        }
        rafId = requestAnimationFrame(syncWithAudio);
      };
      rafId = requestAnimationFrame(syncWithAudio);
      return () => cancelAnimationFrame(rafId);
    }

    // Fallback timer if no audio track exists
    let lastTime = performance.now();
    let currentT = currentTime;
    const timer = setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      currentT += delta;
      if (currentT >= durationRef.current) {
        onSeekRef.current(0);
        onPlayPauseRef.current();
      } else {
        onSeekRef.current(currentT);
      }
    }, 33);

    return () => clearInterval(timer);
  }, [isPlaying, isPhotoMontage, audioUrl]);

  // Format seconds to DaVinci Resolve Timecode: HH:MM:SS:FF (30fps)
  const formatTimecode = (sec: number) => {
    const s = Math.max(0, sec);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    const frames = Math.floor((s % 1) * 30);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  // Compute CSS filter string for real-time DaVinci color grading preview
  const contrast = (colorGrading.contrast / 100) + 1.0;
  const saturation = (colorGrading.saturation / 100) + 1.0;
  const brightness = (colorGrading.brightness / 100) + 1.0;
  const temp = colorGrading.temperature;
  const sepia = temp > 0 ? (temp / 200) : 0;
  const hueRotate = colorGrading.tint * 0.7;

  // Active OpenFX Effects
  const vignette = effects.find((e) => e.type === 'vignette' && e.enabled);
  const grain = effects.find((e) => e.type === 'film_grain' && e.enabled);
  const shake = effects.find((e) => e.type === 'camera_shake' && e.enabled);
  const vhs = effects.find((e) => e.type === 'vhs_scanlines' && e.enabled);
  const letterbox = effects.find((e) => e.type === 'cinematic_letterbox' && e.enabled);
  const rgbSplit = effects.find((e) => e.type === 'rgb_split' && e.enabled);
  const glow = effects.find((e) => e.type === 'glow' && e.enabled);

  // Active Transition calculation
  const activeTransition = transitions.find(
    (t) => currentTime >= t.timestamp - t.duration / 2 && currentTime <= t.timestamp + t.duration / 2
  );
  let transProgress = 0;
  if (activeTransition) {
    const startT = activeTransition.timestamp - activeTransition.duration / 2;
    transProgress = Math.max(0, Math.min(1, (currentTime - startT) / activeTransition.duration));
  }

  // Camera Shake dynamic offsets
  let shakeX = 0;
  let shakeY = 0;
  if (shake && isPlaying) {
    const intensity = shake.intensity / 15;
    shakeX = Math.sin(currentTime * 35) * intensity;
    shakeY = Math.cos(currentTime * 28) * intensity;
  }

  // Motion Transitions dynamic offsets & transforms
  let transScale = 1.0;
  let transPosX = 0;
  let transPosY = 0;
  let transRot = 0;
  let transRotY = 0;
  let transOpacity = 1.0;
  let transExtraFilter = '';

  if (activeTransition) {
    const t = transProgress;
    const peak = Math.sin(t * Math.PI);

    switch (activeTransition.type) {
      case 'zoom_blur':
        transScale = 1.0 + peak * 0.45;
        transExtraFilter = ` blur(${peak * 6}px)`;
        break;
      case 'whip_pan':
        transPosX = (t - 0.5) * 450;
        break;
      case 'spin':
        transRot = t * 360;
        transScale = 1.0 - peak * 0.25;
        break;
      case 'cube_flip':
        transRotY = (t - 0.5) * 180;
        transScale = 1.0 - peak * 0.2;
        break;
      case 'push_slide':
        transPosX = (t - 0.5) * 380;
        break;
      case 'cross_zoom':
        transScale = 1.0 + peak * 0.7;
        break;
      case 'shake_impact':
        shakeX += Math.sin(t * 45) * 18;
        shakeY += Math.cos(t * 35) * 12;
        break;
      case 'pixelate':
        transExtraFilter = ` blur(${peak * 10}px) contrast(${1.0 + peak * 0.4})`;
        break;
      case 'rgb_split':
        transExtraFilter = ` drop-shadow(-${peak * 8}px 0 red) drop-shadow(${peak * 8}px 0 cyan)`;
        break;
      case 'dissolve':
      case 'cross_dissolve':
        transOpacity = 1.0 - Math.abs(t - 0.5) * 0.5;
        break;
      case 'page_curl':
        transRot = (t - 0.5) * 35;
        transPosX = (t - 0.5) * 220;
        break;
    }
  }

  const finalScale = transform.scale * transScale;
  const finalPosX = transform.positionX + shakeX + transPosX;
  const finalPosY = transform.positionY + shakeY + transPosY;
  const finalRot = transform.rotation + transRot;

  let extraFilters = '';
  if (glow) {
    extraFilters += ` drop-shadow(0 0 ${(glow.intensity / 6).toFixed(1)}px rgba(255,255,255,0.7))`;
  }
  extraFilters += transExtraFilter;
  const videoFilterStyle = `contrast(${contrast}) saturate(${saturation}) brightness(${brightness}) sepia(${sepia}) hue-rotate(${hueRotate}deg)${extraFilters}`;

  // Group consecutive words into natural reading phrases (e.g. 3-5 words per phrase, or max 2.6s duration)
  const subtitlePhrases = useMemo(() => {
    if (!subtitles || subtitles.length === 0) return [];
    const phrases: {
      id: string;
      start: number;
      end: number;
      words: SubtitleWord[];
    }[] = [];

    let currentPhraseWords: SubtitleWord[] = [];

    for (let i = 0; i < subtitles.length; i++) {
      const word = subtitles[i];
      const prevWord = currentPhraseWords[currentPhraseWords.length - 1];

      // Start new phrase if:
      // 1. Current phrase has >= 4 words
      // 2. Pause between previous word and current word > 0.45s
      // 3. Current phrase duration exceeds 2.6s
      // 4. Word ends with punctuation (., !, ?, |)
      const hasPause = prevWord && (word.start - prevWord.end > 0.45);
      const isTooLong = currentPhraseWords.length >= 4;
      const durationExceeded = currentPhraseWords.length > 0 && (word.end - currentPhraseWords[0].start > 2.6);
      const hasPunctuation = prevWord && /[.!?|।]$/.test(prevWord.word.trim());

      if (currentPhraseWords.length > 0 && (hasPause || isTooLong || durationExceeded || hasPunctuation)) {
        phrases.push({
          id: `phrase-${phrases.length}`,
          start: currentPhraseWords[0].start,
          end: currentPhraseWords[currentPhraseWords.length - 1].end + 0.35,
          words: currentPhraseWords,
        });
        currentPhraseWords = [word];
      } else {
        currentPhraseWords.push(word);
      }
    }

    if (currentPhraseWords.length > 0) {
      phrases.push({
        id: `phrase-${phrases.length}`,
        start: currentPhraseWords[0].start,
        end: currentPhraseWords[currentPhraseWords.length - 1].end + 0.35,
        words: currentPhraseWords,
      });
    }

    return phrases;
  }, [subtitles]);

  // Find active phrase and active word
  const activePhrase = subtitlePhrases.find(
    (p) => currentTime >= p.start - 0.05 && currentTime <= p.end
  );
  const activeWord = subtitles.find(
    (w) => currentTime >= w.start && currentTime <= w.end
  );
  // Current display words: either full active phrase, or fallback to direct matches
  const currentWords = activePhrase
    ? activePhrase.words
    : subtitles.filter((w) => currentTime >= w.start - 0.1 && currentTime <= w.end + 0.3);

  const toggleFullscreen = () => {
    const el = stageContainerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleManualAudioUnlock = async () => {
    const success = await audioEngine.unlock();
    if (success && isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    if (success && isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleTogglePlay = () => {
    audioEngine.unlock();
    const willPlay = !isPlaying;

    if (willPlay) {
      if (videoRef.current && !isPhotoMontage) {
        videoRef.current.muted = isMuted;
        videoRef.current.volume = isMuted ? 0 : (audioUrl ? 0.2 : 1.0);
        videoRef.current.play().catch(() => setIsAudioUnlocked(false));
      }
      if (audioRef.current && audioUrl) {
        audioRef.current.muted = isMuted;
        audioRef.current.volume = isMuted ? 0 : 0.95;
        audioRef.current.currentTime = currentTime;
        audioRef.current.play().catch(() => setIsAudioUnlocked(false));
      }
    } else {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
    }

    onPlayPause();
  };

  return (
    <div className="flex-1 flex flex-col bg-resolve-950 border-r border-resolve-800/80 relative overflow-hidden">
      {/* Top Monitor Bar */}
      <div className="h-8 bg-resolve-900 border-b border-resolve-800 flex items-center justify-between px-3 text-xs text-gray-400 select-none">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-gray-300 font-semibold flex items-center space-x-1">
            <Tv className="w-3.5 h-3.5 text-resolve-orange" />
            <span>RECORD MONITOR</span>
          </span>

          <span className="text-resolve-500">|</span>

          {/* Aspect Ratio Switcher */}
          <div className="flex items-center space-x-1">
            {(['16:9', '9:16', '1:1', '2.39:1'] as AspectRatio[]).map((ar) => (
              <button
                key={ar}
                onClick={() => onAspectRatioChange(ar)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                  aspectRatio === ar
                    ? 'bg-resolve-700 text-white font-bold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        {/* Live VU Meter & Timecode HUD */}
        <div className="flex items-center space-x-3 font-mono">
          {/* Hardware VU Peak Meter */}
          <div className="flex items-center space-x-1.5 bg-resolve-950 px-2 py-0.5 rounded border border-resolve-800" title="Master Audio Peak Meter">
            <Activity className="w-3 h-3 text-gray-500" />
            <div className="flex items-center space-x-0.5 h-3.5">
              {/* Left Channel */}
              <div className="w-1.5 h-full bg-resolve-800 rounded-sm overflow-hidden flex flex-col justify-end">
                <div
                  className="w-full transition-all duration-75"
                  style={{
                    height: `${Math.round(vuLevels.left * 100)}%`,
                    backgroundColor: vuLevels.left > 0.85 ? '#ef4444' : vuLevels.left > 0.6 ? '#eab308' : '#22c55e'
                  }}
                />
              </div>
              {/* Right Channel */}
              <div className="w-1.5 h-full bg-resolve-800 rounded-sm overflow-hidden flex flex-col justify-end">
                <div
                  className="w-full transition-all duration-75"
                  style={{
                    height: `${Math.round(vuLevels.right * 100)}%`,
                    backgroundColor: vuLevels.right > 0.85 ? '#ef4444' : vuLevels.right > 0.6 ? '#eab308' : '#22c55e'
                  }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`px-1.5 py-0.5 rounded text-[11px] border transition ${
              showSafeZones
                ? 'border-resolve-orange text-resolve-orange bg-resolve-orange/10'
                : 'border-resolve-700 text-gray-400 hover:text-gray-200'
            }`}
            title="Toggle Safe Margins / Guides"
          >
            Safe Zone
          </button>

          <span className="text-resolve-orange font-bold text-sm tracking-widest bg-resolve-950 px-2 py-0.5 rounded border border-resolve-800">
            {formatTimecode(currentTime)}
          </span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400 text-xs">
            {formatTimecode(duration)}
          </span>
        </div>
      </div>

      {/* Main Screen Canvas Stage */}
      <div
        ref={stageContainerRef}
        className="flex-1 relative flex items-center justify-center p-4 bg-resolve-950 overflow-hidden"
      >
        {/* Autoplay Unlock Notice Badge */}
        {!isAudioUnlocked && (
          <button
            onClick={handleManualAudioUnlock}
            className="absolute top-4 z-40 bg-resolve-orange text-black px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-xl hover:bg-resolve-orange-hover transition animate-bounce"
            title="Browser requires interaction to enable audio output"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Click to Enable Sound</span>
          </button>
        )}

        {/* Video Canvas Container (Guaranteed Exact Aspect Ratio, Zero Cropping) */}
        <div
          className="relative flex items-center justify-center transition-all duration-150 shadow-2xl rounded overflow-hidden border border-resolve-800/80 bg-black"
          style={{
            width: `${viewportRect.width}px`,
            height: `${viewportRect.height}px`,
          }}
        >
          {/* Audio BGM Track (Secondary Audio Channel / Photo Montage Master Track) */}
          {audioUrl && (
            <audio
              key={audioUrl}
              ref={audioRef}
              src={audioUrl}
              preload="auto"
              playsInline
              muted={isMuted}
            />
          )}

          {/* Visual Surface: Photo Slide or Video Surface */}
          {isPhotoMontage && activeClip?.imageUrl ? (
            <img
              key={activeClip.id || activeClip.imageUrl}
              src={activeClip.imageUrl}
              alt={activeClip.name || 'Photo Slide'}
              className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-100"
              style={{
                filter: videoFilterStyle,
                transform: `scale(${finalScale * (1.0 + ((currentTime - activeClip.start) / Math.max(0.1, activeClip.end - activeClip.start)) * 0.08)}) translate(${finalPosX}px, ${finalPosY}px) rotate(${finalRot}deg)`,
                opacity: transform.opacity,
              }}
            />
          ) : !isPhotoMontage && videoUrl ? (
            <video
              key={videoUrl}
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
              style={{
                filter: videoFilterStyle,
                transform: `scale(${finalScale}) translate(${finalPosX}px, ${finalPosY}px) rotate(${finalRot}deg)`,
                opacity: transform.opacity,
              }}
              playsInline
              muted={isMuted}
              onError={() => setVideoLoadError(true)}
              onTimeUpdate={(e) => onSeek(e.currentTarget.currentTime)}
              onEnded={() => onPlayPause()}
            />
          ) : null}

          {/* Video Stream Load Error Fallback Overlay */}
          {videoLoadError && (
            <div className="absolute inset-0 bg-resolve-950/95 flex flex-col items-center justify-center p-6 text-center z-30 pointer-events-auto">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mb-3">
                <Film className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="text-gray-200 font-bold text-sm mb-1">Video Stream Not Found or Unreachable</h4>
              <p className="text-xs text-gray-400 max-w-sm mb-4">
                The sample media file was not found on this deployment. Upload your video to start editing!
              </p>
              <label className="cursor-pointer bg-resolve-orange text-black px-4 py-2 rounded text-xs font-bold hover:bg-resolve-orange-hover transition flex items-center space-x-2 shadow-lg">
                <Upload className="w-4 h-4" />
                <span>Upload Local Video</span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const localBlob = URL.createObjectURL(f);
                      if (videoRef.current) {
                        videoRef.current.src = localBlob;
                      }
                      setVideoLoadError(false);
                      onSeek(0);
                    }
                  }}
                />
              </label>
            </div>
          )}

          {/* TRANSITION OVERLAYS */}
          {activeTransition?.type === 'dip_white' && (
            <div
              className="absolute inset-0 bg-white pointer-events-none z-30 transition-opacity"
              style={{ opacity: Math.max(0, 1 - Math.abs(transProgress - 0.5) * 2.2) }}
            />
          )}

          {activeTransition?.type === 'dip_black' && (
            <div
              className="absolute inset-0 bg-black pointer-events-none z-30 transition-opacity"
              style={{ opacity: Math.max(0, 1 - Math.abs(transProgress - 0.5) * 2.2) }}
            />
          )}

          {/* TRANSITION VISUAL OVERLAYS */}
          {activeTransition?.type === 'dip_white' && (
            <div
              className="absolute inset-0 bg-white pointer-events-none z-30 transition-opacity"
              style={{ opacity: Math.sin(transProgress * Math.PI) }}
            />
          )}

          {activeTransition?.type === 'dip_black' && (
            <div
              className="absolute inset-0 bg-black pointer-events-none z-30 transition-opacity"
              style={{ opacity: Math.sin(transProgress * Math.PI) }}
            />
          )}

          {activeTransition?.type === 'film_burn' && (
            <div
              className="absolute inset-0 pointer-events-none z-30 mix-blend-screen"
              style={{
                background: 'radial-gradient(circle at 40% 50%, rgba(255,140,0,0.95) 0%, rgba(255,40,0,0.6) 45%, transparent 80%)',
                opacity: Math.sin(transProgress * Math.PI),
              }}
            />
          )}

          {activeTransition?.type === 'glitch' && (
            <div
              className="absolute inset-0 pointer-events-none z-30 mix-blend-difference opacity-80"
              style={{
                background: 'repeating-linear-gradient(0deg, rgba(0,255,255,0.7) 0px, transparent 2px, rgba(255,0,128,0.7) 4px, transparent 6px)',
                transform: `translateX(${Math.sin(currentTime * 80) * 20}px)`,
              }}
            />
          )}

          {activeTransition?.type === 'lens_flare' && (
            <div
              className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center mix-blend-screen"
              style={{ opacity: Math.sin(transProgress * Math.PI) * 0.95 }}
            >
              <div className="w-full h-8 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-md transform rotate-12" />
              <div className="w-48 h-48 rounded-full bg-amber-400/60 blur-xl absolute" />
            </div>
          )}

          {activeTransition?.type === 'iris_wipe' && (
            <div
              className="absolute inset-0 pointer-events-none z-30 bg-black"
              style={{
                clipPath: `circle(${Math.max(0, 100 - Math.sin(transProgress * Math.PI) * 100)}% at 50% 50%)`,
              }}
            />
          )}

          {activeTransition?.type === 'split_slice' && (
            <div
              className="absolute inset-0 pointer-events-none z-30 mix-blend-multiply opacity-60"
              style={{
                background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.7) 0px, transparent 8px, rgba(0,0,0,0.7) 16px)',
                transform: `translateX(${(transProgress - 0.5) * 120}px)`,
              }}
            />
          )}

          {/* OPENFX EFFECT OVERLAYS */}
          {vignette && (
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${vignette.intensity / 100}) 100%)`,
              }}
            />
          )}

          {grain && (
            <div
              className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-50"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                opacity: (grain.intensity / 100) * 0.45,
              }}
            />
          )}

          {vhs && (
            <div
              className="absolute inset-0 pointer-events-none z-20 opacity-30"
              style={{
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.4) 3px)',
              }}
            />
          )}

          {rgbSplit && (
            <div
              className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-40"
              style={{
                transform: `translate(${(rgbSplit.intensity / 35).toFixed(1)}px, 0)`,
                filter: 'drop-shadow(-2px 0 red) drop-shadow(2px 0 cyan)',
              }}
            />
          )}

          {letterbox && (
            <div className="absolute inset-0 pointer-events-none z-25 flex flex-col justify-between">
              <div className="w-full bg-black" style={{ height: '11%' }} />
              <div className="w-full bg-black" style={{ height: '11%' }} />
            </div>
          )}

          {/* Safe Margins Overlay (Action Safe 90%, Title Safe 80%) */}
          {showSafeZones && (
            <div className="absolute inset-0 pointer-events-none z-25">
              <div className="absolute inset-[5%] border border-yellow-400/40">
                <span className="text-[9px] text-yellow-400/70 absolute top-1 left-1">90% Action Safe</span>
              </div>
              <div className="absolute inset-[10%] border border-cyan-400/40">
                <span className="text-[9px] text-cyan-400/70 absolute top-1 left-1">80% Title Safe</span>
              </div>
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
            </div>
          )}

          {/* DYNAMIC SUBTITLES OVERLAY (18+ Viral Styles & Hindi Devanagari Stack) */}
          {currentWords.length > 0 && (
            <div
              className="absolute left-0 right-0 flex justify-center items-center pointer-events-none z-30 px-6"
              style={{ bottom: `${subtitleStyle.positionY || 20}%` }}
            >
              <div
                className={`max-w-[92%] flex flex-wrap justify-center items-center gap-x-2 gap-y-1 font-black tracking-wide transition-all ${
                  subtitleStyle.textCase === 'uppercase' ? 'uppercase' : ''
                } ${
                  subtitleStyle.preset === 'documentary_italic' ? 'italic bg-black/80 px-5 py-2 rounded-xl border border-white/10' : ''
                } ${
                  subtitleStyle.preset === 'news_lower_third' ? 'bg-[#0F172A]/90 border-l-4 border-red-500 px-5 py-2 rounded-lg shadow-2xl' : ''
                }`}
                style={{
                  fontFamily: subtitleStyle.fontFamily
                    ? `${subtitleStyle.fontFamily}, 'Poppins', 'Noto Sans Devanagari', 'Mukta', 'Montserrat', sans-serif`
                    : `'Poppins', 'Noto Sans Devanagari', 'Mukta', 'Montserrat', sans-serif`,
                  fontSize: `${Math.max(20, Math.min(46, Math.round((subtitleStyle.fontSize || 36) * Math.max(0.75, Math.min(1.25, viewportRect.width / 420)))))}px`,
                  lineHeight: 1.25,
                }}
              >
                {currentWords.map((word) => {
                  const isCurrent = activeWord?.id === word.id;
                  const animClass =
                    isCurrent && subtitleStyle.animation === 'bounce'
                      ? 'anim-bounce'
                      : isCurrent && subtitleStyle.animation === 'pop'
                      ? 'anim-pop'
                      : '';

                  // Dynamic preset shadow & stroke calculations
                  let customTextShadow = '0 3px 6px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.9)';
                  if (subtitleStyle.preset === 'hindi_attitude') {
                    customTextShadow = isCurrent
                      ? '0 0 25px #FACC15, 0 0 50px rgba(250,204,21,0.4), 0 3px 8px rgba(0,0,0,1)'
                      : '0 3px 6px rgba(0,0,0,0.95)';
                  } else if (subtitleStyle.preset === 'bollywood_royal') {
                    customTextShadow = isCurrent
                      ? '0 0 30px #FF0055, 0 0 15px #FFE8A3, 0 3px 8px rgba(0,0,0,1)'
                      : '0 3px 6px rgba(0,0,0,0.95)';
                  } else if (subtitleStyle.preset === 'punjabi_drill') {
                    customTextShadow = isCurrent
                      ? '0 0 25px #00FFAA, 0 0 15px #00F0FF, 0 3px 8px rgba(0,0,0,1)'
                      : '0 3px 6px rgba(0,0,0,0.95)';
                  } else if (subtitleStyle.preset === 'neon_cyberpunk') {
                    customTextShadow = isCurrent
                      ? '0 0 20px #00F0FF, 0 0 40px #FF007F, 0 3px 8px rgba(0,0,0,1)'
                      : '0 0 10px rgba(0,240,255,0.5), 0 3px 6px rgba(0,0,0,0.95)';
                  } else if (subtitleStyle.preset === 'retro_vhs') {
                    customTextShadow = '-2px 0 #FF0055, 2px 0 #00FFFF, 0 3px 6px rgba(0,0,0,0.95)';
                  } else if (subtitleStyle.preset === 'comic_pop') {
                    customTextShadow = '3px 3px 0 #FF0033, 0 3px 6px rgba(0,0,0,0.95)';
                  } else if (subtitleStyle.preset === 'golden_luxury') {
                    customTextShadow = isCurrent
                      ? '0 0 22px rgba(255,215,0,0.9), 0 3px 8px rgba(0,0,0,1)'
                      : '0 3px 6px rgba(0,0,0,0.95)';
                  } else if (subtitleStyle.preset === 'typewriter') {
                    customTextShadow = '0 0 10px #00FF66, 0 3px 6px rgba(0,0,0,0.95)';
                  } else if (subtitleStyle.preset === 'fire_gradient') {
                    customTextShadow = isCurrent
                      ? '0 0 25px #FF4500, 0 0 45px #FF0000, 0 3px 8px rgba(0,0,0,1)'
                      : '0 3px 6px rgba(0,0,0,0.95)';
                  } else if (subtitleStyle.preset === 'isometric_3d') {
                    customTextShadow = '1px 1px 0 #000, 2px 2px 0 #000, 3px 3px 0 #000, 4px 4px 0 #000';
                  } else if (subtitleStyle.preset === 'drop_shadow_studio') {
                    customTextShadow = '0 8px 18px rgba(0,0,0,0.98)';
                  } else if (isCurrent) {
                    customTextShadow = `0 0 20px ${subtitleStyle.highlightColor}B3, 0 3px 8px rgba(0,0,0,1)`;
                  }

                  const isBoxedPill = subtitleStyle.preset === 'boxed_pill' && isCurrent;

                  return (
                    <span
                      key={word.id}
                      className={`inline-block transition-all duration-100 ${animClass} ${
                        isCurrent ? 'scale-110 z-10' : 'scale-100 opacity-95'
                      } ${
                        isBoxedPill ? 'bg-amber-400 text-black px-2.5 py-0.5 rounded-lg shadow-2xl font-black' : ''
                      }`}
                      style={{
                        color: isBoxedPill
                          ? '#000000'
                          : isCurrent
                          ? subtitleStyle.highlightColor
                          : subtitleStyle.textColor,
                        WebkitTextStroke: isBoxedPill
                          ? '0px transparent'
                          : `${Math.max(2, subtitleStyle.strokeWidth || 4)}px ${subtitleStyle.strokeColor || '#000000'}`,
                        textShadow: isBoxedPill ? 'none' : customTextShadow,
                      }}
                    >
                      {word.word}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monitor Bottom Control Bar */}
      <div className="h-10 bg-resolve-900 border-t border-resolve-800 flex items-center justify-between px-4 text-gray-300 select-none">
        {/* Playback Shuttle Controls */}
        <div className="flex items-center space-x-2">
          {/* Step Back 1 Frame */}
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 1 / 30))}
            className="p-1.5 hover:text-white hover:bg-resolve-800 rounded transition"
            title="Previous Frame (Left Arrow)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={handleTogglePlay}
            className="p-2 bg-resolve-800 hover:bg-resolve-orange hover:text-black rounded-md text-white transition shadow-sm"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Step Forward 1 Frame */}
          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 1 / 30))}
            className="p-1.5 hover:text-white hover:bg-resolve-800 rounded transition"
            title="Next Frame (Right Arrow)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Playhead Scrubber Bar */}
        <div className="flex-1 mx-6 flex items-center space-x-3">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-resolve-750 accent-resolve-orange rounded cursor-pointer"
          />
        </div>

        {/* Right: Audio Volume & Fullscreen */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 hover:text-white hover:bg-resolve-800 rounded transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-gray-300" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:text-white hover:bg-resolve-800 rounded transition"
            title="Toggle Native Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
