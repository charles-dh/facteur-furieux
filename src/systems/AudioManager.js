import { AUDIO } from '../config/audioConfig.js';

/**
 * Audio Manager System
 *
 * Centralized audio management for the game:
 * - Sound effect playback with volume control
 * - Background music with looping and crossfade
 * - Volume controls (master, SFX, music)
 * - Mute/unmute functionality
 * - Settings persistence via localStorage
 *
 * Usage:
 *   const audio = new AudioManager(scene);
 *   audio.playSFX(AUDIO.SFX.CORRECT);
 *   audio.playMusic(AUDIO.MUSIC.GAMEPLAY);
 */
export default class AudioManager {
  constructor(scene) {
    this.scene = scene;

    // Volume state
    this.volumes = {
      master: AUDIO.DEFAULT_MASTER_VOLUME,
      sfx: AUDIO.DEFAULT_SFX_VOLUME,
      music: AUDIO.DEFAULT_MUSIC_VOLUME
    };

    this.muted = false;

    // Currently playing music
    this.currentMusic = null;

    // Currently playing boost sound
    this.currentBoostSound = null;
    this.boostFadeTween = null;

    // Load settings from localStorage
    this.loadSettings();

    console.log('AudioManager initialized with volumes:', this.volumes);
  }

  /**
   * Play a sound effect
   *
   * @param {string} key - Sound key (from AUDIO.SFX)
   * @param {number} volume - Individual sound volume (0-1), default 1.0
   * @returns {Phaser.Sound.BaseSound|null} The sound instance or null if muted
   */
  playSFX(key, volume = 1.0) {
    if (this.muted) return null;

    // Check if sound exists in cache
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`Sound effect '${key}' not found in cache`);
      return null;
    }

    // Calculate final volume (master × sfx × individual)
    const finalVolume = this.volumes.master * this.volumes.sfx * volume;

    console.log(`Playing SFX: ${key} at volume ${finalVolume.toFixed(2)}`);

    // Play the sound
    const sound = this.scene.sound.add(key);
    sound.play({ volume: finalVolume });

    return sound;
  }

  /**
   * Stop a specific sound effect
   *
   * @param {string} key - Sound key to stop
   */
  stopSFX(key) {
    const sound = this.scene.sound.get(key);
    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }

  /**
   * Play boost sound synchronized with boost effect
   * The sound will play until stopBoostSound() is called
   *
   * @param {number} boostStrength - Boost strength (0-1) affects volume
   * @returns {Phaser.Sound.BaseSound|null} The sound instance or null if muted
   */
  playBoostSound(boostStrength) {
    if (this.muted) return null;

    // Stop any currently playing boost sound
    this.stopBoostSound();

    // Check if sound exists in cache
    if (!this.scene.cache.audio.exists(AUDIO.SFX.BOOST)) {
      console.warn(`Boost sound '${AUDIO.SFX.BOOST}' not found in cache`);
      return null;
    }

    // Calculate volume based on boost strength (stronger boost = louder)
    const boostVolume = 0.5 + (boostStrength * 0.5); // Range: 0.5 to 1.0
    const finalVolume = this.volumes.master * this.volumes.sfx * boostVolume;

    console.log(`Playing boost sound at volume ${finalVolume.toFixed(2)} (boost: ${boostStrength.toFixed(2)})`);

    // Play the boost sound
    this.currentBoostSound = this.scene.sound.add(AUDIO.SFX.BOOST);
    this.currentBoostSound.play({ volume: finalVolume });

    return this.currentBoostSound;
  }

  /**
   * Stop boost sound with fade out
   * Called when boost effect ends
   */
  stopBoostSound() {
    // Cancel any existing fade tween
    if (this.boostFadeTween) {
      this.boostFadeTween.stop();
      this.boostFadeTween = null;
    }

    // Fade out and stop the boost sound if playing
    if (this.currentBoostSound && this.currentBoostSound.isPlaying) {
      console.log('Fading out boost sound');

      this.boostFadeTween = this.scene.tweens.add({
        targets: this.currentBoostSound,
        volume: 0,
        duration: AUDIO.BOOST_FADE_OUT,
        onComplete: () => {
          if (this.currentBoostSound) {
            this.currentBoostSound.stop();
            this.currentBoostSound = null;
          }
          this.boostFadeTween = null;
        }
      });
    }
  }

  /**
   * Play background music with looping
   *
   * @param {string} key - Music key (from AUDIO.MUSIC)
   * @param {boolean} loop - Whether to loop the music, default true
   * @param {number} volume - Individual music volume (0-1), default 1.0
   * @returns {Phaser.Sound.BaseSound|null} The music instance or null if muted
   */
  playMusic(key, loop = true, volume = 1.0) {
    if (this.muted) return null;

    // Check if music exists
    if (!this.scene.sound.get(key)) {
      console.warn(`Music '${key}' not found`);
      return null;
    }

    // Stop current music if playing
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.stop();
    }

    // Calculate final volume (master × music × individual)
    const finalVolume = this.volumes.master * this.volumes.music * volume;

    // Play new music
    this.currentMusic = this.scene.sound.add(key);
    this.currentMusic.play({
      loop: loop,
      volume: finalVolume
    });

    console.log(`Playing music: ${key} (volume: ${finalVolume.toFixed(2)})`);

    return this.currentMusic;
  }

  /**
   * Stop currently playing music
   */
  stopMusic() {
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.stop();
      this.currentMusic = null;
      console.log('Music stopped');
    }
  }

  /**
   * Pause currently playing music
   */
  pauseMusic() {
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.pause();
      console.log('Music paused');
    }
  }

  /**
   * Resume paused music
   */
  resumeMusic() {
    if (this.currentMusic && this.currentMusic.isPaused) {
      this.currentMusic.resume();
      console.log('Music resumed');
    }
  }

  /**
   * Set master volume
   *
   * @param {number} volume - Volume level (0-1)
   */
  setMasterVolume(volume) {
    this.volumes.master = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
    this.saveSettings();
    console.log(`Master volume: ${this.volumes.master.toFixed(2)}`);
  }

  /**
   * Set SFX volume
   *
   * @param {number} volume - Volume level (0-1)
   */
  setSFXVolume(volume) {
    this.volumes.sfx = Math.max(0, Math.min(1, volume));
    this.saveSettings();
    console.log(`SFX volume: ${this.volumes.sfx.toFixed(2)}`);
  }

  /**
   * Set music volume
   *
   * @param {number} volume - Volume level (0-1)
   */
  setMusicVolume(volume) {
    this.volumes.music = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
    this.saveSettings();
    console.log(`Music volume: ${this.volumes.music.toFixed(2)}`);
  }

  /**
   * Toggle mute/unmute
   *
   * @returns {boolean} New muted state
   */
  toggleMute() {
    this.muted = !this.muted;

    if (this.muted) {
      // Pause all audio
      this.scene.sound.pauseAll();
      console.log('Audio muted');
    } else {
      // Resume all audio
      this.scene.sound.resumeAll();
      console.log('Audio unmuted');
    }

    this.saveSettings();
    return this.muted;
  }

  /**
   * Check if audio is muted
   *
   * @returns {boolean} Muted state
   */
  isMuted() {
    return this.muted;
  }

  /**
   * Get current volume settings
   *
   * @returns {Object} Volume settings {master, sfx, music}
   */
  getVolumes() {
    return { ...this.volumes };
  }

  /**
   * Update all currently playing sounds to new volume levels
   * @private
   */
  updateAllVolumes() {
    // Update music volume
    if (this.currentMusic && this.currentMusic.isPlaying) {
      const finalVolume = this.volumes.master * this.volumes.music;
      this.currentMusic.setVolume(finalVolume);
    }

    // Note: Individual SFX volumes are set at play time, so no update needed
  }

  /**
   * Save settings to localStorage
   * @private
   */
  saveSettings() {
    try {
      localStorage.setItem(AUDIO.STORAGE_KEYS.MASTER_VOLUME, this.volumes.master);
      localStorage.setItem(AUDIO.STORAGE_KEYS.SFX_VOLUME, this.volumes.sfx);
      localStorage.setItem(AUDIO.STORAGE_KEYS.MUSIC_VOLUME, this.volumes.music);
      localStorage.setItem(AUDIO.STORAGE_KEYS.MUTED, this.muted);
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }

  /**
   * Load settings from localStorage
   * @private
   */
  loadSettings() {
    try {
      const masterVolume = localStorage.getItem(AUDIO.STORAGE_KEYS.MASTER_VOLUME);
      const sfxVolume = localStorage.getItem(AUDIO.STORAGE_KEYS.SFX_VOLUME);
      const musicVolume = localStorage.getItem(AUDIO.STORAGE_KEYS.MUSIC_VOLUME);
      const muted = localStorage.getItem(AUDIO.STORAGE_KEYS.MUTED);

      if (masterVolume !== null) this.volumes.master = parseFloat(masterVolume);
      if (sfxVolume !== null) this.volumes.sfx = parseFloat(sfxVolume);
      if (musicVolume !== null) this.volumes.music = parseFloat(musicVolume);
      if (muted !== null) this.muted = muted === 'true';

      console.log('Loaded audio settings from localStorage');
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  /**
   * Crossfade from current music to new track
   *
   * @param {string} newKey - New music key
   * @param {number} duration - Fade duration in ms
   */
  crossfade(newKey, duration = AUDIO.FADE_DURATION) {
    if (!this.currentMusic || !this.currentMusic.isPlaying) {
      // No current music, just start new one
      this.playMusic(newKey);
      return;
    }

    const oldMusic = this.currentMusic;
    const oldVolume = oldMusic.volume;

    // Fade out old music
    this.scene.tweens.add({
      targets: oldMusic,
      volume: 0,
      duration: duration,
      onComplete: () => {
        oldMusic.stop();
      }
    });

    // Start new music at 0 volume
    const finalVolume = this.volumes.master * this.volumes.music;
    this.currentMusic = this.scene.sound.add(newKey);
    this.currentMusic.play({ loop: true, volume: 0 });

    // Fade in new music
    this.scene.tweens.add({
      targets: this.currentMusic,
      volume: finalVolume,
      duration: duration
    });

    console.log(`Crossfading to: ${newKey}`);
  }
}
