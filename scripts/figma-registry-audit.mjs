#!/usr/bin/env node
/**
 * `npm run audit:figma-registry` — emit the audit that `status: "verified"` is
 * supposed to stand for.
 *
 * WHAT "VERIFIED" MEANT, AND WHAT IT DID NOT. Every set in
 * `design-system/figma/component-registry.json` carries a status, and 87 of the
 * 92 say `verified`. Nothing in this repository can check that claim: a node id
 * only resolves inside Figma, and no CI job has Figma access. So the word was
 * load-bearing and unbacked, and on 2026-08-29 a manual pass found four of the
 * verified ids resolving to nothing or to the wrong kind of node:
 *
 *   RadioButtonGroup  Scale Options              13536:9084  → nothing (13536:9083)
 *   RadioButtonGroup  Linear Scale               13611:16853 → nothing (13536:9208)
 *   Rating            Rating System (with text)  13536:196   → nothing (13536:195)
 *   Footer            Footnote                   111:227939  → an INSTANCE (111:227940)
 *
 * Two of those are off by one, which is the shape of an id copied from a child
 * frame rather than from the component; the third is a different node entirely.
 * All four generated a Figma link that opens on nothing.
 *
 * WHY THIS IS NOT A `check:` SCRIPT. It cannot fail in CI, because it cannot
 * run there — the audit needs an authenticated Figma session. A gate that
 * always passes is worse than no gate: it reads as coverage. So this prints
 * the work instead of doing it, and the result is written down by hand in
 * `design-system/figma/registry-audit.md`.
 *
 * WHAT IT PRINTS. The node ids grouped by FILE — the registry spans two, and
 * the first version of this audit checked all 92 against one of them and
 * reported thirteen false misses — plus a ready-to-run Plugin API script per
 * file. Paste each into `use_figma` against that file's key.
 *
 * Run: `npm run audit:figma-registry`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const REGISTRY = 'design-system/figma/component-registry.json';

/** Every mapped set, as `{component, set, nodeId, fileKey, status}`. */
export function sets(registry) {
  const out = [];
  for (const [component, entry] of Object.entries(registry.components ?? {})) {
    const fileKey = entry.figma?.fileKey ?? registry.figmaFile?.fileKey;
    for (const set of entry.figma?.sets ?? []) {
      // `status` and `name` are both optional in figmaMeta and both are
      // genuinely absent somewhere — OptionChip has no status at all, which is
      // itself worth seeing in the listing rather than crashing on.
      out.push({
        component,
        set: set.name ?? '(unnamed set)',
        nodeId: set.componentSetNodeId,
        fileKey,
        status: set.status ?? '(no status)',
      });
    }
  }
  for (const [name, pattern] of Object.entries(registry.patterns ?? {})) {
    out.push({
      component: name,
      set: name,
      nodeId: pattern.componentSetNodeId,
      fileKey: registry.figmaFile?.fileKey,
      status: pattern.status ?? 'pattern',
    });
  }
  return out.filter((s) => s.nodeId);
}

export function byFile(all) {
  const grouped = new Map();
  for (const entry of all) {
    if (!grouped.has(entry.fileKey)) grouped.set(entry.fileKey, []);
    grouped.get(entry.fileKey).push(entry);
  }
  return grouped;
}

/**
 * The Plugin API script to paste.
 *
 * It resolves each id and reports the node TYPE, because "exists" was not the
 * only thing wrong: nine ids resolve to a plain COMPONENT and three to a PAGE,
 * in a field called `componentSetNodeId`.
 */
export function probeScript(entries) {
  const ids = JSON.stringify(entries.map((e) => e.nodeId));
  return `const IDS = ${ids};
const out = [];
for (const id of IDS) {
  let n = null;
  try { n = await figma.getNodeByIdAsync(id); } catch { /* treated as missing */ }
  if (!n) { out.push({ id, status: 'MISSING' }); continue; }
  let p = n.parent; while (p && p.type !== 'PAGE') p = p.parent;
  out.push({ id, status: n.type, name: n.name, page: n.type === 'PAGE' ? n.name : (p && p.name) });
}
return {
  checked: out.length,
  componentSets: out.filter(o => o.status === 'COMPONENT_SET').length,
  missing: out.filter(o => o.status === 'MISSING'),
  notASet: out.filter(o => o.status !== 'COMPONENT_SET' && o.status !== 'MISSING'),
};`;
}

function main() {
  const registry = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, REGISTRY), 'utf8'));
  const all = sets(registry);
  const grouped = byFile(all);

  console.log(`[figma-registry-audit] ${all.length} mapped nodes across ${grouped.size} Figma files.\n`);
  for (const [fileKey, entries] of grouped) {
    console.log(`── file ${fileKey} — ${entries.length} nodes ${'─'.repeat(Math.max(0, 40 - fileKey.length))}`);
    for (const entry of entries) {
      console.log(`   ${entry.nodeId.padEnd(16)} ${entry.status.padEnd(20)} ${entry.component} / ${entry.set}`);
    }
    console.log(`\n   Paste into use_figma with fileKey ${fileKey}:\n`);
    console.log(
      probeScript(entries)
        .split('\n')
        .map((line) => `   ${line}`)
        .join('\n'),
    );
    console.log('');
  }
  console.log(
    'Then record what came back in design-system/figma/registry-audit.md, with the date.\n' +
      'A `status: "verified"` that no audit backs is a claim, not a fact.',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
