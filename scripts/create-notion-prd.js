/**
 * Create Notion PRD — Auto-generate a Product Requirements Document
 * in Notion when Figma design system changes are detected.
 *
 * Called by poll-figma-library.js after detecting changes.
 *
 * Environment Variables:
 *   NOTION_API_KEY     - Notion Internal Integration token
 *   NOTION_DATABASE_ID - Notion database ID for PRD pages
 *   FIGMA_ACCESS_TOKEN - Figma API access token (for screenshots)
 *   FIGMA_FILE_KEY     - Figma file key
 */

import https from 'https';

// Load .env locally; in CI env vars are injected directly
try { const dotenv = await import('dotenv'); dotenv.config(); } catch { /* CI */ }

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const NOTION_API_VERSION = '2022-06-28';

// ─── Notion API Helpers ──────────────────────────────────

function notionRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'api.notion.com',
      path: `/v1${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Notion API ${res.statusCode}: ${parsed.message || responseData}`));
          }
        } catch {
          reject(new Error(`Notion API ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── Figma API Helpers ───────────────────────────────────

function figmaGet(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.figma.com',
      path: `/v1${endpoint}`,
      method: 'GET',
      headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(data));
        else reject(new Error(`Figma API ${res.statusCode}: ${data.slice(0, 200)}`));
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// ─── Screenshot Export ───────────────────────────────────

async function getComponentScreenshots(nodeIds) {
  if (!nodeIds.length) return {};

  // Figma API limits to ~100 IDs per request; batch if needed
  const batchSize = 50;
  const screenshots = {};

  for (let i = 0; i < nodeIds.length; i += batchSize) {
    const batch = nodeIds.slice(i, i + batchSize);
    const ids = batch.join(',');
    try {
      const result = await figmaGet(`/images/${FIGMA_FILE_KEY}?ids=${ids}&format=png&scale=2`);
      if (result.images) {
        Object.assign(screenshots, result.images);
      }
    } catch (e) {
      console.warn(`   ⚠️  Screenshot batch failed: ${e.message}`);
    }
  }

  return screenshots;
}

// ─── Figma Node Properties ───────────────────────────────

async function getNodeProperties(nodeIds) {
  if (!nodeIds.length) return {};

  const batchSize = 20;
  const allNodes = {};

  for (let i = 0; i < nodeIds.length; i += batchSize) {
    const batch = nodeIds.slice(i, i + batchSize);
    const ids = batch.join(',');
    try {
      const result = await figmaGet(`/files/${FIGMA_FILE_KEY}/nodes?ids=${ids}`);
      if (result.nodes) {
        for (const [id, data] of Object.entries(result.nodes)) {
          if (data?.document) allNodes[id] = data.document;
        }
      }
    } catch (e) {
      console.warn(`   ⚠️  Node properties batch failed: ${e.message}`);
    }
  }

  return allNodes;
}

function extractDesignSummary(node) {
  if (!node) return null;

  const props = {};
  if (node.fills?.length) {
    props.fills = node.fills.map(f => {
      if (f.type === 'SOLID' && f.color) {
        const { r, g, b, a } = f.color;
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a ?? 1})`;
      }
      return f.type;
    });
  }
  if (node.cornerRadius != null) props.cornerRadius = node.cornerRadius;
  if (node.paddingLeft != null) props.padding = `${node.paddingTop ?? 0} ${node.paddingRight ?? 0} ${node.paddingBottom ?? 0} ${node.paddingLeft ?? 0}`;
  if (node.itemSpacing != null) props.gap = node.itemSpacing;
  if (node.strokes?.length) props.strokeWeight = node.strokeWeight;
  if (node.style) {
    props.fontSize = node.style.fontSize;
    props.fontFamily = node.style.fontFamily;
    props.fontWeight = node.style.fontWeight;
    props.lineHeight = node.style.lineHeightPx;
  }

  return Object.keys(props).length > 0 ? props : null;
}

// ─── Group Variants by Component ─────────────────────────

function groupByComponent(items, getFrame, getName) {
  const groups = {};
  items.forEach(item => {
    const frame = getFrame(item) || 'Unknown';
    if (!groups[frame]) groups[frame] = [];
    groups[frame].push(item);
  });
  return groups;
}

// ─── Build Notion PRD Page ───────────────────────────────

/**
 * Create a Notion PRD page for detected Figma changes.
 *
 * @param {Object} componentDiff - { created, modified, deleted }
 * @param {Array} newVersions - Array of new version objects
 * @returns {Object} - { pageId, pageUrl } or null if skipped
 */
export async function createNotionPRD(componentDiff, newVersions) {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    console.log('   NOTION_API_KEY or NOTION_DATABASE_ID not set — skipping PRD creation');
    return null;
  }

  const allChangedItems = [
    ...componentDiff.created,
    ...componentDiff.modified.map(m => m.new),
    ...componentDiff.deleted
  ];

  if (!allChangedItems.length && !newVersions.length) {
    console.log('   No changes to create PRD for');
    return null;
  }

  // Group components by parent frame
  const createdGroups = groupByComponent(componentDiff.created, c => c.containingFrame, c => c.name);
  const modifiedGroups = groupByComponent(componentDiff.modified, c => c.new.containingFrame, c => c.new.name);
  const deletedGroups = groupByComponent(componentDiff.deleted, c => c.containingFrame, c => c.name);

  // Build PRD title
  const allFrames = new Set([
    ...Object.keys(createdGroups),
    ...Object.keys(modifiedGroups),
    ...Object.keys(deletedGroups)
  ]);
  const componentNames = [...allFrames].slice(0, 3).join(', ');
  const extra = allFrames.size > 3 ? ` +${allFrames.size - 3} more` : '';
  const prdTitle = `DS Update: ${componentNames}${extra}`;

  const figmaUrl = `https://www.figma.com/design/${FIGMA_FILE_KEY}`;
  const date = new Date().toISOString().slice(0, 10);

  // Get screenshots for a sample of changed components (first 5 per group)
  const sampleNodeIds = allChangedItems.slice(0, 10).map(c => c.nodeId).filter(Boolean);
  console.log(`   📸 Fetching screenshots for ${sampleNodeIds.length} components...`);
  const screenshots = await getComponentScreenshots(sampleNodeIds);

  // Get design properties for sample nodes
  console.log(`   📐 Fetching design properties...`);
  const nodeProps = await getNodeProperties(sampleNodeIds.slice(0, 5));
  const designSummaries = {};
  for (const [id, node] of Object.entries(nodeProps)) {
    const summary = extractDesignSummary(node);
    if (summary) designSummaries[id] = summary;
  }

  // Published by info
  const publishedBy = newVersions.length ? newVersions[0].user : 'Unknown';
  const publishDescription = newVersions.length ? (newVersions[0].description || newVersions[0].label || 'No description') : 'Metadata change (no version published)';

  // ─── Build Notion Page Content ───────────────────────

  const children = [];

  // Callout: Published by
  children.push({
    object: 'block',
    type: 'callout',
    callout: {
      icon: { type: 'emoji', emoji: '🎨' },
      rich_text: [{
        type: 'text',
        text: { content: `Published by ${publishedBy} — ${publishDescription}` }
      }],
      color: 'blue_background'
    }
  });

  // Figma link
  children.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{
        type: 'text',
        text: { content: '🔗 Figma File: ', link: null }
      }, {
        type: 'text',
        text: { content: figmaUrl, link: { url: figmaUrl } }
      }]
    }
  });

  children.push({ object: 'block', type: 'divider', divider: {} });

  // ─── Change Summary ────────────────────────────────

  children.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: 'Change Summary' } }]
    }
  });

  // New components
  if (Object.keys(createdGroups).length) {
    children.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [{ type: 'text', text: { content: '📦 New Components' } }]
      }
    });
    for (const [frame, items] of Object.entries(createdGroups)) {
      children.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: { content: `${frame} — ${items.length} variant${items.length > 1 ? 's' : ''}` },
            annotations: { bold: true }
          }]
        }
      });
    }
  }

  // Modified components
  if (Object.keys(modifiedGroups).length) {
    children.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [{ type: 'text', text: { content: '✏️ Modified Components' } }]
      }
    });
    for (const [frame, items] of Object.entries(modifiedGroups)) {
      children.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: { content: `${frame} — ${items.length} variant${items.length > 1 ? 's' : ''}` },
            annotations: { bold: true }
          }]
        }
      });
    }
  }

  // Deleted components
  if (Object.keys(deletedGroups).length) {
    children.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [{ type: 'text', text: { content: '🗑️ Deleted Components' } }]
      }
    });
    for (const [frame, items] of Object.entries(deletedGroups)) {
      children.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: { content: `${frame} — ${items.length} variant${items.length > 1 ? 's' : ''}` },
            annotations: { bold: true }
          }]
        }
      });
    }
  }

  children.push({ object: 'block', type: 'divider', divider: {} });

  // ─── Screenshots ───────────────────────────────────

  const screenshotUrls = Object.entries(screenshots).filter(([, url]) => url);
  if (screenshotUrls.length) {
    children.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Component Screenshots' } }]
      }
    });

    for (const [nodeId, url] of screenshotUrls.slice(0, 5)) {
      const matchedItem = allChangedItems.find(c => c.nodeId === nodeId);
      const label = matchedItem ? `${matchedItem.containingFrame || ''} / ${matchedItem.name}` : nodeId;

      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: label }, annotations: { italic: true } }]
        }
      });

      children.push({
        object: 'block',
        type: 'image',
        image: {
          type: 'external',
          external: { url }
        }
      });
    }

    children.push({ object: 'block', type: 'divider', divider: {} });
  }

  // ─── Design Properties ─────────────────────────────

  if (Object.keys(designSummaries).length) {
    children.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Design Properties' } }]
      }
    });

    children.push({
      object: 'block',
      type: 'code',
      code: {
        language: 'json',
        rich_text: [{
          type: 'text',
          text: { content: JSON.stringify(designSummaries, null, 2).slice(0, 1900) }
        }]
      }
    });

    children.push({ object: 'block', type: 'divider', divider: {} });
  }

  // ─── Acceptance Criteria ───────────────────────────

  children.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: 'Acceptance Criteria' } }]
    }
  });

  const criteria = [
    'Component code matches latest Figma design',
    'All design tokens used correctly (no hardcoded values)',
    'Storybook stories updated if component API changed',
    'Visual parity verified against Figma',
    'No regressions in existing components',
  ];

  for (const criterion of criteria) {
    children.push({
      object: 'block',
      type: 'to_do',
      to_do: {
        checked: false,
        rich_text: [{ type: 'text', text: { content: criterion } }]
      }
    });
  }

  children.push({ object: 'block', type: 'divider', divider: {} });

  // ─── Implementation Notes (empty for designer) ────

  children.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: 'Implementation Notes' } }]
    }
  });

  children.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{
        type: 'text',
        text: { content: 'Add any specific implementation guidance, edge cases, or design decisions here before triggering /implement.' },
        annotations: { italic: true, color: 'gray' }
      }]
    }
  });

  // ─── Create Notion Page ────────────────────────────

  // Build change type tags
  const changeTypes = [];
  if (componentDiff.created.length) changeTypes.push('New');
  if (componentDiff.modified.length) changeTypes.push('Modified');
  if (componentDiff.deleted.length) changeTypes.push('Deleted');

  const page = await notionRequest('POST', '/pages', {
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      // Title property (required, must match your database title column)
      'Name': {
        title: [{ text: { content: prdTitle } }]
      },
      'Status': {
        select: { name: 'Draft' }
      },
      'Change Type': {
        multi_select: changeTypes.map(t => ({ name: t }))
      },
      'Component': {
        rich_text: [{ text: { content: componentNames } }]
      },
      'Figma Link': {
        url: figmaUrl
      },
      'Published By': {
        rich_text: [{ text: { content: publishedBy } }]
      },
      'Date': {
        date: { start: date }
      }
    },
    children
  });

  const pageUrl = page.url;
  const pageId = page.id;

  console.log(`   ✅ Notion PRD created: ${prdTitle}`);
  console.log(`   📄 ${pageUrl}`);

  return { pageId, pageUrl, title: prdTitle };
}

/**
 * Fetch a Notion PRD page content as structured text for AI context.
 *
 * @param {string} pageId - Notion page ID
 * @returns {Object} - { title, status, implementationNotes, acceptanceCriteria, properties }
 */
export async function fetchNotionPRD(pageId) {
  if (!NOTION_API_KEY) {
    console.warn('NOTION_API_KEY not set — cannot fetch PRD');
    return null;
  }

  // Fetch page properties
  const page = await notionRequest('GET', `/pages/${pageId}`);

  // Fetch page blocks (content)
  const blocks = await notionRequest('GET', `/blocks/${pageId}/children?page_size=100`);

  // Extract key fields
  const title = page.properties?.Name?.title?.[0]?.plain_text || 'Untitled';
  const status = page.properties?.Status?.select?.name || 'Unknown';
  const component = page.properties?.Component?.rich_text?.[0]?.plain_text || '';
  const publishedBy = page.properties?.['Published By']?.rich_text?.[0]?.plain_text || '';

  // Extract implementation notes (text after "Implementation Notes" heading)
  let implementationNotes = '';
  let inNotesSection = false;

  for (const block of (blocks.results || [])) {
    if (block.type === 'heading_2') {
      const text = block.heading_2?.rich_text?.[0]?.plain_text || '';
      if (text === 'Implementation Notes') {
        inNotesSection = true;
        continue;
      } else if (inNotesSection) {
        break; // Next heading means end of notes
      }
    }
    if (inNotesSection && block.type === 'paragraph') {
      const text = block.paragraph?.rich_text?.map(t => t.plain_text).join('') || '';
      if (text && !text.startsWith('Add any specific implementation')) {
        implementationNotes += text + '\n';
      }
    }
  }

  // Extract acceptance criteria
  const acceptanceCriteria = [];
  for (const block of (blocks.results || [])) {
    if (block.type === 'to_do') {
      const text = block.to_do?.rich_text?.[0]?.plain_text || '';
      acceptanceCriteria.push({ text, checked: block.to_do?.checked || false });
    }
  }

  return {
    title,
    status,
    component,
    publishedBy,
    implementationNotes: implementationNotes.trim(),
    acceptanceCriteria,
    pageUrl: page.url
  };
}

/**
 * Look up the most recent PRD for a component by querying the Notion database.
 * This allows the implementation script to find the PRD without needing a PRD ID.
 *
 * @param {string} componentName - Component name to search for (e.g., "Badge")
 * @returns {Object|null} - { pageId, title, ...prdData } or null if not found
 */
export async function findPRDByComponent(componentName) {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    console.warn('NOTION_API_KEY or NOTION_DATABASE_ID not set — cannot search PRDs');
    return null;
  }

  const result = await notionRequest('POST', `/databases/${NOTION_DATABASE_ID}/query`, {
    filter: {
      or: [
        {
          property: 'Component',
          rich_text: { contains: componentName }
        },
        {
          property: 'Name',
          title: { contains: componentName }
        }
      ]
    },
    sorts: [{ property: 'Date', direction: 'descending' }],
    page_size: 1
  });

  if (!result.results?.length) {
    return null;
  }

  const page = result.results[0];
  const pageId = page.id;

  // Fetch full PRD content using existing function
  const prd = await fetchNotionPRD(pageId);
  return prd ? { ...prd, pageId } : null;
}

/**
 * Update PRD status in Notion.
 *
 * @param {string} pageId - Notion page ID
 * @param {string} status - New status value (e.g., "In Progress", "Done")
 */
export async function updatePRDStatus(pageId, status) {
  if (!NOTION_API_KEY) return;

  await notionRequest('PATCH', `/pages/${pageId}`, {
    properties: {
      'Status': { select: { name: status } }
    }
  });
}
