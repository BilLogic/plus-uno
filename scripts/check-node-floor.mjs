#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { findings, hardcoded, nvmrcMajor, wranglerFloor } from './node-floor.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const found = findings(REPO_ROOT);

if (found.length) {
  console.error(`\n[node-floor] ${found.length} finding(s):`);
  for (const f of found) console.error(`  ${f}`);
  console.error(`\n${'─'.repeat(72)}`);
  console.error(
    '\n  One Node major, written in .nvmrc, read everywhere else. The floor comes\n' +
      "  from the installed wrangler's own engines.node, so a wrangler bump past a\n" +
      '  Node major fails here rather than at deploy time.\n',
  );
  process.exit(1);
}

const floor = wranglerFloor(REPO_ROOT);
console.log(
  `✓ check:node-floor — .nvmrc ${nvmrcMajor(REPO_ROOT)} (wrangler floor ${floor ?? '?'}), ` +
    `${hardcoded(REPO_ROOT).length} hardcoded node-version pins`,
);
