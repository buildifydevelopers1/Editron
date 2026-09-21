import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Sliders,
  Tv,
  Film,
  Sun,
  Activity,
  Maximize2,
  Check,
  RotateCcw,
  Plus
} from 'lucide-react';
import { EffectType, TransitionType, VideoEffect, VideoTransition } from '../../types';

interface EffectsPanelProps {
  transitions: VideoTransition[];
  onAddTransition: (transition: VideoTransition) => void;
  onRemoveTransition: (id: string) => void;
  effects: VideoEffect[];
  onUpdateEffect: (effect: VideoEffect) => void;
  currentTime: number;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  transitions,
  onAddTransition,
  onRemoveTransition,
  effects,
  onUpdateEffect,
  currentTime,
}) => {
  const [activeTab, setActiveTab] = useState<'transitions' | 'effects'>('transitions');
  const [transitionDuration, setTransitionDuration] = useState(0.8);
  const [addedTransitionId, setAddedTransitionId] = useState<string | null>(null);

  const availableTransitions: {
    type: TransitionType;
    name: string;
    description: string;
    icon: string;
    category: string;
  }[] = [
    {
      type: 'zoom_blur',
      name: 'Zoom Blur Punch',
      description: 'Fast optical zoom punch-in and snap transition',
      icon: '🔍',
      category: 'Motion',
    },
    {
      type: 'whip_pan',
      name: 'Whip Pan',
      description: 'Ultra-fast horizontal motion blur whip cut',
      icon: '💨',
      category: 'Motion',
    },
    {
      type: 'glitch',
      name: 'Cyber Glitch',
      description: 'RGB chromatic shift & horizontal digital tearing',
      icon: '👾',
      category: 'Glitch',
    },
    {
      type: 'cube_flip',
      name: '3D Cube Flip',
      description: 'True 3D rotational perspective cube flip cut',
      icon: '🎲',
      category: '3D',
    },
    {
      type: 'film_burn',
      name: 'Film Burn & Leak',
      description: 'Warm organic golden light leak flash exposure',
      icon: '🔥',
      category: 'Cinematic',
    },
    {
      type: 'dip_white',
      name: 'Flash Shutter',
      description: 'High-energy camera shutter white flash',
      icon: '⚡',
      category: 'Fades',
    },
    {
      type: 'spin',
      name: 'Warp Spin 360°',
      description: 'High-speed rotational roll transition',
      icon: '🔄',
      category: 'Motion',
    },
    {
      type: 'push_slide',
      name: 'Directional Push',
      description: 'Smooth directional momentum push cut',
      icon: '➡️',
      category: 'Motion',
    },
    {
      type: 'lens_flare',
      name: 'Anamorphic Flare',
      description: 'Hollywood blue horizontal lens flare streak',
      icon: '✨',
      category: 'Cinematic',
    },
    {
      type: 'shake_impact',
      name: 'Camera Shake Hit',
      description: 'Violent seismic camera impact on cut point',
      icon: '📳',
      category: 'Motion',
    },
    {
      type: 'cross_zoom',
      name: 'Cross Zoom Vortex',
      description: 'Dramatic hyper-speed optical vortex plunge',
      icon: '🌀',
      category: 'Motion',
    },
    {
      type: 'rgb_split',
      name: 'RGB Aberration',
      description: 'Color channel split distortion transition',
      icon: '🌈',
      category: 'Glitch',
    },
    {
      type: 'pixelate',
      name: 'Pixelate Dissolve',
      description: 'Retro 8-bit digital mosaic pixel dissolve',
      icon: '🧊',
      category: 'Glitch',
    },
    {
      type: 'iris_wipe',
      name: 'Radial Iris Wipe',
      description: 'Dynamic circular aperture reveal cut',
      icon: '⭕',
      category: '3D',
    },
    {
      type: 'split_slice',
      name: 'Split Slice Blinds',
      description: 'Multi-band venetian blind slide transition',
      icon: '📑',
      category: 'Motion',
    },
    {
      type: 'page_curl',
      name: '3D Page Turn',
      description: 'Physical 3D paper curl turn transition',
      icon: '📖',
      category: '3D',
    },
    {
      type: 'cross_dissolve',
      name: 'Cross Dissolve',
      description: 'Smooth classic opacity blend between shots',
      icon: '🌫️',
      category: 'Fades',
    },
    {
      type: 'dip_black',
      name: 'Dip to Black',
      description: 'Dramatic fade to black and fade in',
      icon: '🌑',
      category: 'Fades',
    },
  ];

  const handleApplyTransition = (t: (typeof availableTransitions)[0]) => {
    const newTransition: VideoTransition = {
      id: `trans-${Date.now()}`,
      type: t.type,
      name: t.name,
      timestamp: currentTime,
      duration: transitionDuration,
    };
    onAddTransition(newTransition);
    setAddedTransitionId(newTransition.id);
    setTimeout(() => setAddedTransitionId(null), 1200);
  };

  return (
    <div className="h-full flex flex-col bg-resolve-950 p-3 select-none overflow-hidden">
      {/* Top Header & Tab Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-resolve-800">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-resolve-orange" />
          <h2 className="text-sm font-bold text-white">DAVINCI RESOLVE EFFECTS & TRANSITIONS</h2>
        </div>

        {/* Tabs Switcher */}
        <div className="flex items-center space-x-1 bg-resolve-900 p-0.5 rounded-lg border border-resolve-800">
          <button
            onClick={() => setActiveTab('transitions')}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              activeTab === 'transitions'
                ? 'bg-resolve-800 text-resolve-orange shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Transitions ({transitions.length})
          </button>
          <button
            onClick={() => setActiveTab('effects')}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              activeTab === 'effects'
                ? 'bg-resolve-800 text-resolve-orange shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            OpenFX Effects ({effects.filter((e) => e.enabled).length} Active)
          </button>
        </div>
      </div>

      {/* TRANSITIONS TAB CONTENT */}
      {activeTab === 'transitions' && (
        <div className="flex-1 flex flex-col mt-3 overflow-hidden">
          {/* Transition Duration Toolbar */}
          <div className="flex items-center justify-between bg-resolve-900 border border-resolve-800 rounded-lg px-3 py-2 text-xs mb-3">
            <div className="flex items-center space-x-2 text-gray-300 font-mono">
              <span>DEFAULT TRANSITION DURATION:</span>
              <span className="text-resolve-orange font-bold">{transitionDuration}s</span>
            </div>
            <div className="flex items-center space-x-1">
              {[0.4, 0.8, 1.2, 1.6].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setTransitionDuration(dur)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                    transitionDuration === dur
                      ? 'bg-resolve-orange text-black font-bold'
                      : 'bg-resolve-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>
          </div>

          {/* Transitions Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-3 pr-1">
            {availableTransitions.map((t) => (
              <div
                key={t.type}
                className="bg-resolve-900 border border-resolve-800 hover:border-resolve-orange/70 rounded-xl p-3 flex flex-col justify-between group transition shadow-md hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{t.icon}</span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-resolve-950 text-gray-400 border border-resolve-800">
                      {t.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white group-hover:text-resolve-orange transition">
                    {t.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                    {t.description}
                  </p>
                </div>

                <button
                  onClick={() => handleApplyTransition(t)}
                  className="mt-3 w-full flex items-center justify-center space-x-1 bg-resolve-800 hover:bg-resolve-orange hover:text-black text-gray-200 py-1.5 rounded-lg text-xs font-bold transition border border-resolve-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Apply at {currentTime.toFixed(1)}s</span>
                </button>
              </div>
            ))}
          </div>

          {/* Active Timeline Transitions List */}
          {transitions.length > 0 && (
            <div className="pt-3 border-t border-resolve-800 mt-3">
              <label className="text-xs font-mono text-gray-400 mb-2 block">
                ACTIVE TRANSITIONS ON TIMELINE ({transitions.length}):
              </label>
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                {transitions.map((tr) => (
                  <div
                    key={tr.id}
                    className="bg-resolve-900 border border-resolve-orange/60 px-2.5 py-1 rounded-lg flex items-center space-x-2 text-xs text-white shrink-0 shadow-sm"
                  >
                    <Zap className="w-3 h-3 text-resolve-orange" />
                    <span className="font-semibold">{tr.name}</span>
                    <span className="text-gray-400 font-mono text-[10px]">
                      at {tr.timestamp.toFixed(1)}s ({tr.duration}s)
                    </span>
                    <button
                      onClick={() => onRemoveTransition(tr.id)}
                      className="text-gray-500 hover:text-red-400 ml-1"
                      title="Remove Transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* OPENFX EFFECTS TAB CONTENT */}
      {activeTab === 'effects' && (
        <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {effects.map((fx) => (
              <div
                key={fx.id}
                className={`border rounded-xl p-3 transition flex flex-col justify-between space-y-3 ${
                  fx.enabled
                    ? 'bg-resolve-900 border-resolve-orange/70 shadow-lg shadow-orange-500/10'
                    : 'bg-resolve-900/60 border-resolve-800 text-gray-400'
                }`}
              >
                {/* Effect Header & Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        fx.enabled ? 'bg-resolve-orange animate-pulse' : 'bg-gray-600'
                      }`}
                    />
                    <h4 className="font-bold text-xs text-white">{fx.name}</h4>
                  </div>

                  <button
                    onClick={() =>
                      onUpdateEffect({ ...fx, enabled: !fx.enabled })
                    }
                    className={`px-2.5 py-1 rounded text-xs font-bold transition border ${
                      fx.enabled
                        ? 'bg-resolve-orange text-black border-resolve-orange'
                        : 'bg-resolve-800 text-gray-400 border-resolve-700'
                    }`}
                  >
                    {fx.enabled ? 'ACTIVE' : 'ENABLE'}
                  </button>
                </div>

                {/* Effect Intensity Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400 font-mono">
                    <span>INTENSITY</span>
                    <span className={fx.enabled ? 'text-resolve-orange' : 'text-gray-500'}>
                      {fx.intensity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={fx.intensity}
                    disabled={!fx.enabled}
                    onChange={(e) =>
                      onUpdateEffect({ ...fx, intensity: parseInt(e.target.value) })
                    }
                    className="w-full h-1 bg-resolve-750 accent-resolve-orange disabled:opacity-40 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
