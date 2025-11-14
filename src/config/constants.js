// Game tuning constants - centralized for easy balance adjustments

export const PHYSICS = {
  MAX_SPEED: 5,                  // Maximum velocity units per second
  FRICTION: 0.98,                // Applied every frame (0.98 = retains 98% velocity)
  BASE_ACCELERATION: 0.005,      // Base acceleration amount
  MIN_VELOCITY: 0                // Car CAN stop completely (zero velocity)
};

export const TIMING = {
  PROBLEM_TIMER: 6 * 60,         // 6 seconds at 60fps = 360 frames
  CORRECT_ANSWER_DELAY: 30,      // 0.5 seconds (30 frames) after correct answer
  TIMEOUT_DELAY: 10,             // 0.16 seconds (10 frames) after timeout
  FEEDBACK_DURATION: 60          // 1 second (60 frames) for visual feedback
};

export const BOOST = {
  // Linear mapping: remainingTime / totalTime → boost multiplier
  // 6 seconds remaining = 1.0x boost (maximum)
  // 0 seconds remaining = 0.0x boost (no boost on timeout)
  SCALE: 1.0
};

export const GAME = {
  LAPS_TO_COMPLETE: 3,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 800
};

export const TRACK = {
  WIDTH: 60,                     // Track width in pixels
  CENTER_LINE_WIDTH: 3,          // Dashed center line width
  START_FINISH_WIDTH: 10,        // Start/finish line width
  START_FINISH_HEIGHT: 60        // Start/finish line height
};

export const CAR = {
  WIDTH: 12,                     // Car width (for geometric rendering)
  HEIGHT: 20                     // Car height (for geometric rendering)
};
