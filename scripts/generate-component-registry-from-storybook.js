/**
 * Generate component-registry draft from Storybook MDX ResourcesBlock figmaLink values.
 *
 * Usage:
 *   node scripts/generate-component-registry-from-storybook.js
 *   node scripts/generate-component-registry-from-storybook.js --write
 *
 * Outputs:
 *   design-system/figma/component-registry.generated.json  (always)
 *   design-system/figma/component-registry.json            (with --write, merges pilot entries)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DS_ROOT = path.join(REPO_ROOT, 'design-system', 'src');
const OUT_GENERATED = path.join(REPO_ROOT, 'design-system', 'figma', 'component-registry.generated.json');
const OUT_REGISTRY = path.join(REPO_ROOT, 'design-system', 'figma', 'component-registry.json');

const FIGMA_URL_RE =
  /figmaLink\s*=\s*["'](https:\/\/www\.figma\.com\/design\/([^/"']+)\/[^"']*?\?node-id=([^"'&]+))["']/g;
const GITHUB_URL_RE = /githubLink\s*=\s*["']([^"']+)["']/;

function parseFigmaNodeId(urlNodeId) {
  return urlNodeId.replace(/-/g, ':');
}

function deriveImportPath(mdxAbsPath) {
  const rel = path.relative(DS_ROOT, mdxAbsPath).replace(/\\/g, '/');
  const withoutMdx = rel.replace(/\.mdx$/, '');
  const parts = withoutMdx.split('/');

  if (parts[0] === 'components' && parts.length >= 2) {
    return `@/components/${parts[1]}`;
  }
  if (parts[0] === 'forms' && parts.length >= 1) {
    const name = parts.length >= 2 && parts[1] === 'InputGroup' ? 'InputGroup' : parts[parts.length - 1];
    if (parts[1] === 'DatePicker') return '@/forms/DatePicker';
    if (parts[1] === 'InputGroup') return '@/forms/InputGroup';
    return `@/forms/${name}`;
  }
  if (parts[0] === 'DataViz' && parts.length >= 3) {
    return `@/DataViz/${parts.slice(1, -1).join('/')}/${parts[parts.length - 1]}`;
  }
  if (parts[0] === 'assets') {
    return `@/assets/${parts[1]}`;
  }
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
    else if (entry.name.endsWith('.mdx')) acc.push(full);
  }
  return acc;
}

function extractFromMdx(mdxPath) {
  const content = fs.readFileSync(mdxPath, 'utf8');
  const figmaMatches = [...content.matchAll(FIGMA_URL_RE)];
  if (figmaMatches.length === 0) return null;

  const figmaLink = figmaMatches[0][1];
  const fileKey = figmaMatches[0][2];
  const nodeIdUrl = figmaMatches[0][3];
  const githubMatch = content.match(GITHUB_URL_RE);
  const name = componentNameFromMdx(mdxPath);

  return {
    name,
    code: {
      import: deriveImportPath(mdxPath),
      export: 'default',
      mdxPath: path.relative(REPO_ROOT, mdxPath).replace(/\\/g, '/'),
      githubLink: githubMatch ? githubMatch[1] : null,
    },
    figma: {
      fileKey,
      sets: [
        {
          id: 'storybook-resources',
          name: 'Storybook Resources (MDX)',
          componentSetNodeId: parseFigmaNodeId(nodeIdUrl),
          url: figmaLink,
          source: 'storybook-mdx',
          status: 'needs-review',
          notes:
            'Verify this node is a component set (not a docs frame). Add variantProps after Dev Mode check.',
        },
      ],
    },
  };
}

function buildRegistry(entries) {
  const byFileKey = {};
  const components = {};

  for (const entry of entries) {
    components[entry.name] = {
      code: entry.code,
      figma: entry.figma,
    };
    byFileKey[entry.figma.fileKey] = (byFileKey[entry.figma.fileKey] || 0) + 1;
  }

  const primaryFileKey = Object.entries(byFileKey).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    generatedFrom: 'storybook-mdx-figmaLink',
    figmaFile: {
      fileKey: primaryFileKey || 'zAecJNRdvJzAUOcjV32tRX',
      name: 'Design System - BS4 Foundation Component Library',
      url: primaryFileKey
        ? `https://www.figma.com/design/${primaryFileKey}/`
        : 'https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4-Foundation--Component-LIbrary-',
    },
    stats: {
      componentCount: entries.length,
      fileKeys: byFileKey,
    },
    components,
  };
}

function mergeWithExisting(generated, existingPath) {
  if (!fs.existsSync(existingPath)) return generated;

  const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  const merged = { ...generated, components: { ...generated.components } };

  for (const [name, existingEntry] of Object.entries(existing.components || {})) {
    if (!merged.components[name]) {
      merged.components[name] = existingEntry;
      continue;
    }

    const genSets = merged.components[name].figma?.sets || [];
    const existSets = existingEntry.figma?.sets || [];
    const existPending = existingEntry.figma?.pendingSets || [];

    const nonStorybookSets = existSets.filter((s) => s.source !== 'storybook-mdx' && s.id !== 'storybook-resources');
    const storybookSet = genSets.find((s) => s.id === 'storybook-resources');

    merged.components[name] = {
      ...merged.components[name],
      code: {
        ...merged.components[name].code,
        ...(existingEntry.code?.props ? { props: existingEntry.code.props } : {}),
      },
      figma: {
        fileKey: merged.components[name].figma.fileKey || existingEntry.figma?.fileKey,
        sets: [
          ...(storybookSet ? [storybookSet] : []),
          ...nonStorybookSets,
          ...existSets.filter((s) => s.source !== 'storybook-mdx' && s.id === 'storybook-resources'),
        ],
        ...(existPending.length ? { pendingSets: existPending } : {}),
      },
    };

    if (existingEntry.figma?.sets?.some((s) => s.status === 'pilot')) {
      const pilotSets = existingEntry.figma.sets.filter((s) => s.status === 'pilot');
      const currentIds = new Set(merged.components[name].figma.sets.map((s) => s.id));
      for (const pilot of pilotSets) {
        if (!currentIds.has(pilot.id)) {
          merged.components[name].figma.sets.push(pilot);
        }
      }
    }
  }

  merged.version = existing.version || merged.version;
  merged.figmaFile = existing.figmaFile || merged.figmaFile;
  return merged;
}

function main() {
  const writeMain = process.argv.includes('--write');
  const mdxFiles = walkMdxFiles(DS_ROOT);
  const entries = mdxFiles.map(extractFromMdx).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));

  let registry = buildRegistry(entries);
  fs.mkdirSync(path.dirname(OUT_GENERATED), { recursive: true });
  fs.writeFileSync(OUT_GENERATED, `${JSON.stringify(registry, null, 2)}\n`);

  console.log(`Wrote ${entries.length} components → ${path.relative(REPO_ROOT, OUT_GENERATED)}`);

  if (writeMain) {
    registry = mergeWithExisting(registry, OUT_REGISTRY);
    delete registry.generatedAt;
    delete registry.generatedFrom;
    delete registry.stats;
    fs.writeFileSync(OUT_REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);
    console.log(`Merged → ${path.relative(REPO_ROOT, OUT_REGISTRY)}`);
  } else {
    console.log('Tip: run with --write to merge into component-registry.json (keeps Button pilot).');
  }
}

main();
