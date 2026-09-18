/**
 * The design system's tokens module (#506).
 *
 * WHY THESE TESTS LIVE HERE AND NOT IN `scripts/`. The maths they exercise used
 * to sit in `scripts/button-contrast.mjs`, which imports `node:fs` at the top
 * and so cannot be imported by a Vite/Storybook story. The maths moved to
 * `design-system/src/lib/tokens.mjs`; its tests moved with it, into the only
 * test command the repo has (`npm test` → `npm --prefix design-system test`),
 * beside `component-tabs-contract.test.js`, which uses the same arrangement.
 *
 * The check-shaped tests — the Button theme map, the stylesheet walk, the
 * rendered NEW/ROSE/STALE lines — stayed in `scripts/*.test.mjs`, because that
 * is where those things stayed. So did the RATCHET's, which lived here between
 * #506 and #599 and now live in `scripts/lib/ratchet.test.mjs`: a baseline
 * record is a harness concern, and its tests belong beside the module that
 * reads it rather than beside the colour maths.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, it, expect } from 'vitest';

import {
  TOKEN_NAME_TAIL,
  composite,
  contrast,
  luminance,
  parseColour,
  readTokens,
  resolveToken,
  toHex,
  tokenDeclarationPattern,
  varReferencePattern,
} from '../src/lib/tokens.mjs';

/*
 * Resolved off the Vitest root (the `design-system` package) rather than off
 * `import.meta.url`: under jsdom that URL is an `http://` one and
 * `fileURLToPath` refuses it.
 */
const MODULE_PATH = resolve('src/lib/tokens.mjs');

/*
 * THE POINT OF THIS MODULE IS THAT A STORY CAN IMPORT IT. A story runs through
 * Vite in a browser, where `node:fs`, `process`, `__dirname` and `require` do
 * not exist. Under Vitest the test runs in Node, so importing a module that
 * reaches for `node:fs` would succeed here and fail in the browser — which is
 * exactly the failure this file has to catch. So the import is asserted AND the
 * source is read: a static scan is the only thing that can see the difference.
 */
describe('the module is importable from a browser bundle', () => {
  it('imports and works with no Node globals in scope', async () => {
    const tokens = await import('../src/lib/tokens.mjs');
    expect(typeof tokens.contrast).toBe('function');
    expect(tokens.contrast({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBe(21);
  });

  it('imports nothing Node-only and touches no Node global', () => {
    const source = readFileSync(MODULE_PATH, 'utf8');
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

    expect(code).not.toMatch(/from\s+['"]node:/);
    expect(code).not.toMatch(/require\s*\(/);
    for (const global of ['process', '__dirname', '__filename', 'Buffer']) {
      expect(code, `${global} must not appear in tokens.mjs`).not.toMatch(
        new RegExp(`\\b${global}\\b`),
      );
    }
  });
});

describe('the token grammar', () => {
  it('names a token as `--` plus lowercase letters, digits and hyphens', () => {
    const tail = new RegExp(`^--${TOKEN_NAME_TAIL}$`);
    expect(tail.test('--color-primary')).toBe(true);
    expect(tail.test('--color-primary-state-08')).toBe(true);
    expect(tail.test('--Color-Primary')).toBe(false);
    expect(tail.test('--color_primary')).toBe(false);
    expect(tail.test('--')).toBe(false);
  });

  it('builds a declaration pattern scoped to a prefix', () => {
    const source = ':root { --color-primary: #123456; --space-2: 8px; }';
    const colours = [...source.matchAll(tokenDeclarationPattern('--color-'))].map((m) => m[1]);
    expect(colours).toEqual(['--color-primary']);
    const all = [...source.matchAll(tokenDeclarationPattern())].map((m) => m[1]);
    expect(all).toEqual(['--color-primary', '--space-2']);
  });

  it('builds a var() reference pattern that reads the token out of a fallback', () => {
    const found = [...'color: var(--color-warning, #9f8205);'.matchAll(varReferencePattern())];
    expect(found.map((m) => m[1])).toEqual(['--color-warning']);
  });
});

describe('readTokens', () => {
  it('takes the first definition and ignores the rest', () => {
    const values = readTokens(
      ':root { --color-primary: #123456; }\n.dark { --color-primary: #abcdef; }',
      { prefix: '--color-' },
    );
    expect(values.get('--color-primary')).toBe('#123456');
  });

  it('reads every token when no prefix narrows it', () => {
    const values = readTokens(':root { --color-primary: #123456; --radius-sm: 4px; }');
    expect([...values.keys()]).toEqual(['--color-primary', '--radius-sm']);
  });
});

describe('resolveToken', () => {
  it('follows an alias to the literal behind it', () => {
    const values = new Map([
      ['--color-tertiary', '#0e8175'],
      ['--color-info', 'var(--color-tertiary)'],
    ]);
    expect(resolveToken('--color-info', values)).toBe('#0e8175');
  });

  it('follows an alias written with a fallback', () => {
    const values = new Map([
      ['--color-tertiary', '#0e8175'],
      ['--color-info', 'var(--color-tertiary, #000000)'],
    ]);
    expect(resolveToken('--color-info', values)).toBe('#0e8175');
  });

  it('terminates on a cycle rather than hanging', () => {
    const values = new Map([['--a', 'var(--b)'], ['--b', 'var(--a)']]);
    expect(resolveToken('--a', values)).toBe(undefined);
  });

  it('returns undefined for a token nothing defines', () => {
    expect(resolveToken('--nope', new Map())).toBe(undefined);
  });
});

describe('parseColour', () => {
  it('reads the three shapes the token file uses', () => {
    expect(parseColour('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColour('#9f8205')).toEqual({ r: 159, g: 130, b: 5, a: 1 });
    expect(parseColour('rgba(113, 92, 0, 0.08)')).toEqual({ r: 113, g: 92, b: 0, a: 0.08 });
  });

  it('returns null rather than a guess', () => {
    expect(parseColour('currentColor')).toBe(null);
    expect(parseColour('var(--color-primary)')).toBe(null);
    expect(parseColour('rgb(300, 0, 0)')).toBe(null);
    expect(parseColour('rgba(0, 0, 0, 4)')).toBe(null);
    expect(parseColour(undefined)).toBe(null);
  });
});

describe('the contrast maths', () => {
  it('lays an alpha colour over an opaque one', () => {
    expect(composite({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 })).toEqual({
      r: 128, g: 128, b: 128, a: 1,
    });
  });

  it('is the arithmetic that stops an 8% state layer being read as solid', () => {
    const page = { r: 249, g: 249, b: 252, a: 1 };
    const layer = parseColour('rgba(113, 92, 0, 0.08)');
    const label = parseColour('#5b4a00');

    expect(contrast(label, composite(layer, page))).toBeGreaterThan(4.5);
    expect(contrast(label, { ...layer, a: 1 })).toBeLessThan(2);
  });

  it('matches the values WCAG gives for the extremes', () => {
    expect(contrast({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBe(21);
    expect(contrast({ r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 })).toBe(1);
  });

  it('gives WCAG relative luminance for black and white', () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(luminance({ r: 255, g: 255, b: 255 })).toBe(1);
  });

  it('round-trips a parsed colour through toHex', () => {
    expect(toHex(parseColour('#9f8205'))).toBe('#9f8205');
  });
});
