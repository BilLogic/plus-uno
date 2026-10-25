/**
 * OKLCH primitive ramps solved to per-step WCAG contrast targets (port of the
 * reference generator's `gen.py`).
 *
 * Steps run 100-1100 in Atlassian's numbering. Every step has one contrast
 * target against white, shared by every family, so a step number is a
 * contrast promise whatever the hue: 500 and 600 clear 3:1 (icons, borders),
 * 700 is the first to clear 4.5:1 (text), 850 and up are strong text.
 * Lightness is solved per step to hit the target; chroma follows a per-step
 * shape scaled by the family's cap and held inside the sRGB gamut.
 */

import { contrast, lForContrast, maxChroma, oklchToHex, pyRound } from './oklch.mjs';

export const STEPS = [100, 200, 250, 300, 400, 500, 600, 700, 800, 850, 900, 1000, 1100];

/** Contrast against white per step, calibrated to Atlassian's current palette. */
export const TARGET = {
  100: 1.13, 200: 1.28, 250: 1.55, 300: 1.9, 400: 2.5, 500: 3.2,
  600: 3.9, 700: 5.0, 800: 6.4, 850: 8.7, 900: 11.8, 1000: 14.0, 1100: 16.6,
};

/** Chroma per step as a share of the family's cap: tints pastel, inks not muddy. */
export const SHAPE = {
  100: 0.14, 200: 0.3, 250: 0.42, 300: 0.58, 400: 0.82, 500: 1.0, 600: 1.0,
  700: 0.94, 800: 0.84, 850: 0.72, 900: 0.6, 1000: 0.42, 1100: 0.32,
};

const WHITE = '#ffffff';

/**
 * One family's ramp.
 *
 * @param {number} H         hue in degrees
 * @param {number} vivid     share of the gamut ceiling a step may use
 * @param {number} cmax      chroma cap, multiplied by `shape[step]`
 * @param {number|null} [hueLight]  hue the five lightest steps drift toward
 * @param {Record<number, number>} [shape]
 * @returns {Record<number, {L: number, C: number, H: number, hex: string, cr_white: number}>}
 */
export function ramp(H, vivid, cmax, hueLight = null, shape = SHAPE) {
  const out = {};
  STEPS.forEach((step, index) => {
    let C = cmax;
    let L;
    let Hs;
    // L depends on chroma slightly and chroma on L, so iterate.
    for (let i = 0; i < 4; i++) {
      Hs = hueLight === null ? H : H + (hueLight - H) * Math.max(0, ((index <= 4 ? 1 : 0) * (5 - index)) / 5);
      L = lForContrast(TARGET[step], WHITE, Hs, C, true);
      C = Math.min(cmax * shape[step], vivid * maxChroma(L, Hs));
    }
    const hex = oklchToHex(L, C, Hs);
    out[step] = {
      L: pyRound(L, 3),
      C: pyRound(Math.min(C, maxChroma(L, Hs)), 3),
      H: pyRound(Hs, 1),
      hex,
      cr_white: pyRound(contrast(hex, WHITE), 2),
    };
  });
  return out;
}
