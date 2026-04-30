import { describe, it, expect, beforeEach } from 'vitest';
import StatisticsTracker from '../../src/systems/StatisticsTracker';
import { GAME } from '../../src/config/constants.js';

describe('StatisticsTracker', () => {
  let st: StatisticsTracker;
  beforeEach(() => { st = new StatisticsTracker(); });

  it('starts on lap 1, with no answers and infinite best lap', () => {
    expect(st.currentLap).toBe(1);
    expect(st.lapTimes).toEqual([]);
    expect(st.bestLapTime).toBe(Infinity);
    expect(st.getAccuracy()).toBe(0);
  });

  it('completeLap records time, advances lap, updates best', () => {
    st.startRace(0);
    const r = st.completeLap(10000);
    expect(r.lapNumber).toBe(1);
    expect(r.lapTime).toBe(10000);
    expect(r.isFinalLap).toBe(false);
    expect(st.currentLap).toBe(2);
    expect(st.bestLapTime).toBe(10000);

    st.completeLap(15000); // 5s lap → new best
    expect(st.bestLapTime).toBe(5000);
  });

  it('marks race complete on the final lap', () => {
    st.startRace(0);
    let t = 0;
    for (let i = 1; i < GAME.LAPS_TO_COMPLETE; i++) {
      t += 5000;
      const r = st.completeLap(t);
      expect(r.isFinalLap).toBe(false);
    }
    t += 5000;
    const final = st.completeLap(t);
    expect(final.isFinalLap).toBe(true);
    expect(st.isRaceComplete).toBe(true);
    expect(st.totalTime).toBe(t);
  });

  it('accuracy uses problemsPresented as denominator', () => {
    st.recordProblemPresented();
    st.recordCorrectAnswer();
    st.recordProblemPresented();
    st.recordIncorrectAnswer();
    st.recordProblemPresented(); // timeout — no answer recorded
    expect(st.getAccuracy()).toBe(33); // 1/3 rounded
  });

  it('formatTime handles sub-minute and minute+ durations', () => {
    expect(st.formatTime(500)).toBe('0.500s');
    expect(st.formatTime(65500)).toBe('1:05.500');
    expect(st.formatTime(Infinity)).toBe('--:--');
  });
});
