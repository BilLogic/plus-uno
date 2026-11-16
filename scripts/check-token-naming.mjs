#!/usr/bin/env node
/**
 * `npm run check:token-naming` — every live Figma variable names a real code token.
 *
 * Reads `scripts/figma-variables-snapshot.json` and checks every live variable
 * (excluding `archived / *` collections and `Deprecated/*` rows) against three rules:
 *   1. WEB code syntax names a token defined in SCSS (`collectScssTokens` +
 *      `parseWebCodeSyntax` from `scripts/generate-token-registry.mjs`).
 *   2. Every live variable carries a WEB code syntax unless listed on the explicit,
 *      commented `MISSING_SYNTAX_ALLOWLIST`.
 *   3. Each WEB code syntax agrees with the naming rule and documented exceptions
 *      recorded in `docs/engineering/foundation-docs.md` § Token naming.
 *      Reported as warnings while `BLOCK_ON_NAMING_MISMATCH` is `false`; flip
 *      that single constant to `true` once the warning list reaches zero.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import {
  ARCHIVED_COLLECTION,
  collectScssTokens,
  parseWebCodeSyntax,
} from './generate-token-registry.mjs';

export const SNAPSHOT_PATH = 'scripts/figma-variables-snapshot.json';

/**
 * Flip to `true` once the kind-3 naming-mismatch warning list is empty (#2641).
 * While `false`, kind 3 reports warnings so CI stays green and prints the backlog;
 * when `true`, kind 3 becomes blocking (`severity: 'error'`).
 */
export const BLOCK_ON_NAMING_MISMATCH = false;

const DEPRECATED_ROW = /^Deprecated\//;
const ELEVATION_SHADOW_PART = /^elevation\/shadow\/([^/]+)\/layer-\d+(?:\/(?:offsetX|offsetY|radius|spread))?$/;
const MOTION_SPRING_ROW = /^(.+)\/(?:damping|mass|stiffness)$/;
const CODE_DEFAULT_COLOR = /^color\/(?:background|text)\/code\/default$/;

/**
 * Live Figma variables permitted to carry no WEB code syntax (#2641).
 * Do not add entries to silence unmapped variables; fix Figma or the SCSS instead.
 */
export const MISSING_SYNTAX_ALLOWLIST = [
  // AI UI color variables in `color / semantics`: Figma ships AI surfaces ahead of code by design.
  {
    pattern: 'color/ai/*',
    match: (_collection, variable) => variable.startsWith('color/ai/'),
    reason: 'AI UI color variables ship in Figma ahead of code by design.',
  },
  // AI prompt input sizing variables: Figma ships Prompt input ahead of code by design.
  {
    pattern: 'Prompt input/*',
    match: (_collection, variable) => variable.startsWith('Prompt input/'),
    reason: 'AI Prompt input sizing variables ship in Figma ahead of code by design.',
  },
  // Elevation shadow per-layer color and geometry variables compose `--ds-shadow-*` effect styles.
  {
    pattern: 'elevation/shadow/*/layer-*',
    match: (collection, variable) =>
      collection === 'color / semantics' && ELEVATION_SHADOW_PART.test(variable),
    reason: 'Elevation shadow layer color and geometry parts compose `--ds-shadow-*` effect styles.',
  },
  // Boolean mode variable switching Sidebar docked state per breakpoint; code uses a media query.
  {
    pattern: 'Frame/sidebar-docked',
    match: (collection, variable) =>
      collection === 'spacing / templates' && variable === 'Frame/sidebar-docked',
    reason: 'Boolean breakpoint mode switch in Figma; code switches Sidebar docking via media query.',
  },
];

const kebabSegment = (segment) =>
  segment
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\s+/g, '-');

const slugifyPath = (value) =>
  value
    .split('/')
    .filter(Boolean)
    .map(kebabSegment)
    .join('-');

function applyPrefix(prefix, slug) {
  if (!prefix) return `--${slug}`;
  if (slug === prefix || slug.startsWith(`${prefix}-`)) {
    return `--${slug}`;
  }
  return `--${prefix}-${slug}`;
}

function dropRedundantFolder(variable) {
  const parts = variable.split('/');
  if (parts.length < 2) return variable;
  const first = kebabSegment(parts[0]);
  const second = kebabSegment(parts[1]);
  if (first === 'size' || second === first || second.startsWith(`${first}-`)) {
    return parts.slice(1).join('/');
  }
  return variable;
}

/**
 * Expected CSS token name for a live Figma variable under the naming rule and
 * documented exceptions (`docs/engineering/foundation-docs.md` § Token naming).
 *
 * @param {string} collection
 * @param {string} variable
 * @returns {string}
 */
export function expectedToken(collection, variable) {
  if (collection === 'color / primitives') {
    // An alpha step is its own segment in code: `red/600a8` → `--palette-red-600-a8`.
    return applyPrefix('palette', slugifyPath(variable).replace(/(\d)(a\d+)$/, '$1-$2'));
  }

  if (collection === 'color / semantics' || collection === 'color / opacity') {
    const shadowMatch = ELEVATION_SHADOW_PART.exec(variable);
    if (shadowMatch) {
      return `--ds-shadow-${slugifyPath(shadowMatch[1])}`;
    }
    const withoutTop = variable.replace(/^(?:color|elevation)\//, '');
    const stripped = CODE_DEFAULT_COLOR.test(variable)
      ? withoutTop
      : withoutTop.replace(/\/default$/, '');
    if (stripped.startsWith('chart/') || stripped.startsWith('skeleton/')) {
      return `--${slugifyPath(stripped)}`;
    }
    return applyPrefix('ds', slugifyPath(stripped));
  }

  if (collection === 'typography') {
    return applyPrefix('type', slugifyPath(variable));
  }

  if (collection === 'motion') {
    const springMatch = MOTION_SPRING_ROW.exec(variable);
    const stem = springMatch ? springMatch[1] : variable;
    // The raw spring primitives are their own family: `Spring/880/*` → `--motion-spring-880`.
    if (/^Spring\//.test(stem)) {
      return applyPrefix('motion', slugifyPath(stem));
    }
    return applyPrefix('ds-motion', slugifyPath(stem));
  }

  return `--${slugifyPath(dropRedundantFolder(variable))}`;
}

function matchesNamingRule(collection, variable, actualToken, expected) {
  if (collection === 'color / semantics' && ELEVATION_SHADOW_PART.test(variable)) {
    return actualToken === expected || actualToken.startsWith(`${expected}-`);
  }
  return actualToken === expected;
}

function isAllowlistedMissingSyntax(collection, variable) {
  return MISSING_SYNTAX_ALLOWLIST.some((entry) => entry.match(collection, variable));
}

/**
 * Pure check over a parsed Figma variables snapshot and SCSS token set.
 *
 * @param {{collections?: Record<string, {variables?: string[], codeSyntax?: Record<string, string>}>}} snapshot
 * @param {Set<string>} scssTokens
 * @param {{blockOnNamingMismatch?: boolean, file?: string}} [options]
 */
export function checkTokenNaming(
  snapshot,
  scssTokens,
  { blockOnNamingMismatch = BLOCK_ON_NAMING_MISMATCH, file = SNAPSHOT_PATH } = {},
) {
  const findings = [];
  const mismatchSeverity = blockOnNamingMismatch ? 'error' : 'warning';

  for (const [collection, data] of Object.entries(snapshot?.collections ?? {})) {
    if (ARCHIVED_COLLECTION.test(collection)) continue;
    const codeSyntax = data?.codeSyntax ?? {};

    for (const variable of data?.variables ?? []) {
      if (DEPRECATED_ROW.test(variable)) continue;

      const expected = expectedToken(collection, variable);
      const rawSyntax = Object.hasOwn(codeSyntax, variable) ? codeSyntax[variable] : undefined;

      if (rawSyntax === undefined || rawSyntax === '') {
        if (!isAllowlistedMissingSyntax(collection, variable)) {
          findings.push({
            kind: 'missing-syntax',
            severity: 'error',
            file,
            collection,
            variable,
            expected,
            message: `${collection} · ${variable}: missing WEB code syntax (expected ${expected})`,
          });
        }
        continue;
      }

      const actualToken = parseWebCodeSyntax(rawSyntax);
      if (!actualToken || !scssTokens.has(actualToken)) {
        findings.push({
          kind: 'unknown-token',
          severity: 'error',
          file,
          collection,
          variable,
          expected,
          actual: actualToken,
          message:
            `${collection} · ${variable}: WEB code syntax ${JSON.stringify(rawSyntax)} ` +
            `names ${actualToken ? `undefined SCSS token ${actualToken}` : 'a malformed token'} (expected ${expected})`,
        });
        continue;
      }

      if (!matchesNamingRule(collection, variable, actualToken, expected)) {
        findings.push({
          kind: 'naming-mismatch',
          severity: mismatchSeverity,
          file,
          collection,
          variable,
          expected,
          actual: actualToken,
          message: `${collection} · ${variable}: WEB code syntax has ${actualToken}, expected ${expected}`,
        });
      }
    }
  }

  return findings;
}

/** Counts per finding kind (`unknown-token`, `missing-syntax`, `naming-mismatch`). */
export function countByKind(findings) {
  const counts = { 'unknown-token': 0, 'missing-syntax': 0, 'naming-mismatch': 0 };
  for (const finding of findings) {
    if (finding.kind && Object.hasOwn(counts, finding.kind)) {
      counts[finding.kind] += 1;
    }
  }
  return counts;
}

function readSnapshot(repoRoot = REPO_ROOT) {
  const fullPath = join(repoRoot, SNAPSHOT_PATH);
  if (!existsSync(fullPath)) return null;
  try {
    return JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch {
    return null;
  }
}

/** @param {{repoRoot?: string, blockOnNamingMismatch?: boolean}} [ctx] */
export function run({ repoRoot = REPO_ROOT, blockOnNamingMismatch = BLOCK_ON_NAMING_MISMATCH } = {}) {
  const snapshot = readSnapshot(repoRoot);
  if (!snapshot || typeof snapshot !== 'object') {
    return [{ file: SNAPSHOT_PATH, message: `${SNAPSHOT_PATH} is missing or unreadable` }];
  }
  const scssTokens = collectScssTokens({ root: repoRoot });
  return checkTokenNaming(snapshot, scssTokens, { blockOnNamingMismatch, file: SNAPSHOT_PATH });
}

function summary({ repoRoot = REPO_ROOT } = {}) {
  const snapshot = readSnapshot(repoRoot);
  let live = 0;
  for (const [collection, data] of Object.entries(snapshot?.collections ?? {})) {
    if (ARCHIVED_COLLECTION.test(collection)) continue;
    for (const variable of data?.variables ?? []) {
      if (!DEPRECATED_ROW.test(variable)) live += 1;
    }
  }
  return `${live} live Figma variables match SCSS tokens and the naming rule`;
}

const REMEDY =
  '  -> unknown token: define it in SCSS or point the Figma WEB code syntax at a real token. ' +
  'Missing syntax: set the WEB code syntax in Figma (or allowlist it here with a reason). ' +
  'Naming mismatch: align the Figma name or code syntax per `docs/engineering/foundation-docs.md` § Token naming. ' +
  'Then refresh `scripts/figma-variables-snapshot.json`.';

main(import.meta.url, 'check:token-naming', {
  run,
  summary,
  remedy: REMEDY,
  fallThrough: {
    '--counts': () => {
      const counts = countByKind(run());
      console.log(
        `counts — unknown-token: ${counts['unknown-token']} · ` +
          `missing-syntax: ${counts['missing-syntax']} · ` +
          `naming-mismatch: ${counts['naming-mismatch']}`,
      );
    },
  },
});
