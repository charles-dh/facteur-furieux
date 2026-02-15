/**
 * Sound Generator using Web Audio API
 *
 * Generates retro-style arcade sound effects procedurally
 * instead of loading audio files. This creates lightweight,
 * customizable sounds with a classic 8-bit feel.
 *
 * All sounds are generated as audio buffers and can be played
 * through Phaser's sound system.
 */
export default class SoundGenerator {
  constructor() {
    // Web Audio API context
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  /**
   * Generate an acceleration/boost sound
   * Rising pitch with slight wobble
   *
   * @returns {AudioBuffer} Generated sound buffer
   */
  generateAccelerateSound() {
    const duration = 0.3; // 300ms
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;

      // Rising frequency from 200Hz to 400Hz
      const frequency = 200 + (t / duration) * 200;

      // Square wave with envelope
      const value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
      const envelope = 1 - (t / duration); // Fade out

      data[i] = value * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * Generate a correct answer chime
   * Pleasant ascending tone
   *
   * @returns {AudioBuffer} Generated sound buffer
   */
  generateCorrectSound() {
    const duration = 0.4; // 400ms
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Two-tone chime: E5 (659Hz) then A5 (880Hz)
    const tone1Duration = 0.15;
    const tone2Duration = 0.25;

    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;

      let frequency = 659; // E5
      if (t > tone1Duration) {
        frequency = 880; // A5
      }

      // Sine wave (smoother, more pleasant)
      const value = Math.sin(2 * Math.PI * frequency * t);

      // Envelope (fade out)
      const envelope = Math.max(0, 1 - (t / duration));

      data[i] = value * envelope * 0.4;
    }

    return buffer;
  }

  /**
   * Generate an incorrect answer buzz
   * Low dissonant tone
   *
   * @returns {AudioBuffer} Generated sound buffer
   */
  generateIncorrectSound() {
    const duration = 0.3; // 300ms
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;

      // Low frequency buzz with slight dissonance
      const freq1 = 120; // Low note
      const freq2 = 110; // Slightly off for dissonance

      const value1 = Math.sin(2 * Math.PI * freq1 * t);
      const value2 = Math.sin(2 * Math.PI * freq2 * t);
      const value = (value1 + value2) / 2;

      // Quick fade out
      const envelope = Math.max(0, 1 - (t / duration) * 2);

      data[i] = value * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * Generate lap completion fanfare
   * Triumphant ascending arpeggio
   *
   * @returns {AudioBuffer} Generated sound buffer
   */
  generateLapCompleteSound() {
    const duration = 0.8; // 800ms
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Major chord arpeggio: C-E-G-C (262, 330, 392, 523 Hz)
    const notes = [262, 330, 392, 523];
    const noteDuration = duration / notes.length;

    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.min(Math.floor(t / noteDuration), notes.length - 1);
      const frequency = notes[noteIndex];

      // Sine wave
      const value = Math.sin(2 * Math.PI * frequency * t);

      // Envelope (fade out at end)
      const envelope = Math.max(0, 1 - Math.max(0, (t - duration * 0.6) / (duration * 0.4)));

      data[i] = value * envelope * 0.4;
    }

    return buffer;
  }

  /**
   * Generate problem appearance beep
   * Short high-pitched blip
   *
   * @returns {AudioBuffer} Generated sound buffer
   */
  generateProblemAppearSound() {
    const duration = 0.1; // 100ms
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;

      // High pitched beep
      const frequency = 800;
      const value = Math.sin(2 * Math.PI * frequency * t);

      // Quick envelope
      const envelope = 1 - (t / duration);

      data[i] = value * envelope * 0.2;
    }

    return buffer;
  }

  /**
   * Generate countdown tick
   * Simple short beep
   *
   * @returns {AudioBuffer} Generated sound buffer
   */
  generateCountdownTickSound() {
    const duration = 0.15; // 150ms — short and punchy
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      const progress = t / duration;

      // Higher pitch: 880Hz (A5) with slight upward sweep to 920Hz
      const frequency = 880 + progress * 40;

      // Sine + fifth harmonic for a bright, arcade "bip"
      const sine = Math.sin(2 * Math.PI * frequency * t);
      const fifth = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.2;
      const value = sine + fifth;

      // Snappy envelope: instant attack, quick decay
      let envelope;
      if (progress < 0.02) {
        envelope = progress / 0.02;
      } else {
        envelope = 1.0 - (progress - 0.02) / 0.98;
      }

      data[i] = value * envelope * 0.4;
    }

    return buffer;
  }

  /**
   * Generate menu click sound
   * Short punchy click
   *
   * @returns {AudioBuffer} Generated sound buffer
   */
  generateMenuClickSound() {
    const duration = 0.08; // 80ms
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;

      // Higher frequency for click
      const frequency = 1000;
      const value = Math.sin(2 * Math.PI * frequency * t);

      // Very quick envelope
      const envelope = 1 - (t / duration);

      data[i] = value * envelope * 0.2;
    }

    return buffer;
  }

  /**
   * Generate menu hover sound
   * Very subtle short beep
   *
   * @returns {AudioBuffer} Generated sound buffer
   */
  generateMenuHoverSound() {
    const duration = 0.05; // 50ms
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;

      // Medium-high frequency
      const frequency = 700;
      const value = Math.sin(2 * Math.PI * frequency * t);

      // Quick envelope
      const envelope = 1 - (t / duration);

      data[i] = value * envelope * 0.15;
    }

    return buffer;
  }

  /**
   * Generate game start sound
   * "GO!" emphatic sound
   *
   * @returns {AudioBuffer} Generated sound buffer
   */
  generateGameStartSound() {
    const duration = 0.5; // 500ms
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      const progress = t / duration;

      // Two-tone: E5 (660Hz) then A5 (880Hz) for a triumphant "GO!"
      const frequency = progress < 0.3 ? 660 : 880;

      // Sine + octave harmonic for richness
      const sine = Math.sin(2 * Math.PI * frequency * t);
      const octave = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
      const value = sine + octave;

      // Punchy envelope with sustain
      let envelope;
      if (progress < 0.03) {
        envelope = progress / 0.03;
      } else if (progress < 0.6) {
        envelope = 1.0;
      } else {
        envelope = 1.0 - (progress - 0.6) / 0.4;
      }

      data[i] = value * envelope * 0.4;
    }

    return buffer;
  }

  /**
   * Convert AudioBuffer to base64 WAV string for Phaser
   * Phaser can load audio from base64 data URIs
   *
   * @param {AudioBuffer} audioBuffer - Buffer to convert
   * @returns {string} Base64 encoded WAV data URI
   */
  bufferToBase64WAV(audioBuffer) {
    // Create WAV file from audio buffer
    const length = audioBuffer.length * audioBuffer.numberOfChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    // Write WAV header
    let offset = 0;
    const writeString = (str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset++, str.charCodeAt(i));
      }
    };

    writeString('RIFF');
    view.setUint32(offset, 36 + audioBuffer.length * 2, true); offset += 4;
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(offset, 16, true); offset += 4; // fmt chunk size
    view.setUint16(offset, 1, true); offset += 2; // PCM format
    view.setUint16(offset, channels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * channels * 2, true); offset += 4;
    view.setUint16(offset, channels * 2, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString('data');
    view.setUint32(offset, audioBuffer.length * channels * 2, true); offset += 4;

    // Write audio data
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    // Convert to base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return 'data:audio/wav;base64,' + base64;
  }
}
