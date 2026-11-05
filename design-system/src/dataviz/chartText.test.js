import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { composite, contrast, parseColor, readTokens, resolveToken } from '@/lib/tokens.mjs';
import { CHROME } from './palette';
import chartTheme from './chartTheme';

/**
 * Chart text must read in both color modes. The theme names semantic text
 * tokens; this resolves each to its real value in the light and dark blocks of
 * the generated stylesheet and holds it to WCAG AA (4.5:1) on the surfaces a
 * chart sits on, and walks the chart sources for ink that bypasses the tokens.
 */
const tokens = resolve(__dirname, '../tokens/color');
const palette = readTokens(readFileSync(join(tokens, '_palette.scss'), 'utf8'));
const semantic = readFileSync(join(tokens, '_semantic.scss'), 'utf8');

const block = (opener) => {
    const start = semantic.indexOf(opener);
    const end = semantic.indexOf('\n}', start);
    return readTokens(semantic.slice(start, end));
};
const MODES = { light: block(':root,'), dark: block('[data-color-mode="dark"] {') };

const named = (value) => value.match(/^var\((--ds-[\w-]+)\)$/)[1];
const resolved = (mode, token) => {
    const values = new Map([...palette, ...MODES[mode]]);
    return parseColor(resolveToken(token, values));
};

/** Chart text sits on the page, a card (both `--ds-surface`) or the tooltip's overlay. */
const GROUNDS = ['--ds-surface', '--ds-surface-overlay'];
const TEXT = ['text', 'textSubtle', 'textSubtlest'];

describe('chart text contrast', () => {
    for (const mode of Object.keys(MODES)) {
        for (const ground of GROUNDS) {
            for (const key of TEXT) {
                it(`${key} reads at 4.5:1 on ${ground} in ${mode}`, () => {
                    const bg = resolved(mode, ground);
                    const fg = composite(resolved(mode, named(CHROME[key])), bg);
                    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
                });
            }
        }
    }

    it('draws grid and axis lines with the border token', () => {
        expect(named(CHROME.grid)).toBe('--ds-border');
        expect(named(CHROME.axis)).toBe('--ds-border');
        for (const axis of [chartTheme.xAxis, chartTheme.yAxis]) {
            expect([axis.gridLineColor, axis.lineColor, axis.tickColor]).toEqual([CHROME.grid, CHROME.axis, CHROME.axis]);
        }
    });

    it('sets every theme text color from a semantic text token', () => {
        const inks = [
            chartTheme.chart.style.color, chartTheme.title.style.color, chartTheme.subtitle.style.color,
            chartTheme.xAxis.labels.style.color, chartTheme.yAxis.labels.style.color,
            chartTheme.xAxis.title.style.color, chartTheme.legend.itemStyle.color,
            chartTheme.legend.itemHoverStyle.color, chartTheme.tooltip.style.color,
        ];
        for (const ink of inks) expect(ink).toMatch(/^var\(--ds-text(-subtle|-subtlest)?\)$/);
    });
});

const collect = (dir) => readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return collect(path);
    return extname(entry) === '.jsx' && !entry.endsWith('.stories.jsx') ? [path] : [];
});

describe('chart sources', () => {
    it('never inks text with a fixed color or the Highcharts auto-contrast outline', () => {
        const bad = /color:\s*['"](black|white|#[0-9a-f]{3,8})['"]|textOutline:\s*['"][^'"]*contrast/i;
        const offenders = collect(__dirname).filter((p) => bad.test(readFileSync(p, 'utf8')));
        expect(offenders).toEqual([]);
    });
});
