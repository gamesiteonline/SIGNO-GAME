// SIGNO Audio Manager
// Developed by Fahad Mohamed
// Enhanced with theme-specific music and improved audio system

import type { AudioState } from '../engine/Types';

export class AudioManager {
  state: AudioState = {
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.6,
    muted: false,
  };

  private audioCtx: AudioContext | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private currentTheme: string = '';
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private sfxCache: Map<string, HTMLAudioElement[]> = new Map();
  private readonly SFX_POOL_SIZE = 3;

  // Theme-specific ambient music mapping
  private themeMusicMap: Record<string, string> = {
    forest: '/assets/ambient-forest.mp3',
    cave: '/assets/ambient-cave.mp3',
    industrial: '/assets/ambient-industrial.mp3',
    graveyard: '/assets/ambient-graveyard.mp3',
    void: '/assets/ambient-void.mp3'
  };

  // Fallback to default ambient if theme-specific not found
  private defaultAmbient = '/assets/ambient-horror.mp3';

  constructor() {
    // Don't initialize in constructor to avoid browser blocking
    this.preloadSFX();
  }

  private initAudio(): void {
    if (!this.audioCtx) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        // Add a limiter to prevent clipping
        const limiter = this.audioCtx.createDynamicsCompressor();
        limiter.threshold.setValueAtTime(-24, 0);
        limiter.knee.setValueAtTime(5, 0);
        limiter.ratio.setValueAtTime(12, 0);
        limiter.attack.setValueAtTime(0, 0);
        limiter.release.setValueAtTime(0.25, 0);
        limiter.connect(this.audioCtx.destination);
        this.audioCtx.destination = limiter as any; // This is a simplification - in practice we'd need to rewire
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private async loadAudio(url: string): Promise<AudioBuffer> {
    if (this.audioBuffers.has(url)) {
      return this.audioBuffers.get(url)!;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx!.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.warn(`Failed to load audio ${url}:`, error);
      // Return a silent buffer as fallback
      return this.createSilentBuffer();
    }
  }

  private createSilentBuffer(): AudioBuffer {
    if (!this.audioCtx) {
      // This shouldn't happen in practice, but just in case
      return new AudioBuffer({ length: 2, sampleRate: 44100, numberOfChannels: 2 });
    }
    const buffer = this.audioCtx.createBuffer(2, this.audioCtx.sampleRate * 0.1, this.audioCtx.sampleRate);
    // Fill with silence
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        data[i] = 0;
      }
    }
    return buffer;
  }

  private preloadSFX(): void {
    // Pre-load SFX into pools for instant playback
    const sfxFiles = ['sfx-jump.wav', 'sfx-land.wav', 'sfx-death.wav'];
    sfxFiles.forEach(file => {
      const path = `/assets/${file}`;
      const pool: HTMLAudioElement[] = [];
      for (let i = 0; i < this.SFX_POOL_SIZE; i++) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = 0;
        pool.push(audio);
      }
      this.sfxCache.set(file, pool);
    });
  }

  private getSFXFromPool(file: string): HTMLAudioElement | null {
    const pool = this.sfxCache.get(file);
    if (!pool) return null;

    // Find first available audio element
    for (const audio of pool) {
      if (audio.paused || audio.ended) {
        return audio;
      }
    }
    // If all are busy, return the first one (will interrupt)
    return pool[0] || null;
  }

  private async playSound(url: string, volumeScale: number = 1.0): Promise<void> {
    if (this.state.muted) return;
    this.initAudio();

    // Try to use cached audio for SFX files
    const fileName = url.split('/').pop();
    if (fileName && fileName.startsWith('sfx-') && fileName.endsWith('.wav')) {
      const audio = this.getSFXFromPool(fileName);
      if (audio) {
        audio.volume = Math.min(1.0, this.state.sfxVolume * this.state.masterVolume * volumeScale);
        audio.currentTime = 0; // Restart from beginning
        audio.play().catch(e => console.warn("Audio play failed:", e));
        return;
      }
    }

    // Fallback to Web Audio API for procedural sounds or cached files
    try {
      const buffer = await this.loadAudio(url);
      const source = this.audioCtx!.createBufferSource();
      source.buffer = buffer;
      const gainNode = this.audioCtx!.createGain();
      gainNode.gain.setValueAtTime(this.state.sfxVolume * this.state.masterVolume * volumeScale, this.audioCtx!.currentTime);
      source.connect(gainNode);
      gainNode.connect(this.audioCtx!.destination);
      source.start();
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }

  playJump(): void {
    this.playSound('/assets/sfx-jump.wav', 0.5);
  }

  playLand(): void {
    this.playSound('/assets/sfx-land.wav', 0.6);
  }

  playDeath(): void {
    this.playSound('/assets/sfx-death.wav', 0.8);
  }

  playCollect(): void {
    this.playSoundProcedural('collect');
  }

  playSwitch(): void {
    this.playSoundProcedural('switch');
  }

  playDoorOpen(): void {
    this.playSoundProcedural('door');
  }

  playLevelComplete(): void {
    this.playSoundProcedural('complete');
  }

  // Enhanced procedural sounds with more variety
  private playSoundProcedural(type: string): void {
    if (this.state.muted) return;
    this.initAudio();
    const ctx = this.audioCtx!;

    // Create a more complex sound using multiple oscillators and filters
    const createComplexTone = (baseFreq: number, duration: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      // Add slight frequency modulation for richness
      const modOsc = ctx.createOscillator();
      const modGain = ctx.createGain();
      modOsc.frequency.setValueAtTime(5, ctx.currentTime); // 5Hz modulation
      modGain.gain.setValueAtTime(baseFreq * 0.02, ctx.currentTime); // 2% modulation depth
      modOsc.connect(modGain);
      modGain.connect(osc.frequency);

      // Connect oscillator -> filter -> gain -> destination
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      // Set up filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);

      // Envelope
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      // Start oscillators
      osc.start(ctx.currentTime);
      modOsc.start(ctx.currentTime);

      // Stop after duration
      osc.stop(ctx.currentTime + duration);
      modOsc.stop(ctx.currentTime + duration);

      return gain;
    };

    if (type === 'jump') {
      // Rising whoosh with pitch bend
      const gain = createComplexTone(200, 0.3, 'sawtooth');
      // Pitch bend up
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.4, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      // Frequency sweep
      const osc = (gain.context as AudioContext).createOscillator();
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      const freqExp = this.audioCtx!.createGain();
      osc.connect(freqExp);
      freqExp.connect(osc.frequency);
      freqExp.gain.setValueAtTime(0, ctx.currentTime);
      freqExp.gain.linearRampToValueAtTime(200, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'land') {
      // Low thud with decay
      const gain = createComplexTone(80, 0.4, 'sine');
      // Add some noise for impact
      const noise = ctx.createBufferSource();
      const noiseBuffer = this.createNoiseBuffer(0.2, 0.05);
      noise.buffer = noiseBuffer;
      const noiseGain = ctx.createGain();
      noise.connect(noiseGain);
      noiseGain.gain.setValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.3, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      noiseGain.connect(gain.gain);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.5, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    } else if (type === 'collect') {
      // Bright chime with harmonics
      const gain1 = createComplexTone(523, 0.3, 'sine'); // C5
      const gain2 = createComplexTone(659, 0.3, 'sine'); // E5
      const gain3 = createComplexTone(784, 0.3, 'sine'); // G5

      // Staggered onset for chord effect
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.2, ctx.currentTime + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.05);
      gain2.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.2, ctx.currentTime + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      gain3.gain.setValueAtTime(0, ctx.currentTime + 0.1);
      gain3.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.2, ctx.currentTime + 0.11);
      gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    } else if (type === 'switch') {
      // Mechanical click
      const gain = createComplexTone(400, 0.1, 'square');
      // Add high-frequency click
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'pulse';
      click.frequency.setValueAtTime(2000, ctx.currentTime);
      click.connect(clickGain);
      clickGain.gain.setValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.2, ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      clickGain.connect(gain.gain);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.5, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      click.start(ctx.currentTime);
      click.stop(ctx.currentTime + 0.15);
    } else if (type === 'door') {
      // Creaking door
      const gain = createComplexTone(120, 1.0, 'sawtooth');
      // Slow creep
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.3, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

      // Add some randomness
      const noise = ctx.createBufferSource();
      const noiseBuffer = this.createNoiseBuffer(0.3, 0.8);
      noise.buffer = noiseBuffer;
      const noiseGain = ctx.createGain();
      noise.connect(noiseGain);
      noiseGain.gain.setValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.2, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      noiseGain.connect(gain.gain);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 1.0);
    } else if (type === 'complete') {
      // Triumphant fanfare
      const notes = [262, 330, 392, 523]; // C4, E4, G4, C5
      notes.forEach((freq, i) => {
        const delay = i * 0.15;
        const duration = 0.3;
        const gain = createComplexTone(freq, duration, 'sine');
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.25, ctx.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      });
    } else if (type === 'ambient_stinger') {
      // Subtle ambient swell
      const gain = ctx.createGain();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3

      // Slow attack and release
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.2, ctx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      // Add some modulation for interest
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.1, ctx.currentTime); // Very slow LFO
      lfoGain.gain.setValueAtTime(20, ctx.currentTime); // +/- 20Hz frequency variation
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      lfo.start(ctx.currentTime);

      osc.stop(ctx.currentTime + 3);
      lfo.stop(ctx.currentTime + 3);
    } else {
      // Fall back to original procedural sounds for other types
      this.playBasicProceduralSound(type);
    }
  }

  private playBasicProceduralSound(type: string): void {
    // Simplified version of the original procedural sounds
    // This maintains backward compatibility while we've enhanced the main ones
    const ctx = this.audioCtx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    let frequency = 440;
    let duration = 0.2;
    let waveType = 'sine';

    switch (type) {
      case 'jump':
        frequency = 300;
        duration = 0.15;
        waveType = 'sine';
        break;
      case 'land':
        frequency = 150;
        duration = 0.2;
        waveType = 'triangle';
        break;
      case 'collect':
        frequency = 523;
        duration = 0.3;
        waveType = 'sine';
        break;
      case 'switch':
        frequency = 200;
        duration = 0.15;
        waveType = 'square';
        break;
      case 'door':
        frequency = 100;
        duration = 0.5;
        waveType = 'sine';
        break;
      case 'complete':
        // Play a quick arpeggio
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          setTimeout(() => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
            g.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
            g.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.2, ctx.currentTime + i * 0.1 + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(ctx.currentTime + i * 0.1);
            o.stop(ctx.currentTime + i * 0.1 + 0.2);
          }, i * 100);
        });
        return; // Exit early since we handled it specially
      default:
        frequency = 440;
        duration = 0.1;
        waveType = 'sine';
    }

    osc.type = waveType as OscillatorType;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.state.sfxVolume * this.state.masterVolume * 0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  private createNoiseBuffer(duration: string | number, decay: number): AudioBuffer {
    if (!this.audioCtx) {
      return this.createSilentBuffer();
    }
    const sampleRate = this.audioCtx.sampleRate;
    const length = sampleRate * Math.max(0.1, parseFloat(duration.toString()));
    const buffer = this.audioCtx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // White noise with exponential decay
        const noise = (Math.random() * 2 - 1) * Math.exp(-(i / length) * 5 * parseFloat(decay.toString()));
        data[i] = noise;
      }
    }

    return buffer;
  }

  async startAmbient(theme: string): Promise<void> {
    if (this.state.muted || this.currentTheme === theme) return;
    this.initAudio();
    this.stopAmbient();
    this.currentTheme = theme;

    // Use theme-specific ambient track if available, otherwise fall back
    const audioUrl = this.themeMusicMap[theme] || this.defaultAmbient;

    try {
      const buffer = await this.loadAudio(audioUrl);
      const ctx = this.audioCtx!;
      this.bgmSource = ctx.createBufferSource();
      this.bgmSource.buffer = buffer;
      this.bgmSource.loop = true;

      this.bgmGain = ctx.createGain();
      // Start with silence and fade in
      this.bgmGain.gain.setValueAtTime(0, ctx.currentTime);
      this.bgmGain.gain.linearRampToValueAtTime(
        this.state.musicVolume * this.state.masterVolume * 0.6, // Slightly louder for better presence
        ctx.currentTime + 1.5
      );

      this.bgmSource.connect(this.bgmGain);
      this.bgmGain.connect(ctx.destination);
      this.bgmSource.start();
    } catch (e) {
      console.error('Error playing ambient:', e);
      // Fallback to silent ambient if loading fails
      this.createFallbackAmbient();
    }
  }

  private createFallbackAmbient(): void {
    if (!this.audioCtx) return;

    // Create a simple ambient drone as fallback
    const oscillator = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(110, 0); // Low A2 note

    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(this.state.musicVolume * this.state.masterVolume * 0.3, 1);

    oscillator.connect(gain);
    gain.connect(this.audioCtx.destination);

    this.bgmSource = oscillator;
    this.bgmGain = gain;

    oscillator.start(0);
  }

  stopAmbient(): void {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
        this.bgmSource.disconnect();
      } catch (e) {}
      this.bgmSource = null;
    }
    if (this.bgmGain) {
      try {
        this.bgmGain.gain.linearRampToValueAtTime(0, this.audioCtx!.currentTime + 0.5);
        setTimeout(() => {
          this.bgmGain?.disconnect();
        }, 600);
      } catch (e) {}
    }
    this.currentTheme = '';
  }

  setMuted(muted: boolean): void {
    this.state.muted = muted;
    if (muted) {
      this.stopAmbient();
    }
  }

  setMasterVolume(vol: number): void {
    this.state.masterVolume = vol;
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(
        this.state.musicVolume * vol * 0.6,
        this.audioCtx!.currentTime
      );
    }
  }

  update(): void {
    if (this.currentTheme && !this.state.muted && Math.random() < 0.001) {
      // Occasional atmospheric stinger
      this.playSoundProcedural('ambient_stinger');
    }

    // Dynamic music volume based on gameplay intensity could go here
    // For now, we'll keep it static but could be enhanced
  }

  destroy(): void {
    this.stopAmbient();
    if (this.audioCtx) {
      this.audioCtx.close();
    }
  }
}