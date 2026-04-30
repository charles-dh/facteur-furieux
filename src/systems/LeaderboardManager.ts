/**
 * LeaderboardManager — local high-score persistence via localStorage.
 *
 * Top 10 by total race time (lower is better). Scores are scoped to the
 * current browser/device — fine for personal practice, not for competitive
 * play.
 *
 * Stored shape: array of ScoreEntry, JSON-encoded.
 */

export interface ScoreInput {
  playerName: string;
  totalTime: number;
  accuracy: number;
  lapTimes: number[];
  correctAnswers: number;
  totalAnswers: number;
}

export interface ScoreEntry {
  name: string;
  time: number;
  accuracy: number;
  lapTimes: number[];
  correctAnswers: number;
  totalAnswers: number;
  date: string; // ISO 8601
}

export interface LeaderboardStats {
  totalRaces: number;
  bestTime: number | null;
  averageTime: number | null;
  averageAccuracy: number | null;
}

export default class LeaderboardManager {
  storageKey: string;
  maxScores: number;

  constructor() {
    this.storageKey = 'facteur_furieux_leaderboard';
    this.maxScores = 10;
  }

  /**
   * Add a score and return its 1-indexed rank if it made the top N,
   * or null if it was bumped off the bottom.
   */
  addScore(scoreData: ScoreInput): number | null {
    const scores = this.getScores();

    const newScore: ScoreEntry = {
      name: scoreData.playerName,
      time: scoreData.totalTime,
      accuracy: scoreData.accuracy,
      lapTimes: scoreData.lapTimes,
      correctAnswers: scoreData.correctAnswers,
      totalAnswers: scoreData.totalAnswers,
      date: new Date().toISOString(),
    };

    scores.push(newScore);
    scores.sort((a, b) => a.time - b.time);
    const topScores = scores.slice(0, this.maxScores);
    this.saveScores(topScores);

    // Match on date+name+time — date is ISO with ms precision so collisions
    // in a single session are effectively impossible.
    const rank = topScores.findIndex(score =>
      score.date === newScore.date &&
      score.name === newScore.name &&
      score.time === newScore.time
    );
    return rank >= 0 ? rank + 1 : null;
  }

  getScores(): ScoreEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const scores = JSON.parse(stored);
      if (!Array.isArray(scores)) {
        console.warn('Invalid leaderboard data - resetting');
        return [];
      }
      return scores as ScoreEntry[];
    } catch (error) {
      console.error('Error reading leaderboard:', error);
      return [];
    }
  }

  saveScores(scores: ScoreEntry[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(scores));
    } catch (error: any) {
      console.error('Error saving leaderboard:', error);
      if (error?.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded - clearing old data');
        this.clearScores();
      }
    }
  }

  clearScores(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing leaderboard:', error);
    }
  }

  /** True if `time` would land in the top N. */
  wouldMakeLeaderboard(time: number): boolean {
    const scores = this.getScores();
    if (scores.length < this.maxScores) return true;
    return time < scores[scores.length - 1].time;
  }

  /** "M:SS.mmm" — always with minutes, unlike StatisticsTracker.formatTime. */
  formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor(ms % 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getStats(): LeaderboardStats {
    const scores = this.getScores();

    if (scores.length === 0) {
      return {
        totalRaces: 0,
        bestTime: null,
        averageTime: null,
        averageAccuracy: null,
      };
    }

    const bestTime = scores[0].time;
    const totalTime = scores.reduce((sum, s) => sum + s.time, 0);
    const totalAccuracy = scores.reduce((sum, s) => sum + s.accuracy, 0);

    return {
      totalRaces: scores.length,
      bestTime,
      averageTime: totalTime / scores.length,
      averageAccuracy: Math.round(totalAccuracy / scores.length),
    };
  }
}
