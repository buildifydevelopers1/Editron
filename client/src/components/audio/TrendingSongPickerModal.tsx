import React, { useRef, useState } from 'react';
import {
  X,
  Music,
  Play,
  Pause,
  Flame,
  Zap,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { TrendingSong } from '../../types';
import { resolveAssetUrl } from '../../services/api';

interface TrendingSongPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  songs: TrendingSong[];
  onSelectSong: (song: TrendingSong) => void;
  isApplying: boolean;
}

export const TrendingSongPickerModal: React.FC<TrendingSongPickerModalProps> = ({
  isOpen,
  onClose,
  query,
  songs,
  onSelectSong,
  isApplying,
}) => {
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleTogglePlay = (song: TrendingSong) => {
    if (playingSongId === song.id) {
      // Pause
      if (audioRef.current) audioRef.current.pause();
      setPlayingSongId(null);
    } else {
      // Play new
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const soundUrl = resolveAssetUrl(song.audioUrl || `/uploads/${song.audioFileName}`);
      const audio = new Audio(soundUrl);
      audioRef.current = audio;
      audio.play().catch((err) => console.warn('Preview play warning:', err));
      audio.onended = () => setPlayingSongId(null);
      setPlayingSongId(song.id);
    }
  };

  const handleSelect = (song: TrendingSong) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingSongId(null);
    onSelectSong(song);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-resolve-900 border border-resolve-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-resolve-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Flame className="w-4 h-4 text-black fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>HUMAN-IN-THE-LOOP: TRENDING AUDIO SELECTION</span>
              </h2>
              <p className="text-xs text-gray-400">
                Found Top 3 viral tracks for <span className="text-resolve-orange font-semibold">"{query}"</span>. Pick your favorite:
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              onClose();
            }}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-resolve-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top 3 Songs Cards */}
        <div className="space-y-3">
          {songs.map((song, idx) => {
            const isPlaying = playingSongId === song.id;

            return (
              <div
                key={song.id}
                className="bg-resolve-950 border border-resolve-800 hover:border-resolve-orange/70 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-4 transition group shadow-md"
              >
                {/* Left: Thumbnail & Song Info */}
                <div className="flex items-center space-x-3.5 w-full md:w-auto">
                  {/* Rank Badge & Play Button */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-resolve-800 shadow">
                    <img
                      src={song.thumbnailUrl}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <button
                      onClick={() => handleTogglePlay(song)}
                      className="absolute inset-0 bg-black/50 hover:bg-black/30 flex items-center justify-center transition text-white"
                      title={isPlaying ? 'Pause Audio Preview' : 'Play Audio Preview'}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-current text-resolve-orange" />
                      ) : (
                        <Play className="w-5 h-5 fill-current text-white ml-0.5" />
                      )}
                    </button>
                    {/* Rank 1, 2, 3 */}
                    <div className="absolute top-0 left-0 bg-resolve-orange text-black font-extrabold text-[9px] px-1 rounded-br">
                      #{idx + 1}
                    </div>
                  </div>

                  {/* Song Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-white truncate">{song.title}</h4>
                      <span className="text-[10px] bg-pink-500/20 text-pink-400 border border-pink-500/30 px-1.5 py-0.5 rounded font-mono shrink-0">
                        {song.vibe}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 font-mono mt-0.5 flex items-center space-x-2">
                      <span>{song.artist}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">{song.trendScore}</span>
                    </div>

                    <p className="text-[11px] text-gray-500 truncate mt-1">
                      {song.description}
                    </p>
                  </div>
                </div>

                {/* Right: Technical Stats & Select Action */}
                <div className="flex items-center space-x-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right font-mono text-[10px] text-gray-400 hidden md:block">
                    <div>{song.bpm} BPM</div>
                    <div className="text-resolve-orange">Drop: {song.dropTime}s</div>
                  </div>

                  <button
                    onClick={() => handleSelect(song)}
                    disabled={isApplying}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-resolve-orange to-amber-500 hover:from-resolve-orange-hover hover:to-amber-400 text-black font-extrabold px-4 py-2 rounded-lg text-xs transition shadow-md disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Select & Create Reel</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-resolve-800 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center space-x-1 font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-resolve-orange" />
            <span>Editron will sync cuts to bass drop, apply 9:16 vertical crop, & grade colors.</span>
          </span>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              onClose();
            }}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
