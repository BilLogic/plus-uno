/**
 * `npm run check:unspread-rest` — no component collecting a rest element and
 * then never using it.
 *
 * WHY IT EXISTS. `DateAndTimePicker` destructured `...props` in its signature
 * and spread it onto nothing (#230). Every prop a caller passed beyond the
 * declared list was collected into an object the component then dropped on the
 * floor. It had been that way since the component was written, next door to
 * `Input`, which collects the same rest element and spreads it — so two members
 * of one family disagreed about a contract callers reasonably assume is shared.
 *
 * WHY NOTHING ELSE SEES IT. The failure is silent in every direction. React does
 * not warn: a rest element that is never read is legal JavaScript. `propTypes`
 * does not warn: unknown props are simply absent from the shape, so there is
 * nothing to validate. And the browser suite cannot see it either, because
 * nothing renders wrong — the component draws exactly as before. What is missing
 * is an attribute the caller asked for and never checked, which is why the props
 * lost this way are so consistently the accessibility ones: `aria-describedby`,
 * `aria-errormessage`, `data-testid`. A caller wires up a validation message,
 * sees no error anywhere, and ships a field that is never associated with its
 * error text.
 *
 * That makes it the same shape as #219, which `check:token-collision` was built
 * for: a defect the existing tooling is structurally unable to observe, and
 * mechanically decidable from the file without running anything.
 *
 * WHAT IT LOOKS AT. One fact, and a conservative one: an identifier that appears
 * after `...` and appears NOWHERE ELSE in the file. That is decidable without
 * resolving scope, and it has no innocent reading — a rest element that is bound
 * and never referenced is either a dropped contract or dead syntax, and both
 * want deleting or spreading. It deliberately does not ask whether the reference
 * it finds is a *spread*: a component that reads `props.className` and forwards
 * nothing else has made a choice, and a check that argued with it would be
 * arguing about design rather than reporting a fact.
 *
 * WHAT IT DOES NOT CATCH, said plainly so nobody trusts it further than it goes.
 * A rest element referenced once in some way that is not a forward — logged,
 * counted, destructured again — reads as used and passes. The class it closes is
 * the silent-total-drop, which is the one that shipped.
 *
 * WHY ONLY `design-system/src/components`. That directory is the published
 * library: its prop contract is what callers depend on and what the MDX pages
 * document, so a dropped rest element there is a broken promise. `specs/` is
 * page mockups composed FROM the library, and nine of them have the same shape
 * (#230 swept them) — but their roots are other React components, mostly
 * `PageLayout`, not DOM elements, so "where would it spread" is a real design
 * question per file rather than a mechanical fix, and answering it wrong forwards
 * arbitrary DOM attributes into another component's contract. Those are reported
 * in #230, not silenced here. `prototypes/` is out for the reason
 * `check:token-collision` gives for the same boundary: prototypes are not the
 * source of truth, and a prototype going red teaches people to reach for a
 * bypass flag.
 *
 * Usage:
 *   npm run check:unspread-rest            report every finding; exit 1 if any
 *   npm run check:unspread-rest -- --list  print what was scanned; exit 0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SCAN_ROOT = path.join(REPO_ROOT, 'design-system', 'src', 'components');

/**
 * Keywords that can follow `...` in a spread expression. Without these,
 * `[...new Set(x)]` reads as a rest element named `new` that is never
 * referenced — the one false positive the first sweep for #230 produced.
 */
const KEYWORDS = new Set([
  'new', 'this', 'await', 'typeof', 'void', 'super', 'yield', 'delete', 'function', 'class',
]);

const boundary = (name) => new RegExp(`(?<![\\w$])${name.replace(/\$/g, '\\$')}(?![\\w$])`, 'g');

/**
 * Blanks comments, string literals, template text and regex literals, keeping
 * every newline so reported line numbers match the file on disk.
 *
 * Comments have to be found by the same pass as strings, not before it — the
 * `//` in a `"https://…"` opens no comment, and a `/* ` inside a string opens no
 * block. Code inside a template's `${…}` is kept, because a rest element really
 * can be referenced there.
 *
 * Getting this wrong in the blanking direction is the dangerous one: over-blank
 * real code and a component that DOES spread reads as one that does not, which
 * is how a check earns a reputation for lying and gets switched off. Hence the
 * conservative regex heuristic below, which prefers to treat an ambiguous `/` as
 * division and keep the text.
 */
export function strip(src) {
  let out = '';
  let i = 0;
  // Last non-whitespace character emitted, for the regex-vs-division decision.
  let prev = '';

  const keepNewlines = (from, to) => {
    for (let k = from; k < to; k++) if (src[k] === '\n') out += '\n';
  };

  while (i < src.length) {
    const c = src[i];
    const c2 = src[i + 1];

    if (c === '/' && c2 === '/') {
      const start = i;
      while (i < src.length && src[i] !== '\n') i++;
      keepNewlines(start, i);
      continue;
    }

    if (c === '/' && c2 === '*') {
      const start = i;
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i = Math.min(i + 2, src.length);
      keepNewlines(start, i);
      continue;
    }

    if (c === "'" || c === '"') {
      // A quote only opens a string if it closes on the same line — a JS string
      // literal cannot contain a raw newline. Without that bound, the apostrophe
      // in JSX text (`<p>Bill's session</p>`) opens a string that runs to the
      // next apostrophe in the file and blanks every line between, which is the
      // over-blanking that turns a spread into a missing one. Observed on
      // `StudentDashboard.stories.jsx` while building this (#230).
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== '\n') {
        if (src[j] === '\\') j++;
        j++;
      }
      if (j < src.length && src[j] === c) {
        i = j + 1;
        prev = c;
        continue;
      }
      // Not a string: emit the quote as the text it is.
    }

    // A `/` starts a regex only where a value cannot already have ended.
    //
    // `}` is deliberately NOT in this set. In plain JS it does precede a regex
    // (`if (x) {} /re/.test(s)`), but this corpus is JSX, where `}` far more often
    // closes an expression container and is followed by `/>`: two self-closing tags
    // on one line — `<Foo {...a} /> <b {...rest} />` — then read as a regex literal
    // spanning from the first `/>` to the second, blanking the real spread between
    // them and reporting BOTH rest elements as dropped. That is the over-blanking
    // this file's header promises not to do, and it fails correct code, which is how
    // a check gets switched off. Missing a regex after `}` costs a false negative on
    // a construct that does not appear in this corpus; the trade is deliberate.
    if (c === '/' && (prev === '' || '(,=:[!&|?;+-*%~^<>'.includes(prev))) {
      const start = i;
      let j = i + 1;
      let ok = false;
      let inClass = false;
      while (j < src.length) {
        const d = src[j];
        if (d === '\\') { j += 2; continue; }
        if (d === '\n') break;            // regex literals do not span lines
        if (d === '[') inClass = true;
        else if (d === ']') inClass = false;
        else if (d === '/' && !inClass) { ok = true; break; }
        j++;
      }
      if (ok) {
        i = j + 1;
        while (i < src.length && /[a-z]/.test(src[i])) i++; // flags
        keepNewlines(start, i);
        prev = '/';
        continue;
      }
      // Not a regex after all — fall through and emit the `/` as division.
    }

    if (c === '`' && src.indexOf('`', i + 1) !== -1) {
      i++;
      // Walk the template, blanking its text but keeping `${…}` expressions.
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '\n') { out += '\n'; i++; continue; }
        if (src[i] === '`') { i++; break; }
        if (src[i] === '$' && src[i + 1] === '{') {
          out += '  ';
          i += 2;
          let depth = 1;
          // Re-enter the main lexer for the expression by copying it verbatim
          // and letting the recursion below handle its own strings.
          const exprStart = i;
          while (i < src.length && depth > 0) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') depth--;
            if (depth > 0) i++;
          }
          out += strip(src.slice(exprStart, i));
          i++; // past the closing `}`
          continue;
        }
        i++;
      }
      prev = '`';
      continue;
    }

    out += c;
    if (!/\s/.test(c)) prev = c;
    i++;
  }

  return out;
}

/**
 * Rest elements bound in `src` and referenced nowhere else in it.
 * @returns {{name: string, line: number}[]}
 */
export function unspread(src) {
  const code = strip(src);
  const findings = [];
  const seen = new Set();

  for (const m of code.matchAll(/\.\.\.\s*([A-Za-z_$][\w$]*)/g)) {
    const name = m[1];
    if (KEYWORDS.has(name) || seen.has(name)) continue;
    seen.add(name);
    if ((code.match(boundary(name)) ?? []).length === 1) {
      findings.push({ name, line: code.slice(0, m.index).split('\n').length });
    }
  }

  return findings;
}

const sourceFiles = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(p));
    else if (/\.jsx?$/.test(entry.name)) out.push(p);
  }
  return out;
};

function main() {
  const list = process.argv.slice(2).includes('--list');
  const files = sourceFiles(SCAN_ROOT).sort();

  // A corpus that vanished is not a clean corpus. If SCAN_ROOT is renamed or moved,
  // every walk below returns nothing, every assertion holds vacuously, and this exits
  // 0 having examined no files at all. check-storybook.mjs took the same floor for the
  // same reason. The number is a floor, not a target — raise it only when it bites.
  if (files.length < 100) {
    console.error(
      `[check:unspread-rest] found ${files.length} file(s) under ${path.relative(REPO_ROOT, SCAN_ROOT)} — expected at least 100.\n` +
        '  -> The corpus moved or the walk broke. A check over nothing passes over everything.',
    );
    return 1;
  }

  if (list) {
    console.log(
      `[check:unspread-rest] ${files.length} file(s) under ` +
        `${path.relative(REPO_ROOT, SCAN_ROOT)}`,
    );
    return 0;
  }

  const findings = [];
  for (const file of files) {
    for (const f of unspread(fs.readFileSync(file, 'utf8'))) {
      findings.push(`${path.relative(REPO_ROOT, file)}:${f.line}  ...${f.name}`);
    }
  }

  if (findings.length) {
    console.error(
      `[check:unspread-rest] ${findings.length} rest element(s) collected and never used:\n` +
        findings.map((f) => `  ${f}`).join('\n') +
        '\n\n  -> The component takes everything the caller passed beyond its declared' +
        '\n     signature and drops it. Nothing warns: React allows an unused rest' +
        '\n     element and propTypes never sees unknown props, so the props lost are the' +
        '\n     ones nobody checks — aria-describedby, aria-errormessage, data-testid.' +
        '\n     Spread it onto the element the caller means (see DateAndTimePicker.mdx' +
        '\n     § Accessibility for how to choose when there is more than one), or drop' +
        '\n     the rest element from the signature so the contract is honest.',
    );
    return 1;
  }

  console.log(`[check:unspread-rest] ${files.length} component file(s), no dropped rest elements.`);
  return 0;
}

// path.resolve + fileURLToPath, not string comparison: `file://${argv[1]}` never
// matches once the repo path contains a space or any non-ASCII char, because the
// URL form percent-encodes them. This check silently did nothing under such a
// path — exit 0, main() never invoked. Same idiom as check-token-collision.mjs.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
