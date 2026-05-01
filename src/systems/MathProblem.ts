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
export interface Problem {
  a: number;
  b: number;
  answer: number;
  key: string;
}

export default class MathProblem {
  selectedTables: number[];
  currentProblem: Problem | null;
  timer: number;
  timerMax: number;
  timerActive: boolean;
  usedProblems: Set<string>;

  constructor(selectedTables: number[]) {
    this.selectedTables = selectedTables;
    this.currentProblem = null;
    this.timer = 0;
    this.timerMax = TIMING.PROBLEM_TIMER;
    this.timerActive = false;
    this.usedProblems = new Set<string>();
  }

  /**
   * Generate a new multiplication problem.
   *
   * Rules:
   * - At least one factor must come from the selected tables
   * - Second factor ranges from 2-10
   * - No duplicate problems in the same session (until pool is exhausted)
   * - Random factor order
   */
  generate(): Problem {
    let problem: Problem;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      const tableIndex = Math.floor(Math.random() * this.selectedTables.length);
      const firstFactor = this.selectedTables[tableIndex];
      const secondFactor = Math.floor(Math.random() * 9) + 2; // 2-10

      const [a, b] = Math.random() < 0.5
        ? [firstFactor, secondFactor]
        : [secondFactor, firstFactor];

      problem = { a, b, answer: a * b, key: `${a}×${b}` };
      attempts++;

      // Safety: if we've exhausted the pool, reset and accept the next pick.
      if (attempts >= maxAttempts) {
        this.usedProblems.clear();
        break;
      }
    } while (this.usedProblems.has(problem.key));

    this.usedProblems.add(problem.key);
    this.currentProblem = problem;
    return problem;
  }

  startTimer(): void {
    this.timer = this.timerMax;
    this.timerActive = true;
  }

  /** @param delta time since last frame in milliseconds */
  updateTimer(delta: number): void {
    if (!this.timerActive) return;

    this.timer -= delta;

    if (this.timer <= 0) {
      this.timer = 0;
      this.timerActive = false;
      // Timeout is handled by the consumer (GameScene).
    }
  }

  /** Remaining time as a 0-1 ratio. */
  getRemainingPercent(): number {
    return this.timer / this.timerMax;
  }

  /**
   * Boost multiplier based on remaining timer.
   * Linear: 100% remaining = 1.0x, 0% remaining = 0.0x.
   */
  calculateBoost(): number {
    return this.getRemainingPercent() * BOOST.SCALE;
  }

  checkAnswer(input: string | number): boolean {
    if (!this.currentProblem) return false;
    const playerAnswer = typeof input === 'number' ? input : parseInt(input, 10);
    return playerAnswer === this.currentProblem.answer;
  }
}
