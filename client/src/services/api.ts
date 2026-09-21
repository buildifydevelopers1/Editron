import {
  AppConfig,
  AttitudeReelPlan,
  ColorGradingSettings,
  SubtitleWord,
  TrendingSong,
  UploadedMedia,
  VideoClip,
} from '../types';

export const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/config`);
  return res.json();
}

export async function updateConfig(data: Partial<{
  apiKey: string;
  baseUrl: string;
  llmModel: string;
  whisperModel: string;
  visionModel: string;
}>): Promise<{ success: boolean; config: AppConfig }> {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function requestVisionAnalysis({
  videoPath,
  duration,
  prompt,
}: {
  videoPath: string;
  duration: number;
  prompt?: string;
}) {
  const res = await fetch(`${API_BASE}/vision-analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoPath, duration, prompt }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Vision analysis failed');
  }
  return data;
}

export async function fetchAssetLibrary() {
  const res = await fetch(`${API_BASE}/assets/library`);
  const data = await res.json();
  return data.library;
}

export async function searchTrendingSongs(query = 'trending attitude hindi song'): Promise<TrendingSong[]> {
  const res = await fetch(`${API_BASE}/trending-audio/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  return data.songs || [];
}

export async function applyAttitudeReel({
  songId,
  duration,
}: {
  songId: string;
  duration: number;
}): Promise<AttitudeReelPlan> {
  const res = await fetch(`${API_BASE}/trending-audio/apply-attitude-reel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId, duration }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to apply attitude reel');
  }
  return data.attitudeReel;
}

export async function uploadPhotos(files: File[]): Promise<any[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));

  const res = await fetch(`${API_BASE}/upload-photos`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to upload photos');
  }
  return data.photos || [];
}

export async function generatePhotosToReel({
  photos = [],
  prompt = 'attitude reel',
  songId = 'trend-hindi-1',
}: {
  photos?: any[];
  prompt?: string;
  songId?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/photos-to-reel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photos, prompt, songId }),
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to generate photo reel');
  }
  return data.montageReel;
}

export async function uploadVideoFile(file: File): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append('video', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to upload video');
  }

  return res.json();
}

export async function requestTranscription(audioPath: string): Promise<{
  text: string;
  duration: number;
  words: SubtitleWord[];
}> {
  const res = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioPath }),
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Transcription failed');
  }
  return data.transcript;
}

export async function requestAIEdits({
  prompt,
  transcript,
  duration,
}: {
  prompt: string;
  transcript: any;
  duration: number;
}) {
  const res = await fetch(`${API_BASE}/ai-edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, transcript, duration }),
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'AI edit failed');
  }
  return data.editPlan;
}

export async function requestRender({
  videoPath,
  cuts,
  colorGrading,
  subtitleWords,
  aspectRatio,
}: {
  videoPath: string;
  cuts: VideoClip[];
  colorGrading: ColorGradingSettings;
  subtitleWords: SubtitleWord[];
  aspectRatio: string;
}): Promise<{ success: boolean; downloadUrl: string; filename: string }> {
  const res = await fetch(`${API_BASE}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoPath,
      cuts,
      colorGrading,
      subtitleTrack: { words: subtitleWords },
      aspectRatio,
    }),
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Rendering failed');
  }
  return data;
}
