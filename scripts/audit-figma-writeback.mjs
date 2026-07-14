#!/usr/bin/env node
/**
 * Audit a Figma write-back frame against its manifest (library instances + bindings).
 * Run: npm run audit:figma-writeback -- playground/test-roundtrip/roundtrip-manifest.json
 * Optional: --conversation-id <id> writes .cursor/hooks/briefings/writeback-audit-pass.json on success
 * Optional: --manifest-only skips live Figma API checks (validate JSON only)
 */
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateWritebackManifest } from './lib/figma-writeback-manifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const PASS_FILE = path.join(REPO_ROOT, '.cursor/hooks/briefings/writeback-audit-pass.json');

function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const out = { manifestOnly: false };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--manifest-only') out.manifestOnly = true;
    else if (arg === '--conversation-id') {
      out.conversationId = argv[i + 1] || '';
      i += 1;
    } else if (!arg.startsWith('--')) positional.push(arg);
  }
  out.manifestPath = positional[0] || '';
  return out;
}

function figmaGet(endpoint, token) {
  return new Promise((resolve, reject) => {
    https.get(
      `https://api.figma.com/v1${endpoint}`,
      { headers: { 'X-Figma-Token': token } },
      (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 400) {
            reject(new Error(`Figma API ${response.statusCode}: ${data}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      },
    ).on('error', reject);
  });
}

/**
 * @param {Record<string, unknown>} node
 * @param {Map<string, Record<string, unknown>>} nodesById
 */
function walkNode(node, nodesById) {
  if (!node?.id) return;
  nodesById.set(String(node.id), node);
  const children = /** @type {unknown[]} */ (node.children || []);
  for (const child of children) {
    walkNode(/** @type {Record<string, unknown>} */ (child), nodesById);
  }
}

/**
 * @param {Record<string, unknown>} root
 */
function collectStats(root) {
  /** @type {Map<string, Record<string, unknown>>} */
  const nodesById = new Map();
  walkNode(root, nodesById);

  let instanceCount = 0;
  let rectangleCount = 0;
  let textCount = 0;

  for (const node of nodesById.values()) {
    if (node.type === 'INSTANCE') instanceCount += 1;
    if (node.type === 'RECTANGLE') rectangleCount += 1;
    if (node.type === 'TEXT') textCount += 1;
  }

  return { nodesById, instanceCount, rectangleCount, textCount, totalNodes: nodesById.size };
}

const args = parseArgs(process.argv.slice(2));
if (!args.manifestPath) {
  console.error(
    'Usage: node scripts/audit-figma-writeback.mjs [--conversation-id <id>] [--manifest-only] <manifest.json>',
  );
  process.exit(1);
}

const manifestPath = path.resolve(String(args.manifestPath));
if (!fs.existsSync(manifestPath)) {
  console.error(`Manifest not found: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const validation = validateWritebackManifest(manifest);

console.log(`Figma write-back audit: ${manifestPath}`);
for (const warning of validation.warnings) console.log(`  WARN  ${warning}`);
for (const error of validation.errors) console.log(`  FAIL  ${error}`);

if (!validation.ok) {
  console.log('STATUS: FAIL (manifest invalid)');
  process.exit(1);
}

if (args.manifestOnly) {
  console.log('STATUS: PASS (manifest-only mode — live Figma audit skipped)');
  writePassFileIfRequested(args, manifestPath);
  process.exit(0);
}

const token = process.env.FIGMA_ACCESS_TOKEN;
if (!token) {
  console.log('  FAIL  FIGMA_ACCESS_TOKEN is not set — cannot audit the live Figma frame.');
  console.log('        Re-run with a Figma token, or use --manifest-only for structure-only checks.');
  console.log('STATUS: FAIL');
  process.exit(1);
}

const fileKey = manifest.figmaTestFile.fileKey;
const frameNodeId = manifest.writeBackFrame.nodeId;

try {
  const response = await figmaGet(`/files/${fileKey}/nodes?ids=${encodeURIComponent(frameNodeId)}`, token);
  const document = response?.nodes?.[frameNodeId]?.document;
  if (!document) {
    console.log(`  FAIL  Frame node ${frameNodeId} not found in file ${fileKey}.`);
    console.log('STATUS: FAIL');
    process.exit(1);
  }

  const stats = collectStats(document);
  const expectedInstances = manifest.components.length;

  console.log(`  INFO  Frame "${manifest.writeBackFrame.name}" — ${stats.totalNodes} nodes`);
  console.log(`  INFO  INSTANCE: ${stats.instanceCount} · RECTANGLE: ${stats.rectangleCount} · TEXT: ${stats.textCount}`);

  if (stats.instanceCount === 0) {
    console.log('  FAIL  No library component instances found — likely a screenshot/capture write-back.');
    console.log('STATUS: FAIL');
    process.exit(1);
  }

  if (stats.instanceCount < Math.min(expectedInstances, 1)) {
    console.log(`  FAIL  Expected at least one mapped component instance; found ${stats.instanceCount}.`);
    console.log('STATUS: FAIL');
    process.exit(1);
  }

  const captureLike = stats.rectangleCount > stats.instanceCount * 3 && stats.instanceCount < 3;
  if (captureLike) {
    console.log('  FAIL  Frame looks like a rasterized capture (many rectangles, few instances).');
    console.log('STATUS: FAIL');
    process.exit(1);
  }

  for (const [index, component] of manifest.components.entries()) {
    const node = stats.nodesById.get(component.figmaInstanceNodeId);
    if (!node) {
      console.log(`  FAIL  components[${index}] node ${component.figmaInstanceNodeId} missing from frame tree.`);
      console.log('STATUS: FAIL');
      process.exit(1);
    }
    if (node.type !== 'INSTANCE') {
      console.log(`  FAIL  components[${index}] node ${component.figmaInstanceNodeId} is not an INSTANCE.`);
      console.log('STATUS: FAIL');
      process.exit(1);
    }
  }

  console.log('STATUS: PASS');
  writePassFileIfRequested(args, manifestPath);
  process.exit(0);
} catch (error) {
  console.log(`  FAIL  ${error.message}`);
  console.log('STATUS: FAIL');
  process.exit(1);
}

/**
 * @param {Record<string, string | boolean>} args
 * @param {string} manifestPath
 */
function writePassFileIfRequested(args, manifestPath) {
  if (!args.conversationId) return;
  fs.mkdirSync(path.dirname(PASS_FILE), { recursive: true });
  fs.writeFileSync(
    PASS_FILE,
    JSON.stringify(
      {
        conversationId: args.conversationId,
        manifestPath,
        auditedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log(`  INFO  Wrote gate pass file: ${PASS_FILE}`);
}
