import { describe, it, expect, beforeEach } from 'vitest';
import LeaderboardManager from '../../src/systems/LeaderboardManager';

function installLocalStorage() {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
  };
}

const baseScore = (overrides: Partial<{ playerName: string; totalTime: number; accuracy: number }>) => ({
  playerName: overrides.playerName ?? 'P',
  totalTime: overrides.totalTime ?? 30000,
  accuracy: overrides.accuracy ?? 100,
  lapTimes: [10000, 10000, 10000],
  correctAnswers: 10,
  totalAnswers: 10,
});

describe('LeaderboardManager', () => {
  let lb: LeaderboardManager;
  beforeEach(() => { installLocalStorage(); lb = new LeaderboardManager(); });

  it('starts empty', () => {
    expect(lb.getScores()).toEqual([]);
    expect(lb.wouldMakeLeaderboard(99999)).toBe(true); // empty board accepts everything
  });

  it('addScore returns rank 1 for the first entry', () => {
    const rank = lb.addScore(baseScore({ totalTime: 30000 }));
    expect(rank).toBe(1);
    expect(lb.getScores()).toHaveLength(1);
  });

  it('sorts ascending by time', () => {
    lb.addScore(baseScore({ playerName: 'A', totalTime: 50000 }));
    lb.addScore(baseScore({ playerName: 'B', totalTime: 20000 }));
    lb.addScore(baseScore({ playerName: 'C', totalTime: 40000 }));
    const scores = lb.getScores();
    expect(scores.map(s => s.name)).toEqual(['B', 'C', 'A']);
  });

  it('caps at maxScores and returns null for scores that miss the board', async () => {
    // Fill the board with fast times. Use real Date (millisecond-precise ISO)
    // so addScore's rank lookup works — but we need distinct timestamps.
    for (let i = 0; i < 10; i++) {
      lb.addScore(baseScore({ playerName: `P${i}`, totalTime: 10000 + i }));
      // Microsleep to force unique ISO timestamps.
      await new Promise(r => setTimeout(r, 2));
    }
    expect(lb.getScores()).toHaveLength(10);

    const rank = lb.addScore(baseScore({ playerName: 'Slow', totalTime: 999999 }));
    expect(rank).toBeNull();
    expect(lb.getScores()).toHaveLength(10);
    expect(lb.getScores().some(s => s.name === 'Slow')).toBe(false);
  });

  it('wouldMakeLeaderboard reflects whether time beats the worst', async () => {
    for (let i = 0; i < 10; i++) {
      lb.addScore(baseScore({ totalTime: 20000 + i }));
      await new Promise(r => setTimeout(r, 2));
    }
    expect(lb.wouldMakeLeaderboard(15000)).toBe(true);
    expect(lb.wouldMakeLeaderboard(99999)).toBe(false);
  });

  it('clearScores empties the board', () => {
    lb.addScore(baseScore({}));
    lb.clearScores();
    expect(lb.getScores()).toEqual([]);
  });

  it('getStats summarizes the board', () => {
    expect(lb.getStats()).toEqual({
      totalRaces: 0, bestTime: null, averageTime: null, averageAccuracy: null,
    });
    lb.addScore(baseScore({ totalTime: 10000, accuracy: 100 }));
    lb.addScore(baseScore({ totalTime: 30000, accuracy: 80 }));
    const s = lb.getStats();
    expect(s.totalRaces).toBe(2);
    expect(s.bestTime).toBe(10000);
    expect(s.averageTime).toBe(20000);
    expect(s.averageAccuracy).toBe(90);
  });
});
