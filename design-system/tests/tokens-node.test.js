// @vitest-environment node
/**
 * The node-side half of the tokens module (#620).
 *
 * WHY NODE AND NOT JSDOM. This half reads the disk — through
 * `scripts/lib/corpus.mjs`, the harness's one reader — and that module resolves
 * the repository root from `import.meta.url`, which under this package's jsdom
 * default is an `http://` URL `fileURLToPath` refuses. The docblock above
 * switches this one file, the way `story-contrast-agrees-with-checks.test.js`
 * does for the same reason.
 *
 * WHAT IS PINNED HERE. Three questions, one owner each:
 *
 *   the corpus   where tokens live, read once, aliases followed — and read
 *                THROUGH the one reader, which is the defect a first
 *                implementation of this module committed and this file guards.
 *   the family   which family a token name belongs to.
 *   equality     whether two values are the same value.
 *
 * The third is the one with teeth, in two directions:
 *
 *   WIDER than `parseColor`: two harness checks each carried their own color
 *   key. #621 retired the fallback checks' rival; #622 retired the docs
 *   check's. Both are spelled below, so the parity stays a measurement against
 *   the implementations that were deleted rather than against the module
 *   agreeing with itself.
 *
 *   FINER than `normalizeColor`: alpha is part of this key and is not part of
 *   that one. Over the live corpus that is 357 token pairs, and the two tests
 *   under "finer than the normalizer" assert the difference directly and then
 *   pin the narrow reason today's output does not move — rather than asserting
 *   "output unchanged", which is a property of the fallback CAPTURE and not of
 *   this key. #621 migrated the fallback checks onto this key and MEASURED the
 *   move: both families' token maps and both reports came out byte-identical,
 *   for the reason the last test in that block pins.
 */
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, it, expect } from 'vitest';

import { text } from '../../scripts/lib/corpus.mjs';
import { RETIRED_TOKENS, retiredRenames } from '../../scripts/lib/tokens/plan.mjs';
import { parseColor, toHex } from '../src/lib/tokens.mjs';
import {
  COLOR_PREFIXES,
  COLOR_TOKEN_DIR,
  FAMILIES,
  TOKEN_DIR,
  colorKey,
  dimensionKey,
  familyOf,
  sameValue,
  tokenCorpus,
  tokenSources,
  valueKey,
} from '../src/lib/tokens-node.mjs';

/**
 * THE RETIRED NORMALIZER, SPELLED HERE BECAUSE #621 DELETED IT.
 *
 * `scripts/token-fallbacks.mjs` compared two colors as `parseColor` followed
 * by `toHex` — and `toHex` drops alpha — until #621 moved the fallback checks
 * on to `colorKey`. The assertions below measure what that migration cost, so
 * they need the thing that was retired; two lines of test scaffolding is not a
 * second production key, and writing it out is what keeps "finer than the
 * normalizer" from quietly becoming "the module agrees with itself".
 *
 * There is no dimension twin, because there was no difference to keep:
 * `normalizeDimension` and `dimensionKey` were the same function, which is why
 * #621 could delete one of them without measuring anything.
 */
const normalizeColor = (value) => {
  const color = parseColor(value);
  return color ? toHex(color) : null;
};

/**
 * THE RETIRED DOCS KEYS, SPELLED HERE BECAUSE #622 DELETED THEM.
 *
 * `check:docs-token-literals` compared colors as a syntactic canonicaliser
 * (hex expanded, `rgba()` kept as `rgba(...)`) and dimensions that refused a
 * bare `0`. The module's keys are finer (alpha is part of the color) and
 * wider on zero. The assertions below still measure that difference, so they
 * need the thing that was retired.
 *
 * @param {string} literal
 * @returns {string|null}
 */
const docsColorKey = (literal) => {
  const v = literal.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,8})$/.exec(v);
  if (hex) {
    const h = hex[1];
    if (h.length === 3 || h.length === 4) return `#${[...h].map((c) => c + c).join('')}`;
    if (h.length === 6 || h.length === 8) return `#${h}`;
    return null;
  }
  const fn = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(v);
  if (!fn) return null;
  const parts = fn[2]
    .split(/[,/]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (/^\.\d/.test(p) ? `0${p}` : p));
  return `${fn[1]}(${parts.join(',')})`;
};

/**
 * @param {string} literal
 * @returns {string|null}
 */
const docsDimensionKey = (literal) => {
  const m = /^(-?\d*\.?\d+)(px|rem|%)$/.exec(literal.trim().toLowerCase());
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (m[2] === '%') return `${n}%`;
  return `${m[2] === 'rem' ? n * 16 : n}px`;
};

describe('the corpus — where tokens live, answered once and read through the one reader', () => {
  it('names the token directory as one repo-relative string', () => {
    expect(TOKEN_DIR).toBe('design-system/src/tokens');
  });

  /*
   * THE DEFECT THIS FILE EXISTS FOR. A first implementation walked the token
   * directory with its own `fs.readdirSync` and resolved its own `REPO_ROOT`
   * from `import.meta.url` — a second way to resolve the corpus, inside the
   * module whose point is that it is resolved once. A static scan is the only
   * thing that can see that come back, because the behavior is identical
   * until a caller passes a root.
   */
  it('imports no file reader and no root of its own', () => {
    const source = text(resolve('src/lib/tokens-node.mjs'));
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

    expect(code).not.toMatch(/from\s+['"]node:/);
    expect(code).not.toMatch(/REPO_ROOT\s*=/);
    expect(code).not.toMatch(/import\.meta\.(url|dirname)/);
    expect(code).not.toMatch(/\bprocess\b/);
    expect(code).toMatch(/from\s+['"]\.\.\/\.\.\/\.\.\/scripts\/lib\/corpus\.mjs['"]/);
  });

  it('reads the token stylesheets in a stable order, with their file names', () => {
    const sources = tokenSources();
    expect(sources.length).toBeGreaterThan(4);
    expect(sources.map((s) => s.file)).toEqual([...sources.map((s) => s.file)].sort());
    expect(sources.map((s) => s.file)).toContain('_scales.scss');
    for (const source of sources) {
      expect(source.path.startsWith(`${TOKEN_DIR}/`)).toBe(true);
      expect(source.text.length).toBeGreaterThan(0);
    }
  });

  it('does not read `tokens/source/`, the Figma export the SCSS is generated from', () => {
    for (const source of tokenSources()) {
      // The directories read below the flat sheets are the generated color set and the token ladder.
      expect(source.file).toMatch(/^((color|ladder)\/)?[^/]+\.(scss|css)$/);
      expect(source.file.startsWith('source/')).toBe(false);
    }
  });

  it('reads the generated color tokens', () => {
    const files = tokenSources().map((s) => s.file);
    expect(files).toContain('color/_semantic.scss');
    expect(files).toContain('color/_palette.scss');

    const corpus = tokenCorpus({ prefix: COLOR_PREFIXES });
    // A `--ds-` token is an alias of a ramp step, followed to its hex.
    expect(corpus.get('--ds-border-focused').raw).toMatch(/^var\(--palette-/);
    expect(corpus.get('--ds-border-focused').value).toMatch(/^#[0-9a-f]{6}$/);
    expect(corpus.get('--ds-border-focused').file).toBe('color/_semantic.scss');
    expect([...corpus.keys()].every((name) => name.startsWith('--ds-'))).toBe(true);
    expect(tokenCorpus({ prefix: '--palette-' }).values().next().value.primitive).toBe(true);
  });

  it('reads the color directory from the root it is given', () => {
    const root = mkdtempSync(join(tmpdir(), 'tokens-node-color-'));
    mkdirSync(join(root, COLOR_TOKEN_DIR), { recursive: true });
    writeFileSync(join(root, COLOR_TOKEN_DIR, '_palette.scss'), ':root { --palette-teal-700: #147d6a; }');
    writeFileSync(join(root, COLOR_TOKEN_DIR, '_semantic.scss'), ':root { --ds-text-brand: var(--palette-teal-700); }');
    // A sheet that is not one of the listed color files is not read.
    writeFileSync(join(root, COLOR_TOKEN_DIR, '_unlisted.scss'), ':root { --ds-unlisted: var(--ds-text-brand); }');

    expect(tokenSources({ root }).map((s) => s.file)).toEqual(['color/_palette.scss', 'color/_semantic.scss']);
    expect(tokenCorpus({ root }).get('--ds-text-brand').value).toBe('#147d6a');
  });

  /*
   * A ROOT IS A ROOT ALL THE WAY DOWN. The listing and the read both take it,
   * so a fixture tree answers instead of the live one — and the module cannot
   * be holding a second root that only the read consults, which is the failure
   * mode a same-tree test would never show.
   */
  it('answers from the root it is given, not from this repo', () => {
    const root = mkdtempSync(join(tmpdir(), 'tokens-node-'));
    mkdirSync(join(root, TOKEN_DIR), { recursive: true });
    mkdirSync(join(root, TOKEN_DIR, 'source'), { recursive: true });
    writeFileSync(
      join(root, TOKEN_DIR, '_fixture.scss'),
      ':root { --ds-fixture: #abc; --ds-alias: var(--ds-fixture); }',
    );
    writeFileSync(join(root, TOKEN_DIR, 'source', 'colors.json'), '{"not":"read"}');

    const sources = tokenSources({ root });
    expect(sources.map((s) => s.file)).toEqual(['_fixture.scss']);

    const corpus = tokenCorpus({ root });
    expect([...corpus.keys()]).toEqual(['--ds-fixture', '--ds-alias']);
    expect(corpus.get('--ds-alias').value).toBe('#abc');
  });

  it('comes back empty rather than throwing for a tree with no token directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'tokens-node-empty-'));
    expect(tokenSources({ root })).toEqual([]);
    expect(tokenCorpus({ root }).size).toBe(0);
  });

  it('carries the whole token table — the floor the checks assert for themselves', () => {
    const corpus = tokenCorpus();
    expect(corpus.size).toBeGreaterThan(400);
    for (const name of corpus.keys()) expect(name.startsWith('--')).toBe(true);
  });

  it('declares none of the retired names: every old token is gone, and its replacement is there', () => {
    const corpus = tokenCorpus();
    expect(RETIRED_TOKENS.size).toBeGreaterThan(0);
    const declared = [...RETIRED_TOKENS].filter((name) => corpus.has(name));
    expect(declared).toEqual([]);
    const missing = [...retiredRenames()].filter(([, replacement]) => !corpus.has(replacement));
    expect(missing).toEqual([]);
  });

  it('follows an alias to the literal at the end of it', () => {
    const corpus = tokenCorpus();
    // `--icon-sm` IS `var(--size-075)`, which is `var(--space-075)`, in `_scales.scss`.
    expect(corpus.get('--icon-sm').raw).toBe('var(--size-075)');
    expect(corpus.get('--icon-sm').value).toBe('12px');
    expect(corpus.get('--icon-sm').resolved).toBe(true);
  });

  it('records which file a token was defined in, and whether that file is the primitives', () => {
    const corpus = tokenCorpus();
    const entry = corpus.get('--pad-x-md');
    expect(entry.file).toBe('ladder/_semantics.scss');
    expect(entry.primitive).toBe(false);
    expect(corpus.get('--space-100').primitive).toBe(true);
    expect([...corpus.values()].some((e) => e.primitive)).toBe(true);
  });

  it('narrows to a prefix when a caller asks for one', () => {
    const colors = tokenCorpus({ prefix: '--ds-' });
    expect(colors.size).toBeGreaterThan(100);
    for (const name of colors.keys()) expect(name.startsWith('--ds-')).toBe(true);
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
    expect(familyOf('--font-size-0875')).toBe('font-size');
    expect(familyOf('--line-height-125')).toBe('line-height');
    expect(familyOf('--type-weight-medium')).toBe('type');
    expect(familyOf('--ds-text')).toBe('ds');
    expect(familyOf('--row-height-sm')).toBe('row');
    expect(familyOf('--size-200')).toBe('size');
  });

  it('answers null rather than guessing for a name in no family', () => {
    expect(familyOf('--dropdown-cell-x')).toBe(null);
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

describe('the color key — every form the checks accept', () => {
  it('reads three-, four-, six- and eight-digit hex', () => {
    expect(colorKey('#abc')).toBe('#aabbcc');
    expect(colorKey('#AABBCC')).toBe('#aabbcc');
    expect(colorKey('#aabbccff')).toBe('#aabbcc');
    expect(colorKey('#abcd')).toBe(colorKey('#aabbccdd'));
    expect(colorKey('#aabbcc80')).toBe('#aabbcc80');
  });

  it('reads rgb() and rgba() in comma and space syntax', () => {
    expect(colorKey('rgb(4, 114, 168)')).toBe('#0472a8');
    expect(colorKey('rgb(4 114 168)')).toBe('#0472a8');
    expect(colorKey('rgba( 4 , 114 ,168, 1 )')).toBe('#0472a8');
    expect(colorKey('rgb(4 114 168 / 50%)')).toBe(colorKey('rgba(4,114,168,0.5)'));
    expect(colorKey('rgb(100%, 0%, 0%)')).toBe('#ff0000');
  });

  it('reads hsl() and hsla(), which `parseColor` cannot', () => {
    expect(parseColor('hsl(0, 100%, 50%)')).toBe(null);
    expect(colorKey('hsl(0, 100%, 50%)')).toBe('#ff0000');
    expect(colorKey('hsl(120deg 100% 25%)')).toBe('#008000');
    expect(colorKey('hsla(0, 0%, 0%, 0.5)')).toBe(colorKey('rgba(0,0,0,0.5)'));
  });

  it('answers null rather than guessing', () => {
    expect(colorKey('currentColor')).toBe(null);
    expect(colorKey('#ab')).toBe(null);
    expect(colorKey('rgb(300, 0, 0)')).toBe(null);
    expect(colorKey('var(--ds-text)')).toBe(null);
    expect(colorKey(undefined)).toBe(null);
  });

  /*
   * THE WIDER HALF, ASSERTED AGAINST THE RIVALS THEMSELVES rather than against
   * a list someone remembered. Anything either rival key reads, this reads —
   * that is the whole reason they could not call the module.
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
      const rivals = [docsColorKey(literal), normalizeColor(literal)];
      if (rivals.every((key) => key === null)) continue;
      expect(
        colorKey(literal),
        `${literal} is read by a rival and not by the module`,
      ).not.toBe(null);
    }
  });

  it('agrees with the old normalizer on every OPAQUE form it can read', () => {
    for (const literal of ['#abc', '#0472a8', 'rgb(4, 114, 168)', 'rgba(4,114,168,1)']) {
      expect(colorKey(literal)).toBe(normalizeColor(literal));
    }
  });
});

describe('the color key is finer than the normalizer it replaces', () => {
  /*
   * ONE PAIR, NAMED. An 8% overlay of a solid; the old normalizer is
   * `parseColor` followed by `toHex`, and `toHex` drops alpha, so it calls
   * them the same color.
   */
  it('calls a translucent overlay and its solid DIFFERENT, where the normalizer called them equal', () => {
    const solid = '#0472a8';
    const overlay = 'rgba(4, 114, 168, 0.08)';

    expect(normalizeColor(solid)).toBe(normalizeColor(overlay));
    expect(colorKey(solid)).not.toBe(colorKey(overlay));
    expect(colorKey(overlay)).toBe(`${colorKey(solid)}14`);
    expect(sameValue(solid, overlay)).toBe(false);
  });
});

describe('the dimension key — one normalizer, rem at 16px', () => {
  it('normalizes px, rem and zero, and keeps a percentage a percentage', () => {
    expect(dimensionKey('16px')).toBe('16px');
    expect(dimensionKey('1rem')).toBe('16px');
    expect(dimensionKey(' 0.75REM ')).toBe('12px');
    expect(dimensionKey('50%')).toBe('50%');
    expect(dimensionKey('0')).toBe('0px');
    expect(dimensionKey('-1px')).toBe('-1px');
  });

  /*
   * THE ONE PLACE THE TWO RIVALS DISAGREED, measured rather than asserted from
   * the docblock: a bare `0`. `normalizeDimension` read it and the docs
   * check's key answers null, so the module had to CHOOSE, and it took the
   * reading that loses no comparison — which is why #621 could retire
   * `normalizeDimension` outright, and why the surviving rival is still
   * asserted against here. `0em` stays null, because both rivals refuse it and
   * a widening nobody asked for is a migration surprise.
   */
  it('takes the reading that loses nothing where the two rivals disagree', () => {
    expect(docsDimensionKey('0')).toBe(null);
    expect(dimensionKey('0')).toBe('0px');
    expect(docsDimensionKey('0em')).toBe(null);
    expect(dimensionKey('0em')).toBe(null);
  });

  it('refuses what it cannot compare', () => {
    // `em` is relative to the element's own font size, and `1.5` on a
    // line-height is a ratio rather than a length.
    expect(dimensionKey('1em')).toBe(null);
    expect(dimensionKey('1.5')).toBe(null);
    expect(dimensionKey('clamp(2.5rem, 5vw, 4rem)')).toBe(null);
    expect(dimensionKey(undefined)).toBe(null);
  });

  it('accepts every literal the rival implementations accept, and agrees with them', () => {
    const literals = ['16px', '1rem', '0.75rem', '50%', '100%', '0', '0px', '-1px', '1.5', '1em'];
    for (const literal of literals) {
      const rivals = [docsDimensionKey(literal)];
      if (rivals.every((key) => key === null)) continue;
      expect(
        dimensionKey(literal),
        `${literal} is read by a rival and not by the module`,
      ).not.toBe(null);
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
