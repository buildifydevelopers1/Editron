import React, { useRef, useState } from 'react';
import {
  Scissors,
  MousePointer,
  Trash2,
  Magnet,
  ZoomIn,
  ZoomOut,
  Volume2,
  Eye,
  Lock,
  Plus,
  SplitSquareVertical
} from 'lucide-react';
import { SubtitleWord, VideoClip, VideoTransition } from '../../types';

interface TimelineProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  clips: VideoClip[];
  onClipsChange: (clips: VideoClip[]) => void;
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  subtitles: SubtitleWord[];
  transitions?: VideoTransition[];
  onRemoveTransition?: (id: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  onSeek,
  clips,
  onClipsChange,
  selectedClipId,
  onSelectClip,
  subtitles,
  transitions = [],
  onRemoveTransition,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1); // 0.5 to 3
  const [snapping, setSnapping] = useState(true);
  const [activeTool, setActiveTool] = useState<'select' | 'razor'>('select');
  const trackContainerRef = useRef<HTMLDivElement>(null);

  // Pixels per second based on zoom level
  const pxPerSec = 45 * zoomLevel;
  const totalWidthPx = Math.max(1200, duration * pxPerSec);

  // Playhead scrub handler
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackContainerRef.current) return;
    const rect = trackContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + trackContainerRef.current.scrollLeft;
    let targetTime = Math.max(0, Math.min(duration, clickX / pxPerSec));

    // Snapping logic to clip edges
    if (snapping) {
      clips.forEach((c) => {
        if (Math.abs(c.start - targetTime) < 0.2) targetTime = c.start;
        if (Math.abs(c.end - targetTime) < 0.2) targetTime = c.end;
      });
    }

    onSeek(targetTime);
  };

  // Razor split tool at current playhead
  const splitClipAtPlayhead = () => {
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
      color: clipToSplit.color,
    };

    const updated = clips.filter((c) => c.id !== clipToSplit.id).concat([firstHalf, secondHalf]);
    onClipsChange(updated);
    onSelectClip(secondHalf.id);
  };

  // Delete selected clip
  const deleteSelectedClip = () => {
    if (!selectedClipId) return;
    onClipsChange(clips.filter((c) => c.id !== selectedClipId));
    onSelectClip(null);
  };

  // Format ruler seconds to DaVinci timestamp
  const formatRulerTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Generate ruler tick marks
  const renderRulerTicks = () => {
    const ticks = [];
    const step = zoomLevel > 1.5 ? 1 : 2; // every 1 or 2 seconds
    for (let s = 0; s <= duration + 5; s += step) {
      const left = s * pxPerSec;
      ticks.push(
        <div
          key={s}
          className="absolute top-0 bottom-0 border-l border-resolve-700/60 flex flex-col justify-between"
          style={{ left: `${left}px` }}
        >
          <span className="text-[10px] text-gray-400 pl-1 font-mono">{formatRulerTime(s)}</span>
          <div className="h-1.5 w-px bg-resolve-600" />
        </div>
      );
    }
    return ticks;
  };

  return (
    <div className="h-64 bg-resolve-900 border-t border-resolve-800 flex flex-col select-none relative z-10">
      {/* Timeline Toolbar */}
      <div className="h-8 bg-resolve-850 border-b border-resolve-800 flex items-center justify-between px-3 text-xs text-gray-400">
        {/* Tool Selector */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setActiveTool('select')}
            className={`p-1.5 rounded transition ${
              activeTool === 'select'
                ? 'bg-resolve-750 text-resolve-orange border border-resolve-700'
                : 'hover:text-gray-200 hover:bg-resolve-800'
            }`}
            title="Selection Tool (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setActiveTool('razor');
              splitClipAtPlayhead();
            }}
            className={`p-1.5 rounded transition ${
              activeTool === 'razor'
                ? 'bg-resolve-750 text-resolve-orange border border-resolve-700'
                : 'hover:text-gray-200 hover:bg-resolve-800'
            }`}
            title="Blade / Razor Tool (C) - Split at Playhead"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={splitClipAtPlayhead}
            className="flex items-center space-x-1 px-2 py-1 hover:bg-resolve-800 hover:text-white rounded transition text-[11px] font-mono border border-resolve-800"
            title="Split Clip at Playhead (Ctrl+B / C)"
          >
            <SplitSquareVertical className="w-3 h-3 text-resolve-cyan" />
            <span>Split</span>
          </button>

          <button
            onClick={deleteSelectedClip}
            disabled={!selectedClipId}
            className="p-1.5 hover:text-red-400 hover:bg-resolve-800 rounded transition disabled:opacity-40"
            title="Delete Selected Clip (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-resolve-700 mx-1" />

          {/* Snapping */}
          <button
            onClick={() => setSnapping(!snapping)}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition text-[11px] ${
              snapping ? 'text-resolve-orange bg-resolve-orange/10 border border-resolve-orange/30' : 'text-gray-500'
            }`}
            title="Magnetic Snapping (N)"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>Snap</span>
          </button>
        </div>

        {/* Zoom Slider */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.2))}
            className="p-1 hover:text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min={0.4}
            max={2.5}
            step={0.1}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-24 h-1 bg-resolve-700 accent-resolve-orange"
          />
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
            className="p-1 hover:text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Track Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers (Fixed Left Column) */}
        <div className="w-36 bg-resolve-900 border-r border-resolve-800 flex flex-col select-none z-20 shadow-md">
          {/* Top ruler spacer */}
          <div className="h-7 bg-resolve-850 border-b border-resolve-800 px-2 flex items-center text-[10px] text-gray-500 font-mono">
            TRACKS
          </div>

          {/* V2 Header */}
          <div className="h-12 bg-resolve-900 border-b border-resolve-800/80 px-2 flex items-center justify-between text-xs">
            <span className="font-bold text-gray-300 font-mono">V2</span>
            <div className="flex items-center space-x-1 text-gray-500">
              <Eye className="w-3 h-3 hover:text-gray-200 cursor-pointer" />
              <Lock className="w-3 h-3 hover:text-gray-200 cursor-pointer" />
            </div>
          </div>

          {/* V1 Header */}
          <div className="h-14 bg-resolve-900 border-b border-resolve-800/80 px-2 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-resolve-orange font-mono">V1</span>
              <span className="text-[10px] text-gray-500">Video</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <Eye className="w-3 h-3 hover:text-gray-200 cursor-pointer text-resolve-orange" />
              <Lock className="w-3 h-3 hover:text-gray-200 cursor-pointer" />
            </div>
          </div>

          {/* S1 Subtitle Header */}
          <div className="h-11 bg-resolve-900 border-b border-resolve-800/80 px-2 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-amber-400 font-mono">S1</span>
              <span className="text-[10px] text-gray-500">Subtitles</span>
            </div>
            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded">AI</span>
          </div>

          {/* A1 Audio Header */}
          <div className="h-12 bg-resolve-900 border-b border-resolve-800/80 px-2 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-cyan-400 font-mono">A1</span>
              <span className="text-[10px] text-gray-500">Audio</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <Volume2 className="w-3 h-3 hover:text-gray-200 cursor-pointer text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Scrollable Tracks Canvas */}
        <div
          ref={trackContainerRef}
          onClick={handleTimelineClick}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#111114] cursor-pointer"
        >
          <div
            className="h-full relative"
            style={{ width: `${totalWidthPx}px` }}
          >
            {/* Time Ruler */}
            <div className="h-7 bg-resolve-850/90 border-b border-resolve-800 relative select-none">
              {renderRulerTicks()}
            </div>

            {/* Red Playhead Vertical Line */}
            <div
              className="absolute top-0 bottom-0 z-30 pointer-events-none transition-transform duration-75"
              style={{
                left: `${currentTime * pxPerSec}px`,
              }}
            >
              {/* Playhead marker cap */}
              <div className="w-3 h-3 bg-red-500 -ml-1.5 rotate-45 rounded-sm shadow-md" />
              <div className="w-0.5 h-full bg-red-500 shadow-sm" />
            </div>

            {/* Track Lanes */}
            <div className="flex flex-col">
              {/* V2 Track Lane (Overlays / B-roll) */}
              <div className="h-12 border-b border-resolve-800/60 relative bg-resolve-950/20">
                {/* Overlay placeholder or B-roll */}
              </div>

              {/* V1 Track Lane (Main Video Clips) */}
              <div className="h-14 border-b border-resolve-800/60 relative bg-resolve-950/40">
                {clips.map((clip) => {
                  const left = clip.start * pxPerSec;
                  const width = Math.max(10, (clip.end - clip.start) * pxPerSec);
                  const isSelected = selectedClipId === clip.id;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClip(clip.id);
                      }}
                      className={`absolute top-1 bottom-1 rounded border flex flex-col justify-between px-2 py-1 transition-shadow overflow-hidden group cursor-grab active:cursor-grabbing ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-600/90 to-amber-600/90 border-resolve-orange shadow-lg shadow-orange-500/20 ring-1 ring-resolve-orange text-white'
                          : 'bg-gradient-to-r from-blue-700/80 to-indigo-700/80 border-blue-500/60 text-gray-200 hover:border-blue-400'
                      }`}
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                      }}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold truncate">
                        <span className="truncate">{clip.name}</span>
                        <span className="text-[10px] opacity-75 font-mono ml-1">
                          {(clip.end - clip.start).toFixed(1)}s
                        </span>
                      </div>

                      {/* Trimming Handles */}
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 opacity-0 group-hover:opacity-100 cursor-ew-resize" />
                      <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/20 opacity-0 group-hover:opacity-100 cursor-ew-resize" />
                    </div>
                  );
                })}

                {/* Transition Markers between clips */}
                {transitions.map((tr) => {
                  const left = (tr.timestamp - tr.duration / 2) * pxPerSec;
                  const width = Math.max(24, tr.duration * pxPerSec);
                  return (
                    <div
                      key={tr.id}
                      className="absolute top-1 bottom-1 bg-amber-500/30 border border-resolve-orange rounded flex items-center justify-between px-1.5 z-20 backdrop-blur-[1px] shadow hover:bg-amber-500/50 transition cursor-pointer"
                      style={{ left: `${left}px`, width: `${width}px` }}
                      title={`${tr.name} (${tr.duration}s at ${tr.timestamp.toFixed(1)}s)`}
                    >
                      <span className="text-[9px] font-bold text-amber-300 truncate font-mono">
                        ⚡ {tr.name}
                      </span>
                      {onRemoveTransition && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveTransition(tr.id);
                          }}
                          className="text-gray-400 hover:text-red-400 ml-1 text-xs font-bold"
                          title="Remove Transition"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* S1 Track Lane (AI Subtitles) */}
              <div className="h-11 border-b border-resolve-800/60 relative bg-amber-950/10 flex items-center">
                {subtitles.map((sub) => {
                  const left = sub.start * pxPerSec;
                  const width = Math.max(8, (sub.end - sub.start) * pxPerSec);
                  const isCurrent = currentTime >= sub.start && currentTime <= sub.end;

                  return (
                    <div
                      key={sub.id}
                      className={`absolute h-7 rounded px-1.5 flex items-center justify-center text-[10px] font-bold border transition-colors truncate ${
                        isCurrent
                          ? 'bg-amber-400 text-black border-yellow-200 shadow-sm shadow-yellow-500/30'
                          : 'bg-amber-900/60 text-amber-200 border-amber-700/60'
                      }`}
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                      }}
                      title={`${sub.word} (${sub.start.toFixed(1)}s - ${sub.end.toFixed(1)}s)`}
                    >
                      <span className="truncate">{sub.word}</span>
                    </div>
                  );
                })}
              </div>

              {/* A1 Track Lane (Main Audio Waveform) */}
              <div className="h-12 border-b border-resolve-800/60 relative bg-cyan-950/10 flex items-center px-2">
                <div
                  className="h-8 rounded bg-cyan-900/40 border border-cyan-600/40 relative flex items-center px-2 overflow-hidden"
                  style={{ width: `${duration * pxPerSec}px` }}
                >
                  {/* Simulated Audio Waveform Peaks */}
                  <div className="w-full flex items-center space-x-0.5 h-full opacity-60">
                    {Array.from({ length: Math.floor((duration * pxPerSec) / 4) }).map((_, i) => {
                      const h = 20 + Math.sin(i * 0.4) * 40 + (i % 3) * 15;
                      return (
                        <div
                          key={i}
                          className="w-0.5 bg-cyan-400/80 rounded-full"
                          style={{ height: `${Math.min(90, Math.max(15, h))}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
