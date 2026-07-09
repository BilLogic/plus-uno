<!-- ====================================================================
     ⚠️  DEFERRED (2026-05-12) — NOT WIRED INTO V2 AGENT
     ====================================================================
     Status: parking-lot doc. This skill was drafted for v1 (the rigid
     router → switch → workers architecture) but was deferred during the
     v2 architectural pivot. v2's agentic Claude does NOT load this skill
     or expose it as a tool.

     Why deferred:
     - Q&A (uno-qa) handles informal evaluation conversationally
       ("what's off about this design?") — covers ~80% of critique value
       without the structured severity-tier ceremony.
     - The severity-tiered output format adds maintenance surface for
       arguable gain over inline Q&A-style feedback.
     - No designer has explicitly requested structured artifact evaluation
       in the conversations leading to the v2 pivot.

     When to revive:
     - If designers explicitly ask for structured/severity-graded review
       outputs (e.g. for design-review threads with multiple findings).
     - If a "pre-flight before PR" structured pass becomes a real need.

     Reviving requires: adding this skill as a tool the agent can call
     (alongside implement and marketplace), updating AGENTS.md tool
     definitions, and ensuring the output format renders well in Slack
     mrkdwn.

     The content below is preserved as-is from the v1 draft for reference.
     ==================================================================== -->

---
name: uno-critique
description: >
  Provides grounded, severity-tiered feedback on a design artifact (Figma
  frame, prototype URL, marketplace ID, Notion doc, GitHub PR) — evaluated
  against the Plus Uno design system principles, conventions, and forbidden
  patterns. Use when a designer asks "critique this", "give feedback on X",
  "review this design", or "is this consistent with our DS".
trigger_types:
  - slack_keyword
model_default: claude-sonnet-4-6
status: draft
covers: §2.2 Critique Mode from uno-bot-next-steps source doc.
notes: >
  First net-new skill after the uno-implement migration. Targets the §8 DoD
  bar (existing skills + 1 new). The bot's expertise is *Plus-specific*
  evaluation, not generic UX critique — every finding must cite a Plus doc,
  component, or ADR.
---

# uno-critique

Evaluate a design artifact against the Plus Uno design system and surface specific, actionable feedback. The bot is not a generic design critic — its expertise is Plus's conventions, components, terminology, design principles, and forbidden patterns. Findings without grounding in a Plus doc, an existing component, or an ADR are not findings.

## When to Use

- Designer pastes a Figma frame link and asks "critique this" / "feedback?"
- Designer asks the bot to review a prototype before sharing for design review
- Designer asks "is this consistent with our home dashboard?" (specific consistency check)
- Pre-flight check before opening a PR for design review

**Do NOT use this skill for:**

- Subjective taste calls without grounding ("I don't like the color blue") — ask what to evaluate against, or decline
- High-level product strategy critique ("is this feature worth building?") — escalate to Bill
- Critique of artifacts outside the Plus design surface (marketing copy, backend diagrams, third-party UIs) — politely decline
- Side-by-side comparisons across multiple artifacts — handle one at a time

## Inputs

| Input | Source | Required? |
|-------|--------|-----------|
| Artifact reference | Figma URL, prototype deployment URL, marketplace ID (e.g. `1008`), Notion link, GitHub PR | Yes |
| Focus area | "accessibility", "consistency with X", "structure", "copy", or freeform | No (defaults to full sweep) |
| Reviewer's gut check | Optional context, e.g. "I'm worried about the table density" | No |

## Workflow

### Step 1: Identify and fetch the artifact

| Artifact type | How to fetch |
|---------------|--------------|
| Figma URL | Use Figma MCP: `get_design_context(fileKey, nodeId)` + `get_screenshot(fileKey, nodeId)`. Requires desktop app open with the target frame selected for full context |
| Prototype deployment URL | Fetch via Playwright MCP if available; otherwise ask user for a screenshot |
| Marketplace ID (e.g. `1008`) | Look up the entry in [src/pages/PrototypeMarket/prototypes-data.js](../../src/pages/PrototypeMarket/prototypes-data.js); use the `deploymentUrl` or `localPath` to screenshot |
| Notion link | Fetch via `mcp__notion-plus__*` tools |
| GitHub PR | Fetch diff via `gh pr view` / `gh pr diff` |

If unfetchable for any reason, post a single clarifying request to Slack and exit — don't critique speculatively.

### Step 2: Load grounding context

**Always load:**

- `docs/context/design-system/foundations/principles.md` — the rubric for what "good" means in Plus
- `docs/context/design-system/components/cheat-sheet.md` — what components actually exist (don't critique for "not using X" when X doesn't exist)
- Parent `AGENTS.md` — shared forbidden patterns, vocabulary, base voice

**Load when relevant** (based on what's visible in the artifact or the focus area):

- `docs/context/design-system/foundations/accessibility.md` — color contrast, touch targets, keyboard, focus, motion
- `docs/context/design-system/foundations/content-voice.md` — labels, copy, microcopy, capitalization
- `docs/context/design-system/foundations/layout.md` — context-level hierarchy, grid
- `docs/context/conventions/terminology.md` — Plus vocabulary
- The specific component's source files (`.jsx`, `.scss`, `.stories.jsx`) — when one component is the focus
- `docs/knowledge/decisions.md` — when the artifact touches an area covered by an ADR

### Step 3: Evaluate against the rubric

Walk through each category. Note candidate findings per category before assigning severity:

| Category | What to check |
|----------|---------------|
| **Tokens** | Any hardcoded colors, spacing, typography, radius, elevation that should be tokens? |
| **Components** | Using a PLUS component where one exists, or rolling custom unnecessarily? |
| **Hierarchy** | Context-level rules respected (Element → Card → Section → Page, no skipping)? |
| **Terminology** | Plus vocabulary used (Session not "class", Reflection not "survey", etc.)? |
| **Accessibility** | WCAG AA contrast, 44×44 touch targets, keyboard reach, visible focus, color-not-alone for state |
| **Content voice** | Sentence case for labels, title case for page titles, plain language, no jargon |
| **Consistency** | Matches existing patterns in the codebase / cheat-sheet / specs? Diverges with or without justification? |
| **Forbidden patterns** | FA Pro icons, Tailwind classes, hardcoded hex, deep imports, non-Bootstrap UI frameworks |

### Step 4: Assign severity

| Severity | Threshold |
|----------|-----------|
| **🔴 P0 — Must fix** | Violates a forbidden pattern; breaks WCAG AA; uses a non-existent component; conflicts with an active ADR; uses a deprecated token |
| **🟡 P1 — Should fix** | Diverges from established Plus patterns without justification; terminology drift; hierarchy skipping; copy case violations; missing/wrong stories for changed components |
| **🟢 P2 — Nice to have** | Suggestion for a more elegant Plus component; minor spacing nits; density opportunities; motion/animation suggestions |

### Step 5: Synthesize

- Pick 1-3 specific things the artifact does well — cite which doc or principle it matches
- Lead with an "Overall" line that names the single strongest signal (positive or negative)
- Omit empty severity sections so short critiques stay short

### Step 6: Post

Threaded reply on the originating Slack message. If output exceeds ~1500 chars, post a 3-bullet summary in Slack and a link to a Gist with the full critique.

## References (Load on Every Invocation)

- `docs/context/design-system/foundations/principles.md`
- `docs/context/design-system/components/cheat-sheet.md`
- Parent `bot-skills/AGENTS.md`

## References (Load When Relevant)

- `docs/context/design-system/foundations/accessibility.md`
- `docs/context/design-system/foundations/content-voice.md`
- `docs/context/design-system/foundations/layout.md`
- `docs/context/conventions/terminology.md`
- Target component's source (`design-system/src/components/{X}/`)
- `docs/knowledge/decisions.md` for relevant ADRs

## Output Format

Threaded Slack reply, in **Slack mrkdwn** (see `AGENTS.md` → "Slack output formatting" — bold is `*single asterisk*`, no `#` headings). Severity sections with zero findings are omitted entirely.

```
🔍 *Critique: {artifact title or link}*

*Overall:* {1-2 sentences naming the single strongest signal}

*🔴 P0 — Must fix ({n})*
  • [{Category}] {Finding}
    — Evidence: {what's in the artifact}
    — Reference: {Plus doc path or component path}

*🟡 P1 — Should fix ({n})*
  • [{Category}] {Finding}
    — Evidence: {what's in the artifact}
    — Reference: {Plus doc path}

*🟢 P2 — Nice to have ({n})*
  • [{Category}] {Finding}

*✓ What's working ({n})*
  • {Specific strength + which doc/principle it matches}

— Reply in this thread to drill into any finding, or run `implement <component>` if you want me to apply the fixable items.
```

## Critique Discipline (skill-specific)

The shared bot voice from `AGENTS.md` applies (concrete-over-abstract, cite-everything, no snark, no apologies, generous about strengths). Critique-specific rules on top:

- **Evidence is mandatory per finding.** Every finding has a "Reference" line pointing to a Plus doc, component, or ADR. No exceptions — vague feelings are not findings.
- **Confidence floor.** If your confidence in a finding is low, omit it rather than pad it with hedging. Better to surface 3 strong findings than 7 mushy ones.
- **"What's working" is mandatory.** Always include 1-3 specific strengths with citations — designers need calibration on what to keep doing, not just what to fix.

## Forbidden in This Skill

- No findings without a doc/component/ADR citation. Vague feelings aren't critiques.
- No recommendations of non-Plus components or frameworks (no "use a Material UI Snackbar here").
- No business-logic critique ("the user flow should branch here") — escalate to Bill.
- No public posting if the originating message came from a private/DM channel.
- No multi-artifact comparisons in a single invocation.

## Edge Cases

- **Artifact unfetchable.** Reply: "I can't access that link. Can you share a screenshot or grant view access?" Then stop.
- **Figma desktop app not open.** Reply: "Figma MCP needs the desktop app open with the target frame selected. Want to share a screenshot instead, or open the file and re-run?"
- **Artifact too large.** Reply: "This frame has {n} sections — want me to run a high-level pass first, or focus on a specific area?"
- **No actionable findings.** Be honest: "I don't see anything that violates Plus conventions. What were you specifically worried about? I can drill in if you have a hunch."
- **User pushes back on a finding.** Re-read the cited doc. Either concede the finding was misapplied, or stand by it with reasoning. Don't dig in if the doc evidence is thin.
- **Artifact references a future Plus component that doesn't exist yet.** Flag as a P1: "This references `{ComponentName}` which isn't in the cheat sheet. Either I'm missing context or this is a net-new component proposal — clarify?"

## Sample Invocations

**Slack message:**
```
critique this Figma frame: https://figma.com/file/xyz/Tutor-Admin-v3
```

**Bot reply (threaded):**
```
🔍 Critique: Tutor Admin v3

Overall: Strong structural foundation. Two accessibility issues should
land before design review.

🔴 P0 — Must fix (2)
  • [Accessibility] Status indicator at top-right conveys state
    (success/warning/danger) via color alone.
    — Evidence: 3 colored dots, no icon or text label
    — Reference: docs/context/design-system/foundations/accessibility.md
      §"Color Contrast" — never rely on color alone
  • [Forbidden Pattern] Settings cog uses fa-light fa-gear.
    — Evidence: icon class visible in the inspect panel
    — Reference: AGENTS.md forbidden pattern #15 — FA Free only

🟡 P1 — Should fix (1)
  • [Terminology] Header reads "Tutor Sessions Overview"
    — Evidence: page title at top of frame
    — Reference: docs/context/conventions/terminology.md — use
      "Sessions" (not "tutor sessions")

✓ What's working (2)
  • PageLayout structure matches specs/Universal/Pages/PageLayout
  • Spacing uses semantic tokens throughout — saw --size-section-gap-md
    and --size-card-pad-x-lg in use

— Reply in this thread to drill into any finding, or run `implement
  TutorAdmin` if you want me to apply the fixable items.
```

**Slack message (focused):**
```
@uno-bot accessibility-only critique of prototype 1011
```

**Bot reply:**
```
🔍 Critique: Tutor Performance prototype (#1011) — accessibility focus

Overall: Two contrast issues, one keyboard reach problem.
[... structured as above, only accessibility findings ...]
```

## Cost Profile

Loading principles.md + cheat-sheet.md + AGENTS.md = ~5-7K tokens of system prompt (cached after first hit at 0.1× cost). When-relevant references add 2-5K more depending on focus. User input + artifact fetch ≈ 1-3K. Output ≈ 0.5-2K.

Estimated per-critique cost on Sonnet 4.6 after cache warm-up: **~$0.02-0.05**. Watch via §4.10 metrics scaffolding; if average cost climbs past $0.10, audit the reference loading for over-eager full-foundation pulls.

## TODO Before Production (Week 3)

- [ ] **Validation run:** Find the last 3-5 design-review threads in `#design` (or Plus's design channel). Run this skill against the same artifacts. Compare bot findings to what Bill/Ashley/Victor actually flagged. Target: ≥70% of human-flagged issues caught by the bot. If lower, tune the system prompt and the reference-loading heuristics.
- [ ] **Tone calibration:** Get Bill's read on the first 3-5 critiques. "Direct-but-respectful" is my call; he may prefer softer or sharper. (This is Decision #5 of the prep doc — confirm in the 1:1.)
- [ ] **"What's working" decision:** Default is "always include." If designers find it cloying after a week, make it opt-in via `--strengths` flag. Don't pre-optimize.
- [ ] **Gist threshold tuning:** 1500-char inline / Gist-for-longer is a guess. Measure average length after a week of use; adjust threshold based on what actually feels readable.
- [ ] **Figma MCP desktop-app fallback documentation:** the desktop-app dependency is a known limitation. Make sure the "share a screenshot" fallback is communicated clearly when onboarding designers to the skill.
- [ ] **Concurrency check:** if N designers request critiques simultaneously, Pipedream handles parallelism but cost spikes. Set a soft daily budget alert on §4.10 metrics.

## Related Skills

- **`uno-implement`** — after critique surfaces fixable issues, designer can pivot to `implement <component>` for the bot to apply the fix
- **`uno-assist`** (Week 4) — for "what should this look like?" questions, route to assist instead of critique. Critique evaluates what exists; assist explains what should exist.
