#!/usr/bin/env node
/**
 * Extract the SVG track trace's d attribute, viewBox, and cumulative parent
 * <g transform="translate(...)"> values, and print the values you need to
 * paste into src/config/trackConfig.ts.
 *
 * Why this exists: Inkscape often nests paths under translated layers (most
 * commonly when you import an image into a sub-layer or move objects around).
 * If you ignore the parent transforms, the trace renders shifted relative to
 * the image. This script sums them so you don't have to.
 *
 * Usage:
 *   node scripts/extract-svg-transform.mjs assets/perspective/track_trace.svg
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/extract-svg-transform.mjs <path.svg>');
  process.exit(1);
}
const svg = readFileSync(resolve(file), 'utf8');

// viewBox
const vb = svg.match(/<svg[^>]*\bviewBox="([\d.\s-]+)"/);
if (!vb) {
  console.error('Could not find viewBox on root <svg>.');
  process.exit(1);
}
const [, vbValues] = vb;
const [, , vbW, vbH] = vbValues.trim().split(/\s+/).map(Number);

// Walk the tree element-by-element to compute the cumulative translate on
// the path. We use a simple regex-based scan rather than a full XML parser
// because the SVGs we deal with are well-formed Inkscape output.
//
// Strategy: tokenize <g ...> open tags, </g> close tags, and <path ...>.
// Maintain a stack of (translateX, translateY) and report the sum when we
// hit a <path>.

const tokenRe = /<(g|\/g|path|image|svg|\/svg)\b([^>]*)>/g;

const stack = [{ tx: 0, ty: 0, tag: 'root' }];
const found = [];
let m;
while ((m = tokenRe.exec(svg)) !== null) {
  const [, tag, attrs] = m;
  if (tag === '/g' || tag === '/svg') {
    stack.pop();
    continue;
  }
  // Self-closing? <path .../> shouldn't push.
  const selfClosing = attrs.trim().endsWith('/');
  let tx = 0;
  let ty = 0;
  const trMatch = attrs.match(/\btransform="([^"]*)"/);
  if (trMatch) {
    const trMatchInner = trMatch[1].match(/translate\(\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/);
    if (trMatchInner) {
      tx = parseFloat(trMatchInner[1]);
      ty = parseFloat(trMatchInner[2]);
    }
  }
  // Cumulative translate at this element = sum up the stack + this element.
  const ancestorTx = stack.reduce((s, e) => s + e.tx, 0);
  const ancestorTy = stack.reduce((s, e) => s + e.ty, 0);
  const cumTx = ancestorTx + tx;
  const cumTy = ancestorTy + ty;

  if (tag === 'path') {
    const dMatch = attrs.match(/\bd="([^"]*)"/);
    if (dMatch) {
      found.push({ tx: cumTx, ty: cumTy, d: dMatch[1].replace(/\s+/g, ' ').trim() });
    }
  }

  if (!selfClosing && (tag === 'g' || tag === 'svg')) {
    stack.push({ tx, ty, tag });
  }
}

if (found.length === 0) {
  console.error('No <path> with a d attribute found.');
  process.exit(1);
}
if (found.length > 1) {
  console.error(`Warning: ${found.length} paths found; using the first one. Delete extras from the SVG to be sure.`);
}
const { tx, ty, d } = found[0];

console.log('// Paste into src/config/trackConfig.ts:');
console.log(`SVG_VIEWBOX_W: ${vbW},`);
console.log(`SVG_VIEWBOX_H: ${vbH},`);
console.log(`SVG_TRANSLATE_X: ${tx},`);
console.log(`SVG_TRANSLATE_Y: ${ty},`);
console.log('SVG_PATH_D:');
console.log(`  '${d}',`);
