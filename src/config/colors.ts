// Retro arcade color palette. Numeric Phaser-style hex (0xRRGGBB).
export const COLORS = {
  // Car
  CAR_RED: 0xff0000,

  // Track
  TRACK_GRAY: 0x404040,
  TRACK_LINE_WHITE: 0xffffff,
  START_FINISH_RED: 0xff0000,

  // Background
  GRASS_GREEN: 0x00aa00,

  // UI
  UI_TEXT: 0xffffff,
  UI_ACCENT: 0xffff00,
  UI_BACKGROUND: 0x000000,

  // Timer bar
  TIMER_GREEN: 0x00ff00,
  TIMER_YELLOW: 0xffff00,
  TIMER_RED: 0xff0000,

  // Feedback
  CORRECT_GREEN: 0x00ff00,
  INCORRECT_RED: 0xff0000,

  // Particles
  BOOST_ORANGE: 0xff6600,
  BOOST_YELLOW: 0xffff00,
} as const;
