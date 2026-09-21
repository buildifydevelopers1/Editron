/**
 * MediaMetadataService:
 * Real client-side pre-flight media inspector. Extracts duration, dimensions,
 * aspect ratios, and generates local thumbnail previews without waiting for backend.
 */

export interface ClientMediaMetadata {
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  type: 'video' | 'image' | 'audio';
  mimeType: string;
  duration: number; // in seconds (0 for images)
  width: number;
  height: number;
  aspectRatio: string;
  thumbnailUrl?: string;
  hasAudio?: boolean;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export async function extractMediaMetadata(file: File): Promise<ClientMediaMetadata> {
  const mime = file.type.toLowerCase();
  const name = file.name;
  const ext = name.split('.').pop()?.toLowerCase() || '';

  const isVideo = mime.startsWith('video/') || ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext);
  const isImage = mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  const isAudio = mime.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext);

  const baseResult: ClientMediaMetadata = {
    fileName: name,
    fileSizeBytes: file.size,
    fileSizeFormatted: formatBytes(file.size),
    type: isVideo ? 'video' : isImage ? 'image' : 'audio',
    mimeType: mime || `media/${ext}`,
    duration: 0,
    width: 0,
    height: 0,
    aspectRatio: '16:9',
  };

  const objectUrl = URL.createObjectURL(file);

  try {
    if (isVideo) {
      return await new Promise<ClientMediaMetadata>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = objectUrl;
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
          const duration = video.duration || 0;
          const width = video.videoWidth || 1920;
          const height = video.videoHeight || 1080;
          const ar = width / height;
          let arLabel = '16:9';
          if (Math.abs(ar - 9 / 16) < 0.15) arLabel = '9:16';
          else if (Math.abs(ar - 1) < 0.15) arLabel = '1:1';
          else if (Math.abs(ar - 4 / 5) < 0.15) arLabel = '4:5';
          else if (Math.abs(ar - 2.39) < 0.25) arLabel = '2.39:1';

          // Extract thumbnail frame at 1.0s (or 10% of duration)
          video.currentTime = Math.min(1.0, duration * 0.1);
        };

        video.onseeked = () => {
          let thumb: string | undefined;
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(480, video.videoWidth);
            canvas.height = Math.round(canvas.width / (video.videoWidth / video.videoHeight));
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              thumb = canvas.toDataURL('image/jpeg', 0.85);
            }
          } catch (e) {
            // canvas extraction failed
          }

          URL.revokeObjectURL(objectUrl);
          const width = video.videoWidth || 1920;
          const height = video.videoHeight || 1080;
          const ar = width / height;
          let arLabel = '16:9';
          if (Math.abs(ar - 9 / 16) < 0.15) arLabel = '9:16';
          else if (Math.abs(ar - 1) < 0.15) arLabel = '1:1';
          else if (Math.abs(ar - 4 / 5) < 0.15) arLabel = '4:5';
          else if (Math.abs(ar - 2.39) < 0.25) arLabel = '2.39:1';

          resolve({
            ...baseResult,
            duration: video.duration || 0,
            width,
            height,
            aspectRatio: arLabel,
            thumbnailUrl: thumb,
            hasAudio: true,
          });
        };

        video.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(baseResult);
        };
      });
    } else if (isImage) {
      return await new Promise<ClientMediaMetadata>((resolve) => {
        const img = new Image();
        img.src = objectUrl;
        img.onload = () => {
          const width = img.naturalWidth || 1080;
          const height = img.naturalHeight || 1080;
          const ar = width / height;
          let arLabel = '1:1';
          if (Math.abs(ar - 16 / 9) < 0.15) arLabel = '16:9';
          else if (Math.abs(ar - 9 / 16) < 0.15) arLabel = '9:16';
          else if (Math.abs(ar - 4 / 5) < 0.15) arLabel = '4:5';

          resolve({
            ...baseResult,
            duration: 3.0, // Default photo slide duration
            width,
            height,
            aspectRatio: arLabel,
            thumbnailUrl: objectUrl,
          });
        };
        img.onerror = () => {
          resolve(baseResult);
        };
      });
    } else if (isAudio) {
      return await new Promise<ClientMediaMetadata>((resolve) => {
        const audio = document.createElement('audio');
        audio.src = objectUrl;
        audio.onloadedmetadata = () => {
          const duration = audio.duration || 0;
          URL.revokeObjectURL(objectUrl);
          resolve({
            ...baseResult,
            duration,
            hasAudio: true,
          });
        };
        audio.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(baseResult);
        };
      });
    }
  } catch (err) {
    console.warn('Metadata extraction fallback:', err);
  }

  return baseResult;
}
