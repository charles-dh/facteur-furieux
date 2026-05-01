import { describe, it, expect, beforeEach } from 'vitest';
import RaceState from '../../src/systems/RaceState';

describe('RaceState', () => {
  let s: RaceState;
  beforeEach(() => { s = new RaceState(); });

  it('starts idle with empty answer and zero elapsed time', () => {
    expect(s.phase).toBe('idle');
    expect(s.currentAnswer).toBe('');
    expect(s.elapsedTime).toBe(0);
    expect(s.isRaceActive()).toBe(false);
    expect(s.isAcceptingAnswers()).toBe(false);
  });

  describe('happy path', () => {
    it('walks idle → countdown → race → answering → correct → next problem', () => {
      s.startCountdown();
      expect(s.phase).toBe('countdown');

      s.startRace();
      expect(s.phase).toBe('awaitingProblem');
      expect(s.isRaceActive()).toBe(true);
      expect(s.isAcceptingAnswers()).toBe(false);

      s.beginAnswering();
      expect(s.phase).toBe('answering');
      expect(s.isAcceptingAnswers()).toBe(true);

      expect(s.acceptCorrect()).toBe(true);
      expect(s.phase).toBe('correct');

      s.showProblem();
      expect(s.phase).toBe('awaitingProblem');
      expect(s.currentAnswer).toBe('');
    });

    it('handles timeout → next problem', () => {
      s.startCountdown(); s.startRace(); s.beginAnswering();
      expect(s.markTimeout()).toBe(true);
      expect(s.phase).toBe('timeout');

      s.showProblem();
      expect(s.phase).toBe('awaitingProblem');
    });

    it('marks finished from any active phase', () => {
      s.startCountdown(); s.startRace();
      s.finish();
      expect(s.phase).toBe('finished');
      expect(s.isRaceActive()).toBe(false);
    });
  });

  describe('invalid transitions', () => {
    it('throws if startRace called before countdown', () => {
      expect(() => s.startRace()).toThrow();
    });
    it('throws if startCountdown called twice', () => {
      s.startCountdown();
      expect(() => s.startCountdown()).toThrow();
    });
  });

  describe('idempotency on duplicate accept/timeout', () => {
    it('acceptCorrect returns false when not answering', () => {
      s.startCountdown(); s.startRace();
      // not yet in 'answering'
      expect(s.acceptCorrect()).toBe(false);
      // first valid accept succeeds, second returns false
      s.beginAnswering();
      expect(s.acceptCorrect()).toBe(true);
      expect(s.acceptCorrect()).toBe(false);
    });

    it('markTimeout returns false on the second call (timer-overshoot guard)', () => {
      s.startCountdown(); s.startRace(); s.beginAnswering();
      expect(s.markTimeout()).toBe(true);
      expect(s.markTimeout()).toBe(false);
    });
  });

  describe('answer buffer', () => {
    it('appendDigit only accepts single digits', () => {
      s.appendDigit('5'); expect(s.currentAnswer).toBe('5');
      s.appendDigit('6'); expect(s.currentAnswer).toBe('56');
      s.appendDigit('a'); expect(s.currentAnswer).toBe('56'); // ignored
      s.appendDigit('12'); expect(s.currentAnswer).toBe('56'); // ignored
    });
    it('popDigit removes last char and is safe on empty', () => {
      s.appendDigit('4'); s.appendDigit('2');
      s.popDigit(); expect(s.currentAnswer).toBe('4');
      s.popDigit(); s.popDigit(); // overshoot
      expect(s.currentAnswer).toBe('');
    });
    it('setAnswer / clearAnswer', () => {
      s.setAnswer('56');
      expect(s.currentAnswer).toBe('56');
      s.clearAnswer();
      expect(s.currentAnswer).toBe('');
    });
  });

  describe('advanceTime', () => {
    it('only advances during an active race', () => {
      s.advanceTime(100);
      expect(s.elapsedTime).toBe(0); // idle: ignored

      s.startCountdown();
      s.advanceTime(100);
      expect(s.elapsedTime).toBe(0); // countdown: ignored

      s.startRace();
      s.advanceTime(250);
      expect(s.elapsedTime).toBe(250);

      s.finish();
      s.advanceTime(100);
      expect(s.elapsedTime).toBe(250); // finished: frozen
    });
  });
});
