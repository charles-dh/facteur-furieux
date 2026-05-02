import { CAR } from '../config/constants.js';

/**
 * Maps a Phaser-convention heading angle to a car spritesheet frame index.
 *
 * Conventions:
 *  - Phaser angles: 0 = +X (right), π/2 = +Y (down). Atan2 of a tangent
 *    vector returns this convention directly.
 *  - Spritesheet naming: car_NNN.png where NNN is degrees from "straight up,"
 *    increasing COUNTER-clockwise (so 90 = left, 180 = down, 270 = right).
 *
 * Conversion: heading 0 (right) → sprite 270, heading -π/2 (up) → sprite 0,
 * heading π/2 (down) → sprite 180, heading π (left) → sprite 90. Equivalent
 * to negating the Phaser-degrees heading and adding 90, modulo 360.
 *
 * Frame index = round(spriteAngleDeg / step) mod N, where step = 360/N.
 *
 * Exported as a pure function so it's unit-testable without a Phaser context.
 */
export function frameIndexForHeading(headingRadians: number, numFrames = CAR.NUM_ANGLE_FRAMES): number {
  const headingDeg = (headingRadians * 180) / Math.PI;
  // Mapping: heading 0 (right) → sprite 270 (right under CCW convention,
  // because on a screen with +Y down, CCW from up runs through left, not
  // right). Formula spriteDeg = (270 - headingDeg) mod 360.
  const spriteDeg = ((270 - headingDeg) % 360 + 360) % 360;
  const step = 360 / numFrames;
  return Math.round(spriteDeg / step) % numFrames;
}

/**
 * Phaser texture key for the Nth car-angle frame. NUM_ANGLE_FRAMES files are
 * loaded in preload() with these keys.
 */
export function carTextureKey(frameIndex: number, numFrames = CAR.NUM_ANGLE_FRAMES): string {
  const step = 360 / numFrames;
  const angle = (frameIndex * step) % 360;
  // Files are zero-padded to 3 digits: car_000.png, car_015.png, ...
  return `car_${String(angle).padStart(3, '0')}`;
}

/**
 * Asset path used by the loader. Mirrors the texture key so each frame is
 * one HTTP request — simple, no atlas needed.
 */
export function carAssetPath(frameIndex: number, numFrames = CAR.NUM_ANGLE_FRAMES): string {
  return `assets/perspective/car/${carTextureKey(frameIndex, numFrames)}.png`;
}
