import React from 'react';
import { RotateCcw, Sparkles, Sun, Eye, Sliders } from 'lucide-react';
import { ColorGradingSettings, ColorWheelVector } from '../../types';

interface ColorGradingPanelProps {
  settings: ColorGradingSettings;
  onChange: (settings: ColorGradingSettings) => void;
}

export const ColorGradingPanel: React.FC<ColorGradingPanelProps> = ({
  settings,
  onChange,
}) => {
  const presets: { name: string; settings: Partial<ColorGradingSettings> }[] = [
    {
      name: 'Teal & Orange',
      settings: {
        presetName: 'Teal & Orange',
        temperature: 16,
        tint: -8,
        contrast: 30,
        saturation: 20,
        lift: { r: -0.06, g: 0.02, b: 0.12, master: -0.02 },
        gamma: { r: 0.02, g: -0.02, b: -0.04, master: 0.0 },
        gain: { r: 0.14, g: 0.06, b: -0.08, master: 0.04 },
      },
    },
    {
      name: 'Vintage 35mm',
      settings: {
        presetName: 'Vintage 35mm',
        temperature: 24,
        tint: 10,
        contrast: -10,
        saturation: -12,
        lift: { r: 0.08, g: 0.04, b: 0.0, master: 0.05 },
        gamma: { r: 0.02, g: 0.02, b: -0.02, master: 0.0 },
        gain: { r: 0.05, g: 0.02, b: -0.06, master: -0.02 },
      },
    },
    {
      name: 'Cyberpunk Neon',
      settings: {
        presetName: 'Cyberpunk Neon',
        temperature: -24,
        tint: 32,
        contrast: 38,
        saturation: 45,
        lift: { r: 0.1, g: -0.05, b: 0.16, master: -0.04 },
        gamma: { r: -0.06, g: 0.02, b: 0.1, master: 0.0 },
        gain: { r: 0.16, g: 0.02, b: 0.12, master: 0.06 },
      },
    },
    {
      name: 'Moody Noir',
      settings: {
        presetName: 'Moody Noir',
        temperature: 0,
        tint: 0,
        contrast: 45,
        saturation: -100,
        lift: { r: -0.05, g: -0.05, b: -0.05, master: -0.06 },
        gamma: { r: 0.0, g: 0.0, b: 0.0, master: 0.0 },
        gain: { r: 0.1, g: 0.1, b: 0.1, master: 0.08 },
      },
    },
    {
      name: 'Golden Hour',
      settings: {
        presetName: 'Golden Hour',
        temperature: 36,
        tint: 4,
        contrast: 15,
        saturation: 18,
        lift: { r: 0.04, g: 0.01, b: -0.03, master: 0.0 },
        gamma: { r: 0.05, g: 0.02, b: -0.04, master: 0.02 },
        gain: { r: 0.12, g: 0.06, b: -0.08, master: 0.04 },
      },
    },
    {
      name: 'Clean Studio',
      settings: {
        presetName: 'Clean Studio',
        temperature: 0,
        tint: 0,
        contrast: 10,
        saturation: 5,
        lift: { r: 0, g: 0, b: 0, master: 0 },
        gamma: { r: 0, g: 0, b: 0, master: 0 },
        gain: { r: 0, g: 0, b: 0, master: 0 },
      },
    },
  ];

  const resetAll = () => {
    onChange({
      presetName: 'Default Rec.709',
      temperature: 0,
      tint: 0,
      contrast: 0,
      saturation: 0,
      brightness: 0,
      lift: { r: 0, g: 0, b: 0, master: 0 },
      gamma: { r: 0, g: 0, b: 0, master: 0 },
      gain: { r: 0, g: 0, b: 0, master: 0 },
      offset: { r: 0, g: 0, b: 0, master: 0 },
    });
  };

  // Helper to render an interactive DaVinci Resolve color wheel
  const renderColorWheel = (
    label: string,
    sublabel: string,
    vector: ColorWheelVector,
    onVectorChange: (v: ColorWheelVector) => void
  ) => {
    // Calculate puck X/Y from RGB vector
    // R is right/up, G is top-left, B is bottom-left
    const puckX = 50 + (vector.r - vector.b) * 35;
    const puckY = 50 - (vector.g * 35 + (vector.r + vector.b) * 10);

    const handleWheelClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0 to 1
      const y = (e.clientY - rect.top) / rect.height; // 0 to 1
      
      const normX = (x - 0.5) * 2; // -1 to 1
      const normY = (0.5 - y) * 2; // -1 to 1

      onVectorChange({
        ...vector,
        r: Math.round(normX * 0.5 * 100) / 100,
        g: Math.round(normY * 0.5 * 100) / 100,
        b: Math.round(-normX * 0.5 * 100) / 100,
      });
    };

    return (
      <div className="flex flex-col items-center bg-resolve-900 border border-resolve-800/80 rounded-lg p-3 flex-1 min-w-[170px]">
        {/* Wheel Header */}
        <div className="w-full flex items-center justify-between mb-2">
          <div>
            <span className="font-bold text-gray-200 text-xs font-mono">{label}</span>
            <span className="text-[10px] text-gray-500 ml-1">({sublabel})</span>
          </div>
          <button
            onClick={() => onVectorChange({ r: 0, g: 0, b: 0, master: 0 })}
            className="text-gray-500 hover:text-gray-300 p-0.5"
            title={`Reset ${label}`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* DaVinci Chromatic Wheel Canvas */}
        <div
          onClick={handleWheelClick}
          className="w-28 h-28 rounded-full relative cursor-crosshair border-2 border-resolve-700/80 shadow-inner flex items-center justify-center overflow-hidden"
          style={{
            background: 'conic-gradient(from 90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
          }}
        >
          {/* Neutral Desaturation Center Ring */}
          <div className="absolute inset-2 rounded-full bg-resolve-950/70 backdrop-blur-[2px] flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
          </div>

          {/* Color Indicator Puck */}
          <div
            className="absolute w-3.5 h-3.5 -ml-1.5 -mt-1.5 rounded-full border-2 border-white bg-resolve-orange shadow-lg pointer-events-none transition-all duration-75"
            style={{
              left: `${Math.max(10, Math.min(90, puckX))}%`,
              top: `${Math.max(10, Math.min(90, puckY))}%`,
            }}
          />
        </div>

        {/* Master Wheel Ring Slider below wheel */}
        <div className="w-full mt-3 flex flex-col items-center space-y-1">
          <div className="w-full flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>MASTER</span>
            <span className="text-resolve-orange">
              {vector.master > 0 ? `+${vector.master.toFixed(2)}` : vector.master.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={-0.5}
            max={0.5}
            step={0.01}
            value={vector.master}
            onChange={(e) =>
              onVectorChange({ ...vector, master: parseFloat(e.target.value) })
            }
            className="w-full h-1 bg-resolve-750 accent-resolve-orange"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-resolve-950 p-3 overflow-y-auto select-none">
      {/* Top Header: Look Presets & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-resolve-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-resolve-orange" />
          <span className="font-bold text-gray-200 text-sm">DAVINCI 3-WAY COLOR WHEELS</span>
          {settings.presetName && (
            <span className="text-xs bg-resolve-800 text-resolve-orange px-2 py-0.5 rounded font-mono border border-resolve-700">
              {settings.presetName}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={resetAll}
            className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white bg-resolve-900 border border-resolve-700 px-2 py-1 rounded transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* 1-Click Cinematic Looks Presets Bar */}
      <div className="flex items-center space-x-1.5 py-2.5 overflow-x-auto">
        <span className="text-[11px] text-gray-500 font-mono flex items-center space-x-1 mr-1">
          <Sparkles className="w-3 h-3 text-resolve-orange" />
          <span>LUTs:</span>
        </span>
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => onChange({ ...settings, ...p.settings })}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition border ${
              settings.presetName === p.name
                ? 'bg-resolve-orange text-black border-resolve-orange font-bold shadow-md shadow-orange-500/20'
                : 'bg-resolve-900 text-gray-300 border-resolve-800 hover:border-resolve-700 hover:text-white'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* 4 Color Wheels Row (Lift, Gamma, Gain, Offset) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3">
        {renderColorWheel('LIFT', 'Shadows', settings.lift, (lift) =>
          onChange({ ...settings, lift })
        )}
        {renderColorWheel('GAMMA', 'Midtones', settings.gamma, (gamma) =>
          onChange({ ...settings, gamma })
        )}
        {renderColorWheel('GAIN', 'Highlights', settings.gain, (gain) =>
          onChange({ ...settings, gain })
        )}
        {renderColorWheel('OFFSET', 'Global', settings.offset, (offset) =>
          onChange({ ...settings, offset })
        )}
      </div>

      {/* Sliders: Temperature, Tint, Contrast, Saturation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-resolve-900 border border-resolve-800 rounded-lg p-3 mt-1">
        {/* Temperature */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between text-xs text-gray-400 font-mono">
            <span>TEMP (Kelvin)</span>
            <span className={settings.temperature > 0 ? 'text-amber-400' : settings.temperature < 0 ? 'text-cyan-400' : 'text-gray-400'}>
              {settings.temperature > 0 ? `+${settings.temperature}` : settings.temperature}
            </span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            value={settings.temperature}
            onChange={(e) => onChange({ ...settings, temperature: parseInt(e.target.value) })}
            className="w-full h-1 bg-gradient-to-r from-cyan-600 via-gray-700 to-amber-600 accent-amber-500"
          />
        </div>

        {/* Tint */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between text-xs text-gray-400 font-mono">
            <span>TINT</span>
            <span className={settings.tint > 0 ? 'text-pink-400' : settings.tint < 0 ? 'text-emerald-400' : 'text-gray-400'}>
              {settings.tint > 0 ? `+${settings.tint}` : settings.tint}
            </span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            value={settings.tint}
            onChange={(e) => onChange({ ...settings, tint: parseInt(e.target.value) })}
            className="w-full h-1 bg-gradient-to-r from-emerald-600 via-gray-700 to-pink-600 accent-pink-500"
          />
        </div>

        {/* Contrast */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between text-xs text-gray-400 font-mono">
            <span>CONTRAST</span>
            <span className="text-resolve-orange">{settings.contrast}</span>
          </div>
          <input
            type="range"
            min={-50}
            max={100}
            value={settings.contrast}
            onChange={(e) => onChange({ ...settings, contrast: parseInt(e.target.value) })}
            className="w-full h-1 bg-resolve-750 accent-resolve-orange"
          />
        </div>

        {/* Saturation */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between text-xs text-gray-400 font-mono">
            <span>SATURATION</span>
            <span className="text-resolve-cyan">{settings.saturation}</span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={settings.saturation}
            onChange={(e) => onChange({ ...settings, saturation: parseInt(e.target.value) })}
            className="w-full h-1 bg-resolve-750 accent-resolve-cyan"
          />
        </div>
      </div>
    </div>
  );
};
