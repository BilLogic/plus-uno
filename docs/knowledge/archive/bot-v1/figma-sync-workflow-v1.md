# Figma-to-Code Sync Workflow

## Overview

This automated pipeline detects Figma design system changes, creates Notion PRDs for designer review, and uses Claude AI to implement code changes — all triggered from Slack.

```
Figma Publish → Poll Detects → Notion PRD → Slack Notification
                                                    ↓
                                        Designer reviews PRD
                                                    ↓
                                        "implement Badge" in Slack
                                                    ↓
                                    Pipedream → GitHub Actions → Claude AI
                                                    ↓
                                            Draft PR Created
                                                    ↓
                                        Team reviews → Merge
```

---

## How It Works

### Phase 1: Detection

**Workflow:** `figma-library-poll.yml`
**Schedule:** Every 15 minutes, Mon–Fri, 9am–7pm UTC

1. GitHub Actions polls the Figma file API for component changes
2. Compares against a stored snapshot (`scripts/figma-component-snapshot.json`)
3. Detects new, modified, and deleted components
4. Filters out Figma autosave versions (only tracks intentional publishes)

### Phase 2: Notion PRD

When changes are detected:
1. A Notion PRD page is auto-created in the "DS Component PRDs" database
2. The PRD includes:
   - Component screenshots from Figma
   - Design properties (colors, spacing, radius, layout)
   - Change summary (new/modified/deleted)
   - Acceptance criteria checklist
   - Implementation notes section (for designer input)
3. PRD status is set to **Draft**

### Phase 3: Slack Notification

A message is posted to `#figma-sync` with:
- List of changed components
- Link to the Notion PRD
- Instructions for triggering implementation

### Phase 4: Designer Review

The designer:
1. Opens the Notion PRD link
2. Reviews the auto-generated content
3. Adds **implementation notes** (e.g., "Use 6px border-radius, not 4px")
4. Updates **acceptance criteria** as needed
5. When ready, triggers implementation from Slack

### Phase 5: Implementation (Slack → Claude)

**Trigger:** Type `implement Badge` in `#figma-sync`

1. **Pipedream** (middleware) picks up the Slack message
2. Extracts the component name
3. Calls GitHub's `repository_dispatch` API
4. **GitHub Actions** runs the `Implement Figma Changes` workflow:
   - Creates a new branch: `ds-review/badge-YYYY-MM-DD-HHMMSS`
   - Searches Notion for the matching PRD (auto-lookup by component name)
   - Reads designer's implementation notes + acceptance criteria
   - Fetches Figma design data (screenshots, design properties, metadata)
   - Reads current component code + design tokens
   - Sends everything to **Claude AI** with detailed system prompt
   - Claude generates updated component files
   - Commits changes and creates a **Draft PR**
   - Posts Slack notification with PR link + action log link

### Phase 6: Review & Merge

1. The Draft PR includes:
   - Component code changes
   - DS Review Checklist
   - Link to Figma and Notion PRD
2. Team reviews the diff
3. When approved, mark as "Ready for Review" → Merge

---

## Trigger Options

| Method | Command | Where |
|--------|---------|-------|
| **Slack message** | `implement Badge` | `#figma-sync` channel |
| **Slack thread reply** | `implement Badge` or `implement` | Reply to PRD notification |
| **Multiple components** | `implement Badge, Button, Tooltip` | `#figma-sync` channel |
| **GitHub UI** | Manual workflow dispatch | Actions → Implement Figma Changes → Run |

---

## Files & Scripts

### GitHub Actions Workflows

| File | Purpose |
|------|---------|
| `.github/workflows/figma-library-poll.yml` | Polls Figma every 15 min, detects changes, creates Notion PRD, sends Slack notification |
| `.github/workflows/figma-implement.yml` | Runs Claude AI implementation, creates branch + draft PR, notifies Slack |

### Scripts

| File | Purpose |
|------|---------|
| `scripts/poll-figma-library.js` | Figma API polling logic, change detection, snapshot comparison |
| `scripts/create-notion-prd.js` | Notion API integration: create PRDs, fetch PRDs, search by component, update status |
| `scripts/implement-figma-changes.js` | Claude AI implementation: fetch Figma data, read code, generate updates |
| `scripts/figma-component-snapshot.json` | Stored baseline of Figma components (auto-updated) |

### Key Functions

| Function | File | Purpose |
|----------|------|---------|
| `createNotionPRD()` | `create-notion-prd.js` | Auto-creates PRD page in Notion |
| `fetchNotionPRD()` | `create-notion-prd.js` | Fetches PRD content by page ID |
| `findPRDByComponent()` | `create-notion-prd.js` | Searches Notion database for PRD matching component name |
| `updatePRDStatus()` | `create-notion-prd.js` | Updates PRD status (Draft → In Progress → Done) |
| `parseComponentNames()` | `implement-figma-changes.js` | Extracts component names from PR title or CLI args |
| `callClaude()` | `implement-figma-changes.js` | Sends prompt to Claude API and parses response |

---

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `FIGMA_ACCESS_TOKEN` | Figma personal access token |
| `FIGMA_FILE_KEY` | Figma file key (from URL) |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL for `#figma-sync` |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `NOTION_API_KEY` | Notion internal integration token |
| `NOTION_DATABASE_ID` | Notion database ID for PRD pages |

---

## Pipedream Setup

Pipedream acts as the bridge between Slack and GitHub:

1. **Trigger:** Slack — New Message in Channel (`#figma-sync`)
2. **Code Step:** Filters bot messages, extracts component name from `implement <component>`
3. **HTTP Request:** Calls `POST https://api.github.com/repos/BilLogic/plus-uno/dispatches`
4. **Slack Reply:** Posts thread reply confirming the action is running

### Pipedream Code Step

```javascript
export default defineComponent({
  async run({ steps, $ }) {
    const event = steps.trigger.event;
    if (event.bot_id || event.subtype === "bot_message") {
      return $.flow.exit("Ignoring bot message");
    }
    const message = event.text || "";
    if (!message.toLowerCase().includes("implement")) {
      return $.flow.exit("Message doesn't contain implement");
    }
    const match = message.match(/implement\s+(.+)/i);
    if (!match) {
      return $.flow.exit("No component name found");
    }
    return { component: match[1].trim() };
  },
})
```

### HTTP Request Body

```json
{
  "event_type": "implement-figma-changes",
  "client_payload": {
    "component": "{{steps.STEPNAME.$return_value.component}}"
  }
}
```

### HTTP Request Headers

| Key | Value |
|-----|-------|
| `Authorization` | `token ghp_your_github_pat` |
| `Accept` | `application/vnd.github.v3+json` |

---

## Notion Database Setup

### Database Name
"DS Component PRDs"

### Required Properties

| Property | Type | Purpose |
|----------|------|---------|
| Name | Title | PRD title (auto-generated) |
| Status | Select | Draft → In Progress → Done |
| Component | Rich Text | Component name(s) |
| Change Type | Multi-select | New / Modified / Deleted |
| Figma Link | URL | Link to Figma file |
| Published By | Rich Text | Designer who published |
| Date | Date | Date of change detection |

### Page Content (auto-generated)
- Published by callout
- Figma file link
- Change summary (new/modified/deleted components)
- Component screenshots
- Design properties table
- Acceptance criteria checklist
- Implementation notes section (designer fills in)

---

## Troubleshooting

### Slack message doesn't trigger workflow
- Check Pipedream is **deployed** and **active** (toggle on)
- Ensure the message contains the word "implement"
- Verify bot messages are filtered (prevents feedback loops)
- Check Pipedream logs for errors

### GitHub Action fails at branch creation
- Branch names include timestamps to prevent collisions
- If it fails, re-run from GitHub Actions UI

### Claude finds no changes
- The component code may already match Figma
- Check the action log for Figma API errors
- Verify `FIGMA_ACCESS_TOKEN` hasn't expired

### Draft PR not created
- Enable "Allow GitHub Actions to create and approve pull requests" in repo settings:
  `Settings → Actions → General → Workflow permissions`

### Notion PRD not created
- Verify `NOTION_API_KEY` and `NOTION_DATABASE_ID` in GitHub secrets
- Ensure the Notion integration has access to the database
- Check database property names match exactly

### 401 errors from Pipedream
- GitHub PAT needs `repo` scope
- Use format: `Authorization: token ghp_xxx` (not `Bearer`)
- Regenerate PAT if expired
