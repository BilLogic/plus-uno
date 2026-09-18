/**
 * The ratchet — the harness's one reader and writer of a baseline record.
 *
 * WHY IT EXISTS. Twelve rows in `scripts/checks.registry.mjs` declare a
 * `baseline`, and every one of them used to implement the ratchet privately:
 * the read, the comparison, the stale-entry sweep and the `--update` write,
 * spelled twelve times and never the same way twice. `ratchet()` in
 * `design-system/src/lib/tokens.mjs` (#506) already unified the CLASSIFICATION
 * for nine of them — it moves here, because a baseline record has nothing to do
 * with colour maths and because classification was only the middle third of the
 * job. What was still twelve-times-over is the READ (which container in the
 * record holds the set, and where the human's reason lives) and the WRITE.
 *
 * So the ratchet is a module: it owns the record's ENVELOPE, the direction that
 * fails, the STALE-ENTRY report, the UNREVIEWED-REASON report, and the
 * `--update` write. What stays with the check is the WORDING of its findings —
 * which is what lets a check migrate onto this without a byte of its report
 * changing.
 *
 * THE INVARIANT, ENTIRE — stated once here, asserted once in
 * `scripts/lib/ratchet-conformance.mjs`, against all twelve live records:
 *
 *   NEW    a failure the record does not hold. The build fails: fix it, or
 *          record it with a reason.
 *   ROSE   a recorded count the run exceeded. Fails where the set is
 *          shrink-only, which is ten of the twelve records.
 *   FELL   a recorded count the run came in under. Fails where the set is a
 *          FLOOR (atlassian's `ours`, each negation scope's corpus size) or
 *          where the record ratchets in BOTH directions (intent-roles).
 *          Silent everywhere else — a ratchet only fails on a rise.
 *   STALE  a recorded entry the run no longer finds. A failure too, and the
 *          direction most records forget: a ratchet that cannot shrink is a
 *          list.
 *   UNREVIEWED  a recorded entry carrying the placeholder `update` stamps.
 *          `--update` records the finding; only a person can record why it is
 *          allowed to stand.
 *   ABSENT no record on disk. ONE stated error mode, not twelve.
 *   UNREADABLE a record that will not parse, or whose declared container is
 *          missing or the wrong type. AN ERROR, NEVER AN EMPTY SET: an empty
 *          baseline is a green ratchet, so a silent mis-read is an invisible
 *          failure. This is the distinction the first attempt at #599 lost.
 *
 * `--update` IS A MERGE, NOT A REWRITE. A baseline is a record you must not
 * lose. `update` reads the record, replaces ONLY the container at the declared
 * path, and writes the whole record back — so every key the module does not own
 * survives by construction, `button-contrast`'s sibling `notes` and
 * `focus-ring`'s `measured` sweep included. Three of the twelve records keep
 * their reasons outside the entry, and rebuilding a record from an envelope and
 * a set deletes all three; that is what happened, and it is asserted per shape
 * in the conformance suite.
 *
 * THE RECORD HAS AN UNOWNED HALF, AND `envelope()` IS HOW A CHECK READS IT.
 * The module owns the ratcheted container; a record also carries prose and
 * measurements that are nobody's to ratchet, and three checks GATE on that
 * half. `check:negation` compares each scope's recorded `measuredOn` against
 * the reading its scope takes now, because switching one reading for another
 * moves the number with no doc edited (#238); `check:glossary` prints the date
 * its count was recorded on; `check:atlassian-benchmark` reads Atlassian's
 * published surface out of the same file, which is a measurement of somebody
 * else's system and has no direction at all. Without a read for that half each
 * of them would open the file a second time — and a check that parses its own
 * record is the whole defect this module exists to end, so the read lives here
 * and the file is opened once.
 *
 * `envelope()` is READ-ONLY and hands back a clone. A declared SET is never
 * read through it: the set has a shape, a direction and an error mode, and
 * `entries` is the only reading of it that carries them.
 *
 * A REASON IS NEVER INVENTED BY THE TOOL. `update` carries an existing reason
 * across untouched and stamps `UNREVIEWED` on an entry it has never seen, so a
 * run whose record still holds one is a run where somebody pressed `--update`
 * and skipped the only step that mattered. An entry that LEAVES the set takes
 * its reason with it, whether the reason sat in the entry or beside it — the
 * two homes get the same policy, because a stale exemption is the defect
 * `stale()` exists to report.
 *
 * WHAT IT READS THROUGH. `REPO_ROOT` comes from `scripts/lib/corpus.mjs`, the
 * repo's one reader, rather than being re-derived from this file's own location
 * (#469, #620); the record itself is one named JSON file, which the corpus has
 * no question for. Every function takes a root and never consults the process's
 * working directory, which is what lets the conformance suite drive the real
 * records in a scratch tree instead of planting fixtures in the live one.
 */

import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './corpus.mjs';
import { setOf, shapeOf } from './ratchet-shapes.mjs';

/**
 * The reason `update` stamps on an entry it has never seen. Deliberately a
 * sentence about the reader's job rather than a blank: a blank field reads like
 * a schema the tool forgot to fill, and this reads like the instruction it is.
 */
export const UNREVIEWED =
  'UNREVIEWED — replace with the reason this is not a defect, or fix it.';

/** The four words people type instead of thinking, plus a dash and a blank. */
const EMPTY_REASON = /^(todo|tbd|fixme|n\/?a|\?+|-+|—+)\.?$/i;

/** The synthetic field name for a set whose findings carry no count at all. */
const PRESENT = 'present';

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

/** A reason is carried across untouched, or stamped when there is none to carry. */
function carry(reason) {
  return reason !== undefined && !isUnreviewed(reason) ? reason : UNREVIEWED;
}

/** What the module says when a record cannot be read on its declared shape. */
class UnreadableRecord extends Error {
  constructor(file, detail) {
    super(
      `${file} cannot be read as the baseline shape it declares: ${detail}. ` +
        'Fix the record or its row in scripts/lib/ratchet-shapes.mjs — a record read on the ' +
        'wrong shape reads as EMPTY, and an empty baseline is a green ratchet.',
    );
    this.name = 'UnreadableRecord';
    this.file = file;
  }
}

/** Walk a dotted path. `''` is the value itself. */
function at(value, dotted, { file, whole }) {
  if (dotted === '') return value;
  let here = value;
  for (const step of dotted.split('.')) {
    if (here === null || typeof here !== 'object' || Array.isArray(here)) {
      throw new UnreadableRecord(file, `\`${whole}\` runs through \`${step}\`, which is not an object`);
    }
    if (!(step in here)) throw new UnreadableRecord(file, `it has no \`${whole}\``);
    here = here[step];
  }
  return here;
}

/** Walk a dotted path without deciding anything: `undefined` where it stops. */
const soft = (value, dotted) =>
  dotted.split('.').reduce((here, step) => (here === null || typeof here !== 'object' ? undefined : here[step]), value);

/** Set a dotted path on a mutable clone, creating nothing that is not there. */
function put(target, dotted, value) {
  const steps = dotted.split('.');
  const last = steps.pop();
  let here = target;
  for (const step of steps) {
    if (here[step] === null || typeof here[step] !== 'object') here[step] = {};
    here = here[step];
  }
  here[last] = value;
}

const plainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const number = (value, file, where) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new UnreadableRecord(file, `\`${where}\` is ${JSON.stringify(value)} rather than a number`);
  }
  return value;
};

/**
 * Normalise one side of the comparison — the record's container, or what a run
 * just measured — into `Map<key, {counts: Map<field, number>, reason, raw}>`.
 *
 * The SAME function reads both sides, from the SAME declared form. That is what
 * makes the comparison meaningful: a check hands in its findings in the shape
 * its record is written in, and nothing in between has to agree by convention.
 *
 * `raw` is kept because `update` writes the record back in its own shape, and
 * for `entries` and `lists` the payload beside the count is the record's
 * content — a ratio, the rule ids — not something the module may invent.
 *
 * @param {RatchetSetLike} set
 * @param {unknown} container
 * @param {string} file  named in every error, because the message is the only
 *                       thing standing between a mis-read and a green ratchet.
 */
function tally(set, container, file) {
  const out = new Map();
  const where = set.at === '' ? set.name : set.at;
  const ignore = new Set(set.ignore ?? []);

  if (container === undefined || container === null) {
    throw new UnreadableRecord(file, `\`${where}\` is ${String(container)}`);
  }

  if (set.form === 'keys') {
    if (!Array.isArray(container)) {
      throw new UnreadableRecord(file, `\`${where}\` is ${typeof container} rather than an array of keys`);
    }
    for (const key of container) {
      if (typeof key !== 'string') {
        throw new UnreadableRecord(file, `\`${where}\` holds ${JSON.stringify(key)}, which is not a key`);
      }
      out.set(key, { counts: new Map([[PRESENT, 1]]), reason: undefined, raw: key });
    }
    return out;
  }

  if (!plainObject(container)) {
    throw new UnreadableRecord(file, `\`${where}\` is ${Array.isArray(container) ? 'an array' : typeof container} rather than an object`);
  }

  if (set.form === 'scalar') {
    for (const field of set.fields) {
      if (!(field in container)) throw new UnreadableRecord(file, `\`${where}\` has no \`${field}\``);
      out.set(field, {
        counts: new Map([[field, number(container[field], file, `${where}.${field}`)]]),
        reason: undefined,
        raw: container[field],
      });
    }
    return out;
  }

  for (const [key, value] of Object.entries(container)) {
    if (ignore.has(key)) continue;

    if (set.form === 'counts') {
      out.set(key, {
        counts: new Map([['count', number(value, file, `${where}.${key}`)]]),
        reason: undefined,
        raw: value,
      });
      continue;
    }

    if (set.form === 'lists') {
      if (!Array.isArray(value)) {
        throw new UnreadableRecord(file, `\`${where}.${key}\` is ${typeof value} rather than a list`);
      }
      for (const member of value) {
        if (typeof member !== 'string') {
          throw new UnreadableRecord(file, `\`${where}.${key}\` holds ${JSON.stringify(member)}, which is not a member id`);
        }
        out.set(`${key}${set.join}${member}`, {
          counts: new Map([[PRESENT, 1]]),
          reason: undefined,
          raw: member,
        });
      }
      continue;
    }

    if (set.form === 'reasons') {
      if (typeof value !== 'string') {
        throw new UnreadableRecord(file, `\`${where}.${key}\` is ${typeof value} rather than the reason it records`);
      }
      out.set(key, { counts: new Map([[PRESENT, 1]]), reason: value, raw: value });
      continue;
    }

    // `entries`: one or more NAMED numbers, plus whatever else the record keeps
    // beside them. An entry with no declared field is presence, which is what
    // an exception map written as an object of objects would be.
    if (!plainObject(value)) {
      throw new UnreadableRecord(file, `\`${where}.${key}\` is ${typeof value} rather than an entry object`);
    }
    const counts = new Map();
    for (const field of set.fields ?? []) {
      if (!(field in value)) {
        throw new UnreadableRecord(file, `\`${where}.${key}\` has no \`${field}\``);
      }
      counts.set(field, number(value[field], file, `${where}.${key}.${field}`));
    }
    if (!counts.size) counts.set(PRESENT, 1);
    out.set(key, {
      counts,
      reason: set.reason?.in ? value[set.reason.in] : undefined,
      raw: value,
    });
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
  if (!plainObject(parsed)) {
    throw new UnreadableRecord(file, `its top level is ${Array.isArray(parsed) ? 'an array' : typeof parsed}`);
  }
  return parsed;
}

/**
 * The one stated absent-record error mode.
 *
 * @param {string} file     repo-relative path to the record.
 * @param {string|null} command  the `--update` invocation, or `null` where the
 *                               record is maintained by hand.
 */
export const absentMessage = (file, command) =>
  `no baseline is recorded at ${file}, so this check has nothing to hold to. ` +
  (command
    ? `Run \`${command}\` once and commit the result`
    : 'Record it by hand, with a reason per entry') +
  ' — a check whose record is missing must fail loudly, not pass quietly.';

/**
 * Open the ratchet over one set of one baseline record.
 *
 * @param {object} spec
 * @param {string} spec.file      repo-relative path; also its row's key in
 *                                `scripts/lib/ratchet-shapes.mjs`.
 * @param {string} [spec.set]     which declared set, for a record with more
 *                                than one. Nine of the twelve have exactly one.
 * @param {string} [spec.repoRoot]  the tree the record lives in.
 * @returns {Ratchet}
 *
 * @typedef {object} RatchetFailure
 * @property {'absent'|'new'|'rose'|'fell'} kind
 * @property {string} [key]
 * @property {string} [field]     which named count moved, for a multi-count entry.
 * @property {number} [count]     what the run found.
 * @property {number} [recorded]  what the record holds.
 * @property {string} [message]   set for `absent` only: the stated error mode.
 *
 * @typedef {object} Ratchet
 * @property {string} file
 * @property {string} set
 * @property {boolean} absent
 * @property {string} why        the record's own explanatory prose, `''` when absent.
 * @property {(dotted?: string) => unknown} envelope  the record's unowned half,
 *           by dotted path; `''` is the whole record. A clone, and read-only.
 * @property {Map<string, {counts: Map<string, number>, reason: string|undefined, raw: unknown}>} entries
 * @property {(found: unknown) => RatchetFailure[]} failures
 * @property {(found: unknown) => {key: string, recorded: number, reason: string|undefined}[]} stale
 * @property {() => {key: string, reason: string|undefined}[]} unreviewed
 * @property {(found: unknown) => {file: string, entries: number}} update
 */
export function openRatchet({ file, set: name, repoRoot = REPO_ROOT }) {
  const shape = shapeOf(file);
  const set = setOf(shape, name);
  const absolute = path.join(repoRoot, file);
  const record = readRecord(absolute, file);
  const absent = record === null;

  const container = absent ? undefined : at(record, set.at, { file, whole: set.at || set.name });
  const recorded = absent ? new Map() : tally(set, container, file);
  const reasonsBeside =
    absent || !set.reason?.beside ? {} : at(record, set.reason.beside, { file, whole: set.reason.beside });

  /** The recorded side with each entry's reason resolved from its own home. */
  const entries = new Map(
    [...recorded.entries()].map(([key, entry]) => [
      key,
      { ...entry, reason: set.reason?.beside ? reasonsBeside[key] : entry.reason },
    ]),
  );

  /** The run's side, read on the same declared form as the record's. */
  const measured = (found) => tally(set, found, `${file} (measured)`);

  const rises = set.direction !== 'grow-only';
  const falls = set.direction === 'grow-only' || set.direction === 'both';

  return {
    file,
    set: set.name,
    absent,
    // The record's own explanatory prose, for a reader. SOFT, unlike everything
    // else here: `why` decides nothing, and a record written from nothing by
    // `update` has no envelope yet — refusing to open it over a missing sentence
    // would make the absent-record path unreachable.
    why: absent || !shape.prose ? '' : String(soft(record, shape.prose) ?? ''),
    entries,

    /**
     * The record's UNOWNED half, by dotted path — the envelope prose, a date, a
     * measurement of somebody else's system. `''` is the whole record, the same
     * convention a set's `at` uses. A CLONE, because a reader of the envelope
     * must not be able to edit the module's reading of the record; `undefined`
     * where the path is not there, and where there is no record at all, since
     * every caller of this is reporting rather than deciding.
     *
     * Not for a declared set: `entries` is the only reading that carries the
     * set's shape, its direction and its error mode.
     */
    envelope(dotted = '') {
      if (absent) return undefined;
      return dotted === '' ? structuredClone(record) : soft(record, dotted);
    },

    /**
     * NEW, ROSE and FELL in the order the run found them — never grouped by
     * kind, so the list reads like the run. An absent record short-circuits to
     * the one stated error mode: with nothing recorded, every finding would
     * otherwise be reported NEW and bury the one fact that matters.
     */
    failures(found) {
      if (absent) return [{ kind: 'absent', message: absentMessage(file, shape.command) }];
      const out = [];
      for (const [key, entry] of measured(found)) {
        const was = recorded.get(key);
        if (!was) {
          out.push({ kind: 'new', key, count: entry.counts.values().next().value });
          continue;
        }
        for (const [field, count] of entry.counts) {
          const before = was.counts.get(field);
          if (before === undefined) continue;
          if (rises && count > before) out.push({ kind: 'rose', key, field, count, recorded: before });
          else if (falls && count < before) out.push({ kind: 'fell', key, field, count, recorded: before });
        }
      }
      return out;
    },

    /** Recorded entries the run no longer finds, in record order. */
    stale(found) {
      if (absent) return [];
      const seen = measured(found);
      return [...entries.entries()]
        .filter(([key]) => !seen.has(key))
        .map(([key, entry]) => ({
          key,
          recorded: entry.counts.values().next().value,
          reason: entry.reason,
        }));
    },

    /** Recorded entries whose reason says nothing. Empty where a set records none. */
    unreviewed() {
      if (absent || !set.reason) return [];
      return [...entries.entries()]
        .filter(([, entry]) => isUnreviewed(entry.reason))
        .map(([key, entry]) => ({ key, reason: entry.reason }));
    },

    /**
     * Re-record what was just measured. A WRITE, so a check calls it from its
     * terminal `--update` flag and never from `run`.
     *
     * A MERGE. The record is read, the container at the declared path is
     * replaced, and the whole record is written back: every other key survives
     * because nothing ever rebuilt the record. Where the reasons live BESIDE
     * the set, that sibling map is rewritten to the surviving keys and nothing
     * else on the record is touched.
     *
     * `seed` is the envelope prose a check wants a BRAND-NEW record to carry —
     * what it measured, and where the corpus came from. It is written only
     * where the record does not already hold that path, because the envelope is
     * the check's to state once and the reader's to edit afterwards; an
     * `--update` that restated it would be the rewrite this method exists not
     * to be. So a date stamp is NOT a seed: `check:glossary` and the benchmark
     * both say "set it by hand" on the line they print, because the day a count
     * was argued about is not the day a tool happened to re-record it.
     *
     * A seed key is a DOTTED PATH, like a set's `at` — `negation`'s envelope is
     * one corpus sentence and one reading per SCOPE, three levels in, and a
     * seed that could only reach the top level would leave a record written
     * from nothing failing its own reading comparison on the next run.
     *
     * @param {unknown} found
     * @param {{seed?: Record<string, unknown>}} [opts]
     */
    update(found, { seed = {} } = {}) {
      /*
       * THE MERGE STARTS FROM THE RECORD ON DISK NOW, not from the copy this
       * handle read when it was opened. A record with more than one set is
       * written one set at a time — `negation` writes six — and every one of
       * those handles has to be opened BEFORE the first write, because opening a
       * set whose container a previous write has not created yet is an
       * UNREADABLE record. Merging from the opened copy would then have each
       * write undo the last, which is the rewrite this method exists not to be,
       * one handle over. The RECORDED side stays as it was read: a reason is
       * carried from the record the comparison was made against.
       */
      const current = readRecord(absolute, file);
      const next = current === null ? {} : current;
      for (const [key, value] of Object.entries(seed)) {
        if (soft(next, key) === undefined) put(next, key, value);
      }
      const runs = measured(found);

      if (set.form === 'keys') {
        put(next, set.at, [...runs.keys()]);
      } else if (set.form === 'scalar') {
        for (const [field, entry] of runs) {
          put(next, set.at === '' ? field : `${set.at}.${field}`, entry.counts.get(field));
        }
      } else if (set.form === 'lists') {
        const grouped = {};
        for (const [key, entry] of runs) {
          const head = key.slice(0, key.length - entry.raw.length - set.join.length);
          (grouped[head] ??= []).push(entry.raw);
        }
        put(next, set.at, grouped);
      } else if (set.form === 'counts') {
        // Read out of `next` rather than out of `record`: `next` is the record
        // plus whatever the seed just wrote, and a brand-new record's ignored
        // keys — the benchmark's `note`, saying whose measurement this half is —
        // arrive by seed and would otherwise be replaced by the container write.
        const kept = {};
        for (const key of set.ignore ?? []) {
          const before = soft(next, set.at)?.[key];
          if (before !== undefined) kept[key] = before;
        }
        const written = { ...kept };
        for (const [key, entry] of runs) written[key] = entry.counts.get('count');
        put(next, set.at, written);
      } else if (set.form === 'reasons') {
        const written = {};
        for (const key of runs.keys()) written[key] = carry(entries.get(key)?.reason);
        put(next, set.at, written);
      } else {
        const written = {};
        for (const [key, entry] of runs) {
          written[key] = set.reason?.in
            ? { ...entry.raw, [set.reason.in]: carry(entries.get(key)?.reason) }
            : entry.raw;
        }
        put(next, set.at, written);
      }

      // The reasons map is MERGED, never rebuilt: `button-contrast` keeps one
      // `notes` beside BOTH of its sets, so a write that rebuilt the map from
      // this set's keys would delete the other set's reasons — the same defect
      // as rebuilding the record, one level in. This set's own lost keys are
      // pruned, because a stale exemption is what `stale()` exists to report.
      if (set.reason?.beside) {
        const notes = { ...(absent ? {} : (soft(record, set.reason.beside) ?? {})) };
        for (const key of recorded.keys()) if (!runs.has(key)) delete notes[key];
        for (const key of runs.keys()) notes[key] = carry(entries.get(key)?.reason);
        put(next, set.reason.beside, notes);
      }

      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, `${JSON.stringify(next, null, 2)}\n`);
      return { file, entries: runs.size };
    },
  };
}

/**
 * The classification on its own, for a caller that already holds both sides and
 * has no record to read — the shape `ratchet()` in
 * `design-system/src/lib/tokens.mjs` had before #599 moved it here, kept
 * because four scripts word their findings off it and their wording is theirs.
 *
 * @param {string[]|Record<string, number|{count?: number}>} failures
 * @param {string[]|Record<string, number|{count?: number}>} [baseline]
 * @returns {{
 *   new: {key: string, count: number}[],
 *   known: {key: string, count: number, recorded: number, rose: boolean, entry: object|undefined}[],
 *   fixed: {key: string, recorded: number, entry: object|undefined}[],
 * }}
 */
export function ratchet(failures, baseline) {
  const found = loose(failures);
  const recorded = loose(baseline);

  const fresh = [];
  const known = [];
  for (const [key, count] of found.counts) {
    if (!recorded.counts.has(key)) {
      fresh.push({ key, count });
      continue;
    }
    const was = recorded.counts.get(key);
    known.push({ key, count, recorded: was, rose: count > was, entry: recorded.entries.get(key) });
  }

  const fixed = [];
  for (const [key, was] of recorded.counts) {
    if (found.counts.has(key)) continue;
    fixed.push({ key, recorded: was, entry: recorded.entries.get(key) });
  }

  return { new: fresh, known, fixed };
}

/**
 * `ratchet`'s own normaliser: shape-agnostic on purpose, because its callers
 * hand it two sides they have already read and it has no row to read them on.
 * `openRatchet` never uses this — it reads a DECLARED shape and throws on a
 * record it cannot read, which is the whole difference between the two.
 */
function loose(side) {
  const counts = new Map();
  const entries = new Map();
  if (!side) return { counts, entries };

  const pairs = Array.isArray(side)
    ? side.map((key) => [key, 1])
    : side instanceof Map
      ? [...side.entries()]
      : Object.entries(side);

  for (const [key, value] of pairs) {
    const count = typeof value === 'number' ? value : Number(value?.count ?? 1);
    counts.set(key, Number.isFinite(count) ? count : 1);
    entries.set(key, typeof value === 'object' && value !== null ? value : undefined);
  }
  return { counts, entries };
}
