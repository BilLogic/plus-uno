/**
 * Notify Slack — Post design system change notifications to #ds-sync
 *
 * Uses Slack Incoming Webhook (no bot token or server needed).
 *
 * Usage:
 *   node scripts/notify-slack.js --type=token-sync --changes="Colors updated"
 *   node scripts/notify-slack.js --type=token-sync --pr-url=https://github.com/... --pr-title="chore: sync tokens"
 *   node scripts/notify-slack.js --type=no-changes
 *   node scripts/notify-slack.js --type=pr-merged --pr-url=https://github.com/... --component=Button
 *
 * Environment Variables:
 *   SLACK_WEBHOOK_URL - Slack Incoming Webhook URL
 */

import https from 'https';
// Load .env locally; in CI env vars are injected directly
try { const dotenv = await import('dotenv'); dotenv.config(); } catch { /* CI — no .env needed */ }

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [key, ...valueParts] = arg.replace(/^--/, '').split('=');
    args[key] = valueParts.join('=') || true;
  });
  return args;
}

/**
 * Post a message to Slack via Incoming Webhook
 */
function postSlackMessage(blocks, text) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('SLACK_WEBHOOK_URL not set — skipping Slack notification');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const url = new URL(SLACK_WEBHOOK_URL);
    const payload = JSON.stringify({ text, blocks });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ ok: true });
        } else {
          reject(new Error(`Slack webhook error: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Build Slack Block Kit message for token sync notification
 */
function buildTokenSyncBlocks(args) {
  const changes = args.changes || 'Token values updated';
  const prUrl = args['pr-url'];
  const prTitle = args['pr-title'] || 'chore: sync design tokens from Figma';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🔄 Token Sync PR Created' }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Changes detected:*\n${changes}`
      }
    }
  ];

  if (prUrl) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*PR:* <${prUrl}|${prTitle}>`
      }
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `Triggered by token sync · ${new Date().toISOString().split('T')[0]}` }
    ]
  });

  return blocks;
}

/**
 * Build Slack Block Kit message for no-changes notification
 */
function buildNoChangesBlocks() {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '✅ *Token Sync Complete* — No changes detected. Figma tokens are in sync with code.'
      }
    },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `Daily sync · ${new Date().toISOString().split('T')[0]}` }
      ]
    }
  ];
}

/**
 * Build Slack Block Kit message for PR merged
 */
function buildPrMergedBlocks(args) {
  const prUrl = args['pr-url'] || '#';
  const component = args.component || 'component';

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '✅ Design System Update Shipped' }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${component}* update merged.\n<${prUrl}|View PR>`
      }
    },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `Merged · ${new Date().toISOString().split('T')[0]}` }
      ]
    }
  ];
}

async function main() {
  if (!SLACK_WEBHOOK_URL) {
    console.error('Error: SLACK_WEBHOOK_URL must be set');
    console.error('See .env.example for setup instructions');
    process.exit(1);
  }

  const args = parseArgs();
  const type = args.type;

  let blocks;
  let text;

  switch (type) {
    case 'token-sync':
      blocks = buildTokenSyncBlocks(args);
      text = 'Token Sync PR Created';
      break;
    case 'no-changes':
      blocks = buildNoChangesBlocks();
      text = 'Token Sync — No Changes';
      break;
    case 'pr-merged':
      blocks = buildPrMergedBlocks(args);
      text = 'Design System Update Shipped';
      break;
    default:
      console.error(`Unknown notification type: ${type}`);
      console.error('Supported types: token-sync, no-changes, pr-merged');
      process.exit(1);
  }

  try {
    await postSlackMessage(blocks, text);
    console.log('✅ Slack notification sent');
  } catch (error) {
    console.error(`❌ Failed to send Slack notification: ${error.message}`);
    process.exit(1);
  }
}

export { postSlackMessage, buildTokenSyncBlocks };

main();
