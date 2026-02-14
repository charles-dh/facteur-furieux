/**
 * StorageManager - Centralized localStorage helpers
 *
 * All player preference persistence in one place:
 * - Player name
 * - Input mode (voice / keyboard)
 *
 * Keeps storage keys and default values consistent across scenes.
 */

const STORAGE_KEYS = {
  PLAYER_NAME: 'facteur_furieux_player_name',
  INPUT_MODE: 'facteur_furieux_input_mode',
};

const DEFAULTS = {
  PLAYER_NAME: 'Pilote',
  INPUT_MODE: 'voice',
};

/**
 * Load the saved player name.
 * @returns {string} Player name or default "Pilote"
 */
export function loadPlayerName() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    return saved && saved.trim().length > 0 ? saved : DEFAULTS.PLAYER_NAME;
  } catch {
    return DEFAULTS.PLAYER_NAME;
  }
}

/**
 * Save the player name.
 * @param {string} name
 */
export function savePlayerName(name) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
  } catch {
    // localStorage might be full or unavailable — silently ignore
  }
}

/**
 * Load the saved input mode.
 * @returns {'voice'|'keyboard'}
 */
export function loadInputMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.INPUT_MODE);
    return saved === 'keyboard' ? 'keyboard' : DEFAULTS.INPUT_MODE;
  } catch {
    return DEFAULTS.INPUT_MODE;
  }
}

/**
 * Save the input mode.
 * @param {'voice'|'keyboard'} mode
 */
export function saveInputMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEYS.INPUT_MODE, mode);
  } catch {
    // silently ignore
  }
}
