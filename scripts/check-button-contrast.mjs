#!/usr/bin/env node
/**
 * check:button-contrast — every button the theme map generates is readable, and
 * no two styles render the same thing (#312).
 *
 * WHY THIS IS NOT COVERED BY `check:storybook`. The a11y ratchet measures what
 * the stories render. Nothing renders a filled `warning` button, so nothing has
 * ever measured one, and a 3.70:1 label has sat in the map for as long as the
 * map has existed. A theme map is a generator; the thing worth checking is
 * everything it generates, whether or not someone wrote a story for it.
 *
 * The duplicate assertion has no accessibility rule behind it at all. `info` is
 * `var(--color-tertiary)` — one line in the token file that makes two style
 * names render one appearance. No tool compares token values for equality,
 * because no tool knows they were meant to differ.
 *
 * WHY IT IS A RATCHET AND NOT A THRESHOLD. Both findings are colour-token
 * decisions (#268): does `--color-warning` need a darker filled variant, and
 * should `info` be re-pointed or merged? Neither is Button's to make, and
 * failing the build on someone else's open question would get the check turned
 * off. Recording them means the NEXT one fails loudly, which is the whole value.
 *
 * The baseline may shrink and must never grow. An entry that no longer fails is
 * reported, so a fix cannot be made and the entry quietly left behind.
 *
 * Run: `npm run check:button-contrast`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { AA_TEXT, FILLS, findings, readRepo, sweep } from './button-contrast.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BASELINE = 'docs/evals/button-contrast-baseline.json';

const baseline = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, BASELINE), 'utf8'));
const { values, themes } = readRepo(REPO_ROOT);

const rows = sweep(themes, values);
const found = findings(themes, values, baseline);

const line = '─'.repeat(72);

if (found.length) {
  console.error(`\n[button-contrast] ${found.length} finding(s):`);
  for (const finding of found) console.error(`  ${finding}`);
  console.error(`\n${line}`);
  console.error(
    `✗ check:button-contrast — ${themes.length} styles × ${FILLS.length} fills = ` +
      `${rows.length} combinations\n`,
  );
  console.error(
    '  -> A label under 4.5:1, or two styles that render the same ground. If the\n' +
      `     decision is not yours to make, record it in ${BASELINE}\n` +
      '     with the issue that owns it — and never as a way to make a new one quiet.',
  );
  process.exit(1);
}

/*
 * The tightest combination that is NOT baselined — the margin the next change
 * has to beat. Including the baselined ones would print `warning/filled at 3.7`
 * under a line saying everything clears 4.5, which is a green check reporting a
 * red number.
 */
const worst = rows
  .filter((row) => row.ratio !== null && !baseline.contrast.includes(`${row.style}/${row.fill}`))
  .sort((a, b) => a.ratio - b.ratio)[0];

console.log(
  `✓ check:button-contrast — ${rows.length} combinations from ${themes.length} styles; ` +
    `every label clears ${AA_TEXT}:1 and every style renders its own ground ` +
    `(${baseline.contrast.length + baseline.duplicates.length} baselined)`,
);
console.log(`  tightest unbaselined: ${worst.style}/${worst.fill} at ${worst.ratio}:1`);
