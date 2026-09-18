/**
 * One fallback check, twice — the filesystem half of #268.
 *
 * WHY IT EXISTS. `scripts/token-fallbacks.mjs` already says, once, what the
 * defect is and how the colour and dimension families differ. What it does not
 * own is the FILESYSTEM: the repo root, the `git ls-files` helper that exists
 * because this repository keeps agent worktrees under `.claude/worktrees/`, the
 * read, the memoized parse, the empty-corpus floor, the stale-entry sweep, the
 * `--report` dump and the `--update` write. Those were spelled out twice, 110
 * lines each, in `check-colour-fallbacks.mjs` and `check-size-fallbacks.mjs`,
 * and the two copies had already drifted in wording while agreeing in fact.
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
import {
  fallbackAudit,
  fallbackFailures,
  fallbackUsages,
  resolveAliases,
  staleEntries,
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
 * @property {string} why        the baseline record's own explanation, written
 *           into it by `--update` so the record argues for itself.
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

    let record = null;
    try {
      record = JSON.parse(fs.readFileSync(path.join(repoRoot, BASELINE), 'utf8'));
    } catch {
      /* absent — reported by fallbackFailures */
    }

    return { tokens, audit, baseline: record };
  });

  /** @returns {import('./findings.mjs').Finding[]} */
  function run({ repoRoot = REPO_ROOT } = {}) {
    const { tokens, audit, baseline } = inputs(repoRoot);

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

    const failures = fallbackFailures(audit, baseline, { noun });
    const stale = baseline ? staleEntries(audit, baseline) : [];
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
   * `--update` re-records the baseline. A write, so it stays out of `run`.
   *
   * The record is keyed on `"<token> <literal>"` and not on file and line: a
   * line number churns on every edit above it, while the pair is the actual
   * decision. `undefinedTokens` is written only by the family that reports
   * them, so the other record has no such key to mis-read as empty.
   */
  function update(repoRoot = REPO_ROOT) {
    const { audit } = inputs(repoRoot);
    const keys = [...new Set(audit.disagreements.map((d) => d.key))].sort();
    const undef = reportUndefined ? audit.undefinedTokens.map((u) => u.token).sort() : null;
    const file = path.join(repoRoot, BASELINE);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      `${JSON.stringify(
        { why, disagreements: keys, ...(undef ? { undefinedTokens: undef } : {}) },
        null,
        2,
      )}\n`,
    );
    console.log(
      `${label} baseline written: ${keys.length} distinct disagreeing pair(s)` +
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
