/**
 * Generate component-registry.json from per-component MDX `figmaMeta` exports.
 *
 * Source of truth: each component's MDX file declares
 *   export const figmaMeta = { fileKey, props?, sets: [...] };
 *
 * This script scans those exports and emits a single generated artifact:
 *   design-system/figma/component-registry.json   (DO NOT EDIT BY HAND)
 *
 * Usage:
 *   node scripts/generate-component-registry-from-storybook.js          (write)
 *   node scripts/generate-component-registry-from-storybook.js --check  (CI: fail if stale)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DS_ROOT = path.join(REPO_ROOT, 'design-system', 'src');
const OUT_REGISTRY = path.join(REPO_ROOT, 'design-system', 'figma', 'component-registry.json');

const CANONICAL_FILE = {
  fileKey: 'zAecJNRdvJzAUOcjV32tRX',
  name: 'Design System - BS4 Foundation Component Library',
  url: 'https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4-Foundation--Component-LIbrary-',
};

const GITHUB_URL_RE = /githubLink\s*=\s*["']([^"']+)["']/;
const FIGMA_LINK_RE = /figmaLink\s*=\s*["']([^"']+)["']/;

function deriveImportPath(mdxAbsPath) {
  const rel = path.relative(DS_ROOT, mdxAbsPath).replace(/\\/g, '/');
  const withoutMdx = rel.replace(/\.mdx$/, '');
  const parts = withoutMdx.split('/');

  if (parts[0] === 'components' && parts.length >= 2) return `@/components/${parts[1]}`;
  if (parts[0] === 'forms') {
    if (parts[1] === 'DatePicker') return '@/forms/DatePicker';
    if (parts[1] === 'InputGroup') return '@/forms/InputGroup';
    return `@/forms/${parts[parts.length - 1]}`;
  }
  if (parts[0] === 'DataViz' && parts.length >= 3) {
    return `@/DataViz/${parts.slice(1, -1).join('/')}/${parts[parts.length - 1]}`;
  }
  if (parts[0] === 'assets') return `@/assets/${parts[1]}`;
  return `@/${withoutMdx}`;
}

function componentNameFromMdx(mdxAbsPath) {
  const rel = path.relative(DS_ROOT, mdxAbsPath).replace(/\\/g, '/');
  const parts = rel.replace(/\.mdx$/, '').split('/');
  if (parts[0] === 'forms' && parts[1] === 'DatePicker') return 'DatePicker';
  if (parts[0] === 'forms' && parts[1] === 'InputGroup') return 'InputGroup';
  return parts[parts.length - 1];
}

function walkMdxFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMdxFiles(full, acc);
    else if (entry.name.endsWith('.mdx') && !/ \d+\.mdx$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/** Extract the `export const figmaMeta = { ... }` object literal and JSON.parse it. */
function extractFigmaMeta(content) {
  const m = content.search(/export\s+const\s+figmaMeta\s*=/);
  if (m === -1) return null;
  const braceStart = content.indexOf('{', m);
  if (braceStart === -1) return null;
  let depth = 0;
  let inStr = false;
  let end = -1;
  for (let i = braceStart; i < content.length; i++) {
    const ch = content[i];
    if (inStr) {
      if (ch === '\\') i++;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) return null;
  const literal = content.slice(braceStart, end + 1);
  try {
    return JSON.parse(literal);
  } catch (err) {
    throw new Error(`Failed to parse figmaMeta object: ${err.message}`);
  }
}

function extractFromMdx(mdxPath) {
  const content = fs.readFileSync(mdxPath, 'utf8');
  const figmaMeta = extractFigmaMeta(content);
  if (!figmaMeta) return null;

  const githubMatch = content.match(GITHUB_URL_RE);
  const figmaLinkMatch = content.match(FIGMA_LINK_RE);
  const name = componentNameFromMdx(mdxPath);

  const code = {
    import: deriveImportPath(mdxPath),
    export: 'default',
    mdxPath: path.relative(REPO_ROOT, mdxPath).replace(/\\/g, '/'),
    githubLink: githubMatch ? githubMatch[1] : null,
  };
  if (figmaMeta.props) code.props = figmaMeta.props;

  const figma = {
    fileKey: figmaMeta.fileKey || CANONICAL_FILE.fileKey,
    sets: figmaMeta.sets || [],
  };
  // The Figma link shown in each docs page's Resources card (ResourcesBlock figmaLink prop).
  if (figmaLinkMatch) figma.docsPageUrl = figmaLinkMatch[1];

  return {
    name,
    entry: {
      code,
      figma,
    },
  };
}

function buildRegistry(entries) {
  const components = {};
  for (const { name, entry } of entries) components[name] = entry;
  return {
    version: '1.0.0',
    generated: true,
    generatedBy: 'scripts/generate-component-registry-from-storybook.js',
    note: 'DO NOT EDIT BY HAND. Source of truth is each component MDX `export const figmaMeta`. Run `npm run generate:component-registry` to regenerate.',
    figmaFile: CANONICAL_FILE,
    components,
  };
}

function main() {
  const check = process.argv.includes('--check');
  const mdxFiles = walkMdxFiles(DS_ROOT);
  const entries = mdxFiles
    .map(extractFromMdx)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  const registry = buildRegistry(entries);
  const serialized = `${JSON.stringify(registry, null, 2)}\n`;

  if (check) {
    const current = fs.existsSync(OUT_REGISTRY) ? fs.readFileSync(OUT_REGISTRY, 'utf8') : '';
    if (current !== serialized) {
      console.error('✗ component-registry.json is stale. Run `npm run generate:component-registry`.');
      process.exit(1);
    }
    console.log(`✓ component-registry.json up to date (${entries.length} components).`);
    return;
  }

  fs.mkdirSync(path.dirname(OUT_REGISTRY), { recursive: true });
  fs.writeFileSync(OUT_REGISTRY, serialized);
  console.log(`Wrote ${entries.length} components → ${path.relative(REPO_ROOT, OUT_REGISTRY)}`);
}

main();
