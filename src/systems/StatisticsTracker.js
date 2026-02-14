import { GAME } from '../config/constants.js';

/**
 * StatisticsTracker System
 *
 * Centralized tracking of all game statistics:
 * - Lap progress and completion
 * - Answer accuracy (correct vs incorrect)
 * - Time tracking (lap times, total race time)
 * - Performance metrics for results screen
 *
 * No point-based scoring - time is the only metric that matters.
 */
export default class StatisticsTracker {
  constructor() {
    // Lap tracking
    this.currentLap = 1;           // Current lap number (1, 2, 3)
    this.lapStartTime = 0;         // Timestamp when current lap started
    this.lapTimes = [];            // Array of completed lap times in milliseconds
    this.bestLapTime = Infinity;   // Personal record lap time

    // Answer tracking
    this.correctAnswers = 0;       // Number of correct answers
    this.totalAnswers = 0;         // Total attempts (correct + incorrect)

    // Time tracking
    this.raceStartTime = 0;        // When race began (timestamp)
    this.totalTime = 0;            // Total race duration in milliseconds
    this.isRaceComplete = false;   // Whether all laps finished

    console.log('StatisticsTracker initialized');
  }

  /**
   * Start the race timer
   * Called when GameScene begins
   */
  startRace(timestamp) {
    this.raceStartTime = timestamp;
    this.lapStartTime = timestamp;
    console.log('Race started at', timestamp);
  }

  /**
   * Record a correct answer
   */
  recordCorrectAnswer() {
    this.correctAnswers++;
    this.totalAnswers++;
  }

  /**
   * Record an incorrect answer
   */
  recordIncorrectAnswer() {
    this.totalAnswers++;
  }

  /**
   * Complete the current lap
   * Records lap time and prepares for next lap
   *
   * @param {number} timestamp - Current time
   * @returns {Object} Lap completion data {lapNumber, lapTime, isFinalLap}
   */
  completeLap(timestamp) {
    const lapTime = timestamp - this.lapStartTime;
    this.lapTimes.push(lapTime);

    // Update best lap time
    if (lapTime < this.bestLapTime) {
      this.bestLapTime = lapTime;
    }

    const completedLap = this.currentLap;
    const isFinalLap = this.currentLap >= GAME.LAPS_TO_COMPLETE;

    console.log(`Lap ${completedLap} completed: ${this.formatTime(lapTime)}`);

    if (!isFinalLap) {
      // Prepare for next lap
      this.currentLap++;
      this.lapStartTime = timestamp;
    } else {
      // Race complete
      this.isRaceComplete = true;
      this.totalTime = timestamp - this.raceStartTime;
      console.log(`Race complete! Total time: ${this.formatTime(this.totalTime)}`);
    }

    return {
      lapNumber: completedLap,
      lapTime: lapTime,
      isFinalLap: isFinalLap
    };
  }

  /**
   * Get current lap time (time since lap started)
   *
   * @param {number} timestamp - Current time
   * @returns {number} Current lap duration in milliseconds
   */
  getCurrentLapTime(timestamp) {
    return timestamp - this.lapStartTime;
  }

  /**
   * Get last completed lap time
   *
   * @returns {number|null} Last lap time in ms, or null if no laps completed
   */
  getLastLapTime() {
    return this.lapTimes.length > 0
      ? this.lapTimes[this.lapTimes.length - 1]
      : null;
  }

  /**
   * Calculate accuracy percentage
   *
   * @returns {number} Accuracy as percentage (0-100)
   */
  getAccuracy() {
    if (this.totalAnswers === 0) return 0;
    return Math.round((this.correctAnswers / this.totalAnswers) * 100);
  }

  /**
   * Format time in milliseconds to readable string
   *
   * @param {number} ms - Time in milliseconds
   * @returns {string} Formatted time (MM:SS.mmm or SS.mmm)
   */
  formatTime(ms) {
    if (ms === Infinity) return '--:--';

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);

    // If under 1 minute, show seconds.milliseconds
    if (minutes === 0) {
      return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
    }

    // Otherwise show minutes:seconds.milliseconds
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  /**
   * Get all statistics for results screen
   *
   * @returns {Object} Complete statistics object
   */
  getResults() {
    return {
      totalTime: this.totalTime,
      totalTimeFormatted: this.formatTime(this.totalTime),
      bestLapTime: this.bestLapTime,
      bestLapTimeFormatted: this.formatTime(this.bestLapTime),
      lapTimes: this.lapTimes,
      lapTimesFormatted: this.lapTimes.map(t => this.formatTime(t)),
      correctAnswers: this.correctAnswers,
      totalAnswers: this.totalAnswers,
      accuracy: this.getAccuracy(),
      currentLap: this.currentLap
    };
  }
}
