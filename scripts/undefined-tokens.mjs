/**
 * Design tokens that are USED and never DEFINED.
 *
 * THE DEFECT. `var(--font-weight-light)` appears in six shipped components. No
 * such token exists — the file defines `--font-weight-normal: 300` — so the
 * declaration is invalid at computed-value time and the element takes its
 * inherited weight instead. Text designed at 300 renders at 400, in `Select`,
 * `Dropdown`, `Carousel`, `Scrollspy`, `MediaObject` and `RichTextEditor`.
 * `Tooltip` reaches for `--font-size-body4` and `--font-line-height-body4`,
 * neither of which exists, so its text has no size of its own at all.
 *
 * Measured 2026-08-29 over design-system/src, .storybook and prototypes: 145
 * token names used and never defined, across 508 uses.
 *
 * WHY NOTHING CAUGHT IT. `check:colour-fallbacks` and `check:size-fallbacks`
 * compare a fallback to its token and report an undefined `--color-*` or
 * `--size-*` on the way — but only for tokens written WITH a fallback, and only
 * in those two namespaces. Two thirds of these have no fallback at all, and the
 * worst of them are `--font-*`, which neither check looks at.
 * `check:doc-identifiers` resolves token names, but only the ones named in DOCS
 * PAGES; a token named in a stylesheet is outside its corpus.
 *
 * BARE VERSUS FALLEN BACK. The two are different defects and are counted
 * separately:
 *
 *   bare        `var(--x)` — the declaration is dropped. A rendering defect.
 *   with a      `var(--x, 14px)` — the page looks right and the token name is
 *   fallback    fiction. Nothing is broken until someone deletes the fallback
 *               believing the token is real.
 *
 * WHAT IS NOT A FINDING. A property a component defines on itself and reads
 * back — `NumberInput` sets `--bg-color` in an inline style object and reads it
 * in its SCSS — is defined, and this reads JS object keys as definitions so
 * that it says so. Names produced by SCSS interpolation (`--color-#{$name}`)
 * cannot be resolved statically at all; they are reported apart from the
 * findings rather than counted as either.
 */
import fs from 'node:fs';
import path from 'node:path';

const SEARCHED = /\.(scss|css|jsx|tsx|mdx|html)$/;

/** Every searched file under the roots, repo-relative. */
export function corpus(repoRoot, roots) {
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        walk(full);
      } else if (SEARCHED.test(entry.name)) {
        found.push(path.relative(repoRoot, full));
      }
    }
  };
  for (const root of roots) walk(path.join(repoRoot, root));
  return found.sort();
}

/**
 * Every custom property the corpus DEFINES.
 *
 * The optional quote is what makes a JS inline-style object count:
 * `{ '--bg-color': getBackgroundColor() }` defines the property on the element,
 * and a check that only read `--x:` from stylesheets would call every one of
 * those undefined.
 */
export function definitions(files) {
  const defined = new Set();
  for (const { text } of files) {
    for (const m of stripComments(text).matchAll(/(--[a-z][a-z0-9-]*)['"]?\s*:/g)) defined.add(m[1]);
  }
  return defined;
}

/**
 * Comments removed, positions preserved.
 *
 * `SessionManagementSnackbar.scss` carries `// 6px based on Figma
 * var(--modal/radius-md)`, and read literally that is a `var(--modal)` on a
 * token named `--modal` — a finding about a sentence. Replacing each comment
 * with the same number of spaces keeps every line number and offset intact, so
 * the report still points at the right line.
 *
 * `//` is only treated as a comment at a line start or after whitespace, which
 * is what keeps `https://` inside a string from swallowing the rest of its line.
 */
export function stripComments(text) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|\s)\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)));
}

/** Every `var(--x)` in the corpus, with whether it carries a fallback. */
export function usages(files) {
  const out = [];
  for (const { path: file, text: raw } of files) {
    const text = stripComments(raw);
    for (const m of text.matchAll(/var\(\s*(--[a-z][a-z0-9-]*)\s*(,?)/g)) {
      out.push({
        name: m[1],
        file,
        line: text.slice(0, m.index).split('\n').length,
        bare: m[2] !== ',',
      });
    }
  }
  return out;
}

/** A name SCSS interpolation produced, which no static read can resolve. */
export const isInterpolated = (name) => name.endsWith('-');

/**
 * Properties something OUTSIDE this repository defines.
 *
 * `--spacing` is Tailwind v4's own theme variable, set by Tailwind's generated
 * stylesheet, and `design-system/src/storybook-docs/ui/alert.tsx` is a vendored
 * shadcn component that reads it. Undefined here and defined at runtime — so
 * reporting it would be reporting a fact about this repo's boundary rather than
 * a defect, and the fix a reader would attempt (point it at a design token)
 * would break the component.
 *
 * Keep this list short and give every entry its owner. An allowlist is where a
 * check goes to stop being true.
 */
export const EXTERNAL = new Set(['--spacing']);

/**
 * `{name: {uses, bare, files}}` for every used-and-undefined token, plus the
 * interpolated names, which are reported and never counted.
 */
export function audit(files) {
  const defined = definitions(files);
  const counts = new Map();
  const interpolated = new Set();

  for (const use of usages(files)) {
    if (defined.has(use.name)) continue;
    if (isInterpolated(use.name)) {
      interpolated.add(use.name);
      continue;
    }
    if (EXTERNAL.has(use.name)) continue;
    if (!counts.has(use.name)) counts.set(use.name, { uses: 0, bare: 0, files: new Set() });
    const entry = counts.get(use.name);
    entry.uses += 1;
    if (use.bare) entry.bare += 1;
    entry.files.add(use.file);
  }

  const undefinedTokens = {};
  for (const [name, entry] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) {
    undefinedTokens[name] = { uses: entry.uses, bare: entry.bare, files: [...entry.files].sort() };
  }
  return { undefinedTokens, interpolated: [...interpolated].sort(), defined: defined.size };
}

/**
 * The ratchet. Counts may FALL and must never RISE, and a name that is no
 * longer used at all is itself reported — a baseline entry nothing matches is
 * a claim about code that has gone.
 *
 * @returns {string[]} One line per problem; empty when the tree is at or under
 *   its baseline.
 */
export function ratchetFailures(undefinedTokens, baseline) {
  const found = [];
  const recorded = baseline.tokens ?? {};

  for (const [name, entry] of Object.entries(undefinedTokens)) {
    const before = recorded[name];
    if (!before) {
      found.push(
        `NEW  ${name} — used ${entry.uses}x (${entry.bare} bare) and defined nowhere. ` +
          `First: ${entry.files[0]}`,
      );
      continue;
    }
    if (entry.uses > before.uses) {
      found.push(
        `ROSE ${name} — ${before.uses} recorded, ${entry.uses} now. The baseline may fall, ` +
          `never rise.`,
      );
    } else if (entry.bare > (before.bare ?? 0)) {
      found.push(
        `ROSE ${name} — ${before.bare} bare recorded, ${entry.bare} now. A bare use is a ` +
          `dropped declaration, not a cosmetic one.`,
      );
    }
  }

  for (const name of Object.keys(recorded)) {
    if (!undefinedTokens[name]) {
      found.push(
        `STALE ${name} — recorded, and no longer used-and-undefined. Remove the entry; a ` +
          `baseline nobody prunes stops being a measurement.`,
      );
    }
  }

  return found;
}
