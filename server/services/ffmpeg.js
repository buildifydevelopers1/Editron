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
   * Real Audio Silence Detection Engine:
   * Analyzes media waveform to detect silence intervals and extract active speech segments
   */
  static async detectSilences(mediaPath, noiseDb = -30, minDuration = 0.4) {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', mediaPath,
        '-af', `silencedetect=noise=${noiseDb}dB:d=${minDuration}`,
        '-f', 'null',
        '-'
      ];

      const proc = spawn('ffmpeg', args);
      let stderr = '';

      proc.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      proc.on('close', (code) => {
        // Parse silencedetect outputs from stderr
        const silences = [];
        const startRegex = /silence_start: (\d+\.?\d*)/g;
        const endRegex = /silence_end: (\d+\.?\d*)/g;

        const starts = [];
        let match;
        while ((match = startRegex.exec(stderr)) !== null) {
          starts.push(parseFloat(match[1]));
        }

        const ends = [];
        while ((match = endRegex.exec(stderr)) !== null) {
          ends.push(parseFloat(match[1]));
        }

        for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
          silences.push({
            start: starts[i],
            end: ends[i],
            duration: ends[i] - starts[i]
          });
        }

        // Get total duration to compute speech segments
        const durationMatch = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        let totalDuration = 0;
        if (durationMatch) {
          totalDuration = parseFloat(durationMatch[1]) * 3600 + parseFloat(durationMatch[2]) * 60 + parseFloat(durationMatch[3]);
        }

        // Invert silences into speech segments
        const speechSegments = [];
        let cursor = 0;
        silences.forEach((sil, idx) => {
          if (sil.start > cursor + 0.2) {
            speechSegments.push({
              start: parseFloat(cursor.toFixed(2)),
              end: parseFloat(sil.start.toFixed(2)),
              duration: parseFloat((sil.start - cursor).toFixed(2)),
              label: `Speech Cut ${idx + 1}`
            });
          }
          cursor = sil.end;
        });

        if (totalDuration > cursor + 0.2) {
          speechSegments.push({
            start: parseFloat(cursor.toFixed(2)),
            end: parseFloat(totalDuration.toFixed(2)),
            duration: parseFloat((totalDuration - cursor).toFixed(2)),
            label: `Speech Cut ${speechSegments.length + 1}`
          });
        }

        resolve({
          totalDuration,
          silences,
          speechSegments
        });
      });

      proc.on('error', (err) => reject(err));
    });
  }

  /**
   * Commercial Multi-Track Timeline Render & Export Compositor:
   * Supports 1080p/4K 30/60fps, yuv420p QuickTime/iOS compatibility,
   * multi-track audio mixing (A1 video sound + A2 BGM/SFX), color grading,
   * aspect-ratio scaling with zero distortion, and subtitle burn-in.
   */
  static async renderTimeline({
    inputVideoPath,
    outputVideoPath,
    cuts = [],
    audioTrackPath = null,
    videoAudioVolume = 1.0,
    bgAudioVolume = 0.8,
    colorGrading = {},
    subtitleFile = null,
    resolution = '1080p',
    framerate = 30,
    aspectRatio = '16:9',
    onProgress = () => {}
  }) {
    return new Promise(async (resolve, reject) => {
      // 1. Calculate Target Dimensions
      let targetW = 1920;
      let targetH = 1080;

      if (resolution === '4k') {
        if (aspectRatio === '9:16') {
          targetW = 2160;
          targetH = 3840;
        } else if (aspectRatio === '1:1') {
          targetW = 2160;
          targetH = 2160;
        } else {
          targetW = 3840;
          targetH = 2160;
        }
      } else if (resolution === '720p') {
        if (aspectRatio === '9:16') {
          targetW = 720;
          targetH = 1280;
        } else if (aspectRatio === '1:1') {
          targetW = 720;
          targetH = 720;
        } else {
          targetW = 1280;
          targetH = 720;
        }
      } else {
        // Standard 1080p
        if (aspectRatio === '9:16') {
          targetW = 1080;
          targetH = 1920;
        } else if (aspectRatio === '1:1') {
          targetW = 1080;
          targetH = 1080;
        } else if (aspectRatio === '4:5') {
          targetW = 1080;
          targetH = 1350;
        } else if (aspectRatio === '2.39:1') {
          targetW = 1920;
          targetH = 804;
        } else {
          targetW = 1920;
          targetH = 1080;
        }
      }

      // Ensure dimensions are even (required by libx264 yuv420p)
      targetW = Math.floor(targetW / 2) * 2;
      targetH = Math.floor(targetH / 2) * 2;

      // 2. Build Video Filter Chain
      const contrast = colorGrading.contrast !== undefined ? (colorGrading.contrast / 100) + 1.0 : 1.0;
      const saturation = colorGrading.saturation !== undefined ? (colorGrading.saturation / 100) + 1.0 : 1.0;
      const brightness = colorGrading.brightness !== undefined ? (colorGrading.brightness / 100) : 0.0;

      const temp = colorGrading.temperature || 0;
      const tint = colorGrading.tint || 0;
      const rr = 1.0 + (temp > 0 ? (temp / 200) : 0);
      const bb = 1.0 + (temp < 0 ? (-temp / 200) : 0);
      const gg = 1.0 + (tint > 0 ? (tint / 300) : 0);

      const vfParts = [
        // Scale with aspect ratio preservation and black letterbox/pillarbox padding
        `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease`,
        `pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=black`,
        // Commercial Color Grading
        `eq=contrast=${contrast.toFixed(2)}:saturation=${saturation.toFixed(2)}:brightness=${brightness.toFixed(2)}`,
        `colorchannelmixer=rr=${rr.toFixed(3)}:gg=${gg.toFixed(3)}:bb=${bb.toFixed(3)}`
      ];

      // Burn-in Subtitles if available
      if (subtitleFile && fs.existsSync(subtitleFile)) {
        const escapedSubPath = subtitleFile.replace(/\\/g, '/').replace(/:/g, '\\:');
        vfParts.push(`subtitles='${escapedSubPath}'`);
      }

      const vfString = vfParts.join(',');

      // 3. Assemble FFmpeg Inputs & Audio Mixing
      const args = ['-y', '-i', inputVideoPath];
      const hasSecondaryAudio = audioTrackPath && fs.existsSync(audioTrackPath);

      if (hasSecondaryAudio) {
        args.push('-i', audioTrackPath);
      }

      // Filter complex or simple video filter
      if (hasSecondaryAudio) {
        // Multi-track audio mix: input 0 video audio + input 1 background music
        const filterComplex = [
          `[0:v]${vfString}[outv]`,
          `[0:a]volume=${videoAudioVolume.toFixed(2)}[a0]`,
          `[1:a]volume=${bgAudioVolume.toFixed(2)}[a1]`,
          `[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[outa]`
        ].join(';');

        args.push(
          '-filter_complex', filterComplex,
          '-map', '[outv]',
          '-map', '[outa]'
        );
      } else {
        args.push(
          '-vf', vfString,
          '-c:a', 'aac',
          '-b:a', '320k',
          '-ar', '48000'
        );
      }

      // Production Encoding Flags
      args.push(
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'medium',
        '-crf', '18',
        '-r', framerate.toString(),
        outputVideoPath
      );

      const proc = spawn('ffmpeg', args);
      let stderrData = '';

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderrData += text;
        const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (timeMatch) {
          const cur = parseFloat(timeMatch[1]) * 3600 + parseFloat(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
          onProgress({ currentTime: cur });
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            outputPath: outputVideoPath,
            resolution: `${targetW}x${targetH}`,
            framerate
          });
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderrData.slice(-500)}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Automatically detect and extract the highest-energy viral hook/chorus from an audio file.
   * Scans candidate windows using FFmpeg volume/energy analysis, isolates the peak section,
   * and trims it to targetDuration with studio micro-fades.
   */
  static async extractViralHook({
    audioPath,
    outputAudioPath,
    targetDuration = 20
  }) {
    const meta = await this.getVideoMetadata(audioPath);
    const originalDuration = meta.duration || 180;

    const formatTs = (sec) => {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // If audio is shorter than or roughly equal to target duration
    if (originalDuration <= targetDuration + 1.0) {
      const fadeOutSec = Math.max(0, originalDuration - 0.5);
      const args = [
        '-y',
        '-i', audioPath,
        '-t', targetDuration.toString(),
        '-af', `afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutSec.toFixed(2)}:d=0.5`,
        outputAudioPath
      ];
      try {
        await execFileAsync('ffmpeg', args);
      } catch {
        fs.copyFileSync(audioPath, outputAudioPath);
      }
      return {
        trimmedAudioPath: outputAudioPath,
        hookStart: 0,
        hookEnd: Math.min(originalDuration, targetDuration),
        originalDuration,
        description: `Full audio track preserved (${originalDuration.toFixed(1)}s).`
      };
    }

    // In commercial music, the main chorus/drop typically hits between 25% and 65% of the song.
    let bestStart = Math.round(originalDuration * 0.35);

    try {
      // Sample 6 candidate windows across the track to measure loudness/energy
      const candidateStarts = [];
      const step = Math.max(10, (originalDuration - targetDuration - 10) / 6);
      for (let s = Math.max(5, originalDuration * 0.15); s <= originalDuration - targetDuration - 5; s += step) {
        candidateStarts.push(Math.round(s));
      }
      if (candidateStarts.length === 0) {
        candidateStarts.push(Math.round(originalDuration * 0.3));
      }

      let maxVolume = -999;
      for (const startSec of candidateStarts) {
        try {
          const { stderr } = await execFileAsync('ffmpeg', [
            '-ss', startSec.toString(),
            '-t', '5',
            '-i', audioPath,
            '-af', 'volumedetect',
            '-f', 'null',
            '-'
          ]);
          const meanMatch = stderr.match(/mean_volume:\s*([-\d.]+)\s*dB/);
          const maxMatch = stderr.match(/max_volume:\s*([-\d.]+)\s*dB/);
          const meanVol = meanMatch ? parseFloat(meanMatch[1]) : -30;
          const maxVol = maxMatch ? parseFloat(maxMatch[1]) : -10;
          const energyScore = (meanVol * 0.7) + (maxVol * 0.3);

          if (energyScore > maxVolume) {
            maxVolume = energyScore;
            bestStart = startSec;
          }
        } catch {
          // skip sample on failure
        }
      }
    } catch (analysisErr) {
      console.warn('Audio energy analysis fallback:', analysisErr.message);
      bestStart = Math.round(originalDuration * 0.35);
    }

    const hookEnd = bestStart + targetDuration;
    const fadeOutStart = Math.max(0, targetDuration - 0.6);

    const trimArgs = [
      '-y',
      '-ss', bestStart.toString(),
      '-t', targetDuration.toString(),
      '-i', audioPath,
      '-af', `afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=0.6`,
      '-b:a', '192k',
      outputAudioPath
    ];

    try {
      await execFileAsync('ffmpeg', trimArgs);
    } catch (trimErr) {
      console.warn('Trim with fade warning, executing stream copy:', trimErr.message);
      await execFileAsync('ffmpeg', [
        '-y',
        '-ss', bestStart.toString(),
        '-t', targetDuration.toString(),
        '-i', audioPath,
        '-c:a', 'copy',
        outputAudioPath
      ]);
    }

    return {
      trimmedAudioPath: outputAudioPath,
      hookStart: bestStart,
      hookEnd,
      originalDuration,
      description: `Auto-extracted ${targetDuration}s viral peak chorus from ${formatTs(bestStart)} to ${formatTs(hookEnd)} of original ${formatTs(originalDuration)} track.`
    };
  }

  /**
   * Build an ASS subtitle file from timed subtitle words for FFmpeg burn-in.
   */
  static buildAssSubtitleFile(subtitleWords = [], subtitleStyle = {}, outputPath) {
    const fontSize = subtitleStyle.fontSize || 40;
    const strokeWidth = subtitleStyle.strokeWidth || 4;
    const fontFamily = (subtitleStyle.fontFamily || 'Montserrat').split(',')[0].replace(/'/g, '').trim();
    const positionY = subtitleStyle.positionY || 20;
    const textCase = subtitleStyle.textCase || 'uppercase';
    const marginV = Math.round(1080 * positionY / 100);

    const assHeader = [
      '[Script Info]',
      'ScriptType: v4.00+',
      'PlayResX: 1920',
      'PlayResY: 1080',
      'ScaledBorderAndShadow: yes',
      '',
      '[V4+ Styles]',
      'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
      `Style: Default,${fontFamily},${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,${strokeWidth},0,2,10,10,${marginV},1`,
      '',
      '[Events]',
      'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
      ''
    ].join('\n');

    const toAssTime = (sec) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const cs = Math.round((sec % 1) * 100);
      return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
    };

    // Group words into natural reading phrases
    const phrases = [];
    let group = [];
    for (let i = 0; i < subtitleWords.length; i++) {
      const w = subtitleWords[i];
      const prev = group[group.length - 1];
      const hasPause = prev && (w.start - prev.end > 0.5);
      const tooLong = group.length >= 4;
      const durationTooLong = group.length > 0 && (w.end - group[0].start > 2.5);
      if (group.length > 0 && (hasPause || tooLong || durationTooLong)) {
        phrases.push(group);
        group = [w];
      } else {
        group.push(w);
      }
    }
    if (group.length > 0) phrases.push(group);

    let events = '';
    for (const phrase of phrases) {
      const text = phrase.map(w => textCase === 'uppercase' ? w.word.toUpperCase() : w.word).join(' ');
      const start = phrase[0].start;
      const end = phrase[phrase.length - 1].end + 0.3;
      events += `Dialogue: 0,${toAssTime(start)},${toAssTime(end)},Default,,0,0,0,,${text}\n`;
    }

    fs.writeFileSync(outputPath, assHeader + events, 'utf8');
    return outputPath;
  }

  /**
   * Render a real output video from an AI edit plan.
   * Handles multi-cut trim+concat, subtitle burn-in (.ass), color grading, VFX, and audio mixing.
   */
  static async renderFromPlan({
    inputVideoPath,
    outputVideoPath,
    plan = {},
    audioTrackPath = null,
    resolution = '1080p',
    aspectRatio = '9:16',
    onProgress = () => {}
  }) {
    return new Promise(async (resolve, reject) => {
      // Target dimensions
      let targetW = 1080, targetH = 1920;
      if (aspectRatio === '16:9') { targetW = 1920; targetH = 1080; }
      else if (aspectRatio === '1:1') { targetW = 1080; targetH = 1080; }
      else if (aspectRatio === '2.39:1') { targetW = 1920; targetH = 804; }
      else if (aspectRatio === '4:5') { targetW = 1080; targetH = 1350; }
      if (resolution === '720p') { targetW = Math.round(targetW * 0.667); targetH = Math.round(targetH * 0.667); }
      targetW = Math.floor(targetW / 2) * 2;
      targetH = Math.floor(targetH / 2) * 2;

      const workDir = path.dirname(outputVideoPath);
      const cuts = plan.cuts || [];
      const colorGrading = plan.colorGrading || {};
      const subtitleWords = plan.subtitles || [];
      const subtitleStyle = plan.subtitleStyle || {};
      const effects = plan.effects || [];

      if (!inputVideoPath || !fs.existsSync(inputVideoPath)) {
        return reject(new Error('Input video not found for rendering'));
      }

      // Color grading
      const contrast = ((colorGrading.contrast !== undefined ? colorGrading.contrast / 100 : 0) + 1.0).toFixed(3);
      const saturation = ((colorGrading.saturation !== undefined ? colorGrading.saturation / 100 : 0) + 1.0).toFixed(3);
      const brightness = (colorGrading.brightness !== undefined ? colorGrading.brightness / 100 : 0.0).toFixed(3);
      const temp = colorGrading.temperature || 0;
      const tint = colorGrading.tint || 0;
      const rr = (1.0 + (temp > 0 ? temp / 200 : 0)).toFixed(3);
      const bb = (1.0 + (temp < 0 ? -temp / 200 : 0)).toFixed(3);
      const gg = (1.0 + (tint > 0 ? tint / 300 : 0)).toFixed(3);

      // VFX filter parts
      const vfxParts = [];
      const hasGrain = effects.find(e => e.type === 'film_grain' && e.enabled);
      const hasVignette = effects.find(e => e.type === 'vignette' && e.enabled);
      const hasGlow = effects.find(e => e.type === 'glow' && e.enabled);
      if (hasGrain) vfxParts.push(`noise=alls=${Math.round((hasGrain.intensity || 30) / 2)}:allf=t+u`);
      if (hasVignette) vfxParts.push('vignette=PI/4');
      if (hasGlow) vfxParts.push('unsharp=5:5:1.2:5:5:0.0');

      // Build subtitle file
      let assSubtitlePath = null;
      if (subtitleWords.length > 0) {
        assSubtitlePath = path.join(workDir, `subs_${Date.now()}.ass`);
        this.buildAssSubtitleFile(subtitleWords, subtitleStyle, assSubtitlePath);
      }

      // Core video filter chain
      const baseVfParts = [
        `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease`,
        `pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=black`,
        `eq=contrast=${contrast}:saturation=${saturation}:brightness=${brightness}`,
        `colorchannelmixer=rr=${rr}:gg=${gg}:bb=${bb}`,
        ...vfxParts
      ];
      const baseVf = baseVfParts.join(',');
      const safeSubs = assSubtitlePath
        ? assSubtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:')
        : null;
      const subChain = safeSubs ? `,subtitles='${safeSubs}'` : '';

      const hasSecondaryAudio = audioTrackPath && fs.existsSync(audioTrackPath);
      const args = ['-y', '-i', inputVideoPath];
      if (hasSecondaryAudio) args.push('-i', audioTrackPath);

      if (cuts.length > 1) {
        // Multi-cut: trim each segment then concat
        const vSegs = cuts.map((c, i) =>
          `[0:v]trim=start=${c.start.toFixed(3)}:end=${c.end.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`
        );
        const aSegs = cuts.map((c, i) =>
          `[0:a]atrim=start=${c.start.toFixed(3)}:end=${c.end.toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`
        );
        const vJoin = cuts.map((_, i) => `[v${i}]`).join('');
        const aJoin = cuts.map((_, i) => `[a${i}]`).join('');

        let fc;
        if (hasSecondaryAudio) {
          fc = [
            ...vSegs, ...aSegs,
            `${vJoin}concat=n=${cuts.length}:v=1:a=0[concatv]`,
            `${aJoin}concat=n=${cuts.length}:v=0:a=1[concata]`,
            `[concatv]${baseVf}${subChain}[outv]`,
            `[concata]volume=0.2[va]`,
            `[1:a]volume=0.9[bgm]`,
            `[va][bgm]amix=inputs=2:duration=first:dropout_transition=2[outa]`
          ].join(';');
          args.push('-filter_complex', fc, '-map', '[outv]', '-map', '[outa]');
        } else {
          fc = [
            ...vSegs, ...aSegs,
            `${vJoin}concat=n=${cuts.length}:v=1:a=0[concatv]`,
            `${aJoin}concat=n=${cuts.length}:v=0:a=1[concata]`,
            `[concatv]${baseVf}${subChain}[outv]`
          ].join(';');
          args.push('-filter_complex', fc, '-map', '[outv]', '-map', '[concata]');
        }
      } else {
        // Single pass
        if (hasSecondaryAudio) {
          const fc = [
            `[0:v]${baseVf}${subChain}[outv]`,
            `[0:a]volume=0.2[va]`,
            `[1:a]volume=0.9[bgm]`,
            `[va][bgm]amix=inputs=2:duration=first:dropout_transition=2[outa]`
          ].join(';');
          args.push('-filter_complex', fc, '-map', '[outv]', '-map', '[outa]');
        } else {
          args.push('-vf', `${baseVf}${subChain}`);
        }
      }

      // Encoding flags
      args.push(
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
        '-preset', 'fast', '-crf', '20',
        '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
        '-movflags', '+faststart',
        outputVideoPath
      );

      const proc = spawn('ffmpeg', args);
      let stderrData = '';

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderrData += text;
        const m = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (m) onProgress({ currentTime: parseFloat(m[1]) * 3600 + parseFloat(m[2]) * 60 + parseFloat(m[3]) });
      });

      proc.on('close', (code) => {
        if (assSubtitlePath && fs.existsSync(assSubtitlePath)) {
          try { fs.unlinkSync(assSubtitlePath); } catch (_) {}
        }
        if (code === 0) {
          const stat = fs.existsSync(outputVideoPath) ? fs.statSync(outputVideoPath) : null;
          resolve({
            success: true,
            outputPath: outputVideoPath,
            resolution: `${targetW}x${targetH}`,
            sizeBytes: stat ? stat.size : 0
          });
        } else {
          reject(new Error(`FFmpeg render failed (exit ${code}): ${stderrData.slice(-800)}`));
        }
      });

      proc.on('error', (err) => reject(err));
    });
  }
}

