import { AUDIO } from "../config/audioConfig.js";

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
      music: AUDIO.DEFAULT_MUSIC_VOLUME,
    };

    this.muted = false;

    // Currently playing music
    this.currentMusic = null;

    // Boost sound state
    // The boost sound plays while the car is boosting and fades out when the
    // boost ends. For answer streaks, the sound continues seamlessly — each
    // new correct answer extends the boost rather than restarting the sound.
    this.currentBoostSound = null;
    this.boostFadeTween = null;

    // Track crossfade tweens for cleanup
    this.crossfadeTweens = [];

    // Load settings from localStorage
    this.loadSettings();

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

    // Use scene.sound.play() directly — unlike sound.add() + play(),
    // this doesn't create a persistent sound object that leaks in the
    // sound manager. Short fire-and-forget SFX don't need a reference.
    this.scene.sound.play(key, { volume: finalVolume });
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
   * Start or continue the boost sound.
   *
   * Design: The boost sound is driven by the game loop's boostEmitterTimer,
   * NOT by its own internal timers. GameScene calls startBoostSound() when
   * the boost begins and stopBoostSound() when the emitter timer runs out.
   *
   * For streaks, if the sound is already playing we just bump the volume —
   * no restart, no seek tracking, no parallel timers. Simple and reliable.
   *
   * @param {number} boostStrength - Boost strength (0-1) affects volume
   */
  startBoostSound(boostStrength) {
    if (this.muted) return null;

    // Calculate volume based on boost strength (stronger boost = louder)
    const boostVolume = 0.5 + boostStrength * 0.5; // Range: 0.5 to 1.0
    const finalVolume = this.volumes.master * this.volumes.sfx * boostVolume;

    // If already playing, just update the volume (streak continuation)
    if (this.currentBoostSound && this.currentBoostSound.isPlaying) {
      // Cancel any pending fade — the boost got extended
      if (this.boostFadeTween) {
        this.boostFadeTween.stop();
        this.boostFadeTween = null;
      }
      this.currentBoostSound.setVolume(finalVolume);
      return this.currentBoostSound;
    }

    // Check if sound exists in cache
    if (!this.scene.cache.audio.exists(AUDIO.SFX.BOOST)) {
      console.warn(`Boost sound '${AUDIO.SFX.BOOST}' not found in cache`);
      return null;
    }

    // Start a new boost sound (loop so it plays for the full boost duration)
    this.currentBoostSound = this.scene.sound.add(AUDIO.SFX.BOOST, {
      loop: true,
    });
    this.currentBoostSound.play({ volume: finalVolume });

    return this.currentBoostSound;
  }

  /**
   * Stop the boost sound with a quick fade out.
   * Called by GameScene when the boostEmitterTimer reaches zero.
   */
  stopBoostSound() {
    // Cancel any existing fade tween
    if (this.boostFadeTween) {
      this.boostFadeTween.stop();
      this.boostFadeTween = null;
    }

    if (!this.currentBoostSound) return;

    // Capture local reference so callback doesn't touch a replaced sound
    const soundToStop = this.currentBoostSound;
    this.currentBoostSound = null;

    if (soundToStop.isPlaying) {
      // Fade out over 200ms for a smooth cut
      this.boostFadeTween = this.scene.tweens.add({
        targets: soundToStop,
        volume: 0,
        duration: 200,
        onComplete: () => {
          soundToStop.stop();
          soundToStop.destroy();
          this.boostFadeTween = null;
        },
      });
    } else {
      soundToStop.destroy();
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
      volume: finalVolume,
    });

    return this.currentMusic;
  }

  /**
   * Stop currently playing music
   */
  stopMusic() {
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  /**
   * Pause currently playing music
   */
  pauseMusic() {
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.pause();
    }
  }

  /**
   * Resume paused music
   */
  resumeMusic() {
    if (this.currentMusic && this.currentMusic.isPaused) {
      this.currentMusic.resume();
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
  }

  /**
   * Set SFX volume
   *
   * @param {number} volume - Volume level (0-1)
   */
  setSFXVolume(volume) {
    this.volumes.sfx = Math.max(0, Math.min(1, volume));
    this.saveSettings();
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
    } else {
      // Resume all audio
      this.scene.sound.resumeAll();
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
      localStorage.setItem(
        AUDIO.STORAGE_KEYS.MASTER_VOLUME,
        this.volumes.master
      );
      localStorage.setItem(AUDIO.STORAGE_KEYS.SFX_VOLUME, this.volumes.sfx);
      localStorage.setItem(AUDIO.STORAGE_KEYS.MUSIC_VOLUME, this.volumes.music);
      localStorage.setItem(AUDIO.STORAGE_KEYS.MUTED, this.muted);
    } catch (error) {
      console.warn("Failed to save audio settings:", error);
    }
  }

  /**
   * Load settings from localStorage
   * @private
   */
  loadSettings() {
    try {
      const masterVolume = localStorage.getItem(
        AUDIO.STORAGE_KEYS.MASTER_VOLUME
      );
      const sfxVolume = localStorage.getItem(AUDIO.STORAGE_KEYS.SFX_VOLUME);
      const musicVolume = localStorage.getItem(AUDIO.STORAGE_KEYS.MUSIC_VOLUME);
      const muted = localStorage.getItem(AUDIO.STORAGE_KEYS.MUTED);

      if (masterVolume !== null) this.volumes.master = parseFloat(masterVolume);
      if (sfxVolume !== null) this.volumes.sfx = parseFloat(sfxVolume);
      if (musicVolume !== null) this.volumes.music = parseFloat(musicVolume);
      if (muted !== null) this.muted = muted === "true";

    } catch (error) {
      console.warn("Failed to load audio settings:", error);
    }
  }

  /**
   * Crossfade from current music to new track
   *
   * @param {string} newKey - New music key
   * @param {number} duration - Fade duration in ms
   */
  crossfade(newKey, duration = AUDIO.FADE_DURATION) {
    // Fix: Track and clean up crossfade tweens to prevent memory leaks
    // Kill any existing crossfade tweens
    if (this.crossfadeTweens) {
      this.crossfadeTweens.forEach(tween => {
        if (tween) tween.stop();
      });
    }
    this.crossfadeTweens = [];

    if (!this.currentMusic || !this.currentMusic.isPlaying) {
      // No current music, just start new one
      this.playMusic(newKey);
      return;
    }

    const oldMusic = this.currentMusic;

    // Fade out old music
    const fadeOutTween = this.scene.tweens.add({
      targets: oldMusic,
      volume: 0,
      duration: duration,
      onComplete: () => {
        oldMusic.stop();
        oldMusic.destroy();
      },
    });
    this.crossfadeTweens.push(fadeOutTween);

    // Start new music at 0 volume
    const finalVolume = this.volumes.master * this.volumes.music;
    this.currentMusic = this.scene.sound.add(newKey);
    this.currentMusic.play({ loop: true, volume: 0 });

    // Fade in new music
    const fadeInTween = this.scene.tweens.add({
      targets: this.currentMusic,
      volume: finalVolume,
      duration: duration,
    });
    this.crossfadeTweens.push(fadeInTween);
  }
}
