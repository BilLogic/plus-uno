/**
 * Generate component-registry.json from per-component MDX `figmaMeta` exports,
 * plus the hand-authored pattern layer.
 *
 * Source of truth (components): each component's MDX file declares
 *   export const figmaMeta = { fileKey, props?, sets: [...] };
 *
 * Source of truth (patterns): design-system/figma/patterns.json. Patterns are
 * the layout/composition layer — Figma component sets bound to a `size /
 * semantics` token family — and have no code component to hang an MDX off, so
 * they cannot come from figmaMeta. They live in their own registry section
 * rather than masquerading as components.
 *
 * This script scans both and emits a single generated artifact:
 *   design-system/figma/component-registry.json   (DO NOT EDIT BY HAND)
 *
 * Usage:
 *   node scripts/generate-component-registry-from-storybook.js          (write)
 *   node scripts/generate-component-registry-from-storybook.js --check  (CI: fail if stale)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { storybookId } from './lib/storybook-id.mjs';

import { documents } from './lib/corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DS_ROOT = path.join(REPO_ROOT, 'design-system', 'src');
const OUT_REGISTRY = path.join(REPO_ROOT, 'design-system', 'figma', 'component-registry.json');
const PATTERNS_SOURCE = path.join(REPO_ROOT, 'design-system', 'figma', 'patterns.json');

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

  // `_internal` is a source-layout folder, not an import surface — components in
  // it are re-exported from the public barrel. Reporting `@/components/_internal`
  // would hand agents a private path that reads as off-limits; point at the
  // barrel they are actually meant to import from.
  if (parts[0] === 'components' && parts[1] === '_internal') return '@/components';
  if (parts[0] === 'components' && parts.length >= 2) return `@/components/${parts[1]}`;
  // No `forms` branch: the 2026-07 IA reorg folded `src/forms/` into
  // `src/components/forms-and-inputs/`, so form components fall through the
  // `components` branch above and import from `@/components/forms-and-inputs`
  // like every other component. `@/forms/...` resolves to nothing.
  if (parts[0] === 'DataViz' && parts.length >= 3) {
    return `@/DataViz/${parts.slice(1, -1).join('/')}/${parts[parts.length - 1]}`;
  }
  if (parts[0] === 'assets') return `@/assets/${parts[1]}`;
  return `@/${withoutMdx}`;
}

function componentNameFromMdx(mdxAbsPath) {
  const rel = path.relative(DS_ROOT, mdxAbsPath).replace(/\\/g, '/');
  const parts = rel.replace(/\.mdx$/, '').split('/');
  return parts[parts.length - 1];
}

/**
 * Every authored `.mdx` under `dir`, absolute. The walk is the corpus's (#503);
 * what stays local is the one judgement — a ` 2.mdx` name is a Finder copy, not
 * a page.
 */
function walkMdxFiles(dir) {
  return documents('.', { root: dir, ext: ['.mdx'] })
    .filter((rel) => !/ \d+\.mdx$/.test(rel))
    .map((rel) => path.join(dir, rel));
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

/**
 * The stories file an MDX page is attached to (`<Meta of={X} />` and
 * `import * as X from './X.stories'`), and the docs entry's name when `<Meta>`
 * gives one. Null when the page is not attached to a stories file.
 */
function attachedStories(mdxPath, content) {
  const meta = content.match(/<Meta\s([^>]*)>/);
  const of = meta?.[1].match(/of=\{(\w+)\}/);
  if (!of) return null;
  const imported = content.match(new RegExp(`import\\s+\\*\\s+as\\s+${of[1]}\\s+from\\s+['"]([^'"]+)['"]`));
  if (!imported) return null;
  const base = path.resolve(path.dirname(mdxPath), imported[1]);
  const file = [base, `${base}.jsx`, `${base}.js`, `${base}.tsx`].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  if (!file) return null;
  const name = meta[1].match(/\bname=["']([^"']+)["']/);
  return { file, docsName: name ? name[1] : 'Docs' };
}

/**
 * Where a developer opens the component: its live Storybook docs page's id, as
 * Storybook derives it from the stories file's `title` and the docs entry's
 * name, and its source file, repo-relative — the component's own file, or the
 * stories file for a page with no component file of its own. Dev Mode's Code
 * and Storybook links are built from these (agents/uno-bot/src/figma-links/).
 */
function developerLinks(mdxPath, content, name) {
  const stories = attachedStories(mdxPath, content);
  const title = stories && fs.readFileSync(stories.file, 'utf8').match(/\btitle:\s*['"]([^'"]+)['"]/);
  const dir = path.dirname(mdxPath);
  const own = ['.jsx', '.js', '.tsx'].map((ext) => path.join(dir, `${name}${ext}`)).find((f) => fs.existsSync(f));
  const source = own ?? stories?.file;
  return {
    ...(source ? { source: path.relative(REPO_ROOT, source).replace(/\\/g, '/') } : {}),
    ...(title ? { storybookId: storybookId(title[1], stories.docsName) } : {}),
  };
}

/**
 * `figmaMeta.deliberate`, checked: an object of code prop → a non-empty
 * one-line reason, each prop one the component's `props` declares when it
 * declares any. A malformed record fails the generator rather than silently
 * muting the check.
 */
function deliberateOf(deliberate, name, props) {
  if (!deliberate || typeof deliberate !== 'object' || Array.isArray(deliberate)) {
    throw new Error(`${name}: figmaMeta.deliberate must be an object of code prop → reason`);
  }
  for (const [prop, reason] of Object.entries(deliberate)) {
    if (typeof reason !== 'string' || !reason.trim() || reason.includes('\n')) {
      throw new Error(`${name}: figmaMeta.deliberate.${prop} needs a one-line reason`);
    }
    if (props && !Object.hasOwn(props, prop)) {
      throw new Error(`${name}: figmaMeta.deliberate.${prop} names no prop in figmaMeta.props`);
    }
  }
  return deliberate;
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
    ...developerLinks(mdxPath, content, name),
  };
  if (figmaMeta.props) code.props = figmaMeta.props;

  const figma = {
    fileKey: figmaMeta.fileKey || CANONICAL_FILE.fileKey,
    sets: figmaMeta.sets || [],
  };
  // The Figma link shown in each docs page's Resources card (ResourcesBlock figmaLink prop).
  if (figmaLinkMatch) figma.docsPageUrl = figmaLinkMatch[1];
  // Differences from the library a person settled as intended: code prop →
  // one-line reason. The weekly DS precedence check skips them.
  if (figmaMeta.deliberate !== undefined) figma.deliberate = deliberateOf(figmaMeta.deliberate, name, figmaMeta.props);

  return {
    name,
    entry: {
      code,
      figma,
    },
  };
}

/** Hand-authored pattern layer, or an empty section when the source is absent. */
function loadPatterns() {
  if (!fs.existsSync(PATTERNS_SOURCE)) return {};
  const parsed = JSON.parse(fs.readFileSync(PATTERNS_SOURCE, 'utf8'));
  return parsed.patterns || {};
}

function buildRegistry(entries, patterns) {
  const components = {};
  for (const { name, entry } of entries) components[name] = entry;
  return {
    version: '1.1.0',
    generated: true,
    generatedBy: 'scripts/generate-component-registry-from-storybook.js',
    note: 'DO NOT EDIT BY HAND. Components come from each component MDX `export const figmaMeta`; patterns come from design-system/figma/patterns.json. Run `npm run generate:component-registry` to regenerate.',
    figmaFile: CANONICAL_FILE,
    components,
    // Layout/composition layer. Separate from `components` on purpose: these
    // have no code counterpart, so listing them as components would imply an
    // import that does not exist.
    patterns,
  };
}

function main() {
  const check = process.argv.includes('--check');
  const mdxFiles = walkMdxFiles(DS_ROOT);
  const entries = mdxFiles
    .map(extractFromMdx)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  const patterns = loadPatterns();
  const registry = buildRegistry(entries, patterns);
  const serialized = `${JSON.stringify(registry, null, 2)}\n`;
  const patternCount = Object.keys(patterns).length;
  const blocked = Object.entries(patterns).filter(([, p]) => p.status === 'blocked-slots-unconverted');

  if (check) {
    const current = fs.existsSync(OUT_REGISTRY) ? fs.readFileSync(OUT_REGISTRY, 'utf8') : '';
    if (current !== serialized) {
      console.error('✗ component-registry.json is stale. Run `npm run generate:component-registry`.');
      process.exit(1);
    }
    console.log(`✓ component-registry.json up to date (${entries.length} components, ${patternCount} patterns).`);
    return;
  }

  fs.mkdirSync(path.dirname(OUT_REGISTRY), { recursive: true });
  fs.writeFileSync(OUT_REGISTRY, serialized);
  console.log(`Wrote ${entries.length} components + ${patternCount} patterns → ${path.relative(REPO_ROOT, OUT_REGISTRY)}`);
  for (const [name, p] of blocked) {
    console.warn(`⚠ ${name}: ${p.blockedReason}`);
  }
}

main();
