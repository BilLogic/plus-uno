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
  ['Agent views (tokens)', `node scripts/generate-cheat-sheet.js${flag}`],
  ['Agent views (component + forms index)', `node scripts/generate-knowledge-components.js${flag}`],
  ['Component docs (generated half + group coverage)', `node scripts/generate-component-docs.mjs${flag}`],
  ['Root index (from frontmatter summaries)', `node scripts/generate-index.mjs${flag}`],
  ['Figma component registry', `node scripts/generate-component-registry-from-storybook.js${flag}`],
  ['Figma token registry', `node scripts/generate-token-registry.mjs${flag}`],
  ['Knowledge audit spreadsheet', `node scripts/generate-knowledge-audit.js${flag}`],
];

console.log(
  check
    ? 'check:agent — verifying committed agent artifacts against design-system SSOT (read-only)\n'
    : 'generate:agent — refreshing agent artifacts from design-system SSOT\n',
);

for (const [label, cmd] of steps) {
  console.log(`▸ ${label}`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: REPO_ROOT });
  } catch (err) {
    // execSync throws an Error carrying the child's status, and letting it
    // escape buries the step's own diagnostic under a Node stack trace. The
    // step already said what is wrong on stderr; all this layer owes the
    // reader is which step failed and the same exit code.
    console.error(`\n✗ ${check ? 'check' : 'generate'}:agent failed at: ${label}`);
    console.error(`  ${cmd}`);
    process.exit(typeof err.status === 'number' ? err.status : 1);
  }
}

if (check) {
  console.log('\n✓ check:agent complete — every generated artifact matches its source. Nothing was written.');
} else {
  console.log('\n✓ generate:agent complete');
  console.log('  Entry: design-system/guidelines/overview.md');
  console.log('  Views: design-system/agent-views/');
}
