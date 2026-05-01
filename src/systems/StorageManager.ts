/**
 * StorageManager — centralized localStorage helpers for player preferences.
 *
 * Keys and defaults live in one place so scenes don't drift apart on what's
 * stored or what fallback to use when storage is unavailable.
 */

export type InputMode = 'voice' | 'keyboard';

const STORAGE_KEYS = {
  PLAYER_NAME: 'facteur_furieux_player_name',
  INPUT_MODE: 'facteur_furieux_input_mode',
} as const;

const DEFAULTS = {
  PLAYER_NAME: 'Pilote',
  INPUT_MODE: 'voice' as InputMode,
};

export function loadPlayerName(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    return saved && saved.trim().length > 0 ? saved : DEFAULTS.PLAYER_NAME;
  } catch {
    return DEFAULTS.PLAYER_NAME;
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
  } catch {
    // localStorage unavailable or full — silently ignore.
  }
}

export function loadInputMode(): InputMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.INPUT_MODE);
    return saved === 'keyboard' ? 'keyboard' : DEFAULTS.INPUT_MODE;
  } catch {
    return DEFAULTS.INPUT_MODE;
  }
}

export function saveInputMode(mode: InputMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INPUT_MODE, mode);
  } catch {
    // silently ignore
  }
}
