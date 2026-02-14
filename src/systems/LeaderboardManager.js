/**
 * LeaderboardManager - Manages high scores using browser localStorage
 *
 * This system allows players to track their personal best times locally.
 * Scores are stored per browser/device and persist across sessions.
 *
 * Storage format: localStorage stores an array of score objects
 * Each score object contains: {name, time, accuracy, lapTimes, date}
 *
 * Features:
 * - Store top 10 scores
 * - Sort by total race time (lower is better)
 * - Persist across browser sessions
 * - Clear leaderboard option
 *
 * Limitations (localStorage-based):
 * - Only visible on current browser/device
 * - Can be cleared by user (browser cache clear)
 * - Not suitable for competitive multiplayer (use backend for that)
 *
 * For educational use, this is perfect for:
 * - Personal progress tracking
 * - Motivation to improve times
 * - Seeing improvement over practice sessions
 */
export default class LeaderboardManager {
  constructor() {
    // Key for localStorage
    this.storageKey = 'facteur_furieux_leaderboard';

    // Maximum number of scores to store
    this.maxScores = 10;
  }

  /**
   * Add a new score to the leaderboard
   *
   * @param {Object} scoreData - Score data from game
   * @param {string} scoreData.playerName - Player's name
   * @param {number} scoreData.totalTime - Total race time in milliseconds
   * @param {number} scoreData.accuracy - Accuracy percentage (0-100)
   * @param {Array<number>} scoreData.lapTimes - Individual lap times in milliseconds
   * @param {number} scoreData.correctAnswers - Number of correct answers
   * @param {number} scoreData.totalAnswers - Total number of answers
   * @returns {number|null} - Rank (1-10) if score made leaderboard, null otherwise
   */
  addScore(scoreData) {
    // Get existing scores
    const scores = this.getScores();

    // Create score entry with timestamp
    const newScore = {
      name: scoreData.playerName,
      time: scoreData.totalTime,
      accuracy: scoreData.accuracy,
      lapTimes: scoreData.lapTimes,
      correctAnswers: scoreData.correctAnswers,
      totalAnswers: scoreData.totalAnswers,
      date: new Date().toISOString()
    };

    // Add new score to array
    scores.push(newScore);

    // Sort by time (ascending - faster is better)
    scores.sort((a, b) => a.time - b.time);

    // Keep only top scores
    const topScores = scores.slice(0, this.maxScores);

    // Save to localStorage
    this.saveScores(topScores);

    // Find rank of new score (returns -1 if not in top scores)
    const rank = topScores.findIndex(score =>
      score.date === newScore.date &&
      score.name === newScore.name &&
      score.time === newScore.time
    );

    // Return rank (1-indexed) or null if didn't make leaderboard
    return rank >= 0 ? rank + 1 : null;
  }

  /**
   * Get all scores from leaderboard
   *
   * @returns {Array<Object>} - Array of score objects, sorted by time
   */
  getScores() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return [];
      }

      const scores = JSON.parse(stored);

      // Validate data structure
      if (!Array.isArray(scores)) {
        console.warn('Invalid leaderboard data - resetting');
        return [];
      }

      return scores;
    } catch (error) {
      console.error('Error reading leaderboard:', error);
      return [];
    }
  }

  /**
   * Save scores to localStorage
   *
   * @param {Array<Object>} scores - Array of score objects
   */
  saveScores(scores) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(scores));
    } catch (error) {
      console.error('Error saving leaderboard:', error);
      // Handle quota exceeded or other localStorage errors
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded - clearing old data');
        this.clearScores();
      }
    }
  }

  /**
   * Clear all scores from leaderboard
   */
  clearScores() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing leaderboard:', error);
    }
  }

  /**
   * Check if a score would make the leaderboard
   * Useful for showing "New High Score!" messages
   *
   * @param {number} time - Total race time in milliseconds
   * @returns {boolean} - True if score would make top 10
   */
  wouldMakeLeaderboard(time) {
    const scores = this.getScores();

    // If less than max scores, always makes it
    if (scores.length < this.maxScores) {
      return true;
    }

    // Check if better than worst score
    const worstScore = scores[scores.length - 1];
    return time < worstScore.time;
  }

  /**
   * Format time from milliseconds to MM:SS.mmm display format
   *
   * @param {number} ms - Time in milliseconds
   * @returns {string} - Formatted time string
   */
  formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor(ms % 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  /**
   * Format date for display
   *
   * @param {string} isoDate - ISO date string
   * @returns {string} - Formatted date
   */
  formatDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get statistics about the leaderboard
   *
   * @returns {Object} - Statistics object
   */
  getStats() {
    const scores = this.getScores();

    if (scores.length === 0) {
      return {
        totalRaces: 0,
        bestTime: null,
        averageTime: null,
        averageAccuracy: null
      };
    }

    const bestTime = scores[0].time;
    const totalTime = scores.reduce((sum, score) => sum + score.time, 0);
    const totalAccuracy = scores.reduce((sum, score) => sum + score.accuracy, 0);

    return {
      totalRaces: scores.length,
      bestTime: bestTime,
      averageTime: totalTime / scores.length,
      averageAccuracy: Math.round(totalAccuracy / scores.length)
    };
  }
}
