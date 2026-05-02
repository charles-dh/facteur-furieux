/**
 * Vitest setup. Runs once before any test file is loaded.
 *
 * Phaser, when imported under jsdom, eagerly probes the canvas API to
 * detect feature support (CanvasFeatures.js calls getContext('2d') and
 * sets fillStyle on it). jsdom doesn't ship a canvas implementation by
 * default, so we install a minimal stub that returns a context with the
 * properties Phaser touches. This is enough for our headless logic-only
 * tests; we never render.
 */

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function getContextStub(): any {
    // Object literal is enough — Phaser only sets a couple of properties
    // and reads them back. No drawing happens.
    return {
      fillStyle: '',
      fillRect: () => {},
      getImageData: () => ({ data: [0, 0, 0, 0] }),
      putImageData: () => {},
      drawImage: () => {},
      translate: () => {},
      transform: () => {},
      setTransform: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      canvas: this,
    };
  };
}
