import { describe, it, expect, beforeEach } from 'vitest';
import MathProblem from '../../src/systems/MathProblem';
import { TIMING } from '../../src/config/constants.js';

describe('MathProblem', () => {
  let mp: MathProblem;
  beforeEach(() => { mp = new MathProblem([2, 3, 5]); });

  describe('generate', () => {
    it('returns a problem whose answer equals a*b', () => {
      for (let i = 0; i < 30; i++) {
        const p = new MathProblem([2, 3, 5, 7]).generate();
        expect(p.answer).toBe(p.a * p.b);
      }
    });

    it('uses at least one factor from selected tables', () => {
      const tables = [4, 9];
      for (let i = 0; i < 30; i++) {
        const p = new MathProblem(tables).generate();
        const usesTable = tables.includes(p.a) || tables.includes(p.b);
        expect(usesTable).toBe(true);
      }
    });

    it('avoids duplicates within a session', () => {
      // [2] × [2..10] = 9 unique combos, but factor swap makes some symmetric.
      // Just confirm no duplicate keys appear in 5 generations.
      const seen = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const p = mp.generate();
        expect(seen.has(p.key)).toBe(false);
        seen.add(p.key);
      }
    });

    it('sets currentProblem', () => {
      const p = mp.generate();
      expect(mp.currentProblem).toBe(p);
    });
  });

  describe('timer', () => {
    it('startTimer initializes timer at max and activates it', () => {
      mp.startTimer();
      expect(mp.timer).toBe(TIMING.PROBLEM_TIMER);
      expect(mp.timerActive).toBe(true);
    });

    it('updateTimer subtracts delta and stops at zero', () => {
      mp.startTimer();
      mp.updateTimer(2000);
      expect(mp.timer).toBe(TIMING.PROBLEM_TIMER - 2000);
      mp.updateTimer(TIMING.PROBLEM_TIMER); // overshoot
      expect(mp.timer).toBe(0);
      expect(mp.timerActive).toBe(false);
    });

    it('updateTimer is a no-op when inactive', () => {
      mp.timer = 1000;
      mp.timerActive = false;
      mp.updateTimer(500);
      expect(mp.timer).toBe(1000);
    });
  });

  describe('calculateBoost', () => {
    it('returns 1.0 at full timer', () => {
      mp.startTimer();
      expect(mp.calculateBoost()).toBeCloseTo(1.0);
    });
    it('returns 0 on timeout', () => {
      mp.startTimer();
      mp.timer = 0;
      expect(mp.calculateBoost()).toBe(0);
    });
    it('scales linearly with remaining time', () => {
      mp.startTimer();
      mp.timer = TIMING.PROBLEM_TIMER / 2;
      expect(mp.calculateBoost()).toBeCloseTo(0.5);
    });
  });

  describe('checkAnswer', () => {
    it('accepts correct numeric and string answers', () => {
      mp.currentProblem = { a: 7, b: 8, answer: 56, key: '7×8' };
      expect(mp.checkAnswer(56)).toBe(true);
      expect(mp.checkAnswer('56')).toBe(true);
    });
    it('rejects wrong answers', () => {
      mp.currentProblem = { a: 7, b: 8, answer: 56, key: '7×8' };
      expect(mp.checkAnswer(57)).toBe(false);
      expect(mp.checkAnswer('abc')).toBe(false);
    });
    it('returns false when no current problem', () => {
      expect(mp.checkAnswer(42)).toBe(false);
    });
  });
});
