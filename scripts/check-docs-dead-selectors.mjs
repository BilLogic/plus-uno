#!/usr/bin/env node
/**
 * `npm run check:docs-dead-selectors` — no rule in the docs stylesheet targets a
 * class that nothing emits.
 *
 * WHY IT EXISTS. #250's R1 asked for exactly one thing: "no rule in the docs
 * stylesheet is unreachable". It was satisfied by a HAND SWEEP — `.sb-button-docs*`,
 * `.sb-doc-shadcn`, `.sbdocs-p`, `.sbdocs-li`, `.sbdocs-h1`…`-h5` were each looked up
 * and deleted, and the AC went green. The sweep leaked. Measured on this tree, five
 * class selectors still target something nothing emits:
 *
 *   .sb-plus-intro-mini-grid                    named IN THE TICKET as 0 uses, and
 *                                               still here after the sweep that named it
 *   .responsive-frame-toolbar                   nothing in the repo emits it
 *   .responsive-frame-root--browser-fullscreen  ResponsiveFrame.jsx emits `--native`
 *                                               and `--standalone`, and no third
 *   .toc-container, h2.toc-title                written against "Storybook 8 TOC might
 *                                               lack .sbdocs-toc" — neither string
 *                                               exists in Storybook 10.6's packages
 *
 * That is the argument for this file and not for a sixth hand sweep. A defect class
 * whose fix is "somebody greps carefully every few months" is a defect class with no
 * gate on it, and this one has now been swept by hand once and leaked five.
 *
 * WHAT IT LOOKS AT. Class names in SELECTOR position in `.storybook/*.css`, matched
 * against every class name that appears anywhere in the repo's own sources. A class
 * is alive if its full literal string occurs in an `.mdx`, `.jsx/.tsx/.js/.ts`,
 * `.html`, `.json`, `.scss` or `.css` file outside the docs stylesheets themselves —
 * which is what makes `sb-ds-doc-section` (385 pages) and `responsive-frame-root--native`
 * (built inside a template literal, but written out in full) both read as alive.
 *
 * WHY AN ALLOWLIST RATHER THAN A COMMENT HATCH. `check-docs-token-literals.mjs`, the
 * sibling gate, lets an author justify a literal in a comment on the declaration. That
 * shape is wrong here: this stylesheet is more comment than CSS, nearly every ruleset
 * already carries a block comment above it, and a hatch that most of the corpus is
 * already standing in is not a hatch. The exempt population is also closed and small —
 * classes Storybook and its addons emit into the DOM, which this repo can never be the
 * source of. So they are listed HERE, by name, each with the package file that emits it,
 * verified against `node_modules` rather than asserted. A new one costs a line in this
 * file and a reviewer reads it.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────────────
 *  1. A CLASS ASSEMBLED FROM FRAGMENTS. `` `${base}--${mod}` `` never writes the full
 *     name anywhere, so a rule targeting the result would read as dead. The corpus has
 *     no such case today — ResponsiveFrame concatenates but spells each modifier out —
 *     and the check would rather be wrong loudly here than silently. If one appears,
 *     the fix is to spell the class out, which is also what makes it greppable.
 *  2. A CLASS EMITTED BUT NEVER RENDERED. `sb-plus-intro-token-grid` occurs once, in
 *     `Introduction.mdx`. This check sees an occurrence, not a page view; a rule for a
 *     component nobody navigates to is alive as far as this is concerned.
 *  3. A LIVE CLASS WITH A DEAD DECLARATION. `display: flex` on a class that exists but
 *     is out-`!important`-ed by a later block is unreachable in the way R1 cared about,
 *     and this reads selectors, not the cascade. Nothing here resolves specificity.
 *     That half of R1 is what `check:docs-chrome` measures, in a browser.
 *  4. TAG, ATTRIBUTE, PSEUDO AND ID SELECTORS. `div[scale="1"]` is Storybook's own
 *     inline attribute, `:fullscreen` is a state, and neither can be looked up in a
 *     source file. Only classes are checkable this way, so only classes are checked.
 *  5. STYLESHEETS OUTSIDE `.storybook/`. A component's own SCSS lives beside the
 *     component and is that component's business; this is the docs shell, which has no
 *     component to sit beside and is why it drifted.
 *
 * Usage:
 *   npm run check:docs-dead-selectors            report every dead selector; exit 1 if any
 *   npm run check:docs-dead-selectors -- --list  print the corpus and the counts,
 *                                                assert nothing, exit 0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

/**
 * The corpus, chosen the same way `check-docs-token-literals.mjs` chooses its own:
 * everything under `.storybook/` dresses the docs shell by construction, and a new
 * docs stylesheet dropped there is picked up without editing this file.
 */
const DOCS_STYLE_DIR = path.join(REPO_ROOT, '.storybook');

/** Where a class may be emitted from. Anything else is not a source of DOM. */
const SOURCE_EXTENSIONS = /\.(mdx|jsx?|tsx?|html|json|scss|css)$/;

/** Directories that hold no authored source. `.claude/` is worktrees, not code. */
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.claude',
  'dist',
  'storybook-static',
  'coverage',
  '.test-build',
]);

/**
 * Classes Storybook and its addons put in the DOM. This repo is not their source, so
 * no amount of grepping the repo will find them, and every one is legitimately styled
 * here — dressing Storybook's own chrome is what a docs stylesheet is FOR.
 *
 * Each was verified present in the installed packages rather than assumed: the file
 * named is where the string occurs at the version in `package.json`. Two former
 * members are NOT here on purpose — `toc-container` and `toc-title` occur nowhere in
 * `node_modules` at all, which is what makes them dead rather than vendor, and they
 * were written speculatively ("Storybook 8 TOC might lack .sbdocs-toc") against a
 * version this repo has never run.
 */
const VENDOR = new Map([
  ['sbdocs', 'storybook/dist/components/index.js'],
  ['sbdocs-wrapper', '@storybook/addon-docs/dist/blocks.js'],
  ['sbdocs-content', '@storybook/addon-docs/dist/blocks.js'],
  ['sbdocs-title', '@storybook/addon-docs/dist/blocks.js'],
  ['sbdocs-preview', '@storybook/addon-docs/dist/blocks.js'],
  ['sbdocs-preview-actions', '@storybook/addon-docs/dist/blocks.js'],
  ['sbdocs-toc', '@storybook/addon-docs/dist/blocks.js'],
  ['sbdocs-a', 'storybook/dist/core-server/presets/common-manager.js'],
  ['toc-wrapper', '@storybook/addon-docs/dist/blocks.js'],
  ['sb-main-padded', 'storybook/dist/_browser-chunks/ (preview runtime)'],
  ['docs-story', 'storybook/dist/csf/index.js'],
  ['docblock-argstable', 'storybook/dist/core-server/presets/common-manager.js'],
  ['docblock-argstable-head', 'storybook/dist/core-server/presets/common-manager.js'],
  ['innerZoomElementWrapper', 'storybook/dist/components/index.js'],
]);

// ── reading the stylesheet ──────────────────────────────────────────────────────────

/** Replace every comment with the same number of newlines, so line numbers survive. */
export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * Every class name in SELECTOR position, with the line it sits on.
 *
 * Declarations are skipped wholesale — `color-mix(in srgb, …)` and `url(.foo)` would
 * otherwise read as classes — and so are at-rule preludes, which hold no selectors.
 * The parser is a brace walk rather than a regex over the whole file because a
 * `@media` block's inner rulesets ARE selectors and have to be seen.
 */
export function selectorClasses(css) {
  const source = stripComments(css);
  const found = [];
  let buffer = '';
  let line = 1;
  let bufferStart = 1;

  const flush = () => {
    const prelude = buffer.trim();
    buffer = '';
    if (!prelude || prelude.startsWith('@')) return;
    // Line of the first class in this prelude, not of the `{`.
    for (const m of prelude.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
      const before = prelude.slice(0, m.index);
      found.push({ name: m[1], line: bufferStart + (before.match(/\n/g)?.length ?? 0) });
    }
  };

  let inBlock = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '\n') line += 1;
    if (ch === '{') {
      const prelude = buffer.trim();
      if (prelude.startsWith('@')) {
        // An at-rule: its body holds rulesets, so stay out of "declaration" mode.
        buffer = '';
        bufferStart = line;
      } else {
        flush();
        inBlock = true;
      }
      continue;
    }
    if (ch === '}') {
      buffer = '';
      bufferStart = line;
      inBlock = false;
      continue;
    }
    if (!inBlock) {
      if (!buffer.trim() && /\s/.test(ch)) bufferStart = line;
      buffer += ch;
    }
  }
  return found;
}

// ── reading the repo ────────────────────────────────────────────────────────────────

/** Every authored source file that could put a class in the DOM. */
export function sourceFiles(root, { skip = SKIP_DIRS, exclude = new Set() } = {}) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (skip.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (SOURCE_EXTENSIONS.test(entry.name) && !exclude.has(full)) out.push(full);
    }
  };
  walk(root);
  return out;
}

/**
 * The findings: a class in selector position that no source file spells out and that
 * the vendor list does not claim. First occurrence per class — a class dead on line
 * 400 is dead on line 415 for the same reason, and reporting both twice hides how
 * many DISTINCT selectors are dead.
 */
export function deadSelectors(classes, isEmitted, vendor = VENDOR) {
  const seen = new Set();
  const dead = [];
  for (const { name, line } of classes) {
    if (seen.has(name) || vendor.has(name) || isEmitted(name)) continue;
    seen.add(name);
    dead.push({ name, line });
  }
  return dead;
}

/** A membership test over the concatenated sources. Substring, for the reason in §1. */
export function emitterIndex(texts) {
  return (name) => texts.some((t) => t.includes(name));
}

// ── the CLI ─────────────────────────────────────────────────────────────────────────

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

  // A corpus that vanished is not a clean corpus. Same floor, same reason, as the
  // sibling gate: a check over nothing passes over everything.
  if (!files.length) {
    console.error(
      `[check:docs-dead-selectors] no .css under ${path.relative(REPO_ROOT, DOCS_STYLE_DIR)}.\n` +
        '  -> The docs stylesheet moved. A check over nothing passes over everything.',
    );
    return process.exit(1);
  }

  const excluded = new Set(files);
  const sources = sourceFiles(REPO_ROOT, { exclude: excluded });

  // The other floor, and the one that matters more here: this check declares a class
  // dead when it cannot FIND it. A source walk that silently returned twelve files
  // would report the whole stylesheet dead, which is the failure mode that would get
  // the check switched off rather than believed.
  if (sources.length < 500) {
    console.error(
      `[check:docs-dead-selectors] walked ${sources.length} source files — expected at least 500.\n` +
        '  -> The source walk broke. With no sources, every selector looks dead.',
    );
    return process.exit(1);
  }

  const texts = sources.map((f) => {
    try {
      return fs.readFileSync(f, 'utf8');
    } catch {
      return '';
    }
  });
  const isEmitted = emitterIndex(texts);

  if (process.argv.includes('--list')) {
    console.log(`check:docs-dead-selectors reads ${files.length} docs stylesheet(s):\n`);
    for (const f of files) {
      const n = new Set(selectorClasses(fs.readFileSync(f, 'utf8')).map((c) => c.name)).size;
      console.log(`  ${path.relative(REPO_ROOT, f).padEnd(46)} ${n} distinct classes in selector position`);
    }
    console.log(`\nagainst ${sources.length} source files, and ${VENDOR.size} vendor classes:\n`);
    for (const [name, where] of VENDOR) console.log(`  ${name.padEnd(26)} ${where}`);
    return process.exit(0);
  }

  const failures = [];
  for (const file of files) {
    const classes = selectorClasses(fs.readFileSync(file, 'utf8'));
    for (const d of deadSelectors(classes, isEmitted)) {
      failures.push({ file: path.relative(REPO_ROOT, file), ...d });
    }
  }

  if (!failures.length) {
    console.log(
      `✓ check:docs-dead-selectors — ${files.length} docs stylesheet(s), every class in selector position is emitted by something`,
    );
    return process.exit(0);
  }

  console.error(
    `[check:docs-dead-selectors] ${failures.length} class selector(s) nothing emits:\n`,
  );
  let current = '';
  for (const f of failures) {
    if (f.file !== current) {
      console.error(`  ${f.file}`);
      current = f.file;
    }
    console.error(`    :${String(f.line).padEnd(4)} .${f.name}`);
  }
  console.error(
    '\n  -> Delete the rule: nothing in this repo puts that class in the DOM, so it has' +
      '\n     never once applied. If the class is one Storybook or an addon emits, add it' +
      "\n     to VENDOR in scripts/check-docs-dead-selectors.mjs with the package file it" +
      '\n     comes from — verified, not assumed. If it is assembled from fragments in a' +
      '\n     template literal, spell it out in the source instead; that is also what makes' +
      '\n     it findable by the next person.',
  );
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
