/**
 * `npm run check:token-collision` — no component painting text in the same
 * token as the surface under it.
 *
 * WHY IT EXISTS. `Navbar` shipped a `primary` variant whose background was
 * `var(--color-primary)` and whose links were `var(--color-primary)`: one
 * token, both sides, 1.00:1 — text that is not low-contrast but absent (#219).
 * It had been on `main` since the component was written, through #153's
 * contrast sweep and through #198's fix to the twenty lines above it.
 *
 * WHY axe DOES NOT SEE IT. `.storybook/preview.jsx` runs axe at `test: 'error'`
 * over every story, and the `primary` story passed. axe's `color-contrast` rule
 * reads the background of the element's own box; a nav link sits in a
 * transparent container over the bar's painted background, and axe declines to
 * judge rather than guess wrong. Two further conditions in that same story hid
 * it as well: Storybook's preview loads Tailwind, whose `.collapse` utility is
 * `visibility: collapse`, and axe skips what is not visible. A gate that only
 * runs a browser cannot be the only gate for this.
 *
 * WHAT IT LOOKS AT. Not colour, and not contrast: identity. Two declarations in
 * ONE component stylesheet, naming ONE custom property, one as a background and
 * one as a foreground over it. That is mechanically decidable from the file, it
 * needs no browser, and it cannot be an accident — the ratio is exactly 1.00:1
 * every time. Contrast that is merely poor is a judgement call and stays with
 * axe and with review; this is the subset that never has a defensible answer.
 *
 * IT MODELS THE CASCADE, because the fix for #219 does not delete the offending
 * pair — it overrides it. `.plus-navbar .nav-link` still says
 * `color: var(--color-primary)` (the light bar wants it); the primary variant
 * re-states the same links at higher specificity in `--color-on-primary`. A
 * check that stopped at "both tokens appear in this file" would fail the fixed
 * file, so it would be turned off. So each candidate pair is exonerated when
 * another rule re-colours the same target in a different token, is guaranteed
 * to apply wherever that background is painted (its whole scope chain, not just
 * its first segment, matched by the painted element's — which is what excludes
 * both a sibling variant's rule and an override that only reaches part of the
 * painted subtree), and wins — on specificity, or on source order at a tie.
 * Which is also why the override list must spell out `:hover` and `.active`: at
 * equal specificity the cascade goes to source order, and so does this check.
 *
 * WHAT IT DELIBERATELY DOES NOT FLAG. A foreground token equal to a background
 * token painted on the SAME element the text sits in is visible to axe, which
 * measures it properly — so an element that paints its own background is left
 * to axe. Sibling variant scopes (`.x-bg-light` vs `.x-bg-dark`) never co-apply
 * and are not compared. And nothing outside `design-system/src` is read:
 * prototypes are not the source of truth, and a prototype's stylesheet going
 * red would teach people to pass `--allow`.
 *
 * Usage:
 *   npm run check:token-collision           report every surviving pair; exit 1 if any
 *   npm run check:token-collision -- --list  print what was scanned and exit 0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SCAN_ROOT = path.join(REPO_ROOT, 'design-system', 'src');

/** Properties that paint the box behind the text. */
const BACKGROUND_PROPS = new Set(['background', 'background-color']);

/**
 * The marker an interpolation collapses to. Deliberately matches nothing that
 * `classesOf`, `specificity` or `tokenOf` reads, so an interpolated selector
 * segment carries no class of its own and an interpolated value is never
 * mistaken for a raw token.
 */
const INTERPOLATION = '#*';

/**
 * Blanks what only LOOKS like structure — comment bodies, string contents and
 * `#{…}` interpolations — keeping every newline, every real brace and every
 * real semicolon exactly where they were.
 *
 * NEWLINES ARE KEPT, because a reported `:line` has to be the line in the file
 * on disk. Replacing a block comment with the empty string took its newlines
 * with it and shifted every number below it. The sibling
 * `check-unspread-rest.mjs`, written the same week, kept its newlines
 * deliberately and said why; this one did not, and the two have agreed since
 * #233.
 *
 * COMMENTS AND STRINGS ARE ONE PASS, not two. A `/*` inside a string opens no
 * comment and an apostrophe inside a comment opens no string, so a regex that
 * removes comments before anything has looked for strings cannot get either
 * right.
 *
 * STRING CONTENTS GO, THE QUOTES STAY. That is what makes `content: "}"` and
 * `content: ";"` harmless: `flatten` counts braces and splits on `;`, and a
 * quoted one is neither. Nothing is lost by emptying them — `tokenOf` was
 * never going to read a quoted literal as a token.
 *
 * `#{…}` GOES THE SAME WAY, and this one is live rather than hypothetical:
 * `Alert`, `Badge`, `Button`, `Dropdown` and `LoadingGif` all interpolate, and
 * each `#{` used to open a block the file never opened — mangling the head it
 * was reading and the declaration it sat in.
 *
 * WHAT IT STILL DOES NOT MODEL, said plainly so nobody trusts it further than
 * it goes. An unquoted `url(…)` holding a `;` or a brace would still split a
 * declaration; the corpus has none, and the `prev !== ':'` guard below is the
 * only nod to it. This front end is hand-rolled because the `harness` workflow
 * runs without an `npm ci` — which is what keeps the gate at ~16s — so the job
 * is to bound these, not to pretend they are gone.
 */
export function blank(src) {
  let out = '';
  let i = 0;
  // Last non-whitespace character emitted, for the `//`-after-`:` guard.
  let prev = '';

  const newlines = (from, to) => {
    for (let k = from; k < to; k++) if (src[k] === '\n') out += '\n';
  };

  while (i < src.length) {
    const c = src[i];
    const c2 = src[i + 1];

    // `//` to end of line. The newline itself is left for the next iteration.
    if (c === '/' && c2 === '/' && prev !== ':') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }

    if (c === '/' && c2 === '*') {
      const start = i;
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i = Math.min(i + 2, src.length);
      newlines(start, i);
      continue;
    }

    if (c === "'" || c === '"') {
      // A quote opens a string only if it closes on the same line: a CSS string
      // cannot hold a raw newline, and without that bound one stray apostrophe
      // blanks the rest of the file. Over-blanking is the dangerous direction —
      // it is how a check ends up reporting green over code it never read.
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      if (src[j] === c) {
        out += c + c;
        prev = c;
        i = j + 1;
        continue;
      }
      // Not a string. Fall through and emit the quote as the character it is.
    }

    if (c === '#' && c2 === '{') {
      const start = i;
      i += 2;
      for (let depth = 1; i < src.length && depth; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') depth--;
        else if (src[i] === "'" || src[i] === '"') {
          const quote = src[i];
          while (++i < src.length && src[i] !== quote && src[i] !== '\n');
        }
      }
      out += INTERPOLATION;
      newlines(start, i);
      prev = '*';
      continue;
    }

    out += c;
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out;
}

/**
 * Flattens SCSS into resolved `{ selector, prop, value, line }` declarations.
 * `&` is substituted, nested blocks are joined with a descendant combinator,
 * and selector lists are expanded — so every declaration below carries the
 * selector a browser would match it with.
 */
export function flatten(src) {
  const text = blank(src);
  const declarations = [];
  const stack = [[]];
  let buffer = '';
  let line = 1;

  for (const ch of text) {
    if (ch === '\n') line++;
    if (ch === '{') {
      const head = buffer.trim();
      buffer = '';
      const parent = stack[stack.length - 1];
      // `@media`/`@supports`/`@layer` keep the enclosing selector scope. Any
      // other at-rule (`@mixin`, `@keyframes`, `@function`) has no selector we
      // can resolve without evaluating Sass, so its body is skipped entirely.
      stack.push(head.startsWith('@') ? (/^@(media|supports|layer)\b/.test(head) ? parent : null) : resolve(parent, head));
    } else if (ch === '}') {
      // The root frame is never popped. Braces that do not balance — from
      // something `blank` above still mis-reads, or from a file that simply
      // does not compile — used to empty the stack, leave `scope` undefined
      // below, and silently drop every declaration from that point on: the
      // rest of the file unchecked, reported exactly like a clean file.
      // Degrading to "resolved at the root" reports something; dropping the
      // remainder reports nothing, which is the failure this check exists to
      // stop happening to somebody else.
      if (stack.length > 1) stack.pop();
      buffer = '';
    } else if (ch === ';') {
      const decl = buffer.trim();
      buffer = '';
      const scope = stack[stack.length - 1];
      const m = decl.match(/^([-a-z]+)\s*:\s*(.+)$/i);
      if (scope?.length && m) {
        for (const selector of scope) {
          declarations.push({ selector, prop: m[1].toLowerCase(), value: m[2].trim(), line });
        }
      }
    } else {
      buffer += ch;
    }
  }
  return declarations;
}

function resolve(parents, head) {
  const parts = head.split(',').map((s) => s.trim()).filter(Boolean);
  if (!parents?.length) return parts;
  const out = [];
  for (const parent of parents) {
    for (const part of parts) out.push(part.includes('&') ? part.replace(/&/g, parent) : `${parent} ${part}`);
  }
  return out;
}

/** `var(--x)` and nothing else — a token used raw, which is what a pair needs. */
export const tokenOf = (value) => value.match(/^var\(\s*(--[a-z0-9-]+)\s*\)\s*$/i)?.[1] ?? null;

const chain = (selector) => selector.split(/\s*[>+~]\s*|\s+/).filter(Boolean);
const classesOf = (part) => new Set((part.match(/\.[-a-z0-9_]+/gi) ?? []).map((c) => c.toLowerCase()));
const subset = (a, b) => [...a].every((x) => b.has(x));
const target = (selector) => chain(selector).at(-1).toLowerCase();

/** CSS specificity as `[ids, classes+attrs+pseudo-classes, elements]`. */
export function specificity(selector) {
  const s = selector.replace(/::[-a-z0-9]+/gi, ' ');
  const ids = (s.match(/#[-a-z0-9_]+/gi) ?? []).length;
  const classes =
    (s.match(/\.[-a-z0-9_]+/gi) ?? []).length +
    (s.match(/\[[^\]]*\]/g) ?? []).length +
    (s.match(/:[-a-z0-9]+(\([^)]*\))?/gi) ?? []).length;
  const elements = (s.match(/(^|[\s>+~])[a-z][-a-z0-9]*/gi) ?? []).length + (selector.match(/::[-a-z0-9]+/gi) ?? []).length;
  return [ids, classes, elements];
}

const beats = (a, b) => {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return null; // a tie — the caller decides on source order
};

/**
 * Can the foreground rule match an element inside the background rule's painted
 * subtree? Compared position by position: the compounds must be reconcilable
 * (one's classes a subset of the other's), which is what keeps two sibling
 * variants of the same block — `.x-bg-light` and `.x-bg-dark` — apart.
 */
export function reachable(bgSelector, fgSelector) {
  const bg = chain(bgSelector);
  const fg = chain(fgSelector);
  if (bg.length > fg.length) return false;
  for (let i = 0; i < bg.length; i++) {
    const a = classesOf(bg[i]);
    const b = classesOf(fg[i]);
    if (!subset(a, b) && !subset(b, a)) return false;
  }
  return true;
}

/**
 * One file's surviving pairs. Exported for the tests, which is the only way to
 * watch a guard fail on purpose (#191).
 */
export function collisions(source) {
  const declarations = flatten(source);
  const backgrounds = declarations
    .filter((d) => BACKGROUND_PROPS.has(d.prop) && tokenOf(d.value))
    .map((d) => ({ ...d, token: tokenOf(d.value) }));
  const foregrounds = declarations
    .filter((d) => d.prop === 'color' && tokenOf(d.value))
    .map((d) => ({ ...d, token: tokenOf(d.value) }));

  // Elements that paint their own background are axe's job, not this one.
  const selfPainted = new Set(backgrounds.map((b) => target(b.selector)));

  const found = [];
  for (const fg of foregrounds) {
    if (selfPainted.has(target(fg.selector))) continue;
    for (const bg of backgrounds) {
      if (bg.token !== fg.token) continue;
      if (!reachable(bg.selector, fg.selector)) continue;
      if (overridden({ bg, fg, foregrounds })) continue;
      found.push({ bg, fg });
      break;
    }
  }
  return found;
}

/**
 * Does the override apply EVERYWHERE that background is painted? Its scope —
 * every segment before the one naming the target — has to be matched by the
 * painted element's own chain, in order, each of the override's compounds a
 * subset of the painted segment it lands on. `.plus-navbar .nav-link` qualifies
 * against `.plus-navbar.plus-navbar-bg-primary`; `.plus-navbar .card .nav-link`
 * does not, because it only re-colours the links that happen to sit inside a
 * `.card` and leaves every other link on the painted bar exactly as it was.
 *
 * Comparing only the first segment — what this did until #233 — answered a
 * question about the whole chain by looking at one end of it, and answered it
 * in the exonerating direction: a real collision dismissed by a comparison that
 * never looked at the segment that made the override conditional.
 *
 * Matched as a subsequence, not position for position, because a descendant
 * combinator is not positional: `.b .nav-link` does apply inside `.a .b`.
 */
function scopedInside(ovSelector, bgSelector) {
  const scope = chain(ovSelector).slice(0, -1);
  const painted = chain(bgSelector);
  let i = 0;
  for (const segment of scope) {
    const classes = classesOf(segment);
    while (i < painted.length && !subset(classes, classesOf(painted[i]))) i++;
    if (i === painted.length) return false;
    i++;
  }
  return true;
}

/**
 * Is the pair already neutralised by the cascade? True when some other rule
 * re-colours the same target in a different token, is guaranteed to apply
 * wherever that background is painted, and wins — on specificity, or on source
 * order at a tie.
 */
function overridden({ bg, fg, foregrounds }) {
  const fgSpecificity = specificity(fg.selector);
  return foregrounds.some((ov) => {
    if (ov === fg || ov.token === bg.token) return false;
    if (target(ov.selector) !== target(fg.selector)) return false;
    if (!scopedInside(ov.selector, bg.selector)) return false;
    const wins = beats(specificity(ov.selector), fgSpecificity);
    return wins === null ? ov.line > fg.line : wins;
  });
}

function scssFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...scssFiles(p));
    else if (entry.name.endsWith('.scss')) out.push(p);
  }
  return out.sort();
}

function main() {
  const files = scssFiles(SCAN_ROOT);

  // A corpus that vanished is not a clean corpus. If SCAN_ROOT is renamed or moved,
  // every walk below returns nothing, every assertion holds vacuously, and this exits
  // 0 having examined no files at all. check-storybook.mjs took the same floor for the
  // same reason. The number is a floor, not a target — raise it only when it bites.
  if (files.length < 100) {
    console.error(
      `[check:token-collision] found ${files.length} file(s) under ${path.relative(REPO_ROOT, SCAN_ROOT)} — expected at least 100.\n` +
        '  -> The corpus moved or the walk broke. A check over nothing passes over everything.',
    );
    return 1;
  }

  if (process.argv.includes('--list')) {
    console.log(`check:token-collision reads ${files.length} stylesheets under design-system/src:\n`);
    for (const f of files) console.log(`  ${path.relative(REPO_ROOT, f)}`);
    process.exit(0);
  }

  const failures = [];
  for (const file of files) {
    for (const { bg, fg } of collisions(fs.readFileSync(file, 'utf8'))) {
      failures.push({ file: path.relative(REPO_ROOT, file), bg, fg });
    }
  }

  if (!failures.length) {
    console.log(
      `✓ check:token-collision — ${files.length} stylesheets, no foreground token equal to the background beneath it`,
    );
    process.exit(0);
  }

  console.error(
    `[check:token-collision] ${failures.length} foreground/background pair(s) share one token — 1.00:1, invisible text:\n`,
  );
  for (const { file, bg, fg } of failures) {
    console.error(`  ${file}`);
    console.error(`    ${bg.selector}  { ${bg.prop}: var(${bg.token}) }   :${bg.line}`);
    console.error(`    ${fg.selector}  { color: var(${fg.token}) }   :${fg.line}`);
  }
  console.error(
    '\n  -> Give the foreground the token that pairs with that background — the `on-*`' +
      '\n     role for it — scoped to the variant that paints it. Spell out `:hover`,' +
      '\n     `:focus` and `.active` in the override: at equal specificity the cascade' +
      '\n     goes to source order, and so does this check.',
  );
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
