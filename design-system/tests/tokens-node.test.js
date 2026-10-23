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
 *   the family   which family a token name belongs to — and the one place
 *                the color family's naming promises MORE than its
 *                values keep: a `-state-08/12/16` overlay is a wash of the
 *                role it is named after, except the three shadow steps, which
 *                name a role that has no token. That one exception is pinned
 *                so a second fails.
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

import { documents, text } from '../../scripts/lib/corpus.mjs';
import { fallbackUsages } from '../../scripts/token-fallbacks.mjs';
import { parseColor, toHex } from '../src/lib/tokens.mjs';
import {
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
    const colors = tokenCorpus({ prefix: '--color-' });
    expect(colors.size).toBeGreaterThan(100);
    for (const name of colors.keys()) expect(name.startsWith('--color-')).toBe(true);
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
    expect(familyOf('--color-primary')).toBe('color');
    expect(familyOf('--size-spacing-medium-space-300')).toBe('size');
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

/*
 * `-state-NN` NAMES AN OVERLAY; IT DOES NOT DERIVE ONE (#644).
 *
 * `--color-{role}-state-08/12/16` reads like `--color-{role}` at 8/12/16%, and
 * `design-system/guidelines/foundations/color.md` presents it in the same table
 * as the other `--color-{role}-*` modifiers. Until 2026-09-29 that held for 84
 * of the 117 overlays only: for ten bases the solid had been re-picked in Figma
 * and the washes in `_colors.scss` never followed (`--color-primary` was
 * `#0472a8` while `--color-primary-state-08` was 8% of `#00658e`). An
 * implementer assumed the derivation and took a red test for it, which is what
 * made this worth writing down.
 *
 * THE FIGMA SIDE SETTLED IT. Read live from the BS4 Foundation library on
 * 2026-09-29, every `State-layers/*` variable is its own group's solid at
 * 8/12/16%, so the ten were re-mixed from their named bases. What is left is
 * shadow: `--color-shadow-state-*` is black and there is no `--color-shadow`
 * token for it to agree with. It stays pinned so that a new divergence fails,
 * and so that minting `--color-shadow` some day has to come past this test.
 *
 * Do not re-open the list to get a run green. A wash that stops matching its
 * base means one side moved without the other: read the Figma variable and
 * decide which side is right.
 */
describe('a state overlay is mixed from the base it is named after', () => {
  /** Every `--color-*-state-08/12/16`, aliases resolved, with its named base. */
  const overlays = () => {
    const corpus = tokenCorpus();
    return [...corpus.keys()]
      .filter((name) => /^--color-.+-state-(08|12|16)$/.test(name))
      .map((name) => {
        const base = name.replace(/-state-(08|12|16)$/, '');
        const mixed = colorKey(corpus.get(name).value);
        const solid = corpus.get(base) ? colorKey(corpus.get(base).value) : null;
        // Channels only: the overlay's whole job is to carry an alpha the solid
        // does not have, so `colorKey`'s alpha byte is the one thing that must
        // differ. `#rrggbb` is the first seven characters of either key.
        return { name, base, mixed: mixed?.slice(0, 7) ?? null, solid: solid?.slice(0, 7) ?? null };
      });
  };

  /**
   * The exception, by BASE rather than by overlay: all three steps of a base
   * diverge together, because they are three alphas over one color.
   *
   * `--color-shadow` is the only row, and it is not a drift: there is no
   * `--color-shadow` token at all, and a shadow wash is black. It is recorded
   * rather than special-cased so that minting `--color-shadow` some day has to
   * come past this test.
   */
  const KNOWN = {
    '--color-shadow': '#000000',
  };

  it('mixes 114 of the 117 overlays from the base their name points at', () => {
    const all = overlays();
    expect(all.length).toBe(117);
    const agree = all.filter((o) => o.mixed !== null && o.mixed === o.solid);
    expect(agree.length).toBe(117 - Object.keys(KNOWN).length * 3);
  });

  it('diverges on exactly the recorded base, and mixes what is recorded', () => {
    const found = {};
    for (const { base, mixed, solid } of overlays()) {
      if (mixed !== null && mixed === solid) continue;
      // Every step of a base has to mix the SAME color, or the name is not the
      // only thing that has stopped describing the family.
      if (base in found) expect(found[base]).toBe(mixed);
      found[base] = mixed;
    }
    expect(found).toEqual(KNOWN);
  });

  it('records a base for every divergent name, so the exception is readable', () => {
    for (const base of Object.keys(KNOWN)) {
      const solid = tokenCorpus().get(base);
      // `--color-shadow` is the row with no solid, which is its whole reason.
      if (base === '--color-shadow') expect(solid).toBe(undefined);
      else expect(colorKey(solid.value)?.slice(0, 7)).not.toBe(KNOWN[base]);
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
    expect(colorKey('var(--color-primary)')).toBe(null);
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
   * ONE PAIR, NAMED. `--color-secondary-state-08` is the 8% overlay of the
   * color `--color-secondary-border` is; the old normalizer is `parseColor`
   * followed by `toHex`, and `toHex` drops alpha, so it calls them the same
   * color.
   */
  it('calls a translucent overlay and its solid DIFFERENT, where the normalizer called them equal', () => {
    const corpus = tokenCorpus();
    const solid = corpus.get('--color-secondary-border').value;
    const overlay = corpus.get('--color-secondary-state-08').value;

    expect(overlay).toMatch(/^rgba\(/);
    expect(normalizeColor(solid)).toBe(normalizeColor(overlay));
    expect(colorKey(solid)).not.toBe(colorKey(overlay));
    expect(colorKey(overlay)).toBe(`${colorKey(solid)}14`);
    expect(sameValue(solid, overlay)).toBe(false);
  });

  /*
   * AND HOW MANY OF THEM THERE ARE, counted rather than recalled: every
   * unordered pair of live color tokens the old normalizer could read, where
   * it says equal and this key says unequal. 315 on 2026-09-18; 357 on
   * 2026-09-29, when the ten `-border-subtle` label borders added 45% washes of
   * bases already in the corpus; 405 the same day, when ten state-layer bases
   * were re-mixed from their Figma solids and their washes joined those
   * channels; 411 when `--color-focus-ring-inverse` arrived as another solid
   * #f9f9fc and paired with the six surface overlays; 426 when the four
   * `--color-surface-default|overlay|raised|sunken` roles arrived as aliases
   * of solid neutrals already in the corpus and brought 15 pairs with their
   * overlays, every one of the new pairs touching one of the four; 430 when
   * `--overlay-scrim` arrived as black at 38% beside the other black
   * washes. The number is asserted
   * rather than logged because a migrating caller's exposure is this number,
   * and a drift in it is news either way.
   */
  it('differs from the normalizer on 430 live token pairs', () => {
    const readable = [...tokenCorpus().values()]
      .map((entry) => entry.value)
      .filter((value) => normalizeColor(value) !== null);

    let pairs = 0;
    for (let i = 0; i < readable.length; i += 1) {
      for (let j = i + 1; j < readable.length; j += 1) {
        if (normalizeColor(readable[i]) !== normalizeColor(readable[j])) continue;
        if (colorKey(readable[i]) === colorKey(readable[j])) continue;
        pairs += 1;
      }
    }
    expect(pairs).toBe(430);
  });

  /*
   * WHAT `check:color-fallbacks` COMPARES WITH ALPHA — and it is a fact about
   * the CAPTURE, not a property of the key, which is why it is pinned with its
   * mechanism over the whole live corpus rather than asserted as "output
   * unchanged".
   *
   * THE MECHANISM. `fallbackUsages` tries a whole color function —
   * `rgba(…)`, `rgb(…)`, `hsla(…)`, commas and all — before the plain
   * `[^),]+` literal. Until it did, the plain literal was the only branch: it
   * admits no comma and no `)`, so a `var(--color-x, rgba(4, 114, 168, 0.08))`
   * was not matched AT ALL — not captured, not counted incomparable, simply
   * not seen. That is how every state-layer wash was written, so a re-mixed
   * base left its washes stale and nothing said so.
   *
   * Measured over the live tree: 85 `var(--color-*, rgba(…))` sites, every one
   * captured, and every one names a defined token and is compared with
   * alpha on both sides. All 85 agree, because the disagreeing washes were
   * fixed when the capture widened, and the test asserts it: a stale wash
   * here is a failure, not a recount.
   */
  it('compares every live rgba() color fallback with its alpha, because the capture reads a whole color function', () => {
    const roots = ['design-system/src', '.storybook', 'prototypes'];
    const extensions = ['.scss', '.css', '.jsx', '.tsx', '.mdx', '.html'];
    const root = resolve('..');
    const sources = roots.flatMap((dir) =>
      documents(dir, { root, ext: extensions }).map((rel) => ({
        path: rel,
        text: text(rel, { root }),
      })),
    );

    // The population this test is about: every wash written beside a color
    // token. Counted per SITE, not per file.
    const washes = sources.reduce(
      (n, s) => n + (s.text.match(/var\(\s*--color-[a-z0-9-]+\s*,\s*rgba\(/g) ?? []).length,
      0,
    );
    expect(washes).toBe(85);

    const tokens = new Map(
      [...tokenCorpus({ prefix: '--color-', precedence: 'last' })].map(([name, entry]) => [
        name,
        entry.value,
      ]),
    );
    const usages = fallbackUsages(sources, { prefix: '--color-' });

    // Every one of them is captured, whole.
    const captured = usages.filter((use) => /^rgba\(/i.test(use.literal ?? ''));
    expect(captured.length).toBe(washes);

    // And compared with alpha. The counts are asserted because a DROP in
    // either is how a capture quietly stops reading fallbacks at all. A new
    // stylesheet whose fallbacks agree with their tokens raises them.
    let comparable = 0;
    let withAlpha = 0;
    for (const use of usages) {
      if (use.literal === null || !tokens.has(use.token)) continue;
      const literal = colorKey(use.literal);
      const tokenValue = colorKey(tokens.get(use.token));
      if (literal === null || tokenValue === null) continue;
      comparable += 1;
      if (literal.length !== 9 && tokenValue.length !== 9) continue;
      withAlpha += 1;
      expect(literal, `${use.path}:${use.line} ${use.token}`).toBe(tokenValue);
    }
    // 82: the old Dropdown option list and its rows' state washes were
    // deleted when value pickers moved to Select and the shared option row.
    // 85: the last three washes that named undefined tokens
    // (`surface-container-hover`, `surface-container-active`,
    // `primary-state-04`) now name the on-surface and primary state layers,
    // so they are compared here rather than skipped.
    expect(withAlpha).toBe(85);
    // 643: MultipleChoice.scss left with ChoiceGroup, and its three hex
    // fallbacks with it. 620: the date pickers moved onto the shared field and
    // calendar, and the old Dropdown option list went, each with its fallbacks.
    // 623: the same three washes, now naming defined tokens, became comparable.
    // 615: the Popover took the Popup pattern's tokens, and its eight hex
    // fallbacks went with the dark header.
    expect(comparable).toBe(615);
    // The default 5s is not enough under a loaded runner: this is the one test
    // in the file that reads three source trees rather than the token
    // directory, and a timeout here would read as a finding it never made.
  }, 30_000);
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
