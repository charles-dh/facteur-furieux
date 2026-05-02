import { describe, it, expect } from 'vitest';
import { frameIndexForHeading, carTextureKey } from '../../src/systems/carSprite.js';

// 32 frames at 11.25° steps. Sprite-angle convention: 0 = up, COUNTER-clockwise.
//   sprite 0  → up
//   sprite 8  → left  (sprite-angle 90°)
//   sprite 16 → down  (sprite-angle 180°)
//   sprite 24 → right (sprite-angle 270°)
// Phaser heading convention: 0 = right (+X), π/2 = down (+Y).
//   heading 0      → right → sprite 24
//   heading π/2    → down  → sprite 16
//   heading π      → left  → sprite 8
//   heading -π/2   → up    → sprite 0

describe('frameIndexForHeading (32 frames, CCW sprites)', () => {
  it('heading right (0) → frame 24', () => {
    expect(frameIndexForHeading(0)).toBe(24);
  });
  it('heading down (π/2) → frame 16', () => {
    expect(frameIndexForHeading(Math.PI / 2)).toBe(16);
  });
  it('heading left (π) → frame 8', () => {
    expect(frameIndexForHeading(Math.PI)).toBe(8);
  });
  it('heading up (-π/2) → frame 0', () => {
    expect(frameIndexForHeading(-Math.PI / 2)).toBe(0);
  });
  it('heading 15° past right (toward down) → frame 23', () => {
    // Phaser +15° = slightly down-right. With CCW sprites on a +Y-down screen,
    // moving heading from "right" toward "down" decrements the sprite-side
    // frame index. spriteDeg = 270 - 15 = 255; 255/11.25 = 22.67 → round 23.
    expect(frameIndexForHeading(Math.PI / 12)).toBe(23);
  });
  it('all 32 frame indices are reachable from a full heading sweep', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 720; i++) {
      const radians = (i * Math.PI) / 360; // 0.5° steps to cover every frame
      seen.add(frameIndexForHeading(radians));
    }
    expect(seen.size).toBe(32);
  });
});

describe('carTextureKey', () => {
  it('zero-pads angles using banker\'s rounding to match Python-generated assets', () => {
    expect(carTextureKey(0)).toBe('car_000');
    expect(carTextureKey(1)).toBe('car_011');
    expect(carTextureKey(8)).toBe('car_090');
    expect(carTextureKey(31)).toBe('car_349');
    // Half-tie cases: 2*11.25 = 22.5 → 22 (round-half-to-even); JS Math.round
    // would give 23, which is NOT a file. These four were the "black box"
    // bug.
    expect(carTextureKey(2)).toBe('car_022');
    expect(carTextureKey(10)).toBe('car_112');
    expect(carTextureKey(18)).toBe('car_202');
    expect(carTextureKey(26)).toBe('car_292');
  });
});
