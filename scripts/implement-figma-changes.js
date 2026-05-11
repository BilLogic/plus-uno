#!/usr/bin/env node

/**
 * Implement Figma design changes using Claude API.
 *
 * Reads component names from PR_TITLE env var or --components arg,
 * fetches Figma design context (metadata + images), reads current
 * component code, and calls Claude to generate updated code.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY  — Anthropic API key
 *   FIGMA_ACCESS_TOKEN — Figma personal access token
 *   FIGMA_FILE_KEY     — Figma file key
 *
 * Optional env vars:
 *   PR_TITLE           — PR title to parse component names from
 *   PR_BODY_FILE       — Path to file containing PR body text
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import https from 'https';
import { fetchNotionPRD, findPRDByComponent, updatePRDStatus } from './create-notion-prd.js';

// Load .env locally; in CI env vars are injected directly
try { const dotenv = await import('dotenv'); dotenv.config(); } catch { /* CI */ }

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const PR_TITLE = process.env.PR_TITLE || '';
const PR_BODY_FILE = process.env.PR_BODY_FILE;
const NOTION_PRD_ID = process.env.NOTION_PRD_ID || '';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const COMPONENTS_DIR = resolve('design-system/src/components');
const TOKENS_DIR = resolve('design-system/src/tokens');

// ─── Helpers ───────────────────────────────────────────────

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location, headers).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ status: res.statusCode, buffer, data: buffer.toString() });
      });
    });
    req.on('error', reject);
  });
}

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function figmaGet(endpoint) {
  const url = `https://api.figma.com/v1${endpoint}`;
  const res = await httpsGet(url, { 'X-Figma-Token': FIGMA_ACCESS_TOKEN });
  if (res.status >= 400) throw new Error(`Figma API ${res.status}: ${res.data}`);
  return JSON.parse(res.data);
}

async function callClaude(messages, system) {
  const body = JSON.stringify({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    system,
    messages
  });

  const res = await httpsPost('https://api.anthropic.com/v1/messages', {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  }, body);

  const parsed = JSON.parse(res.data);
  if (!parsed.content || parsed.content.length === 0) {
    throw new Error('Empty response from Claude');
  }
  return parsed.content[0].text;
}

// ─── Parse component names ─────────────────────────────────

function parseComponentNames() {
  const argIdx = process.argv.indexOf('--components');
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    return process.argv[argIdx + 1].split(',').map(s => s.trim());
  }

  // From PR title: "feat: Figma DS update — Badge, Button"
  // Also matches: "Figma update - Badge", "DS update: Badge", etc.
  const patterns = [
    /Figma\s+DS\s+update\s*[—–:-]\s*(.+)/i,
    /Figma\s+update\s*[—–:-]\s*(.+)/i,
    /DS\s+update\s*[—–:-]\s*(.+)/i,
    /update\s*[—–:-]\s*(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = PR_TITLE.match(pattern);
    if (match) {
      return match[1].split(',').map(s => s.trim());
    }
  }

  console.error('❌ No component names found. Use --components "Badge,Button" or set PR_TITLE.');
  console.error(`   PR_TITLE: "${PR_TITLE}"`);
  process.exit(1);
}

function getPRBody() {
  if (PR_BODY_FILE && existsSync(PR_BODY_FILE)) {
    return readFileSync(PR_BODY_FILE, 'utf8');
  }
  return process.env.PR_BODY || '';
}

// ─── Read component files ──────────────────────────────────

function getReferenceComponent() {
  // Read Badge component as a reference for new component scaffolding
  const badgeDir = join(COMPONENTS_DIR, 'Badge');
  if (!existsSync(badgeDir)) return 'No reference component available.';
  const files = ['Badge.jsx', 'Badge.scss', 'Badge.stories.jsx', 'index.js'];
  return files.map(f => {
    try {
      const content = readFileSync(join(badgeDir, f), 'utf8');
      return `### ${f}\n\`\`\`\n${content}\n\`\`\``;
    } catch { return ''; }
  }).filter(Boolean).join('\n\n');
}

function resolveComponentDir(componentName) {
  // Exact match first
  const exact = join(COMPONENTS_DIR, componentName);
  if (existsSync(exact)) return { dir: exact, name: componentName };

  // Case-insensitive match (e.g., "badge" → "Badge")
  try {
    const dirs = readdirSync(COMPONENTS_DIR);
    const match = dirs.find(d => d.toLowerCase() === componentName.toLowerCase());
    if (match) return { dir: join(COMPONENTS_DIR, match), name: match };

    // Partial/parent match — "Dismissible Badges" should match "Badge"
    // Check if any existing directory name is contained in the component name,
    // or the component name is contained in a directory name
    const normalised = componentName.toLowerCase().replace(/\s+/g, '');
    const parentMatch = dirs
      .filter(d => {
        const dl = d.toLowerCase();
        // "dismissiblebadges" contains "badge" → match Badge/
        // Also handle plurals: "badges" contains "badge"
        return normalised.includes(dl) || normalised.includes(dl.replace(/s$/, ''))
          || dl.includes(normalised) || dl.includes(normalised.replace(/s$/, ''));
      })
      .sort((a, b) => b.length - a.length)[0]; // prefer longest match
    if (parentMatch) {
      console.log(`   📎 Matched "${componentName}" → existing directory "${parentMatch}"`);
      return { dir: join(COMPONENTS_DIR, parentMatch), name: parentMatch };
    }
  } catch { /* */ }

  return null;
}

function readComponentFiles(componentName) {
  const resolved = resolveComponentDir(componentName);
  if (!resolved) {
    console.warn(`⚠️  Component directory not found for: ${componentName}`);
    return null;
  }
  const dir = resolved.dir;

  const files = readdirSync(dir).filter(f =>
    f.endsWith('.jsx') || f.endsWith('.scss') || f.endsWith('.mdx') || f.endsWith('.stories.jsx')
  );

  const result = {};
  for (const file of files) {
    result[file] = readFileSync(join(dir, file), 'utf8');
  }
  return result;
}

// ─── Fetch Figma data ──────────────────────────────────────

async function getFigmaComponents(componentNames) {
  console.log('📡 Fetching Figma components...');
  const fileData = await figmaGet(`/files/${FIGMA_FILE_KEY}/components`);
  const components = fileData.meta?.components || [];

  const matched = [];
  for (const name of componentNames) {
    const nameLower = name.toLowerCase();
    const found = components.filter(c => {
      const cName = (c.name || '').toLowerCase();
      const cFrame = (c.containing_frame?.name || '').toLowerCase();
      return (
        cName === nameLower ||
        cName.startsWith(nameLower + '/') ||
        cFrame === nameLower ||
        // Partial match: "Badge" matches "Static Badges" or "Dismissible Badges"
        cFrame.includes(nameLower) ||
        cName.includes(nameLower)
      );
    });
    matched.push({ name, figmaComponents: found });
    if (found.length > 0) {
      console.log(`   ✅ ${name}: found ${found.length} variants in Figma`);
    } else {
      console.warn(`   ⚠️  ${name}: no Figma match found`);
    }
  }
  return matched;
}

async function getFigmaImages(nodeIds) {
  if (nodeIds.length === 0) return {};
  // Figma API limits to ~100 IDs per request
  const ids = nodeIds.slice(0, 20).join(',');
  const data = await figmaGet(`/images/${FIGMA_FILE_KEY}?ids=${ids}&format=png&scale=2`);
  return data.images || {};
}

async function getFigmaNodeDetails(nodeIds) {
  if (nodeIds.length === 0) return {};
  const ids = nodeIds.slice(0, 10).join(',');
  try {
    const data = await figmaGet(`/files/${FIGMA_FILE_KEY}/nodes?ids=${ids}&geometry=paths`);
    return data.nodes || {};
  } catch (e) {
    console.warn(`   ⚠️  Could not fetch node details: ${e.message}`);
    return {};
  }
}

function extractDesignProperties(node) {
  if (!node?.document) return null;
  const doc = node.document;
  const round = (v) => v != null ? Math.round(v * 255) : 0;
  const toRgba = (c) => c ? `rgba(${round(c.r)}, ${round(c.g)}, ${round(c.b)}, ${c.a ?? 1})` : null;

  const props = {
    type: doc.type, name: doc.name,
    size: doc.absoluteBoundingBox ? { w: doc.absoluteBoundingBox.width, h: doc.absoluteBoundingBox.height } : null,
    fills: (doc.fills || []).map(f => ({ type: f.type, color: toRgba(f.color), opacity: f.opacity })),
    strokes: (doc.strokes || []).map(s => ({ color: toRgba(s.color) })),
    strokeWeight: doc.strokeWeight,
    cornerRadius: doc.cornerRadius,
    effects: (doc.effects || []).map(e => ({ type: e.type, radius: e.radius, offset: e.offset, color: toRgba(e.color) })),
    padding: doc.paddingLeft != null ? { top: doc.paddingTop, right: doc.paddingRight, bottom: doc.paddingBottom, left: doc.paddingLeft } : null,
    itemSpacing: doc.itemSpacing,
    layoutMode: doc.layoutMode,
    fontFamily: doc.style?.fontFamily,
    fontSize: doc.style?.fontSize,
    fontWeight: doc.style?.fontWeight,
    lineHeight: doc.style?.lineHeightPx,
  };

  // First-level children for layout context
  if (doc.children?.length > 0) {
    props.children = doc.children.slice(0, 15).map(child => ({
      type: child.type, name: child.name,
      fills: (child.fills || []).map(f => ({ color: toRgba(f.color) })),
      cornerRadius: child.cornerRadius,
      padding: child.paddingLeft != null ? { top: child.paddingTop, right: child.paddingRight, bottom: child.paddingBottom, left: child.paddingLeft } : null,
      itemSpacing: child.itemSpacing,
      fontSize: child.style?.fontSize, fontWeight: child.style?.fontWeight,
    }));
  }
  return props;
}

function readTokenFiles() {
  const files = ['_colors.scss', '_spacing_semantics.scss', '_primitives.scss', '_elevation.scss', '_fonts.scss'];
  const tokens = {};
  for (const file of files) {
    const fp = join(TOKENS_DIR, file);
    if (existsSync(fp)) tokens[file] = readFileSync(fp, 'utf8');
  }
  return tokens;
}

async function downloadImageAsBase64(url) {
  const res = await httpsGet(url);
  return res.buffer.toString('base64');
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY is required');
    process.exit(1);
  }
  if (!FIGMA_ACCESS_TOKEN || !FIGMA_FILE_KEY) {
    console.error('❌ FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY are required');
    process.exit(1);
  }

  const componentNames = parseComponentNames();
  const prBody = getPRBody();
  console.log(`🎨 Implementing changes for: ${componentNames.join(', ')}\n`);

  // Fetch Notion PRD context if available
  let prdContext = '';
  let prdId = NOTION_PRD_ID;
  try {
    let prd = null;
    if (prdId) {
      console.log('📋 Fetching Notion PRD by ID...');
      prd = await fetchNotionPRD(prdId);
    } else {
      // Auto-search for the latest PRD matching the component name
      console.log('📋 Searching Notion for PRD matching components...');
      for (const name of componentNames) {
        prd = await findPRDByComponent(name);
        if (prd) {
          prdId = prd.pageId;
          break;
        }
      }
    }
    if (prd) {
      const parts = [];
      if (prd.implementationNotes) {
        parts.push(`### Implementation Notes (from designer)\n${prd.implementationNotes}`);
      }
      if (prd.acceptanceCriteria?.length) {
        parts.push(`### Acceptance Criteria\n${prd.acceptanceCriteria.map(c => `- [${c.checked ? 'x' : ' '}] ${c.text}`).join('\n')}`);
      }
      if (prd.publishedBy) {
        parts.push(`Published by: ${prd.publishedBy}`);
      }
      prdContext = parts.join('\n\n');
      console.log(`   ✅ PRD loaded: ${prd.title}`);

      // Update PRD status to "In Progress"
      if (prdId) await updatePRDStatus(prdId, 'In Progress');
    } else {
      console.log('   ℹ️  No Notion PRD found — proceeding without designer notes');
    }
  } catch (e) {
    console.warn(`   ⚠️  Could not fetch Notion PRD: ${e.message}`);
  }

  // Fetch Figma data
  const figmaData = await getFigmaComponents(componentNames);

  // Collect node IDs for images (take first few per component to limit API calls)
  const nodeIdsPerComponent = {};
  for (const { name, figmaComponents } of figmaData) {
    nodeIdsPerComponent[name] = figmaComponents.slice(0, 5).map(c => c.node_id).filter(Boolean);
  }
  const allNodeIds = Object.values(nodeIdsPerComponent).flat();

  // Fetch images
  let imageUrls = {};
  if (allNodeIds.length > 0) {
    console.log('\n📸 Fetching Figma component images...');
    imageUrls = await getFigmaImages(allNodeIds);
  }

  // Process each component
  for (const { name, figmaComponents } of figmaData) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📦 Processing: ${name}`);

    const resolved = resolveComponentDir(name);
    let resolvedName;
    let codeFiles;
    let isNewComponent = false;

    if (!resolved) {
      // New component — Claude will scaffold it from scratch
      // Normalize name to PascalCase directory (e.g., "Dismissible Badges" → "DismissibleBadges")
      resolvedName = name.replace(/\s+/g, '');
      console.log(`   🆕 New component — Claude will scaffold ${resolvedName}/`);
      isNewComponent = true;
      codeFiles = {};
    } else {
      resolvedName = resolved.name;
      codeFiles = readComponentFiles(name) || {};
      if (!Object.keys(codeFiles).length) {
        console.log(`   ⏭️  Skipping — no readable files found`);
        continue;
      }
      console.log(`   📄 Found ${Object.keys(codeFiles).length} files: ${Object.keys(codeFiles).join(', ')}`);
    }

    // Download images for this component
    const images = [];
    const nodeIds = nodeIdsPerComponent[name] || [];
    for (const nodeId of nodeIds) {
      const url = imageUrls[nodeId];
      if (url) {
        try {
          const base64 = await downloadImageAsBase64(url);
          const matchedComponent = figmaComponents.find(c => c.node_id === nodeId);
          images.push({
            name: matchedComponent?.name || nodeId,
            base64,
            mediaType: 'image/png'
          });
        } catch (e) {
          console.warn(`   ⚠️  Could not download image for node ${nodeId}`);
        }
      }
    }
    console.log(`   🖼️  Downloaded ${images.length} component images`);

    // Fetch Figma node design properties
    console.log(`   📐 Fetching Figma node design properties...`);
    const nodeDetails = await getFigmaNodeDetails(nodeIds);
    const designProps = [];
    for (const nodeId of nodeIds) {
      const nodeData = nodeDetails[nodeId];
      if (nodeData) {
        const props = extractDesignProperties(nodeData);
        if (props) designProps.push(props);
      }
    }
    console.log(`   📐 Extracted design properties for ${designProps.length} nodes`);

    // Read design token files
    const tokenFiles = readTokenFiles();

    // Build prompt
    const codeContext = Object.entries(codeFiles)
      .map(([file, content]) => `### ${file}\n\`\`\`\n${content}\n\`\`\``)
      .join('\n\n');

    const figmaContext = figmaComponents.length > 0
      ? figmaComponents.map(c =>
          `- **${c.name}** (parent: ${c.containing_frame?.name || 'root'}): ${c.description || 'No description'}`
        ).join('\n')
      : 'No Figma component metadata available.';

    const designPropsContext = designProps.length > 0
      ? JSON.stringify(designProps, null, 2)
      : 'No detailed design properties available.';

    const tokenContext = Object.entries(tokenFiles)
      .map(([file, content]) => `### ${file}\n\`\`\`scss\n${content}\n\`\`\``)
      .join('\n\n');

    const systemPrompt = [
      'You are a senior React developer working on the PLUS design system.',
      isNewComponent
        ? 'Your job is to CREATE a new React component from a Figma design.'
        : 'Your job is to update React components to match their latest Figma designs.',
      '',
      '## PLUS Design System Conventions',
      '- Components use React-Bootstrap as base (e.g., RBBadge from react-bootstrap/Badge)',
      '- Styling uses SCSS with CSS custom properties (design tokens), NOT CSS modules',
      '- SCSS files use @use "sass:map" and SCSS mixins for theme variants',
      '- Component class prefix: "plus-" (e.g., .plus-badge, .plus-button)',
      '- BEM-like naming: .plus-component-element, .plus-component--modifier',
      '- Typography uses utility classes: h1-h6, body1-txt, body2-txt, body3-txt',
      '- Icons use Font Awesome Free only: fa-solid, fa-regular, fa-brands',
      '',
      '## Token Mapping Rules (CRITICAL)',
      '- NEVER hardcode colors — use var(--color-*) tokens from _colors.scss',
      '- NEVER hardcode spacing — use var(--size-element-*), var(--size-card-*) tokens',
      '- NEVER hardcode border-radius — use var(--size-element-radius-*) tokens',
      '- NEVER hardcode elevation — use var(--elevation-light-*) tokens',
      '- NEVER hardcode font properties — use var(--font-*) tokens',
      '- Map Figma fill colors to the CLOSEST matching token by comparing rgba values',
      '- Map Figma spacing/padding values to the CLOSEST semantic spacing token',
      '- Map Figma corner radius to the CLOSEST radius token',
      '- The design token files are provided below — use ONLY tokens that exist in them',
      '',
      isNewComponent ? [
        '',
        '## New Component Scaffolding Rules',
        '- Create these files: ComponentName.jsx, ComponentName.scss, ComponentName.stories.jsx, index.js',
        '- The .jsx file should export a React component using React-Bootstrap as base where appropriate',
        '- The .scss file should define all styles using design tokens (var(--color-*), var(--size-*))',
        '- The .stories.jsx MUST have `title: "Components/ComponentName"` so it appears in Storybook sidebar under Components',
        '- The .stories.jsx should include all Figma variants as stories with proper argTypes and controls',
        '- The index.js file should re-export the component as default and named export',
        '- Follow the same patterns as the reference Badge component provided below',
      ].join('\n') : '',
      '',
      'Rules:',
      '- Preserve existing component API (props, exports) unless the design clearly requires changes',
      '- Follow existing code patterns and conventions exactly',
      '- Update Storybook stories if the component API changes',
      '- Do not add or remove comments unless necessary',
      '- Return ONLY the updated file contents in the exact format specified',
      '- If a file does not need changes, do not include it',
      '',
      'For each file you update, respond with:',
      '---FILE: filename.ext---',
      '(complete file contents)',
      '---END FILE---',
      '',
      'Only include files that actually need changes.',
    ].join('\n');

    const userContent = [];

    // Add images first (Claude vision)
    for (const img of images) {
      userContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mediaType,
          data: img.base64
        }
      });
      userContent.push({
        type: 'text',
        text: `Figma component image: ${img.name}`
      });
    }

    // Add text context
    userContent.push({
      type: 'text',
      text: [
        isNewComponent
          ? `## New Component: ${name}\n\nThis is a NEW component — no existing code. Create all files from scratch based on the Figma design below.\n`
          : `## Current ${name} Component Code\n`,
        isNewComponent ? '' : codeContext,
        isNewComponent ? '\n## Reference Component (Badge) — follow this pattern\n' + getReferenceComponent() : '',
        '\n## Figma Component Metadata\n',
        figmaContext,
        '\n## Figma Node Design Properties (colors, spacing, radius, layout)\n',
        '```json',
        designPropsContext,
        '```',
        '\n## Available Design Tokens\n',
        tokenContext,
        '\n## Change Context\n',
        prBody || 'No additional context provided.',
        prdContext ? '\n## Notion PRD Context (Designer Review Notes)\n' + prdContext : '',
        `\n## Task\n`,
        isNewComponent
          ? `Create a new ${name} component from scratch based on the Figma design above.`
          : `Update the ${name} component files to match the latest Figma design.`,
        'Use the Figma node properties above to map exact colors, spacing, and radius to the closest design tokens.',
        isNewComponent
          ? 'Study the reference Badge component patterns and create all files (jsx, scss, stories, index) following the same conventions.'
          : 'Compare the Figma screenshots with the current code and update any differences.',
        'Follow the existing code patterns exactly.',
        isNewComponent ? '' : 'Only modify files that need changes.',
        '',
        'Respond with the updated files using the format:',
        '---FILE: filename.ext---',
        '(complete file contents)',
        '---END FILE---',
      ].join('\n')
    });

    console.log(`   🤖 Calling Claude (${CLAUDE_MODEL})...`);
    const response = await callClaude(
      [{ role: 'user', content: userContent }],
      systemPrompt
    );

    // Parse response and write files
    const filePattern = /---FILE:\s*(.+?)---\n([\s\S]*?)---END FILE---/g;
    let fileMatch;
    let filesWritten = 0;

    while ((fileMatch = filePattern.exec(response)) !== null) {
      const [, filename, content] = fileMatch;
      const trimmedName = filename.trim();
      const componentDir = join(COMPONENTS_DIR, resolvedName);
      const filePath = join(componentDir, trimmedName);

      // Create directory if it doesn't exist (new component)
      if (!existsSync(componentDir)) {
        mkdirSync(componentDir, { recursive: true });
        console.log(`   📁 Created directory: ${resolvedName}/`);
      }

      writeFileSync(filePath, content.trim() + '\n');
      console.log(`   ✅ Updated: ${trimmedName}`);
      filesWritten++;
    }

    if (filesWritten === 0) {
      console.log(`   ℹ️  No file changes generated for ${name}`);
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log('✅ Implementation complete!');
}

main().catch(err => {
  console.error('❌ Unhandled error:', err.message);
  process.exit(1);
});
