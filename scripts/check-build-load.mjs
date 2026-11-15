#!/usr/bin/env node
/**
 * `npm run check:build-load` — byte budget on the coded-build path (#2554).
 *
 * Sums the bytes of every doc the build path loads always or as MANDATORY:
 * the constitution (`AGENTS.md`), the staged-build overview
 * (`design-system/guidelines/overview.md`), the coded-build reference
 * (`skills/uno-prototype/references/deliverables/coded-build.md`), and any doc
 * those files mandate on every build.
 *
 * The ceiling is recorded in `scripts/baselines/build-load.json` and can only
 * go down. A new mandatory read must replace an old one within the byte
 * ceiling.
 */
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';

export { REPO_ROOT };

const NL = String.fromCharCode(10);

export const BASELINE = 'scripts/baselines/build-load.json';

export const ENTRY_DOCS = [
  'AGENTS.md',
  'design-system/guidelines/overview.md',
  'skills/uno-prototype/references/deliverables/coded-build.md',
];

export const REMEDY = [
  '  -> Trim the build-path docs or replace an existing mandatory read instead of adding one.',
  '     When a cut lowers the build load, record the lower ceiling with:',
  '       node scripts/check-build-load.mjs --update',
].join(NL);

/** Split markdown into paragraph / list-item / table-row blocks so wrapped list items stay whole. */
function blocksOf(text) {
  const out = [];
  let cur = '';
  for (const line of text.split(NL)) {
    if (!line.trim()) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    } else if (/^\s*(?:[a-z]\.|[0-9]+\.|-|\|)\s/.test(line)) {
      if (cur.trim()) out.push(cur.trim());
      cur = line;
    } else {
      cur = cur ? `${cur} ${line.trim()}` : line;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Whether a block on the build path mandates loading a referenced doc on every build. */
function isMandatoryBuildBlock(block, fromDoc) {
  if (/\bfigma\b/i.test(block)) return false;
  if (/\bMANDATORY\b/.test(block)) return true;
  if (
    fromDoc !== 'AGENTS.md' &&
    /(\*\*(?:Load|Follow|Re-read|Self-check|Always)\b|\b(?:must|always)\s+(?:load|read)\b|\bapply the closing\b)/i.test(
      block,
    )
  ) {
    return true;
  }
  return false;
}

/** Extract existing repo-relative `.md`, `.mdx` or `.json` file paths from a block. */
function extractDocPaths(block, fromDoc, repoRoot) {
  const out = [];
  const dir = path.posix.dirname(fromDoc);
  const candidates = [
    ...[...block.matchAll(/`([^`\s]+\.(?:md|mdx|json))`/g)].map((m) => m[1]),
    ...[...block.matchAll(/\[[^\]]+\]\(([^)\s#]+\.(?:md|mdx|json))\)/g)].map((m) => m[1]),
  ];
  for (const raw of candidates) {
    if (raw.includes('<') || raw.includes('*') || raw.includes('{')) continue;
    for (const rel of [raw, path.posix.normalize(path.posix.join(dir, raw))]) {
      const full = path.join(repoRoot, rel);
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        out.push(rel);
        break;
      }
    }
  }
  return out;
}

/**
 * Discover and sum every always-loaded or mandatory doc on the coded-build path.
 *
 * @param {{repoRoot?: string}} [opts]
 * @returns {{docs: {file: string, bytes: number}[], missing: string[], total: number}}
 */
export function measureBuildLoad({ repoRoot = REPO_ROOT } = {}) {
  const seen = new Set(ENTRY_DOCS);
  const queue = [...ENTRY_DOCS];
  const missing = [];

  while (queue.length > 0) {
    const rel = queue.shift();
    const full = path.join(repoRoot, rel);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
      missing.push(rel);
      continue;
    }
    if (rel.startsWith('design-system/agent-views/')) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const block of blocksOf(text)) {
      if (!isMandatoryBuildBlock(block, rel)) continue;
      for (const target of extractDocPaths(block, rel, repoRoot)) {
        if (!seen.has(target)) {
          seen.add(target);
          queue.push(target);
        }
      }
    }
  }

  const docs = [];
  let total = 0;
  for (const file of seen) {
    const full = path.join(repoRoot, file);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) continue;
    const bytes = fs.statSync(full).size;
    docs.push({ file, bytes });
    total += bytes;
  }
  return { docs, missing, total };
}

const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const measured = measureBuildLoad({ repoRoot });
  const findings = measured.missing.map((file) => ({
    file,
    message: 'build-path doc is missing on disk',
  }));

  const ratchet = ratchetFor(repoRoot);
  for (const failure of ratchet.failures({ bytes: measured.total })) {
    if (failure.kind === 'absent') {
      findings.push({ message: failure.message });
      return findings;
    }
    if (failure.kind === 'rose') {
      const breakdown = measured.docs.map((d) => `${d.file}: ${d.bytes} B`).join(', ');
      findings.push({
        file: BASELINE,
        message:
          `build-load bytes rose: ${failure.count} B against a ceiling of ${failure.recorded} B ` +
          `(${breakdown})`,
      });
    }
  }

  const recordedDocs = Array.isArray(ratchet.envelope('docs')) ? ratchet.envelope('docs') : null;
  if (recordedDocs) {
    const currentFiles = measured.docs.map((d) => d.file);
    const added = currentFiles.filter((f) => !recordedDocs.includes(f));
    const removed = recordedDocs.filter((f) => !currentFiles.includes(f));
    if (added.length > removed.length) {
      findings.push({
        file: added[0],
        message:
          `new mandatory read on the build path (${added.join(', ')}) without replacing an existing one ` +
          `(recorded: ${recordedDocs.join(', ')})`,
      });
    }
  }

  return findings;
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  const measured = measureBuildLoad({ repoRoot });
  const ratchet = ratchetFor(repoRoot);
  const ceiling = ratchet.entries.get('bytes')?.count;
  return (
    `${measured.total} B across ${measured.docs.length} build-path doc(s)` +
    (ceiling !== undefined ? ` (ceiling ${ceiling} B)` : '')
  );
}

export function record({ repoRoot = REPO_ROOT } = {}) {
  const measured = measureBuildLoad({ repoRoot });
  const ratchet = ratchetFor(repoRoot);
  const rising = ratchet.absent
    ? []
    : ratchet.failures({ bytes: measured.total }).filter((f) => f.kind === 'new' || f.kind === 'rose');
  if (rising.length) {
    console.error(
      `[check-build-load] not recorded: ${measured.total} B exceeds ceiling ${rising[0].recorded} B; the ceiling can only go down.`,
    );
    return false;
  }
  const recordedDocs = Array.isArray(ratchet.envelope('docs')) ? ratchet.envelope('docs') : null;
  const currentFiles = measured.docs.map((d) => d.file);
  if (recordedDocs) {
    const added = currentFiles.filter((f) => !recordedDocs.includes(f));
    const removed = recordedDocs.filter((f) => !currentFiles.includes(f));
    if (added.length > removed.length) {
      console.error(
        `[check-build-load] not recorded: new mandatory read (${added.join(', ')}) must replace an old one.`,
      );
      return false;
    }
  }
  ratchet.update(
    { bytes: measured.total },
    {
      seed: {
        why:
          'Ratchet: total bytes of every doc the build path loads always or as MANDATORY ' +
          '(constitution, staged-build overview, coded-build reference and its mandates). ' +
          'The ceiling can only go down; a new mandatory read must replace an old one.',
        docs: currentFiles,
      },
    },
  );
  const full = path.join(repoRoot, BASELINE);
  const disk = JSON.parse(fs.readFileSync(full, 'utf8'));
  if (JSON.stringify(disk.docs) !== JSON.stringify(currentFiles)) {
    disk.docs = currentFiles;
    fs.writeFileSync(full, `${JSON.stringify(disk, null, 2)}${NL}`, 'utf8');
  }
  console.log(`[check-build-load] baseline recorded: ${measured.total} B across ${currentFiles.length} doc(s)`);
  return true;
}

main(import.meta.url, 'check:build-load', {
  run,
  summary,
  remedy: REMEDY,
  fallThrough: { '--update': () => record() },
});
