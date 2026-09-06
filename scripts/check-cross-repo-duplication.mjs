#!/usr/bin/env node
/**
 * The cross-repo duplicate sweep (#425, the last of #417's five checks).
 *
 * ── WHAT IT IS FOR ──────────────────────────────────────────────────────────
 *
 * One meaning stated in two repositories drifts, and nothing notices. The case
 * that produced this check: the SAME rename map, in the same shape — a `Was |
 * Is | Migration` table under a heading called "The rename map", wrapped in the
 * same paragraphs of reasoning — sat in `plus-uno-blueprint`'s glossary and in
 * `agentic-service-blueprinting`'s. Each was maintained by hand, neither knew
 * about the other, and by the end they disagreed about what an `alter table …
 * rename` leaves behind. Both were deleted by their own tickets
 * (plus-uno-blueprint#365, agentic-service-blueprinting#137) once the identifier
 * sweeps made them redundant. This is what stops the next one being written
 * twice.
 *
 * IT RUNS HERE, DOWNSTREAM, because this is where drift lands: plus-uno already
 * reaches the blueprint by token (`agents/uno-bot/scripts/sync-blueprint-contract.mjs`)
 * and now holds `agentic-service-blueprinting` as a development dependency,
 * pinned the way the blueprint pins it. Neither sibling depends on this repo, so
 * hosting the sweep there would mean giving one of them an edge it does not have.
 *
 * ── THE UNIT IS A PASSAGE, NOT A PARAGRAPH ──────────────────────────────────
 *
 * The first draft compared normalised PARAGRAPHS and would have missed the very
 * maps it was written for. Measured against the two glossaries as they stood
 * before #365 and #137, exact-paragraph matching found ONE shared block in the
 * whole of both files — the `sprawl` row — while two rename maps and two
 * interface→schema maps sat there saying the same thing in the same shape,
 * differing by a migration id per row. Any unit that has to match end to end is
 * defeated by one edited cell.
 *
 * So the unit is a SHINGLE — {@link SHINGLE} consecutive normalised words — and
 * a finding is a maximal RUN of shared shingles covering at least
 * {@link MIN_WORDS} words. That survives an edited cell in the middle of a
 * table, is wrap-independent (all three repos hard-wrap, and a re-wrap must not
 * invent or hide a finding), and states its own bar out loud: about two
 * sentences of writing, said the same way twice.
 *
 * Shingles never cross a blank line. A passage is something written in one
 * breath; a run spanning a paragraph break would report the seam between two
 * unrelated sentences as one duplicated meaning.
 *
 * ── WHAT IS NOT A FINDING, AND WHY EACH IS DECLARED ─────────────────────────
 *
 * A VENDORED DOCUMENT IS ONE DOCUMENT, NOT TWO. `docs/connectors/supabase/blueprint.md`
 * is the blueprint's own account of itself, copied in by a sync script with a
 * drift check (`npm run check:contract`) already standing over it. It is
 * duplicated on purpose, by a mechanism, and it has its own guard. Detected
 * structurally, by the marker the sync writes into every copy it renders
 * ({@link VENDORED}), rather than by path — so a new vendored document is exempt
 * the day it is vendored, and a hand-written one never is.
 *
 * A COPY BY CONSTRUCTION IS NOT A STATEMENT. {@link COPIES} names documents a
 * shared tool writes into each repo — today the three `docs/agents/` files the
 * `mattpocock-skills` setup skill installs. Their home is the plugin; editing
 * one of the three copies is the mistake, and this sweep has no opinion the
 * plugin does not already own. They are listed by path with a reason each rather
 * than caught by a rule, because "a tool wrote this" leaves no mark in the file,
 * and a silent rule with no mark is how an exemption outlives its reason.
 * Measured: each overlaps its siblings 80–100%, against 3% for the glossary
 * pair below, so nothing here sits near a boundary.
 *
 * A RECORDED PAIR IS A BASELINE, NOT AN AMNESTY. {@link RECORDED} holds document
 * pairs already sharing passages when this check was written, each with a
 * CEILING on the words they share and a reason that says what closing it would
 * take. Shared words may fall and never rise, so a recorded pair cannot absorb a
 * new copy-paste — which is the property that makes it a baseline rather than a
 * hole. Same shape as `check:deps`'s CDN_BASELINE and the negation ratchet:
 * a corpus too large to fix in this repo still gets a binding direction.
 *
 * THE CEILING IS WHY THE GLOSSARY PAIR IS SAFE TO RECORD, and the number says
 * so. `CONTEXT.md ↔ CONTEXT.md` shares 98 words today — #417's writing
 * vocabulary (*ladder*, *sprawl*, *evidence*), which each repo's glossary must
 * define locally, since a session in one repo never opens another's glossary.
 * Run against the same two files as they stood BEFORE #365 and #137, with the
 * rename maps and the interface→schema maps still in them, the pair shares 771 —
 * so the recorded ceiling is not an exemption for the glossaries, it is 8x under
 * the line the rename maps crossed, and `check-cross-repo-duplication.test.mjs`
 * pins that with a fixture rather than with this sentence.
 *
 * EVERY EXEMPTION IS ASSERTED LIVE. A `COPIES` path that no longer exists in two
 * repos, and a `RECORDED` pair whose documents are gone or which no longer
 * shares anything, both FAIL: an allowlist nobody prunes is a backlog, and an
 * entry that outlives its reason is the thing it was written to prevent. The
 * assertion is suspended for any exemption whose repos were not all reachable —
 * an absent checkout makes every exemption look stale, and reporting that is
 * reporting the missing checkout twice under a worse name.
 *
 * ── WHEN A SIBLING IS NOT CHECKED OUT ───────────────────────────────────────
 *
 * `check:contract` used to exit 0 on a missing checkout. It ran on every runner,
 * compared nothing on all of them, and `.github/workflows/uno-bot-deploy.yml`
 * called it one of four gates protecting an auto-deploy the whole time. The
 * vendored contract then drifted for real and was found by hand. A gate that
 * cannot fail is worse than no gate, because it is believed.
 *
 * So this one never reports a bare pass. Every run says WHICH repos it reached
 * and HOW it reached each, WHICH pairings it therefore compared, and — in the
 * same breath, at the same volume — which pairings did not happen and what that
 * left uncompared. On CI a skip is also a `::warning::` annotation and a
 * job-summary line, the two places #258 established a reader actually looks:
 * a SKIPPED line inside a green job is invisible.
 *
 * It exits 0 with fewer than three repos, because `.github/workflows/check-harness.yml`
 * installs no root dependencies by design (its header says why), so failing on
 * an absent sibling would be a permanently red gate — which is how a gate gets
 * switched off, the exact failure this epic exists to prevent. What it refuses
 * is a SILENT skip, not a skip.
 *
 * Where each repo comes from, in order:
 *   plus-uno   this checkout. Always present; it is the one running the sweep.
 *   sb         $SB_REPO, then `node_modules/agentic-service-blueprinting` (the
 *              pinned development dependency — `npm install` at the root is all
 *              it takes), then a sibling checkout beside any ancestor of this repo.
 *   blueprint  $BLUEPRINT_REPO (the variable `sync-blueprint-contract.mjs`
 *              already uses), then a sibling checkout beside any ancestor.
 *
 * Run: npm run check:cross-repo
 *      SB_REPO=… BLUEPRINT_REPO=… npm run check:cross-repo
 */
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '..');

/** Words per shingle: short enough to survive an edited table cell, long enough that a stock phrase is not a match. */
export const SHINGLE = 12;

/** A finding must cover at least this many words — about two sentences. */
export const MIN_WORDS = 30;

/** The mark `sync-blueprint-contract.mjs` writes into every copy it renders. */
export const VENDORED = /^vendored_from:|<!-- VENDORED from /m;

/**
 * The three repos, their harness-document roots, and the name each is reported by.
 *
 * `roots` differ because the layouts do: sb keeps its disclosed references under
 * `references/`, the other two under `docs/`. What is common is the shape #417
 * settled on — a router, a glossary, and the trees the router points into.
 */
export const REPOS = [
  {
    key: 'plus-uno',
    label: 'BilLogic/plus-uno',
    roots: ['AGENTS.md', 'CONTEXT.md', 'README.md', 'docs', 'skills'],
  },
  {
    key: 'blueprint',
    label: 'BilLogic/plus-uno-blueprint',
    roots: ['AGENTS.md', 'CONTEXT.md', 'README.md', 'docs', 'skills'],
  },
  {
    key: 'sb',
    label: 'BilLogic/agentic-service-blueprinting',
    roots: ['AGENTS.md', 'CONTEXT.md', 'README.md', 'docs', 'skills', 'references'],
  },
];

/**
 * Left as written in every repo, by the rules the other sweeps already use:
 * history keeps the words it was written in, and a generated artifact is
 * regenerated from sources that are swept anyway.
 */
export const SKIP = [
  'docs/plans/',
  'docs/adr/',
  'docs/knowledge/archive/',
  'docs/evals/',
  'todos/',
  'node_modules/',
];

/** Documents a shared tool writes into every repo: the path, and why it is a copy. */
export const COPIES = new Map([
  [
    'docs/agents/domain.md',
    'installed by the mattpocock-skills setup skill, identically in all three repos. Its home is the plugin; a divergent copy is the defect, and the plugin owns that.',
  ],
  [
    'docs/agents/issue-tracker.md',
    'same origin: it teaches the skills how this estate spells `gh`, and the spelling is deliberately the same everywhere.',
  ],
  [
    'docs/agents/triage-labels.md',
    'same origin again. The label table differs per repo; the sentences defining the five canonical roles cannot, because the roles are the plugin\'s.',
  ],
]);

/**
 * Duplication that already existed when this check was written.
 *
 * `words` is a CEILING, not a permission: shared words may fall and never rise,
 * so a recorded pair cannot absorb a new copy-paste. `why` has to say what
 * closing it would take, so an entry cannot quietly become permanent.
 */
export const RECORDED = [
  {
    a: 'blueprint:CONTEXT.md',
    b: 'sb:CONTEXT.md',
    words: 98,
    why:
      "#417's shared writing vocabulary — *ladder*, *sprawl*, *evidence*. A glossary is a LOCAL dictionary: a session in one repo never opens another's CONTEXT.md, so one word must carry one definition in all three. Closing it means a vendored glossary, i.e. the extra vendoring edge #417 § The Worker stays in the monorepo refuses — so this one is expected to stay, and the ceiling is what keeps it from growing back into a rename map.",
  },
  {
    a: 'blueprint:docs/reference/interface-schema-map.md',
    b: 'sb:references/interface-schema-map.md',
    words: 528,
    why:
      'the rename map\'s sibling, and the finding this sweep opened with. #365 and #137 each MOVED their interface→schema map out of the glossary rather than deduplicating it, so the two now state the same alignment rule, the same "not listed would mean both aligned and nobody looked", and the same quoted complaint, in two repos, already drifting — one says five components, the other seven. Closing it is an edit in two other repositories (sb owns the method, the blueprint owns its deployment of it), which is its own ticket; the ceiling is what stops a third paragraph joining them meanwhile.',
  },
];

/** Walk a root for markdown, skipping node_modules and dot-directories. */
function walk(abs, out) {
  let st;
  try {
    st = statSync(abs);
  } catch {
    return out;
  }
  if (st.isFile()) {
    if (abs.endsWith('.md')) out.push(abs);
    return out;
  }
  for (const name of readdirSync(abs)) {
    // Dot-directories are skipped here as in every other sweep — which is also
    // what keeps a CI sibling checkout under `.sibling-repos/` from being read
    // as a part of this repo.
    if (name === 'node_modules' || name.startsWith('.')) continue;
    walk(path.join(abs, name), out);
  }
  return out;
}

/** Frontmatter off, HTML comments out, then blank-line-separated blocks. */
export function blocksOf(text) {
  let body = text;
  if (body.startsWith('---\n')) {
    const close = body.indexOf('\n---', 4);
    if (close !== -1) body = body.slice(close + 4);
  }
  body = body.replace(/<!--[\s\S]*?-->/g, '\n\n');
  return body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
}

/**
 * One block as a word stream: link text without its target, no markdown
 * punctuation, no table pipes, lowercase.
 *
 * A URL and a heading marker are formatting rather than meaning, and two repos
 * stating one meaning rarely link it to the same place — the two
 * interface→schema maps quote the same complaint against two different issue
 * numbers, and that is one meaning, not two.
 */
export function wordsOf(block) {
  return block
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~>#|]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/** Every harness document under a repo's roots, as `{rel, blocks}` of word arrays. */
export function documentsIn(root, spec) {
  const files = [];
  for (const r of spec.roots) walk(path.join(root, r), files);
  const docs = [];
  for (const abs of files) {
    const rel = path.relative(root, abs).split(path.sep).join('/');
    if (SKIP.some((p) => rel.startsWith(p))) continue;
    if (COPIES.has(rel)) continue;
    const text = readFileSync(abs, 'utf8');
    if (VENDORED.test(text)) continue;
    docs.push({ rel, blocks: blocksOf(text).map(wordsOf).filter((w) => w.length >= SHINGLE) });
  }
  return docs.sort((a, b) => a.rel.localeCompare(b.rel));
}

/**
 * A repo's shingle index: `key -> Set(document index)`.
 *
 * Built ONCE per repo and reused across the three pairings. The first draft
 * re-shingled both documents inside the comparison loop and took 9.3s against
 * this gate's ~20s total; the index takes it to under a second, which is what
 * keeps the check composable (`check-harness.mjs` § No member that costs minutes).
 */
function indexOf(docs) {
  const index = new Map();
  docs.forEach((doc, d) => {
    for (const words of doc.blocks) {
      for (let at = 0; at + SHINGLE <= words.length; at++) {
        const key = words.slice(at, at + SHINGLE).join(' ');
        let set = index.get(key);
        if (!set) index.set(key, (set = new Set()));
        set.add(d);
      }
    }
  });
  return index;
}

/**
 * Maximal runs of consecutive shared shingles, given the offsets of every
 * shared shingle within one block.
 *
 * Merging is what turns "these twelve words appear twice" into "this passage of
 * 195 words appears twice": a duplicated section reports once, with its true
 * length, rather than once per window.
 *
 * @param {string[]} words the block
 * @param {number[]} offsets shared-shingle starts within it, unsorted
 */
export function runsIn(words, offsets) {
  const found = [];
  const sorted = [...offsets].sort((x, y) => x - y);
  let start = sorted[0];
  let last = sorted[0];
  const close = () => {
    const span = words.slice(start, last + SHINGLE);
    if (span.length >= MIN_WORDS) found.push({ words: span.length, text: span.join(' ') });
  };
  for (const at of sorted.slice(1)) {
    if (at === last + 1) {
      last = at;
      continue;
    }
    close();
    start = at;
    last = at;
  }
  close();
  return found;
}

/**
 * Every passage shared between a document of `A` and a document of `B`.
 *
 * @returns {{a: string, b: string, words: number, text: string}[]}
 */
export function comparePair(A, B) {
  const bIndex = indexOf(B.docs);
  const out = [];
  for (const doc of A.docs) {
    /** `bDocIndex -> blockIndex -> offsets` */
    const hits = new Map();
    doc.blocks.forEach((words, block) => {
      for (let at = 0; at + SHINGLE <= words.length; at++) {
        const inB = bIndex.get(words.slice(at, at + SHINGLE).join(' '));
        if (!inB) continue;
        for (const e of inB) {
          let byBlock = hits.get(e);
          if (!byBlock) hits.set(e, (byBlock = new Map()));
          let offsets = byBlock.get(block);
          if (!offsets) byBlock.set(block, (offsets = []));
          offsets.push(at);
        }
      }
    });
    for (const [e, byBlock] of hits) {
      for (const [block, offsets] of byBlock) {
        for (const run of runsIn(doc.blocks[block], offsets)) {
          out.push({ a: `${A.key}:${doc.rel}`, b: `${B.key}:${B.docs[e].rel}`, ...run });
        }
      }
    }
  }
  return out.sort((x, y) => y.words - x.words);
}

/** Ancestors of `dir`, nearest first, so a worktree finds the same siblings the main checkout does. */
function ancestors(dir) {
  const out = [];
  let at = dir;
  for (;;) {
    const up = path.dirname(at);
    if (up === at) break;
    out.push(up);
    at = up;
  }
  return out;
}

/** Where one repo is, and how it was found — or `null` when it is not checked out. */
export function locateOne(key) {
  if (key === 'plus-uno') return { root: REPO_ROOT, how: 'this checkout' };
  const varName = key === 'sb' ? 'SB_REPO' : 'BLUEPRINT_REPO';
  const env = process.env[varName];
  if (env) {
    // An explicit pointer DECIDES, right or wrong. Falling through to the
    // search when it names nothing would answer a different question than the
    // one asked, and quietly — which is how CI ends up comparing a checkout
    // nobody meant. A wrong path is an absent repo, and absent is loud.
    const root = path.resolve(env);
    return existsSync(path.join(root, 'AGENTS.md')) ? { root, how: `$${varName}` } : null;
  }
  if (key === 'sb') {
    const dep = path.join(REPO_ROOT, 'node_modules', 'agentic-service-blueprinting');
    if (existsSync(path.join(dep, 'AGENTS.md'))) {
      return { root: dep, how: 'the pinned development dependency in node_modules' };
    }
  }
  const dirName = key === 'sb' ? 'agentic-service-blueprinting' : 'plus-uno-blueprint';
  for (const up of ancestors(REPO_ROOT)) {
    const guess = path.join(up, dirName);
    if (existsSync(path.join(guess, 'AGENTS.md'))) return { root: guess, how: `a sibling checkout at ${guess}` };
  }
  return null;
}

/**
 * Where every repo is. Overrides come first so a test — and a run against
 * checkouts somewhere unusual — can point each repo at a directory of its own,
 * or declare it absent with `null`.
 *
 * @param {Record<string, string|null>} [overrides]
 */
export function locateRepos(overrides = {}) {
  const found = {};
  for (const spec of REPOS) {
    if (Object.prototype.hasOwnProperty.call(overrides, spec.key)) {
      const root = overrides[spec.key];
      found[spec.key] = root ? { root, how: 'given to the sweep directly' } : null;
      continue;
    }
    found[spec.key] = locateOne(spec.key);
  }
  return found;
}

/**
 * The sweep.
 *
 * @param {Record<string, string|null>} [overrides] key -> absolute root, or null for "not checked out"
 */
export function sweep(overrides = {}) {
  const located = locateRepos(overrides);
  const reached = REPOS.filter((s) => located[s.key]).map((s) => s.key);
  const absent = REPOS.filter((s) => !located[s.key]);

  const corpus = {};
  const docs = {};
  for (const spec of REPOS) {
    if (!located[spec.key]) continue;
    corpus[spec.key] = documentsIn(located[spec.key].root, spec);
    docs[spec.key] = corpus[spec.key].length;
  }

  const comparisons = [];
  const passages = [];
  for (let i = 0; i < reached.length; i++) {
    for (let j = i + 1; j < reached.length; j++) {
      const [ka, kb] = [reached[i], reached[j]];
      comparisons.push({ a: ka, b: kb });
      passages.push(...comparePair({ key: ka, docs: corpus[ka] }, { key: kb, docs: corpus[kb] }));
    }
  }

  // A recorded pair absorbs its own passages and counts them; everything else
  // is a finding. Both directions of a pair match, since which repo is "a"
  // depends only on the order REPOS happens to list them in.
  const shared = new Map(RECORDED.map((r) => [`${r.a}|${r.b}`, 0]));
  const findings = [];
  for (const p of passages) {
    const rec = RECORDED.find(
      (r) => (r.a === p.a && r.b === p.b) || (r.a === p.b && r.b === p.a),
    );
    if (rec) {
      const key = `${rec.a}|${rec.b}`;
      shared.set(key, shared.get(key) + p.words);
      continue;
    }
    findings.push(p);
  }

  const rises = [];
  const stale = [];
  for (const rec of RECORDED) {
    const now = shared.get(`${rec.a}|${rec.b}`);
    if (now > rec.words) rises.push({ rec, now });
  }

  // Exemptions are only asserted when every repo they name was reachable.
  const reachedAll = reached.length === REPOS.length;
  if (reachedAll) {
    for (const rec of RECORDED) {
      if (shared.get(`${rec.a}|${rec.b}`) === 0) {
        stale.push(
          `RECORDED ${rec.a} ↔ ${rec.b} shares nothing any more, so the entry is describing a\n` +
            '  duplication that no longer exists. Delete it — a baseline nobody prunes is a backlog.',
        );
      }
    }
    for (const [rel, why] of COPIES) {
      const holders = REPOS.filter((s) => existsSync(path.join(located[s.key].root, rel)));
      if (holders.length < 2) {
        stale.push(
          `COPIES "${rel}" is now in ${holders.length} of ${REPOS.length} repos, so it is no longer a copy\n` +
            `  by construction. Delete the entry. It read: ${why}`,
        );
      }
    }
  }

  return { located, reached, absent, docs, comparisons, findings, rises, stale, shared };
}

/**
 * Say it where a reader will see it, not only in the log.
 *
 * The two channels `sync-blueprint-contract.mjs` reaches for, for the reason
 * #258 established: a SKIPPED line inside a green job is invisible, so the skip
 * lands as a run annotation and on the job-summary page as well.
 */
function announce(level, message) {
  if (!process.env.GITHUB_ACTIONS) return;
  console.error(`::${level}::${message}`);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!summary) return;
  try {
    appendFileSync(summary, `${level === 'warning' ? '⚠️' : '❌'} **cross-repo sweep** — ${message}\n`);
  } catch {
    // A summary file that cannot be written must not decide the exit code; the
    // annotation above has already been emitted.
  }
}

/**
 * What a run says about the repos it did and did not reach.
 *
 * Pure, so the skip can be asserted without a checkout — the same reason the
 * negation ratchet's failure reports are pure.
 */
export function coverageReport({ located, absent, docs, comparisons }) {
  const lines = [];
  for (const spec of REPOS) {
    const at = located[spec.key];
    lines.push(
      at
        ? `  ${spec.key.padEnd(10)} ${String(docs[spec.key]).padStart(3)} harness documents — ${at.how}`
        : `  ${spec.key.padEnd(10)} NOT REACHED — ${spec.label} is not checked out`,
    );
  }
  const all = [];
  for (let i = 0; i < REPOS.length; i++) {
    for (let j = i + 1; j < REPOS.length; j++) all.push(`${REPOS[i].key}↔${REPOS[j].key}`);
  }
  const done = comparisons.map((c) => `${c.a}↔${c.b}`);
  lines.push(`  compared ${done.length} of ${all.length} pairings${done.length ? `: ${done.join(', ')}` : ''}`);
  if (absent.length) {
    const missed = all.filter((p) => !done.includes(p));
    lines.push(`  NOT COMPARED: ${missed.join(', ')} — nothing in those pairs was looked at.`);
  }
  return lines.join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = sweep();
  const coverage = coverageReport(result);

  if (result.absent.length) {
    const how = result.absent
      .map((s) =>
        s.key === 'sb'
          ? `${s.label}: \`npm install\` at the repo root installs it as a pinned development dependency, or set $SB_REPO`
          : `${s.label}: check it out beside this repo, or set $BLUEPRINT_REPO`,
      )
      .join('. ');
    const missed = 3 - result.comparisons.length;
    announce('warning', `${missed} of 3 pairings NOT compared — ${how}.`);
  }

  const problems = [...result.stale];
  for (const { rec, now } of result.rises) {
    problems.push(
      `${rec.a} ↔ ${rec.b} now share ${now} words, against the ${rec.words} recorded.\n` +
        `  The pair is a BASELINE and may only fall. It reads: ${rec.why}`,
    );
  }
  if (result.findings.length) {
    problems.push(
      `${result.findings.length} passage(s) stated in two repositories:\n` +
        result.findings
          .map(
            (f) =>
              `  ${f.words} words\n    ${f.a}\n    ${f.b}\n    "${f.text.slice(0, 200)}${f.text.length > 200 ? '…' : ''}"`,
          )
          .join('\n'),
    );
  }

  if (problems.length) {
    console.error('[check:cross-repo] one meaning is stated in two repositories:');
    console.error(coverage);
    for (const p of problems) console.error(p);
    console.error(
      '  -> give the meaning ONE home. Either it belongs to one repo and the other points at it, or\n' +
        '     it is a shared standard and the tool that installs it owns it. If two repos genuinely\n' +
        '     must both state it, record the pair in RECORDED with the reason and what would close it.',
    );
    process.exit(1);
  }

  // A recorded pair whose repos were not both reached reports `n/a`, never `0`.
  // "0/98" on a run that compared nothing reads like the duplication went away.
  const recorded = RECORDED.map((r) => {
    const both = [r.a, r.b].every((side) => result.reached.includes(side.split(':')[0]));
    return both ? `${result.shared.get(`${r.a}|${r.b}`)}/${r.words}` : `n/a (not compared)/${r.words}`;
  }).join(' · ');
  // The headline says what actually happened, and NOTHING is one of the things
  // that can happen. "no meaning stated twice" printed over zero comparisons is
  // the sentence #258 is about, whatever the coverage block underneath says.
  const found =
    result.comparisons.length === 0
      ? 'NOTHING WAS COMPARED — no sibling repo was reachable, so this run asserts nothing'
      : `no unrecorded meaning stated twice across the ${result.reached.length} repos reached`;
  console.log(
    `[check:cross-repo] ${found} — passages of ` +
      `${MIN_WORDS}+ words, ${SHINGLE}-word shingles. ${COPIES.size} copies by construction excluded; ` +
      `${RECORDED.length} recorded pairs at ${recorded} shared words (may fall, never rise).\n${coverage}` +
      (result.absent.length ? '\n  A pairing not compared is not a pairing that passed.' : ''),
  );
}
