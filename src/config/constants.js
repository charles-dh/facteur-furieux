// Game tuning constants - centralized for easy balance adjustments

export const PHYSICS = {
  MAX_SPEED: 1.3, // Maximum velocity (progress per second, 0-1 scale)
  // 0.3 = 30% of track per second = ~3.3 seconds per lap
  FRICTION: 0.99, // Applied every frame (0.985 = retains 98.5% velocity)
  BASE_ACCELERATION: 0.18, // Base acceleration amount (in progress per second²)
  // Increased for more responsive boosts
  MIN_VELOCITY: 0, // Car CAN stop completely (zero velocity)
};

export const TIMING = {
  PROBLEM_TIMER: 6000, // 6 seconds in milliseconds
  PROBLEM_READ_DELAY: 500, // 0.5 seconds delay before timer starts (gives time to read problem)
  CORRECT_ANSWER_DELAY: 1, // 0.5 seconds (30 frames) after correct answer
  TIMEOUT_DELAY: 10, // 0.16 seconds (10 frames) after timeout
  FEEDBACK_DURATION: 20, // 1 second (60 frames) for visual feedback
};

export const BOOST = {
  // Linear mapping: remainingTime / totalTime → boost multiplier
  // 6 seconds remaining = 1.0x boost (maximum)
  // 0 seconds remaining = 0.0x boost (no boost on timeout)
  SCALE: 1.0,
};

export const GAME = {
  LAPS_TO_COMPLETE: 5,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 800,
};

export const TRACK = {
  WIDTH: 60, // Track width in pixels
  CENTER_LINE_WIDTH: 3, // Dashed center line width
  START_FINISH_WIDTH: 10, // Start/finish line width
  START_FINISH_HEIGHT: 60, // Start/finish line height
};

export const CAR = {
  WIDTH: 25, // Car width (sprite display size)
  HEIGHT: 36, // Car height (sprite display size)
};
