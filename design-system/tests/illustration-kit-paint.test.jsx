// @vitest-environment node
/**
 * The illustration kit paints from roles, and each role is the token the real
 * component uses for that part. Two checks hold that:
 * - every fill, stroke, shadow and corner a primitive renders is a role in
 *   `paint.js`, never a borrowed or raw value;
 * - every role's token is still named by its source component's SCSS.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CORNER_TOKEN, HEIGHTS, PAINT, ROLE_SOURCES } from '../src/storybook-docs/illustrations/paint.js';
import * as primitives from '../src/storybook-docs/illustrations/primitives.jsx';
import * as compositions from '../src/storybook-docs/illustrations/compositions.jsx';

const SRC = resolve(__dirname, '../src');
const paints = new Set(Object.values(PAINT));
const corners = new Set(Object.values(CORNER_TOKEN));
const roleOf = (value) => Object.keys(PAINT).find((role) => PAINT[role] === value);

describe('every role names a token its source component uses', () => {
  for (const [role, { token, source }] of Object.entries(ROLE_SOURCES)) {
    if (!source) continue;
    it(role, () => {
      const scss = readFileSync(resolve(SRC, source), 'utf8');
      const named = new RegExp(`${token}(?![\\w-])`).test(scss);
      const name = role.startsWith('corner:') ? `CORNER.${role.slice(7)}` : `PAINT.${role}`;
      expect(named, `${source} no longer uses ${token}: update ${name} in illustrations/paint.js`).toBe(true);
    });
  }
});

/** A token's px value, followed through the scale files (`--a: var(--b)` or `Npx`). */
const scaleSrc = ['tokens/_scales.scss', 'tokens/ladder/_semantics.scss', 'tokens/ladder/_patterns.scss', 'tokens/ladder/_components.scss']
  .map((f) => readFileSync(resolve(SRC, f), 'utf8'))
  .join('\n');
const px = (token) => {
  const m = scaleSrc.match(new RegExp(`${token}:\\s*([^;]+);`));
  if (!m) throw new Error(`${token} not found in the token files`);
  const v = m[1].trim();
  const ref = v.match(/^var\((--[\w-]+)\)/);
  return ref ? px(ref[1]) : parseFloat(v);
};

describe('every drawn height is its token, halved', () => {
  for (const [role, [token, source, drawn]] of Object.entries(HEIGHTS)) {
    it(role, () => {
      expect(readFileSync(resolve(SRC, source), 'utf8')).toMatch(new RegExp(`${token}(?![\\w-])`));
      expect(drawn, `${role}: ${token} is ${px(token)}px, so the kit draws it ${px(token) / 2} high`).toBe(px(token) / 2);
    });
  }
  it('the primitives draw those heights', () => {
    const drawnH = (node, fill) => {
      const html = renderToStaticMarkup(<svg>{node}</svg>);
      return [...html.matchAll(new RegExp(`<rect[^>]*height="([\\d.]+)"[^>]*fill="${fill.replace(/[()]/g, '\\$&')}"`, 'g'))].map((m) => +m[1]);
    };
    expect(drawnH(<primitives.Field x={0} y={0} w={100} />, PAINT.fieldSurface)).toEqual([HEIGHTS.field[2]]);
    expect(drawnH(<primitives.ButtonShape x={0} y={0} w={40} label="Save" appearance="primary" />, PAINT.buttonPrimary)).toEqual([HEIGHTS.button[2]]);
    expect(drawnH(<primitives.CountTag x={0} y={0} />, PAINT.countSurface)).toEqual([HEIGHTS.count[2]]);
    expect(drawnH(<primitives.ProgressTracker x={0} y={0} w={120} />, PAINT.trackerCurrent)).toEqual([HEIGHTS.tracker[2]]);
    expect(drawnH(<primitives.Sidebar x={0} y={0} w={44} h={88} />, PAINT.sidebarSelected)).toEqual([HEIGHTS.sidebarRow[2]]);
    const tabs = renderToStaticMarkup(<svg><primitives.Tabs x={0} y={0} w={100} /></svg>);
    expect(tabs).toMatch(new RegExp(`y1="${HEIGHTS.tab[2]}"`));
  });
});

describe('no corner exceeds half its drawn height, except a full one', () => {
  const all = [
    ...Object.entries(primitives).filter(([n, C]) => typeof C === 'function' && !['Rect', 'Rule', 'pageBody', 'screenLayout'].includes(n)).map(([n, C]) => [n, <C x={4} y={4} w={100} h={60} />]),
    ['ResponsiveReflow', <compositions.ResponsiveReflow width={1280} />],
    ['ThreeLayers', <compositions.ThreeLayers />],
  ];
  for (const [name, node] of all) {
    it(name, () => {
      const html = renderToStaticMarkup(<svg>{node}</svg>);
      for (const [, attrs] of html.matchAll(/<rect([^>]*)>/g)) {
        const h = +(attrs.match(/height="([\d.]+)"/)?.[1] ?? NaN);
        const rx = attrs.match(/rx:\s*min\([^,]+,\s*([\d.]+)px\)/)?.[1];
        if (rx) expect(+rx, `${name}: a corner above half its ${h} height`).toBeLessThanOrEqual(h / 2);
      }
    });
  }
});

describe('every drawn paint resolves to a role', () => {
  const drawn = [
    ...Object.entries(primitives)
      // Rect and Rule are the helpers every primitive draws with, and the two layout helpers draw nothing.
      .filter(([name, C]) => typeof C === 'function' && !['Rect', 'Rule', 'pageBody', 'screenLayout'].includes(name))
      .flatMap(([name, C]) => [false, true].map((accent) => [`${name} accent=${accent}`, <C x={4} y={4} w={100} h={60} accent={accent} />])),
    ...Object.entries(compositions)
      .filter(([, C]) => typeof C === 'function')
      .map(([name, C]) => [name, name === 'ResponsiveReflow' ? <C width={1280} /> : <C />]),
  ];
  for (const [name, node] of drawn) {
    it(name, () => {
      const html = renderToStaticMarkup(<svg>{node}</svg>);
      const vars = [...html.matchAll(/var\((--[\w-]+)\)/g)].map((m) => `var(${m[1]})`);
      expect(vars.length, `${name} paints nothing`).toBeGreaterThan(0);
      for (const v of vars) {
        const structural = /^var\(--(stroke|border|radius|type|font-size)/.test(v) || /^var\(--[\w-]*radius/.test(v);
        if (structural) {
          // A corner or stroke width: a corner must be a component radius token.
          if (/radius/.test(v)) expect(corners.has(v), `${v} in ${name} is not a CORNER role token`).toBe(true);
          continue;
        }
        expect(paints.has(v), `${v} in ${name} is not a PAINT role`).toBe(true);
        expect(roleOf(v)).toBeTruthy();
      }
      // No raw color anywhere.
      expect(html).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
      for (const [, value] of html.matchAll(/\b(?:fill|stroke)="([^"]*)"/g)) {
        expect(value === 'none' || paints.has(value), `${value} in ${name}`).toBe(true);
      }
    });
  }
});
