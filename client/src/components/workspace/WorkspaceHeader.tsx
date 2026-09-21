import React from 'react';
import {
  Film,
  Scissors,
  Layers,
  Palette,
  Subtitles,
  Share2,
  Settings,
  Sparkles,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Zap,
  Music,
  Undo2,
  Redo2,
  Wand2
} from 'lucide-react';
import { WorkspacePage, AppConfig } from '../../types';

interface WorkspaceHeaderProps {
  currentPage: WorkspacePage;
  onPageChange: (page: WorkspacePage) => void;
  config: AppConfig | null;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenVision: () => void;
  onOpenMusic: () => void;
  onOpenSubtitleGallery: () => void;
  onOpenMultiComposer?: () => void;
  onUploadClick: () => void;
  isProcessing: boolean;
  processingStatus: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  currentPage,
  onPageChange,
  config,
  onOpenSettings,
  onOpenExport,
  onOpenVision,
  onOpenMusic,
  onOpenSubtitleGallery,
  onOpenMultiComposer,
  onUploadClick,
  isProcessing,
  processingStatus,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const pages: { id: WorkspacePage; label: string; icon: React.ReactNode }[] = [
    { id: 'media', label: 'Media', icon: <Film className="w-4 h-4" /> },
    { id: 'cut', label: 'Cut', icon: <Scissors className="w-4 h-4" /> },
    { id: 'edit', label: 'Edit', icon: <Layers className="w-4 h-4" /> },
    { id: 'color', label: 'Color', icon: <Palette className="w-4 h-4" /> },
    { id: 'effects', label: 'Effects', icon: <Zap className="w-4 h-4" /> },
    { id: 'subtitles', label: 'Subtitles', icon: <Subtitles className="w-4 h-4" /> },
    { id: 'deliver', label: 'Deliver', icon: <Share2 className="w-4 h-4" /> },
  ];

  return (
    <header className="h-12 bg-resolve-900 border-b border-resolve-800 flex items-center justify-between px-3 select-none z-30">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-gradient-to-tr from-resolve-orange to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-extrabold tracking-wider text-white text-base">
            EDIT<span className="text-resolve-orange">RON</span>
          </span>
        </div>

        <div className="h-4 w-px bg-resolve-700 mx-1" />

        <div className="text-xs text-gray-400 font-mono flex items-center space-x-1.5">
          <span className="text-gray-300 font-semibold">Master_Timeline_v1</span>
          <span className="text-resolve-500">• 4K / 30fps</span>
        </div>

        <div className="h-4 w-px bg-resolve-700 mx-1" />

        {/* Undo & Redo Quick Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 rounded transition ${
              canUndo
                ? 'text-gray-300 hover:text-white hover:bg-resolve-800 cursor-pointer'
                : 'text-gray-600 cursor-not-allowed opacity-40'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
            className={`p-1.5 rounded transition ${
              canRedo
                ? 'text-gray-300 hover:text-white hover:bg-resolve-800 cursor-pointer'
                : 'text-gray-600 cursor-not-allowed opacity-40'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* DaVinci Resolve Style Navigation Tabs */}
      <div className="flex items-center space-x-1 bg-resolve-950/80 p-1 rounded-md border border-resolve-800/80">
        {pages.map((p) => {
          const isActive = currentPage === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onPageChange(p.id)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-resolve-800 text-resolve-orange shadow-sm font-semibold border border-resolve-700/60'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-resolve-850'
              }`}
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: AI Model Badge, Upload, Settings & Export */}
      <div className="flex items-center space-x-2">
        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center space-x-2 bg-resolve-850 border border-resolve-orange/40 text-resolve-orange px-2.5 py-1 rounded text-xs animate-pulse">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span className="max-w-[150px] truncate">{processingStatus || 'AI Editing...'}</span>
          </div>
        )}

        {/* AI Model Badge */}
        <button
          onClick={onOpenSettings}
          title="Configure AI Model & API Key"
          className="flex items-center space-x-1.5 bg-resolve-850 hover:bg-resolve-800 border border-resolve-700 text-gray-300 hover:text-white px-2.5 py-1 rounded text-xs transition"
        >
          <div className={`w-2 h-2 rounded-full ${config?.hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="font-mono text-[11px] text-gray-300">
            {config?.llmModel || 'gpt-oss-120b'}
          </span>
        </button>

        {/* Multimodal Vision Analysis Button */}
        <button
          onClick={onOpenVision}
          title="Multimodal Scene & Vision Understanding"
          className="flex items-center space-x-1.5 bg-resolve-850 hover:bg-resolve-800 border border-cyan-500/40 text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded text-xs transition font-medium"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vision AI</span>
        </button>

        {/* Live Internet Music Engine */}
        <button
          onClick={onOpenMusic}
          title="Search Live Internet Music (Apple Music / Global CDN)"
          className="flex items-center space-x-1.5 bg-resolve-850 hover:bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded text-xs transition font-medium"
        >
          <Music className="w-3.5 h-3.5" />
          <span>Music</span>
        </button>

        {/* 18 Subtitle Styles Studio */}
        <button
          onClick={onOpenSubtitleGallery}
          title="Browse 18 Subtitle Presets (Hormozi, MrBeast, Neon, etc.)"
          className="flex items-center space-x-1.5 bg-resolve-850 hover:bg-amber-950/60 border border-amber-500/40 text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded text-xs transition font-medium"
        >
          <Subtitles className="w-3.5 h-3.5" />
          <span>Subtitles</span>
        </button>

        {/* Multi-Asset AI Composer Button */}
        {onOpenMultiComposer && (
          <button
            onClick={onOpenMultiComposer}
            title="Upload Photos, Videos, Music & Prompt Simultaneously"
            className="flex items-center space-x-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white px-3 py-1 rounded text-xs font-bold transition shadow-md shadow-indigo-500/20"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>AI Composer</span>
          </button>
        )}

        {/* Upload Button */}
        <button
          onClick={onUploadClick}
          className="flex items-center space-x-1.5 bg-resolve-800 hover:bg-resolve-750 border border-resolve-700 text-gray-200 px-2.5 py-1 rounded text-xs transition font-medium"
        >
          <UploadCloud className="w-3.5 h-3.5 text-resolve-cyan" />
          <span>Import</span>
        </button>

        {/* Deliver / Export Action */}
        <button
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-resolve-orange to-orange-600 hover:from-resolve-orange-hover hover:to-orange-500 text-black px-3 py-1 rounded text-xs font-bold transition shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-black" />
          <span>Export</span>
        </button>

        {/* Settings Gear */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-resolve-800 rounded transition"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
