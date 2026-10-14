#!/usr/bin/env node
//
// check:harness-budgets — budget numbers live in one place, the bundler.
//
// The char budgets are `BUDGETS` in `agents/uno-bot/scripts/bundle-harness.mjs`,
// and the build fails on a doc that blows one (the constitution's is soft and
// warns). A doc that needs a budget cites the constant by key —
// `BUDGETS.constitution` — and never writes the number down: a number in prose
// is a copy, and a copy goes on saying 7,000 the day the constant moves, in the
// sentence an agent reads before it cuts a doc.
//
// So this reads every doc under the bundler's section roots — the manifest's
// rows, every delivery — and finds two things:
//
//   a budget written down: a line that mentions a budget and states a char
//   count (`7,000-char`, `≤20k chars`). The finding names the constant to cite
//   when the number matches one, and the bundler's file when it matches none.
//
//   a citation that resolves to nothing: `BUDGETS.<key>` where the bundler
//   states no such key. A renamed budget role leaves its citations pointing at
//   a constant that is gone, and this is where that shows.
//
// The manifest comes from the bundler in-process (`scripts/lib/bundled-set.mjs`),
// so the budgets and the doc list are the bundler's own, never a copy here.
//
// ON THE FINDINGS INTERFACE (#508). `run(ctx)` takes `repoRoot` and `manifest`,
// which is what lets the tests drive it over a fixture root.
//
// Usage:
//   npm run check:harness-budgets

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { main } from './lib/findings.mjs';
import { tryHarnessManifest } from './lib/bundled-set.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const BUNDLER = 'agents/uno-bot/scripts/bundle-harness.mjs';

export const REMEDY =
  `  A budget number has one home: \`BUDGETS\` in ${BUNDLER}.\n` +
  '  Cite the constant by key (`BUDGETS.persona`) where a doc needs the budget,\n' +
  '  and let the build state the number when it fails.';

/** A line about a budget. */
const BUDGET_LINE = /budget/i;
/** A char count: `7,000-char`, `20k chars`, `≤28k chars`. Group 1 the number, group 2 the `k`. */
const CHAR_COUNT = /(\d[\d,]*(?:\.\d+)?)\s*(k)?[\s-]*chars?\b/gi;
/** A citation of a constant. Group 1 the key. */
const CITATION = /\bBUDGETS\.(\w+)/g;

const fmt = (x) => x.toLocaleString('en-US');

/**
 * Every finding over the declared docs. Pure apart from reading them.
 *
 * @param {{repoRoot: string, manifest: {budgets: Record<string, number>, members: {path: string}[]}}} ctx
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function compare({ repoRoot, manifest }) {
  const { budgets } = manifest;
  const keyFor = (value) => Object.keys(budgets).find((k) => budgets[k] === value);
  const findings = [];
  for (const { path: rel } of manifest.members) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) continue;
    fs.readFileSync(abs, 'utf8')
      .split('\n')
      .forEach((text, i) => {
        const line = i + 1;
        if (BUDGET_LINE.test(text)) {
          for (const m of text.matchAll(CHAR_COUNT)) {
            const value = Number(m[1].replace(/,/g, '')) * (m[2] ? 1_000 : 1);
            const key = keyFor(value);
            findings.push({
              file: rel,
              line,
              severity: 'error',
              message: key
                ? `writes the ${key} budget down as ${fmt(value)} chars; cite \`BUDGETS.${key}\` instead`
                : `writes a budget down as ${fmt(value)} chars, which no constant in ${BUNDLER} holds; ` +
                  'cite the `BUDGETS` key it means instead',
            });
          }
        }
        for (const m of text.matchAll(CITATION)) {
          if (!(m[1] in budgets)) {
            findings.push({
              file: rel,
              line,
              severity: 'error',
              message:
                `cites \`BUDGETS.${m[1]}\`, which ${BUNDLER} does not state; ` +
                `its keys are ${Object.keys(budgets).join(', ')}`,
            });
          }
        }
      });
  }
  return findings;
}

/** The manifest the caller gave, or the bundler's, or the report of why there is none. */
function manifestFor(manifest, repoRoot) {
  if (manifest) return { manifest };
  return tryHarnessManifest({ tag: 'harness-budgets', notThis: 'the budget citations', repoRoot });
}

/**
 * @param {{repoRoot?: string, manifest?: object}} [ctx]
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT, manifest } = {}) {
  const asked = manifestFor(manifest, repoRoot);
  if (asked.error) return [{ message: asked.error, severity: 'error' }];
  return compare({ repoRoot, manifest: asked.manifest });
}

/** The green line: how many docs were read, and the constants they may cite. */
export function summary({ repoRoot = REPO_ROOT, manifest } = {}) {
  const asked = manifestFor(manifest, repoRoot);
  if (asked.error) return 'the manifest could not be read';
  const { members, budgets } = asked.manifest;
  return (
    `${members.length} doc(s) under the section roots cite the bundler's budgets by key ` +
    `(${Object.keys(budgets).join(', ')}) and write none down.`
  );
}

// Imported by the harness runner, so it must do nothing on import — which is
// `main()`'s entry comparison, not this file's (#610).
main(import.meta.url, 'check:harness-budgets', { run, summary, remedy: REMEDY });
