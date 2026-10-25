#!/usr/bin/env node
/**
 * `npm run generate:color-tokens` — the color system's tokens, generated from
 * a plan.
 *
 * A plan (`scripts/lib/color/plans/plan-*.json`) is primitive values only:
 * accent ramp recipes solved to per-step contrast targets, neutral hexes,
 * alpha slot percents and shadow geometry. The semantic layer — Atlassian's
 * 518-token grammar (`color.property.role.emphasis.state`, `--ds-` in CSS)
 * remapped onto those primitives with every PLUS override — is the same for
 * every plan. The pipeline lives in `scripts/lib/color/`; this file only
 * writes and compares.
 *
 * WHAT IT WRITES. The active plan (`ACTIVE_PLAN`, Plan A) into
 * `design-system/src/tokens/color/`: `_palette.scss`, `_semantic.scss`,
 * `_elevation.scss`, `_bootstrap-bridge.scss` and `figma-spec.json`. Nothing
 * imports them yet; the token wiring is its own change. The folder sits under
 * the token directory but out of `tokenSources`' flat glob, so today's token
 * checks do not read these files as part of the live token set.
 *
 * It refuses to write when any color check or plan parity fails
 * (`check:color-system` runs the same checks), so a plan that breaks a
 * contrast promise never lands as files.
 *
 * Usage:
 *   node scripts/generate-color-tokens.mjs                  # write the active plan
 *   node scripts/generate-color-tokens.mjs --check          # CI: fail on drift
 *   node scripts/generate-color-tokens.mjs --plan B --out <dir>   # render another plan elsewhere
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderPlan } from './lib/color/build.mjs';
import { ACTIVE_PLAN, PLAN_KEYS } from './lib/color/plans.mjs';
import { isEntry, main } from './lib/findings.mjs';
import { colorFailures } from './check-color-system.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/generate-color-tokens.mjs';

/** Where the active plan's files live, repo-relative. */
export const COLOR_TOKEN_DIR = 'design-system/src/tokens/color';

const NORM = (text) => text.replace(/\r\n/g, '\n');

/** @returns {{path: string, content: string}[]} the active plan's files, rendered and not written */
export function artifacts() {
  return Object.entries(renderPlan(ACTIVE_PLAN, SELF)).map(([file, content]) => ({ path: `${COLOR_TOKEN_DIR}/${file}`, content }));
}

/** The drift check. Reports and never writes. */
export function run({ repoRoot = ROOT } = {}) {
  return artifacts()
    .filter(({ path, content }) => {
      const abs = join(repoRoot, path);
      return !existsSync(abs) || NORM(readFileSync(abs, 'utf8')) !== content;
    })
    .map(({ path }) => ({ file: path, message: 'is stale or missing — run: npm run generate:color-tokens' }));
}

export const summary = () => `${artifacts().length} color token files match Plan ${ACTIVE_PLAN}`;

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : undefined;
}

if (isEntry(import.meta.url)) {
  if (process.argv.includes('--check')) {
    main(import.meta.url, 'check:color-tokens', { run, summary });
  } else {
    const failures = colorFailures();
    if (failures.length) {
      console.error(`✗ refusing to write: ${failures.length} color check failure(s)`);
      for (const f of failures) console.error(`  ${f.message}`);
      process.exit(1);
    }
    const plan = argValue('--plan') ?? ACTIVE_PLAN;
    if (!PLAN_KEYS.includes(plan)) {
      console.error(`✗ unknown plan ${plan}; plans are ${PLAN_KEYS.join(', ')}`);
      process.exit(1);
    }
    const out = argValue('--out');
    if (plan !== ACTIVE_PLAN && !out) {
      console.error(`✗ Plan ${plan} is not the active plan; pass --out <dir> to render it outside the token directory`);
      process.exit(1);
    }
    const dir = out ? resolve(out) : join(ROOT, COLOR_TOKEN_DIR);
    mkdirSync(dir, { recursive: true });
    for (const [file, content] of Object.entries(renderPlan(plan, SELF))) {
      const abs = join(dir, file);
      if (existsSync(abs) && NORM(readFileSync(abs, 'utf8')) === content) continue;
      writeFileSync(abs, content);
      console.log(`[write] ${abs}`);
    }
    console.log(`[ok] Plan ${plan} → ${dir}`);
  }
}
