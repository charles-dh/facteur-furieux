import Phaser from 'phaser';

/**
 * Minimal SVG `path` "d" attribute parser, scoped to what Inkscape emits when
 * you draw a smoothed bezier curve and save as SVG: M (moveto), C (cubic
 * bezier), L (lineto), Z (closepath), and their lowercase relative forms.
 *
 * Returns a Phaser.Curves.Path that mirrors the SVG path 1:1. The path's
 * coordinate space is the SVG's coordinate space — if you authored the SVG
 * over a 1698x926 background image, the resulting path is in that same space.
 *
 * We don't try to be a general SVG parser. Quadratic, arcs, and smooth
 * shorthand (S, T) are intentionally unsupported — Inkscape's "Make nodes
 * smooth" produces plain C commands, which is all we need.
 */
export function parseSvgPathToPhaserPath(d: string): Phaser.Curves.Path {
  const tokens = tokenize(d);
  const path = new Phaser.Curves.Path();

  // Current "pen" position. SVG relative commands (lowercase) are offsets
  // from this. The first command is always a moveto, which sets it.
  let cx = 0;
  let cy = 0;

  // Subpath start, used by Z to close back to the moveto point.
  let startX = 0;
  let startY = 0;

  let i = 0;
  let lastCommand = '';

  while (i < tokens.length) {
    let cmd = tokens[i];

    // Number tokens after a command implicitly repeat the command (per SVG
    // spec). E.g. "C x1 y1 x2 y2 x y x1 y1 x2 y2 x y" is two cubics.
    if (!isCommand(cmd)) {
      cmd = lastCommand;
    } else {
      i++;
    }

    const rel = cmd === cmd.toLowerCase();
    const upper = cmd.toUpperCase();

    if (upper === 'M') {
      const x = num(tokens[i++]) + (rel ? cx : 0);
      const y = num(tokens[i++]) + (rel ? cy : 0);
      path.moveTo(x, y);
      cx = startX = x;
      cy = startY = y;
      // Per SVG spec, subsequent implicit pairs after M are treated as L.
      lastCommand = rel ? 'l' : 'L';
      continue;
    }

    if (upper === 'L') {
      const x = num(tokens[i++]) + (rel ? cx : 0);
      const y = num(tokens[i++]) + (rel ? cy : 0);
      path.lineTo(x, y);
      cx = x;
      cy = y;
      lastCommand = cmd;
      continue;
    }

    if (upper === 'H') {
      const x = num(tokens[i++]) + (rel ? cx : 0);
      path.lineTo(x, cy);
      cx = x;
      lastCommand = cmd;
      continue;
    }

    if (upper === 'V') {
      const y = num(tokens[i++]) + (rel ? cy : 0);
      path.lineTo(cx, y);
      cy = y;
      lastCommand = cmd;
      continue;
    }

    if (upper === 'C') {
      const x1 = num(tokens[i++]) + (rel ? cx : 0);
      const y1 = num(tokens[i++]) + (rel ? cy : 0);
      const x2 = num(tokens[i++]) + (rel ? cx : 0);
      const y2 = num(tokens[i++]) + (rel ? cy : 0);
      const x = num(tokens[i++]) + (rel ? cx : 0);
      const y = num(tokens[i++]) + (rel ? cy : 0);
      path.cubicBezierTo(x, y, x1, y1, x2, y2);
      cx = x;
      cy = y;
      lastCommand = cmd;
      continue;
    }

    if (upper === 'Z') {
      // Close the subpath. Phaser's Path doesn't have an explicit close, but a
      // line back to the start is equivalent for our purposes.
      if (cx !== startX || cy !== startY) {
        path.lineTo(startX, startY);
      }
      cx = startX;
      cy = startY;
      lastCommand = cmd;
      continue;
    }

    throw new Error(`Unsupported SVG path command: "${cmd}". Supported: M, L, H, V, C, Z (and lowercase).`);
  }

  // Phaser's Path adds a MoveTo "curve" for each moveTo() call. MoveTo doesn't
  // implement getTangentAt, so any later getTangent(t) call that lands inside
  // a MoveTo segment crashes ("curve.getTangentAt is not a function"). Strip
  // them — they have zero length and only serve as pen-up jumps, which we
  // don't need once the path is fully built.
  //
  // Detection: MoveTo curves have `active === false` per Phaser's source
  // (Curves/path/MoveTo.js). We don't rely on constructor.name because
  // bundlers / minifiers can rename it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = path as any;
  p.curves = p.curves.filter((c: { active?: boolean }) => c.active !== false);
  // The cached curve-length table is now stale; force a recompute on next use.
  p.cacheLengths = [];

  return path;
}

function tokenize(d: string): string[] {
  // Split on whitespace and commas, and ensure command letters are isolated
  // tokens even when stuck to a number (e.g. "M10,20C30,40..." → tokens).
  // Strategy: insert spaces around command letters, then split on whitespace
  // and commas.
  const spaced = d.replace(/([MmLlHhVvCcSsQqTtAaZz])/g, ' $1 ');
  return spaced.split(/[\s,]+/).filter(t => t.length > 0);
}

function isCommand(token: string): boolean {
  return /^[MmLlHhVvCcSsQqTtAaZz]$/.test(token);
}

function num(token: string): number {
  const n = parseFloat(token);
  if (Number.isNaN(n)) {
    throw new Error(`Expected number in SVG path, got "${token}"`);
  }
  return n;
}
