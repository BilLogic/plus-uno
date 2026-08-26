/**
 * The overlap guard — one rule, one home.
 *
 * A skill is two faces over one method (`AGENTS.md` § Skills; the placement rule
 * is `skills/README.md` § Where content goes). The contract has a measurable
 * invariant — a rule states itself once — and until now nothing measured it. Two
 * places a rule can live is two places it can drift, and the only thing holding
 * the six skills apart was whoever wrote them remembering the split (#162).
 *
 * WHAT IT COMPARES. All three pairings, per skill: `references/method.md` against
 * each face, and the two faces against each other. A rule that reached a face
 * from the method is the failure this exists for; a rule that reached one face
 * from the other is the same failure with the method skipped.
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
 * The margin is real, not nominal. The longest line the six skills share today
 * is 14 characters (`## Quality bar`) and it is discounted twice over — as a
 * heading, and as a line under the word floor. A copied rule is a sentence. The
 * gap between the two is wide enough that the guard fires on a copy and stays
 * silent on coincidence, which is the only calibration that matters.
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
 * Index a document's substantive lines by normalised text, first occurrence
 * wins. A line repeated inside one file is that file's business — this guard is
 * about a rule living in two files.
 */
function index({ label, text }) {
  const substantive = new Map();
  let discounted = 0;
  text.split(/\r?\n/).forEach((raw, i) => {
    const { text: norm, structural } = classify(raw);
    if (structural) {
      if (structural !== 'blank') discounted += 1;
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

// ── CLI ──────────────────────────────────────────────────────────────────────
// Guarded so the test file can import the analysis without running it.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const { skills, findings, incomplete, pairings, rows } = auditSkills();

  if (incomplete.length) {
    console.error(
      `[skill-overlap] ${incomplete.length} skill(s) are not three-part:\n` +
        incomplete.map((m) => `  ${m}`).join('\n') +
        '\n  -> a skill is one method and two faces. skills/README.md § The three parts.',
    );
    process.exit(1);
  }

  if (findings.length > MAX_SHARED_LINES) {
    console.error(
      `[skill-overlap] ${findings.length} substantive line(s) live in two files at once:\n\n` +
        findings
          .map(
            ({ a, b, text }) =>
              `  ${a.label}:${a.line}\n  ${b.label}:${b.line}\n    "${text.slice(0, 140)}"`,
          )
          .join('\n\n') +
        '\n\n  -> A rule states itself once. Move it to the skill\'s references/method.md and let both' +
        '\n     faces load it, or cut it from the face that only echoes it. What belongs where:' +
        '\n     skills/README.md § Where content goes.' +
        `\n     (Structure — headings, fences, \`---\`, table rules, lines under ${SUBSTANCE_MIN_WORDS} words —` +
        '\n     is discounted, so every line above is prose that was written twice.)',
    );
    process.exit(1);
  }

  const discounted = rows.filter((r) => r.face).reduce((n, r) => n + r.discounted, 0);
  console.log(
    `[skill-overlap] ${skills.length} skills, ${pairings} pairings, ` +
      `${findings.length} substantive shared line(s) against a ceiling of ${MAX_SHARED_LINES} ` +
      `(${discounted} structural lines discounted)`,
  );
  if (process.argv.includes('--verbose')) {
    for (const r of rows.filter((x) => x.pair)) {
      console.log(`  ${r.skill.padEnd(16)} ${r.pair.padEnd(16)} ${r.substantive}`);
    }
  }
}
