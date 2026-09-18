/**
 * One fallback check, twice — the filesystem half of #268.
 *
 * WHY IT EXISTS. `scripts/token-fallbacks.mjs` already says, once, what the
 * defect is and how the colour and dimension families differ. What it does not
 * own is the FILESYSTEM: the repo root, the `git ls-files` helper that exists
 * because this repository keeps agent worktrees under `.claude/worktrees/`, the
 * read, the memoized parse, the empty-corpus floor, the `--report` dump, and
 * the one place both families reach their RECORD. Those were spelled out twice,
 * 110 lines each, in `check-colour-fallbacks.mjs` and
 * `check-size-fallbacks.mjs`, and the two copies had already drifted in wording
 * while agreeing in fact.
 *
 * THE RECORD ITSELF IS `scripts/lib/ratchet.mjs`'s (#600): the comparison, the
 * stale-entry sweep, the unreviewed-reason sweep and the `--update` merge are
 * one module's, for all twelve baselines in the repo. Because this file is
 * where both families reach theirs, migrating the pair was one read and one
 * write here rather than two of each. What stays is the WORDING, which is why
 * both reports are byte-identical across the move.
 *
 * So the two entry points keep exactly what differs between them — a `Family`
 * below — and this module is everything they share. The differences are facts
 * about the corpus, not preferences, and `token-fallbacks.mjs` argues each one:
 * which tokens the family covers, whether an undefined name is a finding, and
 * what the baseline record says about itself.
 *
 * WHAT IT DOES NOT DO. `design-system/src/lib/tokens-node.mjs` (#620) now owns
 * the corpus, the family map and value-equality, and these two checks are its
 * obvious callers — but #621 is the ticket that moves them, and the seam it
 * moves is `token-fallbacks.mjs`'s, not this one's. Collapsing here leaves that
 * migration with one caller instead of two.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { byRoot } from './findings.mjs';
import { openRatchet } from './ratchet.mjs';
import {
  fallbackAudit,
  fallbackFailures,
  fallbackSides,
  fallbackUsages,
  resolveAliases,
  tokenDefinitions,
} from '../token-fallbacks.mjs';

/** Two levels up from `scripts/lib/`, which is where both callers also sat. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Where the token sources are, and which of the tree is searched for uses. */
const TOKEN_DIR = 'design-system/src/tokens';
const SEARCHED = /\.(scss|css|jsx|tsx|mdx|html)$/;
const SEARCH_ROOTS = ['design-system/src', '.storybook', 'prototypes'];

/**
 * @typedef {object} Family
 * @property {string} check      the npm script name, for the banner.
 * @property {string} label      the `[colour]` / `[size]` prefix on `--update`.
 * @property {string} baseline   repo-relative path to the ratcheted record.
 * @property {string} noun       what one of this family's tokens is called, in
 *           a finding and in the green line: `colour`, `dimension`.
 * @property {string} absent     how the empty-corpus floor names what it looked
 *           for — a name pattern for colour, a kind for dimensions.
 * @property {string} [census]   the word before `token(s)` in the green line.
 *           Absent for the family whose whole namespace is its own name.
 * @property {string} [prefix]   the name `tokenDefinitions` selects on.
 * @property {(value: string) => unknown} [normalise]  how two values of this
 *           family are compared. Defaults to colour's.
 * @property {(tokens: Map<string, string>) => Map<string, string>} [select]
 *           a second, VALUE-level narrowing after aliases resolve — which is
 *           how the dimension family is defined at all, since it has no shared
 *           prefix to select on.
 * @property {boolean} reportUndefined  whether a `var()` on a name with no
 *           definition anywhere is a finding in this family.
 * @property {string} why        the baseline record's own explanation. SEEDED
 *           rather than written: `--update` puts it on a record that has none,
 *           so a brand-new record argues for itself, and leaves the sentence
 *           alone on a record that already carries one. The envelope is the
 *           check's to state once and its reader's to edit afterwards, and an
 *           `--update` that restated it would be the rewrite #599 removed.
 */

/**
 * The check a family earns: `run`, `summary`, and the two side flags, ready to
 * hand to `main()` from the findings module.
 *
 * @param {Family} family
 */
export function fallbackCheck(family) {
  const { check, label, baseline: BASELINE, noun, absent, census, prefix, normalise, select, reportUndefined, why } =
    family;

  // `git ls-files`, not a filesystem walk: this repository keeps agent worktrees
  // under `.claude/worktrees/`, and a walk finds a whole second copy of the tree.
  const tracked = (repoRoot, patterns) =>
    execFileSync('git', ['-C', repoRoot, 'ls-files', '-z', ...patterns], { encoding: 'utf8', maxBuffer: 1 << 28 })
      .split('\0')
      .filter(Boolean);

  const read = (repoRoot, rel) => ({ path: rel, text: fs.readFileSync(path.join(repoRoot, rel), 'utf8') });

  /**
   * The token sources, the corpus and the audit over them — once per repo root.
   * `run`, `summary` and `--report` all want the same audit, and it is two
   * `git ls-files` runs and a parse of the whole tree; doing it once is the
   * difference between these checks staying under a second and not. The
   * dimension half is the bigger one, at 1093 comparable fallbacks.
   */
  const inputs = byRoot((repoRoot) => {
    const tokenFiles = tracked(repoRoot, [TOKEN_DIR])
      .filter((f) => /\.(scss|css)$/.test(f))
      .map((rel) => read(repoRoot, rel));
    // Aliases resolved so `--color-x: var(--color-y)` compares as `--color-y`'s
    // value rather than as an incomparable `var()`. Load-bearing for dimensions
    // (124 of 207 tokens are aliases) and measured, not assumed, for colour:
    // adding it found two more `--color-info-*` disagreements, one alias hop
    // from `--color-tertiary-*` and so invisible to the check that shipped in
    // #313. Both were fixed rather than recorded; colour's set is still 191.
    const resolved = resolveAliases(tokenDefinitions(tokenFiles, prefix ? { prefix } : undefined));
    const tokens = select ? select(resolved) : resolved;

    const sources = tracked(repoRoot, SEARCH_ROOTS)
      .filter((f) => SEARCHED.test(f))
      .map((rel) => read(repoRoot, rel));
    const audit = fallbackAudit({
      tokens,
      usages: fallbackUsages(sources, prefix ? { prefix } : undefined),
      ...(normalise ? { normalise } : {}),
      reportUndefined,
    });

    return { tokens, audit };
  });

  /**
   * The record, on the shape `scripts/lib/ratchet-shapes.mjs` declares for it
   * (#600). Both families' records hold their set as a `keys` array, so a
   * presence-only ratchet is the whole comparison and a rise cannot be
   * expressed: every failure of these two is NEW, and the other direction that
   * matters — a recorded pair that has stopped disagreeing — is `stale()`.
   *
   * OPENED PER CALL rather than memoized with the audit. `openRatchet` reads
   * the record when it is opened and `update` merges into what it read, so a
   * ratchet held across a write would write the pre-write record back. The
   * colour family writes two sets into one file and would undo its own first
   * write; one named JSON file per call is nothing beside the corpus parse.
   */
  const gate = (repoRoot, set) => openRatchet({ file: BASELINE, set, repoRoot });

  /** @returns {import('./findings.mjs').Finding[]} */
  function run({ repoRoot = REPO_ROOT } = {}) {
    const { tokens, audit } = inputs(repoRoot);

    // An empty token map makes every comparison vacuous — and, where undefined
    // names are reported, makes every `var()` look like one. It is the shape a
    // moved directory produces, and the shape that reports green on a broken
    // tree.
    if (tokens.size === 0) {
      return [
        {
          message:
            `no ${absent} tokens found under ${TOKEN_DIR}. That is not a clean tree, it is a ` +
            'path that no longer exists.',
        },
      ];
    }

    const found = fallbackSides(audit);
    const pairs = gate(repoRoot, 'disagreements');

    // The absent record is ONE stated error mode and it is the module's — said
    // once even for the family whose record holds two sets, because with nothing
    // recorded every finding would otherwise be reported new, twice over, and
    // bury the one fact that matters.
    if (pairs.absent) return pairs.failures(found.disagreements).map(({ message }) => ({ message }));

    const names = reportUndefined ? gate(repoRoot, 'undefinedTokens') : null;
    const fresh = (ratchet, side) => ratchet.failures(side).map((f) => f.key);

    const failures = fallbackFailures(
      audit,
      {
        disagreements: fresh(pairs, found.disagreements),
        undefinedTokens: names ? fresh(names, found.undefinedTokens) : [],
      },
      { noun },
    );

    // "No longer disagrees" and "now defined" are different news, reported
    // together and in record order, which is what the one message below reads as.
    const stale = [
      ...pairs.stale(found.disagreements).map((entry) => entry.key),
      ...(names ? names.stale(found.undefinedTokens).map((entry) => `${entry.key} (now defined)`) : []),
    ];
    if (stale.length) {
      failures.push(
        `${stale.length} baseline entr(ies) that no longer disagree:\n` +
          stale.slice(0, 10).map((s) => `       ${s}`).join('\n') +
          (stale.length > 10 ? `\n       …and ${stale.length - 10} more` : '') +
          '\n     Someone fixed them. Delete the entries, so the baseline stops asserting\n' +
          '     something untrue and cannot readmit them silently.',
      );
    }
    return failures.map((message) => ({ message }));
  }

  /**
   * The green line. It carries the whole census rather than a verdict, because
   * the interesting number is how much of the corpus was COMPARABLE: a drop in
   * that is how a parse quietly stops reading fallbacks at all. The undefined
   * count appears only for a family that treats an undefined name as a finding
   * — in the other one it is usually correct code.
   */
  function summary({ repoRoot = REPO_ROOT } = {}) {
    const { tokens, audit } = inputs(repoRoot);
    return (
      `${tokens.size} ${census ? `${census} ` : ''}token(s); ` +
      `${audit.comparable} comparable fallback(s), ${audit.agreeing} agreeing, ` +
      `${audit.disagreements.length} recorded; ${audit.incomparable} not comparable` +
      (reportUndefined ? `; ${audit.undefinedTokens.length} undefined token(s), all recorded.` : '.')
    );
  }

  /**
   * `--update` re-records the baseline. A write, so it stays out of `run`, and
   * it is the RATCHET's write and not one of its own (#600): the module reads
   * the record, replaces the container at the declared path and writes the whole
   * record back, so every key it does not own survives by construction. This
   * function used to rebuild the file from an envelope and a set, which is the
   * defect that sank the first attempt at #599 — for these two records it would
   * have lost nothing today, and it is the same write that deleted three other
   * records' reasons.
   *
   * The record is keyed on `"<token> <literal>"` and not on file and line: a
   * line number churns on every edit above it, while the pair is the actual
   * decision. `undefinedTokens` is written only by the family that reports
   * them, so the other record has no such key to mis-read as empty.
   */
  function update(repoRoot = REPO_ROOT) {
    const { audit } = inputs(repoRoot);
    const found = fallbackSides(audit);
    // SORTED for the write, found-order for the gate. A record is read by
    // people and a diff that reorders is a diff nobody reads; a finding, on the
    // other hand, reads in the order the run met it.
    const keys = [...found.disagreements].sort();
    const undef = reportUndefined ? [...found.undefinedTokens].sort() : null;

    // The seed is what a BRAND-NEW record carries. It names the sibling set as
    // well as the prose, because a record written from nothing is written one
    // set at a time and the second set's container has to exist before its own
    // ratchet can be opened at all. A seed key is written only where the record
    // has none, so on a record that exists this whole object is inert.
    const written = gate(repoRoot, 'disagreements').update(keys, {
      seed: { why, ...(undef ? { undefinedTokens: [] } : {}) },
    });
    // Opened AFTER that write, never held from before it — see `gate`.
    if (undef) gate(repoRoot, 'undefinedTokens').update(undef, { seed: { why } });

    console.log(
      `${label} baseline written: ${written.entries} distinct disagreeing pair(s)` +
        (undef ? `, ${undef.length} undefined token(s).` : '.'),
    );
  }

  /** `--report` dumps the whole audit and then STILL HOLDS THE GATE (#609). */
  const printAudit = () => console.log(JSON.stringify(inputs(REPO_ROOT).audit, null, 2));

  return {
    check,
    run,
    summary,
    flags: { '--update': () => update() },
    fallThrough: { '--report': printAudit },
  };
}
