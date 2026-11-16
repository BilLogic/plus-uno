/**
 * Generate token-registry.json from design-system/guidelines/figma/token-mapping.md (human source of truth)
 * and VALIDATE every referenced CSS token against the actual SCSS token definitions.
 *
 * This kills drift: the Figma↔code mapping is authored once (in the .md), the JSON is
 * generated, and any `var(--token)` that does not exist in design-system/src/tokens/*.scss
 * is reported (and fails `--check`). That guard is exactly what would have caught the
 * bogus `--size-spacing-between-components-3` mapping.
 *
 * Each variable in `scripts/figma-variables-snapshot.json` is resolved by its
 * `codeSyntax.WEB` (`var(--x)` -> `--x`) first and checked against SCSS, falling
 * back to collection name rules only when a variable carries no code syntax.
 * The color set's Figma spec (`COLOR_SPEC`) supplies code syntax for variables
 * the snapshot does not yet carry it for. Collections prefixed `archived / `
 * have no code counterpart and are skipped (`ARCHIVED_COLLECTION`).
 *
 * Usage:
 *   node scripts/generate-token-registry.mjs          (write)
 *   node scripts/generate-token-registry.mjs --check  (CI: fail if stale or unknown tokens)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { TOKEN_NAME, tokenDeclarationPattern, varReferencePattern } from '../design-system/src/lib/tokens.mjs';
import { COLOR_TOKEN_DIR, TOKEN_DIR, tokenSources } from '../design-system/src/lib/tokens-node.mjs';
import { isEntry } from './lib/findings.mjs';
import { frameLayerToken, isFrameLayerCollection } from './lib/frame-layer-collections.mjs';
import { TYPOGRAPHY_COLLECTION, typographyToken } from './lib/typography-collection.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MD_SOURCE = path.join(REPO_ROOT, 'design-system/guidelines/figma/token-mapping.md');
const VARIABLES_SNAPSHOT = path.join(REPO_ROOT, 'scripts/figma-variables-snapshot.json');
const OUT = path.join(REPO_ROOT, 'design-system/figma/token-registry.json');

/** The generated color set's Figma spec: the variables Figma will hold, with their code syntax. */
export const COLOR_SPEC_PATH = `${COLOR_TOKEN_DIR}/figma-spec.json`;
export const COLOR_SPEC = path.join(REPO_ROOT, COLOR_SPEC_PATH);

/** The archived Figma collections (`archived / *`), skipped rather than mapped. */
export const ARCHIVED_COLLECTION = /^archived \/ /;

/** `var(--ds-text-brand)` or `var(--ds-text-brand, fallback)` → `--ds-text-brand`; anything else → null. */
const WEB_SYNTAX = new RegExp(`^var\\(\\s*(${TOKEN_NAME})\\s*(?:,[^)]*)?\\)$`);

/** Extract `--x` from a `var(--x)` WEB code syntax string, or `null` when malformed. */
export function parseWebCodeSyntax(web) {
  if (typeof web !== 'string') return null;
  const match = WEB_SYNTAX.exec(web.trim());
  return match ? match[1] : null;
}

/**
 * Each spec collection's code syntax, as `collection → (variable path → token)`.
 * A variable with no web code syntax — a shadow layer's color, offset or
 * blur, which only an effect style binds — is left out, and a collection with
 * none at all (the hidden primitives) is not listed.
 *
 * @param {{collections: {name: string, variables: {name: string, codeSyntax?: {WEB?: string}}[]}[]}} spec
 * @returns {Map<string, Map<string, string>>}
 */
export function specCodeSyntax(spec) {
  const out = new Map();
  for (const collection of spec?.collections ?? []) {
    const names = new Map();
    for (const variable of collection.variables ?? []) {
      const token = parseWebCodeSyntax(variable.codeSyntax?.WEB ?? '');
      if (token) names.set(variable.name, token);
    }
    if (names.size) out.set(collection.name, names);
  }
  return out;
}

const STATIC = {
  figmaFileKey: 'zAecJNRdvJzAUOcjV32tRX',
  syncCommand: 'npm run generate:tokens',
  codeTokenRoot: `${TOKEN_DIR}/`,
  humanReference: 'design-system/guidelines/figma/token-mapping.md',
};

/** All `--token` names defined across the SCSS token files (existence truth). */
export function collectScssTokens({ root } = {}) {
  const set = new Set();
  for (const source of tokenSources(root ? { root } : undefined)) {
    for (const [, name] of source.text.matchAll(tokenDeclarationPattern())) {
      set.add(name);
    }
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

/**
 * Interior of each `var(...)` in a mapping cell. The opening `var(` and the
 * grammar-legal name prefix are the module's `varReferencePattern`; the rest
 * of the call is walked because the mapping DSL writes brace groups
 * (`--size-card-gap-{sm|md}`) that are not token characters and that
 * `expandBraces` expands before the name is checked against SCSS.
 *
 * @param {string} cell
 * @returns {string[]}
 */
function varInteriors(cell) {
  const out = [];
  for (const m of cell.matchAll(varReferencePattern())) {
    let depth = 1;
    let j = m.index + 4;
    while (j < cell.length && depth > 0) {
      if (cell[j] === '(') depth += 1;
      else if (cell[j] === ')') {
        depth -= 1;
        if (depth === 0) break;
      }
      j += 1;
    }
    out.push(cell.slice(m.index + 4, j).trim());
  }
  return out;
}

/** Pull every `var(--...)` inner token name from a markdown cell. */
function tokensInCell(cell) {
  return varInteriors(cell);
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
 * A collection whose variables carry their code syntax is not derived at all:
 * the syntax IS the name, so it is the one candidate.
 *
 * @param {string} collection
 * @param {string} name full Figma variable path, e.g. "Card/pad-x-md"
 * @param {{codeSyntax?: Map<string, string> | Record<string, string>}} [options] this collection's
 *        code syntax, from the snapshot or `specCodeSyntax`, where it has one
 * @returns {string[]}
 */
export function deriveCandidates(collection, name, { codeSyntax } = {}) {
  if (codeSyntax instanceof Map && codeSyntax.has(name)) {
    const raw = codeSyntax.get(name);
    return [parseWebCodeSyntax(raw) ?? raw];
  }
  if (codeSyntax && !(codeSyntax instanceof Map) && Object.hasOwn(codeSyntax, name) && codeSyntax[name]) {
    const raw = codeSyntax[name];
    return [parseWebCodeSyntax(raw) ?? raw];
  }
  const parts = name.split('/').map((p) => p.trim());
  const leaf = parts[parts.length - 1];
  const out = [];

  if (isFrameLayerCollection(collection)) return [`--${frameLayerToken(collection, name)}`];
  if (collection === TYPOGRAPHY_COLLECTION) return [typographyToken(name)].filter(Boolean);

  // Fallback rules when a variable carries no code syntax in the snapshot.
  // A spacing / foundations variable is its path, minus
  // the Size folder ("Element/pad-x-sm" -> --element-pad-x-sm,
  // "Size/Height/200" -> --height-200); a spacing / primitives variable is its
  // leaf ("Space/space-025" -> --space-025), the candidate every collection
  // ends with. A candidate that misses shows up as unresolved.
  if (collection === 'spacing / primitives' && /^Radius\/radius-\d+$/.test(name)) return [`--${leaf.replace('radius-', 'space-')}`];
  if (collection === 'spacing / foundations') {
    const token = `--${slug(name.replace(/^Size\//, ''))}`;
    if (/^--item-height-(sm|md)$/.test(token)) return [token.replace('--item-height-', '--control-')];
    if (/^--border-(default|selected|focused)$/.test(token)) return [token.replace('--border-', '--border-width-')];
    out.push(token);
  }
  out.push(`--${slug(leaf)}`);
  return out;
}

export const REASON_NO_CODE_SYNTAX = 'no code syntax';
export const REASON_MISSING_TOKEN = 'code syntax names a token the code does not have';

/**
 * Derive the exact-path Figma-variable -> CSS-token mapping from the snapshot.
 * Keyed by the exact variable path because that is what `get_variable_defs`
 * returns — an agent doing a round-trip looks up what Figma actually reports,
 * not a prose label. Resolves by `codeSyntax.WEB` (`var(--x)` -> `--x`) first
 * and verifies that `--x` exists in `scssTokens`; falls back to name rules only
 * when a variable has no code syntax. Collections starting with `archived / `
 * are skipped and excluded from coverage counts.
 *
 * @param {Set<string>} scssTokens
 * @param {{ snapshot?: object; specSyntax?: Map<string, Map<string, string>> }} [options]
 */
export function buildFigmaVariableMappings(scssTokens, { snapshot: givenSnapshot, specSyntax: givenSpecSyntax } = {}) {
  if (!givenSnapshot && !fs.existsSync(VARIABLES_SNAPSHOT)) {
    return { resolved: {}, unresolved: [], skippedCollections: [], total: 0, snapshotMissing: true };
  }
  const snapshot = givenSnapshot ?? JSON.parse(fs.readFileSync(VARIABLES_SNAPSHOT, 'utf8'));
  const syntax =
    givenSpecSyntax ??
    (fs.existsSync(COLOR_SPEC)
      ? specCodeSyntax(JSON.parse(fs.readFileSync(COLOR_SPEC, 'utf8')))
      : new Map());
  /** @type {Record<string, Record<string, string>>} */
  const resolved = {};
  /** @type {Array<{ collection: string; figmaVariable: string; tried: string[]; reason: string }>} */
  const unresolved = [];
  /** @type {Array<{ collection: string; count: number }>} */
  const skippedCollections = [];
  let total = 0;

  const map = (collection, names, snapshotSyntax = {}) => {
    resolved[collection] = {};
    const specMap = syntax.get(collection);
    for (const name of names) {
      total += 1;
      const rawWeb =
        snapshotSyntax && typeof snapshotSyntax === 'object' && Object.hasOwn(snapshotSyntax, name)
          ? snapshotSyntax[name]
          : undefined;
      if (typeof rawWeb === 'string' && rawWeb.length > 0) {
        const token = parseWebCodeSyntax(rawWeb);
        if (token && scssTokens.has(token)) {
          resolved[collection][name] = `var(${token})`;
        } else {
          unresolved.push({
            collection,
            figmaVariable: name,
            tried: [token ?? rawWeb],
            reason: REASON_MISSING_TOKEN,
          });
        }
        continue;
      }

      if (specMap?.has(name)) {
        const token = specMap.get(name);
        if (scssTokens.has(token)) {
          resolved[collection][name] = `var(${token})`;
        } else {
          unresolved.push({
            collection,
            figmaVariable: name,
            tried: [token],
            reason: REASON_MISSING_TOKEN,
          });
        }
        continue;
      }

      const candidates = deriveCandidates(collection, name);
      const hit = candidates.find((c) => scssTokens.has(c));
      if (hit) {
        resolved[collection][name] = `var(${hit})`;
      } else {
        unresolved.push({
          collection,
          figmaVariable: name,
          tried: candidates,
          reason: REASON_NO_CODE_SYNTAX,
        });
      }
    }
  };

  for (const [collection, data] of Object.entries(snapshot.collections)) {
    if (ARCHIVED_COLLECTION.test(collection)) {
      skippedCollections.push({ collection, count: data.variables.length });
      continue;
    }
    map(collection, data.variables, data.codeSyntax);
  }
  // A spec collection Figma does not hold yet is still the lookup an agent will
  // need the day it is pushed, and its names are the spec's, not a guess — so it
  // is mapped from the spec, and held to the token sheets like every other one.
  for (const [collection, names] of syntax) {
    if (!(collection in snapshot.collections) && !ARCHIVED_COLLECTION.test(collection)) {
      map(collection, names.keys());
    }
  }
  return { resolved, unresolved, skippedCollections, total, snapshotMissing: false };
}

export function build(figmaOptions = {}) {
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
        spacing[label] = `var(${cellTokens[0]})`;
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

  const figma = buildFigmaVariableMappings(scssTokens, figmaOptions);
  const figmaResolvedCount = Object.values(figma.resolved).reduce(
    (n, group) => n + Object.keys(group).length,
    0,
  );

  const registry = {
    version: '1.1.0',
    generated: true,
    generatedBy: 'scripts/generate-token-registry.mjs',
    note:
      'DO NOT EDIT BY HAND. Three inputs: design-system/guidelines/figma/token-mapping.md (curated semantics, authoritative), scripts/figma-variables-snapshot.json (resolved by codeSyntax.WEB first, falling back to name rules when absent; archived/* collections skipped) and ' +
      `${COLOR_SPEC_PATH} (the generated --ds- color variables, read by their code syntax; the "color / foundations" paths come from this spec until the Figma push lands and the snapshot holds them). ` +
      `Every token in all three is validated against ${TOKEN_DIR}/*.scss and ${COLOR_TOKEN_DIR}/*.scss. Run \`npm run generate:token-registry\`.`,
    ...STATIC,
    variablesSnapshot: 'scripts/figma-variables-snapshot.json',
    colorSpec: COLOR_SPEC_PATH,
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
        skippedCollections: figma.skippedCollections,
        unresolved: figma.unresolved,
      },
    },
    notes: [
      'Spacing is contextual: pick the layer-appropriate token family; there is no single Spacing/N token.',
      'unknownTokens MUST be empty. A non-empty list means the .md references a token absent from SCSS.',
      'figmaVariableCoverage counts non-archived collections only; archived / * collections are listed in skippedCollections, and each unresolved entry records its reason ("no code syntax" or "code syntax names a token the code does not have"). It never blocks the build.',
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
    const skippedVars = cov.skippedCollections.reduce((n, s) => n + s.count, 0);
    const skippedSummary = cov.skippedCollections.length
      ? `, ${skippedVars} skipped across ${cov.skippedCollections.length} archived collection(s)`
      : '';
    console.log(
      `Figma variables: ${cov.resolved}/${cov.total} resolved (${cov.percent}%), ${cov.unresolved.length} unresolved${skippedSummary}.`,
    );
    for (const s of cov.skippedCollections) {
      console.log(`   skipped ${s.collection}: ${s.count}`);
    }
    const byCollection = {};
    for (const u of cov.unresolved) {
      if (!byCollection[u.collection]) byCollection[u.collection] = { total: 0, noSyntax: 0, missingToken: 0 };
      byCollection[u.collection].total += 1;
      if (u.reason === REASON_NO_CODE_SYNTAX) byCollection[u.collection].noSyntax += 1;
      else byCollection[u.collection].missingToken += 1;
    }
    for (const [c, info] of Object.entries(byCollection)) {
      const reasons = [
        info.noSyntax ? `${info.noSyntax} ${REASON_NO_CODE_SYNTAX}` : '',
        info.missingToken ? `${info.missingToken} ${REASON_MISSING_TOKEN}` : '',
      ]
        .filter(Boolean)
        .join(', ');
      console.log(`   unresolved in ${c}: ${info.total} (${reasons})`);
    }
  }
  if (unknown.size) {
    console.warn(`\n⚠ ${unknown.size} referenced token(s) missing from SCSS:`);
    [...unknown].sort().forEach((t) => console.warn(`   - ${t}`));
  }
}

if (isEntry(import.meta.url)) main();
