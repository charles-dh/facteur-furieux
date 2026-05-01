import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadPlayerName, savePlayerName,
  loadInputMode, saveInputMode,
} from '../../src/systems/StorageManager';

// Minimal in-memory localStorage shim for Node.
function installLocalStorage() {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
  };
}

describe('StorageManager', () => {
  beforeEach(() => { installLocalStorage(); });

  it('returns default name when nothing saved', () => {
    expect(loadPlayerName()).toBe('Pilote');
  });

  it('round-trips a player name', () => {
    savePlayerName('Charles');
    expect(loadPlayerName()).toBe('Charles');
  });

  it('returns default input mode when nothing saved', () => {
    expect(loadInputMode()).toBe('voice');
  });

  it('round-trips input mode', () => {
    saveInputMode('keyboard');
    expect(loadInputMode()).toBe('keyboard');
    saveInputMode('voice');
    expect(loadInputMode()).toBe('voice');
  });

  it('falls back to default on storage failure', () => {
    (globalThis as any).localStorage = {
      getItem: vi.fn(() => { throw new Error('blocked'); }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    expect(loadPlayerName()).toBe('Pilote');
    expect(loadInputMode()).toBe('voice');
  });
});
