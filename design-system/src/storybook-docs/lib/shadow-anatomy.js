/**
 * Shadow anatomy for the Elevation docs: read a `--ds-shadow-*` value, as the
 * page resolves it, into its layers, and measure what those layers paint.
 * Pure math, no DOM, so every chart and table on the page is computed from the
 * live token and never restates a number.
 *
 * Every elevation shadow is three layers in a fixed order: the edge (a 1px
 * ring, the surface's border), the key (a short contact shadow) and the
 * ambient (a wide soft one that reads as height).
 */

/** The three slots, in the order a shadow token lists its layers. */
export const SLOTS = ['edge', 'key', 'ambient'];

/** Splits on commas that sit outside parentheses. */
const splitTop = (value) => {
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < value.length; i += 1) {
        const ch = value[i];
        if (ch === '(') depth += 1;
        else if (ch === ')') depth -= 1;
        else if (ch === ',' && depth === 0) {
            parts.push(value.slice(start, i));
            start = i + 1;
        }
    }
    parts.push(value.slice(start));
    return parts.map((p) => p.trim()).filter(Boolean);
};

const COLOR = /(rgba?|hsla?)\([^)]*\)|#[0-9a-f]{3,8}\b|transparent/i;

const parseColor = (text) => {
    if (!text || /^transparent$/i.test(text)) return { r: 0, g: 0, b: 0, a: 0 };
    if (text.startsWith('#')) {
        const hex = text.slice(1);
        const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
        const n = (i) => parseInt(full.slice(i, i + 2), 16);
        return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? Math.round((n(6) / 255) * 1000) / 1000 : 1 };
    }
    const nums = text.slice(text.indexOf('(') + 1, -1).split(/[\s,/]+/).filter(Boolean).map(Number);
    const [r, g, b, a = 1] = nums;
    return { r, g, b, a };
};

/**
 * One layer per comma-separated shadow: `{ x, y, blur, spread, inset, color }`.
 * Reads both the authored form (lengths first) and the computed form (color first).
 */
export const parseShadow = (value) => {
    const text = (value || '').trim();
    if (!text || text === 'none') return [];
    return splitTop(text).map((layer) => {
        const colorMatch = layer.match(COLOR);
        const rest = colorMatch ? layer.replace(colorMatch[0], ' ') : layer;
        const inset = /\binset\b/.test(rest);
        const [x = 0, y = 0, blur = 0, spread = 0] = rest
            .replace(/\binset\b/, ' ')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((n) => parseFloat(n));
        return { x, y, blur, spread, inset, color: parseColor(colorMatch?.[0]) };
    });
};

/** The layers with their slot names, edge first. A fourth layer, if any, has no slot. */
export const slotted = (layers) => layers.map((layer, i) => ({ ...layer, slot: SLOTS[i] ?? `extra-${i}` }));

/** `rgb(r g b / a)` for one layer's ink. */
// docs-literal: writes back an ink read from a --ds-shadow-* token, so it has no token of its own.
export const ink = ({ r, g, b, a }) => `rgb(${r} ${g} ${b} / ${Math.round(a * 1000) / 1000})`;

const layerCss = (l) => `${l.inset ? 'inset ' : ''}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${ink(l.color)}`;

/** The shadow back as CSS, with only the slots left on. `none` when none are. */
export const composeShadow = (layers, enabled = {}) => {
    const on = layers.filter((l) => enabled[l.slot] !== false);
    return on.length ? on.map(layerCss).join(', ') : 'none';
};

/** How far below the surface's bottom edge the farthest layer still paints, in px. */
export const shadowReach = (layers) =>
    layers.reduce((max, l) => Math.max(max, l.y + l.spread + l.blur), 0);

/** Abramowitz and Stegun 7.1.26: erf to about 1e-7. */
const erf = (x) => {
    const sign = Math.sign(x);
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return sign * y;
};

/** Relative luminance of an ink, 0 (black) to 1 (white). */
const luminance = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/**
 * How much one layer covers the ground `d` px below the surface's bottom edge,
 * straight down from a wide surface: the blur is a Gaussian with sigma = blur / 2.
 */
const coverage = (layer, d) => {
    const edge = layer.y + layer.spread;
    const sigma = layer.blur / 2;
    if (sigma === 0) return d < edge ? 1 : 0;
    return 0.5 * (1 - erf((d - edge) / (sigma * Math.SQRT2)));
};

/**
 * How dark the ground is `d` px below the surface's bottom edge, 0 to 1: the
 * layers composited over each other. A light ink (the dark-mode edge ring)
 * lightens the edge rather than shading the ground, so it is left out.
 */
export const groundDarkness = (layers, d) => {
    const clear = layers
        .filter((l) => !l.inset && luminance(l.color) < 0.5)
        .reduce((left, l) => left * (1 - l.color.a * coverage(l, d)), 1);
    return 1 - clear;
};
