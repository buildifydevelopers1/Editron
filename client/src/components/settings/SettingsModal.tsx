import React, { useState } from 'react';
import { X, Key, Cpu, Mic, Globe, Save, CheckCircle2 } from 'lucide-react';
import { AppConfig } from '../../types';
import { updateConfig } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig | null;
  onConfigUpdated: (newConfig: AppConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [llmModel, setLlmModel] = useState(config?.llmModel || 'gpt-oss-120b');
  const [whisperModel, setWhisperModel] = useState(config?.whisperModel || 'whisper-large-v3');
  const [visionModel, setVisionModel] = useState(config?.visionModel || 'llama-3.2-11b-vision-preview');
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || 'https://api.groq.com/openai/v1');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        llmModel,
        whisperModel,
        visionModel,
        baseUrl,
      };
      if (apiKey.trim()) {
        payload.apiKey = apiKey.trim();
      }

      const res = await updateConfig(payload);
      if (res.success) {
        onConfigUpdated(res.config);
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to update config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-resolve-900 border border-resolve-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-resolve-800">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-resolve-orange" />
            <h2 className="font-bold text-white text-base">AI Model & API Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-resolve-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-400">
          All values default to your <code className="text-resolve-orange font-mono">.env</code> configuration.
          You can also switch models or set your API key here without modifying the codebase.
        </p>

        <form onSubmit={handleSave} className="space-y-3">
          {/* API Key */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-300 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-resolve-orange" />
                <span>GROQ / OPENAI API KEY</span>
              </span>
              {config?.hasApiKey && (
                <span className="text-[10px] text-emerald-400 font-sans">
                  Active: {config.apiKeyMasked}
                </span>
              )}
            </label>
            <input
              type="password"
              placeholder={config?.hasApiKey ? '••••••••••••••••••••' : 'gsk_... (Leave blank for Demo Mode)'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-resolve-950 border border-resolve-800 focus:border-resolve-orange rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
            />
            <p className="text-[10px] text-gray-500">
              Leave blank to run in offline/demo mode with instant intelligent mock results.
            </p>
          </div>

          {/* LLM Model Name */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-300 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>LLM REASONING MODEL</span>
            </label>
            <input
              type="text"
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              placeholder="gpt-oss-120b"
              className="w-full bg-resolve-950 border border-resolve-800 focus:border-resolve-orange rounded px-3 py-2 text-xs text-white placeholder-gray-600 font-mono focus:outline-none"
            />
            <p className="text-[10px] text-gray-500">
              Default: <code className="text-cyan-400">gpt-oss-120b</code>. Can also be set to <code className="text-gray-400">llama-3.3-70b-versatile</code>.
            </p>
          </div>

          {/* Whisper Model Name */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-300 flex items-center space-x-1">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>WHISPER TRANSCRIPTION MODEL</span>
            </label>
            <input
              type="text"
              value={whisperModel}
              onChange={(e) => setWhisperModel(e.target.value)}
              placeholder="whisper-large-v3"
              className="w-full bg-resolve-950 border border-resolve-800 focus:border-resolve-orange rounded px-3 py-2 text-xs text-white placeholder-gray-600 font-mono focus:outline-none"
            />
          </div>

          {/* Vision Model Name */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-300 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>MULTIMODAL VISION MODEL</span>
            </label>
            <input
              type="text"
              value={visionModel}
              onChange={(e) => setVisionModel(e.target.value)}
              placeholder="llama-3.2-11b-vision-preview"
              className="w-full bg-resolve-950 border border-resolve-800 focus:border-resolve-orange rounded px-3 py-2 text-xs text-white placeholder-gray-600 font-mono focus:outline-none"
            />
            <p className="text-[10px] text-gray-500">
              Default: <code className="text-cyan-400">llama-3.2-11b-vision-preview</code> or <code className="text-gray-400">llama-3.2-90b-vision-preview</code>.
            </p>
          </div>

          {/* Base URL */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-300 flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>BASE URL (API ENDPOINT)</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.groq.com/openai/v1"
              className="w-full bg-resolve-950 border border-resolve-800 focus:border-resolve-orange rounded px-3 py-2 text-xs text-white placeholder-gray-600 font-mono focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-resolve-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 bg-resolve-orange hover:bg-resolve-orange-hover text-black font-bold px-4 py-1.5 rounded text-xs transition shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
