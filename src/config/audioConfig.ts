// Audio configuration — SFX/music keys, volumes, and effect parameters.

export const AUDIO = {
  // Volume defaults (0-1)
  DEFAULT_MASTER_VOLUME: 0.7,
  DEFAULT_SFX_VOLUME: 1.0,
  DEFAULT_MUSIC_VOLUME: 0.5,

  // SFX keys — must match the keys used at load time.
  SFX: {
    ACCELERATE: 'sfx_accelerate',
    CORRECT: 'sfx_correct',
    BOOST: 'sfx_boost',
    INCORRECT: 'sfx_incorrect',
    LAP_COMPLETE: 'sfx_lap_complete',
    PROBLEM_APPEAR: 'sfx_problem_appear',
    COUNTDOWN_TICK: 'sfx_countdown_tick',
    MENU_CLICK: 'sfx_menu_click',
    MENU_HOVER: 'sfx_menu_hover',
    GAME_START: 'sfx_game_start',
  },

  MUSIC: {
    MENU: 'music_menu',
    GAMEPLAY: 'music_gameplay',
    GAME_OVER: 'music_game_over',
  },

  FADE_DURATION: 500,         // crossfade between tracks
  BOOST_FADE_OUT: 1000,       // boost vroom fade-out
  MAX_SIMULTANEOUS_SFX: 8,

  STORAGE_KEYS: {
    MASTER_VOLUME: 'mathracer_volume_master',
    SFX_VOLUME: 'mathracer_volume_sfx',
    MUSIC_VOLUME: 'mathracer_volume_music',
    MUTED: 'mathracer_muted',
  },
} as const;

export const EFFECTS = {
  SCREEN_SHAKE: {
    INTENSITY: 10, // px
    DURATION: 200, // ms
  },

  PARTICLES: {
    SPEED_BOOST: {
      QUANTITY: 5,
      LIFESPAN: 800,
      SPEED: { min: 20, max: 60 },
      SCALE: { start: 1.5, end: 0.3 },
      ALPHA: { start: 0.9, end: 0 },
      TINT: 0xff6600,
    },

    CELEBRATION: {
      QUANTITY: 50,
      LIFESPAN: 1000,
      SPEED: { min: 100, max: 200 },
      SCALE: { start: 0.5, end: 0 },
      GRAVITY: 200,
      COLORS: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff],
    },

    CORRECT_FLASH: {
      QUANTITY: 10,
      LIFESPAN: 500,
      SPEED: { min: 50, max: 150 },
      SCALE: { start: 1, end: 0 },
      TINT: 0x00ff00,
    },
  },

  ANIMATIONS: {
    BUTTON_PRESS: 100,
    FADE_IN: 300,
    FADE_OUT: 300,
    PROBLEM_APPEAR: 300,
    COUNTDOWN: 800,
  },

  // Timer bar color thresholds, keyed by remaining-time percentage.
  TIMER_COLORS: {
    SAFE: { threshold: 0.5, color: '#00ff00' },
    WARNING: { threshold: 0.25, color: '#ffaa00' },
    DANGER: { threshold: 0, color: '#ff0000' },
  },
} as const;
