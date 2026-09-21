import React, { useEffect, useRef, useState } from 'react';
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
  Activity
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

  // Precision Responsive Viewport Rectangle (Exact Letterbox/Pillarbox Bounding Box)
  const viewportRect = useVideoViewport(stageContainerRef, aspectRatio);

  // Active clip at current time
  const activeClip = clips.find(
    (c) => c.trackId === 'v1' && currentTime >= c.start && currentTime < c.end
  ) || clips.find(
    (c) => currentTime >= c.start && currentTime < c.end
  );

  // Subscribe to Web Audio Engine unlock state
  useEffect(() => {
    return audioEngine.onUnlockChange(setIsAudioUnlocked);
  }, []);

  // Sync master volume with Web Audio Engine
  useEffect(() => {
    audioEngine.setMasterVolume(isMuted ? 0 : 1.0, isMuted);
  }, [isMuted]);

  // Connect media elements to Web Audio Engine on mount / ref availability
  useEffect(() => {
    if (videoRef.current) {
      audioEngine.connectMediaElement(videoRef.current);
    }
    if (audioRef.current) {
      audioEngine.connectMediaElement(audioRef.current);
    }
  }, [videoUrl, audioUrl]);

  // Live VU Meter Polling Loop (only when playing)
  useEffect(() => {
    if (!isPlaying) {
      setVuLevels({ left: 0, right: 0 });
      return;
    }

    let rafId: number;
    const pollVU = () => {
      const { left, right } = audioEngine.getPeakLevels();
      setVuLevels({ left, right });
      rafId = requestAnimationFrame(pollVU);
    };
    rafId = requestAnimationFrame(pollVU);

    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  // Sync video element with external playback state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {
        // Autoplay policy prevented playback, unlock required
        setIsAudioUnlocked(false);
      });
    } else if (!isPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Frame-accurate seek synchronization (<0.04s threshold prevents jitter while maintaining frame sync)
  useEffect(() => {
    if (!videoRef.current) return;
    if (Math.abs(videoRef.current.currentTime - currentTime) > 0.04) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Sync secondary audio element with external playback state
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying && audioRef.current.paused) {
      audioRef.current.play().catch(() => {
        setIsAudioUnlocked(false);
      });
    } else if (!isPlaying && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [isPlaying, audioUrl]);

  // Sync audio seek time
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    if (Math.abs(audioRef.current.currentTime - currentTime) > 0.04) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, audioUrl]);

  // Image montage playback driver (ticks playhead smoothly if active media is an image sequence)
  useEffect(() => {
    if (!isPlaying) return;
    const isImagePlaying = activeClip?.type === 'image' || (!videoUrl && clips.length > 0);
    if (!isImagePlaying) return;

    const timer = setInterval(() => {
      const nextTime = currentTime + 0.033;
      if (nextTime >= duration) {
        onSeek(0);
        onPlayPause();
      } else {
        onSeek(nextTime);
      }
    }, 33);

    return () => clearInterval(timer);
  }, [isPlaying, currentTime, duration, activeClip, videoUrl, clips, onSeek, onPlayPause]);

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

  // Motion Transitions dynamic offsets
  let transScale = 1.0;
  let transPosX = 0;
  let transRot = 0;
  if (activeTransition) {
    if (activeTransition.type === 'zoom_blur') {
      transScale = 1.0 + Math.sin(transProgress * Math.PI) * 0.35;
    } else if (activeTransition.type === 'whip_pan') {
      transPosX = (transProgress - 0.5) * 350;
    } else if (activeTransition.type === 'spin') {
      transRot = transProgress * 360;
    }
  }

  const finalScale = transform.scale * transScale;
  const finalPosX = transform.positionX + shakeX + transPosX;
  const finalPosY = transform.positionY + shakeY;
  const finalRot = transform.rotation + transRot;

  let extraFilters = '';
  if (glow) {
    extraFilters += ` drop-shadow(0 0 ${(glow.intensity / 6).toFixed(1)}px rgba(255,255,255,0.7))`;
  }
  const videoFilterStyle = `contrast(${contrast}) saturate(${saturation}) brightness(${brightness}) sepia(${sepia}) hue-rotate(${hueRotate}deg)${extraFilters}`;

  // Find active subtitle words at current time
  const currentWords = subtitles.filter(
    (w) => currentTime >= w.start - 0.1 && currentTime <= w.end + 0.3
  );
  const activeWord = subtitles.find(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

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

      {/* Main Viewport Stage: Dynamic Letterbox & Pillarbox Presentation */}
      <div
        ref={stageContainerRef}
        className="flex-1 flex items-center justify-center p-2 relative bg-[#070709] overflow-hidden"
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
          {/* Audio BGM Track (Secondary Audio Channel) */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              muted={isMuted}
            />
          )}

          {/* Visual Surface: Photo Slide or Video Surface */}
          {activeClip?.type === 'image' && activeClip?.imageUrl ? (
            <img
              src={activeClip.imageUrl}
              alt={activeClip.name}
              className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-100"
              style={{
                filter: videoFilterStyle,
                transform: `scale(${finalScale * (1.0 + ((currentTime - activeClip.start) / Math.max(0.1, activeClip.end - activeClip.start)) * 0.08)}) translate(${finalPosX}px, ${finalPosY}px) rotate(${finalRot}deg)`,
                opacity: transform.opacity,
              }}
            />
          ) : (
            <video
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
              onTimeUpdate={(e) => onSeek(e.currentTarget.currentTime)}
              onEnded={() => onPlayPause()}
            />
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

          {activeTransition?.type === 'film_burn' && (
            <div
              className="absolute inset-0 pointer-events-none z-30 mix-blend-screen"
              style={{
                background: 'radial-gradient(circle at 40% 50%, rgba(255,140,0,0.9) 0%, rgba(255,40,0,0.5) 45%, transparent 80%)',
                opacity: Math.sin(transProgress * Math.PI),
              }}
            />
          )}

          {activeTransition?.type === 'glitch' && (
            <div
              className="absolute inset-0 pointer-events-none z-30 mix-blend-difference opacity-75"
              style={{
                background: 'repeating-linear-gradient(0deg, rgba(0,255,255,0.6) 0px, transparent 2px, rgba(255,0,128,0.6) 4px, transparent 6px)',
                transform: `translateX(${Math.sin(currentTime * 80) * 18}px)`,
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

          {/* DYNAMIC SUBTITLES OVERLAY */}
          {currentWords.length > 0 && (
            <div
              className="absolute left-0 right-0 flex justify-center items-center pointer-events-none z-30 px-4"
              style={{ bottom: `${subtitleStyle.positionY}%` }}
            >
              <div
                className={`flex flex-wrap justify-center items-center gap-1.5 font-bold tracking-wide transition-all ${
                  subtitleStyle.textCase === 'uppercase' ? 'uppercase' : ''
                }`}
                style={{
                  fontFamily: subtitleStyle.fontFamily,
                  fontSize: `${Math.max(16, Math.min(36, viewportRect.width / 22))}px`,
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

                  return (
                    <span
                      key={word.id}
                      className={`transition-colors duration-75 ${animClass}`}
                      style={{
                        color: isCurrent ? subtitleStyle.highlightColor : subtitleStyle.textColor,
                        WebkitTextStroke: `${subtitleStyle.strokeWidth}px ${subtitleStyle.strokeColor}`,
                        textShadow: isCurrent
                          ? `0 0 12px ${subtitleStyle.highlightColor}66, 0 2px 4px rgba(0,0,0,0.9)`
                          : '0 2px 4px rgba(0,0,0,0.9)',
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
            onClick={onPlayPause}
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
