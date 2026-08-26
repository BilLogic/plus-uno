/**
 * The overlap guard — one rule, one home.
 *
 * A skill is two faces over one method (`AGENTS.md` § Skills; the placement rule
 * is `skills/README.md` § Where content goes). The contract has a measurable
 * invariant — a rule states itself once — and until now nothing measured it. Two
 * places a rule can live is two places it can drift, and the only thing holding
 * the six skills apart was whoever wrote them remembering the split (#162).
 *
 * WHAT IT COMPARES, SCOPE ONE — WITHIN A SKILL. All three pairings, per skill:
 * `references/method.md` against each face, and the two faces against each
 * other. A rule that reached a face from the method is the failure this exists
 * for; a rule that reached one face from the other is the same failure with the
 * method skipped.
 *
 * WHAT IT COMPARES, SCOPE TWO — ACROSS THE BUNDLE (#174). Every bundled doc
 * against every other: 21 docs, 210 pairs. One rule, one home is not a fact
 * about skills — it is a fact about the prompt. A rule stated in the
 * constitution and again in the persona costs the same chars, drifts the same
 * way, and until this landed nothing compared two bundled docs to each other.
 * That gap is what the ticket that filed this guard actually pointed at: a
 * convention doc was found carrying four rules already stated in `AGENT.md` and
 * `CONTEXT.md`, and it took a human reading all three to notice.
 *
 * THE BUNDLED SET IS ASKED OF THE BUNDLER, never re-globbed here — see
 * `scripts/lib/bundled-set.mjs`. A second list of members is a list that can
 * disagree with the first, which is the failure `#159` deleted. The cost is
 * that a stale bundle stops this check before it counts anything; the shared
 * module says so in those words rather than reporting it as an overlap.
 *
 * NOTE THE SCOPES OVERLAP BUT DO NOT NEST. `SKILL.md` is IDE-side and never
 * bundled, so scope one is the only thing that reads it; `AGENTS.md`,
 * `CONTEXT.md`, `AGENT.md` and the connector docs are bundled and belong to no
 * skill, so scope two is the only thing that reads them. Six `bot.md` files and
 * six `method.md` files sit in both, compared to their own skill by scope one
 * and to the other nineteen docs by scope two.
 *
 * THE THRESHOLD, AND WHY IT IS WHERE IT IS. Measured 2026-08-26 across all six
 * skills and all three pairings: 25 lines coincide, and every one is structure — `---`,
 * a code fence, a `|---|---|` table rule, or a section heading two faces
 * naturally share (`## Quality bar`, `## Hand-offs`). Not one is a sentence.
 * Counting those as drift is what a naive zero threshold does, and it would have
 * failed all six skills on the day it landed — the exact way a guard gets argued
 * about and switched off. So structure is discounted first and the threshold is
 * zero on what remains: MAX_SHARED_LINES = 0 SUBSTANTIVE lines per pairing.
 *
 * The same threshold survives the wider scope, and it was measured before it
 * was chosen. Across the 210 bundled pairs, 2026-08-26: ONE substantive line
 * coincided, and it was the second line of a two-line HTML comment — the
 * authoring banner four `method.md` files open with. Its first line was already
 * discounted as a comment and its second was not, which is a per-line
 * classifier's blind spot rather than a rule written twice. So comments are now
 * discounted whole (see `blankComments`), and the measurement is zero with
 * margin: still zero at a four-word floor, still zero at three. Nothing was
 * relaxed to make the number fit.
 *
 * The margin is real, not nominal. The longest line the six skills share today
 * is 14 characters (`## Quality bar`) and it is discounted twice over — as a
 * heading, and as a line under the word floor. A copied rule is a sentence. The
 * gap between the two is wide enough that the guard fires on a copy and stays
 * silent on coincidence, which is the only calibration that matters.
 *
 * CITATION IS NOT DUPLICATION, and the wider scope is where that stops being
 * obvious: bundled docs point at each other constantly, by design. They pass
 * because a pointer is a different sentence from the rule it points at —
 * "`AGENTS.md` § The loading contract" shares no line with the contract. It is
 * a copy, not a reference, that fails here, and 210 pairs of mutually-citing
 * documents measuring zero is the evidence that the distinction holds without a
 * similarity number to argue about.
 *
 * WHY NO ALLOWLIST. An escape hatch here would be the switch-off the threshold
 * was designed to avoid: a line that genuinely belongs to both faces belongs in
 * `method.md`, and moving it there is the fix the finding is asking for.
 *
 * Comparison is normalised — case, whitespace, emphasis markers and list markers
 * are ignored — so re-bolding or re-bulleting a copied rule does not hide it.
 * It stops at verbatim-modulo-formatting on purpose: a fuzzy match would need a
 * similarity number, and that number is the thing that gets argued about.
 *
 * Usage:
 *   node scripts/check-skill-overlap.mjs         report; exit 1 on a finding
 *   node scripts/check-skill-overlap.mjs --verbose   also list what was discounted
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { bundledFiles } from './lib/bundled-set.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SKILLS_ROOT = path.join(REPO_ROOT, 'skills');

/** Substantive lines a pairing may share. Derived above; not a dial to turn. */
export const MAX_SHARED_LINES = 0;

/**
 * A line carries a rule only if it carries a clause. Four words or fewer is a
 * label, a step marker or a fragment — two faces can arrive at "Slack-ready
 * Markdown." independently, and calling that drift teaches people to ignore the
 * guard. A rule worth stating once is a sentence.
 */
export const SUBSTANCE_MIN_WORDS = 5;

const STRUCTURAL = [
  ['blank', /^\s*$/],
  // Frontmatter fences and thematic breaks — the single most common coincidence.
  ['delimiter', /^(?:-{3,}|\*{3,}|_{3,})$/],
  ['code-fence', /^(?:```|~~~)/],
  ['html-comment', /^<!--/],
  ['heading', /^#{1,6}\s/],
  // `|---|---|`, `| :--- | ---: |` — a table's rule, not its content.
  ['table-rule', /^\|?(?:\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?$/],
];

/**
 * Strip the markdown that decorates a line without changing what it says, so a
 * rule that was re-bolded or turned into a numbered step on the way into the
 * second file still matches the original.
 */
export function normalize(raw) {
  return raw
    .trim()
    .replace(/^>+\s*/, '')
    .replace(/^(?:[-*+]|\d+[.)])\s+/, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const wordCount = (text) => text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;

/**
 * @returns {{text: string, structural: string|null}} `structural` names why the
 * line was discounted, or null when the line is substantive.
 */
export function classify(raw) {
  const trimmed = raw.trim();
  for (const [reason, re] of STRUCTURAL) {
    if (re.test(trimmed)) return { text: normalize(raw), structural: reason };
  }
  const text = normalize(raw);
  if (!text) return { text, structural: 'blank' };
  if (wordCount(text) < SUBSTANCE_MIN_WORDS) return { text, structural: 'short' };
  return { text, structural: null };
}

/**
 * Blank out `<!-- … -->` regions, keeping every newline so reported line
 * numbers still point at the file.
 *
 * A comment is an authoring note or a routing marker, not prose the reader
 * follows — and the single-line case was already discounted by the
 * `html-comment` rule above. Leaving the SECOND line of a two-line comment
 * substantive was never a decision, just what a line-at-a-time classifier does;
 * four `method.md` files open with the same two-line banner and it was the only
 * thing standing between the bundled set and a clean zero. Discounting one and
 * not the other is the incoherence being fixed, in the direction the existing
 * rule already pointed.
 *
 * The cost, stated plainly: a rule copied inside a comment in two files is now
 * invisible here. It was already invisible whenever the comment fit on one
 * line, so this trades a partial blind spot for a consistent one — and a rule
 * that matters is not written in a comment.
 */
export function blankComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * Index a document's substantive lines by normalised text, first occurrence
 * wins. A line repeated inside one file is that file's business — this guard is
 * about a rule living in two files.
 */
function index({ label, text }) {
  const substantive = new Map();
  const source = text.split(/\r?\n/);
  let discounted = 0;
  blankComments(text).split(/\r?\n/).forEach((raw, i) => {
    const { text: norm, structural } = classify(raw);
    if (structural) {
      // A line blanked out of a comment reads as 'blank' here but was not blank
      // in the file, and the report's count of what it discounted should say so.
      if (structural !== 'blank' || source[i]?.trim()) discounted += 1;
      return;
    }
    if (!substantive.has(norm)) substantive.set(norm, { label, line: i + 1, raw: raw.trim() });
  });
  return { substantive, discounted };
}

/**
 * @param {{label: string, text: string}} a
 * @param {{label: string, text: string}} b
 * @returns {{text: string, a: {label: string, line: number, raw: string}, b: {...}}[]}
 */
export function findSharedLines(a, b) {
  const left = index(a).substantive;
  const right = index(b).substantive;
  const found = [];
  for (const [norm, hit] of left) {
    const other = right.get(norm);
    if (other) found.push({ text: norm, a: hit, b: other });
  }
  return found;
}

/**
 * Every document against every other, once. The indexes are built once per
 * document rather than once per pair — 21 docs is 210 pairs, and re-parsing
 * `AGENT.md` twenty times to compare it twenty times is the difference between
 * a check people run and a check people skip.
 *
 * @param {{label: string, text: string}[]} docs
 * @returns {{findings: object[], pairings: number, discounted: number}}
 */
export function findSharedAcross(docs) {
  const indexed = docs.map((d) => ({ label: d.label, ...index(d) }));
  const findings = [];
  let pairings = 0;
  for (let i = 0; i < indexed.length; i += 1) {
    for (let j = i + 1; j < indexed.length; j += 1) {
      pairings += 1;
      for (const [norm, hit] of indexed[i].substantive) {
        const other = indexed[j].substantive.get(norm);
        if (other) findings.push({ text: norm, a: hit, b: other });
      }
    }
  }
  return { findings, pairings, discounted: indexed.reduce((n, d) => n + d.discounted, 0) };
}

/**
 * Scope two: the bundled set, compared doc against doc.
 *
 * `files` defaults to whatever the bundler says is bundled — passing a list is
 * for tests, never for narrowing the real run.
 *
 * @param {string[]} [files] repo-relative paths, in load order.
 */
export function auditBundle(files = bundledFiles({ tag: 'skill-overlap', notThis: 'the overlap count' })) {
  const docs = files
    .filter((f) => fs.existsSync(path.join(REPO_ROOT, f)))
    .map((f) => ({ label: f, text: fs.readFileSync(path.join(REPO_ROOT, f), 'utf8') }));
  return { files: docs.map((d) => d.label), ...findSharedAcross(docs) };
}

const FACES = {
  method: 'references/method.md',
  skill: 'SKILL.md',
  bot: 'bot.md',
};

/** The three pairings, named as the contract names them. */
const PAIRINGS = [
  ['method', 'bot'],
  ['method', 'skill'],
  ['skill', 'bot'],
];

const rel = (abs) => path.relative(REPO_ROOT, abs).replace(/\\/g, '/');

/**
 * Walk `skills/uno-*`, compare every pairing, and return the findings plus what
 * was measured. Pure: reads files, writes nothing.
 */
export function auditSkills(root = SKILLS_ROOT) {
  const skills = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('uno-'))
    .map((e) => e.name)
    .sort();

  const findings = [];
  const incomplete = [];
  const rows = [];
  let pairings = 0;

  for (const name of skills) {
    const docs = {};
    for (const [face, file] of Object.entries(FACES)) {
      const abs = path.join(root, name, file);
      if (!fs.existsSync(abs)) {
        incomplete.push(`${rel(path.join(root, name))} has no ${file}`);
        continue;
      }
      docs[face] = { label: rel(abs), text: fs.readFileSync(abs, 'utf8') };
    }

    for (const [x, y] of PAIRINGS) {
      if (!docs[x] || !docs[y]) continue;
      pairings += 1;
      const shared = findSharedLines(docs[x], docs[y]);
      findings.push(...shared);
      rows.push({ skill: name, pair: `${x}↔${y}`, substantive: shared.length });
    }

    for (const [face, doc] of Object.entries(docs)) {
      rows.push({ skill: name, face, discounted: index(doc).discounted });
    }
  }

  return { skills, findings, incomplete, pairings, rows };
}

/** One finding, as the person who has to fix it needs to read it. */
const cite = ({ a, b, text }) =>
  `  ${a.label}:${a.line}\n  ${b.label}:${b.line}\n    "${text.slice(0, 140)}"`;

/** What every report ends with: why the lines above are not coincidence. */
const DISCOUNT_NOTE =
  `\n     (Structure — headings, fences, \`---\`, table rules, HTML comments, lines under` +
  `\n     ${SUBSTANCE_MIN_WORDS} words — is discounted, so every line above is prose that was written twice.)`;

// ── CLI ──────────────────────────────────────────────────────────────────────
// Guarded so the test file can import the analysis without running it.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const skillScope = auditSkills();

  if (skillScope.incomplete.length) {
    console.error(
      `[skill-overlap] ${skillScope.incomplete.length} skill(s) are not three-part:\n` +
        skillScope.incomplete.map((m) => `  ${m}`).join('\n') +
        '\n  -> a skill is one method and two faces. skills/README.md § The three parts.',
    );
    process.exit(1);
  }

  // Both scopes are measured before either is reported. One run should say
  // everything that is wrong — stopping at the skills means a second push to
  // learn about the bundle, which is how a gate earns a reputation for wasting
  // people's afternoons (`scripts/check-harness.mjs`, same rule).
  const bundleScope = auditBundle();
  const failed = [];

  if (skillScope.findings.length > MAX_SHARED_LINES) {
    failed.push(
      `[skill-overlap] ${skillScope.findings.length} substantive line(s) live in two faces of one skill:\n\n` +
        skillScope.findings.map(cite).join('\n\n') +
        '\n\n  -> A rule states itself once. Move it to the skill\'s references/method.md and let both' +
        '\n     faces load it, or cut it from the face that only echoes it. What belongs where:' +
        '\n     skills/README.md § Where content goes.' +
        DISCOUNT_NOTE,
    );
  }

  if (bundleScope.findings.length > MAX_SHARED_LINES) {
    failed.push(
      `[skill-overlap] ${bundleScope.findings.length} substantive line(s) live in two bundled docs at once:\n\n` +
        bundleScope.findings.map(cite).join('\n\n') +
        '\n\n  -> Every bundled doc is in the prompt on every turn, so a rule written twice is' +
        '\n     paid for twice and drifts in two places. Keep it in the doc that OWNS it — the' +
        '\n     constitution for a repo-wide rule, the persona for a voice rule, the method for a' +
        '\n     procedure — and cite it from the other. A citation names the rule; it does not' +
        '\n     restate it, which is why the other 200-odd pairs of these docs pass.' +
        DISCOUNT_NOTE,
    );
  }

  if (failed.length) {
    console.error(failed.join(`\n\n${'─'.repeat(72)}\n\n`));
    process.exit(1);
  }

  const skillDiscounted = skillScope.rows.filter((r) => r.face).reduce((n, r) => n + r.discounted, 0);
  console.log(
    `[skill-overlap] ${skillScope.findings.length + bundleScope.findings.length} substantive shared ` +
      `line(s) against a ceiling of ${MAX_SHARED_LINES}\n` +
      `  within skills: ${skillScope.skills.length} skills, ${skillScope.pairings} pairings ` +
      `(${skillDiscounted} structural lines discounted)\n` +
      `  across the bundle: ${bundleScope.files.length} docs, ${bundleScope.pairings} pairings ` +
      `(${bundleScope.discounted} structural lines discounted)`,
  );
  if (process.argv.includes('--verbose')) {
    for (const r of skillScope.rows.filter((x) => x.pair)) {
      console.log(`  ${r.skill.padEnd(16)} ${r.pair.padEnd(16)} ${r.substantive}`);
    }
    for (const f of bundleScope.files) console.log(`  bundled  ${f}`);
  }
}
