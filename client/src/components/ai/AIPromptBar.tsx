import React, { useState } from 'react';
import { Sparkles, Send, Scissors, Palette, Subtitles, Zap, ZoomIn, Camera } from 'lucide-react';

interface AIPromptBarProps {
  onSubmitPrompt: (prompt: string) => void;
  isProcessing: boolean;
  modelName: string;
  aiSummary: string | null;
  onUploadPhotos?: () => void;
  photosCount?: number;
  onOpenMultiComposer?: () => void;
}

export const AIPromptBar: React.FC<AIPromptBarProps> = ({
  onSubmitPrompt,
  isProcessing,
  modelName,
  aiSummary,
  onUploadPhotos,
  photosCount = 0,
  onOpenMultiComposer,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');

  const quickChips = [
    {
      label: photosCount > 0 ? `📸 Rebuild Reel with My ${photosCount} Photos` : '📸 10 Photos to Attitude Reel',
      icon: <Camera className="w-3 h-3 text-pink-400" />,
      prompt: photosCount > 0 ? `Create an attitude reel using my ${photosCount} uploaded photos with trending song and transitions` : 'Create a rich attitude reel from 10 photos with trending song and transitions',
    },
    {
      label: '🔥 Trending Attitude Hindi Reel',
      icon: <Zap className="w-3 h-3 text-amber-400" />,
      prompt: 'Make this video an attitude reel on trending attitude hindi song with top 3 choices',
    },
    {
      label: 'Auto-cut silences',
      icon: <Scissors className="w-3 h-3 text-resolve-orange" />,
      prompt: 'Auto-cut all awkward silences, pauses, and dead air to maximize pacing.',
    },
    {
      label: 'Teal & Orange Grade',
      icon: <Palette className="w-3 h-3 text-cyan-400" />,
      prompt: 'Apply a high-end Hollywood cinematic Teal & Orange color grade with rich contrast.',
    },
    {
      label: 'Hormozi Captions',
      icon: <Subtitles className="w-3 h-3 text-yellow-400" />,
      prompt: 'Generate bold Alex Hormozi dynamic animated subtitles with bright yellow active highlights.',
    },
    {
      label: 'Punch-in Zooms',
      icon: <ZoomIn className="w-3 h-3 text-purple-400" />,
      prompt: 'Add dynamic punch-in zoom keyframes on key punchlines and high-energy statements.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isProcessing) return;
    onSubmitPrompt(inputPrompt.trim());
    setInputPrompt('');
  };

  const handleChipClick = (prompt: string) => {
    if (isProcessing) return;
    onSubmitPrompt(prompt);
  };

  return (
    <div className="bg-resolve-900 border-b border-resolve-800 p-2.5 flex flex-col space-y-2 select-none z-20">
      {/* Quick Prompt Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
        <span className="text-[11px] font-mono text-gray-500 flex items-center space-x-1 mr-1">
          <Sparkles className="w-3 h-3 text-resolve-orange" />
          <span>Quick Prompts:</span>
        </span>

        {photosCount > 0 && (
          <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono flex items-center space-x-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{photosCount} Photos Loaded</span>
          </span>
        )}

        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleChipClick(chip.prompt)}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 bg-resolve-850 hover:bg-resolve-800 border border-resolve-750 hover:border-resolve-700 text-gray-300 hover:text-white px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition disabled:opacity-50"
          >
            {chip.icon}
            <span>{chip.label}</span>
          </button>
        ))}

        {onUploadPhotos && (
          <button
            type="button"
            onClick={onUploadPhotos}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-pink-600/30 to-purple-600/30 hover:from-pink-600/50 hover:to-purple-600/50 border border-pink-500/40 hover:border-pink-400 text-pink-200 hover:text-white px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition disabled:opacity-50 shadow-sm"
          >
            <Camera className="w-3 h-3 text-pink-400" />
            <span>{photosCount > 0 ? `Change Photos (${photosCount})` : 'Upload 10 Photos'}</span>
          </button>
        )}

        {onOpenMultiComposer && (
          <button
            type="button"
            onClick={onOpenMultiComposer}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-violet-600/40 via-indigo-600/40 to-purple-600/40 hover:from-violet-600/60 hover:to-indigo-600/60 border border-violet-500/50 hover:border-violet-400 text-violet-200 hover:text-white px-3 py-1 rounded text-xs font-bold whitespace-nowrap transition disabled:opacity-50 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>Multi-Asset + Prompt Studio</span>
          </button>
        )}
      </div>

      {/* Main AI Input Bar */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 text-resolve-orange pointer-events-none">
            <Sparkles className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isProcessing}
            placeholder={`Tell Editron how to edit this video (powered by ${modelName})... e.g. "Cut out pauses, make it moody vintage film, add bouncy captions"`}
            className="w-full bg-resolve-950 border border-resolve-800 focus:border-resolve-orange rounded-lg pl-9 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-resolve-orange transition"
          />
        </div>

        <button
          type="submit"
          disabled={!inputPrompt.trim() || isProcessing}
          className="flex items-center space-x-1.5 bg-resolve-orange hover:bg-resolve-orange-hover text-black font-bold px-4 py-2 rounded-lg text-xs transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isProcessing ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Editing...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Generate Edits</span>
            </>
          )}
        </button>
      </form>

      {/* AI Director Feedback Summary Banner */}
      {aiSummary && (
        <div className="bg-resolve-950/80 border border-resolve-orange/40 rounded-md p-2 flex items-start space-x-2 text-xs text-gray-300 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-resolve-orange shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-resolve-orange mr-1 font-mono">AI Director:</span>
            <span>{aiSummary}</span>
          </div>
        </div>
      )}
    </div>
  );
};
