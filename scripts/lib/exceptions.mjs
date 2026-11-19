/**
 * The exception lists — the harness's one reader of where a check deliberately
 * leaves something alone.
 *
 * Nine checks skip things on purpose: a package kept without being imported, a
 * vendored document whose pointers resolve elsewhere, a path that is history.
 * Each used to hold its own array, in its own shape, with the reason (when there
 * was one) in a comment beside it. They live in `scripts/exceptions.json` now,
 * one list per check, every entry the same shape:
 *
 *   { "at": "<the path, package or name>", "reason": "why it is excepted", …any field the check reads }
 *
 * A check reads its list here and holds none of its own. The reason is the
 * entry's argument, so an entry without one, or with a placeholder, is an error:
 * a list nobody can read the reasons of is a backlog.
 *
 * THREE THINGS THIS FILE IS NOT. It is not a baseline (`scripts/baselines/`): a
 * baseline records a count that may only fall, and an exception records a
 * decision that stands until its reason stops being true. It is not the
 * retirement list's allowed places (`design-system/agent-views/_inventions.json`):
 * those record where an old NAME may stay, and read through `retirement.mjs`.
 * And it is not a floor (`MIN_FILES`): that is a sentinel a check holds itself to.
 *
 * THE FILE IS THE HARNESS'S OWN, not the tree a check is pointed at: a test that runs a
 * check over a scratch tree still reads this checkout's lists.
 *
 * AN UNREADABLE FILE IS AN ERROR, NEVER AN EMPTY LIST. A list read wrong reads as
 * empty, and an empty exception list silently turns every skipped thing into a
 * finding — or, for a list that gates, into a pass.
 */

import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './corpus.mjs';
import { isUnreviewed } from './ratchet.mjs';

export const EXCEPTIONS = 'scripts/exceptions.json';

/** The shortest reason that says anything: a few characters is a label, not an argument. */
export const MIN_REASON = 20;

const plainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

class UnreadableExceptions extends Error {
  constructor(detail) {
    super(
      `${EXCEPTIONS} cannot be read as exception lists: ${detail}. A list read wrong reads as EMPTY, ` +
        'which turns every deliberate skip into a finding or a pass.',
    );
    this.name = 'UnreadableExceptions';
  }
}

/** The file's checks, parsed and shaped. */
function read(repoRoot) {
  let text;
  try {
    text = fs.readFileSync(path.join(repoRoot, EXCEPTIONS), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error(`no exception file at ${EXCEPTIONS}; the checks that read it have nothing to hold to.`);
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new UnreadableExceptions(`it is not JSON (${err.message})`);
  }
  if (!plainObject(parsed) || !plainObject(parsed.checks)) throw new UnreadableExceptions('it has no `checks` object');
  return parsed.checks;
}

/** The identity of an entry: everything but its reason and its count, so a count change is not a second entry. */
const identity = ({ reason, count, ...rest }) => JSON.stringify(rest);

/**
 * The names of the lists a check keeps.
 *
 * @param {string} check  the registry name, e.g. `check:deps`.
 * @param {{repoRoot?: string}} [opts]
 * @returns {string[]}
 */
export function listsOf(check, { repoRoot = REPO_ROOT } = {}) {
  const lists = read(repoRoot)[check];
  if (!plainObject(lists)) throw new UnreadableExceptions(`it holds no lists for ${check}`);
  return Object.keys(lists);
}

/**
 * One list of one check, validated: every entry an object with an `at` and a
 * reason that says something, none repeated.
 *
 * @param {string} check  the registry name, e.g. `check:deps`.
 * @param {string} list   which of the check's lists, e.g. `allowed`.
 * @param {{repoRoot?: string}} [opts]
 * @returns {({at: string, reason: string} & Record<string, unknown>)[]}  clones, in file order.
 */
export function loadExceptions(check, list, { repoRoot = REPO_ROOT } = {}) {
  const lists = read(repoRoot)[check];
  if (!plainObject(lists)) throw new UnreadableExceptions(`it holds no lists for ${check}`);
  const entries = lists[list];
  if (!Array.isArray(entries)) throw new UnreadableExceptions(`it holds no list \`${list}\` for ${check}`);
  const seen = new Set();
  return entries.map((entry, index) => {
    const where = `${check} ${list} entry ${index + 1}`;
    if (!plainObject(entry)) throw new UnreadableExceptions(`${where} is not an object`);
    if (typeof entry.at !== 'string' || !entry.at.trim()) throw new UnreadableExceptions(`${where} has no \`at\``);
    if (isUnreviewed(entry.reason) || entry.reason.trim().length < MIN_REASON) {
      throw new UnreadableExceptions(`${where} ("${entry.at}") names no reason of at least ${MIN_REASON} characters`);
    }
    const key = identity(entry);
    if (seen.has(key)) throw new UnreadableExceptions(`${check} ${list} lists "${entry.at}" twice`);
    seen.add(key);
    return structuredClone(entry);
  });
}
