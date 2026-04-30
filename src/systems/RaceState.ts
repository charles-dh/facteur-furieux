/**
 * RaceState — single source of truth for the race's logical state.
 *
 * Replaces a scatter of booleans (`raceStarted`, `answerSubmitted`,
 * `processingAnswer`, `timeoutHandled`) with one explicit phase. Each
 * transition has a single legal predecessor, which catches "we already
 * handled the timeout" / "answer submitted twice" race conditions that
 * the boolean soup could only express implicitly.
 *
 * Phases:
 *   idle             — scene loaded, countdown not started
 *   countdown        — 3-2-1-GO sequence playing
 *   awaitingProblem  — countdown done OR last answer resolved; problem
 *                      shown but its timer hasn't started yet (read delay)
 *   answering        — problem timer running, accepting answers
 *   correct          — correct answer accepted, transitioning to next problem
 *   timeout          — timer expired, showing the answer, transitioning
 *   finished         — final lap completed, results scene queued
 *
 * Note: incorrect answers do NOT transition out of `answering` — the
 * player retries in place. We just clear the input buffer.
 */

export type RacePhase =
  | 'idle'
  | 'countdown'
  | 'awaitingProblem'
  | 'answering'
  | 'correct'
  | 'timeout'
  | 'finished';

export default class RaceState {
  phase: RacePhase;
  /** Digits the player has entered (or recognized) so far. */
  currentAnswer: string;
  /** ms since the race started (countdown excluded). */
  elapsedTime: number;
  /** Position on the previous frame, for lap-wrap detection. */
  previousPosition: number;

  constructor() {
    this.phase = 'idle';
    this.currentAnswer = '';
    this.elapsedTime = 0;
    this.previousPosition = 0;
  }

  // ─── Phase transitions ──────────────────────────────────────────────

  startCountdown(): void {
    this.assertPhase('idle');
    this.phase = 'countdown';
  }

  /** Countdown complete — race clock starts here. */
  startRace(): void {
    this.assertPhase('countdown');
    this.phase = 'awaitingProblem';
    this.elapsedTime = 0;
  }

  /** A new problem is shown; we're inside the read-delay before the timer. */
  showProblem(): void {
    // Allowed from 'correct' or 'timeout' (next problem) or right after
    // startRace() (first problem). We don't enforce strictly — the slot
    // animation can fire showProblem() while the previous answer is still
    // resolving visually.
    this.phase = 'awaitingProblem';
    this.currentAnswer = '';
  }

  /** Read-delay elapsed; problem timer just started. */
  beginAnswering(): void {
    this.phase = 'answering';
  }

  /**
   * Accept a correct answer.
   * Returns false if we're not in a state that accepts answers — caller
   * should ignore late speech callbacks etc.
   */
  acceptCorrect(): boolean {
    if (this.phase !== 'answering') return false;
    this.phase = 'correct';
    return true;
  }

  /**
   * Mark a timeout. Returns false if already handled (timer can fire its
   * "<= 0" check on multiple frames before the consumer notices).
   */
  markTimeout(): boolean {
    if (this.phase !== 'answering') return false;
    this.phase = 'timeout';
    return true;
  }

  finish(): void {
    this.phase = 'finished';
  }

  // ─── Queries ────────────────────────────────────────────────────────

  /** Are we mid-race (race clock ticking, problems in flight)? */
  isRaceActive(): boolean {
    switch (this.phase) {
      case 'awaitingProblem':
      case 'answering':
      case 'correct':
      case 'timeout':
        return true;
      default:
        return false;
    }
  }

  /** Should this frame's speech/keyboard input be accepted? */
  isAcceptingAnswers(): boolean {
    return this.phase === 'answering';
  }

  // ─── Per-frame mutations ────────────────────────────────────────────

  advanceTime(deltaMs: number): void {
    if (this.isRaceActive()) {
      this.elapsedTime += deltaMs;
    }
  }

  // ─── Answer buffer ──────────────────────────────────────────────────

  appendDigit(digit: string): void {
    if (digit.length === 1 && digit >= '0' && digit <= '9') {
      this.currentAnswer += digit;
    }
  }

  popDigit(): void {
    this.currentAnswer = this.currentAnswer.slice(0, -1);
  }

  setAnswer(value: string): void {
    this.currentAnswer = value;
  }

  clearAnswer(): void {
    this.currentAnswer = '';
  }

  // ─── Internals ──────────────────────────────────────────────────────

  private assertPhase(expected: RacePhase): void {
    if (this.phase !== expected) {
      throw new Error(
        `RaceState: invalid transition from ${this.phase} (expected ${expected})`
      );
    }
  }
}
