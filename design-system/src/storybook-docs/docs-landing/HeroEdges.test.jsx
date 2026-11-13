import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PAINT } from '../illustrations/paint.js';
import { HEROES } from './hero-registry.jsx';

/**
 * A surface shape on the hero ground always shows its edge. The ground is
 * `--ds-surface-sunken`; a surface-filled shape must carry a hairline in the
 * kit's edge role, and that role's token must read against the ground at
 * 1.5:1 or more in light and dark (computed from the generated token values).
 */

const TOKENS = resolve(__dirname, '../../tokens/color');
const palette = readFileSync(resolve(TOKENS, '_palette.scss'), 'utf8');
const semantic = readFileSync(resolve(TOKENS, '_semantic.scss'), 'utf8');

/** The first block of a mode in _semantic.scss (its base, not the contrast variants). */
const block = (opener) => {
    const start = semantic.indexOf(opener);
    return semantic.slice(start, semantic.indexOf('\n}\n', start));
};
const MODES = { light: block(':root,\n[data-color-mode="light"] {'), dark: block('[data-color-mode="dark"] {') };

const parse = (v) => {
    const hex = v.match(/^#([0-9a-f]{6})$/i);
    if (hex) return { rgb: [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)), a: 1 };
    const rgba = v.match(/^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/);
    if (rgba) return { rgb: [+rgba[1], +rgba[2], +rgba[3]], a: rgba[4] === undefined ? 1 : +rgba[4] };
    throw new Error(`unparsed color ${v}`);
};
const resolveToken = (name, mode) => {
    const m = (MODES[mode].match(new RegExp(`${name}:\\s*([^;]+);`)) ?? palette.match(new RegExp(`${name}:\\s*([^;]+);`)));
    if (!m) throw new Error(`${name} not found`);
    const ref = m[1].trim().match(/^var\((--[\w-]+)\)$/);
    return ref ? resolveToken(ref[1], mode) : parse(m[1].trim());
};
const over = (top, ground) => top.rgb.map((c, i) => c * top.a + ground.rgb[i] * (1 - top.a));
const lum = (rgb) => {
    const [r, g, b] = rgb.map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};
const name = (cssVar) => cssVar.match(/var\((--[\w-]+)\)/)[1];

describe('the hero edge role', () => {
    it.each(['light', 'dark'])('reads against the hero ground in %s at 1.5:1 or more', (mode) => {
        const ground = resolveToken('--ds-surface-sunken', mode);
        const edge = resolveToken(name(PAINT.illustrationEdge), mode);
        expect(contrast(over(edge, ground), ground.rgb)).toBeGreaterThanOrEqual(1.5);
    });
});

/**
 * Fills that are a layer or page, not a mark on one. The sunken fills (`frameSunken`,
 * `sectionSubtleSurface`) are the hero ground itself, so they have no edge to show,
 * and the Logo mark's tile is a gray that already clears the ground.
 */
const SURFACES = new Set(
    ['pageSurface', 'cardSurface', 'popupSurface', 'sidebarOverlaySurface', 'panelSurface', 'flagSurface', 'modalSurface', 'dangerSurface'].map((r) => PAINT[r]),
);
/** Every stroke role that itself reads on the ground, light and dark: derived, not listed. */
const EDGES = new Set(
    Object.values(PAINT).filter((value) => {
        if (!/^var\(--ds-/.test(value)) return false;
        try {
            return ['light', 'dark'].every((mode) => {
                const ground = resolveToken('--ds-surface-sunken', mode);
                return contrast(over(resolveToken(name(value), mode), ground), ground.rgb) >= 1.5;
            });
        } catch {
            return false;
        }
    }),
);
const same = (a, b) => ['x', 'y', 'width', 'height'].every((k) => a.getAttribute(k) === b.getAttribute(k));

describe('every hero surface shows its edge', () => {
    it.each(Object.keys(HEROES))('%s', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        const bare = [];
        for (const el of container.querySelectorAll('rect,circle,path,ellipse')) {
            // The Logo mark's own parts: the white plus and grid on its tile.
            if (el.closest('[data-shape="logo-construction"]')) continue;
            if (SURFACES.has(el.getAttribute('fill')) && !EDGES.has(el.getAttribute('stroke'))) {
                bare.push(`${el.tagName} ${el.getAttribute('fill')}`);
            }
        }
        for (const fo of container.querySelectorAll('foreignObject')) {
            const fill = fo.firstElementChild?.style.background;
            const next = fo.nextElementSibling;
            const edged = next?.tagName === 'rect' && same(fo, next) && EDGES.has(next.getAttribute('stroke'));
            if (fill && !edged) bare.push(`layer ${fill}`);
        }
        expect(bare).toEqual([]);
    });
});
