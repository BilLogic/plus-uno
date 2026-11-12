/**
 * Generate the agent file for every template and pattern docs page.
 *
 *   design-system/agent-views/pages/<templates|patterns>/<Name>.md
 *
 * Usage:
 *   node scripts/generate-docs-agent-files.mjs
 *   node scripts/generate-docs-agent-files.mjs --check   (CI: fail if stale, write nothing)
 *
 * The render and its rules are in `scripts/lib/docs-agent-file.mjs`.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { pagesMissingManifestTag, syncDocsAgentFiles } from './lib/docs-agent-file.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const unserved = pagesMissingManifestTag(REPO_ROOT);
if (unserved.length) {
  console.error(`✗ ${unserved.length} template, pattern or Foundations · Motion page(s) lack the \`manifest\` tag, so the Storybook MCP \`get-documentation\` cannot serve them — add it to their <Meta tags>:\n${unserved.map((f) => `  ${f}`).join('\n')}`);
  process.exit(1);
}
const { stale, count } = syncDocsAgentFiles(REPO_ROOT, { check });

if (check && stale.length) {
  console.error(`✗ ${stale.length} template/pattern agent file(s) stale — run \`npm run generate:docs-agent-files\`:\n${stale.map((f) => `  ${f}`).join('\n')}`);
  process.exit(1);
}
console.log(`✓ docs agent files (${count} pages)${check ? ' up to date' : ''}`);
