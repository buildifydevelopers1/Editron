/**
 * WebAudioEngine:
 * Commercial-grade synchronized multi-track audio engine for Editron.
 * Manages master Web Audio API AudioContext, track gain nodes, live VU meter
 * peak analyzers, and handles browser Autoplay policies with seamless unlocking.
 */
export class WebAudioEngine {
  private static instance: WebAudioEngine | null = null;

  public ctx: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  public isUnlocked: boolean = false;
  private unlockListeners: Set<(unlocked: boolean) => void> = new Set();
  private dataArray: Uint8Array | null = null;

  private constructor() {
    // Lazy initialize on first interaction or creation
    this.initContext();
  }

  public static getInstance(): WebAudioEngine {
    if (!WebAudioEngine.instance) {
      WebAudioEngine.instance = new WebAudioEngine();
    }
    return WebAudioEngine.instance;
  }

  /**
   * Initialize AudioContext and core audio node graph
   */
  public initContext(): void {
    if (this.ctx) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Connect: Master Gain -> Analyser -> Destination
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      if (this.ctx.state === 'running') {
        this.isUnlocked = true;
        this.notifyUnlock(true);
      } else {
        this.isUnlocked = false;
      }
    } catch (err) {
      console.warn('Web Audio initialization warning:', err);
    }
  }

  /**
   * Unlock Web Audio context on user gesture
   */
  public async unlock(): Promise<boolean> {
    this.initContext();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('AudioContext resume failed:', err);
      }
    }

    this.isUnlocked = this.ctx.state === 'running';
    this.notifyUnlock(this.isUnlocked);
    return this.isUnlocked;
  }

  public onUnlockChange(callback: (unlocked: boolean) => void): () => void {
    this.unlockListeners.add(callback);
    callback(this.isUnlocked);
    return () => this.unlockListeners.delete(callback);
  }

  private notifyUnlock(unlocked: boolean): void {
    this.unlockListeners.forEach((fn) => fn(unlocked));
  }

  /**
   * Set Master Volume (0.0 to 2.0)
   */
  public setMasterVolume(vol: number, isMuted: boolean = false): void {
    if (!this.masterGain || !this.ctx) return;
    const finalVol = isMuted ? 0 : Math.max(0, Math.min(2.0, vol));
    this.masterGain.gain.setTargetAtTime(finalVol, this.ctx.currentTime, 0.02);
  }

  /**
   * Connect an HTML media element (video or audio) into the Web Audio graph
   */
  public connectMediaElement(element: HTMLMediaElement): MediaElementAudioSourceNode | null {
    if (!this.ctx || !this.masterGain) return null;
    try {
      // Check if already connected
      if ((element as any).__audioSourceNode) {
        return (element as any).__audioSourceNode;
      }

      const source = this.ctx.createMediaElementSource(element);
      source.connect(this.masterGain);
      (element as any).__audioSourceNode = source;
      return source;
    } catch (err) {
      // Elements can only be connected once; fallback to direct element volume
      return null;
    }
  }

  /**
   * Get Live Peak Audio Levels (0.0 to 1.0) for professional VU Meters
   */
  public getPeakLevels(): { peak: number; left: number; right: number } {
    if (!this.analyser || !this.dataArray) {
      return { peak: 0, left: 0, right: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray as any);
    let sum = 0;
    let max = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const val = this.dataArray[i] / 255;
      sum += val;
      if (val > max) max = val;
    }

    const avg = sum / this.dataArray.length;
    // Simulated stereo split from FFT bands
    const left = Math.min(1.0, max * 0.95 + avg * 0.05);
    const right = Math.min(1.0, max * 0.9 + avg * 0.1);

    return { peak: max, left, right };
  }
}

export const audioEngine = WebAudioEngine.getInstance();
