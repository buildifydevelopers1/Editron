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
  Tv
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active clip at current time
  const activeClip = clips.find(
    (c) => c.trackId === 'v1' && currentTime >= c.start && currentTime < c.end
  ) || clips.find(
    (c) => currentTime >= c.start && currentTime < c.end
  );

  // Sync video element with external playback state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else if (!isPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Sync seek time if difference exceeds threshold (prevent micro-jitter)
  useEffect(() => {
    if (!videoRef.current) return;
    if (Math.abs(videoRef.current.currentTime - currentTime) > 0.25) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Sync audio element with external playback state
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else if (!isPlaying && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [isPlaying, audioUrl]);

  // Sync audio seek time
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    if (Math.abs(audioRef.current.currentTime - currentTime) > 0.25) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, audioUrl]);

  // If playing an image montage or active clip is an image, tick playhead timer
  useEffect(() => {
    if (!isPlaying) return;
    const isImagePlaying = activeClip?.type === 'image' || (!videoUrl && clips.length > 0);
    if (!isImagePlaying) return;

    const timer = setInterval(() => {
      const nextTime = currentTime + 0.05;
      if (nextTime >= duration) {
        onSeek(0);
        onPlayPause();
      } else {
        onSeek(nextTime);
      }
    }, 50);

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
  
  // Temperature & Tint simulation
  const temp = colorGrading.temperature;
  const sepia = temp > 0 ? (temp / 200) : 0;
  const hueRotate = colorGrading.tint * 0.7; // slight green-magenta rotation

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

  // Group of words around active time (3-5 words context)
  const activeWord = subtitles.find(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Determine container aspect ratio class
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[75vh]';
      case '1:1':
        return 'aspect-square max-h-[75vh]';
      case '4:5':
        return 'aspect-[4/5] max-h-[75vh]';
      case '2.39:1':
        return 'aspect-[2.39/1] max-h-[75vh]';
      case '16:9':
      default:
        return 'aspect-video max-h-[75vh]';
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-resolve-950 border-r border-resolve-800/80 relative overflow-hidden"
    >
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

        {/* Timecode HUD */}
        <div className="flex items-center space-x-3 font-mono">
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

      {/* Main Viewport Stage */}
      <div className="flex-1 flex items-center justify-center p-3 relative bg-[#09090b] overflow-hidden">
        <div
          className={`relative flex items-center justify-center transition-all duration-200 shadow-2xl rounded overflow-hidden border border-resolve-800 ${getAspectRatioClasses()}`}
          style={{ width: '100%' }}
        >
          {/* Audio BGM Track (if attitude reel or background music present) */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              muted={isMuted}
            />
          )}

          {/* Main Visual Surface: Photo Slide or Video */}
          {activeClip?.type === 'image' && activeClip?.imageUrl ? (
            <img
              src={activeClip.imageUrl}
              alt={activeClip.name}
              className="w-full h-full object-cover pointer-events-none transition-transform duration-100 select-none"
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
          {/* Dip to White (Camera Flash) */}
          {activeTransition?.type === 'dip_white' && (
            <div
              className="absolute inset-0 bg-white pointer-events-none z-30 transition-opacity"
              style={{ opacity: Math.max(0, 1 - Math.abs(transProgress - 0.5) * 2.2) }}
            />
          )}

          {/* Dip to Black */}
          {activeTransition?.type === 'dip_black' && (
            <div
              className="absolute inset-0 bg-black pointer-events-none z-30 transition-opacity"
              style={{ opacity: Math.max(0, 1 - Math.abs(transProgress - 0.5) * 2.2) }}
            />
          )}

          {/* Film Burn / Light Leak */}
          {activeTransition?.type === 'film_burn' && (
            <div
              className="absolute inset-0 pointer-events-none z-30 mix-blend-screen"
              style={{
                background: 'radial-gradient(circle at 40% 50%, rgba(255,140,0,0.9) 0%, rgba(255,40,0,0.5) 45%, transparent 80%)',
                opacity: Math.sin(transProgress * Math.PI),
              }}
            />
          )}

          {/* Cyber Glitch Tearing */}
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
          {/* Cinematic Vignette */}
          {vignette && (
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${vignette.intensity / 100}) 100%)`,
              }}
            />
          )}

          {/* 35mm Film Grain */}
          {grain && (
            <div
              className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 0)',
                backgroundSize: '3px 3px',
                opacity: grain.intensity / 150,
              }}
            />
          )}

          {/* Retro VHS Scanlines */}
          {vhs && (
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, transparent 1px, transparent 2px)',
                opacity: vhs.intensity / 100,
              }}
            />
          )}

          {/* 2.39:1 Cinema Letterbox Black Bars */}
          {letterbox && (
            <div className="absolute inset-0 pointer-events-none z-25 flex flex-col justify-between">
              <div className="w-full bg-black" style={{ height: `${(letterbox.intensity / 100) * 12}%` }} />
              <div className="w-full bg-black" style={{ height: `${(letterbox.intensity / 100) * 12}%` }} />
            </div>
          )}

          {/* RGB Split Chromatic Aberration Shadow */}
          {rgbSplit && (
            <div
              className="absolute inset-0 pointer-events-none z-20 mix-blend-screen"
              style={{
                boxShadow: `inset ${(rgbSplit.intensity / 8).toFixed(0)}px 0 0 rgba(255,0,0,0.6), inset -${(rgbSplit.intensity / 8).toFixed(0)}px 0 0 rgba(0,255,255,0.6)`,
              }}
            />
          )}

          {/* Safe Margins / Frame Overlays */}
          {showSafeZones && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* 90% Action Safe */}
              <div className="w-[90%] h-[90%] border border-cyan-500/30 border-dashed absolute" />
              {/* 80% Title Safe */}
              <div className="w-[80%] h-[80%] border border-amber-500/30 border-dashed absolute" />
              {/* Center Crosshair */}
              <div className="w-4 h-4 border-t border-l border-white/40 absolute" />
            </div>
          )}

          {/* Dynamic Subtitle Engine Overlay */}
          {subtitles.length > 0 && (
            <div
              className="absolute left-0 right-0 px-6 pointer-events-none flex flex-wrap justify-center items-center text-center transition-all z-20"
              style={{
                bottom: `${subtitleStyle.positionY || 16}%`,
              }}
            >
              {/* Render either current window of words or active segment */}
              {currentWords.length > 0 ? (
                <div
                  className={`inline-flex flex-wrap justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                    subtitleStyle.preset === 'boxed' ? 'bg-black/70 backdrop-blur-sm' : ''
                  }`}
                  style={{
                    fontFamily: subtitleStyle.fontFamily,
                    fontSize: `${subtitleStyle.fontSize}px`,
                    fontWeight: 900,
                    textTransform: subtitleStyle.textCase === 'uppercase' ? 'uppercase' : 'none',
                    letterSpacing: subtitleStyle.preset === 'hormozi' ? '0.04em' : 'normal',
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
              ) : null}
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
            title="Mute / Unmute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-gray-300" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:text-white hover:bg-resolve-800 rounded transition"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
