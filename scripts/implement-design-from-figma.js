#!/usr/bin/env node

/**
 * Scaffold a NEW playground prototype from a Figma frame using the Claude API.
 *
 * Sibling of implement-figma-changes.js (which UPDATES an existing DS-library
 * component). This script CREATES a new prototype under playground/{slug}/,
 * mirroring the playground/home-redesign reference structure.
 *
 * Triggered by .github/workflows/figma-implement-design.yml on the
 * repository_dispatch event "implement-design-from-figma" (or a manual
 * workflow_dispatch). Unlike the component flow, the exact Figma node is known
 * up-front (from the pasted URL), so there is no component-name search.
 *
 * Required env:
 *   ANTHROPIC_API_KEY  — Anthropic API key
 *   FIGMA_ACCESS_TOKEN — Figma personal access token (read access to the file)
 *   FIGMA_FILE_KEY     — Figma file key   (or derivable from FIGMA_URL)
 *   FIGMA_NODE_ID      — Figma node id    (or derivable from FIGMA_URL)
 *
 * Optional env:
 *   FIGMA_URL          — full Figma URL (fallback source for file key + node id)
 *   SLUG               — kebab-case folder name; derived from node name if absent
 *   NOTION_PRD_ID      — PRD page id (read-only fetch for designer notes)
 *   NOTION_PRD_URL     — PRD url (for the PR body)
 *   NOTES              — free-form implementation notes from the designer
 *   GITHUB_OUTPUT      — when set, slug + files_written are written here
 */

import {
  readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync, appendFileSync,
} from 'fs';
import { join, resolve, dirname, extname, relative, sep } from 'path';
import https from 'https';
import { fetchNotionPRD } from './create-notion-prd.js';
import { loadSkill, loadSkillMetadata } from './lib/skill-loader.js';

// Load .env locally; in CI env vars are injected directly
try { const dotenv = await import('dotenv'); dotenv.config(); } catch { /* CI */ }

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_URL = process.env.FIGMA_URL || '';
const NOTION_PRD_ID = process.env.NOTION_PRD_ID || '';
const NOTION_PRD_URL = process.env.NOTION_PRD_URL || '';
const NOTES = process.env.NOTES || '';

const PLAYGROUND_DIR = resolve('playground');
const ROOT_PACKAGE_JSON = resolve('package.json');
const TOKENS_DIR = resolve('design-system/src/tokens');
const DOCS_DIR = resolve('docs/context/design-system/components');
const KNOWLEDGE_LAYOUT = resolve('design-system/docs/patterns/layout.md');
const REFERENCE_SLUG = 'home-redesign';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}$/;
const REQUIRED_FILES = ['index.html', 'vite.config.js', 'src/main.jsx', 'src/App.jsx'];
const REFERENCE_TEXT_EXT = new Set(['.html', '.js', '.jsx', '.ts', '.tsx', '.scss', '.css', '.json', '.svg']);
const MAX_REFERENCE_FILE_BYTES = 60000;
const MAX_DOC_BYTES = 40000;
const CLAUDE_MAX_TOKENS = 32000;

// ─── HTTP helpers (mirror implement-figma-changes.js; those aren't exported) ─

function httpsGet(url, headers = {}) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers }, (r) => {
      if (r.statusCode === 301 || r.statusCode === 302) {
        return httpsGet(r.headers.location, headers).then(res).catch(rej);
      }
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => {
        const buffer = Buffer.concat(chunks);
        res({ status: r.statusCode, buffer, data: buffer.toString() });
      });
    });
    req.on('error', rej);
  });
}

function httpsPost(url, headers, body) {
  return new Promise((res, rej) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
    }, (r) => {
      let data = '';
      r.on('data', (c) => (data += c));
      r.on('end', () => {
        if (r.statusCode >= 400) rej(new Error(`HTTP ${r.statusCode}: ${data}`));
        else res({ status: r.statusCode, data });
      });
    });
    req.on('error', rej);
    req.write(body);
    req.end();
  });
}

async function figmaGet(endpoint) {
  const res = await httpsGet(`https://api.figma.com/v1${endpoint}`, { 'X-Figma-Token': FIGMA_ACCESS_TOKEN });
  if (res.status >= 400) throw new Error(`Figma API ${res.status}: ${res.data}`);
  return JSON.parse(res.data);
}

async function downloadImageAsBase64(url) {
  const res = await httpsGet(url);
  return res.buffer.toString('base64');
}

async function callClaude(messages, system, model) {
  const body = JSON.stringify({ model, max_tokens: CLAUDE_MAX_TOKENS, system, messages });
  const res = await httpsPost('https://api.anthropic.com/v1/messages', {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  }, body);
  const parsed = JSON.parse(res.data);
  if (!parsed.content || parsed.content.length === 0) throw new Error('Empty response from Claude');
  if (parsed.stop_reason === 'max_tokens') {
    console.warn('   ⚠️  Claude response hit max_tokens — output may be truncated');
  }
  return parsed.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

// ─── Figma URL parse (mirror of the Worker's integrations/figma.ts) ──────────

function parseFigmaUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  let parsed;
  try { parsed = new URL(url.trim()); } catch { return null; }
  if (!/(?:^|\.)figma\.com$/i.test(parsed.hostname)) return null;
  const m = parsed.pathname.match(/^\/(?:design|file|proto)\/([A-Za-z0-9]+)/);
  if (!m) return null;
  const rawNode = parsed.searchParams.get('node-id');
  if (!rawNode) return null;
  const nodeId = rawNode.includes(':') ? rawNode : rawNode.replace('-', ':');
  if (!/^[A-Za-z0-9]+:[A-Za-z0-9]+/.test(nodeId)) return null;
  return { fileKey: m[1], nodeId };
}

// ─── Slug derivation ─────────────────────────────────────────────────────────

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

function deriveSlug(explicit, figmaNodeName) {
  const fromExplicit = slugify(explicit);
  if (SLUG_RE.test(fromExplicit)) return fromExplicit;
  const fromNode = slugify(figmaNodeName);
  if (SLUG_RE.test(fromNode)) return fromNode;
  const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  return `prototype-${stamp}`;
}

// ─── Figma design properties (mirror of implement-figma-changes.js) ──────────

function extractDesignProperties(node) {
  if (!node?.document) return null;
  const doc = node.document;
  const round = (v) => (v != null ? Math.round(v * 255) : 0);
  const toRgba = (c) => (c ? `rgba(${round(c.r)}, ${round(c.g)}, ${round(c.b)}, ${c.a ?? 1})` : null);

  const props = {
    type: doc.type, name: doc.name,
    size: doc.absoluteBoundingBox ? { w: doc.absoluteBoundingBox.width, h: doc.absoluteBoundingBox.height } : null,
    fills: (doc.fills || []).map((f) => ({ type: f.type, color: toRgba(f.color), opacity: f.opacity })),
    strokes: (doc.strokes || []).map((s) => ({ color: toRgba(s.color) })),
    strokeWeight: doc.strokeWeight,
    cornerRadius: doc.cornerRadius,
    effects: (doc.effects || []).map((e) => ({ type: e.type, radius: e.radius, offset: e.offset, color: toRgba(e.color) })),
    padding: doc.paddingLeft != null ? { top: doc.paddingTop, right: doc.paddingRight, bottom: doc.paddingBottom, left: doc.paddingLeft } : null,
    itemSpacing: doc.itemSpacing,
    layoutMode: doc.layoutMode,
    fontFamily: doc.style?.fontFamily,
    fontSize: doc.style?.fontSize,
    fontWeight: doc.style?.fontWeight,
    lineHeight: doc.style?.lineHeightPx,
  };

  if (doc.children?.length > 0) {
    props.children = doc.children.slice(0, 20).map((child) => ({
      type: child.type, name: child.name,
      fills: (child.fills || []).map((f) => ({ color: toRgba(f.color) })),
      cornerRadius: child.cornerRadius,
      padding: child.paddingLeft != null ? { top: child.paddingTop, right: child.paddingRight, bottom: child.paddingBottom, left: child.paddingLeft } : null,
      itemSpacing: child.itemSpacing,
      layoutMode: child.layoutMode,
      fontSize: child.style?.fontSize, fontWeight: child.style?.fontWeight,
    }));
  }
  return props;
}

// ─── Reference scaffold + DS context ─────────────────────────────────────────

function walkReference(dir, baseDir, acc) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'node_modules') continue; // skip binary assets
      walkReference(join(dir, entry.name), baseDir, acc);
      continue;
    }
    const full = join(dir, entry.name);
    if (!REFERENCE_TEXT_EXT.has(extname(entry.name).toLowerCase())) continue;
    if (statSync(full).size > MAX_REFERENCE_FILE_BYTES) continue;
    const rel = relative(baseDir, full).split(sep).join('/');
    acc.push({ rel, content: readFileSync(full, 'utf8') });
  }
}

function readReferenceScaffold() {
  const refDir = join(PLAYGROUND_DIR, REFERENCE_SLUG);
  if (!existsSync(refDir)) return '';
  const files = [];
  walkReference(refDir, refDir, files);
  return files
    .map(({ rel, content }) => `### ${rel}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n');
}

function readTokenFiles() {
  const files = ['_colors.scss', '_spacing_semantics.scss', '_primitives.scss', '_elevation.scss', '_fonts.scss'];
  return files
    .map((f) => {
      const fp = join(TOKENS_DIR, f);
      return existsSync(fp) ? `### ${f}\n\`\`\`scss\n${readFileSync(fp, 'utf8')}\n\`\`\`` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function readDocCapped(name) {
  const fp = join(DOCS_DIR, name);
  if (!existsSync(fp)) return '';
  let content = readFileSync(fp, 'utf8');
  if (content.length > MAX_DOC_BYTES) {
    content = content.slice(0, MAX_DOC_BYTES) + '\n\n…(truncated — read the full file in the repo)';
  }
  return content;
}

function readRepoFileCapped(fp) {
  if (!existsSync(fp)) return '';
  let content = readFileSync(fp, 'utf8');
  if (content.length > MAX_DOC_BYTES) {
    content = content.slice(0, MAX_DOC_BYTES) + '\n\n…(truncated — read the full file in the repo)';
  }
  return content;
}

// ─── Output-block parsing + writing ──────────────────────────────────────────

function normalizeRelPath(raw, slug) {
  let p = raw.trim().replace(/\\/g, '/').replace(/^\.\//, '');
  const prefix = `playground/${slug}/`;
  if (p.startsWith(prefix)) p = p.slice(prefix.length);
  return p;
}

function isSafeRelPath(p, prototypeDir) {
  if (!p || p.startsWith('/') || p.split('/').includes('..')) return false;
  const target = resolve(prototypeDir, p);
  return target === prototypeDir || target.startsWith(prototypeDir + sep);
}

function writeGeneratedFiles(response, slug) {
  const prototypeDir = join(PLAYGROUND_DIR, slug);
  const pattern = /---FILE:\s*(.+?)---\n([\s\S]*?)---END FILE---/g;
  let match;
  let written = 0;
  while ((match = pattern.exec(response)) !== null) {
    const [, rawName, content] = match;
    const rel = normalizeRelPath(rawName, slug);
    if (rel === 'package.json') {
      console.warn('   ⏭️  Skipping package.json block — prototypes share the root package.json');
      continue;
    }
    if (!isSafeRelPath(rel, prototypeDir)) {
      console.warn(`   ⏭️  Skipping unsafe path: ${rawName.trim()}`);
      continue;
    }
    const filePath = join(prototypeDir, rel);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content.trim() + '\n');
    console.log(`   ✅ Wrote: ${rel}`);
    written++;
  }
  return written;
}

function validateRequiredFiles(slug) {
  const prototypeDir = join(PLAYGROUND_DIR, slug);
  const missing = REQUIRED_FILES.filter((f) => !existsSync(join(prototypeDir, f)));
  if (missing.length) {
    throw new Error(`scaffold missing required files: ${missing.join(', ')}`);
  }
}

function wireRootDevScript(slug) {
  const pkg = JSON.parse(readFileSync(ROOT_PACKAGE_JSON, 'utf8'));
  const scriptName = `dev:${slug}`;
  if (pkg.scripts && pkg.scripts[scriptName]) {
    console.log(`   ℹ️  Root package.json already has ${scriptName}`);
    return;
  }
  pkg.scripts = pkg.scripts || {};
  pkg.scripts[scriptName] = `vite --config playground/${slug}/vite.config.js`;
  // Round-trip to ensure we wrote valid JSON.
  const serialized = JSON.stringify(pkg, null, 2) + '\n';
  JSON.parse(serialized);
  writeFileSync(ROOT_PACKAGE_JSON, serialized);
  console.log(`   ✅ Added root script: ${scriptName}`);
}

function setStepOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

// ─── Notion PRD (read-only) ──────────────────────────────────────────────────

async function loadPrdContext() {
  if (!NOTION_PRD_ID) return '';
  try {
    console.log('📋 Fetching Notion PRD (read-only)...');
    const prd = await fetchNotionPRD(NOTION_PRD_ID);
    if (!prd) return '';
    const parts = [];
    if (prd.title) parts.push(`PRD: ${prd.title}`);
    if (prd.implementationNotes) parts.push(`### Implementation Notes (from designer)\n${prd.implementationNotes}`);
    if (prd.acceptanceCriteria?.length) {
      parts.push(`### Acceptance Criteria\n${prd.acceptanceCriteria.map((c) => `- [${c.checked ? 'x' : ' '}] ${c.text}`).join('\n')}`);
    }
    console.log(`   ✅ PRD loaded: ${prd.title || NOTION_PRD_ID}`);
    return parts.join('\n\n');
  } catch (e) {
    console.warn(`   ⚠️  Could not fetch Notion PRD: ${e.message}`);
    return '';
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!ANTHROPIC_API_KEY) { console.error('❌ ANTHROPIC_API_KEY is required'); process.exit(1); }
  if (!FIGMA_ACCESS_TOKEN) { console.error('❌ FIGMA_ACCESS_TOKEN is required'); process.exit(1); }

  // Resolve file key + node id from env, falling back to the pasted URL.
  let fileKey = process.env.FIGMA_FILE_KEY || '';
  let nodeId = process.env.FIGMA_NODE_ID || '';
  if (!fileKey || !nodeId) {
    const parsed = parseFigmaUrl(FIGMA_URL);
    if (parsed) { fileKey = fileKey || parsed.fileKey; nodeId = nodeId || parsed.nodeId; }
  }
  if (!fileKey || !nodeId) {
    console.error('❌ Could not resolve Figma file key + node id (set FIGMA_FILE_KEY/FIGMA_NODE_ID or a valid FIGMA_URL)');
    process.exit(1);
  }

  // Model: single source of truth is the skill frontmatter.
  const skillMeta = await loadSkillMetadata('uno-implement-design');
  const claudeModel = skillMeta.model_default;
  if (!claudeModel) {
    console.error('❌ scripts/prompts/uno-implement-design/SKILL.md is missing model_default');
    process.exit(1);
  }

  console.log(`🎨 Scaffolding prototype from Figma ${fileKey} node ${nodeId}\n`);

  // Fetch node details (design properties + name for slug).
  console.log('📐 Fetching Figma node properties...');
  const nodesResp = await figmaGet(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}&geometry=paths`);
  const node = nodesResp.nodes?.[nodeId];
  if (!node) throw new Error(`Figma node ${nodeId} not found in file ${fileKey}`);
  const nodeName = node.document?.name || '';
  const designProps = extractDesignProperties(node);

  // Derive slug + hard no-clobber check.
  const slug = deriveSlug(process.env.SLUG, nodeName);
  const prototypeDir = join(PLAYGROUND_DIR, slug);
  if (existsSync(prototypeDir)) {
    throw new Error(`playground/${slug}/ already exists — choose a different slug or iterate in the IDE`);
  }
  console.log(`   📁 Target: playground/${slug}/  (from ${process.env.SLUG ? 'slug input' : `node "${nodeName}"`})`);

  // Fetch screenshot (multimodal input). Best-effort, never fatal.
  // Scale is dimension-aware: Anthropic rejects images whose longest edge
  // exceeds 8000px, so we cap the render under that using the frame's bounding
  // box, capping at 2 for sharpness on small frames. Smaller scales are then
  // tried as fallbacks for big frames that hit Figma's render timeout. If none
  // succeed, Claude proceeds from the design-properties JSON alone.
  console.log('📸 Fetching Figma screenshot...');
  const maxDim = designProps?.size ? Math.max(designProps.size.w || 0, designProps.size.h || 0) : 0;
  const safeScale = maxDim > 0 ? Math.max(0.1, Math.min(2, 7600 / maxDim)) : 1;
  const scales = [...new Set(
    [safeScale, 1, 0.5, 0.25]
      .filter((s) => s > 0 && s <= safeScale + 1e-9)
      .map((s) => Math.round(s * 100) / 100),
  )].sort((a, b) => b - a);
  if (maxDim) console.log(`   📐 Frame max edge ~${Math.round(maxDim)}px → trying scales ${scales.join(', ')}`);
  let imageUrl = null;
  let usedScale = null;
  for (const scale of scales) {
    try {
      const imgResp = await figmaGet(`/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=${scale}`);
      imageUrl = imgResp.images?.[nodeId] || null;
      if (imageUrl) { usedScale = scale; break; }
    } catch (e) {
      console.warn(`   ⚠️  Screenshot scale=${scale} failed: ${e.message}`);
    }
  }
  let imageBase64 = null;
  if (imageUrl) {
    console.log(`   📸 Rendered at scale=${usedScale}`);
    try { imageBase64 = await downloadImageAsBase64(imageUrl); }
    catch (e) { console.warn(`   ⚠️  Could not download screenshot: ${e.message}`); }
  } else {
    console.warn('   ⚠️  No screenshot (render timeout / oversized frame) — proceeding from design properties only');
  }

  // Repo context.
  const referenceScaffold = readReferenceScaffold();
  const tokenContext = readTokenFiles();
  const componentInventory = readDocCapped('inventory.md');
  const layoutCheatSheet = readRepoFileCapped(KNOWLEDGE_LAYOUT);
  const prdContext = await loadPrdContext();

  const systemPrompt = await loadSkill('uno-implement-design');

  const userContent = [];
  if (imageBase64) {
    userContent.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64 } });
    userContent.push({ type: 'text', text: `Figma frame screenshot: ${nodeName || nodeId}` });
  }
  userContent.push({
    type: 'text',
    text: [
      `## New Prototype: ${nodeName || slug}`,
      `Scaffold a NEW playground prototype at \`playground/${slug}/\`. Output file paths RELATIVE to that directory (e.g. \`index.html\`, \`src/App.jsx\`).`,
      '',
      '## Figma Node Design Properties (colors, spacing, radius, layout)',
      '```json',
      designProps ? JSON.stringify(designProps, null, 2) : 'No detailed design properties available.',
      '```',
      '',
      '## Available Design Tokens (use ONLY these — never hardcode)',
      tokenContext || 'No token files found.',
      '',
      '## PLUS Component Inventory (the catalog — purpose, props API, and usage for every component; if a component is not listed here it does not exist — use the closest match or compose from primitives, never invent one)',
      componentInventory || 'Not available.',
      '',
      '## Layout Cheat Sheet (page structural formulas)',
      layoutCheatSheet || 'Not available.',
      '',
      '## Reference prototype structure — playground/home-redesign (mirror it exactly)',
      referenceScaffold || 'No reference scaffold found.',
      prdContext ? `\n## Notion PRD Context (designer intent + acceptance criteria)\n${prdContext}` : '',
      NOTES ? `\n## Designer Notes\n${NOTES}` : '',
      '',
      '## Task',
      `Build the prototype to match the Figma frame above, using PLUS components + design tokens. Copy the boilerplate (index.html, vite.config.js, src/main.jsx, src/styles/plus-tokens.scss, src/index.css) from the reference, changing only the <title> and a UNIQUE server.port. Put the actual UI translation in src/App.jsx (split into src/components/* if large).`,
      'Map every Figma color/spacing/radius to the closest design token. Do not emit a package.json.',
      '',
      'Respond with each file using the exact format:',
      '---FILE: relative/path.ext---',
      '(complete file contents)',
      '---END FILE---',
    ].join('\n'),
  });

  console.log(`   🤖 Calling Claude (${claudeModel})...`);
  let response;
  try {
    response = await callClaude([{ role: 'user', content: userContent }], systemPrompt, claudeModel);
  } catch (e) {
    // Safety net: if Claude rejects the image (oversized, bad media, etc.),
    // retry once with the screenshot stripped — design properties still drive
    // a usable scaffold.
    if (imageBase64 && /image/i.test(e.message)) {
      console.warn(`   ⚠️  Claude rejected the image; retrying without it (${e.message.slice(0, 120)})`);
      const textOnly = userContent.filter(
        (b) => b.type !== 'image' && !(b.type === 'text' && b.text.startsWith('Figma frame screenshot')),
      );
      response = await callClaude([{ role: 'user', content: textOnly }], systemPrompt, claudeModel);
    } else {
      throw e;
    }
  }

  console.log('\n📝 Writing generated files...');
  const written = writeGeneratedFiles(response, slug);
  if (written === 0) throw new Error('Claude produced no parseable ---FILE--- blocks');

  validateRequiredFiles(slug);
  wireRootDevScript(slug);

  setStepOutput('slug', slug);
  setStepOutput('files_written', String(written));

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ Prototype scaffolded: playground/${slug}/ (${written} files). Run: npm run dev:${slug}`);
}

main().catch((err) => {
  console.error('❌ Unhandled error:', err.message);
  process.exit(1);
});
