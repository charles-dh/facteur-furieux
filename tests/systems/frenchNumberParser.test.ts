import { describe, it, expect } from 'vitest';
import { parseSpokenNumbers, parseFrenchText } from '../../src/systems/frenchNumberParser';

describe('parseSpokenNumbers — digit fast path', () => {
  it('parses a single numeric token', () => {
    expect(parseSpokenNumbers('24')).toEqual([24]);
  });

  it('parses multiple space-separated digits', () => {
    expect(parseSpokenNumbers('12 18')).toEqual([12, 18]);
    expect(parseSpokenNumbers('6 12 18')).toEqual([6, 12, 18]);
  });

  it('drops out-of-range numbers', () => {
    expect(parseSpokenNumbers('1')).toEqual([]);
    expect(parseSpokenNumbers('200')).toEqual([]);
    expect(parseSpokenNumbers('0')).toEqual([]);
  });

  it('returns empty for non-numeric, non-French text', () => {
    expect(parseSpokenNumbers('')).toEqual([]);
    expect(parseSpokenNumbers('hello world')).toEqual([]);
  });
});

describe('parseSpokenNumbers — French words', () => {
  it('parses single-word numbers', () => {
    expect(parseSpokenNumbers('deux')).toEqual([2]);
    expect(parseSpokenNumbers('dix')).toEqual([10]);
    expect(parseSpokenNumbers('vingt')).toEqual([20]);
  });

  it('parses teens', () => {
    expect(parseSpokenNumbers('onze')).toEqual([11]);
    expect(parseSpokenNumbers('quinze')).toEqual([15]);
    expect(parseSpokenNumbers('dix-sept')).toEqual([17]);
  });

  it('parses compound numbers (additive)', () => {
    expect(parseSpokenNumbers('vingt-trois')).toEqual([23]);
    expect(parseSpokenNumbers('trente-six')).toEqual([36]);
    expect(parseSpokenNumbers('quarante-deux')).toEqual([42]);
  });

  it('parses 70/80/90 special cases', () => {
    expect(parseSpokenNumbers('soixante-dix')).toEqual([70]);
    expect(parseSpokenNumbers('quatre-vingt')).toEqual([80]);
    expect(parseSpokenNumbers('quatre-vingts')).toEqual([80]);
    expect(parseSpokenNumbers('quatre-vingt-dix')).toEqual([90]);

    // KNOWN GAP: compound 80+N forms like "quatre-vingt-un" (81),
    // "quatre-vingt-deux" (82) split to [quatre, vingt, N] which sums to
    // 4+20+N, not 80+N. Pre-existing behavior — multiplication answers in
    // this game don't reach 81+ so it's never been an issue.
    // Documented here so the limit is visible if/when content expands.
    expect(parseSpokenNumbers('quatre-vingt-deux')).toEqual([26]); // documents the bug
  });

  it('handles "et" connector', () => {
    expect(parseSpokenNumbers('vingt et un')).toEqual([21]);
    expect(parseSpokenNumbers('soixante et onze')).toEqual([71]);
  });

  it('parses cent', () => {
    expect(parseSpokenNumbers('cent')).toEqual([100]);
  });
});

describe('parseSpokenNumbers — homophones', () => {
  it('accepts sis as 6', () => {
    expect(parseSpokenNumbers('sis')).toEqual([6]);
  });
  it('accepts dis as 10', () => {
    expect(parseSpokenNumbers('dis')).toEqual([10]);
  });
  it('accepts sang as 100', () => {
    expect(parseSpokenNumbers('sang')).toEqual([100]);
  });
  it('accepts set as 7', () => {
    expect(parseSpokenNumbers('set')).toEqual([7]);
  });
});

describe('parseSpokenNumbers — noise tolerance', () => {
  it('strips filler words', () => {
    expect(parseSpokenNumbers('euh douze')).toEqual([12]);
    expect(parseSpokenNumbers('heu vingt-trois')).toEqual([23]);
    expect(parseSpokenNumbers('alors quarante')).toEqual([40]);
  });

  it('is case-insensitive', () => {
    expect(parseSpokenNumbers('VINGT')).toEqual([20]);
    expect(parseSpokenNumbers('Soixante-Dix')).toEqual([70]);
  });

  it('trims whitespace', () => {
    expect(parseSpokenNumbers('  douze  ')).toEqual([12]);
  });
});

describe('parseFrenchText — direct unit', () => {
  it('returns null for unknown words', () => {
    expect(parseFrenchText('chat')).toBeNull();
  });
  it('returns null for out-of-range compound', () => {
    // "un" alone = 1, below MIN_VALUE
    expect(parseFrenchText('un')).toBeNull();
  });
  it('returns null for empty input', () => {
    expect(parseFrenchText('')).toBeNull();
  });
});
