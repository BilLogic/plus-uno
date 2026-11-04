import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every other foundation (spacing, radius, elevation, stroke, type, motion)
 * a chart draws with must come off the ladder, the same as the color work in
 * `palette.test.js` — Atlassian's chart guidance is color-only, so there's no
 * chart-specific exception for the rest. This walks every chart source file
 * and fails on the literal shapes `design-system/guidelines/foundations/
 * data-visualization.md` rules out, so a new chart can't reintroduce them.
 */

const ROOT = __dirname;
const SOURCE_EXTENSIONS = new Set(['.jsx', '.css']);

/** @returns {string[]} every chart source file, skipping stories (demo-only, not a chart's own styling) and generated node_modules. */
const collectSourceFiles = (dir) => readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return collectSourceFiles(path);
    if (entry.endsWith('.stories.jsx') || entry.endsWith('.test.js')) return [];
    return SOURCE_EXTENSIONS.has(extname(entry)) ? [path] : [];
});

const files = collectSourceFiles(ROOT).map((path) => ({ path, text: readFileSync(path, 'utf8') }));

/** A `var(--token, <literal>)` fallback: the exact pattern the data-viz foundations rule bans — a chart should trust the ladder, not carry a guess beside it. */
const FALLBACK_PATTERN = /var\(--[\w-]+,\s*['"]?-?[\d.]+(px|rem|%|ms|s)?['"]?\)/g;

/**
 * `DonutChart`'s `--font-size-title-*` / `--font-line-height-title` names
 * were never real tokens (no such declaration exists anywhere in
 * `design-system/src/tokens/`), so the `var()` has always resolved to its own
 * fallback — this predates the foundation-ladder migration and is a
 * mis-mapped heading scale, not a ladder literal. Snapping it onto the real
 * `--font-size-h1`–`h5` tokens changes the chart's rendered size (its Figma
 * scale doesn't line up 1:1 with the body heading scale), which needs a
 * design call this migration isn't making. Tracked, not silently carried:
 * a future ticket should pick the right heading step and delete this line.
 */
const KNOWN_PRE_EXISTING_FALLBACKS = /var\(--font-(size-title-\w+|line-height-title),/;

/** A bare pixel literal on the properties the foundations rule names: radius, stroke width, font size, padding/spacing. Matches a plain non-zero number — zero needs no token, it draws no line at all. */
const LITERAL_PROPERTY_PATTERN = /\b(borderRadius|borderWidth|lineWidth|gridLineWidth|stemWidth|fontSize)\s*:\s*(['"]?[1-9])/g;

describe('data-viz foundations', () => {
    it('carries no old-ladder token names (--element-*, --size-element-*, --layout-*)', () => {
        const offenders = files.filter(({ text }) => /--element-|--size-element-|--layout-/.test(text));
        expect(offenders.map((f) => f.path)).toEqual([]);
    });

    it('never pairs a token with a literal fallback value', () => {
        const offenders = files.flatMap(({ path, text }) =>
            [...text.matchAll(FALLBACK_PATTERN)]
                .filter((m) => !KNOWN_PRE_EXISTING_FALLBACKS.test(m[0]))
                .map((m) => `${path}: ${m[0]}`));
        expect(offenders).toEqual([]);
    });

    it('never hardcodes a radius, stroke width or font size where a token exists', () => {
        const offenders = files.flatMap(({ path, text }) =>
            [...text.matchAll(LITERAL_PROPERTY_PATTERN)]
                // `borderRadius: '50%'` is a genuine pill shape, not a design-token radius.
                .filter((m) => m[2] !== "'5" && m[2] !== '"5')
                .map((m) => `${path}: ${m[0]}`));
        expect(offenders).toEqual([]);
    });

    it('every chart that sets a Highcharts tooltip spreads the shared theme tooltip', () => {
        const offenders = files.filter(({ path, text }) =>
            path.endsWith('.jsx') && !path.endsWith('chartTheme.js') &&
            /\btooltip:\s*{/.test(text) && !text.includes('chartTheme.tooltip'));
        expect(offenders.map((f) => f.path)).toEqual([]);
    });
});
