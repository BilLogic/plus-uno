/**
 * The ratchet — the harness's one reader and writer of a baseline record.
 *
 * Every row in `scripts/checks.registry.mjs` that declares a `baseline` reads
 * and writes its record here. The check keeps the WORDING of its findings; this
 * module owns the record's envelope, the direction that fails, the stale-entry
 * report, the unreviewed-reason report and the `--update` write.
 *
 * ONE ENVELOPE, EVERY RECORD. A record describes itself, so a new ratchet needs
 * no table row anywhere:
 *
 *   {
 *     "why": "what the record holds and why it may stand",
 *     …any other prose or measurement the check reads through `envelope()`,
 *     "sets": {
 *       "<name>": {
 *         "direction": "grow-only" | "both",   // absent: shrink-only
 *         "reasons": "required",                // absent: a reason is optional
 *         "entries": { "<key>": { "count": 3, "reason": "…" } }
 *       }
 *     }
 *   }
 *
 * A record with one set calls it `main`, and a check opens it without naming
 * it. A presence-only finding is `count: 1`; a single number (a floor, a census
 * total) is an entry keyed by its name; an entry that ratchets two numbers is
 * two sets keyed the same way, and `acrossSets` reads them as one.
 *
 * THE INVARIANT:
 *
 *   NEW    a finding the record does not hold. Fails.
 *   ROSE   a recorded count the run exceeded. Fails unless the set is
 *          `grow-only`.
 *   FELL   a recorded count the run came in under. Fails where the set is
 *          `grow-only` (a floor) or `both`; silent otherwise.
 *   STALE  a recorded entry the run no longer finds. The check reports it, so a
 *          fix cannot leave its exemption behind.
 *   UNREVIEWED  an entry whose reason says nothing, in a set whose reasons are
 *          required. `--update` records the finding; only a person records why.
 *   ABSENT no record on disk: one stated error mode.
 *   UNREADABLE a record that will not parse, or whose set is missing or the
 *          wrong type. An error, never an empty set: an empty baseline is a
 *          green ratchet, so a silent mis-read is an invisible failure.
 *
 * `--update` IS A MERGE. It reads the record on disk now, replaces only the
 * set's `entries`, and writes the whole record back, so every key the module
 * does not own survives. A reason is carried across untouched, and an entry the
 * record has never seen gets `UNREVIEWED` where the set requires one. The write
 * is `JSON.stringify(record, null, 2)` plus a newline, and the test suite holds
 * every live record to that encoding, so a no-movement `--update` changes no
 * byte.
 *
 * `envelope()` reads the record's unowned half — prose, a date, a measurement
 * of somebody else's system — so a check never opens its record a second time.
 */

import fs from 'node:fs';
import path from 'node:path';

import { ALL } from '../checks.registry.mjs';
import { REPO_ROOT } from './corpus.mjs';

/**
 * The reason `update` stamps on an entry it has never seen. A sentence about
 * the reader's job rather than a blank, which would read like a field the tool
 * forgot.
 */
export const UNREVIEWED =
  'UNREVIEWED — replace with the reason this is not a defect, or fix it.';

/** The four words people type instead of thinking, plus a dash and a blank. */
const EMPTY_REASON = /^(todo|tbd|fixme|n\/?a|\?+|-+|—+)\.?$/i;

/** The set a check opens when it names none: a record with one set calls it this. */
export const MAIN = 'main';

const DIRECTIONS = new Set(['shrink-only', 'grow-only', 'both']);

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

/** What the module says when a record cannot be read. */
class UnreadableRecord extends Error {
  constructor(file, detail) {
    super(
      `${file} cannot be read as a baseline record: ${detail}. A record read wrong reads as ` +
        'EMPTY, and an empty baseline is a green ratchet.',
    );
    this.name = 'UnreadableRecord';
    this.file = file;
  }
}

const plainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Walk a dotted path without deciding anything: `undefined` where it stops. */
const soft = (value, dotted) =>
  dotted.split('.').reduce((here, step) => (here === null || typeof here !== 'object' ? undefined : here[step]), value);

/** Set a dotted path on a mutable record, making the objects on the way. */
function put(target, dotted, value) {
  const steps = dotted.split('.');
  const last = steps.pop();
  let here = target;
  for (const step of steps) {
    if (!plainObject(here[step])) here[step] = {};
    here = here[step];
  }
  here[last] = value;
}

const count = (value, file, where) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new UnreadableRecord(file, `\`${where}\` is ${JSON.stringify(value)} rather than a number`);
  }
  return value;
};

/**
 * One side of the comparison as `Map<key, number>`. A run hands in an array of
 * keys (presence, count 1), or an object of key → number, or key → an object
 * carrying `count`.
 */
function measure(found, file) {
  const out = new Map();
  if (Array.isArray(found)) {
    for (const key of found) out.set(String(key), 1);
    return out;
  }
  if (!plainObject(found)) throw new UnreadableRecord(file, `the run handed in ${typeof found}`);
  for (const [key, value] of Object.entries(found)) {
    out.set(key, count(plainObject(value) ? value.count : value, file, key));
  }
  return out;
}

/** Read the record. Absent is an outcome; unparseable is an error. */
function readRecord(absolute, file) {
  let text;
  try {
    text = fs.readFileSync(absolute, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new UnreadableRecord(file, `it is not JSON (${err.message})`);
  }
  if (!plainObject(parsed)) throw new UnreadableRecord(file, 'its top level is not an object');
  return parsed;
}

/** The named set of a record, checked: its entries, direction and reason rule. */
function readSet(record, name, file) {
  const sets = record.sets;
  if (!plainObject(sets)) throw new UnreadableRecord(file, 'it has no `sets` object');
  const set = sets[name];
  if (!plainObject(set)) {
    throw new UnreadableRecord(file, `it has no set \`${name}\`; it records ${Object.keys(sets).join(', ') || 'none'}`);
  }
  const direction = set.direction ?? 'shrink-only';
  if (!DIRECTIONS.has(direction)) {
    throw new UnreadableRecord(file, `set \`${name}\` has direction ${JSON.stringify(direction)}`);
  }
  if (!plainObject(set.entries)) throw new UnreadableRecord(file, `set \`${name}\` has no \`entries\` object`);
  const entries = new Map();
  for (const [key, entry] of Object.entries(set.entries)) {
    if (!plainObject(entry)) throw new UnreadableRecord(file, `\`${name}.${key}\` is not an entry object`);
    entries.set(key, { count: count(entry.count, file, `${name}.${key}.count`), reason: entry.reason });
  }
  return { direction, required: set.reasons === 'required', entries };
}

/**
 * The one stated absent-record error mode, naming the `update` line the
 * record's registry row declares, or asking for it by hand where it has none.
 *
 * @param {string} file repo-relative path to the record.
 */
export function absentMessage(file) {
  const command = ALL.find((row) => row.baseline === file)?.update;
  return (
    `no baseline is recorded at ${file}, so this check has nothing to hold to. ` +
    (command ? `Run \`${command}\` once and commit the result` : 'Record it by hand, with a reason per entry') +
    ' — a check whose record is missing must fail loudly, not pass quietly.'
  );
}

/**
 * Open the ratchet over one set of one baseline record.
 *
 * @param {object} spec
 * @param {string} spec.file        repo-relative path to the record.
 * @param {string} [spec.set]       which set; `main` where the record has one.
 * @param {string} [spec.repoRoot]  the tree the record lives in.
 * @returns {Ratchet}
 *
 * @typedef {object} RatchetFailure
 * @property {'absent'|'new'|'rose'|'fell'} kind
 * @property {string} [key]
 * @property {number} [count]     what the run found.
 * @property {number} [recorded]  what the record holds.
 * @property {string} [message]   set for `absent` only.
 *
 * @typedef {object} Ratchet
 * @property {string} file
 * @property {string} set
 * @property {boolean} absent
 * @property {string} why        the record's `why`, `''` when absent.
 * @property {(dotted?: string) => unknown} envelope  the record by dotted path; a clone.
 * @property {Map<string, {count: number, reason: string|undefined}>} entries
 * @property {(found: unknown) => RatchetFailure[]} failures
 * @property {(found: unknown) => {key: string, recorded: number, reason: string|undefined}[]} stale
 * @property {() => {key: string, reason: string|undefined}[]} unreviewed
 * @property {(found: unknown, opts?: {seed?: Record<string, unknown>}) => {file: string, entries: number}} update
 */
export function openRatchet({ file, set: name = MAIN, repoRoot = REPO_ROOT }) {
  const absolute = path.join(repoRoot, file);
  const record = readRecord(absolute, file);
  const absent = record === null;
  const { direction, required, entries } = absent
    ? { direction: 'shrink-only', required: false, entries: new Map() }
    : readSet(record, name, file);
  const measured = (found) => measure(found, `${file} (measured)`);
  const rises = direction !== 'grow-only';
  const falls = direction !== 'shrink-only';

  return {
    file,
    set: name,
    absent,
    why: absent ? '' : String(record.why ?? ''),
    entries,

    /** The record by dotted path, `''` for all of it. A clone; `undefined` where absent. */
    envelope(dotted = '') {
      if (absent) return undefined;
      return structuredClone(dotted === '' ? record : soft(record, dotted));
    },

    /**
     * NEW, ROSE and FELL in the order the run found them. An absent record is
     * the one failure, so it is not buried under every finding reported NEW.
     */
    failures(found) {
      if (absent) return [{ kind: 'absent', message: absentMessage(file) }];
      const out = [];
      for (const [key, now] of measured(found)) {
        const was = entries.get(key);
        if (!was) out.push({ kind: 'new', key, count: now });
        else if (rises && now > was.count) out.push({ kind: 'rose', key, count: now, recorded: was.count });
        else if (falls && now < was.count) out.push({ kind: 'fell', key, count: now, recorded: was.count });
      }
      return out;
    },

    /** Recorded entries the run no longer finds, in record order. */
    stale(found) {
      if (absent) return [];
      const seen = measured(found);
      return [...entries]
        .filter(([key]) => !seen.has(key))
        .map(([key, entry]) => ({ key, recorded: entry.count, reason: entry.reason }));
    },

    /** Entries whose reason says nothing, where the set requires one. */
    unreviewed() {
      if (!required) return [];
      return [...entries]
        .filter(([, entry]) => isUnreviewed(entry.reason))
        .map(([key, entry]) => ({ key, reason: entry.reason }));
    },

    /**
     * Re-record what was just measured: a WRITE, so a check calls it from its
     * `--update` flag and never from `run`.
     *
     * The merge starts from the record on disk now, not the copy read at open:
     * a record with several sets is written one set at a time, and merging from
     * the opened copy would have each write undo the last.
     *
     * `seed` is prose a brand-new record should carry, by dotted path, written
     * only where the record does not already hold it: the envelope is the
     * reader's to edit afterwards, so a date is never a seed.
     */
    update(found, { seed = {} } = {}) {
      const next = readRecord(absolute, file) ?? {};
      for (const [key, value] of Object.entries(seed)) {
        if (soft(next, key) === undefined) put(next, key, value);
      }
      const written = {};
      for (const [key, now] of measured(found)) {
        const reason = entries.get(key)?.reason;
        const kept = reason !== undefined && !isUnreviewed(reason) ? reason : required ? UNREVIEWED : reason;
        written[key] = kept === undefined ? { count: now } : { count: now, reason: kept };
      }
      put(next, `sets.${name}.entries`, written);
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, `${JSON.stringify(next, null, 2)}\n`);
      return { file, entries: Object.keys(written).length };
    },
  };
}

/**
 * The verdicts of sets keyed alike, where each found entry carries one number
 * per set — an entry that ratchets two numbers is two sets. One list in the
 * run's order, each failure tagged with the `field` (set) it moved in. A new or
 * stale key is in every set, so it is said once, from the first.
 *
 * @param {Record<string, Record<string, number>>} found  key → { [set]: count }
 * @param {Record<string, Ratchet>} sets  set name → its opened ratchet
 * @returns {{failures: (RatchetFailure & {field: string})[], stale: {key: string, recorded: number, reason: string|undefined}[]}}
 */
export function acrossSets(found, sets) {
  const keys = Object.keys(found);
  const side = (field) => Object.fromEntries(keys.map((key) => [key, found[key][field]]));
  const [first, ...rest] = Object.keys(sets);
  const failures = [first, ...rest].flatMap((field) =>
    sets[field]
      .failures(side(field))
      .filter((f) => field === first || f.kind !== 'new')
      .map((f) => ({ ...f, field })),
  );
  failures.sort((a, b) => keys.indexOf(a.key) - keys.indexOf(b.key));
  return { failures, stale: sets[first].stale(side(first)) };
}
