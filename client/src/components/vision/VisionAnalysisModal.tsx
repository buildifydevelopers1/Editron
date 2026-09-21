import React from 'react';
import {
  X,
  Eye,
  Sparkles,
  Sun,
  Video,
  Smile,
  CheckCircle2,
  Layers,
  ArrowRight,
  Camera
} from 'lucide-react';
import { KeyframeItem, VisionAnalysis } from '../../types';

interface VisionAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: KeyframeItem[];
  analysis: VisionAnalysis | null;
  onApplyColorRecommendations: (color: any) => void;
  onApplyMemeSuggestions: (suggestions: any[]) => void;
  modelName: string;
}

export const VisionAnalysisModal: React.FC<VisionAnalysisModalProps> = ({
  isOpen,
  onClose,
  frames,
  analysis,
  onApplyColorRecommendations,
  onApplyMemeSuggestions,
  modelName,
}) => {
  if (!isOpen || !analysis) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-resolve-900 border border-resolve-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp overflow-y-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-resolve-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Eye className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">MULTIMODAL SCENE & VISION AI</h2>
              <p className="text-[11px] text-gray-400 font-mono">
                Powered by <span className="text-cyan-400">{modelName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-resolve-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Extracted Keyframes Row */}
        {frames.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-gray-400 flex items-center space-x-1">
              <Camera className="w-3.5 h-3.5 text-resolve-orange" />
              <span>EXTRACTED SCENE KEYFRAMES ({frames.length})</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {frames.map((frame, idx) => (
                <div
                  key={idx}
                  className="aspect-video bg-black rounded-lg overflow-hidden relative border border-resolve-800 shadow"
                >
                  <img src={frame.url} alt={`Frame ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[9px] font-mono text-gray-300">
                    {frame.timestamp.toFixed(1)}s
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 Scene Diagnosis Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-resolve-950 border border-resolve-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 flex items-center space-x-1">
              <Video className="w-3 h-3" />
              <span>SHOT TYPE & COMPOSITION</span>
            </span>
            <div className="text-xs font-bold text-white">{analysis.shotType}</div>
          </div>

          <div className="bg-resolve-950 border border-resolve-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-mono text-amber-400 flex items-center space-x-1">
              <Sun className="w-3 h-3" />
              <span>LIGHTING QUALITY</span>
            </span>
            <div className="text-xs font-bold text-white">{analysis.lightingQuality}</div>
          </div>

          <div className="bg-resolve-950 border border-resolve-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-mono text-pink-400 flex items-center space-x-1">
              <Smile className="w-3 h-3" />
              <span>EMOTIONAL TONE</span>
            </span>
            <div className="text-xs font-bold text-white">{analysis.emotionalTone}</div>
          </div>

          <div className="bg-resolve-950 border border-resolve-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
              <Layers className="w-3 h-3" />
              <span>SUBJECT FRAMING</span>
            </span>
            <div className="text-xs font-bold text-white">{analysis.faceFraming}</div>
          </div>
        </div>

        {/* Scene Description */}
        <div className="bg-resolve-950/70 border border-resolve-800 rounded-xl p-3 text-xs text-gray-300 leading-relaxed">
          <span className="font-bold text-gray-200 block mb-1 font-mono text-[11px]">
            AI DIRECTOR OBSERVATION:
          </span>
          {analysis.sceneDescription}
        </div>

        {/* Action 1: Recommended Color Grade */}
        {analysis.colorRecommendations && (
          <div className="bg-gradient-to-r from-orange-950/30 to-amber-950/30 border border-resolve-orange/40 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-resolve-orange">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended Color Look: {analysis.colorRecommendations.presetName}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Optimized Kelvin, Tint balance, and Contrast to suit this scene's lighting.
              </p>
            </div>
            <button
              onClick={() => {
                onApplyColorRecommendations(analysis.colorRecommendations);
                onClose();
              }}
              className="bg-resolve-orange hover:bg-resolve-orange-hover text-black font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center space-x-1 shadow-sm shrink-0"
            >
              <span>Apply Grade</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Action 2: Recommended Memes & B-Roll */}
        {analysis.memeAndBrollSuggestions && analysis.memeAndBrollSuggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-gray-400 flex items-center space-x-1">
                <Smile className="w-3.5 h-3.5 text-yellow-400" />
                <span>AI SUGGESTED MEMES & SOUND EFFECTS</span>
              </label>
              <button
                onClick={() => {
                  onApplyMemeSuggestions(analysis.memeAndBrollSuggestions);
                  onClose();
                }}
                className="text-xs text-yellow-400 hover:text-yellow-300 font-bold"
              >
                + Insert All Suggested
              </button>
            </div>

            <div className="space-y-1.5">
              {analysis.memeAndBrollSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-resolve-950 border border-resolve-800 rounded-lg p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold font-mono bg-resolve-800 text-gray-300">
                      {item.type}
                    </span>
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="text-gray-500 font-mono text-[11px]">at {item.timestamp}s</span>
                  </div>
                  <span className="text-[11px] text-gray-400 italic">{item.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end pt-2 border-t border-resolve-800">
          <button
            onClick={onClose}
            className="bg-resolve-800 hover:bg-resolve-750 text-gray-200 px-4 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
