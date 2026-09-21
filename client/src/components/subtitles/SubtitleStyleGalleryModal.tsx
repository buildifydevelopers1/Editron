import React from 'react';
import {
  X,
  Sparkles,
  Check,
  Type,
  Palette,
  Flame,
  Zap,
  Film
} from 'lucide-react';
import { SubtitleStyle, SubtitlePreset } from '../../types';

interface SubtitleStyleGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: SubtitleStyle;
  onSelectStyle: (style: SubtitleStyle) => void;
}

export const ALL_SUBTITLE_PRESETS: {
  id: SubtitlePreset;
  name: string;
  category: 'Viral Creators' | 'Cinematic & Clean' | 'Aesthetic & Retro' | 'High-Energy & Comic';
  description: string;
  sampleWord: string;
  style: SubtitleStyle;
}[] = [
  {
    id: 'hindi_attitude',
    name: '🇮🇳 Hindi Attitude Gold',
    category: 'Viral Creators',
    description: 'Extra-bold Devanagari & Hinglish font with explosive gold punch. #1 for Hindi Reels & Shorts.',
    sampleWord: 'खामोशी में मेहनत 🔥',
    style: {
      preset: 'hindi_attitude',
      fontFamily: "'Poppins', 'Noto Sans Devanagari', 'Mukta', 'Montserrat', sans-serif",
      fontSize: 38,
      textColor: '#FFFFFF',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 5,
      textCase: 'uppercase',
      animation: 'bounce',
      positionY: 22
    }
  },
  {
    id: 'bollywood_royal',
    name: '👑 Bollywood Royal Crimson',
    category: 'Viral Creators',
    description: 'Luxurious gold text with vibrant ruby-crimson highlight for Bollywood songs and dramatic poetry.',
    sampleWord: 'कदम चूम लेती है मंजिल',
    style: {
      preset: 'bollywood_royal',
      fontFamily: "'Mukta', 'Poppins', 'Noto Sans Devanagari', sans-serif",
      fontSize: 38,
      textColor: '#FFFBEB',
      highlightColor: '#FF0055',
      strokeColor: '#000000',
      strokeWidth: 5,
      textCase: 'uppercase',
      animation: 'pop',
      positionY: 22
    }
  },
  {
    id: 'punjabi_drill',
    name: '⚡ Punjabi Drill Neon',
    category: 'High-Energy & Comic',
    description: 'Electric cyan and neon mint pop on heavy bold typography. Tailored for Punjabi drill & attitude beats.',
    sampleWord: 'LEVEL ALAG HAI ⚡',
    style: {
      preset: 'punjabi_drill',
      fontFamily: "'Poppins', 'Montserrat', sans-serif",
      fontSize: 38,
      textColor: '#FFFFFF',
      highlightColor: '#00FFAA',
      strokeColor: '#000000',
      strokeWidth: 5,
      textCase: 'uppercase',
      animation: 'glow',
      positionY: 22
    }
  },
  {
    id: 'hormozi',
    name: 'Alex Hormozi Viral',
    category: 'Viral Creators',
    description: 'Thick black stroke with explosive neon gold punch. The #1 retention style on TikTok and Reels.',
    sampleWord: 'MASSIVE RESULTS',
    style: {
      preset: 'hormozi',
      fontFamily: "'Poppins', 'Montserrat', 'Noto Sans Devanagari', Impact, sans-serif",
      fontSize: 36,
      textColor: '#FFFFFF',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 5,
      textCase: 'uppercase',
      animation: 'bounce',
      positionY: 22
    }
  },
  {
    id: 'mrbeast',
    name: 'MrBeast Energy',
    category: 'Viral Creators',
    description: 'Hyper-vibrant mint green & white with comic pop physics. Maximizes attention span.',
    sampleWord: '$1,000,000 CHALLENGE',
    style: {
      preset: 'mrbeast',
      fontFamily: "'Komika Axis', Impact, sans-serif",
      fontSize: 38,
      textColor: '#FFFFFF',
      highlightColor: '#00FFAA',
      strokeColor: '#000000',
      strokeWidth: 5,
      textCase: 'uppercase',
      animation: 'pop',
      positionY: 22
    }
  },
  {
    id: 'boxed_pill',
    name: 'Boxed Pill Highlight',
    category: 'Viral Creators',
    description: 'Crisp black text inside a high-contrast yellow pill badge. Clean, modern, and instantly readable.',
    sampleWord: 'GAME CHANGER',
    style: {
      preset: 'boxed_pill',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 32,
      textColor: '#000000',
      highlightColor: '#000000',
      strokeColor: 'transparent',
      strokeWidth: 0,
      backgroundColor: '#FACC15',
      textCase: 'uppercase',
      animation: 'pop',
      positionY: 20
    }
  },
  {
    id: 'drop_shadow_studio',
    name: 'Podcast Studio Shadow',
    category: 'Viral Creators',
    description: 'Deep 45-degree smooth drop shadow. The gold standard for Joe Rogan and Huberman-style clips.',
    sampleWord: 'DEEP FOCUS',
    style: {
      preset: 'drop_shadow_studio',
      fontFamily: "'Inter', Helvetica, sans-serif",
      fontSize: 32,
      textColor: '#FFFFFF',
      highlightColor: '#38BDF8',
      strokeColor: 'rgba(0,0,0,0.8)',
      strokeWidth: 2,
      shadowColor: 'rgba(0,0,0,0.95)',
      textCase: 'uppercase',
      animation: 'pop',
      positionY: 20
    }
  },
  {
    id: 'neon_cyberpunk',
    name: 'Neon Cyberpunk 2077',
    category: 'Aesthetic & Retro',
    description: 'Electric cyan and hot magenta outer glows on a futuristic monospaced typeface.',
    sampleWord: 'NEURAL SYNC',
    style: {
      preset: 'neon_cyberpunk',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 34,
      textColor: '#00F0FF',
      highlightColor: '#FF007F',
      strokeColor: '#000000',
      strokeWidth: 3,
      shadowColor: '#00F0FF',
      textCase: 'uppercase',
      animation: 'glow',
      positionY: 20
    }
  },
  {
    id: 'retro_vhs',
    name: '80s Retro VHS Tape',
    category: 'Aesthetic & Retro',
    description: 'Chromatic RGB aberration, arcade pixel lettering, and warm golden yellow glow.',
    sampleWord: 'INSERT CASSETTE',
    style: {
      preset: 'retro_vhs',
      fontFamily: "'VT323', 'Courier New', monospace",
      fontSize: 38,
      textColor: '#FFDF00',
      highlightColor: '#FF0055',
      strokeColor: '#000000',
      strokeWidth: 3,
      shadowColor: 'rgba(255,0,85,0.7)',
      textCase: 'uppercase',
      animation: 'none',
      positionY: 18
    }
  },
  {
    id: 'glitch_hacker',
    name: 'Matrix Glitch Twitch',
    category: 'Aesthetic & Retro',
    description: 'Terminal hacker green with red/blue chromatic twitch offset. Ideal for cyber & mystery content.',
    sampleWord: 'ACCESS GRANTED',
    style: {
      preset: 'glitch_hacker',
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 28,
      textColor: '#00FF41',
      highlightColor: '#FF0033',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowColor: '#FF0033',
      textCase: 'uppercase',
      animation: 'pop',
      positionY: 22
    }
  },
  {
    id: 'typewriter',
    name: 'Terminal Typewriter',
    category: 'Aesthetic & Retro',
    description: 'Mechanical monospace font with luminous emerald terminal illumination.',
    sampleWord: 'sys.compile()',
    style: {
      preset: 'typewriter',
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 30,
      textColor: '#00FF66',
      highlightColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2,
      shadowColor: '#00FF66',
      textCase: 'normal',
      animation: 'none',
      positionY: 16
    }
  },
  {
    id: 'y2k_aesthetic',
    name: 'Y2K Cyber Millennium',
    category: 'Aesthetic & Retro',
    description: 'Pastel purple, hot pink accents, and glossy early-2000s bubble aesthetics.',
    sampleWord: 'VINTAGE 2000',
    style: {
      preset: 'y2k_aesthetic',
      fontFamily: "'Montserrat', cursive, sans-serif",
      fontSize: 34,
      textColor: '#E9D5FF',
      highlightColor: '#F43F5E',
      strokeColor: '#4C1D95',
      strokeWidth: 4,
      shadowColor: '#F43F5E',
      textCase: 'uppercase',
      animation: 'bounce',
      positionY: 22
    }
  },
  {
    id: 'karaoke_glow',
    name: 'Karaoke Smooth Sweep',
    category: 'High-Energy & Comic',
    description: 'Subtle dimmed words that light up with vivid electric cyan as the speaker speaks.',
    sampleWord: 'FEEL THE RHYTHM',
    style: {
      preset: 'karaoke_glow',
      fontFamily: "'Inter', sans-serif",
      fontSize: 36,
      textColor: 'rgba(255,255,255,0.4)',
      highlightColor: '#38BDF8',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowColor: '#38BDF8',
      textCase: 'normal',
      animation: 'glow',
      positionY: 24
    }
  },
  {
    id: 'comic_pop',
    name: 'Comic Book Action Pop',
    category: 'High-Energy & Comic',
    description: 'Skewed cartoon angle, fiery yellow fill, and thick red drop shadow. For comedy & gaming reels.',
    sampleWord: 'BOOM! EXPLODE',
    style: {
      preset: 'comic_pop',
      fontFamily: "'Bangers', 'Komika Axis', cursive, sans-serif",
      fontSize: 42,
      textColor: '#FFF500',
      highlightColor: '#FF3366',
      strokeColor: '#000000',
      strokeWidth: 6,
      shadowColor: '#FF0033',
      textCase: 'uppercase',
      animation: 'pop',
      positionY: 24
    }
  },
  {
    id: 'fire_gradient',
    name: 'Flame Heat Gradient',
    category: 'High-Energy & Comic',
    description: 'Blazing red-to-gold gradient with intense thermal outline. Perfect for workout & attitude clips.',
    sampleWord: 'NEVER QUIT 🔥',
    style: {
      preset: 'fire_gradient',
      fontFamily: "'Impact', sans-serif",
      fontSize: 40,
      textColor: '#FF4500',
      highlightColor: '#FFD700',
      strokeColor: '#000000',
      strokeWidth: 5,
      shadowColor: '#FF4500',
      textCase: 'uppercase',
      animation: 'bounce',
      positionY: 22
    }
  },
  {
    id: 'anime_speed',
    name: 'Anime Speed Action',
    category: 'High-Energy & Comic',
    description: 'Forward-slanted italic speed lines with piercing azure lightning aura.',
    sampleWord: 'LIGHT SPEED!',
    style: {
      preset: 'anime_speed',
      fontFamily: "'Montserrat', Impact, sans-serif",
      fontSize: 36,
      textColor: '#FFFFFF',
      highlightColor: '#00E5FF',
      strokeColor: '#001040',
      strokeWidth: 5,
      shadowColor: '#00E5FF',
      textCase: 'uppercase',
      animation: 'bounce',
      positionY: 22
    }
  },
  {
    id: 'golden_luxury',
    name: 'Golden Royal Luxury',
    category: 'Cinematic & Clean',
    description: 'Polished metallic gold serif lettering with warm amber glow. For high-end luxury & real estate.',
    sampleWord: 'TIMELESS LUXURY',
    style: {
      preset: 'golden_luxury',
      fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
      fontSize: 32,
      textColor: '#F5DEB3',
      highlightColor: '#FFD700',
      strokeColor: '#1A1408',
      strokeWidth: 3,
      shadowColor: '#FFD700',
      textCase: 'uppercase',
      animation: 'glow',
      positionY: 20
    }
  },
  {
    id: 'cinematic_clean',
    name: 'Cinematic Minimalist',
    category: 'Cinematic & Clean',
    description: 'Flawless white typography with gentle optical tracking. Subtle and non-distracting.',
    sampleWord: 'A Cinematic Journey',
    style: {
      preset: 'cinematic_clean',
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 26,
      textColor: '#F3F4F6',
      highlightColor: '#FFFFFF',
      strokeColor: 'rgba(0,0,0,0.8)',
      strokeWidth: 2,
      textCase: 'normal',
      animation: 'none',
      positionY: 15
    }
  },
  {
    id: 'documentary_italic',
    name: 'Documentary Subtitle',
    category: 'Cinematic & Clean',
    description: 'Classic BBC / National Geographic lower-third italic typography with subtle dark backdrop strip.',
    sampleWord: 'The silent observer...',
    style: {
      preset: 'documentary_italic',
      fontFamily: "Georgia, serif",
      fontSize: 26,
      textColor: '#FFFFFF',
      highlightColor: '#FDE047',
      strokeColor: 'rgba(0,0,0,0.9)',
      strokeWidth: 2,
      backgroundColor: 'rgba(0,0,0,0.65)',
      textCase: 'normal',
      animation: 'none',
      positionY: 14
    }
  },
  {
    id: 'isometric_3d',
    name: '3D Isometric Chisel',
    category: 'Cinematic & Clean',
    description: 'Chiseled dimensional relief with multi-layer deep shadow projection.',
    sampleWord: 'LEVEL 100',
    style: {
      preset: 'isometric_3d',
      fontFamily: "'Impact', sans-serif",
      fontSize: 38,
      textColor: '#FFFFFF',
      highlightColor: '#FB923C',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowColor: 'rgba(0,0,0,1)',
      textCase: 'uppercase',
      animation: 'pop',
      positionY: 22
    }
  },
  {
    id: 'news_lower_third',
    name: 'Broadcast News Lower-Third',
    category: 'Cinematic & Clean',
    description: 'Corporate news anchor banner with clean contrast and sharp authority.',
    sampleWord: 'BREAKING REPORT',
    style: {
      preset: 'news_lower_third',
      fontFamily: "'Inter', sans-serif",
      fontSize: 28,
      textColor: '#FFFFFF',
      highlightColor: '#EF4444',
      strokeColor: '#000000',
      strokeWidth: 2,
      backgroundColor: '#0F172A',
      textCase: 'uppercase',
      animation: 'none',
      positionY: 12
    }
  }
];

export const SubtitleStyleGalleryModal: React.FC<SubtitleStyleGalleryModalProps> = ({
  isOpen,
  onClose,
  currentStyle,
  onSelectStyle,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Viral Creators', 'Cinematic & Clean', 'Aesthetic & Retro', 'High-Energy & Comic'];

  const filteredPresets = selectedCategory === 'All'
    ? ALL_SUBTITLE_PRESETS
    : ALL_SUBTITLE_PRESETS.filter(p => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-resolve-900 border border-resolve-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-resolve-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Type className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>SUBTITLE STYLE STUDIO</span>
                <span className="bg-resolve-800 text-yellow-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-resolve-700">
                  18 PRO PRESETS
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Choose viral dynamic typography used by top TikTok, YouTube Shorts, and cinematic creators.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-resolve-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 select-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-resolve-orange text-black font-bold shadow-sm'
                  : 'bg-resolve-850 hover:bg-resolve-800 text-gray-300 hover:text-white border border-resolve-750'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 18 Presets Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 select-none">
          {filteredPresets.map((preset) => {
            const isSelected = currentStyle.preset === preset.id;

            return (
              <div
                key={preset.id}
                onClick={() => onSelectStyle(preset.style)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-resolve-800/90 border-resolve-orange ring-1 ring-resolve-orange/50 shadow-lg shadow-resolve-orange/10'
                    : 'bg-resolve-950/70 hover:bg-resolve-850/80 border-resolve-800/80 hover:border-resolve-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-200 group-hover:text-white">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-resolve-orange">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                    {preset.description}
                  </p>
                </div>

                {/* Live Visual Preview Box */}
                <div className="h-16 rounded-lg bg-black/80 border border-resolve-800 flex items-center justify-center p-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  <span
                    className="font-bold tracking-wide transition-transform group-hover:scale-105"
                    style={{
                      fontFamily: preset.style.fontFamily,
                      fontSize: '18px',
                      color: preset.style.highlightColor,
                      WebkitTextStroke: `${Math.min(2, preset.style.strokeWidth)}px ${preset.style.strokeColor}`,
                      textShadow: preset.style.shadowColor
                        ? `0 0 10px ${preset.style.shadowColor}`
                        : '0 2px 4px rgba(0,0,0,0.9)',
                      backgroundColor: preset.style.backgroundColor || 'transparent',
                      padding: preset.style.backgroundColor ? '2px 8px' : '0',
                      borderRadius: preset.style.backgroundColor ? '4px' : '0',
                    }}
                  >
                    {preset.sampleWord}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-resolve-800 flex items-center justify-between text-xs text-gray-400">
          <span>Click any preset to immediately apply to the timeline monitor.</span>
          <button
            onClick={onClose}
            className="bg-resolve-orange text-black font-bold px-4 py-1.5 rounded-lg hover:bg-resolve-orange-hover transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
