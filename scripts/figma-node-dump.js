/**
 * Fetch all Figma file + node data/metadata via REST API and print in detail.
 * Usage:
 *   FIGMA_ACCESS_TOKEN=xxx node scripts/figma-node-dump.js "https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/...?node-id=4215-23104"
 */

import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_API_BASE = 'https://api.figma.com/v1';

if (!FIGMA_ACCESS_TOKEN) {
  console.error('Error: FIGMA_ACCESS_TOKEN must be set (e.g. in .env)');
  process.exit(1);
}

function toNodeId(str) {
  return str.replace(/-/g, ':');
}

function parseFigmaUrl(url) {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/^\/(?:file|design)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    const fileKey = match[1];
    const nodeIdParam = u.searchParams.get('node-id');
    const nodeId = nodeIdParam ? toNodeId(nodeIdParam) : null;
    return { fileKey, nodeId };
  } catch {
    return null;
  }
}

function figmaGet(path) {
  return new Promise((resolve, reject) => {
    const url = `${FIGMA_API_BASE}${path}`;
    https.get(url, { headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(data));
        else reject(new Error(`Figma API ${res.statusCode}: ${data.slice(0, 300)}`));
      });
    }).on('error', reject);
  });
}

async function main() {
  const url = process.argv[2] || 'https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4-Foundation--Component-LIbrary-?node-id=4215-23104';
  const parsed = parseFigmaUrl(url);
  if (!parsed) {
    console.error('Invalid Figma URL');
    process.exit(1);
  }
  const { fileKey, nodeId } = parsed;

  const out = { fileKey, nodeId, file: null, nodeData: null, components: null, componentSets: null, styles: null, variables: null, variableCollections: null };

  // 1) File metadata + document (depth 2 for top-level structure)
  out.file = await figmaGet(`/files/${fileKey}?depth=2`);
  out.components = out.file.components ?? {};
  out.componentSets = out.file.componentSets ?? {};
  out.styles = {
    fillStyles: out.file.styles?.fillStyles ?? {},
    textStyles: out.file.styles?.textStyles ?? {},
    effectStyles: out.file.styles?.effectStyles ?? {},
    gridStyles: out.file.styles?.gridStyles ?? {},
  };

  // 2) Specific node with full subtree
  if (nodeId) {
    const nodesRes = await figmaGet(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}&depth=10`);
    const nodeDoc = nodesRes.nodes?.[nodeId]?.document;
    if (nodeDoc) out.nodeData = nodeDoc;
    if (nodesRes.nodes?.[nodeId]?.components) out.nodeComponentMeta = nodesRes.nodes[nodeId].components;
    if (nodesRes.nodes?.[nodeId]?.componentSets) out.nodeComponentSetMeta = nodesRes.nodes[nodeId].componentSets;
  }

  // 3) Variables (if any)
  try {
    out.variableCollections = await figmaGet(`/files/${fileKey}/variable-collections`);
  } catch (_) {}
  try {
    out.variables = await figmaGet(`/files/${fileKey}/variables/local`);
  } catch (_) {}

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
