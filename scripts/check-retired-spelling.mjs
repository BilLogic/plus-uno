#!/usr/bin/env node
/**
 * Retired-spelling sweep (#429, the contract step of an expand–contract).
 *
 * CONTEXT.md renamed the two maintenance severities: "Tier 1 / Tier 2
 * (maintenance)" became **direct fix / gated change**, and *Tier* now means the
 * loading tiers and nothing else. The old spelling fanned across 33 files,
 * including a skill directory and a workflow file, so it was migrated in three
 * batches (#437, #435, #434) while both spellings resolved. This check is what
 * the contract leaves behind: the old spelling can fall out of live docs but
 * cannot come back, because a maintenance "Tier 1" now reads as a LOADING tier
 * to every agent that opens the glossary.
 *
 * What it sweeps: hand-authored docs an agent reads — the constitution, the
 * glossary, agents/, skills/, docs/ (minus history), the design-system
 * guidelines, the headless prompts and the workflows. What it leaves alone, by
 * rule: docs/plans/ and todos/ (a plan keeps the words it was written in),
 * docs/adr/ (a decision record keeps the spelling it decided in),
 * docs/knowledge/archive/ (the graveyard), generated artifacts (the bundle is
 * regenerated from the swept sources), and the glossary's own "Do NOT use"
 * column, which names the old spelling precisely so this sweep has something
 * to point at.
 *
 * Each pattern is a MAINTENANCE-only shape: the word beside "Tier" is one only
 * the severity meaning ever took (fix, digest, whitelist, pipeline, apply,
 * "suggested tier", the 1/2 slash form, the old file names). A loading use —
 * "Tier 2 — loaded on demand", "## Tier-2 loads" — matches none of them.
 *
 * Run: npm run check:retired-spelling
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '..');

/** Roots swept, relative to the repo. */
export const ROOTS = [
  'AGENTS.md',
  'README.md',
  'CONTEXT.md',
  'agents',
  'skills',
  'docs',
  'design-system/guidelines',
  'scripts/prompts',
  '.github/workflows',
];

/** Path prefixes left as written, relative to the repo. */
export const SKIP = [
  'docs/plans/',
  'docs/adr/',
  'docs/knowledge/archive/',
  'todos/',
  'agents/uno-bot/harness-bundle.md',
  'agents/uno-bot/src/',
  'agents/uno-bot/node_modules/',
];

/** The retired shapes. Every one names the maintenance meaning and no loading use. */
export const RETIRED = [
  { re: /\bTier[- ]?1\/2\b/g, why: 'the 1/2 slash form named the two severities together' },
  { re: /\bTier[- ]?[12] (?:fix|fixes|change|changes|digest|whitelist|pipeline|scope|apply)\b/g, why: 'a severity noun beside "Tier"' },
  { re: /\bTier[- ]?1 (?:only|auto-apply)\b/g, why: 'the direct-fix whitelist' },
  { re: /\bsuggested tier\b/gi, why: 'the intake field is "suggested severity"' },
  { re: /\btier it\b/g, why: '"classify its severity"' },
  { re: /\buno-tier1-digest\b/g, why: 'the headless skill is scripts/prompts/uno-direct-fix-digest' },
  { re: /\bweekly-tier1-digest\b/g, why: 'the workflow is weekly-direct-fix-digest.yml' },
  { re: /\bNO_TIER1_THIS_WEEK\b/g, why: 'the digest sentinel is NO_DIRECT_FIXES_THIS_WEEK' },
];

/** The glossary row that owns the old spelling: its "Do NOT use" cell is exempt. */
const GLOSSARY_ROW = /^\| \*\*direct fix \/ gated change\*\* \|/;

function walk(abs, out) {
  const st = statSync(abs);
  if (st.isFile()) {
    if (/\.(md|mdx|yml|yaml|json)$/.test(abs)) out.push(abs);
    return out;
  }
  for (const name of readdirSync(abs)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    walk(path.join(abs, name), out);
  }
  return out;
}

/** Sweep one file's text. Returns findings: { line, text, why }. */
export function findingsIn(text, rel = '') {
  const out = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (rel === 'CONTEXT.md' && GLOSSARY_ROW.test(line)) return;
    for (const { re, why } of RETIRED) {
      re.lastIndex = 0;
      const m = re.exec(line);
      if (m) out.push({ line: i + 1, text: m[0], why });
    }
  });
  return out;
}

export function sweep(root = REPO_ROOT) {
  const files = [];
  for (const r of ROOTS) {
    const abs = path.join(root, r);
    try { walk(abs, files); } catch { /* a root may not exist in a fixture */ }
  }
  const findings = [];
  for (const abs of files) {
    const rel = path.relative(root, abs).split(path.sep).join('/');
    if (SKIP.some((p) => rel.startsWith(p))) continue;
    for (const f of findingsIn(readFileSync(abs, 'utf8'), rel)) findings.push({ file: rel, ...f });
  }
  return { files: files.length, findings };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { files, findings } = sweep();
  if (findings.length) {
    console.error(`[check:retired-spelling] ${findings.length} retired spelling(s) in ${files} swept files — CONTEXT.md § Harness & workflow terms names the current words:`);
    for (const f of findings) console.error(`  ${f.file}:${f.line}  "${f.text}" — ${f.why}`);
    process.exit(1);
  }
  console.log(`[check:retired-spelling] ${files} files swept, no retired maintenance spelling.`);
}
