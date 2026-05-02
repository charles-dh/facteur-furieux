import { describe, it, expect } from 'vitest';
import { parseSvgPathToPhaserPath } from '../../src/systems/svgPathParser.js';

describe('parseSvgPathToPhaserPath', () => {
  it('parses a simple moveto + cubic bezier', () => {
    // M0,0 then C with explicit absolute coords. End at (100, 0).
    const d = 'M 0 0 C 25 50, 75 50, 100 0';
    const path = parseSvgPathToPhaserPath(d);
    const start = path.getPoint(0);
    const end = path.getPoint(1);
    expect(start.x).toBeCloseTo(0, 3);
    expect(start.y).toBeCloseTo(0, 3);
    expect(end.x).toBeCloseTo(100, 3);
    expect(end.y).toBeCloseTo(0, 3);
  });

  it('handles relative cubic (lowercase c)', () => {
    // M50,50 then a cubic relative to (50,50): control offsets and endpoint
    // offset (100, 0) → final point should be (150, 50).
    const d = 'M 50 50 c 25 50, 75 50, 100 0';
    const path = parseSvgPathToPhaserPath(d);
    const end = path.getPoint(1);
    expect(end.x).toBeCloseTo(150, 3);
    expect(end.y).toBeCloseTo(50, 3);
  });

  it('handles a closed path with Z', () => {
    // Triangle: (0,0) → (100,0) → (50,100) → close back to (0,0).
    const d = 'M 0 0 L 100 0 L 50 100 Z';
    const path = parseSvgPathToPhaserPath(d);
    const start = path.getPoint(0);
    const end = path.getPoint(1);
    expect(start.x).toBeCloseTo(0, 3);
    expect(start.y).toBeCloseTo(0, 3);
    // Z closes the path back to the original moveto, so endpoint = start.
    expect(end.x).toBeCloseTo(0, 3);
    expect(end.y).toBeCloseTo(0, 3);
  });

  it('handles comma-separated coordinates (Inkscape Plain SVG style)', () => {
    const d = 'M 10,20 L 30,40';
    const path = parseSvgPathToPhaserPath(d);
    const start = path.getPoint(0);
    const end = path.getPoint(1);
    expect(start.x).toBeCloseTo(10, 3);
    expect(start.y).toBeCloseTo(20, 3);
    expect(end.x).toBeCloseTo(30, 3);
    expect(end.y).toBeCloseTo(40, 3);
  });

  it('handles implicit-repeat for L commands', () => {
    // Single "L" with multiple coordinate pairs. Per SVG spec, the second
    // pair implicitly repeats the L command.
    const d = 'M 0 0 L 100 0 100 100';
    const path = parseSvgPathToPhaserPath(d);
    const end = path.getPoint(1);
    expect(end.x).toBeCloseTo(100, 3);
    expect(end.y).toBeCloseTo(100, 3);
  });

  it('handles implicit-repeat for C commands', () => {
    // Two cubics under one C — second control set implicitly continues.
    const d = 'M 0 0 C 10 10, 20 10, 30 0 40 -10, 50 -10, 60 0';
    const path = parseSvgPathToPhaserPath(d);
    const end = path.getPoint(1);
    expect(end.x).toBeCloseTo(60, 3);
    expect(end.y).toBeCloseTo(0, 3);
  });

  it('handles H and V (horizontal/vertical lineto)', () => {
    const d = 'M 10 10 H 100 V 50';
    const path = parseSvgPathToPhaserPath(d);
    const end = path.getPoint(1);
    expect(end.x).toBeCloseTo(100, 3);
    expect(end.y).toBeCloseTo(50, 3);
  });

  it('throws on unsupported commands (e.g. arc)', () => {
    expect(() => parseSvgPathToPhaserPath('M 0 0 A 10 10 0 0 0 100 100')).toThrow(
      /Unsupported SVG path command/,
    );
  });

  it('parses a closed multi-segment cubic path (Inkscape-style)', () => {
    // Mimics what Inkscape emits when you trace ~4 smoothed nodes around a
    // loop: M, three Cs, Z.
    const d =
      'M 100 100 C 200 80, 300 120, 350 200 C 320 280, 220 320, 150 280 C 80 250, 60 180, 100 100 Z';
    const path = parseSvgPathToPhaserPath(d);
    expect(path.getLength()).toBeGreaterThan(0);
    const start = path.getPoint(0);
    const end = path.getPoint(1);
    // Closed path: end should land at start.
    expect(end.x).toBeCloseTo(start.x, 1);
    expect(end.y).toBeCloseTo(start.y, 1);
  });
});
