/**
 * OKLab / OKLCH conversion, sRGB gamut mapping and WCAG contrast for the color
 * generator. No dependencies.
 *
 * Matrices: Björn Ottosson, https://bottosson.github.io/posts/oklab/
 *
 * This is a port of the reference generator's `ok.py`, and it keeps that
 * file's arithmetic step for step (the same bisection counts, the same pow
 * calls, Python's half-to-even rounding) so the two produce the same hex for
 * every primitive. `pyRound` is why: `Math.round` rounds 76.5 up, Python
 * rounds it to 76, and that one unit is a different alpha byte.
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Python's `round(x, ndigits)`: half to even, decided on the exact binary
 * value of `x` (so 2.675 rounds down, because the double is just under it).
 */
export function pyRound(x, ndigits = 0) {
  if (!Number.isFinite(x)) return x;
  const negative = x < 0 || Object.is(x, -0);
  const [whole, frac] = Math.abs(x).toFixed(100).split('.');
  const kept = frac.slice(0, ndigits);
  const rest = frac.slice(ndigits);
  let up;
  if (rest[0] > '5') up = true;
  else if (rest[0] < '5') up = false;
  else if (/[1-9]/.test(rest.slice(1))) up = true;
  else up = Number((kept || whole).at(-1)) % 2 === 1; // an exact tie: to even
  let digits = BigInt(whole + kept);
  if (up) digits += 1n;
  const text = digits.toString().padStart(ndigits + 1, '0');
  const value = Number(ndigits ? `${text.slice(0, -ndigits)}.${text.slice(-ndigits)}` : text);
  return negative ? -value : value;
}

/** Two lowercase hex digits for a 0-255 channel. */
export const hexByte = (n) => n.toString(16).padStart(2, '0');

export const srgbToLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
export const linToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

/**
 * The channels of `#rrggbb` or `#rrggbbaa` as 0-255 integers; `a` is null without
 * an alpha byte. The one hex reader of the color generator.
 */
export function parseHex(hex) {
  const h = hex.replace(/^#/, '');
  const byte = (i) => parseInt(h.slice(i, i + 2), 16);
  return { r: byte(0), g: byte(2), b: byte(4), a: h.length === 8 ? byte(6) : null };
}

export const hexToRgb = (hex) => {
  const { r, g, b } = parseHex(hex);
  return [r / 255, g / 255, b / 255];
};

export const rgbToHex = (rgb) =>
  `#${rgb.map((c) => hexByte(Math.max(0, Math.min(255, pyRound(c * 255))))).join('')}`;

const cbrt = (x) => Math.sign(x) * Math.pow(Math.abs(x), 1 / 3);

export function linRgbToOklab(r, g, b) {
  const l = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToLinRgb(L, a, b) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** `[L, C, H]`, H in degrees on [0, 360). */
export function hexToOklch(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLin);
  const [L, a, bb] = linRgbToOklab(r, g, b);
  let H = (Math.atan2(bb, a) * RAD_TO_DEG) % 360;
  if (H < 0) H += 360; // Python's modulo takes the divisor's sign
  return [L, Math.hypot(a, bb), H];
}

export const oklchToLin = (L, C, H) =>
  oklabToLinRgb(L, C * Math.cos(H * DEG_TO_RAD), C * Math.sin(H * DEG_TO_RAD));

export const inSrgb = (L, C, H, eps = 1e-6) => oklchToLin(L, C, H).every((c) => c >= -eps && c <= 1 + eps);

/** The largest in-gamut chroma at this L and H, by 40 steps of bisection. */
export function maxChroma(L, H) {
  let lo = 0;
  let hi = 0.4;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (inSrgb(L, mid, H)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Gamut-map by chroma reduction at constant L and H (CSS Color 4 spirit), then encode. */
export function oklchToHex(L, C, H) {
  const lin = oklchToLin(L, Math.min(C, maxChroma(L, H)), H);
  return rgbToHex(lin.map((c) => linToSrgb(Math.max(0, Math.min(1, c)))));
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * The OKLCH lightness (at hue H, chroma at most C) whose hex reaches `target`
 * contrast against `against`: the lightest such L when `darker`, else the darkest.
 */
export function lForContrast(target, against, H, C, darker = true) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const passes = contrast(oklchToHex(mid, C, H), against) >= target;
    if (darker === passes) lo = mid;
    else hi = mid;
  }
  return darker ? lo : hi;
}

/** OKLab coordinates of a hex (alpha ignored), for perceptual distances. */
export function oklab(hex) {
  const [L, C, H] = hexToOklch(hex.slice(0, 7));
  return [L, C * Math.cos(H * DEG_TO_RAD), C * Math.sin(H * DEG_TO_RAD)];
}

/** OKLab delta E, x100. */
export const deltaE = (a, b) => {
  const [p, q] = [oklab(a), oklab(b)];
  return 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
};
