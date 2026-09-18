/**
 * The ratchet — the harness's one reader and writer of a baseline record.
 *
 * WHY IT EXISTS. Twelve rows in `scripts/checks.registry.mjs` declare a
 * `baseline`, and every one of them used to implement the ratchet privately:
 * the read, the shrink-only comparison, the stale-entry sweep and the
 * `--update` write, spelled twelve times and never the same way twice. Five of
 * the twelve detected no stale entry at all, so a fix could leave its exemption
 * behind and the record slowly became a list of things nobody had looked at.
 * One of the twelve required a written reason. And an absent record produced a
 * different outcome per check — a finding here, a crash there, a silent pass
 * somewhere else — which is the worst of the three, because a check that
 * crashes and a check that passes look identical to the person who deleted the
 * file.
 *
 * So the ratchet is a module: it owns the record's ENVELOPE (the `why` a reader
 * needs, the keyed set, the reason per entry), the SHRINK-ONLY INVARIANT, the
 * STALE-ENTRY report, the UNREVIEWED-REASON report, and the `--update` write.
 * What stays with the check is the WORDING of its findings and which direction
 * is fatal for it — which is what lets a check migrate onto this without a
 * byte of its report changing.
 *
 * THE INVARIANT, ENTIRE — stated once here and asserted once in
 * `scripts/lib/ratchet-conformance.mjs`:
 *
 *   NEW    a failure the record does not hold. The build fails: fix it, or
 *          record it with a reason.
 *   ROSE   a recorded count the run exceeded. The build fails — a recorded
 *          count may SHRINK and must never GROW.
 *   SHRANK a recorded count the run came in under. Silent. A ratchet only ever
 *          fails on a rise.
 *   STALE  a recorded entry the run no longer finds. A failure too, and the
 *          direction most records forget: a ratchet that cannot shrink is a
 *          list.
 *   UNREVIEWED  a recorded entry carrying the placeholder reason `--update`
 *          stamps on it. `--update` records the finding; only a person can
 *          record why it is allowed to stand.
 *   ABSENT no record on disk. ONE stated error mode (below), not twelve.
 *
 * A REASON IS NEVER INVENTED BY THE TOOL. `update` carries an existing reason
 * across untouched and stamps `UNREVIEWED` on an entry it has never seen, so a
 * run whose record still holds one is a run where somebody pressed `--update`
 * and skipped the only step that mattered.
 *
 * Every function takes a repo root and never consults the process's working
 * directory, which is what lets the conformance suite drive a real record in a
 * scratch directory rather than plant fixtures in the live tree.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * The reason `update` stamps on an entry it has never seen. It is deliberately
 * a sentence about the reader's job rather than a blank: a blank field reads
 * like a schema the tool forgot to fill, and this reads like the instruction it
 * is.
 */
export const UNREVIEWED =
  'UNREVIEWED — replace with the reason this is not a defect, or fix it.';

/** The placeholders a reason can be while saying nothing: the stamp, a blank,
 *  and the four words people type instead of thinking. */
const EMPTY_REASON = /^(todo|tbd|fixme|n\/?a|\?+|-+|—+)\.?$/i;

/**
 * Whether a recorded reason says nothing.
 *
 * @param {unknown} reason
 * @returns {boolean}
 */
export function isUnreviewed(reason) {
  if (typeof reason !== 'string') return true;
  const text = reason.trim();
  return text === '' || text.startsWith('UNREVIEWED') || EMPTY_REASON.test(text);
}

/**
 * Normalise either side of the comparison into `Map<key, {count, payload}>`,
 * so one module serves every record shape this repo has written.
 *
 * Accepted: an array of keys (each counted once), a plain object of
 * key → count, a plain object of key → `{count, …}` where the rest of the
 * record is the human's reason, or a Map of any of those. Insertion order is
 * preserved, because callers render in it — a report that reads like the run is
 * a report a reader can follow back into the tree.
 *
 * @param {unknown} side
 * @returns {Map<string, {count: number, payload: object|undefined}>}
 */
function tally(side) {
  const out = new Map();
  if (!side) return out;

  const pairs = Array.isArray(side)
    ? side.map((key) => [key, 1])
    : side instanceof Map
      ? [...side.entries()]
      : Object.entries(side);

  for (const [key, value] of pairs) {
    const count = typeof value === 'number' ? value : Number(value?.count ?? 1);
    out.set(key, {
      count: Number.isFinite(count) ? count : 1,
      payload: typeof value === 'object' && value !== null ? value : undefined,
    });
  }
  return out;
}

/** Read the record, or report it absent. Never throws on a missing file: an
 *  absent record is an outcome this module states, not an exception a caller
 *  has to remember to catch. */
function readRecord(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return null;
  }
}

/**
 * The one stated absent-record error mode.
 *
 * @param {string} rel      the record's repo-relative path.
 * @param {string} command  what a person runs to write it.
 */
export const absentMessage = (rel, command) =>
  `no baseline is recorded at ${rel}, so this check has nothing to hold to. ` +
  `Run \`${command}\` once and commit the result — a check whose record is ` +
  'missing must fail loudly, not pass quietly.';

/**
 * Open the ratchet over one baseline record.
 *
 * @param {object} spec
 * @param {string} spec.file        repo-relative path to the record.
 * @param {string} spec.repoRoot    the tree the record lives in.
 * @param {string} spec.command     the `--update` invocation, for the remedy.
 * @param {string} [spec.set]       the keyed set inside the record. Default
 *                                  `findings`.
 * @param {string} [spec.reasonKey] the per-entry field holding the human's
 *                                  reason. Default `why`.
 * @param {object} [spec.envelope]  the top-level keys `update` writes ahead of
 *                                  the set — the record's own `why`, what was
 *                                  measured, when. Written in the order given.
 * @returns {Ratchet}
 *
 * @typedef {object} RatchetFailure
 * @property {'absent'|'new'|'rose'} kind
 * @property {string} [key]
 * @property {number} [count]     what the run found.
 * @property {number} [recorded]  what the record holds.
 * @property {string} [message]   set for `absent` only: the stated error mode.
 *
 * @typedef {object} Ratchet
 * @property {string} file        repo-relative, as given.
 * @property {string} set         the keyed set inside the record.
 * @property {boolean} absent     no record on disk.
 * @property {string} why         the record's envelope prose, `''` when absent.
 * @property {string} reasonKey
 * @property {Map<string, {count: number, reason: string|undefined, entry: object|undefined}>} entries
 * @property {(found: unknown) => RatchetFailure[]} failures
 * @property {(found: unknown) => {key: string, recorded: number, reason: string|undefined}[]} stale
 * @property {() => {key: string, reason: string|undefined}[]} unreviewed
 * @property {(found: unknown) => {file: string, entries: number}} update
 */
export function openRatchet({
  file,
  repoRoot,
  command,
  set = 'findings',
  reasonKey = 'why',
  envelope = {},
}) {
  const absolute = path.join(repoRoot, file);
  const record = readRecord(absolute);
  const absent = record === null;
  const recorded = tally(record?.[set]);

  /** The recorded side, with each entry's reason resolved. */
  const entries = new Map(
    [...recorded.entries()].map(([key, { count, payload }]) => [
      key,
      { count, reason: payload?.[reasonKey], entry: payload },
    ]),
  );

  return {
    file,
    set,
    absent,
    why: typeof record?.why === 'string' ? record.why : '',
    reasonKey,
    entries,

    /**
     * NEW and ROSE, in the order the run found them — never grouped by kind, so
     * the list reads like the run. An absent record short-circuits to the one
     * stated error mode: with nothing recorded, every finding would otherwise
     * be reported as NEW and bury the one fact that matters.
     */
    failures(found) {
      if (absent) return [{ kind: 'absent', message: absentMessage(file, command) }];
      const out = [];
      for (const [key, { count }] of tally(found)) {
        const was = recorded.get(key);
        if (!was) out.push({ kind: 'new', key, count });
        else if (count > was.count) out.push({ kind: 'rose', key, count, recorded: was.count });
      }
      return out;
    },

    /** Recorded entries the run no longer finds, in record order. */
    stale(found) {
      if (absent) return [];
      const seen = tally(found);
      return [...entries.entries()]
        .filter(([key]) => !seen.has(key))
        .map(([key, { count, reason }]) => ({ key, recorded: count, reason }));
    },

    /** Recorded entries whose reason says nothing. */
    unreviewed() {
      if (absent) return [];
      return [...entries.entries()]
        .filter(([, { reason }]) => isUnreviewed(reason))
        .map(([key, { reason }]) => ({ key, reason }));
    },

    /**
     * Re-record what was just measured. A write, so a check calls it from its
     * CLI and never from `run`.
     *
     * `found` carries the per-entry payload the check wants kept — a count, a
     * measured ratio — and never the reason: that is read off the record being
     * replaced, or stamped `UNREVIEWED`.
     */
    update(found) {
      const next = {};
      for (const [key, { count, payload }] of tally(found)) {
        const carried = entries.get(key)?.reason;
        next[key] = {
          ...(payload ?? { count }),
          [reasonKey]: carried !== undefined && !isUnreviewed(carried) ? carried : UNREVIEWED,
        };
      }
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, `${JSON.stringify({ ...envelope, [set]: next }, null, 2)}\n`);
      return { file, entries: Object.keys(next).length };
    },
  };
}
