/**
 * Render the Mermaid diagrams in docs/flowcharts/uno-bot-v2-flowcharts.md
 * to SVG files via mermaid.ink. One-off utility — not part of the bot.
 *
 * Usage: node scripts/render-mermaid.mjs
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SOURCE_MD = resolve(REPO_ROOT, 'docs/flowcharts/uno-bot-v2-flowcharts.md');
const OUT_DIR = resolve(REPO_ROOT, 'docs/flowcharts/images');

// Diagram labels — order matches the markdown's H2 sections that contain Mermaid blocks.
// Skipping the H2 "What's NOT diagrammed here" etc.
const LABELS = [
  'overview',
  'implement-flow',
  'qa-flow',
  'marketplace-search-flow',
  'marketplace-add-flow',
  'marketplace-edit-flow',
  'confirmation-gate-state-machine',
];

async function main() {
  const md = await readFile(SOURCE_MD, 'utf8');

  // Extract all ```mermaid ... ``` fenced blocks
  const blocks = [];
  const re = /```mermaid\s*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    blocks.push(m[1].trim());
  }

  console.log(`Found ${blocks.length} mermaid blocks in ${SOURCE_MD}`);
  if (blocks.length !== LABELS.length) {
    console.warn(`⚠️  Expected ${LABELS.length} blocks, got ${blocks.length}. Will render whatever's there.`);
  }

  await mkdir(OUT_DIR, { recursive: true });

  for (let i = 0; i < blocks.length; i++) {
    const label = LABELS[i] || `diagram-${i + 1}`;
    const src = blocks[i];
    const encoded = Buffer.from(src, 'utf8').toString('base64url');
    const url = `https://mermaid.ink/svg/${encoded}`;

    process.stdout.write(`[${i + 1}/${blocks.length}] ${label}... `);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`FAIL (HTTP ${res.status})`);
        const body = await res.text();
        console.log(`  Error body (first 300 chars): ${body.slice(0, 300)}`);
        continue;
      }
      const svg = await res.text();
      const out = resolve(OUT_DIR, `${label}.svg`);
      await writeFile(out, svg, 'utf8');
      console.log(`OK (${(svg.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.log(`FAIL (${err.message})`);
    }
  }

  console.log(`\nImages written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
