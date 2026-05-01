import { GAME } from '../config/constants.js';

/**
 * StatisticsTracker — single source of truth for race stats.
 * Time is the only metric that matters; no point-based scoring.
 */
export interface LapResult {
  lapNumber: number;
  lapTime: number;
  isFinalLap: boolean;
}

export interface RaceResults {
  totalTime: number;
  totalTimeFormatted: string;
  bestLapTime: number;
  bestLapTimeFormatted: string;
  lapTimes: number[];
  lapTimesFormatted: string[];
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  currentLap: number;
}

export default class StatisticsTracker {
  // Lap tracking
  currentLap: number;
  lapStartTime: number;
  lapTimes: number[];
  bestLapTime: number;

  // Answer tracking
  correctAnswers: number;
  totalAnswers: number;
  totalProblemsPresented: number;

  // Time tracking
  raceStartTime: number;
  totalTime: number;
  isRaceComplete: boolean;

  constructor() {
    this.currentLap = 1;
    this.lapStartTime = 0;
    this.lapTimes = [];
    this.bestLapTime = Infinity;

    this.correctAnswers = 0;
    this.totalAnswers = 0;
    this.totalProblemsPresented = 0;

    this.raceStartTime = 0;
    this.totalTime = 0;
    this.isRaceComplete = false;
  }

  startRace(timestamp: number): void {
    this.raceStartTime = timestamp;
    this.lapStartTime = timestamp;
  }

  recordCorrectAnswer(): void {
    this.correctAnswers++;
    this.totalAnswers++;
  }

  recordIncorrectAnswer(): void {
    this.totalAnswers++;
  }

  /**
   * Each call counts a problem in the accuracy denominator, regardless of
   * whether the player got it right, wrong, or timed out.
   */
  recordProblemPresented(): void {
    this.totalProblemsPresented++;
  }

  completeLap(timestamp: number): LapResult {
    const lapTime = timestamp - this.lapStartTime;
    this.lapTimes.push(lapTime);

    if (lapTime < this.bestLapTime) {
      this.bestLapTime = lapTime;
    }

    const completedLap = this.currentLap;
    const isFinalLap = this.currentLap >= GAME.LAPS_TO_COMPLETE;

    if (!isFinalLap) {
      this.currentLap++;
      this.lapStartTime = timestamp;
    } else {
      this.isRaceComplete = true;
      this.totalTime = timestamp - this.raceStartTime;
    }

    return { lapNumber: completedLap, lapTime, isFinalLap };
  }

  getCurrentLapTime(timestamp: number): number {
    return timestamp - this.lapStartTime;
  }

  getLastLapTime(): number | null {
    return this.lapTimes.length > 0
      ? this.lapTimes[this.lapTimes.length - 1]
      : null;
  }

  /** Accuracy as 0-100 integer. */
  getAccuracy(): number {
    if (this.totalProblemsPresented === 0) return 0;
    return Math.round((this.correctAnswers / this.totalProblemsPresented) * 100);
  }

  /** Format ms as "M:SS.mmm" or "S.mmms" for sub-minute durations. */
  formatTime(ms: number): string {
    if (ms === Infinity) return '--:--';

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);

    if (minutes === 0) {
      return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  getResults(): RaceResults {
    return {
      totalTime: this.totalTime,
      totalTimeFormatted: this.formatTime(this.totalTime),
      bestLapTime: this.bestLapTime,
      bestLapTimeFormatted: this.formatTime(this.bestLapTime),
      lapTimes: this.lapTimes,
      lapTimesFormatted: this.lapTimes.map(t => this.formatTime(t)),
      correctAnswers: this.correctAnswers,
      totalAnswers: this.totalProblemsPresented,
      accuracy: this.getAccuracy(),
      currentLap: this.currentLap,
    };
  }
}
