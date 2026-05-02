import { describe, it, expect } from 'vitest';
import { frameIndexForHeading, carTextureKey } from '../../src/systems/carSprite.js';

// 24 frames at 15° steps. Sprite-angle convention: 0 = up, COUNTER-clockwise.
//   sprite 0  → up
//   sprite 6  → left  (sprite-angle 90°)
//   sprite 12 → down  (sprite-angle 180°)
//   sprite 18 → right (sprite-angle 270°)
// Phaser heading convention: 0 = right (+X), π/2 = down (+Y).
//   heading 0      → right → sprite 18
//   heading π/2    → down  → sprite 12
//   heading π      → left  → sprite 6
//   heading -π/2   → up    → sprite 0

describe('frameIndexForHeading (24 frames, CCW sprites)', () => {
  it('heading right (0) → frame 18', () => {
    expect(frameIndexForHeading(0)).toBe(18);
  });
  it('heading down (π/2) → frame 12', () => {
    expect(frameIndexForHeading(Math.PI / 2)).toBe(12);
  });
  it('heading left (π) → frame 6', () => {
    expect(frameIndexForHeading(Math.PI)).toBe(6);
  });
  it('heading up (-π/2) → frame 0', () => {
    expect(frameIndexForHeading(-Math.PI / 2)).toBe(0);
  });
  it('heading 15° past right (toward down) → frame 17', () => {
    // Phaser +15° = slightly down-right. With CCW sprites on a +Y-down screen,
    // moving heading from "right" toward "down" decrements the sprite-side
    // frame index by one (18 → 17).
    expect(frameIndexForHeading(Math.PI / 12)).toBe(17);
  });
  it('all 24 frame indices are reachable from a full heading sweep', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 360; i++) {
      const radians = (i * Math.PI) / 180;
      seen.add(frameIndexForHeading(radians));
    }
    expect(seen.size).toBe(24);
  });
});

describe('carTextureKey', () => {
  it('zero-pads angles', () => {
    expect(carTextureKey(0)).toBe('car_000');
    expect(carTextureKey(1)).toBe('car_015');
    expect(carTextureKey(6)).toBe('car_090');
    expect(carTextureKey(23)).toBe('car_345');
  });
});
