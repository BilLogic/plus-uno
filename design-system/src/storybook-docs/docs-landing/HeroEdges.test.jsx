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
const tokenName = (cssVar) => cssVar.match(/var\((--[\w-]+)\)/)[1];

describe('the hero edge role', () => {
    it.each(['light', 'dark'])('reads against the hero ground in %s at 1.5:1 or more', (mode) => {
        const ground = resolveToken('--ds-surface-sunken', mode);
        const edge = resolveToken(tokenName(PAINT.illustrationEdge), mode);
        expect(contrast(over(edge, ground), ground.rgb)).toBeGreaterThanOrEqual(1.5);
    });
});

/**
 * The fills that need an edge on the ground: a layer or a page. Gray fills
 * (`countSurface`, `shape`) also mark things inside a layer, so the generic check
 * cannot tell them apart; the Indicators hero's chips on the ground are held by
 * name below. The sunken fills (`frameSunken`, `sectionSubtleSurface`) are the ground
 * itself, so they have no edge to show, and the Logo mark's tile is a gray that
 * already clears the ground. A new surface role goes in this list.
 */
const SURFACES = new Set(
    [
        'pageSurface',
        'cardSurface',
        'popupSurface',
        'sidebarOverlaySurface',
        'panelSurface',
        'flagSurface',
        'modalSurface',
        'dangerSurface',
    ].map((role) => PAINT[role]),
);
/** The stroke roles that count as an edge. Each one is held to the contrast check below. */
const EDGE_ROLES = ['illustrationEdge', 'accent', 'fieldBorder', 'fieldBorderInvalid', 'buttonDefaultBorder'];
const EDGES = new Set(EDGE_ROLES.map((role) => PAINT[role]));
const same = (a, b) => ['x', 'y', 'width', 'height'].every((k) => a.getAttribute(k) === b.getAttribute(k));
const fillOf = (el) => el.getAttribute('fill') || el.style.fill;

describe('every edge role reads against the hero ground', () => {
    it.each(EDGE_ROLES)('%s, in light and dark', (role) => {
        for (const mode of ['light', 'dark']) {
            const ground = resolveToken('--ds-surface-sunken', mode);
            expect(contrast(over(resolveToken(tokenName(PAINT[role]), mode), ground), ground.rgb), `${role} in ${mode}`).toBeGreaterThanOrEqual(1.5);
        }
    });
});

describe('every hero surface shows its edge', () => {
    it.each(Object.keys(HEROES))('%s', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        const bare = [];
        for (const el of container.querySelectorAll('rect,circle,path,ellipse')) {
            // The Logo mark's own parts: the white plus and grid on its tile.
            if (el.closest('[data-shape="logo-construction"]')) continue;
            if (SURFACES.has(fillOf(el)) && !EDGES.has(el.getAttribute('stroke') || el.style.stroke)) {
                bare.push(`${el.tagName} ${fillOf(el)}`);
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

describe('the Indicators hero chips on the ground show their edge', () => {
    it('every neutral count chip carries the edge', () => {
        const { container } = render(React.createElement(HEROES['patterns-notifications-and-indicators-indicators'].Hero));
        const chips = [...container.querySelectorAll('rect,circle')].filter((el) => fillOf(el) === PAINT.countSurface);
        expect(chips.length).toBeGreaterThan(0);
        for (const chip of chips) expect(chip.getAttribute('stroke')).toBe(PAINT.illustrationEdge);
    });
});
