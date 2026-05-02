// Game tuning constants — centralized for easy balance adjustments.
// Use `as const` so consumers get literal types (e.g. exact GAME.LAPS_TO_COMPLETE).

export const PHYSICS = {
  /** Maximum velocity in track-progress per second (0-1 scale). */
  MAX_SPEED: 1.3,
  /** Per-frame multiplicative friction (0.99 = retain 99% per frame). */
  FRICTION: 0.99,
  /** Base acceleration added per boost (progress per second²). */
  BASE_ACCELERATION: 0.18,
  /** Cars can come to a full stop. */
  MIN_VELOCITY: 0,
} as const;

export const TIMING = {
  /** Time to answer one problem, in ms. */
  PROBLEM_TIMER: 6000,
  /** Grace period before the timer starts ticking (lets the player read). */
  PROBLEM_READ_DELAY: 500,
  /** Near-instant transition after a correct answer. */
  CORRECT_ANSWER_DELAY: 1,
  /** Near-instant transition after a timeout. */
  TIMEOUT_DELAY: 10,
  /** Duration of visual feedback flashes. */
  FEEDBACK_DURATION: 1000,
} as const;

export const BOOST = {
  /** Linear remainingTime → boost mapping. 1.0 means full timer = full boost. */
  SCALE: 1.0,
} as const;

export const GAME = {
  LAPS_TO_COMPLETE: 5,
  /**
   * Logical canvas size. Aspect ratio matches the track background image
   * (assets/perspective/FactorFuriousTraccHD.png — 1698×926, ~16:8.7).
   * Phaser's Scale.FIT (set in gameConfig.ts) scales this to fit the window
   * while preserving aspect ratio, so devices see this exact aspect ratio
   * with letterboxing as needed.
   */
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 698,
} as const;

export const TRACK = {
  WIDTH: 60,
  CENTER_LINE_WIDTH: 3,
  START_FINISH_WIDTH: 10,
  START_FINISH_HEIGHT: 60,
} as const;

export const CAR = {
  /**
   * Display size of the car sprite, in canvas pixels. The 3/4-perspective
   * sprites are 250×250 with the car silhouette occupying ~50% of the frame;
   * displaying the whole 250×250 quad at this size puts the visible car at
   * roughly half the WIDTH/HEIGHT. Adjust if the car looks too big or small
   * relative to the road width.
   */
  WIDTH: 130,
  HEIGHT: 130,

  /**
   * Number of pre-rendered angle frames in the car spritesheet (every 360/N
   * degrees, clockwise from straight-up). Files live under
   * assets/perspective/car/car_NNN.png where NNN is the angle in degrees.
   */
  NUM_ANGLE_FRAMES: 24,
} as const;
