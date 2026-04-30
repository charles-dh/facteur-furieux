import { describe, it, expect, beforeEach } from 'vitest';
import VehiclePhysics from '../../src/systems/VehiclePhysics';
import { PHYSICS } from '../../src/config/constants.js';

describe('VehiclePhysics', () => {
  let vp: VehiclePhysics;
  beforeEach(() => { vp = new VehiclePhysics(); });

  it('starts at rest at position 0', () => {
    expect(vp.position).toBe(0);
    expect(vp.velocity).toBe(0);
  });

  it('does not move without a boost', () => {
    vp.update(1000);
    expect(vp.position).toBe(0);
    expect(vp.velocity).toBe(0);
  });

  it('applyBoost adds acceleration which becomes velocity on update', () => {
    vp.applyBoost(1.0);
    expect(vp.acceleration).toBe(PHYSICS.BASE_ACCELERATION);
    vp.update(16);
    expect(vp.velocity).toBeGreaterThan(0);
    // Acceleration is consumed each frame.
    expect(vp.acceleration).toBe(0);
  });

  it('clamps velocity to maxSpeed', () => {
    for (let i = 0; i < 200; i++) {
      vp.applyBoost(1.0);
      vp.update(16);
    }
    expect(vp.velocity).toBeLessThanOrEqual(PHYSICS.MAX_SPEED);
  });

  it('decays to zero with friction once boosts stop', () => {
    vp.applyBoost(1.0);
    for (let i = 0; i < 50; i++) vp.update(16); // ramp up
    const peak = vp.velocity;
    expect(peak).toBeGreaterThan(0);
    for (let i = 0; i < 2000; i++) vp.update(16); // coast
    expect(vp.velocity).toBeLessThan(peak);
    expect(vp.velocity).toBeGreaterThanOrEqual(0);
  });

  it('wraps position past 1.0', () => {
    vp.position = 0.95;
    vp.velocity = 1.0;
    vp.update(100); // 0.1s × 1.0 = 0.1 progress → 1.05 → wraps to 0.05
    expect(vp.position).toBeLessThan(1.0);
    expect(vp.position).toBeGreaterThan(0);
  });
});
