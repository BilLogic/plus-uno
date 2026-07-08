# Figma Sync Workflow Guide

> **Status note (corrected 2026-05-12):** An earlier version of this doc described an `@codex` / `@claude` Slack-mention invocation pattern. That pattern is **not** how the live system works. The actual UNO Bot is triggered by a plain Slack message containing `implement <component>` (no slash). Pipedream filters for that pattern and routes to GitHub Actions. See [docs/figma-sync-workflow.md](../../../../docs/figma-sync-workflow.md) for the authoritative end-to-end pipeline, including the Notion PRD step. If you find any other doc in this repo referencing `@codex` or `@claude` mentions for Figma sync, treat it as stale.

## Overview

The `#figma-sync` channel is the central hub for all Figma design system updates. When designers publish changes in Figma, an automated workflow detects them, creates a draft PR for review, and enables AI-assisted implementation via UNO Bot.

---

## The Automated Flow

### 1. Designer Publishes in Figma
When a designer publishes component changes in the design system file, the automation kicks in.

### 2. Bot Detects Changes (~15 min)
The polling bot (`scripts/poll-figma-library.js`, run on schedule via `.github/workflows/figma-library-poll.yml`) checks Figma every 15 minutes during work hours (Mon-Fri, 9am-7pm). When changes are detected, it posts to `#figma-sync`:

```
🎨 Figma Design System Updated

Published by Bryan · Components published

> Updated Button hover states and added disabled variant

📦  New:  Tooltip (3 variants)
✏️  Modified:  Button (5 variants)
🗑️  Deleted:  Button Group (54 variants)

───────────────────────────
Open Figma file  ·  Apr 8, 2026 at 12:15 PM  ·  Automated poll
```

### 3. Draft PR Created Automatically
The automation creates:
- **Branch**: `ds-review/button-2026-04-08`
- **Draft PR**: "feat: Figma DS update — Button"
- **Labels**: `design-system`, `figma-sync`

The GitHub app posts a notification in `#figma-sync` when the PR is created.

---

## How to Implement Changes

You have two options:

### Option A: AI-Assisted Implementation via UNO Bot (Recommended)

Use UNO Bot's `implement` slash command with the draft PR link. The bot reads the Figma change context + the draft PR + the relevant component source, then pushes an implementation commit to the same `ds-review/*` branch.

Example invocation in `#figma-sync` (or wherever you summon the bot):

```
implement draft PR #42 — Button hover states + disabled variant
```

**What UNO Bot does:**
- Reads the draft PR description and the Figma change summary
- Fetches the component source from the plus-uno repo
- Writes the implementation against the existing `ds-review/{component}-{date}` branch
- Replies in thread with a link to its commit

### Option B: Manual Implementation

1. Check out the branch:
   ```bash
   git fetch origin
   git checkout ds-review/button-2026-04-08
   ```

2. Make your changes to match Figma

3. Commit and push:
   ```bash
   git add .
   git commit -m "feat: update Button hover states"
   git push origin ds-review/button-2026-04-08
   ```

---

## DS Manager Review Process

Once implementation is complete:

### 1. Review the Draft PR
- Check the code changes
- Verify visual parity with Figma
- Test in Storybook

### 2. Complete the Checklist
The PR includes a checklist:
- [ ] Component code updated to match Figma
- [ ] Storybook stories updated
- [ ] Visual parity verified against Figma
- [ ] No regressions in existing components
- [ ] DS manager approved

### 3. Mark as Ready for Review
In the GitHub PR, click **Ready for review** to convert from draft.

### 4. Approve and Merge
Once approved, merge to `main`. The GitHub app will post the merge notification in `#figma-sync`.

---

## Common Workflows

### Implement a Single Component Update

```
implement Apply the latest Button hover states from the draft PR in #figma-sync.
```

### Ask UNO Bot About Design Intent Before Implementing

The bot can answer questions about the design system as a `Smart Assistant` skill (see `uno-assist` in the bot's skill library). Useful when you want a plan before triggering `implement`.

Example:

```
@uno-bot Looking at the Figma changes for the Modal component,
what's the intended behavior for the new close button placement?
```

UNO Bot will summarize the design intent and suggest an implementation approach. You can then run `implement` once you're aligned.

### Implement Multiple Components in One Pass

```
implement Apply the Button hover-state, Dropdown new-variant,
and Tooltip positioning changes from today's polling batch.
Create separate commits per component on branch ds-review/multi-update-2026-04-08.
```

---

## Tips

- **Always reference the draft PR or branch name** when invoking `implement` — UNO Bot needs to know where to push.
- **Use UNO Bot for both planning and execution** — ask for a plan first if the change is non-trivial, then `implement` once you're confident.
- **Check Storybook after implementation** — visual parity is critical.
- **Don't merge without DS manager approval** — the draft PR workflow ensures review happens.

---

## Troubleshooting

### The polling bot didn't detect my Figma publish
- Wait 15 minutes — the poll runs every 15 min during work hours.
- Check that you clicked **Publish** in Figma (not just saved).
- Verify the publish had a description (autosaves are filtered out).

### UNO Bot didn't push to the branch
- Make sure your `implement` invocation referenced the exact draft PR or branch name.
- Check that UNO Bot has write access to the repo.
- Try asking the bot to "show me the plan first" before invoking `implement` to verify it understood the change.

### The draft PR has the wrong components listed
- The polling bot groups variants by parent component name.
- If the list looks wrong, check the Figma file structure (`containingFrame`).

---

## Channel Notifications

The `#figma-sync` channel shows:
- **Figma polling bot**: Component change details (`scripts/poll-figma-library.js` output)
- **GitHub app**: Draft PR created, commits pushed, PR merged
- **UNO Bot**: Responses to `implement` and related invocations

All in one place — the full lifecycle from design to code.

---

## Related Docs

- `.agent/skills/uno-prototype/references/figma-workflow.md` — Token sync and design-context extraction (separate from this Slack-flow doc)
- `.agent/skills/uno-prototype/references/figma-mcp-guide.md` — Figma MCP tool reference for IDE-based design work
- `scripts/poll-figma-library.js` — Source of the polling automation
- `.github/workflows/figma-library-poll.yml` — GitHub Action that runs the poller
