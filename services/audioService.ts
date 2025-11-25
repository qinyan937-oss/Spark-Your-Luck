
class AudioService {
  private context: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.3;
  private bgmInterval: any = null;
  private bgmNodes: AudioNode[] = [];

  constructor() {
    // Context is initialized lazily to adhere to browser policies
  }

  init() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.context = new AudioContextClass();
      }
    }
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else {
      // If we were supposed to be playing music (logic handled in App), strictly toggle state here
      // But typically App.tsx manages the lifecycle. 
      // For simplicity, we just ensure mute stops things. 
      // Resume logic is situational, so we leave it to the caller if needed, 
      // or simply rely on the fact that toggleMute mutes all future sounds.
    }
    return this.isMuted;
  }

  getMuteState() {
    return this.isMuted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
    if (!this.context || this.isMuted) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime + startTime);

    gain.gain.setValueAtTime(this.volume, this.context.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start(this.context.currentTime + startTime);
    osc.stop(this.context.currentTime + startTime + duration);
  }

  // --- Ambient Background Music Generator ---
  
  startBackgroundMusic() {
    if (!this.context || this.isMuted) return;
    this.stopBackgroundMusic(); // Ensure no duplicates

    // Initial chord
    this.playAmbientChord();

    // Loop chords every 6 seconds
    this.bgmInterval = setInterval(() => {
      this.playAmbientChord();
    }, 6000);
  }

  stopBackgroundMusic() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    // Fade out active nodes
    const now = this.context?.currentTime || 0;
    this.bgmNodes.forEach(node => {
      if (node instanceof GainNode) {
        node.gain.cancelScheduledValues(now);
        node.gain.linearRampToValueAtTime(0, now + 1); // 1s fade out
      }
    });
    // Clean up array after fade
    setTimeout(() => {
      this.bgmNodes = [];
    }, 1000);
  }

  private playAmbientChord() {
    if (!this.context || this.isMuted) return;

    // Simple Ethereal Chords (Cmaj9 / Fmaj9)
    // C4, E4, G4, B4, D5
    const chord1 = [261.63, 329.63, 392.00, 493.88, 587.33]; 
    // F3, A3, C4, E4, G4
    const chord2 = [174.61, 220.00, 261.63, 329.63, 392.00];

    // Pick chord based on time (alternating)
    const time = Date.now();
    const isChord1 = Math.floor(time / 6000) % 2 === 0;
    const currentChord = isChord1 ? chord1 : chord2;

    const now = this.context.currentTime;
    const duration = 6.0;

    currentChord.forEach((freq, i) => {
      const osc = this.context!.createOscillator();
      const gain = this.context!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Soft attack and release (Pad sound)
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 2); // Slow attack
      gain.gain.linearRampToValueAtTime(0, now + duration); // Slow decay

      osc.connect(gain);
      gain.connect(this.context!.destination);

      osc.start(now);
      osc.stop(now + duration);

      this.bgmNodes.push(gain);
      // Detune slightly for warmth
      if (i > 0) {
         const osc2 = this.context!.createOscillator();
         osc2.type = 'sine';
         osc2.frequency.value = freq * 1.002; // Slight detune
         const gain2 = this.context!.createGain();
         gain2.gain.setValueAtTime(0, now);
         gain2.gain.linearRampToValueAtTime(0.03, now + 2.5);
         gain2.gain.linearRampToValueAtTime(0, now + duration);
         osc2.connect(gain2);
         gain2.connect(this.context!.destination);
         osc2.start(now);
         osc2.stop(now + duration);
         this.bgmNodes.push(gain2);
      }
    });
  }

  // Cute "Pop" / Bubble sound for clicking
  playPop() {
    if (!this.context || this.isMuted) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.frequency.setValueAtTime(600, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);
    
    gain.gain.setValueAtTime(this.volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  // Magic "Sparkle" sound for success
  playSparkle() {
    if (!this.context || this.isMuted) return;
    const now = this.context.currentTime;
    // Arpeggio
    [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
      this.playTone(freq, 'sine', 0.3, i * 0.05);
    });
  }

  // Camera Shutter sound
  playShutter() {
    if (!this.context || this.isMuted) return;
    
    // Create noise buffer
    const bufferSize = this.context.sampleRate * 0.1; // 100ms
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.5, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    noise.connect(gain);
    gain.connect(this.context.destination);
    noise.start();
  }

  // Swoosh sound for swiping
  playSwoosh() {
    if (!this.context || this.isMuted) return;
    
    // Use white noise with a lowpass filter sweep
    const bufferSize = this.context.sampleRate * 0.3;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, this.context.currentTime + 0.15);
    filter.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.3);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.15);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    noise.start();
  }

  // Tick sound for countdown
  playTick() {
    if (!this.context || this.isMuted) return;
    this.playTone(800, 'square', 0.05);
  }

  // Soft notification sound
  playPing() {
    if (!this.context || this.isMuted) return;
    this.playTone(1200, 'sine', 0.2);
  }
}

export const audio = new AudioService();
