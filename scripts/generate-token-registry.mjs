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
const VARIABLES_SNAPSHOT = path.join(REPO_ROOT, 'scripts/figma-variables-snapshot.json');
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

/** `_Mastering-Content/On Mastering-Content Container` -> `on-mastering-content-container` */
function slug(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[\s_/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Candidate CSS tokens for one Figma variable path, most-specific first.
 *
 * The hand-authored .md covers the semantics a human wants to reason about; it
 * cannot realistically enumerate every variable (it reached 51 of 460). Naming
 * on both sides is systematic, so the bulk mapping is derived instead — the
 * collection decides the token family, then the path tail becomes the suffix.
 * @param {string} collection
 * @param {string} name full Figma variable path, e.g. "Card/pad-x-md"
 * @returns {string[]}
 */
function deriveCandidates(collection, name) {
  const parts = name.split('/').map((p) => p.trim());
  const leaf = parts[parts.length - 1];
  const head = parts[0].replace(/^_/, '');
  const out = [];

  if (collection.startsWith('colors')) {
    // State layers land as `--color-<base>-state-<NN>` in code. Figma spells the
    // same thing two ways: accent puts the tint in the leaf ("Advocacy 08"),
    // neutral puts it in the parent ("…/on surface/opacity-0_08").
    const accentTint = leaf.match(/\s(\d{2})$/);
    const neutralTint = leaf.match(/opacity-0[_.]?(\d{2})$/);
    if (accentTint) {
      const base = slug(leaf.replace(/\s*\d{2}$/, ''));
      out.push(`--color-${base}-state-${accentTint[1]}`);
    }
    if (neutralTint) {
      const base = slug(parts[parts.length - 2] || head);
      out.push(`--color-${base}-state-${neutralTint[1]}`);
    }
    if (/\(text\)/i.test(leaf)) out.push(`--color-${slug(leaf.replace(/\(text\)/i, ''))}-text`);
    out.push(`--color-${slug(leaf)}`);
    out.push(`--color-${slug(head)}-${slug(leaf)}`);
    return out;
  }

  if (collection.includes('semantics')) {
    out.push(`--size-${slug(head)}-${slug(leaf)}`);
    // Some families are coarser in code than in Figma (Figma has
    // `Surface Container/pad-x-md`, code only `--size-surface-container-pad-x`).
    // Fall back to the size-suffix-free form so those still bind.
    const stripped = slug(leaf).replace(/-(xs|sm|md|lg|xl|full)$/, '');
    if (stripped !== slug(leaf)) out.push(`--size-${slug(head)}-${stripped}`);
    return out;
  }

  if (collection.includes('primitive')) {
    // Code keeps the full Figma path: "Border/Radius/radius-100" ->
    // --size-border-radius-radius-100 ; "Spacing/Small/space-100" ->
    // --size-spacing-small-space-100.
    out.push(`--size-${slug(name)}`);
    out.push(`--size-${slug(leaf)}`);
    out.push(`--${slug(leaf)}`);
    return out;
  }

  if (collection.includes('layout')) {
    // Grid columns are bare in code (`--col-1`).
    out.push(`--${slug(leaf)}`);
    out.push(`--size-${slug(head)}-${slug(leaf)}`);
    out.push(`--size-${slug(leaf)}`);
    return out;
  }

  out.push(`--${slug(leaf)}`);
  return out;
}

/**
 * Derive the exact-path Figma-variable -> CSS-token mapping from the snapshot.
 * Keyed by the exact variable path because that is what `get_variable_defs`
 * returns — an agent doing a round-trip looks up what Figma actually reports,
 * not a prose label. Anything that does not resolve to a real SCSS token is
 * reported as unresolved rather than written, so a bad rule can never
 * masquerade as a mapping.
 * @param {Set<string>} scssTokens
 */
function buildFigmaVariableMappings(scssTokens) {
  if (!fs.existsSync(VARIABLES_SNAPSHOT)) {
    return { resolved: {}, unresolved: [], total: 0, snapshotMissing: true };
  }
  const snapshot = JSON.parse(fs.readFileSync(VARIABLES_SNAPSHOT, 'utf8'));
  /** @type {Record<string, Record<string, string>>} */
  const resolved = {};
  /** @type {Array<{ collection: string; figmaVariable: string; tried: string[] }>} */
  const unresolved = [];
  let total = 0;

  for (const [collection, data] of Object.entries(snapshot.collections)) {
    resolved[collection] = {};
    for (const name of data.variables) {
      total += 1;
      const candidates = deriveCandidates(collection, name);
      const hit = candidates.find((c) => scssTokens.has(c));
      if (hit) resolved[collection][name] = `var(${hit})`;
      else unresolved.push({ collection, figmaVariable: name, tried: candidates });
    }
  }
  return { resolved, unresolved, total, snapshotMissing: false };
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

  const figma = buildFigmaVariableMappings(scssTokens);
  const figmaResolvedCount = Object.values(figma.resolved).reduce(
    (n, group) => n + Object.keys(group).length,
    0,
  );

  const registry = {
    version: '1.1.0',
    generated: true,
    generatedBy: 'scripts/generate-token-registry.mjs',
    note: 'DO NOT EDIT BY HAND. Two inputs: design-system/docs/foundations/token-mapping.md (curated semantics, authoritative) and scripts/figma-variables-snapshot.json (bulk, derived mechanically). Every token in both is validated against design-system/src/tokens/*.scss. Run `npm run generate:token-registry`.',
    ...STATIC,
    variablesSnapshot: 'scripts/figma-variables-snapshot.json',
    mappings: { colors, typography, spacing, elevation },
    // Exact Figma variable path -> CSS token. This is the lookup an agent needs
    // for round-trip work, because `get_variable_defs` reports these paths.
    figmaVariableMappings: figma.resolved,
    validation: {
      scssTokenCount: scssTokens.size,
      unknownTokens: [...unknown].sort(),
      figmaVariableCoverage: {
        total: figma.total,
        resolved: figmaResolvedCount,
        percent: figma.total ? Math.round((figmaResolvedCount / figma.total) * 100) : 0,
        unresolved: figma.unresolved,
      },
    },
    notes: [
      'Spacing is contextual: pick the layer-appropriate token family; there is no single Spacing/N token.',
      'unknownTokens MUST be empty. A non-empty list means the .md references a token absent from SCSS.',
      'figmaVariableCoverage.unresolved is the human to-do list: either the Figma variable has no code counterpart (a real gap) or deriveCandidates() needs widening. It never blocks the build.',
    ],
  };

  return { registry, unknown, figma };
}

function main() {
  const check = process.argv.includes('--check');
  const { registry, unknown, figma } = build();
  const serialized = `${JSON.stringify(registry, null, 2)}\n`;
  const cov = registry.validation.figmaVariableCoverage;

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
  if (figma.snapshotMissing) {
    console.warn('\n⚠ scripts/figma-variables-snapshot.json not found — Figma variable mappings skipped.');
  } else {
    console.log(`Figma variables: ${cov.resolved}/${cov.total} resolved (${cov.percent}%), ${cov.unresolved.length} unresolved.`);
    const byCollection = {};
    for (const u of cov.unresolved) byCollection[u.collection] = (byCollection[u.collection] || 0) + 1;
    for (const [c, n] of Object.entries(byCollection)) console.log(`   unresolved in ${c}: ${n}`);
  }
  if (unknown.size) {
    console.warn(`\n⚠ ${unknown.size} referenced token(s) missing from SCSS:`);
    [...unknown].sort().forEach((t) => console.warn(`   - ${t}`));
  }
}

main();
