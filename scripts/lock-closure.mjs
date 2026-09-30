/**
 * Named packages and everything they depend on, each at the version
 * `package-lock.json` resolves, as `name@version` pins.
 *
 * WHY IT EXISTS. The harness job installs the stylesheet parser that
 * `check:focus-ring` and `check:text-contrast` read with in a scoped step, not
 * a root `npm ci` (`.github/workflows/check-harness.yml` says why). That step
 * pins every package with this, so nothing it installs is chosen by the
 * registry on the day. It runs before any install, so it imports nothing but
 * Node.
 *
 * HOW A NAME RESOLVES: the way npm does. A package at
 * `node_modules/a/node_modules/b` that depends on `c` finds it at
 * `node_modules/a/node_modules/b/node_modules/c`, then
 * `node_modules/a/node_modules/c`, then `node_modules/c` — the nearest
 * `node_modules` up the chain. A scoped name, `@s/c`, is one name at every step.
 *
 * WHAT IT WALKS: `dependencies` and `peerDependencies`, which npm installs, and
 * `optionalDependencies`. An optional dependency, or a peer marked optional,
 * that the lock does not hold is skipped, as npm skips it; anything else the
 * lock cannot resolve is an error.
 *
 * WHAT IT REFUSES: two versions of one name. The scoped step installs flat, so
 * a second version would be silently replaced by the first.
 *
 * Usage: node scripts/lock-closure.mjs <name>…   prints the pins, space-separated
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isEntry } from './lib/findings.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NM = 'node_modules/';

/** The `packages` map of the repo's `package-lock.json`. */
export function readLock(root = REPO_ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')).packages;
}

/**
 * The lock key `name` resolves to from the package at `from` (`''` for the
 * root), or null. Each step up drops one `node_modules/<name>` segment, which
 * for a scoped name is `node_modules/@s/name`, never `node_modules/@s`.
 *
 * @param {Record<string, object>} lock
 * @param {string} from
 * @param {string} name
 */
export function resolveIn(lock, from, name) {
  const chain = from ? from.slice(NM.length).split(`/${NM}`) : [];
  for (let depth = chain.length; depth >= 0; depth -= 1) {
    const key = NM + [...chain.slice(0, depth), name].join(`/${NM}`);
    if (lock[key]) return key;
  }
  return null;
}

/**
 * `roots` and their transitive dependencies as `name → version`.
 *
 * @param {Record<string, object>} lock  a lock's `packages`
 * @param {string[]} roots  names the root package depends on
 * @returns {Map<string, string>}
 */
export function lockClosure(lock, roots) {
  const pinned = new Map();
  const queue = roots.map((name) => ({ from: '', name, optional: false }));
  while (queue.length) {
    const { from, name, optional } = queue.shift();
    const key = resolveIn(lock, from, name);
    if (!key) {
      if (optional) continue;
      throw new Error(`${name} is not in package-lock.json (needed from ${from || 'the root'})`);
    }
    const { version, dependencies = {}, optionalDependencies = {}, peerDependencies = {}, peerDependenciesMeta = {} } = lock[key];
    if (pinned.has(name)) {
      if (pinned.get(name) !== version) {
        throw new Error(`two versions of ${name} in the lock (${pinned.get(name)} and ${version}); the scoped install is flat and holds one`);
      }
      continue;
    }
    pinned.set(name, version);
    for (const dep of Object.keys(dependencies)) queue.push({ from: key, name: dep, optional: false });
    for (const dep of Object.keys(optionalDependencies)) queue.push({ from: key, name: dep, optional: true });
    for (const dep of Object.keys(peerDependencies)) {
      queue.push({ from: key, name: dep, optional: Boolean(peerDependenciesMeta[dep]?.optional) });
    }
  }
  return pinned;
}

if (isEntry(import.meta.url)) {
  const pins = lockClosure(readLock(), process.argv.slice(2));
  console.log([...pins].map(([name, version]) => `${name}@${version}`).join(' '));
}
