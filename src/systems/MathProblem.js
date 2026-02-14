import { TIMING, BOOST } from '../config/constants.js';

/**
 * MathProblem System
 *
 * Generates and validates multiplication problems:
 * - Problems based on selected multiplication tables
 * - Timer countdown (6 seconds)
 * - Answer validation
 * - Boost calculation based on remaining timer
 *
 * Key mechanic: Boost strength = f(remaining timer)
 * - Fast answer (6s remaining) = full boost (1.0x)
 * - Slow answer (1s remaining) = weak boost (~0.17x)
 * - Timeout (0s) = no boost (0.0x)
 */
export default class MathProblem {
  /**
   * @param {number[]} selectedTables - Array of multiplication tables to use (e.g., [2, 3, 5])
   */
  constructor(selectedTables) {
    this.selectedTables = selectedTables;

    // Current problem {a, b, answer}
    this.currentProblem = null;

    // Timer in milliseconds (6 seconds = 6000ms)
    this.timer = 0;
    this.timerMax = TIMING.PROBLEM_TIMER;
    this.timerActive = false;

    // Track used problems to avoid duplicates
    this.usedProblems = new Set();

  }

  /**
   * Generate a new multiplication problem
   *
   * Rules:
   * - At least one factor must be from selected tables
   * - Second factor ranges from 2-10
   * - No duplicate problems in same session
   * - Random order
   */
  generate() {
    let problem;
    let attempts = 0;
    const maxAttempts = 100;

    // Keep generating until we find an unused problem
    do {
      // Pick random table from selected tables
      const tableIndex = Math.floor(Math.random() * this.selectedTables.length);
      const firstFactor = this.selectedTables[tableIndex];

      // Pick random second factor (2-10)
      const secondFactor = Math.floor(Math.random() * 9) + 2; // 2-10

      // Randomly swap factors for variety
      const [a, b] = Math.random() < 0.5
        ? [firstFactor, secondFactor]
        : [secondFactor, firstFactor];

      const answer = a * b;
      const key = `${a}×${b}`;

      problem = { a, b, answer, key };
      attempts++;

      // Safety check: if we've used all combinations, reset the set
      if (attempts >= maxAttempts) {
        this.usedProblems.clear();
        break;
      }
    } while (this.usedProblems.has(problem.key));

    // Mark this problem as used
    this.usedProblems.add(problem.key);

    this.currentProblem = problem;

    return problem;
  }

  /**
   * Start the timer for the current problem
   */
  startTimer() {
    this.timer = this.timerMax;
    this.timerActive = true;
  }

  /**
   * Update the timer (called each frame)
   *
   * @param {number} delta - Time since last frame in milliseconds
   */
  updateTimer(delta) {
    if (!this.timerActive) return;

    // Subtract delta milliseconds directly from timer
    this.timer -= delta;

    if (this.timer <= 0) {
      this.timer = 0;
      this.timerActive = false;
      // Timeout will be handled by GameScene
    }
  }

  /**
   * Get remaining timer as percentage (0-1)
   *
   * @returns {number} Remaining time percentage (1.0 = full time, 0.0 = expired)
   */
  getRemainingPercent() {
    return this.timer / this.timerMax;
  }

  /**
   * Calculate boost multiplier based on remaining timer
   *
   * Linear mapping:
   * - 100% timer remaining = 1.0x boost (maximum)
   * - 50% timer remaining = 0.5x boost
   * - 0% timer remaining = 0.0x boost (no boost on timeout)
   *
   * @returns {number} Boost multiplier (0-1 scale)
   */
  calculateBoost() {
    const remainingPercent = this.getRemainingPercent();
    return remainingPercent * BOOST.SCALE;
  }

  /**
   * Check if the player's answer is correct
   *
   * @param {string|number} input - Player's answer
   * @returns {boolean} True if correct, false otherwise
   */
  checkAnswer(input) {
    if (!this.currentProblem) return false;

    const playerAnswer = parseInt(input, 10);
    return playerAnswer === this.currentProblem.answer;
  }
}
