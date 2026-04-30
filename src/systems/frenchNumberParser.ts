/**
 * Pure parser for spoken French numbers in the 2-150 range.
 *
 * The Web Speech API returns either:
 *  - bare digits (Chrome often does this: "24", "6 12 18")
 *  - French words ("vingt-quatre", "six douze dix-huit")
 *  - or noisy mixtures with filler words ("euh douze")
 *
 * This module handles all three. It is a pure function (no DOM, no Phaser,
 * no global state) so it is easy to unit test — which matters because the
 * homophone handling (sis/six, dis/dix, sang/cent) and compound logic
 * (quatre-vingt-dix → 90) silently regresses if we touch it without tests.
 *
 * Design choices:
 *  - Out-of-range numbers are dropped, not clamped, since multiplication
 *    answers in this game live in 4..100.
 *  - Compound numbers are summed, not multiplied — French numbers above 20
 *    are additive (vingt-trois = 20 + 3, soixante-quinze = 60 + 15) except
 *    for the 70/80/90 special cases handled via direct lookup.
 *  - "et" (the connector in "vingt et un") is skipped.
 */

const MIN_VALUE = 2;
const MAX_VALUE = 150;

const FRENCH_NUMBERS: Record<string, number> = {
  'zéro': 0, 'zero': 0,
  'un': 1, 'une': 1,
  'deux': 2,
  'trois': 3,
  'quatre': 4,
  'cinq': 5,
  'six': 6, 'sis': 6,           // homophone
  'sept': 7, 'set': 7,           // homophone
  'huit': 8,
  'neuf': 9,
  'dix': 10, 'dis': 10,          // homophone
  'onze': 11,
  'douze': 12,
  'treize': 13,
  'quatorze': 14,
  'quinze': 15,
  'seize': 16,
  'dix-sept': 17,
  'dix-huit': 18,
  'dix-neuf': 19,
  'vingt': 20,
  'trente': 30,
  'quarante': 40,
  'cinquante': 50,
  'soixante': 60,
  'soixante-dix': 70,
  'quatre-vingt': 80, 'quatre-vingts': 80,
  'quatre-vingt-dix': 90,
  'cent': 100, 'sang': 100,      // homophone
};

const FILLER_WORDS = /^(euh|heu|alors|donc)\s+/gi;

/**
 * Parse spoken French (or numeric) text into one or more numbers in [2, 150].
 * Returns an empty array if nothing valid is recognized.
 */
export function parseSpokenNumbers(rawText: string): number[] {
  const text = rawText.replace(FILLER_WORDS, '').trim().toLowerCase();
  if (!text) return [];

  // Fast path: space-separated digits (e.g. "12 18", "6 12 18").
  // Chrome's recognizer often returns numerals directly.
  const tokens = text.split(/\s+/);
  const digitResults: number[] = [];
  for (const token of tokens) {
    const v = parseInt(token, 10);
    if (!Number.isNaN(v) && isInRange(v)) digitResults.push(v);
  }
  if (digitResults.length > 0) return digitResults;

  // Slow path: try French text as a single compound number.
  const word = parseFrenchText(text);
  return word !== null ? [word] : [];
}

/**
 * Parse a single French number expression. Returns null if it doesn't
 * resolve to a valid in-range number.
 *
 * Exported for direct testing of the compound logic.
 */
export function parseFrenchText(text: string): number | null {
  // Direct lookup: "vingt", "soixante-dix", etc.
  if (Object.prototype.hasOwnProperty.call(FRENCH_NUMBERS, text)) {
    return inRangeOrNull(FRENCH_NUMBERS[text]);
  }

  // Compound: split on whitespace and hyphens, sum known parts.
  // Skip the "et" connector ("vingt et un" → 20 + 1).
  let result = 0;
  let foundAny = false;
  const parts = text.split(/[\s\-]+/);
  for (const part of parts) {
    if (part === 'et' || part === '') continue;
    if (Object.prototype.hasOwnProperty.call(FRENCH_NUMBERS, part)) {
      result += FRENCH_NUMBERS[part];
      foundAny = true;
    }
  }

  return foundAny ? inRangeOrNull(result) : null;
}

function isInRange(n: number): boolean {
  return n >= MIN_VALUE && n <= MAX_VALUE;
}

function inRangeOrNull(n: number): number | null {
  return isInRange(n) ? n : null;
}
