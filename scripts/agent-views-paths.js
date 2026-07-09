/**
 * Shared path helpers — agent-views mirrors design-system/src layout.
 *
 * Excluded from mirror (Storybook plumbing / static assets, not agent DS knowledge):
 *   storybook-docs, assets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');
export const SRC_ROOT = path.join(REPO_ROOT, 'design-system/src');
export const AGENT_ROOT = path.join(REPO_ROOT, 'design-system/agent-views');

/** Top-level src dirs that do not get an agent-views mirror */
export const EXCLUDED_TOP_LEVEL = new Set(['storybook-docs', 'assets']);

export function isFormSubdir(name) {
  const sub = path.join(SRC_ROOT, 'forms', name);
  return fs.existsSync(sub) && fs.statSync(sub).isDirectory();
}

export function componentAgentRel(name) {
  return `components/${name}/${name}.md`;
}

export function formAgentRel(name) {
  if (isFormSubdir(name)) return `forms/${name}/${name}.md`;
  return `forms/${name}.md`;
}

export function componentAgentAbs(name) {
  return path.join(AGENT_ROOT, componentAgentRel(name));
}

export function formAgentAbs(name) {
  return path.join(AGENT_ROOT, formAgentRel(name));
}

export function srcComponentDir(name) {
  return `components/${name}/`;
}

export function srcFormDir(name) {
  return isFormSubdir(name) ? `forms/${name}/` : 'forms/';
}

/**
 * Mirror design-system/src directory tree under agent-views (folders only).
 */
export function syncAgentViewsTree() {
  let created = 0;

  function walk(srcDir, agentDir) {
    if (!fs.existsSync(srcDir)) return;
    fs.mkdirSync(agentDir, { recursive: true });

    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      walk(path.join(srcDir, entry.name), path.join(agentDir, entry.name));
      created++;
    }
  }

  for (const entry of fs.readdirSync(SRC_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || EXCLUDED_TOP_LEVEL.has(entry.name)) continue;
    walk(path.join(SRC_ROOT, entry.name), path.join(AGENT_ROOT, entry.name));
  }

  return created;
}

/**
 * Collect generated agent-view markdown files under components/ and forms/.
 */
export function listAgentViewMarkdown() {
  const results = [];

  function walk(agentDir, relPrefix) {
    if (!fs.existsSync(agentDir)) return;
    for (const entry of fs.readdirSync(agentDir, { withFileTypes: true })) {
      const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(agentDir, entry.name), rel);
        continue;
      }
      if (!entry.name.endsWith('.md') || entry.name === 'index.md') continue;
      results.push({
        name: entry.name.replace(/\.md$/, ''),
        file: `agent-views/${relPrefix}/${entry.name}`.replace(/\\/g, '/'),
        abs: path.join(agentDir, entry.name),
      });
    }
  }

  for (const top of ['components', 'forms']) {
    walk(path.join(AGENT_ROOT, top), top);
  }

  return results;
}
