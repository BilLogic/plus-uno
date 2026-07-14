/**
 * Helper functions for Research Assistant Chat prototype.
 * @file utils.ts
 */

/** Target saturation multiplier for data viz (less saturated, more readable). */
const SATURATION_FACTOR = 0.8; // Increased slightly for brand vibrancy

/**
 * Desaturates a hex color for softer data viz.
 * @param hex - Hex color (e.g. #22C55E)
 * @param factor - 0–1; lower = more desaturated (default SATURATION_FACTOR)
 * @returns Hex color string
 */
function desaturateHex(hex: string, factor: number = SATURATION_FACTOR): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const newS = Math.min(1, s * factor);
  const c = (1 - Math.abs(2 * l - 1)) * newS;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  let r2 = 0, g2 = 0, b2 = 0;
  if (h < 1 / 6) { r2 = c; g2 = x; b2 = 0; } else if (h < 2 / 6) { r2 = x; g2 = c; b2 = 0; } else if (h < 3 / 6) { r2 = 0; g2 = c; b2 = x; } else if (h < 4 / 6) { r2 = 0; g2 = x; b2 = c; } else if (h < 5 / 6) { r2 = x; g2 = 0; b2 = c; } else { r2 = c; g2 = 0; b2 = x; }
  return `#${Math.round((r2 + m) * 255).toString(16).padStart(2, '0')}${Math.round((g2 + m) * 255).toString(16).padStart(2, '0')}${Math.round((b2 + m) * 255).toString(16).padStart(2, '0')}`;
}

/**
 * Returns a background color for a heatmap cell based on correlation value.
 * High (>0.75): Brand Blue shades (aligned with var(--color-primary)). 
 * Medium (0.5–0.75): Neutral/Teal shades. 
 * Low (<0.5): Light Red shades (warning/low correlation).
 * @param value - Correlation value between 0 and 1
 * @returns Hex color string
 */
export function getHeatmapColorByValue(value: number): string {
  let raw: string;
  if (value > 0.75) {
    // Brand Primary Blue range (#0472a8 is primary fallback)
    const t = (value - 0.75) / 0.25;
    raw = interpolateHex('#034b6f', '#0472a8', t);
  } else if (value >= 0.5) {
    // Mid range - Teal/Neutral
    const t = (value - 0.5) / 0.25;
    raw = interpolateHex('#5e8e9e', '#7ab0c2', t);
  } else {
    // Low range - Muted Red
    const t = value / 0.5;
    raw = interpolateHex('#B91C1C', '#EF4444', t);
  }
  return desaturateHex(raw);
}

/**
 * Linear interpolation between two hex colors.
 * @param hexA - Start hex (e.g. #22C55E)
 * @param hexB - End hex (e.g. #22C55E lighter)
 * @param t - 0–1
 * @returns Hex color string
 */
function interpolateHex(hexA: string, hexB: string, t: number): string {
  const rA = parseInt(hexA.slice(1, 3), 16);
  const gA = parseInt(hexA.slice(3, 5), 16);
  const bA = parseInt(hexA.slice(5, 7), 16);
  const rB = parseInt(hexB.slice(1, 3), 16);
  const gB = parseInt(hexB.slice(3, 5), 16);
  const bB = parseInt(hexB.slice(5, 7), 16);
  const r = Math.round(rA + (rB - rA) * t);
  const g = Math.round(gA + (gB - gA) * t);
  const b = Math.round(bA + (bB - bA) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Formats a correlation value for display (e.g. "0.82").
 * @param value - Correlation value
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatCorrelationLabel(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}
