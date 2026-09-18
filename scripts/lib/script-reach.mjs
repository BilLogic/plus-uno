/**
 * A script's REACH — the entry file plus every file under `scripts/` it can
 * reach by import, and the three questions the check registry asks of it.
 *
 * WHY IT EXISTS. `scripts/generate-check-scripts.mjs` asserts that a row
 * declaring a `baseline` is pointing at a record its check really reads. Until
 * #602 it asked that of the ENTRY FILE'S OWN TEXT, as a basename search — and
 * the two fallback checks passed it by luck: `check:colour-fallbacks` spells
 * `docs/evals/colour-fallback-baseline.json` in the `Family` literal it hands
 * to `scripts/lib/fallback-check.mjs`, and every piece of record logic — the
 * `openRatchet`, the read, the stale sweep, the `--update` write — is in that
 * file, one hop away. A source search that stops at the entry file therefore
 * says nothing about eleven of the twelve checks beyond "somebody typed the
 * name", and the way to make it say something for a check that reads its record
 * through the module is a header line naming a file the check no longer opens.
 * A cosmetic line is worse than no assertion: it is an assertion of the line.
 *
 * So the unit is the REACH, not the file. A check's lib is one or two hops
 * away, always under `scripts/`, so the walk is small, cheap and total.
 *
 * IT READS TEXT, NOT AN AST, and that is a deliberate ceiling. The questions
 * are "is this record opened through the module here", "is this flag offered
 * here" — both about a FORM a reader recognises, not about what the program
 * computes. A one-file regex pass over ~15 stripped sources answers them in
 * milliseconds with no dependency; an AST would answer the same questions and
 * still not resolve an identifier through a function parameter, which is what
 * `fallbackCheck`'s `baseline` is. What the ceiling costs is stated at each
 * question below, so a reader knows which way the answer errs.
 *
 * COMMENTS ARE STRIPPED FIRST. Every module in this repo argues for itself in a
 * block comment, and those comments NAME the forms this file looks for —
 * `scripts/lib/ratchet.mjs`'s own header spells `openRatchet({ file: BASELINE })`.
 * Unstripped, the assertion would pass on prose about the code.
 */

import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './corpus.mjs';

/** Block comments and whole-line `//` comments. A trailing `// note` stays. */
const strip = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

/** Every relative specifier: `import x from './y'`, `import './y'`, `import('./y')`. */
const SPECIFIER = /(?:\bfrom|\bimport)\s*\(?\s*['"](\.[^'"]+)['"]/g;

/** `const NAME = 'literal'` — the only binding this file resolves. */
const LITERAL_BINDING = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(['"])([^'"]*)\2/g;

/**
 * `{ baseline: NAME }` / `{ file: NAME }` — an identifier bound to WHOEVER
 * DECLARED the record rather than to a path. `fallbackCheck` destructures
 * `baseline: BASELINE` out of its `Family` argument and the path itself is
 * spelled by the caller, one hop back, so this is the binding that carries the
 * record across the hop.
 */
const DECLARED_BINDING = /\b(?:baseline|file)\s*:\s*([A-Za-z_$][\w$]*)\b/g;

/** `openRatchet({ … })`, and the `file:` inside it. */
const OPEN_RATCHET = /openRatchet\(\s*\{([^{}]*)\}/g;
const FILE_ARGUMENT = /\bfile\s*:\s*(?:(['"])([^'"]*)\1|([A-Za-z_$][\w$]*))/;

/** A flag read straight off `argv`, for a script that is not on `main()`. */
const ARGV_FLAG = /argv[^;\n]*\.includes\(\s*(['"])(--[\w-]+)\1/g;

/** What an identifier bound to the declaring row's own path resolves to. */
const DECLARED = Symbol('the record its caller declares');

/**
 * The keys of one of `main()`'s two flag objects, by brace matching from the
 * `flags:` / `fallThrough:` the slot is declared as. Both slots are object
 * literals of `'--flag': handler`, in every check that has one, and the slot a
 * flag is in is the whole question (#610): `flags` is terminal and
 * `fallThrough` prints and then still gates.
 */
function slotFlags(source, slot) {
  const found = new Set();
  const opener = new RegExp(`\\b${slot}\\s*:\\s*\\{`, 'g');
  for (let hit = opener.exec(source); hit; hit = opener.exec(source)) {
    let depth = 0;
    let end = hit.index + hit[0].length - 1;
    for (; end < source.length; end += 1) {
      if (source[end] === '{') depth += 1;
      else if (source[end] === '}' && (depth -= 1) === 0) break;
    }
    const body = source.slice(hit.index + hit[0].length, end);
    for (const [, , flag] of body.matchAll(/(['"])(--[\w-]+)\1\s*:/g)) found.add(flag);
  }
  return found;
}

/**
 * Walk a script's imports and answer what the registry asks of the result.
 *
 * @param {string} entry  repo-relative path to the entry script.
 * @param {object} [opts]
 * @param {string} [opts.repoRoot]
 * @param {string[]} [opts.notEvidence]  files walked for their own imports but
 *        never read as evidence. `scripts/lib/ratchet-shapes.mjs` is the one
 *        the registry passes: it is the survey of ALL TWELVE records, so it
 *        names every one of them by construction and naming one there is no
 *        evidence that THIS check reads THAT record.
 * @returns {ScriptReach}
 *
 * @typedef {object} ScriptReach
 * @property {string[]} files  the reach, entry first, repo-relative.
 * @property {(record: string) => boolean} names   is this path spelled anywhere
 *           in the reach? The weak question, and the one the registry asked of
 *           a basename before #602.
 * @property {(record: string) => boolean} opens   is this record opened through
 *           `scripts/lib/ratchet.mjs`? The strong one.
 * @property {(flag: string) => 'flags'|'fallThrough'|'argv'|null} slotOf  where
 *           a side flag is wired, and `null` when it is offered nowhere.
 */
export function reachOf(entry, { repoRoot = REPO_ROOT, notEvidence = [] } = {}) {
  const blind = new Set(notEvidence);
  const files = [];
  const sources = new Map();
  const queue = [entry];

  while (queue.length) {
    const file = queue.shift();
    if (sources.has(file)) continue;
    const absolute = path.join(repoRoot, file);
    if (!fs.existsSync(absolute)) continue;
    const source = strip(fs.readFileSync(absolute, 'utf8'));
    sources.set(file, source);
    files.push(file);
    for (const [, specifier] of source.matchAll(SPECIFIER)) {
      const resolved = path.relative(repoRoot, path.resolve(path.dirname(absolute), specifier));
      // Under `scripts/` only. A check that reached outside it for its record
      // logic would be a finding of a different kind, and the design system is
      // imported by several of these for their maths.
      if (resolved.startsWith(`scripts${path.sep}`)) queue.push(resolved.split(path.sep).join('/'));
    }
  }

  const evidence = files.filter((file) => !blind.has(file));
  const text = evidence.map((file) => sources.get(file)).join('\n');

  /** Identifier → the path it holds, or DECLARED for one carried across a hop. */
  const bound = new Map();
  for (const [, name, , value] of text.matchAll(LITERAL_BINDING)) bound.set(name, value);
  for (const [, name] of text.matchAll(DECLARED_BINDING)) {
    if (!bound.has(name)) bound.set(name, DECLARED);
  }

  const opened = new Set();
  for (const [, argument] of text.matchAll(OPEN_RATCHET)) {
    const hit = FILE_ARGUMENT.exec(argument);
    if (!hit) continue;
    if (hit[2] !== undefined) opened.add(hit[2]);
    else if (bound.has(hit[3])) opened.add(bound.get(hit[3]));
  }

  const names = (record) => text.includes(record);

  return {
    files,
    names,
    /*
     * An identifier that reached its value across a hop — `fallbackCheck`'s
     * `baseline` — resolves to "the record this reach declares", so it answers
     * for a record the reach also SPELLS and for no other. That is the ceiling
     * of a text read, and it errs towards passing: it cannot tell a reach that
     * opens the record it declares from one that opens a record it declares
     * somewhere else in the same reach. No check in this repo declares two.
     */
    opens: (record) => opened.has(record) || (opened.has(DECLARED) && names(record)),
    slotOf(flag) {
      for (const slot of ['flags', 'fallThrough']) {
        if (evidence.some((file) => slotFlags(sources.get(file), slot).has(flag))) return slot;
      }
      const typed = new Set();
      for (const [, , found] of text.matchAll(ARGV_FLAG)) typed.add(found);
      return typed.has(flag) ? 'argv' : null;
    },
  };
}
