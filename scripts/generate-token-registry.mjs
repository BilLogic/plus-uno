/**
 * Generate token-registry.json from design-system/docs/foundations/token-mapping.md (human source of truth)
 * and VALIDATE every referenced CSS token against the actual SCSS token definitions.
 *
 * This kills drift: the Figma↔code mapping is authored once (in the .md), the JSON is
 * generated, and any `var(--token)` that does not exist in design-system/src/tokens/*.scss
 * is reported (and fails `--check`). That guard is exactly what would have caught the
 * bogus `--size-spacing-between-components-3` mapping.
 *
 * Usage:
 *   node scripts/generate-token-registry.mjs          (write)
 *   node scripts/generate-token-registry.mjs --check  (CI: fail if stale or unknown tokens)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MD_SOURCE = path.join(REPO_ROOT, 'design-system/docs/foundations/token-mapping.md');
const TOKENS_DIR = path.join(REPO_ROOT, 'design-system/src/tokens');
const OUT = path.join(REPO_ROOT, 'design-system/figma/token-registry.json');

const STATIC = {
  figmaFileKey: 'zAecJNRdvJzAUOcjV32tRX',
  syncCommand: 'npm run sync:tokens && npm run generate:tokens',
  codeTokenRoot: 'design-system/src/tokens/',
  humanReference: 'design-system/docs/foundations/token-mapping.md',
};

/** All `--token` names defined across the SCSS token files (existence truth). */
function collectScssTokens() {
  const set = new Set();
  if (!fs.existsSync(TOKENS_DIR)) return set;
  for (const file of fs.readdirSync(TOKENS_DIR)) {
    if (!file.endsWith('.scss')) continue;
    const content = fs.readFileSync(path.join(TOKENS_DIR, file), 'utf8');
    for (const m of content.matchAll(/(--[\w-]+)\s*:/g)) set.add(m[1]);
  }
  return set;
}

/** Expand `{a|b}` brace groups into all literal combinations. */
function expandBraces(str) {
  const open = str.indexOf('{');
  if (open === -1) return [str];
  const close = str.indexOf('}', open);
  if (close === -1) return [str];
  const before = str.slice(0, open);
  const after = str.slice(close + 1);
  const options = str.slice(open + 1, close).split('|');
  const out = [];
  for (const opt of options) {
    for (const tail of expandBraces(after)) out.push(before + opt + tail);
  }
  return out;
}

/** Pull every `var(--...)` inner token name from a markdown cell. */
function tokensInCell(cell) {
  const out = [];
  for (const m of cell.matchAll(/var\((--[^)]+)\)/g)) out.push(m[1]);
  return out;
}

/** Parse markdown into tables tagged with their nearest heading. */
function parseTables(md) {
  const lines = md.split('\n');
  const tables = [];
  let heading = '';
  let current = null;
  for (const raw of lines) {
    const line = raw.trim();
    const h = line.match(/^#{2,4}\s+(.*)/);
    if (h) { heading = h[1].trim(); current = null; continue; }
    if (line.startsWith('|')) {
      // Preserve escaped pipes (\|) inside cells before splitting on the real delimiter.
      const cells = line
        .replace(/\\\|/g, '\u0001')
        .split('|')
        .slice(1, -1)
        .map((c) => c.replace(/\u0001/g, '|').trim());
      if (/^:?-{2,}:?$/.test(cells[0] || '')) continue; // separator row
      if (!current) { current = { heading, rows: [] }; tables.push(current); }
      current.rows.push(cells);
    } else {
      current = null;
    }
  }
  return tables;
}

function build() {
  const md = fs.readFileSync(MD_SOURCE, 'utf8');
  const scssTokens = collectScssTokens();
  const tables = parseTables(md);

  const colors = {};
  const typography = {};
  const spacing = {};
  const elevation = {};
  const referenced = new Set();

  const record = (cell) => tokensInCell(cell).forEach((t) => referenced.add(t));

  for (const { heading, rows } of tables) {
    const h = heading.toLowerCase();
    const isHeader = (r) => /figma/i.test(r[0]) || /css token|plus css/i.test((r[1] || ''));
    for (const row of rows) {
      if (row.length < 2 || isHeader(row)) continue;
      const label = row[0].replace(/`/g, '').trim();
      const cellTokens = tokensInCell(row[1]);
      if (!label || cellTokens.length === 0) continue;
      record(row[1]);

      if (h.includes('color') || h.includes('competency')) {
        colors[label] = `var(${cellTokens[0]})`;
      } else if (h.includes('typograph')) {
        typography[label] = cellTokens.map((t) => `var(${t})`);
      } else if (h.includes('spacing')) {
        spacing[label] = row[1].match(/var\([^)]+\)/)?.[0] || `var(${cellTokens[0]})`;
      } else if (h.includes('elevation')) {
        elevation[label] = `var(${cellTokens[0]})`;
      }
    }
  }

  // Validate referenced tokens (expand brace patterns) against SCSS existence.
  const unknown = new Set();
  for (const tok of referenced) {
    for (const expanded of expandBraces(tok)) {
      if (!scssTokens.has(expanded)) unknown.add(expanded);
    }
  }

  const registry = {
    version: '1.0.0',
    generated: true,
    generatedBy: 'scripts/generate-token-registry.mjs',
    note: 'DO NOT EDIT BY HAND. Source of truth is design-system/docs/foundations/token-mapping.md; every token is validated against design-system/src/tokens/*.scss. Run `npm run generate:token-registry`.',
    ...STATIC,
    mappings: { colors, typography, spacing, elevation },
    validation: {
      scssTokenCount: scssTokens.size,
      unknownTokens: [...unknown].sort(),
    },
    notes: [
      'Spacing is contextual: pick the layer-appropriate token family; there is no single Spacing/N token.',
      'unknownTokens MUST be empty. A non-empty list means the .md references a token absent from SCSS.',
    ],
  };

  return { registry, unknown };
}

function main() {
  const check = process.argv.includes('--check');
  const { registry, unknown } = build();
  const serialized = `${JSON.stringify(registry, null, 2)}\n`;

  if (check) {
    let failed = false;
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (current !== serialized) {
      console.error('✗ token-registry.json is stale. Run `npm run generate:token-registry`.');
      failed = true;
    }
    if (unknown.size) {
      console.error(`✗ ${unknown.size} token(s) referenced in token-mapping.md do NOT exist in SCSS:`);
      [...unknown].sort().forEach((t) => console.error(`   - ${t}`));
      failed = true;
    }
    if (failed) process.exit(1);
    console.log('✓ token-registry.json up to date and all tokens exist in SCSS.');
    return;
  }

  fs.writeFileSync(OUT, serialized);
  console.log(`Wrote token-registry.json (${Object.keys(registry.mappings.colors).length} colors, ${Object.keys(registry.mappings.spacing).length} spacing contexts).`);
  if (unknown.size) {
    console.warn(`\n⚠ ${unknown.size} referenced token(s) missing from SCSS:`);
    [...unknown].sort().forEach((t) => console.warn(`   - ${t}`));
  }
}

main();
