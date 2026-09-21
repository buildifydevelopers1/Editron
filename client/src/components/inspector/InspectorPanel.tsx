import React from 'react';
import { Sliders, Move, RotateCw, Eye, Volume2, Info, RotateCcw } from 'lucide-react';
import { TransformSettings, VideoClip } from '../../types';

interface InspectorPanelProps {
  selectedClip: VideoClip | null;
  transform: TransformSettings;
  onTransformChange: (t: TransformSettings) => void;
  audioVolume: number;
  onAudioVolumeChange: (vol: number) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedClip,
  transform,
  onTransformChange,
  audioVolume,
  onAudioVolumeChange,
}) => {
  const resetTransform = () => {
    onTransformChange({
      scale: 1.0,
      positionX: 0,
      positionY: 0,
      rotation: 0,
      opacity: 1.0,
    });
  };

  return (
    <div className="w-72 bg-resolve-900 border-l border-resolve-800 flex flex-col select-none overflow-y-auto z-10">
      {/* Inspector Header */}
      <div className="h-9 bg-resolve-850 border-b border-resolve-800 px-3 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 font-bold text-gray-200">
          <Sliders className="w-3.5 h-3.5 text-resolve-orange" />
          <span>INSPECTOR</span>
        </div>
        <button
          onClick={resetTransform}
          className="text-gray-500 hover:text-gray-200 p-1"
          title="Reset Transforms"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Active Clip Status */}
        <div className="bg-resolve-850 border border-resolve-800 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-mono">
            <Info className="w-3.5 h-3.5 text-resolve-cyan" />
            <span>CLIP PROPERTIES</span>
          </div>
          {selectedClip ? (
            <div className="text-xs space-y-1 mt-1 font-mono">
              <div className="text-white font-semibold truncate">{selectedClip.name}</div>
              <div className="text-gray-400 text-[11px] flex justify-between">
                <span>Duration:</span>
                <span className="text-resolve-orange">
                  {(selectedClip.end - selectedClip.start).toFixed(2)}s
                </span>
              </div>
              <div className="text-gray-400 text-[11px] flex justify-between">
                <span>Track:</span>
                <span className="text-gray-200 uppercase">{selectedClip.trackId}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">Global timeline output selected</p>
          )}
        </div>

        {/* Video Transform Section */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-300 font-mono flex items-center space-x-1 border-b border-resolve-800 pb-1">
            <Move className="w-3 h-3 text-resolve-orange" />
            <span>VIDEO TRANSFORM</span>
          </div>

          {/* Scale / Zoom */}
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>ZOOM (Scale)</span>
              <span className="text-resolve-orange">{transform.scale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.05}
              value={transform.scale}
              onChange={(e) =>
                onTransformChange({ ...transform, scale: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-resolve-750 accent-resolve-orange"
            />
          </div>

          {/* Position X (Pan) */}
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>POSITION X</span>
              <span className="text-gray-300">{transform.positionX}px</span>
            </div>
            <input
              type="range"
              min={-200}
              max={200}
              step={2}
              value={transform.positionX}
              onChange={(e) =>
                onTransformChange({ ...transform, positionX: parseInt(e.target.value) })
              }
              className="w-full h-1 bg-resolve-750 accent-resolve-orange"
            />
          </div>

          {/* Position Y (Tilt) */}
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>POSITION Y</span>
              <span className="text-gray-300">{transform.positionY}px</span>
            </div>
            <input
              type="range"
              min={-200}
              max={200}
              step={2}
              value={transform.positionY}
              onChange={(e) =>
                onTransformChange({ ...transform, positionY: parseInt(e.target.value) })
              }
              className="w-full h-1 bg-resolve-750 accent-resolve-orange"
            />
          </div>

          {/* Rotation */}
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>ROTATION</span>
              <span className="text-gray-300">{transform.rotation}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={transform.rotation}
              onChange={(e) =>
                onTransformChange({ ...transform, rotation: parseInt(e.target.value) })
              }
              className="w-full h-1 bg-resolve-750 accent-resolve-orange"
            />
          </div>

          {/* Opacity */}
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>OPACITY</span>
              <span className="text-gray-300">{Math.round(transform.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={transform.opacity}
              onChange={(e) =>
                onTransformChange({ ...transform, opacity: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-resolve-750 accent-resolve-orange"
            />
          </div>
        </div>

        {/* Audio Controls */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-gray-300 font-mono flex items-center space-x-1 border-b border-resolve-800 pb-1">
            <Volume2 className="w-3 h-3 text-cyan-400" />
            <span>AUDIO LEVEL</span>
          </div>

          <div className="flex flex-col space-y-1">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>MASTER GAIN</span>
              <span className="text-cyan-400">{Math.round(audioVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={audioVolume}
              onChange={(e) => onAudioVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-resolve-750 accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
