/**
 * Active track declaration.
 *
 * The game loads ONE track at a time. To swap tracks (e.g. asphalt vs.
 * desert reskin), point IMAGE_KEY/IMAGE_PATH/SVG_PATH_D at a different
 * background image and centerline.
 *
 * Workflow when re-tracing:
 *   1. Open IMAGE_PATH in Inkscape.
 *   2. Bezier (B) tool → click ~15-20 nodes around the road centerline,
 *      following the dashed yellow line. Close with Z.
 *   3. Node tool → select all → "Make selected nodes smooth".
 *   4. File → Save As → "Plain SVG".
 *   5. Open the .svg in a text editor; copy the <path d="..."/> attribute
 *      AND the viewBox dimensions.
 *   6. Update SVG_PATH_D + SVG_VIEWBOX_W/H below.
 *
 * The SVG_VIEWBOX values matter: Inkscape stores coordinates in the SVG's
 * own viewBox space (often mm-based, e.g. 449 × 245), not the image's pixel
 * space. The Track system rescales path coordinates from viewBox-space into
 * image-space at parse time, so paths and the background image always line
 * up regardless of the SVG's authoring units.
 *
 * Supported path commands: M, L, H, V, C, Z + lowercase relatives + implicit
 * repeat. Inkscape's smoothed bezier output uses only M/m + C/c + Z, all
 * supported.
 */

export const TRACK_CONFIG = {
  /** Phaser texture key the image is registered under. */
  IMAGE_KEY: 'track-bg',

  /** Asset path relative to the dev server / public root. */
  IMAGE_PATH: 'assets/perspective/FactorFurious_track.png',

  /** Native dimensions of the background image (pixels). */
  IMAGE_WIDTH: 1672,
  IMAGE_HEIGHT: 941,

  /**
   * SVG viewBox dimensions for the source path. The path coordinates below
   * are interpreted in this coordinate system and then linearly mapped onto
   * the image (assumes the SVG's embedded image fills its viewBox 1:1, which
   * is what Inkscape does when you import a PNG and trace over it).
   */
  SVG_VIEWBOX_W: 442.38333,
  SVG_VIEWBOX_H: 248.97292,

  // (Re-traced: starts at the actual start/finish line near the bottom-left
  // of the image. No parent <g transform> in this version, so translate=0.)

  /**
   * Net X/Y translate (in viewBox units) applied to the path by its parent
   * <g transform="translate(...)"> wrappers in the SVG. Inkscape often nests
   * paths inside translated layers (e.g. when you import an image into a
   * sub-layer, or move objects around with the selector tool — Inkscape
   * stores the move as a transform on the parent group, not a rewrite of
   * the path d).
   *
   * If you skip this, your trace will appear shifted relative to the image
   * by exactly this amount.
   *
   * To compute these values, run the helper:
   *   npm run extract-svg-transform
   * — it walks the SVG, sums all translate() transforms on the path's
   * ancestor chain, and prints what to paste here.
   */
  SVG_TRANSLATE_X: 0,
  SVG_TRANSLATE_Y: 0,

  /**
   * SVG path "d" attribute, traced over FactorFurious_track.png in Inkscape
   * (assets/perspective/track_trace.svg). One closed loop following the road
   * centerline.
   */
  SVG_PATH_D:
    'm 137.1748,207.92545 c -5.97127,-0.004 -19.15043,-0.0159 -17.21494,-0.002 -16.09108,-0.5112 -33.251567,2.37829 -48.413759,-4.22517 -11.534525,-6.86376 -14.839484,-22.99719 -10.093946,-34.86318 7.719526,-10.8739 17.756632,-21.75895 31.647544,-23.79697 10.658601,-1.3283 29.393241,-10.61164 19.364101,-23.4132 -12.773562,-8.40263 -28.976576,-7.67192 -42.731154,-13.71768 -15.435373,-6.71169 -8.836989,-25.39302 5.598972,-28.249352 14.54048,-8.59218 32.128982,-8.100553 48.354752,-10.943447 24.72011,-2.938588 50.20935,-0.777455 73.55013,8.143959 13.0454,1.996064 26.0584,4.05012 39.28582,4.26181 14.89969,2.138897 28.90372,-2.909697 43.12384,-5.967287 22.70212,-3.851021 46.50987,-11.445308 69.28292,-4.033324 13.83573,3.953778 25.01533,16.760417 23.14803,31.697671 -1.57933,14.95047 -17.34278,19.29727 -29.26734,23.41388 -18.00674,6.44126 -3.82301,24.58892 9.15208,26.36444 12.10478,5.191 26.10762,7.36262 36.36245,16.70669 14.35207,9.60912 -1.09089,26.96147 -12.47832,31.08114 -11.45889,6.81634 -24.67056,10.94686 -38.04284,8.44596 -3.77231,-0.58741 -16.54257,-0.52852 -26.60614,-0.71249 -58.00613,-0.41363 -116.01515,-0.16708 -174.0222,-0.19165 -7e-5,0 7e-5,2e-4 0,2e-4 z',

  /** Where the start/finish line sits on the path. 0 = first M point. */
  START_PROGRESS: 0,
} as const;
