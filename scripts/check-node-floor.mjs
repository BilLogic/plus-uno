#!/usr/bin/env node
//
// check:node-floor — one Node major for the whole repo, with the floor READ
// from wrangler rather than written down twice. What it asserts and why is in
// `scripts/node-floor.mjs`, which is where the maths lives.
//
// THIS IS THE FIRST CHECK ON THE FINDINGS INTERFACE (#508). It exports
// `run(ctx) => Finding[]` and decides nothing about output: the harness runner
// calls it in-process and renders the banner, and the CLI below hands the same
// findings to the same renderer so a run by hand and a run in CI print one
// string. It was picked to go first because its findings were ALREADY a pure
// function of the repo root — `findings(root)` in node-floor.mjs — so the move
// is the wrapper and nothing else, and the 45 remaining checks (#509) can be
// read against a working example rather than against a description.
//
// Usage:
//   npm run check:node-floor

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { main } from './lib/findings.mjs';
import { findings, hardcoded, nvmrcMajor, wranglerFloor } from './node-floor.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const REMEDY =
  '  One Node major, written in .nvmrc, read everywhere else. The floor comes\n' +
  "  from the installed wrangler's own engines.node, so a wrangler bump past a\n" +
  '  Node major fails here rather than at deploy time.';

// `node-floor.mjs` returns sentences, and the workflow-pin ones open with the
// `path:line` they are about. Splitting that off is what lets the renderer put
// the location in the column every other check's findings will use; the rest
// (.nvmrc, the two manifests) carry no line and are left as written.
const LOCATED = /^([A-Za-z0-9_./-]+\.ya?ml):(\d+)\s+(.*)$/s;

/**
 * @param {{repoRoot?: string}} [ctx]
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT } = {}) {
  return findings(repoRoot).map((sentence) => {
    const located = LOCATED.exec(sentence);
    return located
      ? { file: located[1], line: Number(located[2]), message: located[3], severity: 'error' }
      : { message: sentence, severity: 'error' };
  });
}

/** The green line, which carries the numbers worth printing on a pass. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const floor = wranglerFloor(repoRoot);
  return (
    `.nvmrc ${nvmrcMajor(repoRoot)} (wrangler floor ${floor ?? '?'}), ` +
    `${hardcoded(repoRoot).length} hardcoded node-version pins`
  );
}

// Imported by the harness runner, so it must do nothing on import — which is
// `main()`'s entry comparison, not this file's (#610).
main(import.meta.url, 'check:node-floor', { run, summary, remedy: REMEDY });
