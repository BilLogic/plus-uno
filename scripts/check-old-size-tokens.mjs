/**
 * `npm run check:old-size-tokens` — the ratchet on the four pre-ADR-038 size
 * vocabularies this ticket's role tokens (ADR-038) replace: `--size-element-*`
 * (`_spacing_semantics.scss`) and the bare `--card-*` / `--section-*` /
 * `--modal-*` / `--surface-*` names (`_frame_layers.scss`).
 *
 * WHAT IT READS. Every tracked `.scss .css .jsx .js .mjs .ts .tsx .html .mdx`
 * file under `design-system/src`, `prototypes` and `src`, by `git ls-files`.
 *
 * WHAT IT COUNTS. `var(` uses of a token actually DECLARED under one of
 * `OLD_SIZE_PREFIXES` (`scripts/lib/tokens/plan.mjs`) in
 * `_spacing_semantics.scss` or `_frame_layers.scss`, per file — the exact
 * name set, not the bare prefix: `--card-` is also the prefix of the new role
 * tokens (`--card-pad-default`), and a prefix match alone would count a
 * migrated caller as still-old the moment it reads its replacement.
 *
 * THE RATCHET. A count may fall and never rise, same shape and the same
 * `scripts/lib/ratchet.mjs` as `check:legacy-colors`. A family PR that moves a
 * component onto a role token lowers the baseline with
 *
 *     npm run check:old-size-tokens -- --update
 *
 * and commits the regenerated file in the same PR. Never edit it by hand.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { OLD_SIZE_PREFIXES } from './lib/tokens/plan.mjs';
import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import { tokenDeclarationPattern, varReferencePattern } from '../design-system/src/lib/tokens.mjs';

export { REPO_ROOT };

export const BASELINE = 'scripts/baselines/old-size-tokens.json';
export const SEARCH_ROOTS = ['design-system/src', 'prototypes', 'src'];
export const SEARCHED = /\.(scss|css|jsx|js|mjs|ts|tsx|html|mdx)$/;
const TEST = /\.test\.[cm]?[jt]sx?$/;

/** The declared legacy source files: the only two places an old-prefixed name is defined. */
const DECLARING_FILES = ['design-system/src/tokens/_spacing_semantics.scss', 'design-system/src/tokens/_frame_layers.scss'];

/**
 * The exact set of old token names in use today — not a prefix guess. A name
 * under one of `OLD_SIZE_PREFIXES` but declared somewhere else (a role token
 * like `--card-pad-default`) is never in this set, so it is never counted.
 * @param {string} repoRoot
 * @returns {Set<string>}
 */
export function oldSizeTokenNames(repoRoot) {
  const names = new Set();
  for (const rel of DECLARING_FILES) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    for (const [, name] of text.matchAll(tokenDeclarationPattern())) {
      if (OLD_SIZE_PREFIXES.some((p) => name.startsWith(p))) names.add(name);
    }
  }
  return names;
}

/** Every tracked, searched file under the roots, read. */
export function sourcesOf(repoRoot) {
  return execFileSync('git', ['-C', repoRoot, 'ls-files', '-z', ...SEARCH_ROOTS], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  })
    .split('\0')
    .filter((rel) => rel && SEARCHED.test(rel) && fs.existsSync(path.join(repoRoot, rel)))
    .map((rel) => ({ path: rel, text: fs.readFileSync(path.join(repoRoot, rel), 'utf8') }));
}

/**
 * `path -> {count, line}` across every source.
 * @param {{path: string, text: string}[]} sources
 * @param {Set<string>} oldNames
 */
export function measure(sources, oldNames) {
  const found = new Map();
  const pattern = varReferencePattern();
  for (const { path: file, text } of sources) {
    if (TEST.test(file)) continue;
    const lines = text.split('\n');
    let count = 0;
    let line;
    lines.forEach((l, i) => {
      const hits = [...l.matchAll(pattern)].filter(([, name]) => oldNames.has(name)).length;
      if (hits) line ??= i + 1;
      count += hits;
    });
    if (count > 0) found.set(file, { count, line });
  }
  return found;
}

const asRecord = (found) =>
  Object.fromEntries([...found.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, v.count]));

const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });

export const REMEDY =
  '  -> move the component to a role token (design-system/src/tokens/deep/_roles.scss, ADR-038)\n' +
  '     and drop the old --size-element-*/--card-*/--section-*/--modal-*/--surface-* name. A migration\n' +
  '     PR lowers the baseline with `npm run check:old-size-tokens -- --update`; never edit it by hand.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot), oldSizeTokenNames(repoRoot));
  const ratchet = ratchetFor(repoRoot);
  const findings = ratchet.failures(asRecord(found)).map((failure) => {
    if (failure.kind === 'absent') return { message: failure.message };
    return {
      file: failure.key,
      line: found.get(failure.key)?.line,
      message:
        failure.kind === 'new'
          ? `old size token: ${failure.count} use(s) in a file the baseline does not hold (new code starts at zero)`
          : `old size tokens rose: ${failure.count} use(s) against a baseline of ${failure.recorded}`,
    };
  });
  if (!ratchet.absent) {
    for (const entry of ratchet.stale(asRecord(found))) {
      findings.push({
        file: entry.key,
        message: `old size tokens are gone (baseline held ${entry.recorded}); regenerate with \`npm run check:old-size-tokens -- --update\``,
      });
    }
  }
  return findings;
}

export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot), oldSizeTokenNames(repoRoot));
  const now = [...found.values()].reduce((sum, { count }) => sum + count, 0);
  const recorded = Object.values(ratchetFor(repoRoot).envelope('counts') ?? {}).reduce((a, b) => a + b, 0);
  const fell = now < recorded ? ` — under the baseline of ${recorded}; record it with --update` : '';
  return `${now} old-size-token uses in ${found.size} file(s)${fell}`;
}

function record() {
  const found = asRecord(measure(sourcesOf(REPO_ROOT), oldSizeTokenNames(REPO_ROOT)));
  const ratchet = ratchetFor(REPO_ROOT);
  const rising = ratchet.absent ? [] : ratchet.failures(found).filter((f) => f.kind === 'new' || f.kind === 'rose');
  if (rising.length) {
    console.error(`[check-old-size-tokens] not recorded: ${rising.length} file(s) rose or are new. Move to a role token instead.`);
    return;
  }
  ratchet.update(found, {
    seed: {
      why:
        'Uses of the pre-ADR-038 size vocabularies (--size-element-*, --card-*, --section-*, --modal-*, --surface-*), per ' +
        'file, against the role tokens in design-system/src/tokens/deep/_roles.scss. A count may fall and never rise; a ' +
        'file that reaches zero leaves the record. Regenerate with `npm run check:old-size-tokens -- --update`; never edit by hand.',
    },
  });
  console.log(`[check-old-size-tokens] baseline recorded: ${Object.keys(found).length} file(s)`);
}

main(import.meta.url, 'check:old-size-tokens', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
