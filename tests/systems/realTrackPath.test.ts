import { describe, it, expect } from 'vitest';
import { parseSvgPathToPhaserPath } from '../../src/systems/svgPathParser.js';
import { TRACK_CONFIG } from '../../src/config/trackConfig.js';

describe('real track path (FactorFuriousTraccHD)', () => {
  it('parses without throwing', () => {
    const path = parseSvgPathToPhaserPath(TRACK_CONFIG.SVG_PATH_D);
    const len = path.getLength();
    expect(len).toBeGreaterThan(0);
    expect(Number.isFinite(len)).toBe(true);
  });

  it('produces finite numeric coordinates at 0, 0.25, 0.5, 0.75, 1', () => {
    const path = parseSvgPathToPhaserPath(TRACK_CONFIG.SVG_PATH_D);
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const p = path.getPoint(t);
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it('start point matches the first M coordinate in the d string', () => {
    // Pull the first "M x y" or "m x y" out of the d string and compare.
    const path = parseSvgPathToPhaserPath(TRACK_CONFIG.SVG_PATH_D);
    const m = TRACK_CONFIG.SVG_PATH_D.match(/^[Mm]\s+(-?[\d.]+)[,\s]+(-?[\d.]+)/);
    expect(m).not.toBeNull();
    const expectedX = parseFloat(m![1]);
    const expectedY = parseFloat(m![2]);
    const p = path.getPoint(0);
    expect(p.x).toBeCloseTo(expectedX, 1);
    expect(p.y).toBeCloseTo(expectedY, 1);
  });

  it('path stays within a generous viewBox-extended sanity bound', () => {
    // Tolerance: a quarter of each axis. Catches truly broken parses without
    // failing on paths the artist deliberately runs slightly past the edge.
    const path = parseSvgPathToPhaserPath(TRACK_CONFIG.SVG_PATH_D);
    const tolX = TRACK_CONFIG.SVG_VIEWBOX_W * 0.25;
    const tolY = TRACK_CONFIG.SVG_VIEWBOX_H * 0.25;
    for (let i = 0; i <= 20; i++) {
      const p = path.getPoint(i / 20);
      expect(p.x).toBeGreaterThan(-tolX);
      expect(p.x).toBeLessThan(TRACK_CONFIG.SVG_VIEWBOX_W + tolX);
      expect(p.y).toBeGreaterThan(-tolY);
      expect(p.y).toBeLessThan(TRACK_CONFIG.SVG_VIEWBOX_H + tolY);
    }
  });
});
