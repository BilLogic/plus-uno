/**
 * `npm run check:docs-token-literals` — no hand-picked colour or size in the
 * docs stylesheet that the design system already has a token for.
 *
 * WHY IT EXISTS. `.storybook/storybook-overrides.css` is the one stylesheet in
 * this repo that styles the DOCUMENTATION rather than a component, and nothing
 * watched it. It accumulated `clamp(2.5rem, 5vw, 4rem)`, `0.625rem`, `1.5rem`
 * and a `#e4e4e7` — every one of them hand-picked, every one of them sitting a
 * few lines from a `var(--size-…)` doing the same job. #251 deleted some of
 * them by hand. Nothing stopped the next edit re-introducing them, and a defect
 * class that has to be swept by hand every few months is a defect class with no
 * gate on it.
 *
 * WHY NOT THE DESIGN SYSTEM'S OWN SCSS. That is where literals legitimately
 * live: `design-system/src/tokens/*.scss` is what DEFINES `--size-spacing-…`,
 * and `--color-primary: #0472a8` is not a violation, it is the token. A check
 * that walked `design-system/src` would report thousands of "violations" that
 * are the source of truth, and a check nobody can act on gets switched off
 * (`scripts/check-harness.mjs` § rule 2). So the corpus is the docs stylesheets
 * and only those.
 *
 * WHAT IT LOOKS AT. Declaration values, split into two kinds of literal:
 *
 *   colour     `#abc` / `#aabbcc` / `rgb()` / `rgba()` / `hsl()` / `hsla()`
 *              matched against every `--color-*` token, by value.
 *   dimension  `<n>px` / `<n>rem` / `<n>%`, normalised to px at 16px/rem, and
 *              matched against `--font-size-*` for a `font-size`,
 *              `--font-line-height-*` for a `line-height`, and `--size-*`
 *              otherwise.
 *
 * The token table is read live from `design-system/src/tokens/*.scss` — the
 * same files `scripts/generate-token-registry.mjs` validates every
 * `var(--token)` in the Figma mapping against, which makes it the existence
 * truth for tokens in this repo. Aliases are resolved transitively, so
 * `--size-card-gap-md → --size-spacing-medium-space-300 → 16px` all index at
 * 16px and the report can offer the semantic name rather than the primitive.
 *
 * WHAT HAPPENS WHEN A TOKEN MOVES. There is no baseline file and no snapshot.
 * Adding a token whose value equals a literal already in the docs stylesheet
 * turns this check RED on a commit that did not touch the stylesheet — which is
 * the correct moment to be told, because that is the moment the hand-picked
 * value became avoidable. Removing a token turns a finding green. Both are
 * intended; a ratchet or a recorded baseline would hide exactly the transition
 * this exists to catch.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────
 * Written down because the sibling check this is modelled on,
 * `check-token-collision.mjs`, only ever catches a foreground token IDENTICAL
 * to its background — near-misses are invisible to it — and it says so. The
 * same honesty is owed here.
 *
 *  1. A NEAR MISS. `13px` is not `12px`, so `font-size: 13px` passes even
 *     though `--font-size-body3` is plainly what was meant. This check tests
 *     equality, never proximity. Choosing a tolerance would mean choosing which
 *     deliberate one-off is a mistake, and that is a judgement no exit code
 *     should make.
 *  2. A FALLBACK THAT DISAGREES WITH ITS OWN TOKEN. `var(--token, fallback)` is
 *     an allowance (see below), and this check does not compare the fallback to
 *     the token. The corpus has several that differ:
 *     `var(--color-outline-variant, #e4e4e7)` where the token is `#bec8ca`,
 *     `var(--color-on-surface-variant, #5c5c5c)` where it is `#3f484a`,
 *     `var(--color-surface, #fff)` where it is `#f9f9fc`. Those fallbacks only
 *     ever paint when the token sheet failed to load, so they are a different
 *     defect — a wrong emergency colour, not a hand-picked one — and they need
 *     their own check, not a widening of this one.
 *  3. ANYTHING OUTSIDE A DECLARATION. Media-query preludes especially:
 *     `@media (min-width: 768px)` matches `--breakpoint-md-min` exactly, and is
 *     NOT a finding, because custom properties are invalid in a media prelude —
 *     there is no `var()` that could replace it. Flagging it would be
 *     instructing the author to write code that does not work.
 *  4. WHICH token is the right one. It reports every token that carries the
 *     value and leaves the role to the author: `24px` is
 *     `--size-spacing-medium-space-500` and `--size-card-pad-x-lg` and
 *     `--size-section-gap-lg`, and only a human knows whether this is a card or
 *     a section. It filters by property family (a `font-size` is never offered
 *     a spacing token) and it prefers semantic names over the primitives
 *     `_primitives.scss` marks DO NOT USE DIRECTLY — but it does not choose.
 *  5. TOKEN FAMILIES OUTSIDE `--color-*`, `--font-size-*`,
 *     `--font-line-height-*` and `--size-*`. `--layout-*`, `--col-*` and
 *     `--breakpoint-*` describe the app-shell grid; a docs-chrome pixel that
 *     happened to equal `--col-3` would be a coincidence, not a token being
 *     ignored, and reporting it would train people to ignore the report.
 *  6. WHETHER THE PAGE STILL LOOKS RIGHT. Swapping `1.5rem` for
 *     `var(--size-spacing-medium-space-500)` is only value-preserving while the
 *     root font size is 16px. Nothing here renders anything; `check:storybook`
 *     drives the browser.
 *  7. SHORTHAND POSITION. `padding: 8px 12px` is read as two dimensions, not as
 *     a y and an x. It cannot tell you that only one of them was deliberate.
 *
 * ─── THE ALLOWANCES, AND WHY EACH ONE ───────────────────────────────────────
 *  • `0` in any unit. Zero is zero; there is no design decision in it, and
 *    `--size-spacing-small-space-000` exists only so Figma has a row for it.
 *  • `100%`. "As wide as the thing containing it" is a layout instruction, not
 *    a measurement, and no token can express it.
 *  • `1px` and `-1px`. A hairline is the thinnest line a border can be and the
 *    one-pixel pull-up that sits a tab underline ON a strip's border. Both are
 *    device facts rather than design values.
 *  • A fallback inside `var(--token, fallback)`. That is the token being used
 *    CORRECTLY — the fallback exists for the frame before the token sheet
 *    lands. Flagging it would mean the only way to pass this check is to write
 *    fragile `var()` calls, which is the opposite of the point. (Its cost is
 *    limitation 2 above, stated rather than buried.)
 *  • An adjacent comment: a `/* … *\/` that ends on the declaration's own line,
 *    or on the line directly above it, INSIDE the rule block.
 *
 * ON THAT LAST ONE, since an escape hatch any author can take by writing a
 * comment is only as good as the comments. It is kept, deliberately, for three
 * reasons. First, the corpus contains a value that EQUALS a token and still
 * must not use it: `scroll-padding-top: 5rem/6rem` is the height of Storybook's
 * own sticky chrome, and the same number is duplicated as a plain integer in
 * `unsafeTocbotOptions.headingsOffset` in preview.jsx, because Tocbot scrolls in
 * JS and reads no custom property. Tokenising one half of a measurement whose
 * other half cannot be tokenised is how the two drift. A gate with no
 * legitimate way past a case like that is a gate that gets deleted rather than
 * satisfied (`check-harness.mjs` § rule 2 again). Second, the hatch is not free and not
 * quiet: the comment must sit against the declaration, so it lands in the diff
 * beside the literal, it is what a reviewer reads first, and `git log -S` finds
 * every use of it. Third — and this is the part the check cannot help with — it
 * cannot judge whether a comment is a justification or the word "intentional".
 * That is review's job. This gate's job is narrower and it is worth stating
 * exactly: to make hand-picking a value IMPOSSIBLE TO DO SILENTLY. It does not
 * make it impossible.
 *
 * Usage:
 *   npm run check:docs-token-literals            report every literal; exit 1 if any
 *   npm run check:docs-token-literals -- --list  print the corpus and the token
 *                                                counts, run nothing, exit 0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

/**
 * The corpus: stylesheets that dress the DOCS. Everything under `.storybook/`
 * qualifies by construction — that directory holds nothing but the docs shell —
 * and a new docs stylesheet dropped there is picked up without editing this
 * file.
 *
 * `design-system/src/storybook-docs/storybook-tailwind.css` is docs-only too and
 * is still NOT here: it contains no declarations at all, only custom-property
 * definitions for the shadcn theme layer. It is a token sheet, and the paragraph
 * above about the DS SCSS applies to it word for word.
 */
const DOCS_STYLE_DIR = path.join(REPO_ROOT, '.storybook');
const TOKENS_DIR = path.join(REPO_ROOT, 'design-system', 'src', 'tokens');

/** Primitive tokens carry a DO NOT USE DIRECTLY banner; semantic names sort first. */
const PRIMITIVES_FILE = '_primitives.scss';

// ── the token table ─────────────────────────────────────────────────────────

/** `--name: value` across the token SCSS, first definition wins (`:root` order). */
function readTokenDefinitions(dir = TOKENS_DIR) {
  const defs = new Map();
  if (!fs.existsSync(dir)) return defs;
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.scss')) continue;
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const m of source.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
      if (!defs.has(m[1])) defs.set(m[1], { value: m[2].trim(), file });
    }
  }
  return defs;
}

/** Follow `var(--other)` aliases to the literal at the end. Cycle-safe. */
function terminal(name, defs, seen = new Set()) {
  if (seen.has(name)) return null;
  seen.add(name);
  const def = defs.get(name);
  if (!def) return null;
  const alias = def.value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  return alias ? terminal(alias[1], defs, seen) : def.value;
}

/** `12px` / `0.75rem` / `140%` → a comparable key. `rem` is 16px, and only 16px. */
export function dimensionKey(literal) {
  const m = /^(-?\d*\.?\d+)(px|rem|%)$/.exec(literal.trim().toLowerCase());
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (m[2] === '%') return `${n}%`;
  return `${m[2] === 'rem' ? n * 16 : n}px`;
}

/** `#ABC` → `#aabbcc`; `rgba( 0 , 0 ,0, .5 )` → `rgba(0,0,0,0.5)`. */
export function colourKey(literal) {
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
}

/**
 * The four families this check knows how to offer, keyed by what a literal in
 * that position could actually be replaced with. Families outside this list are
 * limitation 5 in the header.
 */
export function buildTokenIndex(defs = readTokenDefinitions()) {
  const index = {
    colour: new Map(),
    'font-size': new Map(),
    'font-line-height': new Map(),
    size: new Map(),
  };
  const push = (bucket, key, name, file) => {
    if (!index[bucket].has(key)) index[bucket].set(key, []);
    index[bucket].get(key).push({ name, primitive: file === PRIMITIVES_FILE });
  };

  for (const [name, def] of defs) {
    const value = terminal(name, defs);
    if (!value) continue;
    const bucket = name.startsWith('--color-')
      ? 'colour'
      : name.startsWith('--font-size-')
        ? 'font-size'
        : name.startsWith('--font-line-height-')
          ? 'font-line-height'
          : name.startsWith('--size-')
            ? 'size'
            : null;
    if (!bucket) continue;
    const key = bucket === 'colour' ? colourKey(value) : dimensionKey(value);
    if (key) push(bucket, key, name, def.file);
  }

  // Semantic names before primitives, then alphabetical — the report's first
  // suggestion should be the one `_primitives.scss` tells people to reach for.
  for (const bucket of Object.values(index)) {
    for (const list of bucket.values()) {
      list.sort((a, b) => a.primitive - b.primitive || a.name.localeCompare(b.name));
    }
  }
  return index;
}

// ── the stylesheet front end ────────────────────────────────────────────────

/**
 * Blanks comment BODIES with spaces (newlines kept, so `:line` stays the line on
 * disk — the lesson `check-token-collision.mjs` records at its own `blank`) and
 * returns, separately, the line each comment ENDS on while inside a rule block.
 *
 * Only comments at brace depth ≥ 1 are recorded, which is what keeps the file's
 * long rule-level banners from justifying the first declaration underneath them:
 * the allowance is for a comment against a declaration, not for a rule that
 * happens to be introduced.
 */
export function blankComments(source) {
  let out = '';
  let depth = 0;
  let line = 1;
  const justifying = new Set();

  for (let i = 0; i < source.length; ) {
    if (source[i] === '/' && source[i + 1] === '*') {
      const startDepth = depth;
      let j = i + 2;
      while (j < source.length && !(source[j] === '*' && source[j + 1] === '/')) j++;
      j = Math.min(j + 2, source.length);
      for (let k = i; k < j; k++) out += source[k] === '\n' ? '\n' : ' ';
      for (let k = i; k < j; k++) if (source[k] === '\n') line++;
      if (startDepth >= 1) justifying.add(line);
      i = j;
      continue;
    }
    const c = source[i];
    if (c === '\n') line++;
    else if (c === '{') depth++;
    else if (c === '}') depth = Math.max(0, depth - 1);
    out += c;
    i++;
  }
  return { text: out, justifying };
}

/**
 * Declarations, with the line the property name sits on. At-rule PRELUDES are
 * skipped whole (limitation 3): a prelude is not a declaration and cannot hold a
 * `var()`. At-rule BODIES are not — a `@media` block is full of ordinary rules.
 */
export function declarations(text) {
  const out = [];
  let buffer = '';
  let bufferLine = 1;
  let line = 1;
  let depth = 0;

  const flush = () => {
    const decl = buffer.trim();
    buffer = '';
    if (!decl || depth === 0 || decl.startsWith('@') || decl.startsWith('--')) return;
    const m = decl.match(/^([-a-z]+)\s*:\s*([\s\S]+)$/i);
    if (m) out.push({ prop: m[1].toLowerCase(), value: m[2].replace(/!important\s*$/i, '').trim(), line: bufferLine });
  };

  for (const ch of text) {
    if (!buffer.trim() && !/\s/.test(ch)) bufferLine = line;
    if (ch === '{') {
      depth++;
      buffer = '';
    } else if (ch === '}') {
      flush();
      depth = Math.max(0, depth - 1);
      buffer = '';
    } else if (ch === ';') {
      flush();
    } else {
      buffer += ch;
    }
    if (ch === '\n') line++;
  }
  return out;
}

/**
 * Blanks every `var(--token, fallback)` FALLBACK — everything after the first
 * top-level comma inside the `var(`. Nested `var()`s inside a fallback go with
 * it, which is what makes `var(--a, var(--b, #5c5c5c))` one allowance and not a
 * finding. The token name itself is left in place; it is not a literal.
 */
export function blankFallbacks(value) {
  let out = '';
  for (let i = 0; i < value.length; ) {
    if (!value.startsWith('var(', i)) {
      out += value[i++];
      continue;
    }
    out += 'var(';
    let j = i + 4;
    let depth = 1;
    let comma = -1;
    while (j < value.length && depth > 0) {
      if (value[j] === '(') depth++;
      else if (value[j] === ')') depth--;
      else if (value[j] === ',' && depth === 1 && comma === -1) comma = j;
      if (depth > 0) j++;
    }
    const end = Math.min(j, value.length);
    const head = comma === -1 ? value.slice(i + 4, end) : value.slice(i + 4, comma);
    out += head + (comma === -1 ? '' : ' '.repeat(end - comma));
    out += value[end] === ')' ? ')' : '';
    i = end + 1;
  }
  return out;
}

/** Literals that carry no design decision. See § THE ALLOWANCES. */
export function alwaysAllowed(literal) {
  const key = dimensionKey(literal);
  return key === '0px' || key === '0%' || key === '100%' || key === '1px' || key === '-1px';
}

/**
 * `\b` after the unit would be wrong for `%`: `%` is not a word character, so
 * `50%;` has no boundary after it and the literal would never match — which is
 * how the `100%` allowance nearly shipped as an allowance for something the
 * scanner had never once looked at. A negative lookahead bounds `12px` against
 * `12pxel` without depending on what kind of character the unit ends with.
 */
const DIMENSION = /-?\d*\.?\d+(?:px|rem|%)(?![a-z0-9%-])/gi;
const COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/gi;

const bucketFor = (prop) =>
  prop === 'font-size' ? 'font-size' : prop === 'line-height' ? 'font-line-height' : 'size';

/**
 * Every finding in one stylesheet. `index` is injected so the tests can run
 * against a tiny fixed token table instead of whatever the design system
 * happens to define this week — the allowances have to hold whatever the DS
 * does, and a test that drifts with the corpus is not a test.
 */
export function findings(source, index) {
  const { text, justifying } = blankComments(source);
  const found = [];

  for (const decl of declarations(text)) {
    if (justifying.has(decl.line) || justifying.has(decl.line - 1)) continue;
    const value = blankFallbacks(decl.value);
    const seen = new Set();

    const add = (literal, bucket, key) => {
      const tokens = index[bucket]?.get(key);
      if (!tokens?.length || seen.has(literal)) return;
      seen.add(literal);
      found.push({ ...decl, literal, tokens: tokens.map((t) => t.name) });
    };

    for (const m of value.matchAll(COLOUR)) add(m[0], 'colour', colourKey(m[0]));
    for (const m of value.matchAll(DIMENSION)) {
      if (alwaysAllowed(m[0])) continue;
      add(m[0], bucketFor(decl.prop), dimensionKey(m[0]));
    }
  }
  return found;
}

// ── the runner ──────────────────────────────────────────────────────────────

const cssFiles = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.css'))
        .sort()
        .map((f) => path.join(dir, f))
    : [];

function main() {
  const files = cssFiles(DOCS_STYLE_DIR);
  const index = buildTokenIndex();

  // A corpus that vanished is not a clean corpus, and a token table that
  // vanished exonerates every literal in it. Both floors report rather than
  // pass silently — the same reason `check-token-collision.mjs` refuses to run
  // over fewer than 100 stylesheets.
  if (!files.length) {
    console.error(
      `[check:docs-token-literals] no .css under ${path.relative(REPO_ROOT, DOCS_STYLE_DIR)}.\n` +
        '  -> The docs stylesheet moved. A check over nothing passes over everything.',
    );
    return process.exit(1);
  }
  const tokenCount = Object.values(index).reduce((n, b) => n + [...b.values()].reduce((k, l) => k + l.length, 0), 0);
  if (tokenCount < 200) {
    console.error(
      `[check:docs-token-literals] indexed ${tokenCount} tokens from ${path.relative(REPO_ROOT, TOKENS_DIR)} — expected at least 200.\n` +
        '  -> The token SCSS moved or the parse broke. With no tokens, every literal looks fine.',
    );
    return process.exit(1);
  }

  if (process.argv.includes('--list')) {
    console.log(`check:docs-token-literals reads ${files.length} docs stylesheet(s):\n`);
    for (const f of files) console.log(`  ${path.relative(REPO_ROOT, f)}`);
    console.log(`\nagainst ${tokenCount} token definitions in ${path.relative(REPO_ROOT, TOKENS_DIR)}:\n`);
    for (const [bucket, map] of Object.entries(index)) {
      console.log(`  ${bucket.padEnd(18)} ${[...map.values()].reduce((k, l) => k + l.length, 0)} tokens over ${map.size} distinct values`);
    }
    return process.exit(0);
  }

  const failures = [];
  for (const file of files) {
    for (const f of findings(fs.readFileSync(file, 'utf8'), index)) {
      failures.push({ file: path.relative(REPO_ROOT, file), ...f });
    }
  }

  if (!failures.length) {
    console.log(
      `✓ check:docs-token-literals — ${files.length} docs stylesheet(s), no literal the design system already tokenises`,
    );
    return process.exit(0);
  }

  console.error(
    `[check:docs-token-literals] ${failures.length} hand-picked value(s) the design system already has a token for:\n`,
  );
  let current = '';
  for (const f of failures) {
    if (f.file !== current) {
      console.error(`  ${f.file}`);
      current = f.file;
    }
    console.error(`    :${String(f.line).padEnd(4)} ${f.prop}: … ${f.literal} …`);
    console.error(`           -> ${f.tokens.slice(0, 4).join('  ')}${f.tokens.length > 4 ? `  (+${f.tokens.length - 4} more)` : ''}`);
  }
  console.error(
    '\n  -> Use the token whose ROLE fits — the list above is every token carrying' +
      '\n     that value, semantic names first. If the value genuinely has no token,' +
      '\n     say why in a comment on the declaration or the line above it; that is' +
      '\n     the only way past this check, and it is meant to be read in review.',
  );
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
