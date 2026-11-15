#!/usr/bin/env node
/**
 * Generate .storybook/brand-image.js by inlining the brand SVG as a base64 data URI.
 *
 * Why: Storybook's `brandImage` must render wherever the manager is served. On Netlify the
 * built Storybook lives under `/storybook/`, so an absolute `/assets/...` path resolves to the
 * site root, misses, and falls through the SPA catch-all to `index.html` — the logo silently
 * breaks. A data URI carries the image inline with no path resolution, so it always loads.
 *
 * Run after editing design-system/src/assets/storybook-brand.svg:
 *   npm run generate:brand-image
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isEntry, main } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export const BRAND_IMAGE_SVG_PATH = 'design-system/src/assets/storybook-brand.svg';
export const BRAND_IMAGE_PATH = '.storybook/brand-image.js';

const NORM = (text) => text.replace(/\r\n/g, '\n');

export const brandDataUri = (svg) =>
  `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;

export function renderBrandImage(svg) {
  const uri = brandDataUri(svg);
  return [
    '// AUTO-GENERATED — do not edit by hand.',
    '// The PLUS Storybook brand logo, inlined as a base64 data URI so it renders',
    '// regardless of where Storybook is served (root, /storybook/ subpath on Netlify,',
    '// trailing slash or not). An absolute /assets path breaks under the subpath deploy',
    '// because it falls through to the SPA catch-all and returns index.html.',
    '//',
    '// Regenerate after changing design-system/src/assets/storybook-brand.svg:',
    '//   npm run generate:brand-image',
    '',
    `const brandImage = ${JSON.stringify(uri)};`,
    '',
    'export default brandImage;',
    '',
  ].join('\n');
}

/** @returns {{path: string, content: string}[]} the rendered brand-image module, without writing */
export function artifacts(repoRoot = root) {
  const svg = fs.readFileSync(path.join(repoRoot, BRAND_IMAGE_SVG_PATH), 'utf8');
  return [{ path: BRAND_IMAGE_PATH, content: renderBrandImage(svg) }];
}

/** The drift check. Reports and never writes. */
export function run({ repoRoot = root } = {}) {
  return artifacts(repoRoot)
    .filter(({ path: rel, content }) => {
      const abs = path.join(repoRoot, rel);
      return !fs.existsSync(abs) || NORM(fs.readFileSync(abs, 'utf8')) !== content;
    })
    .map(({ path: rel }) => ({
      file: rel,
      message: 'is stale or missing — run: npm run generate:brand-image',
    }));
}

export const summary = () => `${BRAND_IMAGE_PATH} matches ${BRAND_IMAGE_SVG_PATH}`;

if (isEntry(import.meta.url)) {
  if (process.argv.includes('--check')) {
    main(import.meta.url, 'check:brand-image', { run, summary });
  } else {
    const svg = fs.readFileSync(path.join(root, BRAND_IMAGE_SVG_PATH), 'utf8');
    const uri = brandDataUri(svg);
    const outPath = path.join(root, BRAND_IMAGE_PATH);
    fs.writeFileSync(outPath, renderBrandImage(svg));
    console.log(`Wrote ${path.relative(root, outPath)} (${uri.length} char data URI)`);
  }
}
