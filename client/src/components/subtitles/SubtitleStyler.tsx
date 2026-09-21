import React from 'react';
import {
  Subtitles,
  Sparkles,
  Type,
  Palette,
  Layers,
  MoveVertical,
  Play,
  Download
} from 'lucide-react';
import { SubtitleStyle, SubtitleWord } from '../../types';

import { ALL_SUBTITLE_PRESETS } from './SubtitleStyleGalleryModal';

interface SubtitleStylerProps {
  style: SubtitleStyle;
  onChange: (style: SubtitleStyle) => void;
  subtitles: SubtitleWord[];
  onSubtitlesChange: (words: SubtitleWord[]) => void;
  currentTime: number;
  onSeek: (time: number) => void;
}

export const SubtitleStyler: React.FC<SubtitleStylerProps> = ({
  style,
  onChange,
  subtitles,
  onSubtitlesChange,
  currentTime,
  onSeek,
}) => {
  const presets = ALL_SUBTITLE_PRESETS;

  const handleWordEdit = (id: string, newText: string) => {
    onSubtitlesChange(
      subtitles.map((w) => (w.id === id ? { ...w, word: newText } : w))
    );
  };

  const exportSRT = () => {
    if (subtitles.length === 0) return;
    let srt = '';
    const groupSize = 4;
    let index = 1;
    for (let i = 0; i < subtitles.length; i += groupSize) {
      const chunk = subtitles.slice(i, i + groupSize);
      const start = chunk[0].start;
      const end = chunk[chunk.length - 1].end;
      const text = chunk.map((w) => w.word).join(' ');

      const fmt = (s: number) => {
        const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
        const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.floor(s % 60).toString().padStart(2, '0');
        const ms = Math.floor((s % 1) * 1000).toString().padStart(3, '0');
        return `${hrs}:${mins}:${secs},${ms}`;
      };

      srt += `${index++}\n${fmt(start)} --> ${fmt(end)}\n${text}\n\n`;
    }

    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportVTT = () => {
    if (subtitles.length === 0) return;
    let vtt = 'WEBVTT\n\n';
    const groupSize = 4;
    for (let i = 0; i < subtitles.length; i += groupSize) {
      const chunk = subtitles.slice(i, i + groupSize);
      const start = chunk[0].start;
      const end = chunk[chunk.length - 1].end;
      const text = chunk.map((w) => w.word).join(' ');

      const fmt = (s: number) => {
        const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
        const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.floor(s % 60).toString().padStart(2, '0');
        const ms = Math.floor((s % 1) * 1000).toString().padStart(3, '0');
        return `${hrs}:${mins}:${secs}.${ms}`;
      };

      vtt += `${fmt(start)} --> ${fmt(end)}\n${text}\n\n`;
    }

    const blob = new Blob([vtt], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.vtt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-resolve-950 overflow-hidden select-none">
      {/* Left Column: Style Customizer */}
      <div className="w-full md:w-80 bg-resolve-900 border-r border-resolve-800 p-4 flex flex-col space-y-4 overflow-y-auto">
        <div className="flex items-center space-x-2 pb-2 border-b border-resolve-800">
          <Subtitles className="w-4 h-4 text-resolve-orange" />
          <span className="font-bold text-gray-200 text-sm">SUBTITLE ENGINE</span>
        </div>

        {/* Style Presets */}
        <div className="flex flex-col space-y-2">
          <label className="text-[11px] text-gray-400 font-mono flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-resolve-orange" />
            <span>VIRAL PRESETS</span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => onChange({ ...style, ...p.style })}
                className={`px-2.5 py-1.5 rounded text-[11px] font-semibold text-left transition border truncate ${
                  style.preset === p.id
                    ? 'bg-resolve-orange text-black border-resolve-orange shadow-md shadow-orange-500/20'
                    : 'bg-resolve-850 text-gray-300 border-resolve-750 hover:border-resolve-700'
                }`}
                title={p.description}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size & Position Sliders */}
        <div className="bg-resolve-850 border border-resolve-800 rounded-lg p-3 space-y-3">
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>FONT SIZE</span>
              <span className="text-resolve-orange">{style.fontSize}px</span>
            </div>
            <input
              type="range"
              min={18}
              max={64}
              value={style.fontSize}
              onChange={(e) => onChange({ ...style, fontSize: parseInt(e.target.value) })}
              className="w-full h-1 bg-resolve-750 accent-resolve-orange"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>VERTICAL POSITION</span>
              <span className="text-resolve-cyan">{style.positionY || 16}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={style.positionY || 16}
              onChange={(e) => onChange({ ...style, positionY: parseInt(e.target.value) })}
              className="w-full h-1 bg-resolve-750 accent-resolve-cyan"
            />
          </div>
        </div>

        {/* Colors: Text & Active Word Highlight */}
        <div className="bg-resolve-850 border border-resolve-800 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300 font-mono">ACTIVE HIGHLIGHT</span>
            <input
              type="color"
              value={style.highlightColor}
              onChange={(e) => onChange({ ...style, highlightColor: e.target.value })}
              className="w-7 h-7 rounded border border-resolve-700 cursor-pointer bg-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300 font-mono">BASE TEXT COLOR</span>
            <input
              type="color"
              value={style.textColor}
              onChange={(e) => onChange({ ...style, textColor: e.target.value })}
              className="w-7 h-7 rounded border border-resolve-700 cursor-pointer bg-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300 font-mono">OUTLINE / STROKE</span>
            <input
              type="color"
              value={style.strokeColor}
              onChange={(e) => onChange({ ...style, strokeColor: e.target.value })}
              className="w-7 h-7 rounded border border-resolve-700 cursor-pointer bg-transparent"
            />
          </div>
        </div>

        {/* Uppercase & Animation Toggles */}
        <div className="flex items-center justify-between bg-resolve-850 border border-resolve-800 rounded-lg p-3">
          <span className="text-xs text-gray-300 font-mono">UPPERCASE</span>
          <button
            onClick={() =>
              onChange({
                ...style,
                textCase: style.textCase === 'uppercase' ? 'normal' : 'uppercase',
              })
            }
            className={`px-2.5 py-1 rounded text-xs font-bold transition border ${
              style.textCase === 'uppercase'
                ? 'bg-resolve-orange text-black border-resolve-orange'
                : 'bg-resolve-800 text-gray-400 border-resolve-700'
            }`}
          >
            {style.textCase === 'uppercase' ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Right Column: Live Interactive Word Transcript */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-resolve-800">
          <div>
            <h3 className="font-bold text-gray-200 text-sm">INTERACTIVE WORD TIMINGS</h3>
            <p className="text-xs text-gray-500">
              Click any word to seek playhead directly. Edit words inline.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-gray-400 bg-resolve-900 px-2 py-1 rounded border border-resolve-800">
              {subtitles.length} words detected
            </span>
            {subtitles.length > 0 && (
              <>
                <button
                  onClick={exportSRT}
                  title="Export standard SRT subtitle file"
                  className="flex items-center space-x-1 px-2 py-1 text-xs font-semibold bg-resolve-800 hover:bg-resolve-700 text-gray-200 rounded border border-resolve-700 transition"
                >
                  <Download className="w-3 h-3 text-resolve-orange" />
                  <span>.SRT</span>
                </button>
                <button
                  onClick={exportVTT}
                  title="Export WebVTT subtitle file"
                  className="flex items-center space-x-1 px-2 py-1 text-xs font-semibold bg-resolve-800 hover:bg-resolve-700 text-gray-200 rounded border border-resolve-700 transition"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>.VTT</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Word Grid / Stream */}
        <div className="flex-1 overflow-y-auto mt-3 pr-2 flex flex-wrap gap-2 content-start">
          {subtitles.length === 0 ? (
            <div className="w-full h-48 flex flex-col items-center justify-center text-gray-500">
              <Subtitles className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No transcript loaded yet.</p>
              <p className="text-xs text-gray-600 mt-1">
                Upload a video or click "Generate Subtitles" via the AI prompt bar!
              </p>
            </div>
          ) : (
            subtitles.map((sub) => {
              const isCurrent = currentTime >= sub.start && currentTime <= sub.end;

              return (
                <div
                  key={sub.id}
                  onClick={() => onSeek(sub.start)}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded border text-xs cursor-pointer transition ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400 shadow-sm'
                      : 'bg-resolve-900 border-resolve-800 text-gray-300 hover:border-resolve-700 hover:text-white'
                  }`}
                >
                  <Play className="w-2.5 h-2.5 opacity-60 mr-0.5" />
                  <input
                    type="text"
                    value={sub.word}
                    onChange={(e) => handleWordEdit(sub.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-inherit font-semibold outline-none w-auto max-w-[120px]"
                  />
                  <span className="text-[10px] text-gray-500 font-mono ml-1">
                    {sub.start.toFixed(1)}s
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
