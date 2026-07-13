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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'design-system/src/assets/storybook-brand.svg');
const outPath = path.join(root, '.storybook/brand-image.js');

const svg = fs.readFileSync(svgPath, 'utf8');
const uri = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;

const contents = [
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

fs.writeFileSync(outPath, contents);
console.log(`Wrote ${path.relative(root, outPath)} (${uri.length} char data URI)`);
