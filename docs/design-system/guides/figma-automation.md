# Figma Automation Pipeline

Automated design system sync: GitHub Actions polls Figma for changes → Slack notification → GitHub Issue + PR.

No server or deployment needed — runs entirely on GitHub Actions.

## How It Works

1. GitHub Action polls Figma every 30 minutes (during work hours)
2. Compares current components/versions against a local snapshot
3. If changes detected:
   - Posts notification to Slack `#ds-sync` with change details + Figma link
   - Creates a GitHub Issue with affected components and action items
   - Triggers token sync workflow (creates PR for SCSS token updates)
4. (Optional) AI-powered component sync generates code changes via Claude API

## Setup

### 1. GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Source | Required |
|--------|--------|----------|
| `FIGMA_ACCESS_TOKEN` | Figma → Settings → Personal Access Tokens | Yes |
| `FIGMA_FILE_KEY` | From Figma library URL (`figma.com/design/FILE_KEY/...`) | Yes |
| `SLACK_WEBHOOK_URL` | Slack App → Incoming Webhooks → Copy URL | Yes |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Optional (for AI code gen) |

`GITHUB_TOKEN` is automatically provided by GitHub Actions — no setup needed.

### 2. Create Slack Incoming Webhook

1. Go to https://api.slack.com/apps → **Create New App** → **From Scratch**
2. Name it `PLUS DS Bot`, select your workspace
3. In the left sidebar, click **Incoming Webhooks**
4. Toggle **Activate Incoming Webhooks** to **On**
5. Click **Add New Webhook to Workspace**
6. Select the `#ds-sync` channel → **Allow**
7. Copy the **Webhook URL** → add as GitHub Secret `SLACK_WEBHOOK_URL`

That's it. No bot tokens, no channel IDs, no interactivity setup.

### 3. Initialize Component Snapshot

Run once to create the baseline snapshot that future polls compare against:

```bash
# Set FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY in your .env first
npm run figma:poll:init
```

This creates `scripts/figma-component-snapshot.json`. Commit this file.

### 4. (Optional) Install Code Connect

```bash
npm install -D @figma/code-connect
```

Then update `.figma.tsx` files in `design-system/src/components/` and publish:

```bash
npm run figma:publish-code-connect
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run figma:poll` | Poll Figma for changes (compares against snapshot) |
| `npm run figma:poll:init` | Create initial component snapshot |
| `npm run figma:fetch-component` | Fetch design context for components (CI) |
| `npm run figma:write-back` | Post-merge Figma annotations |
| `npm run figma:publish-code-connect` | Publish Code Connect to Figma |
| `npm run notify:slack` | Send Slack notifications |

## GitHub Workflows

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `figma-library-poll.yml` | Every 30 min (Mon-Fri work hours) + manual | Polls Figma → Slack notification → GitHub Issue |
| `sync-figma-tokens.yml` | Daily cron, manual, `repository_dispatch` | Syncs tokens → creates PR → Slack notification |
| `figma-component-sync.yml` | `repository_dispatch` from poll workflow | Fetches design context → AI generates code → creates PR |

## Architecture

```
GitHub Actions (cron every 30 min)
  │
  ├─→ scripts/poll-figma-library.js
  │     ├─→ Figma REST API (fetch components + versions)
  │     ├─→ Diff against scripts/figma-component-snapshot.json
  │     ├─→ Slack #ds-sync notification (via Incoming Webhook)
  │     └─→ Update snapshot + commit
  │
  ├─→ GitHub Issue (auto-created with component details + Figma link)
  │
  ├─→ figma-token-sync (dispatch if changes detected)
  │     ├─→ Sync tokens from Figma → generate SCSS
  │     └─→ Create PR + Slack notification
  │
  └─→ figma-component-sync (optional, needs ANTHROPIC_API_KEY)
        ├─→ Fetch Figma design context
        ├─→ Claude API generates code changes
        └─→ Create PR + Slack notification
```

## Troubleshooting

- **Polling not running**: Check GitHub Actions tab → "Poll Figma Library" workflow. Verify `FIGMA_ACCESS_TOKEN` and `FIGMA_FILE_KEY` secrets are set.
- **No snapshot found**: Run `npm run figma:poll:init` locally and commit the snapshot file.
- **Slack not posting**: Verify `SLACK_WEBHOOK_URL` secret is set. Test with `npm run notify:slack --type=no-changes`.
- **AI code gen failing**: Check `ANTHROPIC_API_KEY` secret. Review debug output in `.figma-sync-context/debug-*.txt`.
- **False positives**: The poll compares component names and descriptions. If Figma reports changes that don't seem real, re-init the snapshot with `npm run figma:poll:init`.
