/**
 * Audio Configuration
 *
 * Central configuration for all audio settings, sound effect keys,
 * music keys, and audio effect parameters.
 */

export const AUDIO = {
  // Volume defaults (0-1 range)
  DEFAULT_MASTER_VOLUME: 0.7,
  DEFAULT_SFX_VOLUME: 1.0,
  DEFAULT_MUSIC_VOLUME: 0.5,

  // Sound effect keys
  // These match the keys used when loading/playing sounds
  SFX: {
    ACCELERATE: 'sfx_accelerate',
    CORRECT: 'sfx_correct',
    INCORRECT: 'sfx_incorrect',
    LAP_COMPLETE: 'sfx_lap_complete',
    PROBLEM_APPEAR: 'sfx_problem_appear',
    COUNTDOWN_TICK: 'sfx_countdown_tick',
    MENU_CLICK: 'sfx_menu_click',
    MENU_HOVER: 'sfx_menu_hover',
    GAME_START: 'sfx_game_start'
  },

  // Music keys
  MUSIC: {
    MENU: 'music_menu',
    GAMEPLAY: 'music_gameplay',
    GAME_OVER: 'music_game_over'
  },

  // Effect settings
  FADE_DURATION: 500,  // ms for crossfade between tracks
  MAX_SIMULTANEOUS_SFX: 8,  // Limit concurrent sound effects

  // LocalStorage keys for persistence
  STORAGE_KEYS: {
    MASTER_VOLUME: 'mathracer_volume_master',
    SFX_VOLUME: 'mathracer_volume_sfx',
    MUSIC_VOLUME: 'mathracer_volume_music',
    MUTED: 'mathracer_muted'
  }
};

export const EFFECTS = {
  // Screen shake parameters
  SCREEN_SHAKE: {
    INTENSITY: 10,      // pixels
    DURATION: 200       // ms
  },

  // Particle effect parameters
  PARTICLES: {
    // Speed boost particles (from car rear)
    SPEED_BOOST: {
      QUANTITY: 2,        // Particles per emission
      LIFESPAN: 300,      // ms
      SPEED: { min: 50, max: 100 },
      SCALE: { start: 1, end: 0 },
      ALPHA: { start: 1, end: 0 },
      TINT: 0xffaa00      // Orange/yellow
    },

    // Lap celebration confetti
    CELEBRATION: {
      QUANTITY: 50,
      LIFESPAN: 1000,
      SPEED: { min: 100, max: 200 },
      SCALE: { start: 0.5, end: 0 },
      GRAVITY: 200,
      COLORS: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]
    },

    // Correct answer sparkle
    CORRECT_FLASH: {
      QUANTITY: 10,
      LIFESPAN: 500,
      SPEED: { min: 50, max: 150 },
      SCALE: { start: 1, end: 0 },
      TINT: 0x00ff00      // Green
    }
  },

  // Animation timings
  ANIMATIONS: {
    BUTTON_PRESS: 100,    // Button scale animation duration
    FADE_IN: 300,         // Standard fade in
    FADE_OUT: 300,        // Standard fade out
    PROBLEM_APPEAR: 300,  // Problem text animation
    COUNTDOWN: 800        // Countdown number display
  },

  // Timer color thresholds (based on remaining time percentage)
  TIMER_COLORS: {
    SAFE: { threshold: 0.5, color: '#00ff00' },    // > 50% time remaining
    WARNING: { threshold: 0.25, color: '#ffaa00' }, // 25-50% remaining
    DANGER: { threshold: 0, color: '#ff0000' }      // < 25% remaining
  }
};
