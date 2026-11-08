#!/usr/bin/env node
// Retrieval bench for ds_find. Scores the lookup against two labeled sets and
// prints hit@1, hit@3 and MRR per set and kind, plus every miss (rank > 3).
//
//   node scripts/bench-ds-find.mjs              the table and the misses
//   node scripts/bench-ds-find.mjs --no-aliases the ranker with the alias field zeroed
//   node scripts/bench-ds-find.mjs --verbose    every row, not only misses
//   node scripts/bench-ds-find.mjs --ledger     ds_find queries in the eval ledger not yet labeled
//   node scripts/bench-ds-find.mjs --update     rewrite the ratchet from this run
//
// The sets and the ratchet live in scripts/bench/ds-find/. Method and what the
// ratchet means: docs/evals/ds-usage.md § Retrieval bench.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLookup } from './lib/ds-lookup.mjs';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BENCH_DIR = path.join(REPO_ROOT, 'scripts/bench/ds-find');
const LEDGER = 'docs/evals/ds-usage-ledger.jsonl';
const FA_METADATA = ['node_modules/@fortawesome/fontawesome-free/metadata/icons.json', 'design-system/node_modules/@fortawesome/fontawesome-free/metadata/icons.json'];
const SETS = ['authored', 'heldout'];

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
export const loadSet = (name) => readJson(path.join(BENCH_DIR, `${name}.json`));
export const loadRatchet = () => readJson(path.join(BENCH_DIR, 'ratchet.json'));
export const iconsInstalled = (root = REPO_ROOT) => FA_METADATA.some((f) => fs.existsSync(path.join(root, f)));
const isIcon = (kind) => kind.endsWith('icon');
export const isName = (kind) => kind === 'name' || kind === 'real-name';

// Rank of the first result that is a wanted component. A not-here row counts
// when its redirect names a wanted component.
export function rankOf(results, want) {
  const names = (r) => [r.name, ...(r.use ?? []).map((u) => u.name ?? u)];
  return results.findIndex((r) => names(r).some((n) => want.includes(n))) + 1;
}

// Scores both sets. Returns { scores: {set: {kind: {n, hit1, hit3, mrr}}}, misses, skipped };
// `misses` holds every scored row (rank, top four, and each result's kind and name).
export function runBench({ root = REPO_ROOT, aliases = true } = {}) {
  const lookup = createLookup(root, { aliases });
  const withIcons = iconsInstalled(root);
  const scores = {}; const misses = []; const skipped = {};
  for (const set of SETS) {
    scores[set] = {};
    for (const row of loadSet(set)) {
      if (isIcon(row.kind) && !withIcons) { skipped[row.kind] = (skipped[row.kind] ?? 0) + 1; continue; }
      const results = lookup.find(row.q).results;
      const rank = rankOf(results, row.want);
      const a = (scores[set][row.kind] ??= { n: 0, hit1: 0, hit3: 0, rr: 0 });
      a.n++; if (rank === 1) a.hit1++; if (rank && rank <= 3) a.hit3++; if (rank) a.rr += 1 / rank;
      const top = results.slice(0, 4).map((r) => r.name + (r.use ? `→${r.use.map((u) => u.name ?? u).join('|')}` : ''));
      misses.push({ set, kind: row.kind, q: row.q, rank, top, results: results.map((r) => ({ kind: r.kind, name: r.name })) });
    }
    for (const a of Object.values(scores[set])) { a.mrr = Number((a.rr / a.n).toFixed(2)); delete a.rr; }
  }
  return { scores, misses, skipped };
}

// The unlabeled part of the ledger: ds_find queries no set carries yet.
export function unlabeledLedgerQueries(root = REPO_ROOT) {
  const norm = (q) => q.trim().toLowerCase();
  const labeled = new Set(SETS.flatMap((s) => loadSet(s).map((r) => norm(r.q))));
  const file = path.join(root, LEDGER);
  const found = new Set();
  for (const line of fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n') : []) {
    if (!line.trim()) continue;
    for (const l of JSON.parse(line).read_set?.lookups ?? []) {
      const m = /^ds_find (\{.*\})$/.exec(l);
      if (!m) continue;
      let query; try { query = JSON.parse(m[1]).query; } catch { continue; }
      if (typeof query === 'string' && query.trim() && !labeled.has(norm(query))) found.add(query);
    }
  }
  return [...found];
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--ledger')) {
    const open = unlabeledLedgerQueries();
    console.log(open.length ? `${open.length} ds_find queries in the ledger are not labeled yet:` : 'Every ds_find query in the ledger is labeled (0 unlabeled).');
    for (const q of open) console.log(`  ${q}`);
    return;
  }
  const aliases = !args.includes('--no-aliases');
  const { scores, misses, skipped } = runBench({ aliases });
  for (const m of misses) if (args.includes('--verbose') || !m.rank || m.rank > 3) console.log(`${m.set.padEnd(8)} ${String(m.rank || '-').padStart(2)}  ${m.q.padEnd(44)} → ${m.top.join(', ')}`);
  console.log(`\narm: ${aliases ? 'with-aliases' : 'no-aliases'}`);
  for (const set of SETS) for (const [kind, a] of Object.entries(scores[set])) console.log(`${set.padEnd(8)} ${kind.padEnd(12)} hit@1 ${a.hit1}/${a.n}  hit@3 ${a.hit3}/${a.n}  MRR ${a.mrr.toFixed(2)}`);
  for (const [kind, n] of Object.entries(skipped)) console.log(`skipped ${n} ${kind} rows: Font Awesome metadata is not installed`);
  if (args.includes('--update')) {
    const file = path.join(BENCH_DIR, 'ratchet.json');
    const ratchet = loadRatchet();
    const arm = (ratchet[aliases ? 'with-aliases' : 'no-aliases'] ??= {});
    for (const set of SETS) {
      arm[set] ??= {};
      for (const [kind, a] of Object.entries(scores[set])) arm[set][kind] = { hit1: a.hit1, hit3: a.hit3, mrr: a.mrr };
    }
    fs.writeFileSync(file, `${JSON.stringify(ratchet, null, 1)}\n`);
    console.log(`ratchet updated: ${path.relative(REPO_ROOT, file)} (${aliases ? 'with-aliases' : 'no-aliases'})`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
