#!/usr/bin/env node
//
// check:harness-budgets — the char budgets WRITTEN DOWN in prose held to the
// constants the bundler actually asserts.
//
// The budgets live in one place, `BUDGETS` in
// `agents/uno-bot/scripts/bundle-harness.mjs`, and the build fails on a doc that
// blows one. That much has a guard. What had none is the prose: two harness
// documents state a budget as a NUMBER a reader will believe —
//
//   AGENTS.md § The loading contract: "Budget ≤20k chars: a tier that bloats
//   defeats the tier."
//   skills/README.md § The three questions a new line answers: "`bot.md` is on
//   a 7,000-char budget the bundler asserts".
//
// — and both are copies. Raise `botFace` to 8,000 in the bundler and the README
// goes on saying 7,000; the build stays green, and the sentence a skill author
// reads before cutting a face is wrong. The failure is quiet in the direction
// that matters: prose is what an agent obeys, and nothing re-measures it.
//
// So the numbers are compared. The bundler writes a manifest on `--manifest`
// (#510) with `budgets` verbatim, and each claim below names the key it is a
// copy of. A mismatch is a finding that names the file, the line, the prose
// value and the constant — so whoever raised the budget can see which sentence
// to edit, and whoever edited the sentence can see they moved a copy and not
// the budget.
//
// A CLAIM THAT CANNOT BE FOUND IS ALSO A FINDING. A sentence rewritten past
// this check's pattern leaves it matching nothing and passing — the shape #234
// refuses everywhere else in this harness — so a missing claim fails and says
// which pattern went looking.
//
// ON THE FINDINGS INTERFACE (#508). It exports `run(ctx) => Finding[]`, so the
// harness runner calls it in-process and renders one banner; `ctx.repoRoot` and
// `ctx.manifest` are both injectable, which is what lets the tests drive it over
// a fixture root and a made-up manifest rather than over this repo.
//
// Usage:
//   npm run check:harness-budgets

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { main } from './lib/findings.mjs';
import { tryHarnessManifest } from './lib/bundled-set.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const REMEDY =
  '  A budget stated in prose is a COPY of a constant in\n' +
  '  agents/uno-bot/scripts/bundle-harness.mjs § BUDGETS. Move both, or neither:\n' +
  '  the constant is what fails a build, and the sentence is what an agent reads\n' +
  '  before it cuts a doc. If the sentence was deliberately reworded, update the\n' +
  '  claim in this file so the comparison keeps happening.';

/**
 * The prose claims, each naming the `BUDGETS` key it copies.
 *
 * `pattern` must capture the number as group 1, in the units `scale` converts
 * to chars — `20k` is 20 × 1,000, `7,000` is itself. `quote` is what the
 * sentence looks like, for a reader of this file who has not opened the doc.
 */
export const CLAIMS = [
  {
    file: 'AGENTS.md',
    budget: 'constitution',
    quote: 'Budget ≤20k chars: a tier that bloats defeats the tier.',
    pattern: /Budget\s+≤\s*([\d,.]+)k\s+chars/,
    scale: 1_000,
  },
  {
    file: 'skills/README.md',
    budget: 'botFace',
    quote: '`bot.md` is on a 7,000-char budget the bundler asserts',
    pattern: /([\d,]+)-char budget the bundler asserts/,
    scale: 1,
  },
];

/** The 1-based line a match landed on. */
function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

/**
 * Compare every claim against the manifest's budgets. Pure — no I/O beyond
 * reading the claimed files, and no exit.
 *
 * @param {{repoRoot?: string, manifest: {budgets: Record<string, number>}, claims?: typeof CLAIMS}} ctx
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function compare({ repoRoot = REPO_ROOT, manifest, claims = CLAIMS }) {
  const findings = [];
  for (const claim of claims) {
    const abs = path.join(repoRoot, claim.file);
    if (!fs.existsSync(abs)) {
      findings.push({
        file: claim.file,
        message:
          `states the ${claim.budget} budget in prose ("${claim.quote}") but does not exist, ` +
          'so the number went unchecked',
        severity: 'error',
      });
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    const match = claim.pattern.exec(text);
    if (!match) {
      findings.push({
        file: claim.file,
        message:
          `no longer states the ${claim.budget} budget where this check looks ` +
          `(${claim.pattern}), so the prose and the constant are no longer compared. ` +
          `It used to read "${claim.quote}"`,
        severity: 'error',
      });
      continue;
    }
    const prose = Number(match[1].replace(/,/g, '')) * claim.scale;
    const constant = manifest.budgets[claim.budget];
    if (constant === undefined) {
      findings.push({
        file: claim.file,
        line: lineOf(text, match.index),
        message:
          `states a budget of ${prose.toLocaleString('en-US')} chars, but the bundler's manifest ` +
          `declares no \`${claim.budget}\` budget for it to be a copy of`,
        severity: 'error',
      });
      continue;
    }
    if (prose !== constant) {
      findings.push({
        file: claim.file,
        line: lineOf(text, match.index),
        message:
          `says the ${claim.budget} budget is ${prose.toLocaleString('en-US')} chars; ` +
          `bundle-harness.mjs asserts ${constant.toLocaleString('en-US')}`,
        severity: 'error',
      });
    }
  }
  return findings;
}

/**
 * @param {{repoRoot?: string, manifest?: object, claims?: typeof CLAIMS}} [ctx]
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT, manifest, claims = CLAIMS } = {}) {
  if (!manifest) {
    // The non-exiting reader, because the runner calls this in-process: a
    // bundler that could not confirm the bundle is a finding here, not a
    // `process.exit` that would take the whole composite down with it.
    const asked = tryHarnessManifest({ tag: 'harness-budgets', notThis: 'the prose budget comparison' });
    if (asked.error) return [{ message: asked.error, severity: 'error' }];
    manifest = asked.manifest;
  }
  return compare({ repoRoot, manifest, claims });
}

/** The green line: the claims checked, and the numbers they agreed on. */
export function summary({ repoRoot = REPO_ROOT, manifest, claims = CLAIMS } = {}) {
  if (!manifest) {
    const asked = tryHarnessManifest({ tag: 'harness-budgets', notThis: 'the prose budget comparison' });
    if (asked.error) return 'the manifest could not be read';
    manifest = asked.manifest;
  }
  return `${claims.length} prose budget(s) match the bundler: ${claims
    .map((c) => `${c.file} ${c.budget} ${(manifest.budgets[c.budget] ?? 0).toLocaleString('en-US')}`)
    .join(' · ')}`;
}

// Imported by the harness runner, so it must do nothing on import — which is
// `main()`'s entry comparison, not this file's (#610). It also holds the
// summary thunk back on a red run, which is what this spelling was doing by
// hand.
main(import.meta.url, 'check:harness-budgets', { run, summary, remedy: REMEDY });
