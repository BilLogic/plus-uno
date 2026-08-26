/**
 * Who is in the bundled harness, asked of the bundler itself.
 *
 * Membership is a property of a document — each one declares
 * `embodiment: all | ide | uno-bot` and `agents/uno-bot/scripts/bundle-harness.mjs`
 * globs for it (#159). A guard that wants the bundled set therefore has exactly
 * two honest options: re-derive the glob, or ask the bundler. Re-deriving is a
 * second list that can disagree with the first, which is the failure #159
 * deleted; so this asks the bundler, and reads the answer off the artifact the
 * bundler actually produced.
 *
 * IT LIVES HERE BECAUSE TWO GUARDS NEED IT. `check:negation` (#155) asked this
 * question first and `check:skill-overlap` (#174) is the second to ask it. A
 * copy of the spawn-and-parse below in each script would be the same defect the
 * overlap guard exists to catch — one rule, two homes — one level down, in the
 * tooling instead of the prose.
 *
 * A STALE BUNDLE STOPS THE CALLER. `--check` exits non-zero when the committed
 * artifact is behind, a char budget is blown, or a doc declares no
 * `embodiment`. None of those is a finding of the calling guard, and reporting
 * them as one is what #204 fixed — so the failure path is a report that says
 * whose problem it is, not an exception.
 *
 * IT ALSO ANSWERS THE COMPLEMENT (#174). The same walk that decides who is
 * bundled decides who is IDE-only — a doc under a section root declares `all`,
 * `uno-bot` or `ide`, and the bundler refuses to build if it declares nothing.
 * `check:negation` ratchets both halves, so `harnessSets` returns both from one
 * bundler run and `SECTION_ROOTS` carries the walk the artifact cannot supply:
 * an IDE-only doc is, by definition, absent from the bundle, so there is no
 * marker to parse it back out of.
 *
 * A SHORT SET ALSO STOPS THE CALLER (#234). Asking the bundler is not the same
 * as being told: the answer is read back by matching `<!-- path -->` markers in
 * the artifact, and a marker format that shifts breaks the match without
 * breaking the bundle. Both narrowings that follow from that are now loud
 * rather than silent — the parse is checked against the count the bundler
 * states about itself (`declaredMemberCount`), and paths that do not resolve on
 * disk are RETURNED rather than filtered away (`resolveBundled`). A guard that
 * quietly measures one doc out of twenty-one and exits 0 is the shape #215 and
 * #232 put corpus floors under; this is that floor for the bundled set, exact
 * rather than approximate, because here the true size is knowable.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');

const BUNDLER = path.join(REPO_ROOT, 'agents/uno-bot/scripts/bundle-harness.mjs');
const REBUNDLE = 'npm --prefix agents/uno-bot run bundle:harness';
const HARNESS_TS = path.join(REPO_ROOT, 'agents/uno-bot/src/generated/harness.ts');

/**
 * What the reader is owed when the bundler exits non-zero.
 *
 * This is not the calling guard's finding, and it used to read as one: the
 * child's non-zero exit escaped as an `execFileSync` throw, so `check:harness`
 * printed `✗ check:negation` over a Node stack trace while the bundler's own
 * diagnostic — which artifact is behind, by how many chars — went to
 * `stdio: ignore` and was never seen (#204). `scripts/generate-agent.js` fixed
 * the same shape in #191; this is that pattern, with the child's stderr relayed
 * because the callers silence it on the happy path.
 *
 * Pure so the message can be asserted without a stale bundle to hand — see
 * `check-negation-ratchet.test.mjs`.
 *
 * @param {{status: number|null, signal?: string|null, stderr?: string}} child
 * @param {{tag?: string, notThis?: string}} [caller] how the calling guard names
 *   itself in the log, and the name of ITS measurement — so the reassurance
 *   below ("nothing is wrong with X") points at the right number.
 * @returns {string} the whole report, ready for stderr.
 */
export function bundlerFailureReport({ status, signal, stderr }, caller = {}) {
  const { tag = 'negation', notThis = 'the prohibition-token count' } = caller;
  const said = (stderr ?? '').trimEnd();
  // `--check` exits non-zero for a STALE artifact, a blown char budget, or a doc
  // with no `embodiment:` — so the headline names the cause it usually is and
  // then gets out of the way. The bundler's own line below says which.
  const how = signal ? `was killed by ${signal}` : `exited ${status ?? 1}`;
  return (
    `[${tag}] the harness bundler failed, so this check could not read the bundled set\n` +
    `  — usually a STALE bundle. Its own diagnostic:\n\n` +
    (said || `  (the bundler ${how} without printing anything)`) +
    `\n\n  -> Nothing is wrong with ${notThis}: the bundler ${how}, so the list of\n` +
    `     bundled docs was never available and not one doc was counted. If the bundle is\n` +
    `     stale, regenerate it, commit it, and re-run this check:\n` +
    `       ${REBUNDLE}`
  );
}

/**
 * The roots the bundler scans, flattened out of its `SECTIONS`.
 *
 * A COPY, DELIBERATELY, AND CHECKED AGAINST THE ORIGINAL. Order is a
 * bundle-level fact and `bundle-harness.mjs` says it is declared in `SECTIONS`
 * "and nowhere else" — so this does not move it. What this list is for is the
 * OTHER answer the same walk produces: the docs under those roots that say
 * `embodiment: ide`, which is the corpus `check:negation`'s IDE scope ratchets
 * (#174). Membership there is the same frontmatter fact, read the same way.
 *
 * The obvious objection is #159's: a second glob is a glob that can disagree.
 * It is answered the way #234 answered it for the marker parse rather than by
 * pretending the copy is safe — the bundler states its own census on stdout,
 * and `harnessSets` fails when this walk and that census differ. Drop a root
 * here and the count falls short of the bundler's; add one and it overshoots.
 * Either way it stops, instead of ratcheting a corpus that quietly lost a
 * directory.
 */
export const SECTION_ROOTS = [
  'AGENTS.md',
  'CONTEXT.md',
  'agents/uno-bot/AGENT.md',
  'skills',
  'docs/connectors',
  'docs/engineering',
  'docs/conventions',
];

/** Every `.md` under a root, or the root itself when it is a file. */
function walkDocs(rel) {
  const abs = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return rel.endsWith('.md') ? [rel] : [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    out.push(...walkDocs(path.posix.join(rel, entry.name)));
  }
  return out;
}

/**
 * A doc's declared `embodiment`, or null when it declares none.
 *
 * Exported so the tests can drive the classifier on strings. The bundler
 * refuses to build while any doc under a section root is undeclared, so null
 * here means "not reached through a section root" rather than "allowed".
 *
 * @param {string} text the file's whole contents, frontmatter included.
 * @returns {string|null}
 */
export function embodimentOf(text) {
  if (!text.startsWith('---\n')) return null;
  const close = text.indexOf('\n---', 4);
  if (close === -1) return null;
  const m = /^embodiment:\s*(.*)$/m.exec(text.slice(4, close));
  return m ? m[1].trim() : null;
}

/**
 * The IDE-side set: docs under the section roots declaring `embodiment: ide`.
 *
 * This is the exact complement of the bundled set within the same walk — a doc
 * under a section root is bundled (`all` / `uno-bot`) or it is this, and the
 * bundler fails the build if it is neither. That is what makes the two scopes
 * of `check:negation` cover the harness between them with nothing in both.
 *
 * It also settles two exclusions BY RULE rather than by list, which is what
 * #216 asked for. `docs/adr/` and `.claude/skills/` are not section roots, so
 * neither is reachable from here: ADRs (append-only, so a ratchet over them
 * rises by construction) and the generated `SKILL.md` faces (copies of docs
 * already counted) are out because of where they live, not because anyone
 * wrote their names down.
 *
 * @returns {string[]} repo-relative paths, sorted.
 */
export function ideAuthoredFiles() {
  return SECTION_ROOTS.flatMap(walkDocs)
    .filter((rel) => embodimentOf(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8')) === 'ide')
    .sort();
}

/**
 * Both halves of the harness, from ONE bundler run.
 *
 * `spawnSync` rather than `execFileSync`: the failure path is a report, not an
 * exception, and the child's stderr is the substance of it.
 *
 * @param {{tag?: string, notThis?: string}} [caller] see `bundlerFailureReport`.
 * @returns {{bundled: string[], ide: string[]}}
 */
export function harnessSets(caller = {}) {
  const { tag = 'negation' } = caller;
  const child = spawnSync('node', [BUNDLER, '--check'], {
    cwd: path.join(REPO_ROOT, 'agents/uno-bot'),
    encoding: 'utf8',
    // the bundler's own warnings are its business on the happy path — but its
    // stderr is captured rather than discarded, because on failure it is the
    // only thing worth printing.
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (child.error) {
    // Its own branch, because a bundler that could not START says nothing about
    // whether the bundle is stale, and borrowing the staleness wording here
    // would trade one misleading diagnostic for another.
    console.error(
      `[${tag}] could not run the harness bundler, so this check could not read the\n` +
        `  bundled set: ${child.error.message}\n` +
        `  -> ${BUNDLER}`,
    );
    process.exit(1);
  }
  if (child.status !== 0) {
    console.error(bundlerFailureReport(child, caller));
    // The child's own code, as in #191 — this layer adds a diagnosis, not a
    // verdict of its own.
    process.exit(typeof child.status === 'number' ? child.status : 1);
  }
  if (!/--check OK/.test(child.stdout ?? '')) {
    // Belt and braces, kept from the throw this replaced: a zero exit with no OK
    // line means the bundler changed under us, and measuring against a set it
    // did not confirm is worse than stopping.
    console.error(
      `[${tag}] the harness bundler exited 0 without confirming the bundle, so this check\n` +
        `  is measuring against a set it cannot vouch for. Run it directly to see why:\n` +
        `    ${REBUNDLE} -- --check`,
    );
    process.exit(1);
  }

  const ts = fs.readFileSync(HARNESS_TS, 'utf8');
  const assembled = JSON.parse(ts.slice(ts.indexOf('= ') + 2, ts.lastIndexOf(';')));
  // AGENTS.md is member 0 and carries no path comment of its own.
  const parsed = ['AGENTS.md', ...[...assembled.matchAll(/<!-- ([\w/.-]+\.md) -->/g)].map((m) => m[1])];

  // THE PARSE IS CHECKED AGAINST THE BUNDLER'S OWN COUNT (#234). Everything
  // above establishes that the bundle is current; none of it establishes that
  // the list just read back OUT of it is complete. Break the marker format and
  // this returns `['AGENTS.md']` — one doc, zero pairs — and every caller then
  // measures one twenty-first of the corpus and reports a pass. The bundler
  // states its member count on the line already being matched for `--check OK`,
  // so the second opinion costs one regex.
  const declared = declaredMemberCount(child.stdout ?? '');
  if (declared !== parsed.length) {
    console.error(membershipMismatchReport({ parsed: parsed.length, declared, tag }));
    process.exit(1);
  }

  // THE IDE WALK IS CHECKED THE SAME WAY (#174). `SECTION_ROOTS` above is a
  // copy of the bundler's roots, so it can fall behind them; the census line is
  // the bundler's own statement of what the same walk found, and comparing the
  // two is what makes the copy falsifiable. Both numbers are compared, not just
  // the IDE one — a root that vanished from this list shows up first in the
  // total, before it has narrowed either half enough to notice.
  const ide = ideAuthoredFiles();
  const census = declaredCensus(child.stdout ?? '');
  if (!census || census.ide !== ide.length || census.underRoots !== ide.length + parsed.length) {
    console.error(censusMismatchReport({ walkedIde: ide.length, bundled: parsed.length, census, tag }));
    process.exit(1);
  }

  return { bundled: parsed, ide };
}

/**
 * The bundled set, in load order, as repo-relative paths.
 *
 * Kept as its own export because `check:skill-overlap` asks only this question
 * and reads better for saying so.
 *
 * @param {{tag?: string, notThis?: string}} [caller] see `bundlerFailureReport`.
 * @returns {string[]}
 */
export function bundledFiles(caller = {}) {
  return harnessSets(caller).bundled;
}

/**
 * What the BUNDLER says its walk found, read off the census line it prints.
 *
 * `[bundle-harness] embodiment census: 67 declared doc(s) under the section roots — 21 bundled, 46 ide-only`
 *
 * @param {string} stdout the bundler's output.
 * @returns {{underRoots: number, bundled: number, ide: number}|null} null when
 *   the line is absent or has changed shape.
 */
export function declaredCensus(stdout) {
  const m = /embodiment census: ([\d,]+) declared doc\(s\) under the section roots [—-] ([\d,]+) bundled, ([\d,]+) ide-only/.exec(
    stdout ?? '',
  );
  if (!m) return null;
  const num = (s) => Number(s.replace(/,/g, ''));
  return { underRoots: num(m[1]), bundled: num(m[2]), ide: num(m[3]) };
}

/**
 * What the reader is owed when this module's walk and the bundler's disagree.
 *
 * Pure, so the message can be asserted without editing `SECTION_ROOTS` to break
 * it — same reason as `bundlerFailureReport` and `membershipMismatchReport`.
 *
 * @param {{walkedIde: number, bundled: number, census: {underRoots: number, ide: number}|null, tag?: string}} counts
 * @returns {string}
 */
export function censusMismatchReport({ walkedIde, bundled, census, tag = 'negation' }) {
  const said = census
    ? `it says ${census.ide} ide-only out of ${census.underRoots} under those roots`
    : 'its `embodiment census` line is absent or has changed shape';
  return (
    `[${tag}] this check's walk of the harness section roots disagrees with the bundler's:\n` +
    `  walked ${walkedIde} ide-only doc(s) and ${bundled} bundled (${walkedIde + bundled} in all), but ${said}.\n` +
    '  -> Membership is one frontmatter fact, but it is read TWICE: agents/uno-bot/scripts/bundle-harness.mjs\n' +
    '     walks its `SECTIONS` roots, and scripts/lib/bundled-set.mjs walks its own `SECTION_ROOTS` copy to\n' +
    '     find the ide-only complement. A root added to one and not the other narrows a corpus without\n' +
    '     emptying it, and a ratchet over a corpus that quietly shrank passes every time (#234). Bring\n' +
    "     `SECTION_ROOTS` back into line with the bundler's `SECTIONS` — the count is the symptom."
  );
}

/**
 * How many docs the BUNDLER says it bundled, read off its own `--check` line.
 *
 * `[bundle-harness] --check OK (164398 chars from 21 files; …)`
 *
 * This exists because the list above is RE-DERIVED, not received: the bundler
 * writes `<!-- path -->` markers into the artifact and this module parses them
 * back out. That is a second way of knowing the same fact, and a second way of
 * knowing is a way of being wrong — shift the marker format and the parse
 * quietly yields one member instead of twenty-one, with nothing to notice it.
 * The bundler's own count is the independent witness that makes the parse
 * falsifiable.
 *
 * @param {string} stdout the bundler's `--check` output.
 * @returns {number|null} null when the line is absent or has changed shape.
 */
export function declaredMemberCount(stdout) {
  const m = /--check OK \([\d,]+ chars from ([\d,]+) files/.exec(stdout ?? '');
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

/**
 * What the reader is owed when the two counts disagree.
 *
 * Pure, so the message can be asserted without a broken bundler to hand — same
 * reason as `bundlerFailureReport`.
 *
 * @param {{parsed: number, declared: number|null, tag?: string}} counts
 * @returns {string}
 */
export function membershipMismatchReport({ parsed, declared, tag = 'negation' }) {
  const said =
    declared === null
      ? 'its `--check OK` line no longer states a file count at all'
      : `it says it bundled ${declared}`;
  return (
    `[${tag}] the bundled set could not be read back from the artifact: this check parsed\n` +
    `  ${parsed} doc(s) out of ${path.relative(REPO_ROOT, HARNESS_TS)}, but ${said}.\n` +
    '  -> The membership list is DERIVED by matching `<!-- path -->` markers in the assembled\n' +
    '     bundle. A change to how the bundler writes those markers breaks the match without\n' +
    '     breaking the bundle, and a check that silently narrows to one doc passes over all\n' +
    '     twenty-one. Fix the marker parse in scripts/lib/bundled-set.mjs to match what\n' +
    '     agents/uno-bot/scripts/bundle-harness.mjs now emits — the count is the symptom.'
  );
}

/**
 * Read the bundled docs off disk, KEEPING the ones that did not resolve.
 *
 * The filter this replaces was `.filter((f) => fs.existsSync(...))` — a doc
 * whose path stopped resolving left the corpus with no error, no warning and no
 * count assertion, and the guard then compared what survived and printed the
 * narrowed number as though it were the whole set (#234). Same shape as the
 * corpus floors in `check-storybook.mjs` (#215) and `check-unspread-rest.mjs`
 * (#232): a walk that finds nothing passes over everything.
 *
 * Pure — it RETURNS the shortfall rather than exiting on it, so each caller can
 * fold it into its own report and the case can be tested without arranging a
 * missing file.
 *
 * @param {string[]} files repo-relative paths, in load order.
 * @returns {{declared: number, docs: {label: string, text: string}[], missing: string[]}}
 */
export function resolveBundled(files) {
  const docs = [];
  const missing = [];
  for (const rel of files) {
    const abs = path.join(REPO_ROOT, rel);
    if (fs.existsSync(abs)) docs.push({ label: rel, text: fs.readFileSync(abs, 'utf8') });
    else missing.push(rel);
  }
  return { declared: files.length, docs, missing };
}

/**
 * What the reader is owed when a declared doc does not resolve.
 *
 * @param {{missing: string[], declared: number, tag?: string}} shortfall
 * @returns {string}
 */
export function unresolvedReport({ missing, declared, tag = 'negation' }) {
  return (
    `[${tag}] ${missing.length} of the ${declared} doc(s) the bundler declares did not resolve\n` +
    `  on disk, so this check would have measured ${declared - missing.length}:\n` +
    missing.map((f) => `    ${f}`).join('\n') +
    '\n  -> A doc in the bundle with no file behind it is a broken bundle or a broken path\n' +
    '     parse, and either way the corpus is short. Measuring the remainder and reporting\n' +
    '     it as the whole is what #234 removed. Fix the path, or re-run the bundler:\n' +
    `       ${REBUNDLE}`
  );
}
