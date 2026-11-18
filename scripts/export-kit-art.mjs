#!/usr/bin/env node
/**
 * `npm run generate:kit-art` — export static light/dark SVG art from the
 * shared illustration kit compositions.
 *
 * Reads the shared scene in `design-system/src/storybook-docs/illustrations/session-summary-scene.js`
 * and resolves every kit role token (`--ds-*`, `--card-radius`, `--stroke-hairline`, …)
 * from the SCSS token sources for light and dark modes, with zero external dependencies.
 *
 * Usage:
 *   node scripts/export-kit-art.mjs           # write static SVGs
 *   node scripts/export-kit-art.mjs --check   # CI: fail on drift
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';
import { CORNER, HAIRLINE } from '../design-system/src/storybook-docs/illustrations/paint.js';
import {
  SESSION_SUMMARY_BOX,
  sessionSummaryNodes,
} from '../design-system/src/storybook-docs/illustrations/session-summary-scene.js';
import { isEntry, main } from './lib/findings.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const KIT_ART_DIR = 'design-system/src/assets/images/kit';
export const KIT_ART_EXPORTS = [
  { mode: 'light', path: `${KIT_ART_DIR}/session-summary-light.svg` },
  { mode: 'dark', path: `${KIT_ART_DIR}/session-summary-dark.svg` },
];

const TOKEN_STATIC_FILES = [
  'design-system/src/tokens/_scales.scss',
  'design-system/src/tokens/ladder/_semantics.scss',
  'design-system/src/tokens/ladder/_templates.scss',
  'design-system/src/tokens/ladder/_components.scss',
  'design-system/src/tokens/color/_palette.scss',
];

const SEMANTIC_COLOR_FILE = 'design-system/src/tokens/color/_semantic.scss';
const LF = String.fromCharCode(10);
const CRLF = String.fromCharCode(13, 10);
const NORM = (text) => text.split(CRLF).join(LF);

function collectDeclarations(source, target = new Map()) {
  const pattern = tokenDeclarationPattern('--');
  let match = pattern.exec(source);
  while (match) {
    target.set(match[1], match[2].trim());
    match = pattern.exec(source);
  }
  return target;
}

/**
 * Extract the `[data-color-mode="light"]` and `[data-color-mode="dark"]` token maps
 * from the token stylesheets without invoking Sass or any external dependency.
 */
export function readModeTokens(repoRoot = ROOT) {
  const base = new Map();
  for (const rel of TOKEN_STATIC_FILES) {
    collectDeclarations(readFileSync(join(repoRoot, rel), 'utf8'), base);
  }
  base.set('--stroke-hairline', 'var(--stroke-1)');

  const semantic = readFileSync(join(repoRoot, SEMANTIC_COLOR_FILE), 'utf8');
  const darkMarker = '[data-color-mode="dark"]';
  const darkStart = semantic.indexOf(darkMarker);
  if (darkStart < 0) {
    throw new Error(`Could not locate ${darkMarker} in ${SEMANTIC_COLOR_FILE}`);
  }
  const lightBlock = semantic.slice(0, darkStart);
  const darkOpenBrace = semantic.indexOf('{', darkStart);
  const darkCloseBrace = semantic.indexOf('}', darkOpenBrace);
  if (darkOpenBrace < 0 || darkCloseBrace < 0) {
    throw new Error(`Could not locate closing brace for ${darkMarker} in ${SEMANTIC_COLOR_FILE}`);
  }
  const darkBlock = semantic.slice(darkOpenBrace + 1, darkCloseBrace);

  const light = collectDeclarations(lightBlock, new Map(base));
  const dark = collectDeclarations(darkBlock, new Map(base));
  return { light, dark };
}

/** Normalize CSS Color 4 `rgb(r g b / a)` into SVG-friendly `rgba(r, g, b, a)`. */
function normalizeSvgColor(value) {
  const m = value.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\s*\)$/i);
  if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${m[4]})`;
  return value;
}

/** Evaluate simple CSS `calc(...)` / `min(...)` over pixel lengths. */
function evalPxExpression(expr) {
  let out = expr.trim();
  const minMatch = out.match(/^min\(([^,]+),\s*([^)]+)\)$/);
  if (minMatch) {
    return Math.min(evalPxExpression(minMatch[1]), evalPxExpression(minMatch[2]));
  }
  const calcMatch = out.match(/^calc\((.+)\)$/);
  if (calcMatch) out = calcMatch[1].trim();
  const divMatch = out.match(/^(-?\d*\.?\d+)px\s*\/\s*(-?\d*\.?\d+)$/);
  if (divMatch) return parseFloat(divMatch[1]) / parseFloat(divMatch[2]);
  const pxMatch = out.match(/^(-?\d*\.?\d+)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);
  throw new Error(`Unsupported length expression in kit export: ${expr}`);
}

/** Recursively resolve every `var(--name)` inside a token expression. */
export function resolveCssExpression(expr, tokens, seen = new Set()) {
  if (typeof expr === 'number') return expr;
  const resolved = String(expr).replace(/var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]*)?\)/g, (_, name) => {
    if (seen.has(name)) throw new Error(`Token cycle at ${name}`);
    const raw = tokens.get(name);
    if (raw === undefined) throw new Error(`Undefined token ${name}`);
    const nextSeen = new Set(seen);
    nextSeen.add(name);
    return resolveCssExpression(raw, tokens, nextSeen);
  });
  return normalizeSvgColor(resolved.trim());
}

const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3))));

export function renderSessionSummarySvg(tokens) {
  const strokeWidth = evalPxExpression(resolveCssExpression(HAIRLINE.strokeWidth, tokens));
  const nodes = sessionSummaryNodes({
    x: 0,
    y: 0,
    w: SESSION_SUMMARY_BOX.width,
    h: SESSION_SUMMARY_BOX.height,
    accent: true,
  });

  const lines = nodes.map((node) => {
    if (node.kind === 'rect') {
      const rxRaw = evalPxExpression(resolveCssExpression(CORNER[node.corner], tokens));
      const rx = Math.min(rxRaw, Math.min(node.w, node.h) / 2);
      const attrs = [
        `x="${fmt(node.x)}"`,
        `y="${fmt(node.y)}"`,
        `width="${fmt(node.w)}"`,
        `height="${fmt(node.h)}"`,
        `rx="${fmt(rx)}"`,
        `fill="${resolveCssExpression(node.fill, tokens)}"`,
      ];
      if (node.stroke) {
        attrs.push(`stroke="${resolveCssExpression(node.stroke, tokens)}"`);
        attrs.push(`stroke-width="${fmt(strokeWidth)}"`);
      }
      if (node.opacity !== undefined) attrs.push(`opacity="${fmt(node.opacity)}"`);
      return `  <rect ${attrs.join(' ')}/>`;
    }
    if (node.kind === 'circle') {
      const attrs = [
        `cx="${fmt(node.cx)}"`,
        `cy="${fmt(node.cy)}"`,
        `r="${fmt(node.r)}"`,
        `fill="${resolveCssExpression(node.fill, tokens)}"`,
      ];
      if (node.opacity !== undefined) attrs.push(`opacity="${fmt(node.opacity)}"`);
      return `  <circle ${attrs.join(' ')}/>`;
    }
    if (node.kind === 'skeleton') {
      const rx = node.h / 2;
      const attrs = [
        `x="${fmt(node.x)}"`,
        `y="${fmt(node.y)}"`,
        `width="${fmt(node.w)}"`,
        `height="${fmt(node.h)}"`,
        `rx="${fmt(rx)}"`,
        `fill="${resolveCssExpression(node.tone, tokens)}"`,
      ];
      return `  <rect ${attrs.join(' ')}/>`;
    }
    const attrs = [
      `x1="${fmt(node.x1)}"`,
      `x2="${fmt(node.x2)}"`,
      `y1="${fmt(node.y1)}"`,
      `y2="${fmt(node.y2)}"`,
      `stroke="${resolveCssExpression(node.stroke, tokens)}"`,
      `stroke-width="${fmt(strokeWidth)}"`,
    ];
    return `  <line ${attrs.join(' ')}/>`;
  });

  return [
    '<!-- GENERATED by scripts/export-kit-art.mjs from design-system/src/storybook-docs/illustrations/session-summary-scene.js. Do not hand-edit: run `npm run generate:kit-art`. -->',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SESSION_SUMMARY_BOX.exportWidth}" height="${SESSION_SUMMARY_BOX.exportHeight}" viewBox="0 0 ${SESSION_SUMMARY_BOX.width} ${SESSION_SUMMARY_BOX.height}" fill="none">`,
    ...lines,
    '</svg>',
    '',
  ].join(LF);
}

export function artifacts(repoRoot = ROOT) {
  const modes = readModeTokens(repoRoot);
  return KIT_ART_EXPORTS.map(({ mode, path }) => ({
    path,
    content: renderSessionSummarySvg(modes[mode]),
  }));
}

export function run({ repoRoot = ROOT } = {}) {
  return artifacts(repoRoot)
    .filter(({ path, content }) => {
      const abs = join(repoRoot, path);
      return !existsSync(abs) || NORM(readFileSync(abs, 'utf8')) !== content;
    })
    .map(({ path }) => ({
      file: path,
      message: 'is stale or missing — run: npm run generate:kit-art',
    }));
}

export const summary = () => `the exported kit art matches the kit scene and tokens (${KIT_ART_EXPORTS.length} SVGs)`;

if (isEntry(import.meta.url)) {
  if (process.argv.includes('--check')) {
    main(import.meta.url, 'check:kit-art', { run, summary });
  } else {
    for (const { path, content } of artifacts()) {
      const abs = join(ROOT, path);
      if (existsSync(abs) && NORM(readFileSync(abs, 'utf8')) === content) continue;
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
      console.log(`[write] ${abs}`);
    }
    console.log(`[ok] ${summary()}`);
  }
}
