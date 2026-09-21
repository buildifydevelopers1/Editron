import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Music,
  Play,
  Pause,
  Flame,
  Zap,
  Sparkles,
  Search,
  Globe,
  Radio,
  Volume2,
  Clock,
  Disc3,
  Loader2
} from 'lucide-react';
import { TrendingSong } from '../../types';
import { resolveAssetUrl, searchTrendingSongs } from '../../services/api';

interface TrendingSongPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  query?: string;
  songs?: TrendingSong[];
  onSelectSong: (song: TrendingSong) => void;
  isApplying: boolean;
}

const GENRE_QUICK_SEARCHES = [
  { label: '🔥 Viral Reels', query: 'viral reels trending song' },
  { label: '⚡ Punjabi Attitude', query: 'Sidhu Moose Wala Shubh Punjabi Attitude' },
  { label: '🎧 Hindi Hip-Hop', query: 'Hindi rap hip hop King Badshah' },
  { label: '🌌 Phonk & Bass', query: 'Phonk drift bass' },
  { label: '☕ Lo-Fi Chill', query: 'lo-fi chill beats aesthetic' },
  { label: '🎬 Cinematic Epic', query: 'cinematic epic trailer orchestra' },
  { label: '✨ Pop & Synth', query: 'synthwave upbeat pop' },
];

export const TrendingSongPickerModal: React.FC<TrendingSongPickerModalProps> = ({
  isOpen,
  onClose,
  query = 'trending attitude hindi song',
  songs: initialSongs = [],
  onSelectSong,
  isApplying,
}) => {
  const [searchQuery, setSearchQuery] = useState(query);
  const [songList, setSongList] = useState<TrendingSong[]>(initialSongs);
  const [isLoading, setIsLoading] = useState(false);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync initial query and songs
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(query || 'trending attitude hindi song');
      if (initialSongs && initialSongs.length > 0) {
        setSongList(initialSongs);
      } else {
        performSearch(query || 'trending attitude hindi song');
      }
    }
  }, [isOpen, query]);

  // Clean up audio on close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const performSearch = async (term: string) => {
    if (!term.trim()) return;
    setIsLoading(true);
    try {
      const results = await searchTrendingSongs(term.trim());
      setSongList(results);
    } catch (err) {
      console.error('Failed to search live music:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

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
      const soundUrl = song.previewUrl || resolveAssetUrl(song.audioUrl || `/uploads/${song.audioFileName}`);
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

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingSongId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#161622] to-[#0d0d14] border border-cyan-500/20 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>LIVE INTERNET MUSIC & VIRAL AUDIO ENGINE</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                  LIVE STREAM
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Search global music catalogs, Apple CDN previews, & TikTok trending beats in real-time.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by song name, artist (e.g. Sidhu Moose Wala, The Weeknd, Drake), genre..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a10] border border-gray-700 focus:border-cyan-400 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-medium transition"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center space-x-2 shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Live</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Genre Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none text-xs">
          {GENRE_QUICK_SEARCHES.map((g) => (
            <button
              key={g.label}
              type="button"
              onClick={() => {
                setSearchQuery(g.query);
                performSearch(g.query);
              }}
              className="px-3 py-1 bg-gray-800/80 hover:bg-cyan-950/80 text-gray-300 hover:text-cyan-300 border border-gray-700 hover:border-cyan-500/50 rounded-lg whitespace-nowrap transition font-mono text-[11px]"
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Song Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[280px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-sm font-medium">Connecting to live internet music streams for "{searchQuery}"...</p>
            </div>
          ) : songList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 space-y-2">
              <Radio className="w-10 h-10 stroke-1" />
              <p className="text-sm font-medium">No live tracks found for this query.</p>
              <p className="text-xs text-gray-600">Try searching for an artist name, song title, or select a genre pill above.</p>
            </div>
          ) : (
            songList.map((song, idx) => {
              const isPlaying = playingSongId === song.id;

              return (
                <div
                  key={song.id || idx}
                  className={`border rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 transition group shadow-md ${
                    isPlaying
                      ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500/50'
                      : 'bg-[#0e0e17] border-gray-800/80 hover:border-cyan-500/40'
                  }`}
                >
                  {/* Left: Thumbnail & Song Info */}
                  <div className="flex items-center space-x-3 w-full md:w-auto flex-1 min-w-0">
                    {/* Rank Badge & Play Button */}
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-gray-700 bg-gray-900 shadow">
                      {song.thumbnailUrl ? (
                        <img
                          src={song.thumbnailUrl}
                          alt={song.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <Disc3 className="w-6 h-6 animate-spin" />
                        </div>
                      )}
                      <button
                        onClick={() => handleTogglePlay(song)}
                        className={`absolute inset-0 flex items-center justify-center transition ${
                          isPlaying
                            ? 'bg-cyan-600/60 text-white'
                            : 'bg-black/50 hover:bg-black/30 text-white'
                        }`}
                        title={isPlaying ? 'Pause Audio Preview' : 'Play Audio Preview'}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 fill-current text-white animate-pulse" />
                        ) : (
                          <Play className="w-5 h-5 fill-current text-white ml-0.5" />
                        )}
                      </button>
                      {/* Rank tag */}
                      <div className="absolute top-0 left-0 bg-cyan-500 text-black font-extrabold text-[9px] px-1 rounded-br">
                        #{idx + 1}
                      </div>
                    </div>

                    {/* Song Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-white truncate group-hover:text-cyan-300 transition">
                          {song.title}
                        </h4>
                        {song.vibe && (
                          <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-1.5 py-0.5 rounded font-mono shrink-0">
                            {song.vibe}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-400 font-mono mt-0.5 flex items-center space-x-2 truncate">
                        <span className="text-gray-300 font-medium truncate">{song.artist}</span>
                        {song.album && (
                          <>
                            <span>•</span>
                            <span className="text-gray-500 truncate max-w-[150px]">{song.album}</span>
                          </>
                        )}
                        {song.trendScore && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">{song.trendScore}</span>
                          </>
                        )}
                      </div>

                      {song.description && (
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {song.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Technical Stats & Select Action */}
                  <div className="flex items-center space-x-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right font-mono text-[10px] text-gray-400 hidden md:block">
                      <div className="text-cyan-400 font-semibold">{song.bpm || 128} BPM</div>
                      <div className="text-gray-500">Drop: {song.dropTime || 4.2}s</div>
                    </div>

                    <button
                      onClick={() => handleSelect(song)}
                      disabled={isApplying}
                      className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-md shadow-cyan-500/10 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{isApplying ? 'Applying...' : 'Select & Apply Audio'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400 shrink-0">
          <span className="flex items-center space-x-1 font-mono text-[11px] text-cyan-300/80">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audio will automatically sync beat drops, transitions, and export to master timeline.</span>
          </span>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-gray-800 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
