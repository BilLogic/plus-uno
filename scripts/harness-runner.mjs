/**
 * The runner behind `npm run check:harness` — the part that can be tested.
 *
 * `scripts/check-harness.mjs` is the CLI: it argues the composition, prints and
 * exits. Everything it decides lives here, as functions over the registry in
 * `scripts/checks.registry.mjs`, because the single `pull_request` gate was the
 * last untested script in the harness and a gate nobody has watched fail is a
 * gate nobody knows works (#191, applied to itself).
 *
 * TWO KINDS OF CHECK, ONE REPORT. A row with a `module` exports
 * `run(ctx) => Finding[]`: call it in-process, render one banner with
 * `scripts/lib/findings.mjs`, and take the exit code from the findings rather
 * than from a process. A row with `kind: 'spawn'` cannot answer that interface
 * — it drives a browser, a type-checker or a test runner, and its result is an
 * exit code by nature — so it is spawned as `npm run <name>` and whatever it
 * printed is kept. Both shapes come back as the same result object, so the
 * composite's summary does not know the difference.
 *
 * THERE IS NO THIRD KIND. Until #509 a row with neither was "legacy" and was
 * spawned by default, which made the registry's silence mean something — and a
 * default that means something is a default nobody states. Every row now
 * declares one of the two, `kind: 'spawn'` carries the reason in
 * `spawnReason`, and a row declaring neither is reported as the registry bug it
 * is rather than quietly spawned.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { CHECKS, declaredNames } from './checks.registry.mjs';
import { exitCodeFor, renderFindings } from './lib/findings.mjs';

/** The two manifests the completeness assertion scans. */
export const MANIFESTS = [
  { dir: '.', label: 'package.json' },
  { dir: 'agents/uno-bot', label: 'agents/uno-bot/package.json' },
];

export const npmScripts = (dir) =>
  Object.keys(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts ?? {});

/**
 * The completeness assertion, as a function of the names rather than of the
 * disk — which is what lets a test hand it an unregistered `check:*` and watch
 * it fail without writing a package.json.
 *
 * It matches on the `check:` prefix, so a guard that does not carry the prefix
 * is invisible to it; `agents/uno-bot`'s `typecheck`, `test` and `test:workerd`
 * are therefore registered BY NAME — the first two composed, the third
 * EXCLUDED with its reason (#587). The prefix stays as it is, because that
 * package's `dev`, `tail` and `deploy` are commands rather than guards and a
 * rule that demanded a decision on each would be noise.
 *
 * @param {{label: string, scripts: string[]}[]} manifests
 * @param {Set<string>} [declared]
 * @returns {string[]} one line per orphan; empty when complete.
 */
export function orphans(manifests, declared = declaredNames()) {
  const found = [];
  for (const { label, scripts } of manifests) {
    for (const name of scripts) {
      if (name.startsWith('check:') && !declared.has(name)) found.push(`${name}  (${label})`);
    }
  }
  return found;
}

/** Read both manifests off disk and ask `orphans` about them. */
export const orphansInRepo = (repoRoot) =>
  orphans(
    MANIFESTS.map(({ dir, label }) => ({ label, scripts: npmScripts(path.join(repoRoot, dir)) })),
  );

export const ORPHAN_REMEDY =
  '  -> Every check:* script is either composed into this gate or excluded with a' +
  '\n     reason. Add it to CHECKS or to EXCLUDED in scripts/checks.registry.mjs.' +
  '\n     A check that runs nowhere protects nothing.';

/** The npm arguments a `kind: 'spawn'` row is spawned with. */
export const npmArgs = (row) =>
  row.pkg === 'bot'
    ? ['--prefix', 'agents/uno-bot', 'run', '--silent', row.name]
    : ['run', '--silent', row.name];

const defaultSpawn = (args, repoRoot) =>
  spawnSync('npm', args, { cwd: repoRoot, encoding: 'utf8', env: process.env });

const defaultLoad = (modulePath, repoRoot) =>
  import(pathToFileURL(path.join(repoRoot, modulePath)).href);

/**
 * Run one row.
 *
 * @param {object} row  a registry row.
 * @param {object} deps
 * @param {string} deps.repoRoot
 * @param {Function} [deps.spawn]  (args, repoRoot) => {status, stdout, stderr}
 * @param {Function} [deps.load]   (modulePath, repoRoot) => Promise<module>
 * @returns {Promise<{ok: boolean, seconds: number, output: string, invocation: string}>}
 */
export async function runCheck(row, { repoRoot, spawn = defaultSpawn, load = defaultLoad }) {
  const started = Date.now();
  const since = () => (Date.now() - started) / 1000;

  if (row.module) {
    const invocation = `node ${row.module}`;
    let mod;
    try {
      mod = await load(row.module, repoRoot);
    } catch (error) {
      return {
        ok: false,
        seconds: since(),
        output: `${row.module} could not be imported: ${error.message}`,
        invocation,
      };
    }
    // The registry says this row returns findings. If the module does not, the
    // registry is wrong about it — fall back to the spawn rather than crash, and
    // say so, because a gate that dies on its own metadata protects nothing.
    if (typeof mod.run !== 'function') {
      const spawned = await runSpawn(row, { repoRoot, spawn, since });
      return {
        ...spawned,
        output:
          `[registry] ${row.name} declares module ${row.module}, which exports no run().` +
          `\n           Ran \`npm run ${row.name}\` instead.\n${spawned.output}`,
      };
    }
    try {
      const findings = (await mod.run({ repoRoot })) ?? [];
      return {
        ok: exitCodeFor(findings) === 0,
        seconds: since(),
        output: renderFindings(row.name, findings, { remedy: mod.REMEDY }),
        invocation,
      };
    } catch (error) {
      return {
        ok: false,
        seconds: since(),
        output: `${row.name} threw: ${error.stack ?? error.message}`,
        invocation,
      };
    }
  }

  if (row.kind === 'spawn') return runSpawn(row, { repoRoot, spawn, since });

  // Neither kind. Before #509 this was the majority case and meant "spawn it";
  // now it means the row is incomplete, and saying so is worth more than a run
  // that happens to work — the next reader of the registry would learn the
  // wrong rule from a green line.
  return {
    ok: false,
    seconds: since(),
    output:
      `[registry] ${row.name} declares neither a \`module\` nor \`kind: 'spawn'\`.\n` +
      "           Give it a module on the findings interface, or kind: 'spawn' with the\n" +
      '           reason it cannot answer one (scripts/checks.registry.mjs).',
    invocation: `(nothing — ${row.name} is an incomplete registry row)`,
  };
}

/** `npm run <name>`, read by its exit code. The shape a spawn row comes back as. */
function runSpawn(row, { repoRoot, spawn, since }) {
  const args = npmArgs(row);
  const result = spawn(args, repoRoot);
  return {
    ok: result.status === 0,
    seconds: since(),
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trimEnd(),
    invocation: `npm ${args.join(' ')}`,
  };
}

/**
 * Run the whole composition in registry order, reporting a line per check as
 * it finishes. It does NOT stop at the first failure: one CI run should report
 * everything that is wrong, not the first thing.
 *
 * @param {object} deps
 * @param {string} deps.repoRoot
 * @param {object[]} [deps.rows]
 * @param {Function} [deps.onResult] (row, result) => void
 * @param {Function} [deps.spawn]
 * @param {Function} [deps.load]
 * @returns {Promise<{failures: object[], seconds: number, total: number}>}
 */
export async function runAll({ repoRoot, rows = CHECKS, onResult = () => {}, spawn, load }) {
  const started = Date.now();
  const failures = [];
  for (const row of rows) {
    const result = await runCheck(row, { repoRoot, spawn, load });
    onResult(row, result);
    if (!result.ok) failures.push({ ...row, ...result });
  }
  return { failures, seconds: (Date.now() - started) / 1000, total: rows.length };
}
