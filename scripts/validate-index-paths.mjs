#!/usr/bin/env node
// Resolve every repo path that lives INSIDE the JSON index files against disk.
//
// Why this exists (#186): validate-doc-links.sh used to check two things per
// index — the file exists, and JSON.parse succeeds. It never opened the values.
// So #75 (three dead `design-system/src/forms/` paths) and #76 (four
// `Admin/Tutor Admin/...` segments that exist nowhere) both sat inside the very
// files the script claimed to validate while it printed
// `[ok] all validation checks passed`.
//
// Usage: node scripts/validate-index-paths.mjs
// Exits 1 and prints one line per unresolvable path:
//   [dead-path] <index> -> <key> -> <path>

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The four indexes validate-doc-links.sh already required, plus the two
// registries that index-manifest.json itself declares as indexes. The manifest
// names them; a path inside a file the manifest calls an index is exactly as
// load-bearing as a path inside the manifest.
const INDEXES = [
  'design-system/guidelines/index-manifest.json',
  'design-system/guidelines/components/components-index.json',
  'skills/uno-research/references/foundations-index.json',
  'skills/uno-research/references/patterns-index.json',
  'design-system/figma/component-registry.json',
  'design-system/figma/token-registry.json',
];

// A value is treated as a repo path only when it is rooted at a real top-level
// entry of this repo. Anything else is prose, a URL, a token name, an npm
// script, or another repo's path — and guessing at those is how a check earns
// a hundred false positives and gets switched off in a week.
const ROOTED =
  /^(AGENTS\.md|CONTEXT\.md|README\.md|SETUP\.md|INDEX\.md|docs\/|skills\/|agents\/|scripts\/|design-system\/|prototypes\/|src\/|public\/|todos\/|\.storybook\/|\.github\/|\.cursor\/)/;

// Generated `githubLink` values mirror an on-disk path through a GitHub tree
// URL. The suffix after /tree/<ref>/ is this repo's own layout, so it resolves
// like any other repo path — this is what surfaces a generator emitting a
// directory that no longer exists.
const GITHUB_TREE = /^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:tree|blob)\/[^/]+\/(.+)$/;

// NOT COVERED, deliberately — read this before "fixing" a path this misses:
//
// * `@/…` and `@plus-ds/…` import specifiers (component-registry.json `code.import`).
//   Those are module specifiers, not file paths: resolving one means replaying
//   Vite's alias table plus extension and barrel-file probing. A wrong verdict
//   from a half-implemented resolver is worse than no verdict, and the real
//   guard for those is check:component-registry, which regenerates from source.
// * Backticked paths in prose. The step above this one in validate-doc-links.sh
//   already covers those for markdown; widening the JSON walk into prose values
//   would double-report them.
// * Globs, template placeholders, and shell/command strings — skipped by SKIP
//   below. A path with a `*` in it is a pattern, and a pattern is not a claim
//   that a specific file exists.
// * Paths inside any JSON file not listed in INDEXES. This check is about the
//   indexes agents are told to trust, not about every JSON in the repo.
const SKIP = /[*{}<>$|…]|YYYY|\s\+\s/;

function walk(node, key, out) {
  if (typeof node === 'string') {
    out.push([key, node]);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${key}[${i}]`, out));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, key ? `${key}.${k}` : k, out);
  }
}

// Trailing punctuation belongs to the sentence, not the path. Trailing slashes
// are how this repo writes a directory (`design-system/src/`).
function normalize(value) {
  let v = value.split('#')[0];
  v = v.replace(/[.,)]+$/, '');
  v = v.replace(/\/+$/, '');
  return v;
}

let failures = 0;
let checked = 0;

for (const index of INDEXES) {
  const abs = path.join(ROOT, index);
  if (!fs.existsSync(abs)) {
    console.log(`[missing] index not found: ${index}`);
    failures += 1;
    continue;
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (err) {
    console.log(`[invalid] invalid JSON: ${index} (${err.message})`);
    failures += 1;
    continue;
  }

  const values = [];
  walk(parsed, '', values);

  for (const [key, raw] of values) {
    // NB: `Admin/Tutor Admin/...` (#76) contains a space and is still a real
    // path. Spaces are NOT a skip signal here — only ` + ` is, because that is
    // how this repo writes a prose list of paths in one string.
    const treeMatch = GITHUB_TREE.exec(raw);
    const candidate = treeMatch ? treeMatch[1] : raw;

    if (!ROOTED.test(candidate)) continue;
    if (SKIP.test(candidate)) continue;

    const target = normalize(candidate);
    if (!target) continue;

    checked += 1;
    if (!fs.existsSync(path.join(ROOT, target))) {
      console.log(`[dead-path] ${index} -> ${key} -> ${raw}`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.log(`[fail] ${failures} unresolvable path(s) across ${INDEXES.length} index files`);
  process.exit(1);
}

console.log(`[ok] ${checked} repo paths inside ${INDEXES.length} index files resolve`);
