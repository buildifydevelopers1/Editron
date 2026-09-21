export type WorkspacePage = 'media' | 'cut' | 'edit' | 'color' | 'subtitles' | 'effects' | 'deliver';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '2.39:1';

export interface VideoClip {
  id: string;
  name: string;
  trackId: string; // 'v1' | 'v2'
  start: number; // timeline start in seconds
  end: number; // timeline end in seconds
  sourceStart: number; // in-point in media
  sourceEnd: number; // out-point in media
  speed: number;
  label?: string;
  color?: string;
  type?: 'video' | 'image';
  imageUrl?: string;
}

export interface AudioClip {
  id: string;
  name: string;
  trackId: string; // 'a1' | 'a2'
  start: number;
  end: number;
  volume: number; // 0.0 to 2.0
  muted?: boolean;
  url?: string;
}

export interface SubtitleWord {
  id: string;
  word: string;
  start: number;
  end: number;
}

export interface SubtitleSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

export type SubtitlePreset =
  | 'hormozi'
  | 'mrbeast'
  | 'neon_cyberpunk'
  | 'retro_vhs'
  | 'karaoke_glow'
  | 'comic_pop'
  | 'typewriter'
  | 'golden_luxury'
  | 'cinematic_clean'
  | 'glitch_hacker'
  | 'boxed_pill'
  | 'fire_gradient'
  | 'documentary_italic'
  | 'isometric_3d'
  | 'y2k_aesthetic'
  | 'news_lower_third'
  | 'anime_speed'
  | 'drop_shadow_studio'
  | 'hindi_attitude'
  | 'bollywood_royal'
  | 'punjabi_drill';

export interface SubtitleStyle {
  preset: SubtitlePreset | string;
  name?: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  strokeColor: string;
  strokeWidth: number;
  textCase: 'uppercase' | 'normal';
  animation: 'bounce' | 'pop' | 'glow' | 'fade' | 'slide' | 'none';
  positionY: number; // percentage from bottom e.g. 18%
  backgroundColor?: string;
  shadowColor?: string;
}

export interface ColorWheelVector {
  r: number; // -1.0 to 1.0
  g: number; // -1.0 to 1.0
  b: number; // -1.0 to 1.0
  master: number; // -1.0 to 1.0
}

export interface ColorGradingSettings {
  presetName?: string;
  temperature: number; // -100 to 100
  tint: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  brightness: number; // -100 to 100
  lift: ColorWheelVector; // Shadows
  gamma: ColorWheelVector; // Midtones
  gain: ColorWheelVector; // Highlights
  offset: ColorWheelVector; // Global
}

export interface TransformSettings {
  scale: number; // 1.0 = 100%
  positionX: number; // px offset
  positionY: number; // px offset
  rotation: number; // degrees
  opacity: number; // 0.0 to 1.0
}

export type TransitionType =
  | 'cross_dissolve'
  | 'dip_black'
  | 'dip_white'
  | 'whip_pan'
  | 'zoom_blur'
  | 'glitch'
  | 'film_burn'
  | 'spin'
  | 'cube_flip'
  | 'push_slide'
  | 'split_slice'
  | 'iris_wipe'
  | 'pixelate'
  | 'rgb_split'
  | 'shake_impact'
  | 'cross_zoom'
  | 'ink_bleed'
  | 'lens_flare'
  | 'page_curl'
  | 'dissolve';

export interface VideoTransition {
  id: string;
  type: TransitionType;
  name: string;
  timestamp: number; // point in timeline where transition occurs
  duration: number; // in seconds, e.g. 0.8s
}

export type EffectType =
  | 'camera_shake'
  | 'film_grain'
  | 'glow'
  | 'vignette'
  | 'rgb_split'
  | 'vhs_scanlines'
  | 'cinematic_letterbox'
  | 'retro_80s'
  | 'anamorphic_streak'
  | 'blur_bokeh';

export interface VideoEffect {
  id: string;
  type: EffectType;
  name: string;
  enabled: boolean;
  intensity: number; // 0 to 100
}

export interface AppConfig {
  hasApiKey: boolean;
  apiKeyMasked: string;
  baseUrl: string;
  llmModel: string;
  whisperModel: string;
  visionModel?: string;
}

export interface KeyframeItem {
  timestamp: number;
  path: string;
  url: string;
}

export interface VisionAnalysis {
  shotType: string;
  lightingQuality: string;
  emotionalTone: string;
  faceFraming: string;
  sceneDescription: string;
  colorRecommendations: {
    presetName: string;
    temperature: number;
    tint: number;
    contrast: number;
    saturation: number;
  };
  memeAndBrollSuggestions: {
    type: 'meme' | 'broll' | 'sfx' | 'audio';
    name: string;
    timestamp: number;
    reason: string;
  }[];
}

export interface LibraryAsset {
  id: string;
  name: string;
  category: 'meme' | 'broll' | 'sfx' | 'audio';
  type: 'video' | 'audio';
  duration: number;
  thumbnail: string;
  url: string;
  description: string;
}

export interface TrendingSong {
  id: string;
  title: string;
  artist: string;
  genre: string;
  vibe: string;
  trendScore: string;
  bpm: number;
  dropTime: number;
  thumbnailUrl: string;
  audioFileName?: string;
  audioUrl: string;
  previewUrl?: string;
  album?: string;
  duration?: number;
  releaseDate?: string;
  description: string;
}

export interface AttitudeReelPlan {
  song: TrendingSong;
  aspectRatio: AspectRatio;
  summary: string;
  colorGrading: ColorGradingSettings;
  subtitleStyle: SubtitleStyle;
  cuts: any[];
  audioTrack: AudioClip;
  zooms: any[];
}

export interface UploadedMedia {
  fileId: string;
  originalName: string;
  videoUrl: string;
  audioPath?: string | null;
  videoPath: string;
  thumbnailUrl?: string | null;
  metadata: {
    duration: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
  };
}
