// @vitest-environment node
/**
 * The node-side half of the tokens module.
 *
 * WHY NODE AND NOT JSDOM. `tokens-node.mjs` is the half that reads the disk, so
 * it imports `node:fs` on its first line and its sibling `tokens.test.js`
 * asserts that the browser half never does. This file's docblock switches the
 * environment for the same reason `story-contrast-agrees-with-checks.test.js`
 * does: the module under test resolves a repository root from
 * `import.meta.url`, and under jsdom that URL is an `http://` one.
 *
 * WHAT IS PINNED HERE. Three questions, one owner each:
 *
 *   the corpus   where tokens live, read once, aliases followed.
 *   the family   which family a token name belongs to.
 *   equality     whether two values are the same value.
 *
 * The third is the one with teeth. Two harness checks each carry their own
 * colour key, and they do not agree with `parseColour` in the browser half:
 * `check:docs-token-literals` accepts `#abcd`, `#aabbccdd` and `hsl()`, which
 * `parseColour` returns null for. A module that could not read those is a
 * module neither check can call, so the parity is asserted against the rival
 * implementations themselves rather than against a list somebody typed.
 */
import { describe, it, expect } from 'vitest';

import { colourKey as docsColourKey, dimensionKey as docsDimensionKey } from '../../scripts/check-docs-token-literals.mjs';
import { normaliseColour, normaliseDimension } from '../../scripts/token-fallbacks.mjs';
import { parseColour } from '../src/lib/tokens.mjs';
import {
  FAMILIES,
  TOKEN_DIR,
  colourKey,
  dimensionKey,
  familyOf,
  sameValue,
  tokenCorpus,
  tokenSources,
  valueKey,
} from '../src/lib/tokens-node.mjs';

describe('the corpus — where tokens live, answered once', () => {
  it('names the token directory as one repo-relative string', () => {
    expect(TOKEN_DIR).toBe('design-system/src/tokens');
  });

  it('reads the token stylesheets in a stable order, with their file names', () => {
    const sources = tokenSources();
    expect(sources.length).toBeGreaterThan(4);
    expect(sources.map((s) => s.file)).toEqual([...sources.map((s) => s.file)].sort());
    expect(sources.map((s) => s.file)).toContain('_colors.scss');
    for (const source of sources) {
      expect(source.path.startsWith(`${TOKEN_DIR}/`)).toBe(true);
      expect(source.text.length).toBeGreaterThan(0);
    }
  });

  it('carries the whole token table — the floor the checks assert for themselves', () => {
    const corpus = tokenCorpus();
    expect(corpus.size).toBeGreaterThan(400);
    for (const name of corpus.keys()) expect(name.startsWith('--')).toBe(true);
  });

  it('follows an alias to the literal at the end of it', () => {
    const corpus = tokenCorpus();
    // `--color-info` IS `var(--color-tertiary)` in `_colors.scss`.
    expect(corpus.get('--color-info').raw).toBe('var(--color-tertiary)');
    expect(corpus.get('--color-info').value).toBe(corpus.get('--color-tertiary').value);
    expect(corpus.get('--color-info').resolved).toBe(true);
  });

  it('records which file a token was defined in, and whether that file is the primitives', () => {
    const corpus = tokenCorpus();
    const entry = corpus.get('--color-tertiary');
    expect(entry.file).toBe('_colors.scss');
    expect(entry.primitive).toBe(false);
    expect([...corpus.values()].some((e) => e.primitive)).toBe(true);
  });

  it('narrows to a prefix when a caller asks for one', () => {
    const colours = tokenCorpus({ prefix: '--color-' });
    expect(colours.size).toBeGreaterThan(100);
    for (const name of colours.keys()) expect(name.startsWith('--color-')).toBe(true);
  });

  it('takes the first definition by default and the last on request', () => {
    // Both spellings exist in the tree — `readTokens` reads a single sheet and
    // wants the `:root` light value; the fallback checks read the cascade.
    const first = tokenCorpus();
    const last = tokenCorpus({ precedence: 'last' });
    expect(first.size).toBe(last.size);
    expect(() => tokenCorpus({ precedence: 'sometimes' })).toThrow();
  });
});

describe('the family map — one statement of which family a name is in', () => {
  it('reads the longest prefix, not the first that matches', () => {
    expect(familyOf('--font-size-body1')).toBe('font-size');
    expect(familyOf('--font-line-height-body1')).toBe('font-line-height');
    expect(familyOf('--font-weight-bold')).toBe('font-weight');
    expect(familyOf('--color-primary')).toBe('colour');
    expect(familyOf('--size-spacing-medium-space-300')).toBe('size');
  });

  it('answers null rather than guessing for a name in no family', () => {
    expect(familyOf('--table-cell-x')).toBe(null);
    expect(familyOf('not-a-token')).toBe(null);
    expect(familyOf(undefined)).toBe(null);
  });

  it('covers every token the design system actually defines', () => {
    const orphans = [...tokenCorpus().keys()].filter((name) => familyOf(name) === null);
    expect(orphans).toEqual([]);
  });

  it('declares each family once, with a prefix and a sentence', () => {
    const prefixes = FAMILIES.map((f) => f.prefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
    expect(new Set(FAMILIES.map((f) => f.family)).size).toBe(FAMILIES.length);
    for (const family of FAMILIES) {
      expect(family.prefix.startsWith('--')).toBe(true);
      expect(family.what.length).toBeGreaterThan(0);
    }
  });
});

describe('the colour key — every form the checks accept', () => {
  it('reads three-, four-, six- and eight-digit hex', () => {
    expect(colourKey('#abc')).toBe('#aabbcc');
    expect(colourKey('#AABBCC')).toBe('#aabbcc');
    expect(colourKey('#aabbccff')).toBe('#aabbcc');
    expect(colourKey('#abcd')).toBe(colourKey('#aabbccdd'));
    expect(colourKey('#aabbcc80')).toBe('#aabbcc80');
  });

  it('reads rgb() and rgba() in comma and space syntax', () => {
    expect(colourKey('rgb(4, 114, 168)')).toBe('#0472a8');
    expect(colourKey('rgb(4 114 168)')).toBe('#0472a8');
    expect(colourKey('rgba( 4 , 114 ,168, 1 )')).toBe('#0472a8');
    expect(colourKey('rgb(4 114 168 / 50%)')).toBe(colourKey('rgba(4,114,168,0.5)'));
    expect(colourKey('rgb(100%, 0%, 0%)')).toBe('#ff0000');
  });

  it('reads hsl() and hsla(), which `parseColour` cannot', () => {
    expect(parseColour('hsl(0, 100%, 50%)')).toBe(null);
    expect(colourKey('hsl(0, 100%, 50%)')).toBe('#ff0000');
    expect(colourKey('hsl(120deg 100% 25%)')).toBe('#008000');
    expect(colourKey('hsla(0, 0%, 0%, 0.5)')).toBe(colourKey('rgba(0,0,0,0.5)'));
  });

  it('keeps alpha in the key, because a half-transparent black is not black', () => {
    expect(colourKey('rgba(0,0,0,0.5)')).not.toBe(colourKey('#000000'));
  });

  it('answers null rather than guessing', () => {
    expect(colourKey('currentColor')).toBe(null);
    expect(colourKey('#ab')).toBe(null);
    expect(colourKey('rgb(300, 0, 0)')).toBe(null);
    expect(colourKey('var(--color-primary)')).toBe(null);
    expect(colourKey(undefined)).toBe(null);
  });

  /*
   * THE ASSERTION THE TICKET IS FOR. Not a list of forms someone remembered:
   * the two rival keys are imported and asked. Anything either of them reads,
   * this reads — that is the whole reason they could not call the module.
   */
  it('accepts every literal the rival implementations accept', () => {
    const literals = [
      '#abc',
      '#ABCD',
      '#aabbcc',
      '#aabbccdd',
      'rgb(4, 114, 168)',
      'rgb(4 114 168)',
      'rgba(0, 0, 0, .5)',
      'rgba(0,0,0,0.5)',
      'hsl(0, 100%, 50%)',
      'hsl(210 50% 40%)',
      'hsla(0, 0%, 0%, 0.5)',
      '#0472a8',
    ];
    for (const literal of literals) {
      const rivals = [docsColourKey(literal), normaliseColour(literal)];
      if (rivals.every((key) => key === null)) continue;
      expect(colourKey(literal), `${literal} is read by a rival and not by the module`).not.toBe(null);
    }
  });

  it('agrees with the browser half wherever the browser half has an answer', () => {
    for (const literal of ['#abc', '#0472a8', 'rgb(4, 114, 168)', 'rgba(4,114,168,1)']) {
      expect(colourKey(literal)).toBe(normaliseColour(literal));
    }
  });
});

describe('the dimension key — one normaliser, rem at 16px', () => {
  it('normalises px, rem and zero, and keeps a percentage a percentage', () => {
    expect(dimensionKey('16px')).toBe('16px');
    expect(dimensionKey('1rem')).toBe('16px');
    expect(dimensionKey(' 0.75REM ')).toBe('12px');
    expect(dimensionKey('50%')).toBe('50%');
    expect(dimensionKey('0')).toBe('0px');
    expect(dimensionKey('-1px')).toBe('-1px');
  });

  it('refuses what it cannot compare', () => {
    // `em` is relative to the element's own font size, and `1.5` on a
    // line-height is a ratio rather than a length.
    expect(dimensionKey('1em')).toBe(null);
    expect(dimensionKey('1.5')).toBe(null);
    expect(dimensionKey('clamp(2.5rem, 5vw, 4rem)')).toBe(null);
    expect(dimensionKey(undefined)).toBe(null);
  });

  it('accepts every literal the rival implementations accept', () => {
    const literals = ['16px', '1rem', '0.75rem', '50%', '100%', '0', '0px', '-1px', '1.5', '1em'];
    for (const literal of literals) {
      const rivals = [docsDimensionKey(literal), normaliseDimension(literal)];
      if (rivals.every((key) => key === null)) continue;
      expect(dimensionKey(literal), `${literal} is read by a rival and not by the module`).not.toBe(null);
      for (const rival of rivals) {
        if (rival !== null) expect(dimensionKey(literal)).toBe(rival);
      }
    }
  });
});

describe('one answer to "are these two values the same"', () => {
  it('keys a value by whichever kind it is', () => {
    expect(valueKey('#abc')).toBe('#aabbcc');
    expect(valueKey('1rem')).toBe('16px');
    expect(valueKey('Lato, sans-serif')).toBe(null);
  });

  it('is the same answer for both kinds', () => {
    expect(sameValue('#abc', 'rgb(170, 187, 204)')).toBe(true);
    expect(sameValue('1rem', '16px')).toBe(true);
    expect(sameValue('999px', '50%')).toBe(false);
    expect(sameValue('#abc', '16px')).toBe(false);
  });

  it('says no rather than yes when it cannot read either side', () => {
    // Two values it cannot key are not thereby equal: `inherit` and
    // `currentColor` are both unreadable and plainly different.
    expect(sameValue('inherit', 'currentColor')).toBe(false);
    expect(sameValue('inherit', 'inherit')).toBe(false);
  });
});
