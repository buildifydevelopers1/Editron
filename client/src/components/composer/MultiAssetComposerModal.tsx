import React, { useRef, useState } from 'react';
import {
  X,
  Sparkles,
  UploadCloud,
  Film,
  Music,
  Image as ImageIcon,
  Zap,
  Clock,
  Scissors,
  CheckCircle2,
  Trash2,
  Radio,
  Sliders,
  Flame,
  Loader2,
  Wand2,
  Eye
} from 'lucide-react';
import { AspectRatio } from '../../types';
import { generateMultiAssetReel, requestAutonomousDirectorLoop } from '../../services/api';

interface MultiAssetComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyReel: (reelPlan: any) => void;
}

export const MultiAssetComposerModal: React.FC<MultiAssetComposerModalProps> = ({
  isOpen,
  onClose,
  onApplyReel,
}) => {
  const [prompt, setPrompt] = useState('20 sec reel with most suitable or viral part of this song');
  const [targetDuration, setTargetDuration] = useState<number>(20);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [enableVisionLoop, setEnableVisionLoop] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStage, setProcessStage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter categorized assets
  const photoFiles = uploadedFiles.filter(
    (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(f.name)
  );
  const videoFiles = uploadedFiles.filter(
    (f) => f.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi)$/i.test(f.name)
  );
  const audioFiles = uploadedFiles.filter(
    (f) => f.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(f.name)
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    const newFiles = Array.from(selected);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setUploadedFiles([]);
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    setProcessStage('Scanning audio waveform & isolating viral chorus peak...');

    try {
      // Dynamic progress messaging for commercial feel
      const stageTimer1 = setTimeout(() => {
        setProcessStage('Consulting AI Director (gpt-oss-120b) for cut sequence...');
      }, 1500);

      const stageTimer2 = setTimeout(() => {
        setProcessStage(`Trimming audio to ${targetDuration}s peak hook with studio fades...`);
      }, 3000);

      const stageTimer3 = setTimeout(() => {
        setProcessStage('Aligning assets to beat drops & applying 3D transitions...');
      }, 4500);

      let plan = await generateMultiAssetReel({
        files: uploadedFiles,
        prompt: prompt.trim(),
        targetDuration,
        aspectRatio,
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      if (enableVisionLoop && plan) {
        setProcessStage('Multimodal Vision Critic inspecting composition & auto-calibrating master...');
        try {
          const visionResult = await requestAutonomousDirectorLoop({
            prompt: prompt.trim(),
            duration: targetDuration,
            photos: plan.uploadedPhotos || [],
          });
          if (visionResult && visionResult.finalPlan) {
            plan = {
              ...plan,
              colorGrading: visionResult.finalPlan.colorGrading || plan.colorGrading,
              subtitleStyle: visionResult.finalPlan.subtitleStyle || plan.subtitleStyle,
              transitions: visionResult.finalPlan.transitions?.length > 0 ? visionResult.finalPlan.transitions : plan.transitions,
              summary: `${plan.summary} [Vision Critic Mastered: ${visionResult.improvements?.slice(0, 2).join(' • ') || 'Calibrated'}]`,
            };
          }
        } catch (vErr) {
          console.warn('Vision loop refinement notice:', vErr);
        }
      }

      if (plan) {
        onApplyReel(plan);
        onClose();
      }
    } catch (err: any) {
      console.error('Multi-Asset Reel generation failed:', err);
      alert(`Generation notice: ${err.message || 'Error compiling reel'}`);
    } finally {
      setIsProcessing(false);
      setProcessStage('');
    }
  };

  const quickDurations = [15, 20, 30, 60];
  const quickVibes = [
    { label: '🔥 Viral Attitude', promptText: 'attitude reel with hard beat drop, high contrast noir look and aggressive Hormozi captions' },
    { label: '⚡ Punjabi Drill', promptText: 'high energy Punjabi drill style reel with fast transitions and neon captions' },
    { label: '🎧 Hip-Hop / Rap', promptText: 'underground rap reel with 35mm grain, shake impact and bold yellow subtitles' },
    { label: '🌌 Phonk & Bass', promptText: 'drift phonk reel with RGB split aberration and cyber glitch transitions' },
    { label: '☕ Aesthetic Lo-Fi', promptText: 'aesthetic chill reel with warm film look, smooth dissolves and typewriter text' },
    { label: '🎬 Cinematic Epic', promptText: 'cinematic blockbuster trailer with letterboxing and dramatic golden typography' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#141420] via-[#0d0d15] to-[#0a0a0f] border border-violet-500/30 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 text-white">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>SIMULTANEOUS MULTI-ASSET + PROMPT AI REEL COMPOSER</span>
                <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  AI HOOK EXTRACTOR
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Upload photos, videos, & a full song together with your prompt. AI extracts the viral chorus & builds your reel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Section 1: Multi-File Upload Drop Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                <UploadCloud className="w-4 h-4 text-violet-400" />
                <span>1. Upload Assets (Photos, Videos, Song)</span>
              </label>
              {uploadedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] text-red-400 hover:text-red-300 transition flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All ({uploadedFiles.length})</span>
                </button>
              )}
            </div>

            {/* Hidden Input for Multiple Files */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*"
              className="hidden"
            />

            {/* Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-violet-500/40 hover:border-violet-400 rounded-xl p-4 bg-violet-950/10 hover:bg-violet-950/20 transition cursor-pointer flex flex-col items-center justify-center text-center group"
            >
              <div className="flex items-center space-x-3 mb-2 text-violet-400 group-hover:scale-105 transition-transform">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Film className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <Music className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs font-bold text-gray-200">
                Click or Drag & Drop Multiple Photos, Videos, and Song Track
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Select 10 photos + 5-minute song file simultaneously (Supports PNG, JPG, MP4, MP3, WAV, M4A)
              </p>
            </div>

            {/* Uploaded Summary Badges */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[11px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2.5 py-1 rounded-lg font-mono flex items-center space-x-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{photoFiles.length} Photos</span>
                </span>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg font-mono flex items-center space-x-1.5">
                  <Film className="w-3.5 h-3.5" />
                  <span>{videoFiles.length} Videos</span>
                </span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-mono flex items-center space-x-1.5">
                  <Music className="w-3.5 h-3.5" />
                  <span>
                    {audioFiles.length > 0 ? `${audioFiles[0].name.slice(0, 24)}... (Master Audio)` : 'Auto Live Internet Beat'}
                  </span>
                </span>
              </div>
            )}

            {/* Uploaded Photos Thumbnails Tray */}
            {photoFiles.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
                {photoFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-700 shrink-0 group bg-gray-900 shadow"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0.5 left-0.5 bg-black/70 text-[9px] font-mono px-1 rounded text-white">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Simultaneous Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>2. Creative AI Prompt & Instructions</span>
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. 20 sec reel with most suitable or viral part of this song, fast 3D transitions, and neon captions..."
                className="w-full p-3 bg-[#0a0a10] border border-gray-700 focus:border-violet-500 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium transition resize-none"
              />
            </div>

            {/* Quick Vibe Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {quickVibes.map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => setPrompt(`Make a ${targetDuration} sec ${v.promptText}`)}
                  className="px-2.5 py-0.5 bg-gray-800/70 hover:bg-violet-950/80 text-gray-300 hover:text-violet-300 border border-gray-700 hover:border-violet-500/50 rounded-lg text-[11px] font-mono transition"
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Target Duration & Aspect Ratio Directives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Target Duration Selector */}
            <div className="bg-[#0e0e17] border border-gray-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Target Reel Duration</span>
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400">{targetDuration}s</span>
              </div>
              <div className="flex gap-2">
                {quickDurations.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setTargetDuration(d);
                      if (prompt.match(/\d+\s*(?:sec|second|s\b)/i)) {
                        setPrompt(prompt.replace(/\d+\s*(?:sec|second|s\b)/i, `${d} sec`));
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                      targetDuration === d
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:text-white'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500">
                AI will scan the 5-min song and automatically cut the most viral {targetDuration}s peak chorus!
              </p>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="bg-[#0e0e17] border border-gray-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aspect Ratio</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">{aspectRatio}</span>
              </div>
              <div className="flex gap-2">
                {(['9:16', '16:9', '1:1'] as AspectRatio[]).map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setAspectRatio(ar)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                      aspectRatio === ar
                        ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/20'
                        : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:text-white'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500">
                Vertical 9:16 is optimized for Instagram Reels, YouTube Shorts, & TikTok.
              </p>
            </div>

            {/* Autonomous Vision Critic & Self-Refinement Toggle */}
            <div className="bg-[#0e0e17] border border-indigo-500/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Wand2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-gray-200">Multimodal Vision Critic & Self-Refine</span>
                    <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                      Llama 3.2 Vision
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Inspects draft composition keyframes for lighting, framing & text contrast before mastering.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnableVisionLoop(!enableVisionLoop)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition border ${
                  enableVisionLoop
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/30'
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}
              >
                {enableVisionLoop ? 'ENABLED' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer: Generate Button & Progress */}
        <div className="pt-3 border-t border-gray-800 shrink-0 space-y-2">
          {isProcessing && (
            <div className="flex items-center space-x-2.5 bg-violet-950/40 border border-violet-500/40 p-2.5 rounded-xl text-xs text-violet-200 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400 shrink-0" />
              <span className="font-mono text-[11px] font-semibold">{processStage || 'AI Director generating master reel...'}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-mono">
              Auto-syncs cuts, 3D transitions, and audio drop to master timeline.
            </span>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-xs text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isProcessing || !prompt.trim()}
                className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition shadow-lg shadow-indigo-500/25 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compiling Reel...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate {targetDuration}s Viral Master Reel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
