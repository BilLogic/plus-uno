/**
 * Poll Figma Library — Detect component and version changes
 *
 * Fetches the current component list from the Figma file, compares
 * against a local snapshot, and reports any changes. No webhook needed.
 *
 * Flow:
 *   1. Fetch file versions + components from Figma REST API
 *   2. Compare against scripts/figma-component-snapshot.json
 *   3. If changes found: post to Slack, output change summary for CI
 *   4. Update snapshot file
 *
 * Usage:
 *   node scripts/poll-figma-library.js                    # Check for changes
 *   node scripts/poll-figma-library.js --init             # Create initial snapshot
 *   node scripts/poll-figma-library.js --dry-run          # Check without updating snapshot
 *
 * Environment Variables:
 *   FIGMA_ACCESS_TOKEN - Figma API access token
 *   FIGMA_FILE_KEY - Figma file key
 *   SLACK_WEBHOOK_URL - Slack Incoming Webhook URL (optional)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { createNotionPRD } from './create-notion-prd.js';
// Load .env locally; in CI env vars are injected directly
try { const dotenv = await import('dotenv'); dotenv.config(); } catch { /* CI — no .env needed */ }

const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const SNAPSHOT_PATH = path.join(process.cwd(), 'scripts', 'figma-component-snapshot.json');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg === '--init') args.init = true;
    if (arg === '--dry-run') args.dryRun = true;
  });
  return args;
}

/**
 * Figma API GET request with retry logic
 */
function figmaGet(endpoint, retries = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    const attempt = (retriesLeft) => {
      https.get(`https://api.figma.com/v1${endpoint}`, {
        headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN }
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(new Error(`Parse error: ${e.message}`)); }
          } else if (retriesLeft > 0 && (res.statusCode === 429 || res.statusCode >= 500)) {
            console.warn(`Figma API ${res.statusCode}, retrying in ${delay}ms... (${retriesLeft} retries left)`);
            setTimeout(() => attempt(retriesLeft - 1), delay);
          } else {
            reject(new Error(`Figma API ${res.statusCode}: ${data.substring(0, 200)}`));
          }
        });
      }).on('error', (err) => {
        if (retriesLeft > 0) {
          console.warn(`Network error: ${err.message}, retrying in ${delay}ms... (${retriesLeft} retries left)`);
          setTimeout(() => attempt(retriesLeft - 1), delay);
        } else {
          reject(err);
        }
      });
    };
    attempt(retries);
  });
}

/**
 * Post to Slack via Incoming Webhook
 */
function postToSlack(blocks, text) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('SLACK_WEBHOOK_URL not set — skipping Slack notification');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const url = new URL(SLACK_WEBHOOK_URL);
    const body = JSON.stringify({ text, blocks });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) resolve();
        else reject(new Error(`Slack webhook ${res.statusCode}: ${data}`));
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Non-DS component patterns to ignore.
 * These are Figma utility frames, documentation, deprecated items, etc.
 */
const IGNORED_COMPONENT_PATTERNS = [
  /^layout-blocks\//i,       // Figma grid helper components
  /^_/,                       // Internal/deprecated (e.g., _Obsoleted Input)
  /guidelines$/i,             // Documentation frames (e.g., Spacing Token Guidelines)
  /^colors,/i,                // Color documentation
  /^draft$/i,                 // Work-in-progress items
];

function isIgnoredComponent(component) {
  const name = component.name || '';
  const frame = component.containingFrame || '';
  // Skip components with no containing frame (utility components)
  if (!frame && !name) return true;
  // Skip by name pattern
  if (IGNORED_COMPONENT_PATTERNS.some(p => p.test(name))) return true;
  // Skip by frame pattern
  if (IGNORED_COMPONENT_PATTERNS.some(p => p.test(frame))) return true;
  return false;
}

/**
 * Fetch all components from the Figma file (filtered to DS components only)
 */
async function fetchComponents() {
  const result = await figmaGet(`/files/${FIGMA_FILE_KEY}/components`);
  const components = result.meta?.components || [];
  const mapped = components.map(c => ({
    key: c.key,
    name: c.name,
    description: c.description || '',
    nodeId: c.node_id,
    containingFrame: c.containing_frame?.name || ''
  }));
  const filtered = mapped.filter(c => !isIgnoredComponent(c));
  const ignored = mapped.length - filtered.length;
  if (ignored > 0) console.log(`Filtered out ${ignored} non-DS components`);
  return filtered;
}

/**
 * Fetch recent file versions
 */
async function fetchVersions() {
  const result = await figmaGet(`/files/${FIGMA_FILE_KEY}/versions`);
  // Filter to only intentional publishes (have a label like "Components published")
  // Figma creates autosave versions with null label/description — skip those
  const allVersions = (result.versions || []).slice(0, 30);
  const publishedVersions = allVersions.filter(v => v.label || v.description);
  return publishedVersions.slice(0, 10).map(v => ({
    id: v.id,
    label: v.label || '',
    description: v.description || '',
    createdAt: v.created_at,
    user: v.user?.handle || 'Unknown'
  }));
}

/**
 * Load existing snapshot from disk
 */
function loadSnapshot() {
  try {
    const data = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save snapshot to disk
 */
function saveSnapshot(snapshot) {
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
}

/**
 * Diff components between old and new snapshots
 */
function diffComponents(oldComponents, newComponents) {
  const oldMap = new Map(oldComponents.map(c => [c.key, c]));
  const newMap = new Map(newComponents.map(c => [c.key, c]));

  const created = [];
  const modified = [];
  const deleted = [];

  // Find new and modified
  for (const [key, comp] of newMap) {
    const old = oldMap.get(key);
    if (!old) {
      created.push(comp);
    } else if (old.name !== comp.name || old.description !== comp.description) {
      modified.push({ old, new: comp });
    }
  }

  // Find deleted
  for (const [key, comp] of oldMap) {
    if (!newMap.has(key)) {
      deleted.push(comp);
    }
  }

  return { created, modified, deleted };
}

/**
 * Diff versions — find versions created since last check
 */
function diffVersions(oldVersionIds, newVersions) {
  const oldSet = new Set(oldVersionIds);
  return newVersions.filter(v => !oldSet.has(v.id));
}

/**
 * Build Slack message for detected changes
 */
function buildSlackMessage(componentDiff, newVersions, prdResult = null, allComponents = []) {
  const figmaUrl = `https://www.figma.com/design/${FIGMA_FILE_KEY}`;

  // Group variants by parent component name (containingFrame)
  function groupByComponent(items, getFrame, getName) {
    const groups = {};
    items.forEach(item => {
      const frame = getFrame(item) || getName(item) || 'Unknown';
      if (!groups[frame]) groups[frame] = 0;
      groups[frame]++;
    });
    return Object.entries(groups).map(([name, count]) => count > 1 ? `${name} (${count} variants)` : name);
  }

  // Format timestamp
  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // Build blocks
  const blocks = [];

  // Header
  blocks.push({
    type: 'header',
    text: { type: 'plain_text', text: '🎨 Figma Design System Updated' }
  });

  // Version info (who published + description)
  if (newVersions.length) {
    for (const v of newVersions) {
      const publishedBy = `*Published by ${v.user}*`;
      const label = v.label ? ` · _${v.label}_` : '';
      const versionUrl = `${figmaUrl}?version-id=${v.id}`;
      let versionBlock = `${publishedBy}${label}\n<${versionUrl}|View this version>`;

      if (v.description) {
        versionBlock = `${publishedBy}${label}\n\n> ${v.description}\n\n<${versionUrl}|View this version>`;
      }

      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: versionBlock }
      });
    }
  } else {
    // No new version but components changed — metadata-only change
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '_Component metadata changed (no published version detected)_' }
    });
  }

  // Component changes
  const componentLines = [];
  if (componentDiff.created.length) {
    const names = groupByComponent(componentDiff.created, c => c.containingFrame, c => c.name);
    const display = names.length > 5 ? names.slice(0, 5).join(', ') + ` (+${names.length - 5} more)` : names.join(', ');
    componentLines.push(`📦  *New:*  ${display}`);
  }
  if (componentDiff.modified.length) {
    const names = groupByComponent(componentDiff.modified, c => c.new.containingFrame, c => c.new.name);
    const display = names.length > 5 ? names.slice(0, 5).join(', ') + ` (+${names.length - 5} more)` : names.join(', ');
    componentLines.push(`✏️  *Modified:*  ${display}`);
  }
  if (componentDiff.deleted.length) {
    const names = groupByComponent(componentDiff.deleted, c => c.containingFrame, c => c.name);
    const display = names.length > 5 ? names.slice(0, 5).join(', ') + ` (+${names.length - 5} more)` : names.join(', ');
    componentLines.push(`🗑️  *Deleted:*  ${display}`);
  }

  // When a version is published but no metadata diff detected (visual-only changes),
  // match the version description against known component frame names
  if (!componentLines.length && newVersions.length) {
    const versionText = newVersions.map(v => `${v.label} ${v.description}`).join(' ').toLowerCase();

    // Get unique component frame names from the file
    const frameNames = [...new Set(allComponents.map(c => c.containingFrame).filter(Boolean))];

    // Match frames mentioned in the version description
    const matchedFrames = frameNames.filter(frame =>
      versionText.includes(frame.toLowerCase())
    );

    if (matchedFrames.length) {
      const display = matchedFrames.length > 5
        ? matchedFrames.slice(0, 5).join(', ') + ` (+${matchedFrames.length - 5} more)`
        : matchedFrames.join(', ');
      componentLines.push(`✏️  *Updated:*  ${display}`);
    } else if (versionText.trim()) {
      // No frame match — show the raw description
      const rawText = newVersions.map(v => [v.label, v.description].filter(Boolean).join(' — ')).join(', ');
      componentLines.push(`✏️  *Updated:*  ${rawText}`);
    } else {
      componentLines.push(`✏️  *Updated:*  Visual changes published (no description provided)`);
    }
  }

  if (componentLines.length) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: componentLines.join('\n') }
    });
  }

  // PRD link (if Notion PRD was created)
  if (prdResult?.pageUrl) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:clipboard: *PRD Created:* <${prdResult.pageUrl}|${prdResult.title}>\nReview the PRD, then type \`/implement ${prdResult.title.replace('DS Update: ', '')}\` in this channel when ready.`
      }
    });
  }

  // Footer with links and timestamp
  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `<${figmaUrl}|Open Figma file>  ·  ${timeStr}  ·  Automated poll` }
    ]
  });

  // Fallback text for notifications
  const summary = [];
  if (newVersions.length) summary.push(`Published by ${newVersions[0].user}`);
  if (componentDiff.created.length) summary.push(`${componentDiff.created.length} new`);
  if (componentDiff.modified.length) summary.push(`${componentDiff.modified.length} modified`);
  if (componentDiff.deleted.length) summary.push(`${componentDiff.deleted.length} deleted`);
  const text = `Figma DS Update: ${summary.join(', ')}`;

  return { blocks, text };
}

/**
 * Build GitHub Issue body
 */
function buildIssueBody(componentDiff, newVersions) {
  const figmaUrl = `https://www.figma.com/design/${FIGMA_FILE_KEY}`;
  const parts = [`## Figma Design System Changes Detected\n`, `**Figma file**: ${figmaUrl}\n`];

  // Group variants by parent component
  function groupByFrame(items, getFrame, getName) {
    const groups = {};
    items.forEach(item => {
      const frame = getFrame(item) || 'Unknown';
      if (!groups[frame]) groups[frame] = [];
      groups[frame].push(getName(item));
    });
    return groups;
  }

  if (componentDiff.created.length) {
    parts.push(`### New Components`);
    const groups = groupByFrame(componentDiff.created, c => c.containingFrame, c => c.name);
    Object.entries(groups).forEach(([frame, variants]) => {
      parts.push(`- **${frame}** — ${variants.length} variant${variants.length > 1 ? 's' : ''}`);
    });
    parts.push('');
  }
  if (componentDiff.modified.length) {
    parts.push(`### Modified Components`);
    const groups = groupByFrame(componentDiff.modified, c => c.new.containingFrame, c => c.new.name);
    Object.entries(groups).forEach(([frame, variants]) => {
      parts.push(`- **${frame}** — ${variants.length} variant${variants.length > 1 ? 's' : ''}`);
    });
    parts.push('');
  }
  if (componentDiff.deleted.length) {
    parts.push(`### Deleted Components`);
    const groups = groupByFrame(componentDiff.deleted, c => c.containingFrame, c => c.name);
    Object.entries(groups).forEach(([frame, variants]) => {
      parts.push(`- **${frame}** — ${variants.length} variant${variants.length > 1 ? 's' : ''}`);
    });
    parts.push('');
  }
  if (newVersions.length) {
    parts.push(`### New Versions`);
    newVersions.forEach(v => parts.push(`- ${v.label || v.id} by ${v.user} — ${v.description || '(no description)'}`));
    parts.push('');
  }

  parts.push(`### Action Items`);
  parts.push(`- [ ] Review Figma changes`);
  parts.push(`- [ ] Update component code if needed`);
  parts.push(`- [ ] Run \`npm run sync:tokens && npm run generate:tokens\` for token changes`);
  parts.push(`- [ ] Verify in Storybook`);
  parts.push('');
  parts.push(`---`);
  parts.push(`*Auto-created by Figma library polling workflow*`);

  return parts.join('\n');
}

/**
 * Main
 */
async function main() {
  if (!FIGMA_ACCESS_TOKEN || !FIGMA_FILE_KEY) {
    console.error('Error: FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY are required');
    process.exit(1);
  }

  const args = parseArgs();

  console.log('Polling Figma library...');
  console.log(`  File key: ${FIGMA_FILE_KEY}`);

  // Fetch current state
  const [components, versions] = await Promise.all([
    fetchComponents(),
    fetchVersions()
  ]);

  console.log(`  Found ${components.length} components, ${versions.length} recent versions`);

  // Initialize snapshot mode
  if (args.init) {
    const snapshot = {
      lastChecked: new Date().toISOString(),
      components,
      versionIds: versions.map(v => v.id)
    };
    saveSnapshot(snapshot);
    console.log(`\n✅ Initial snapshot saved with ${components.length} components`);
    return;
  }

  // Load existing snapshot
  const snapshot = loadSnapshot();
  if (!snapshot) {
    console.log('\nNo snapshot found. Run with --init first to create initial snapshot.');
    console.log('  node scripts/poll-figma-library.js --init');

    // Auto-init on first run in CI
    if (process.env.CI) {
      console.log('\nCI detected — auto-creating initial snapshot');
      const newSnapshot = {
        lastChecked: new Date().toISOString(),
        components,
        versionIds: versions.map(v => v.id)
      };
      saveSnapshot(newSnapshot);
    }
    return;
  }

  // Diff
  const componentDiff = diffComponents(snapshot.components, components);
  const newVersions = diffVersions(snapshot.versionIds, versions);

  const hasComponentChanges = componentDiff.created.length || componentDiff.modified.length || componentDiff.deleted.length;
  const hasNewVersions = newVersions.length > 0;
  const hasChanges = hasComponentChanges || hasNewVersions;

  if (!hasChanges) {
    console.log('\n✅ No changes detected since last check');

    // Update timestamp
    if (!args.dryRun) {
      snapshot.lastChecked = new Date().toISOString();
      saveSnapshot(snapshot);
    }
    return;
  }

  // Report changes
  console.log('\n🔔 Changes detected:');
  // Group by parent component for readable output
  function groupForLog(items, getFrame) {
    const groups = {};
    items.forEach(item => {
      const frame = getFrame(item) || 'Unknown';
      if (!groups[frame]) groups[frame] = 0;
      groups[frame]++;
    });
    return Object.entries(groups).map(([name, count]) => count > 1 ? `${name} (${count} variants)` : name).join(', ');
  }

  if (componentDiff.created.length) {
    console.log(`  New: ${groupForLog(componentDiff.created, c => c.containingFrame)}`);
  }
  if (componentDiff.modified.length) {
    console.log(`  Modified: ${groupForLog(componentDiff.modified, c => c.new.containingFrame)}`);
  }
  if (componentDiff.deleted.length) {
    console.log(`  Deleted: ${groupForLog(componentDiff.deleted, c => c.containingFrame)}`);
  }
  if (newVersions.length) {
    newVersions.forEach(v => console.log(`  New version: ${v.label || v.id} by ${v.user}`));
  }

  // Output for GitHub Actions
  const outputLines = [];
  if (hasComponentChanges) outputLines.push(`components_changed=true`);
  if (hasNewVersions) outputLines.push(`versions_changed=true`);
  outputLines.push(`change_summary=${JSON.stringify({
    created: componentDiff.created.map(c => c.name),
    modified: componentDiff.modified.map(c => c.new.name),
    deleted: componentDiff.deleted.map(c => c.name),
    newVersions: newVersions.map(v => v.label || v.id)
  })}`);

  // Write GitHub Actions output
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    fs.appendFileSync(githubOutput, outputLines.join('\n') + '\n');
  }

  // Also write issue body for GitHub Actions to use
  const issueBody = buildIssueBody(componentDiff, newVersions);
  fs.mkdirSync(path.join(process.cwd(), '.figma-sync-context'), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), '.figma-sync-context', 'issue-body.md'), issueBody);

  // Create Notion PRD
  let prdResult = null;
  try {
    console.log('\n📋 Creating Notion PRD...');
    prdResult = await createNotionPRD(componentDiff, newVersions, components);
  } catch (error) {
    console.error(`\n⚠ Notion PRD creation failed: ${error.message}`);
  }

  // Write PRD info for GitHub Actions
  if (prdResult && githubOutput) {
    fs.appendFileSync(githubOutput, `notion_prd_url=${prdResult.pageUrl}\n`);
    fs.appendFileSync(githubOutput, `notion_prd_id=${prdResult.pageId}\n`);
  }

  // Post to Slack
  if (SLACK_WEBHOOK_URL) {
    try {
      const { blocks, text } = buildSlackMessage(componentDiff, newVersions, prdResult, components);
      await postToSlack(blocks, text);
      console.log('\n✅ Slack notification sent');
    } catch (error) {
      console.error(`\n⚠ Slack notification failed: ${error.message}`);
    }
  }

  // Update snapshot (unless dry run)
  if (!args.dryRun) {
    const newSnapshot = {
      lastChecked: new Date().toISOString(),
      components,
      versionIds: versions.map(v => v.id)
    };
    saveSnapshot(newSnapshot);
    console.log('Snapshot updated');
  }
}

main().catch(error => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
