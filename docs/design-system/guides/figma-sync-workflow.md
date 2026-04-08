# Figma Sync Workflow Guide

## Overview

The `#figma-sync` channel is the central hub for all Figma design system updates. When designers publish changes in Figma, an automated workflow detects them, creates a draft PR for review, and enables AI-assisted implementation.

---

## The Automated Flow

### 1. Designer Publishes in Figma
When a designer publishes component changes in the design system file, the automation kicks in.

### 2. Bot Detects Changes (~15 min)
The polling bot checks Figma every 15 minutes during work hours (Mon-Fri, 9am-7pm). When changes are detected, it posts to `#figma-sync`:

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
The bot creates:
- **Branch**: `ds-review/button-2026-04-08`
- **Draft PR**: "feat: Figma DS update — Button"
- **Labels**: `design-system`, `figma-sync`

The GitHub app posts a notification in `#figma-sync` when the PR is created.

---

## How to Implement Changes

You have three options:

### Option A: AI-Assisted Implementation (Recommended)

Use `@codex` to implement changes automatically:

```
@codex The Button component was updated in Figma.
The draft PR is at #42 on branch ds-review/button-2026-04-08.
Please update the Button component to match the Figma changes
and push to that branch.
```

**What Codex does:**
- Reads the Figma design context
- Updates the component code
- Pushes commits to the `ds-review/*` branch
- Posts updates in the thread

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

### Option C: Ask Claude for Guidance First

If you're unsure about the approach, ask Claude:

```
@claude The Dropdown was redesigned in Figma.
What's the best approach to update our React component?
Should we refactor the existing one or create a new variant?
```

Claude will suggest an approach, then you can use Codex to implement or do it manually.

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

### Generate a PRD from Figma Changes

```
@claude Write a PRD for this Figma DS update.
Components changed: Button, Dropdown.
Include acceptance criteria and implementation steps.
```

### Ask About Design Intent

```
@claude Looking at the Figma changes for the Modal component,
what's the intended behavior for the new close button placement?
```

### Implement Multiple Components

```
@codex The following components were updated in Figma:
- Button (hover states)
- Dropdown (new variant)
- Tooltip (positioning)

Please update all three on branch ds-review/multi-update-2026-04-08
and create separate commits for each component.
```

---

## Tips

- **Always reference the branch name** when asking Codex to implement — it needs to know where to push
- **Use Claude for planning, Codex for execution** — Claude is better at discussing approach, Codex is better at writing code
- **Check Storybook after implementation** — visual parity is critical
- **Don't merge without DS manager approval** — the draft PR workflow ensures review happens

---

## Troubleshooting

### The bot didn't detect my Figma publish
- Wait 15 minutes — the poll runs every 15 min
- Check that you clicked "Publish" in Figma (not just saved)
- Verify the publish had a description (autosaves are filtered out)

### Codex didn't push to the branch
- Make sure you mentioned the exact branch name in your message
- Check that Codex has write access to the repo
- Try asking it to "show me the code" first, then manually push if needed

### The draft PR has the wrong components listed
- The bot groups variants by parent component name
- If the list looks wrong, check the Figma file structure (containingFrame)

---

## Channel Notifications

The `#figma-sync` channel shows:
- **Figma bot**: Component change details
- **GitHub app**: Draft PR created, commits pushed, PR merged
- **Codex/Claude**: Responses to @mentions

All in one place — the full lifecycle from design to code.
