import { execFile, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class FFmpegService {
  /**
   * Check if FFmpeg is available on the system
   */
  static async checkFFmpeg() {
    try {
      const { stdout } = await execFileAsync('ffmpeg', ['-version']);
      return { available: true, version: stdout.split('\n')[0] };
    } catch (err) {
      return { available: false, error: err.message };
    }
  }

  /**
   * Extract video metadata (duration, resolution, fps) using ffprobe or ffmpeg
   */
  static async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      execFile('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath
      ], (err, stdout) => {
        if (!err && stdout) {
          try {
            const data = JSON.parse(stdout);
            const videoStream = data.streams.find(s => s.codec_type === 'video') || {};
            const audioStream = data.streams.find(s => s.codec_type === 'audio') || {};
            const duration = parseFloat(data.format?.duration || videoStream.duration || 0);
            
            // FPS calculation
            let fps = 30;
            if (videoStream.r_frame_rate) {
              const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
              if (den && num) fps = Math.round((num / den) * 100) / 100;
            }

            return resolve({
              duration,
              width: videoStream.width || 1920,
              height: videoStream.height || 1080,
              fps,
              codec: videoStream.codec_name || 'h264',
              hasAudio: Boolean(audioStream.codec_name),
              sizeBytes: data.format?.size ? parseInt(data.format.size) : 0
            });
          } catch (parseErr) {
            // fallback
          }
        }

        // Fallback using ffmpeg -i
        execFile('ffmpeg', ['-i', videoPath], (ffErr, _, stderr) => {
          const text = stderr || '';
          const durationMatch = text.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
          let duration = 0;
          if (durationMatch) {
            const hours = parseFloat(durationMatch[1]);
            const minutes = parseFloat(durationMatch[2]);
            const seconds = parseFloat(durationMatch[3]);
            duration = hours * 3600 + minutes * 60 + seconds;
          }

          const resMatch = text.match(/(\d{3,4})x(\d{3,4})/);
          const width = resMatch ? parseInt(resMatch[1]) : 1920;
          const height = resMatch ? parseInt(resMatch[2]) : 1080;

          const fpsMatch = text.match(/(\d+(?:\.\d+)?) fps/);
          const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 30;

          resolve({
            duration,
            width,
            height,
            fps,
            codec: 'h264',
            hasAudio: text.includes('Audio:'),
            sizeBytes: 0
          });
        });
      });
    });
  }

  /**
   * Extract audio as 16kHz mono WAV or MP3 for Whisper
   */
  static async extractAudio(videoPath, outputAudioPath) {
    const args = [
      '-y',
      '-i', videoPath,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      outputAudioPath
    ];

    return execFileAsync('ffmpeg', args);
  }

  /**
   * Extract video thumbnail at specific timestamp
   */
  static async extractThumbnail(videoPath, timestampSec = 1, outputImagePath) {
    const args = [
      '-y',
      '-ss', timestampSec.toString(),
      '-i', videoPath,
      '-vframes', '1',
      '-q:v', '2',
      outputImagePath
    ];

    return execFileAsync('ffmpeg', args);
  }

  /**
   * Extract multiple keyframes across video for multimodal vision analysis
   */
  static async extractKeyframes(videoPath, duration = 12, maxFrames = 4, outputDir = './uploads') {
    const frames = [];
    const interval = Math.max(1, duration / (maxFrames + 1));

    for (let i = 1; i <= maxFrames; i++) {
      const timestamp = Math.round(i * interval * 10) / 10;
      const frameFileName = `frame_${Date.now()}_${i}_${Math.round(timestamp)}s.jpg`;
      const framePath = path.join(outputDir, frameFileName);

      try {
        await execFileAsync('ffmpeg', [
          '-y',
          '-ss', timestamp.toString(),
          '-i', videoPath,
          '-vframes', '1',
          '-q:v', '3',
          '-vf', 'scale=640:-1',
          framePath
        ]);

        if (fs.existsSync(framePath)) {
          frames.push({
            timestamp,
            path: framePath,
            url: `/uploads/${frameFileName}`
          });
        }
      } catch (err) {
        console.warn(`Keyframe extraction at ${timestamp}s warning:`, err.message);
      }
    }

    return frames;
  }

  /**
   * Render final edited video with cuts, color grading adjustments, and subtitles
   */
  static async renderTimeline({
    inputVideoPath,
    outputVideoPath,
    cuts = [], // Array of { start: number, end: number, speed: number }
    colorGrading = {}, // { temperature, tint, contrast, saturation, lift, gamma, gain }
    subtitleFile = null, // Path to .srt or .ass file
    aspectRatio = '16:9', // '16:9', '9:16', '1:1'
    onProgress = () => {}
  }) {
    return new Promise((resolve, reject) => {
      // Build filter chain
      const filterComplex = [];
      let currentStream = '0:v';

      // 1. Color Grading Filter
      // eq filter handles contrast, brightness, saturation
      const contrast = colorGrading.contrast !== undefined ? (colorGrading.contrast / 100) + 1.0 : 1.0;
      const saturation = colorGrading.saturation !== undefined ? (colorGrading.saturation / 100) + 1.0 : 1.0;
      const brightness = colorGrading.brightness !== undefined ? (colorGrading.brightness / 100) : 0.0;
      
      // Temperature & Tint via colorchannelmixer or colorbalance
      // Temp > 0 -> warm (boost red, slight decrease blue)
      // Temp < 0 -> cool (boost blue, decrease red)
      const temp = colorGrading.temperature || 0; // -100 to 100
      const tint = colorGrading.tint || 0; // -100 to 100
      
      const rr = 1.0 + (temp > 0 ? (temp / 200) : 0);
      const bb = 1.0 + (temp < 0 ? (-temp / 200) : 0);
      const gg = 1.0 + (tint > 0 ? (tint / 300) : 0);

      const colorFilters = [
        `eq=contrast=${contrast.toFixed(2)}:saturation=${saturation.toFixed(2)}:brightness=${brightness.toFixed(2)}`,
        `colorchannelmixer=rr=${rr.toFixed(3)}:gg=${gg.toFixed(3)}:bb=${bb.toFixed(3)}`
      ];

      // Aspect ratio cropping if 9:16
      if (aspectRatio === '9:16') {
        // Center crop to 9:16: crop=ih*9/16:ih:(iw-ih*9/16)/2:0
        colorFilters.push('crop=ih*9/16:ih');
      } else if (aspectRatio === '1:1') {
        colorFilters.push('crop=ih:ih');
      }

      // Subtitles burn-in if provided
      if (subtitleFile && fs.existsSync(subtitleFile)) {
        // Escape backslashes for FFmpeg Windows path
        const escapedSubPath = subtitleFile.replace(/\\/g, '/').replace(/:/g, '\\:');
        colorFilters.push(`subtitles='${escapedSubPath}'`);
      }

      const vfString = colorFilters.join(',');

      const args = [
        '-y',
        '-i', inputVideoPath,
        '-vf', vfString,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '20',
        '-c:a', 'aac',
        '-b:a', '192k',
        outputVideoPath
      ];

      const proc = spawn('ffmpeg', args);
      let stderrData = '';

      proc.stderr.on('data', (data) => {
        stderrData += data.toString();
        // Parse time for progress
        const timeMatch = data.toString().match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (timeMatch) {
          const cur = parseFloat(timeMatch[1]) * 3600 + parseFloat(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
          onProgress({ currentTime: cur });
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, outputPath: outputVideoPath });
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderrData.slice(-500)}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }
}
