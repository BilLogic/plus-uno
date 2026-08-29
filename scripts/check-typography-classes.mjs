/**
 * `npm run check:typography-classes` — every `*-txt` class a page asks for is a
 * class that sets type.
 *
 * WHY IT EXISTS. `.body1-txt`, `.display2-txt` and friends are this system's
 * typography utilities, and the convention is legible enough that people extend
 * it by guessing. Nobody guessed wrong about body or display. Everybody guessed
 * wrong about headings: `.h1-txt` … `.h6-txt` HAVE NEVER EXISTED — headings are
 * `.h1` … `.h6` and the bare elements — and eleven places asked for them
 * anyway, including two of the design system's own prototype pages and a
 * guidelines example teaching the mistake to the next reader.
 *
 * WHAT A MISSING UTILITY CLASS LOOKS LIKE, and why nothing caught it: it looks
 * like nothing. `<h1 className="h2-txt">` renders — as an `h1`, at 40px, where
 * 32px was asked for. There is no console warning, no build error, no failing
 * assertion; CSS has no concept of a class that was meant to exist. The page is
 * simply one step up the scale from what the author wrote, forever.
 *
 * WHAT IS CHECKED. Every identifier ending `-txt` that appears in a JSX, TSX,
 * JS, MDX or MD file under the corpus roots must be matched by a CSS rule, in
 * this repo's stylesheets, whose block sets a typography property —
 * `font-size`, `font-family`, `font-weight`, `line-height` — or `@extend`s one
 * of the `%font-*` placeholders that set them.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────
 *
 *  1. A CLASS THAT EXISTS AS A SELECTOR BUT SETS NO TYPE. This is not a blind
 *     spot, it is the whole point, and it is worth stating because the
 *     distinction is what makes the check work at all. `Badge.scss` carries
 *     `&.h4-txt { padding-left: … }`. That rule matches — an element with both
 *     classes gets the padding — so a check that asked "is this class mentioned
 *     anywhere?" would have gone green on the very defect it was written for. A
 *     `-txt` class that sets padding and no type is not a typography utility;
 *     it is a selector waiting for one that never arrived.
 *  2. CLASS NAMES THIS FILE CANNOT SEE. Only literal identifiers are matched.
 *     `className={`${size}-txt`}` composes a name at runtime out of a variable
 *     and is invisible here. Resolving it would mean evaluating the program.
 *  3. WHETHER THE CLASS IS THE RIGHT ONE. `.body3-txt` on a page heading is
 *     defined, applied, and wrong. This check knows existence, not intent.
 *  4. STYLES FROM OUTSIDE THIS REPO. Bootstrap ships no `-txt` class, so the
 *     corpus is this repo's own stylesheets. A dependency that started
 *     shipping them would read here as undefined — correctly, since a utility
 *     this system documents should be one this system defines.
 *  5. THE REVERSE DIRECTION. A `-txt` class defined and used nowhere is not
 *     reported. Dead CSS is a different check with a different corpus, and
 *     folding it in would make one exit code answer two questions.
 *
 * NO BASELINE, NO RATCHET. The count that is correct is zero, and it is zero
 * today. A recorded baseline would be a place for the next one to hide.
 *
 * Run: npm run check:typography-classes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Where pages and stylesheets live. Both directions read the same roots. */
export const ROOTS = ['design-system', 'prototypes', '.storybook', 'docs'];

/** Files that can ASK for a class. */
const USE_EXT = new Set(['.jsx', '.tsx', '.js', '.mdx', '.md']);

/** Files that can DEFINE one. */
const DEF_EXT = new Set(['.scss', '.css']);

/**
 * The properties that make a rule a typography rule.
 *
 * `@extend %font-…` is included because that is how `_fonts.scss` shares them:
 * `.body1-txt` sets a size and a line-height of its own and inherits family and
 * weight from `%font-body`. A check that demanded all four inline would call
 * the real classes undefined.
 */
const TYPE_PROPERTY = /(^|[\s;{])(font-size|font-family|font-weight|line-height|font)\s*:|@extend\s+%font-/;

/** Every `something-txt` identifier, wherever it appears. */
const TXT_CLASS = /\b([a-z][a-z0-9]*(?:-[a-z0-9]+)*-txt)\b/g;

export function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/**
 * The block a selector opens, as source text.
 *
 * Brace-matched from the first `{` after the offset, so a nested rule returns
 * only its own body — which is what lets `&.h4-txt { padding }` be told apart
 * from a rule that sets type. Deliberately naive about braces inside strings
 * and comments; a stylesheet with an unbalanced brace in a comment would read
 * long here, and would also not compile.
 */
export function blockAfter(source, offset) {
  const open = source.indexOf('{', offset);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return source.slice(open);
}

/**
 * Classes whose rule sets type, mapped to where.
 *
 * The selector text between the class and the `{` is checked for a comma: a
 * class listed in `a, .b-txt { … }` is defined by that block, but a class that
 * appears after the block opened is inside it and is a different rule.
 */
export function definedClasses(files) {
  const defined = new Map();
  for (const file of files) {
    if (!DEF_EXT.has(path.extname(file))) continue;
    const source = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    for (const match of source.matchAll(TXT_CLASS)) {
      const name = match[1];
      const body = blockAfter(source, match.index);
      if (!TYPE_PROPERTY.test(body)) continue;
      if (!defined.has(name)) defined.set(name, []);
      defined.get(name).push(file);
    }
  }
  return defined;
}

/** Every place a `-txt` class is asked for, as `{ class, file, line }`. */
export function usedClasses(files) {
  const uses = [];
  for (const file of files) {
    if (!USE_EXT.has(path.extname(file))) continue;
    const source = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    const lines = source.split('\n');
    lines.forEach((text, index) => {
      for (const match of text.matchAll(TXT_CLASS)) {
        uses.push({ class: match[1], file, line: index + 1 });
      }
    });
  }
  return uses;
}

/**
 * The nearest defined class, by name, for the report.
 *
 * Only the obvious rewrite is offered — `h2-txt` → `h2` — because the mistake
 * this catches is a suffix added to a name that was already right. Anything
 * cleverer would be guessing.
 */
export function suggestionFor(name) {
  const stem = name.slice(0, -'-txt'.length);
  return /^h[1-6]$/.test(stem) ? `.${stem}` : null;
}

export function report(missing) {
  const byClass = new Map();
  for (const use of missing) {
    if (!byClass.has(use.class)) byClass.set(use.class, []);
    byClass.get(use.class).push(use);
  }
  const blocks = [...byClass.entries()].map(([name, uses]) => {
    const hint = suggestionFor(name);
    return (
      `  .${name} — asked for ${uses.length} time${uses.length === 1 ? '' : 's'}, defined nowhere\n` +
      uses.map((u) => `      ${u.file}:${u.line}`).join('\n') +
      (hint ? `\n      → this system's heading class is ${hint}; there is no -txt form.` : '')
    );
  });
  return (
    `[typography-classes] ${missing.length} use${missing.length === 1 ? '' : 's'} of a ` +
    `*-txt class that no rule defines:\n\n${blocks.join('\n\n')}\n\n` +
    '  A class that does not exist does not fail — the element simply keeps its own\n' +
    '  type, one step off the scale that was asked for, with nothing to notice it.'
  );
}

function main() {
  const files = ROOTS.flatMap((root) => walk(path.join(REPO_ROOT, root))).map((f) =>
    path.relative(REPO_ROOT, f),
  );

  const defined = definedClasses(files);
  const uses = usedClasses(files);
  const missing = uses.filter((u) => !defined.has(u.class));

  if (missing.length) {
    console.error(report(missing));
    process.exit(1);
  }

  const names = [...defined.keys()].sort();
  console.log(
    `[typography-classes] ${uses.length} uses across ${ROOTS.length} roots, all resolving to ` +
      `${names.length} defined classes:\n  ${names.join(' ')}`,
  );
}

// Importing this module for its exports must not run the check.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
