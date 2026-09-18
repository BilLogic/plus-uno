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
 *   WIDER than `parseColour`: two harness checks each carried their own colour
 *   key, and `check:docs-token-literals`' accepts `#abcd`, `#aabbccdd` and
 *   `hsl()`, which `parseColour` returns null for. A module that could not
 *   read those is a module neither check can call, so the parity is asserted
 *   against the rival implementations themselves rather than against a list
 *   somebody typed. #621 retired the fallback checks' rival; the docs check's
 *   is still live, so it is still imported here, and the retired one is
 *   spelled below.
 *
 *   FINER than `normaliseColour`: alpha is part of this key and is not part of
 *   that one. Over the live corpus that is 315 token pairs, and the two tests
 *   under "finer than the normaliser" assert the difference directly and then
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

import {
  colourKey as docsColourKey,
  dimensionKey as docsDimensionKey,
} from '../../scripts/check-docs-token-literals.mjs';
import { documents, text } from '../../scripts/lib/corpus.mjs';
import { fallbackUsages } from '../../scripts/token-fallbacks.mjs';
import { parseColour, toHex } from '../src/lib/tokens.mjs';
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

/**
 * THE RETIRED NORMALISER, SPELLED HERE BECAUSE #621 DELETED IT.
 *
 * `scripts/token-fallbacks.mjs` compared two colours as `parseColour` followed
 * by `toHex` — and `toHex` drops alpha — until #621 moved the fallback checks
 * on to `colourKey`. The assertions below measure what that migration cost, so
 * they need the thing that was retired; two lines of test scaffolding is not a
 * second production key, and writing it out is what keeps "finer than the
 * normaliser" from quietly becoming "the module agrees with itself".
 *
 * There is no dimension twin, because there was no difference to keep:
 * `normaliseDimension` and `dimensionKey` were the same function, which is why
 * #621 could delete one of them without measuring anything.
 */
const normaliseColour = (value) => {
  const colour = parseColour(value);
  return colour ? toHex(colour) : null;
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
   * thing that can see that come back, because the behaviour is identical
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
    expect(sources.map((s) => s.file)).toContain('_colors.scss');
    for (const source of sources) {
      expect(source.path.startsWith(`${TOKEN_DIR}/`)).toBe(true);
      expect(source.text.length).toBeGreaterThan(0);
    }
  });

  it('does not read `tokens/source/`, the Figma export the SCSS is generated from', () => {
    for (const source of tokenSources()) {
      expect(source.file).not.toMatch(/\//);
      expect(source.file).toMatch(/\.(scss|css)$/);
    }
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
      ':root { --color-fixture: #abc; --color-alias: var(--color-fixture); }',
    );
    writeFileSync(join(root, TOKEN_DIR, 'source', 'colors.json'), '{"not":"read"}');

    const sources = tokenSources({ root });
    expect(sources.map((s) => s.file)).toEqual(['_fixture.scss']);

    const corpus = tokenCorpus({ root });
    expect([...corpus.keys()]).toEqual(['--color-fixture', '--color-alias']);
    expect(corpus.get('--color-alias').value).toBe('#abc');
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

  it('answers null rather than guessing', () => {
    expect(colourKey('currentColor')).toBe(null);
    expect(colourKey('#ab')).toBe(null);
    expect(colourKey('rgb(300, 0, 0)')).toBe(null);
    expect(colourKey('var(--color-primary)')).toBe(null);
    expect(colourKey(undefined)).toBe(null);
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
      const rivals = [docsColourKey(literal), normaliseColour(literal)];
      if (rivals.every((key) => key === null)) continue;
      expect(
        colourKey(literal),
        `${literal} is read by a rival and not by the module`,
      ).not.toBe(null);
    }
  });

  it('agrees with the old normaliser on every OPAQUE form it can read', () => {
    for (const literal of ['#abc', '#0472a8', 'rgb(4, 114, 168)', 'rgba(4,114,168,1)']) {
      expect(colourKey(literal)).toBe(normaliseColour(literal));
    }
  });
});

describe('the colour key is finer than the normaliser it replaces', () => {
  /*
   * ONE PAIR, NAMED. `--color-secondary-state-08` is the 8% overlay of the
   * colour `--color-secondary-border` is; the old normaliser is `parseColour`
   * followed by `toHex`, and `toHex` drops alpha, so it calls them the same
   * colour. (The state overlays are not all mixed from the base of their own
   * name — `--color-primary-state-08` is an 8% `#00658e`, not an 8%
   * `--color-primary` — which is its own finding and not this test's.)
   */
  it('calls a translucent overlay and its solid DIFFERENT, where the normaliser called them equal', () => {
    const corpus = tokenCorpus();
    const solid = corpus.get('--color-secondary-border').value;
    const overlay = corpus.get('--color-secondary-state-08').value;

    expect(overlay).toMatch(/^rgba\(/);
    expect(normaliseColour(solid)).toBe(normaliseColour(overlay));
    expect(colourKey(solid)).not.toBe(colourKey(overlay));
    expect(colourKey(overlay)).toBe(`${colourKey(solid)}14`);
    expect(sameValue(solid, overlay)).toBe(false);
  });

  /*
   * AND HOW MANY OF THEM THERE ARE, counted rather than recalled: every
   * unordered pair of live colour tokens the old normaliser could read, where
   * it says equal and this key says unequal. 315 on 2026-09-18. The number is
   * asserted rather than logged because a migrating caller's exposure is this
   * number, and a drift in it is news either way.
   */
  it('differs from the normaliser on 315 live token pairs', () => {
    const readable = [...tokenCorpus().values()]
      .map((entry) => entry.value)
      .filter((value) => normaliseColour(value) !== null);

    let pairs = 0;
    for (let i = 0; i < readable.length; i += 1) {
      for (let j = i + 1; j < readable.length; j += 1) {
        if (normaliseColour(readable[i]) !== normaliseColour(readable[j])) continue;
        if (colourKey(readable[i]) === colourKey(readable[j])) continue;
        pairs += 1;
      }
    }
    expect(pairs).toBe(315);
  });

  /*
   * WHY `check:colour-fallbacks` DID NOT MOVE WHEN #621 PUT IT ON THIS KEY —
   * and it is a fact about the CAPTURE, not a property of the key, which is
   * why it is pinned with its mechanism over the whole live corpus rather than
   * asserted as "output unchanged".
   *
   * THE MECHANISM, CORRECTED. `fallbackUsages` captures the fallback with
   * `[^),]+`, which admits no comma and no `)`, and then requires the closing
   * `)` of the `var()`. A whole `rgba()` fallback satisfies neither branch: the
   * 25 sites writing `var(--color-x, rgba(4, 114, 168, 0.08))` are not captured
   * with a truncated literal and are not counted incomparable — the regex does
   * not match them AT ALL, so they never reach the audit in any form. (#620's
   * docblock had the fragment `rgba(4` arriving in the incomparable count;
   * measured here the fragment is never produced, and #621 corrected the
   * docblock to match.)
   *
   * So every colour comparison the check makes is opaque on both sides, and the
   * 315 pairs above are all outside the compared set. The day the capture is
   * widened to read a whole `rgba()` fallback, that stops being true, and this
   * test is what says so.
   */
  it('makes no live colour comparison with alpha on either side, because the capture refuses a whole rgba()', () => {
    const roots = ['design-system/src', '.storybook', 'prototypes'];
    const extensions = ['.scss', '.css', '.jsx', '.tsx', '.mdx', '.html'];
    const root = resolve('..');
    const sources = roots.flatMap((dir) =>
      documents(dir, { root, ext: extensions }).map((rel) => ({
        path: rel,
        text: text(rel, { root }),
      })),
    );

    // The tree really does write `rgba()` fallbacks beside colour tokens — 25
    // of them, which is the population this test is about.
    const withRgba = sources.filter((s) =>
      /var\(\s*--color-[a-z0-9-]+\s*,\s*rgba\(/.test(s.text),
    );
    expect(withRgba.length).toBeGreaterThan(0);

    const tokens = new Map(
      [...tokenCorpus({ prefix: '--color-', precedence: 'last' })].map(([name, entry]) => [
        name,
        entry.value,
      ]),
    );
    const usages = fallbackUsages(sources, { prefix: '--color-' });

    // Not one of them is captured, in any form.
    expect(usages.filter((use) => /rgba?\(/i.test(use.literal ?? ''))).toEqual([]);

    // And every comparison the check does make is opaque on both sides. The
    // count is asserted because a DROP in it is how a capture quietly stops
    // reading fallbacks at all.
    let comparable = 0;
    for (const use of usages) {
      if (use.literal === null || !tokens.has(use.token)) continue;
      const literal = colourKey(use.literal);
      const tokenValue = colourKey(tokens.get(use.token));
      if (literal === null || tokenValue === null) continue;
      comparable += 1;
      expect(literal.length, `${use.literal} carries alpha`).toBe(7);
      expect(tokenValue.length, `${use.token} carries alpha`).toBe(7);
    }
    expect(comparable).toBe(476);
    // The default 5s is not enough under a loaded runner: this is the one test
    // in the file that reads three source trees rather than the token
    // directory, and a timeout here would read as a finding it never made.
  }, 30_000);
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

  /*
   * THE ONE PLACE THE TWO RIVALS DISAGREED, measured rather than asserted from
   * the docblock: a bare `0`. `normaliseDimension` read it and the docs
   * check's key answers null, so the module had to CHOOSE, and it took the
   * reading that loses no comparison — which is why #621 could retire
   * `normaliseDimension` outright, and why the surviving rival is still
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
