/**
 * Single entry: refresh all agent-facing artifacts from design-system SSOT.
 *
 * After editing component MDX (figmaMeta, usage), token-mapping.md, or tokens SCSS:
 *   npm run generate:agent
 *
 * Usage:
 *   node scripts/generate-agent.js
 *   node scripts/generate-agent.js --check   (CI: fail if any generated output is stale)
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');
const flag = check ? ' --check' : '';

const steps = [
  ['Agent views (tokens, component index)', 'node scripts/generate-cheat-sheet.js'],
  ['Agent views (component skeletons)', 'node scripts/generate-knowledge-components.js --skeletons'],
  ['Figma component registry', `node scripts/generate-component-registry-from-storybook.js${flag}`],
  ['Figma token registry', `node scripts/generate-token-registry.mjs${flag}`],
  ['Knowledge audit spreadsheet', `node scripts/generate-knowledge-audit.js${flag}`],
];

console.log('generate:agent — refreshing agent artifacts from design-system SSOT\n');

for (const [label, cmd] of steps) {
  console.log(`▸ ${label}`);
  execSync(cmd, { stdio: 'inherit', cwd: REPO_ROOT });
}

console.log('\n✓ generate:agent complete');
console.log('  Entry: design-system/docs/discovery.md');
console.log('  Views: design-system/agent-views/');
