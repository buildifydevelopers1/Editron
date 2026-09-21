import React, { useState } from 'react';
import { X, Download, Film, CheckCircle2, Loader2, Sparkles, Sliders, Volume2 } from 'lucide-react';
import { AspectRatio, ColorGradingSettings, SubtitleWord, VideoClip } from '../../types';
import { requestRender } from '../../services/api';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoPath: string;
  clips: VideoClip[];
  colorGrading: ColorGradingSettings;
  subtitles: SubtitleWord[];
  aspectRatio: AspectRatio;
  audioTrackPath?: string | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoPath,
  clips,
  colorGrading,
  subtitles,
  aspectRatio,
  audioTrackPath,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'webm'>('mp4');
  const [exportAspectRatio, setExportAspectRatio] = useState<AspectRatio>(aspectRatio);
  const [resolution, setResolution] = useState<'1080p' | '4k' | '720p'>('1080p');
  const [framerate, setFramerate] = useState<30 | 60>(30);
  const [burnSubtitles, setBurnSubtitles] = useState(true);
  const [includeColorGrade, setIncludeColorGrade] = useState(true);
  const [videoAudioVolume, setVideoAudioVolume] = useState(1.0);
  const [bgAudioVolume, setBgAudioVolume] = useState(0.8);
  const [isRendering, setIsRendering] = useState(false);
  const [renderDetails, setRenderDetails] = useState<{ resolution?: string; framerate?: number } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setIsRendering(true);
    setErrorMessage(null);
    setDownloadUrl(null);
    setRenderDetails(null);

    try {
      const result = await requestRender({
        videoPath,
        cuts: clips,
        audioTrackPath,
        videoAudioVolume,
        bgAudioVolume,
        colorGrading: includeColorGrade ? colorGrading : {
          temperature: 0,
          tint: 0,
          contrast: 0,
          saturation: 0,
          brightness: 0,
          lift: { r: 0, g: 0, b: 0, master: 0 },
          gamma: { r: 0, g: 0, b: 0, master: 0 },
          gain: { r: 0, g: 0, b: 0, master: 0 },
          offset: { r: 0, g: 0, b: 0, master: 0 },
        },
        subtitleWords: burnSubtitles ? subtitles : [],
        resolution,
        framerate,
        aspectRatio: exportAspectRatio,
      });

      if (result.success && result.downloadUrl) {
        setDownloadUrl(result.downloadUrl);
        setRenderDetails({
          resolution: result.resolution,
          framerate: result.framerate
        });
      }
    } catch (err: any) {
      console.error('Render error:', err);
      setErrorMessage(err.message || 'Rendering failed. Check FFmpeg output.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-resolve-900 border border-resolve-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-resolve-800">
          <div className="flex items-center space-x-2">
            <Film className="w-5 h-5 text-resolve-orange" />
            <h2 className="font-bold text-white text-base">DELIVER / EXPORT MASTER</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-resolve-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Form */}
        <div className="space-y-3.5 text-xs">
          {/* Format & Aspect Ratio */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-gray-400">FORMAT / CODEC</label>
              <select
                value={selectedFormat}
                onChange={(e: any) => setSelectedFormat(e.target.value)}
                className="w-full bg-resolve-950 border border-resolve-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-resolve-orange"
              >
                <option value="mp4">MP4 (H.264 / AAC High Master)</option>
                <option value="webm">WebM (VP9 / Opus)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-gray-400">ASPECT RATIO</label>
              <select
                value={exportAspectRatio}
                onChange={(e: any) => setExportAspectRatio(e.target.value)}
                className="w-full bg-resolve-950 border border-resolve-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-resolve-orange"
              >
                <option value="16:9">16:9 Landscape (YouTube / TV)</option>
                <option value="9:16">9:16 Vertical (Shorts / Reels / TikTok)</option>
                <option value="1:1">1:1 Square (Instagram Feed)</option>
                <option value="4:5">4:5 Portrait</option>
                <option value="2.39:1">2.39:1 Anamorphic Cinema</option>
              </select>
            </div>
          </div>

          {/* Master Resolution & Framerate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-gray-400">RESOLUTION MASTER</label>
              <select
                value={resolution}
                onChange={(e: any) => setResolution(e.target.value)}
                className="w-full bg-resolve-950 border border-resolve-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-resolve-orange"
              >
                <option value="1080p">1080p Full HD (Commercial Default)</option>
                <option value="4k">4K Ultra HD (Cinema Master)</option>
                <option value="720p">720p HD (Fast Preview)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-gray-400">FRAMERATE</label>
              <select
                value={framerate}
                onChange={(e: any) => setFramerate(parseInt(e.target.value, 10) as 30 | 60)}
                className="w-full bg-resolve-950 border border-resolve-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-resolve-orange"
              >
                <option value={30}>30 FPS (Standard Commercial)</option>
                <option value={60}>60 FPS (High-Motion Smooth)</option>
              </select>
            </div>
          </div>

          {/* Audio Multi-Track Mixing Balance */}
          {audioTrackPath && (
            <div className="bg-resolve-950 border border-resolve-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center space-x-1.5 text-resolve-orange font-mono font-semibold">
                <Volume2 className="w-3.5 h-3.5" />
                <span>MULTI-TRACK AUDIO MIX</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Video Audio</span>
                    <span>{Math.round(videoAudioVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.05}
                    value={videoAudioVolume}
                    onChange={(e) => setVideoAudioVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-resolve-800 accent-resolve-orange rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Background Track</span>
                    <span>{Math.round(bgAudioVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.05}
                    value={bgAudioVolume}
                    onChange={(e) => setBgAudioVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-resolve-800 accent-resolve-orange rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Render Options Checkboxes */}
          <div className="bg-resolve-950 border border-resolve-800 rounded-lg p-3 space-y-2">
            <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={burnSubtitles}
                onChange={(e) => setBurnSubtitles(e.target.checked)}
                className="rounded bg-resolve-850 border-resolve-700 text-resolve-orange focus:ring-0"
              />
              <span>Burn dynamic subtitles into video file</span>
            </label>

            <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeColorGrade}
                onChange={(e) => setIncludeColorGrade(e.target.checked)}
                className="rounded bg-resolve-850 border-resolve-700 text-resolve-orange focus:ring-0"
              />
              <span>Apply DaVinci Resolve color grade ({colorGrading.presetName || 'Active Grade'})</span>
            </label>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-2.5 bg-red-950/60 border border-red-800 rounded text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Success Download Banner */}
          {downloadUrl && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Master Render Complete!</span>
                </div>
                {renderDetails?.resolution && (
                  <p className="text-[11px] text-emerald-400/80 font-mono">
                    Output: {renderDetails.resolution} @ {renderDetails.framerate}fps • H.264/AAC
                  </p>
                )}
              </div>
              <a
                href={downloadUrl}
                download
                className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3.5 py-1.5 rounded text-xs transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-resolve-800 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={isRendering}
            className="px-3.5 py-1.5 rounded text-xs text-gray-300 hover:text-white hover:bg-resolve-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleStartRender}
            disabled={isRendering}
            className="flex items-center space-x-2 bg-resolve-orange hover:bg-resolve-orange-hover text-black font-bold px-4 py-1.5 rounded text-xs transition disabled:opacity-50 shadow-md"
          >
            {isRendering ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Encoding Master (FFmpeg)...</span>
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5" />
                <span>Start Master Render</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
