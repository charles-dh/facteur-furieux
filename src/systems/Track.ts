import Phaser from 'phaser';
import { GAME } from '../config/constants.js';
import { TRACK_CONFIG } from '../config/trackConfig.js';
import { parseSvgPathToPhaserPath } from './svgPathParser.js';

/**
 * Track System
 *
 * Wraps a Phaser.Curves.Path traced over the track background image.
 * The path lives in IMAGE-SPACE coordinates (0..IMAGE_WIDTH, 0..IMAGE_HEIGHT);
 * Track applies the same scale + offset as the rendered background so the
 * car visually follows the road.
 *
 * Public API (unchanged from the previous circle-based implementation):
 *   - getPositionAt(t: 0..1) → { x, y, angle } in canvas-space
 *   - length: total path length in canvas pixels
 *
 * The renderer (GameScene.renderTrack) asks Track for its image transform
 * so the background image and the path share one source of truth.
 */
export interface TrackPosition {
  x: number;
  y: number;
  /** Tangent angle in radians, from atan2(tangent.y, tangent.x). */
  angle: number;
}

export interface TrackTransform {
  /** Uniform scale factor applied to image-space coords to get canvas-space. */
  scale: number;
  /** X offset of the image inside the canvas (image is letterboxed/centered). */
  offsetX: number;
  offsetY: number;
  /** Display dimensions of the background image after scaling. */
  displayWidth: number;
  displayHeight: number;
}

export default class Track {
  /** Path in viewBox-space coordinates (matches the SVG's coordinate system). */
  private imagePath: Phaser.Curves.Path;
  private transform: TrackTransform;
  /** Total path length in CANVAS-SPACE pixels. */
  public length: number;
  private viewBoxScaleX: number;
  private viewBoxScaleY: number;

  // The scene parameter is kept for API parity with the previous implementation
  // (callers do `new Track(this)`); we don't currently need it but the future
  // tile-based variant might.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_scene: Phaser.Scene) {
    // The SVG was authored in viewBox-space units (e.g. millimeters in
    // Inkscape). Rescale into image-pixel space so it lines up with the
    // background PNG.
    this.viewBoxScaleX = TRACK_CONFIG.IMAGE_WIDTH / TRACK_CONFIG.SVG_VIEWBOX_W;
    this.viewBoxScaleY = TRACK_CONFIG.IMAGE_HEIGHT / TRACK_CONFIG.SVG_VIEWBOX_H;

    this.imagePath = parseSvgPathToPhaserPath(TRACK_CONFIG.SVG_PATH_D);

    this.transform = computeImageTransform(
      TRACK_CONFIG.IMAGE_WIDTH,
      TRACK_CONFIG.IMAGE_HEIGHT,
      GAME.CANVAS_WIDTH,
      GAME.CANVAS_HEIGHT,
    );

    // Canvas-space length: viewBox-space length × viewBox-to-image scale ×
    // image-to-canvas scale. Uniform-ish scale assumed.
    const viewBoxToImage = (this.viewBoxScaleX + this.viewBoxScaleY) / 2;
    this.length = this.imagePath.getLength() * viewBoxToImage * this.transform.scale;
  }

  /**
   * Convert track progress (0..1) to canvas-space position + tangent angle.
   * Wraps progress >= 1 back to 0..1 so callers don't have to.
   */
  getPositionAt(t: number): TrackPosition {
    const wrapped = ((t % 1) + 1) % 1;
    const point = this.imagePath.getPoint(wrapped);
    const tangent = this.imagePath.getTangent(wrapped);

    // Compose three transforms: SVG group translate → viewBox→image →
    // image→canvas. Translate is in viewBox units (same as the d coords).
    const { scale, offsetX, offsetY } = this.transform;
    const vbX = point.x + TRACK_CONFIG.SVG_TRANSLATE_X;
    const vbY = point.y + TRACK_CONFIG.SVG_TRANSLATE_Y;
    const imgX = vbX * this.viewBoxScaleX;
    const imgY = vbY * this.viewBoxScaleY;
    return {
      x: imgX * scale + offsetX,
      y: imgY * scale + offsetY,
      // Tangent: translation has no effect on direction; only the (X,Y)
      // viewBox scale could rotate it if non-uniform. Compose accordingly.
      angle: Math.atan2(tangent.y * this.viewBoxScaleY, tangent.x * this.viewBoxScaleX),
    };
  }

  getTransform(): TrackTransform {
    return this.transform;
  }

  /**
   * Image-space points for debug rendering. Caller is responsible for
   * applying the transform if it wants canvas-space points.
   */
  getDebugPoints(samples = 200): Phaser.Math.Vector2[] {
    return this.imagePath.getPoints(samples);
  }
}

/**
 * Fit-and-center the image inside the canvas. Uses uniform scaling so the
 * image isn't stretched. If the canvas aspect ratio doesn't match the image,
 * the image is letterboxed (offsets > 0 on the matching axis).
 */
function computeImageTransform(
  imageW: number,
  imageH: number,
  canvasW: number,
  canvasH: number,
): TrackTransform {
  const scale = Math.min(canvasW / imageW, canvasH / imageH);
  const displayWidth = imageW * scale;
  const displayHeight = imageH * scale;
  return {
    scale,
    offsetX: (canvasW - displayWidth) / 2,
    offsetY: (canvasH - displayHeight) / 2,
    displayWidth,
    displayHeight,
  };
}
