import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Eye,
  CheckCircle2,
  Wand2,
  Sliders,
  Layers,
  ArrowRight,
  Flame,
  Palette,
  Subtitles,
  Film,
  Zap,
  Play
} from 'lucide-react';
import { AutonomousDirectorResult, requestAutonomousDirectorLoop } from '../../services/api';
import { resolveAssetUrl } from '../../utils/assetUrl';

interface AutonomousDirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoPath: string;
  duration: number;
  userPhotos?: any[];
  onApplyMaster: (masterPlan: any) => void;
}

export const AutonomousDirectorModal: React.FC<AutonomousDirectorModalProps> = ({
  isOpen,
  onClose,
  videoPath,
  duration,
  userPhotos = [],
  onApplyMaster,
}) => {
  const [prompt, setPrompt] = useState('Create a viral high-energy attitude reel with beat-synced cuts, 3D transitions and punchy captions');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [result, setResult] = useState<AutonomousDirectorResult | null>(null);

  if (!isOpen) return null;

  const handleRunLoop = async (customPrompt?: string) => {
    const activePrompt = (customPrompt || prompt).trim();
    if (!activePrompt) return;

    setIsProcessing(true);
    setResult(null);
    setProcessStep(1);
    setStatusMessage('Pass 1/3: Chief AI Director (gpt-oss-120b) synthesizing draft cuts, color grade & audio sync...');

    try {
      // Realistic multi-stage visual feedback
      const timer1 = setTimeout(() => {
        setProcessStep(2);
        setStatusMessage('Pass 2/3: Multimodal Vision Model (llama-3.2-11b-vision-preview) inspecting keyframes for lighting, framing & contrast...');
      }, 2000);

      const timer2 = setTimeout(() => {
        setProcessStep(3);
        setStatusMessage('Pass 3/3: Incorporating Vision Critic feedback into final self-improved master timeline...');
      }, 4500);

      const res = await requestAutonomousDirectorLoop({
        prompt: activePrompt,
        videoPath,
        duration,
        photos: userPhotos,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      setResult(res);
      setProcessStep(3);
      setStatusMessage('Autonomous Editing & Vision Refinement Complete!');
    } catch (err: any) {
      console.error('Autonomous Director error:', err);
      alert(`Autonomous Director loop error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (result && result.finalPlan) {
      onApplyMaster(result.finalPlan);
      onClose();
    }
  };

  const presetChips = [
    '🔥 Viral Attitude Reel with Heavy Bass Drop',
    '🎬 Cinematic Hollywood Teal & Orange Grade',
    '⚡ Cyberpunk Neon Glitch with Fast Cuts',
    '🌟 High-Energy Motivational Reel with Hormozi Captions',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-resolve-900 border border-resolve-700/80 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-resolve-950 border-b border-resolve-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  AUTONOMOUS AI DIRECTOR & VISION FEEDBACK LOOP
                </h2>
                <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">
                  gpt-oss-120b + Llama 3.2 Vision
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Plan Edit &rarr; Vision Model Inspects Frames &rarr; Self-Improves into Final Polished Master
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-resolve-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Prompt & Trigger Section */}
          <div className="bg-resolve-850 border border-resolve-750 rounded-lg p-4 space-y-3">
            <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>DIRECTOR'S CREATIVE MANDATE</span>
              </span>
              <span className="text-[11px] font-mono text-gray-500">
                Duration: {duration.toFixed(1)}s • {userPhotos.length > 0 ? `${userPhotos.length} Photos` : 'Video Track'}
              </span>
            </label>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isProcessing}
                placeholder="e.g. Create a 20s viral reel with high contrast, snappy cuts, and Alex Hormozi captions"
                className="flex-1 bg-resolve-950 border border-resolve-700 focus:border-indigo-400 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={() => handleRunLoop()}
                disabled={isProcessing || !prompt.trim()}
                className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition disabled:opacity-50 shadow-md shadow-indigo-500/25 whitespace-nowrap"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing & Refining...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Run Autonomous Loop</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {presetChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(chip);
                    handleRunLoop(chip);
                  }}
                  disabled={isProcessing}
                  className="px-2.5 py-1 text-[11px] font-medium bg-resolve-900 hover:bg-resolve-800 text-gray-300 hover:text-white rounded border border-resolve-750 transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Pass Step Visual Progress Tracker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className={`p-3 rounded-lg border transition ${
              processStep === 1
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30'
                : processStep > 1
                ? 'bg-resolve-850/80 border-emerald-500/40 text-emerald-400'
                : 'bg-resolve-850 border-resolve-800 text-gray-400'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold font-mono">PASS 1: DRAFT PLAN</span>
                {processStep > 1 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : processStep === 1 ? (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-gray-600" />
                )}
              </div>
              <p className="text-xs text-gray-300">
                gpt-oss-120b creates initial cuts, transitions, color grade & subtitle layout.
              </p>
            </div>

            {/* Step 2 */}
            <div className={`p-3 rounded-lg border transition ${
              processStep === 2
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 ring-1 ring-cyan-500/30'
                : processStep > 2
                ? 'bg-resolve-850/80 border-emerald-500/40 text-emerald-400'
                : 'bg-resolve-850 border-resolve-800 text-gray-400'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold font-mono">PASS 2: VISION CRITIC</span>
                {processStep > 2 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : processStep === 2 ? (
                  <Eye className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-gray-600" />
                )}
              </div>
              <p className="text-xs text-gray-300">
                Llama 3.2 Vision inspects keyframes for lighting, face framing, contrast & readability.
              </p>
            </div>

            {/* Step 3 */}
            <div className={`p-3 rounded-lg border transition ${
              processStep === 3 && isProcessing
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 ring-1 ring-purple-500/30'
                : processStep === 3 && result
                ? 'bg-resolve-850/80 border-emerald-500/40 text-emerald-400'
                : 'bg-resolve-850 border-resolve-800 text-gray-400'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold font-mono">PASS 3: MASTER POLISH</span>
                {result ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5 text-gray-600" />
                )}
              </div>
              <p className="text-xs text-gray-300">
                AI Director incorporates vision critique, fixes visual flaws, and outputs master timeline.
              </p>
            </div>
          </div>

          {/* Status ticker during processing */}
          {isProcessing && (
            <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-amber-400 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Pass 2 Vision Critic Inspection Panel */}
              <div className="bg-resolve-850 border border-resolve-750 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-resolve-750 pb-2">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-gray-200">
                      MULTIMODAL VISION CRITIC OBSERVATIONS (PASS 2)
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {result.frames?.length || 0} Keyframes Inspected
                  </span>
                </div>

                {/* Keyframe Previews */}
                {result.frames && result.frames.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {result.frames.map((frame, idx) => (
                      <div key={idx} className="relative rounded overflow-hidden border border-resolve-700 bg-black aspect-video group">
                        <img
                          src={resolveAssetUrl(frame.url)}
                          alt={`Keyframe ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300">
                          {frame.timestamp.toFixed(1)}s
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Critic Badges & Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded bg-resolve-900 border border-resolve-800">
                    <span className="text-[10px] text-gray-500 block font-mono">SHOT COMPOSITION</span>
                    <span className="text-gray-200 font-semibold">{result.visionCritique?.shotType || 'Medium Shot'}</span>
                  </div>
                  <div className="p-2 rounded bg-resolve-900 border border-resolve-800">
                    <span className="text-[10px] text-gray-500 block font-mono">LIGHTING QUALITY</span>
                    <span className="text-gray-200 font-semibold">{result.visionCritique?.lightingQuality || 'Standard Studio'}</span>
                  </div>
                  <div className="p-2 rounded bg-resolve-900 border border-resolve-800">
                    <span className="text-[10px] text-gray-500 block font-mono">FACE FRAMING</span>
                    <span className="text-gray-200 font-semibold">{result.visionCritique?.faceFraming || 'Centered Subject'}</span>
                  </div>
                  <div className="p-2 rounded bg-resolve-900 border border-resolve-800">
                    <span className="text-[10px] text-gray-500 block font-mono">EMOTIONAL TONE</span>
                    <span className="text-gray-200 font-semibold">{result.visionCritique?.emotionalTone || 'High Energy'}</span>
                  </div>
                </div>

                {result.visionCritique?.sceneDescription && (
                  <p className="text-xs text-gray-300 italic bg-resolve-900/60 p-2.5 rounded border border-resolve-800/80">
                    "{result.visionCritique.sceneDescription}"
                  </p>
                )}
              </div>

              {/* Pass 3 Self-Improvement & Master Timeline Improvements */}
              <div className="bg-gradient-to-br from-resolve-850 to-resolve-900 border border-indigo-500/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-resolve-750 pb-2">
                  <div className="flex items-center space-x-2">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      AUTONOMOUS SELF-IMPROVEMENTS APPLIED (PASS 3)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {result.improvements?.length || 0} Improvements Mastered
                  </span>
                </div>

                {/* Improvements List */}
                <div className="space-y-1.5">
                  {result.improvements?.map((imp, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-2 text-xs text-gray-200 bg-resolve-950/60 px-3 py-2 rounded border border-resolve-800"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>

                {/* Final Specifications Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-1">
                  <div className="p-2 rounded bg-resolve-950 border border-resolve-800">
                    <span className="text-[10px] text-gray-500 block font-mono">ASPECT RATIO</span>
                    <span className="text-amber-300 font-semibold">{result.finalPlan?.aspectRatio || '9:16'}</span>
                  </div>
                  <div className="p-2 rounded bg-resolve-950 border border-resolve-800">
                    <span className="text-[10px] text-gray-500 block font-mono">COLOR GRADE</span>
                    <span className="text-cyan-300 font-semibold">{result.finalPlan?.colorGrading?.presetName || 'Calibrated'}</span>
                  </div>
                  <div className="p-2 rounded bg-resolve-950 border border-resolve-800">
                    <span className="text-[10px] text-gray-500 block font-mono">SUBTITLE STYLE</span>
                    <span className="text-yellow-300 font-semibold uppercase">{result.finalPlan?.subtitleStyle?.preset || 'Hormozi'}</span>
                  </div>
                  <div className="p-2 rounded bg-resolve-950 border border-resolve-800">
                    <span className="text-[10px] text-gray-500 block font-mono">TRANSITIONS</span>
                    <span className="text-pink-300 font-semibold">{result.finalPlan?.transitions?.length || 0} Transitions</span>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  {result.finalPlan?.summary}
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-resolve-950 border-t border-resolve-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-resolve-800 transition"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-3">
            {result && (
              <button
                onClick={handleApply}
                className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold px-5 py-2 rounded-lg text-xs transition shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Apply Polished Master to Timeline</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
