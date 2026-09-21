import React, { useState } from 'react';
import {
  Film,
  Music,
  Smile,
  Plus,
  Search,
  Sparkles,
  Upload,
  Layers,
  Volume2,
  Check
} from 'lucide-react';
import { LibraryAsset } from '../../types';

interface AssetLibraryPanelProps {
  assets: LibraryAsset[];
  currentTime: number;
  onInsertAsset: (asset: LibraryAsset, trackId: 'v2' | 'a2') => void;
  onUploadClick: () => void;
}

export const AssetLibraryPanel: React.FC<AssetLibraryPanelProps> = ({
  assets,
  currentTime,
  onInsertAsset,
  onUploadClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'meme' | 'broll' | 'audio' | 'sfx'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);

  const categories: { id: 'all' | 'meme' | 'broll' | 'audio' | 'sfx'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Assets', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'meme', label: 'Memes & Reactions', icon: <Smile className="w-3.5 h-3.5 text-yellow-400" /> },
    { id: 'broll', label: 'Cinematic B-Roll', icon: <Film className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'audio', label: 'Trending Music', icon: <Music className="w-3.5 h-3.5 text-pink-400" /> },
    { id: 'sfx', label: 'Sound FX', icon: <Volume2 className="w-3.5 h-3.5 text-green-400" /> },
  ];

  const filtered = assets.filter((asset) => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesQuery =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleAdd = (asset: LibraryAsset) => {
    const trackId = asset.type === 'video' ? 'v2' : 'a2';
    onInsertAsset(asset, trackId);
    setAddedId(asset.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="h-full flex flex-col bg-resolve-950 p-4 select-none overflow-hidden">
      {/* Top Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-resolve-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Smile className="w-5 h-5 text-resolve-orange" />
            <h2 className="text-base font-bold text-white">ASSET LIBRARY & B-ROLL POOL</h2>
          </div>
          <p className="text-xs text-gray-400">
            Click to overlay trending memes on Track V2 or sound effects on Track A2 at current playhead ({currentTime.toFixed(1)}s)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memes, SFX, B-roll..."
              className="bg-resolve-900 border border-resolve-800 focus:border-resolve-orange rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none w-48"
            />
          </div>

          {/* Import Custom Asset */}
          <button
            onClick={onUploadClick}
            className="flex items-center space-x-1.5 bg-resolve-850 hover:bg-resolve-800 border border-resolve-700 text-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5 text-resolve-orange" />
            <span>Upload Custom</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center space-x-1.5 py-3 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition border ${
              selectedCategory === cat.id
                ? 'bg-resolve-orange text-black border-resolve-orange font-bold shadow-md shadow-orange-500/20'
                : 'bg-resolve-900 text-gray-400 border-resolve-800 hover:text-white hover:border-resolve-700'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
        {filtered.map((asset) => {
          const isRecentlyAdded = addedId === asset.id;

          return (
            <div
              key={asset.id}
              className="bg-resolve-900 border border-resolve-800 hover:border-resolve-700 rounded-xl overflow-hidden flex flex-col group transition shadow-md hover:shadow-xl"
            >
              {/* Asset Thumbnail / Preview */}
              <div className="h-28 bg-resolve-950 relative overflow-hidden flex items-center justify-center">
                <img
                  src={asset.thumbnail}
                  alt={asset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Duration pill */}
                <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300">
                  {asset.duration.toFixed(1)}s
                </div>

                {/* Category tag */}
                <div className="absolute top-1.5 left-1.5 bg-resolve-900/90 border border-resolve-700/60 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-gray-300">
                  {asset.category}
                </div>
              </div>

              {/* Asset Details */}
              <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="font-bold text-xs text-white truncate">{asset.name}</h4>
                  <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                    {asset.description}
                  </p>
                </div>

                {/* Insert Button */}
                <button
                  onClick={() => handleAdd(asset)}
                  className={`w-full flex items-center justify-center space-x-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    isRecentlyAdded
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'bg-resolve-800 hover:bg-resolve-orange hover:text-black text-gray-200 border border-resolve-700'
                  }`}
                >
                  {isRecentlyAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added to Track {asset.type === 'video' ? 'V2' : 'A2'}!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Insert on Track {asset.type === 'video' ? 'V2' : 'A2'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
