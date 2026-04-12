---
date: 2026-03-25
topic: skill-documentation-revision
focus: Revise existing .agent/skills/ documentation against skill authoring best practices
---

# Ideation: Skill Documentation Revision

## Codebase Context

**Current Skills (4 in `.agent/skills/`):**

| Skill | Lines | references/ | examples/ | scripts/ | assets/ |
|-------|-------|-------------|-----------|----------|---------|
| uno-post | 110 | marketplace-schema.md | marketplace-entry-example.md | — | — |
| uno-prototype | 69 | template-selection-guide.md | vite-config-example.js | validate-prototype.sh | — |
| uno-compound | 72 | escalation-rules.md, solution-doc-guide.md, solution-schema.md | solution-doc-template.md | — | — |
| uno-review | 65 | catch-ds-compliance.md, catch-patterns.md, catch-structural.md | — | run-review-checks.sh | — |

**Best Practices (from Anthropic skill guide + past learnings):**
- Description field: "what it does" + "when to use it" with specific trigger phrases users actually say
- SKILL.md body: keep under 80 lines (past learning), under 500 lines (Anthropic spec)
- references/: prose knowledge the agent reads into context on demand
- examples/: working, copyable code — templates, configs, sample outputs
- scripts/: operational utilities the agent runs via Bash — deterministic, token-efficient
- assets/: output artifacts used in output but NOT read into context (images, templates, scaffolds)
- Skills should declare when the agent should proactively suggest them (auto-suggest conditions)
- Skills should declare what comes next in the pipeline (Next Step)
- Destructive or externally-visible skills need explicit human confirmation gates

## Audit: What's Good

1. **uno-post** has excellent trigger phrases in description: "submit", "publish", "add to market"
2. **uno-post** has a human gate (confirmation template before writing)
3. **uno-prototype** properly uses all 3 subdirectories: references/ (prose), examples/ (copyable config), scripts/ (validator)
4. **uno-review** has a real, runnable script that produces PASS/WARN/FAIL output
5. **uno-compound** has well-structured references split into escalation rules, schema, and guide
6. All skills use YAML frontmatter with `name`, `description`, `user-invocable`, `argument-hint`
7. All skills follow a phase-gated structure

## Ranked Ideas

### 1. Add Auto-Suggest Conditions to Every Skill

**Description:** Each SKILL.md should declare when the agent should proactively suggest this skill — without the user explicitly asking. This is the key mechanism for "skills the agent uses automatically." Add a `## Auto-Suggest` section to each skill with concrete conditions any agent can evaluate.

**Concrete changes:**

```markdown
# uno-review
## Auto-Suggest
Suggest this skill when:
- The user says "done", "finished", "ready to ship", or "looks good"
- Before any git commit that touches files under playground/ or design-system/src/specs/
- Before the user invokes /uno:post

# uno-compound
## Auto-Suggest
Suggest this skill when:
- The conversation involved fixing a bug or resolving an error
- The user discovered a gotcha or unintuitive behavior
- Significant code changes were made (>3 files modified)
- The session is ending after non-trivial work

# uno-post
## Auto-Suggest
Suggest this skill when:
- /uno:review returned PASS on a prototype
- The user says "publish", "submit", "list", or "add to market"
Never auto-invoke — always require explicit user confirmation.

# uno-prototype
## Auto-Suggest
Suggest this skill when:
- The user wants to explore a new feature idea
- The user mentions creating a new prototype or proof-of-concept
- A new playground project needs to be set up
```

**Rationale:** All 4 skills are currently invisible until the user types the exact slash command. Adding auto-suggest conditions means any agent (Claude, Cursor, Windsurf) can proactively offer the right skill at the right moment. This is platform-agnostic — it's just markdown instructions.
**Downsides:** Risk of over-suggesting. Include "suggest once, don't repeat if declined" guidance.
**Confidence:** 95%
**Complexity:** Low
**Status:** Unexplored

### 2. Add Next Step Directives (Skill Pipeline)

**Description:** Each skill should declare what typically comes next, so the agent knows the recommended workflow sequence. Add a `## Next Step` section to each SKILL.md.

**Concrete changes:**

```markdown
# uno-prototype → after Phase 5
## Next Step
After completing the prototype:
→ Suggest /uno:review to check DS compliance before shipping.
  Pass the prototype's directory path as the argument.

# uno-review → after output
## Next Step
- If PASS → Suggest /uno:post to register in the marketplace.
- If WARN or FAIL → Help fix violations, then re-run review.
- After fixing violations → Suggest /uno:compound to document the lesson.

# uno-post → after submission
## Next Step
→ Suggest /uno:compound if anything non-trivial was learned during the build.

# uno-compound → (terminal skill)
## Next Step
None — this is the end of the pipeline.
Optionally suggest committing the solution doc.
```

**Rationale:** The 4 skills already form a natural pipeline (prototype→review→post→compound) but it's implicit. Making it explicit in each SKILL.md means any agent follows the chain.
**Downsides:** Can feel prescriptive. Add "These are suggestions — the user may choose to skip steps."
**Confidence:** 90%
**Complexity:** Low
**Status:** Unexplored

### 3. Improve Description Fields with Better Trigger Phrases

**Description:** The `description` frontmatter field drives skill discovery. Three of four skills have weak descriptions that don't include the phrases users actually say.

**Concrete changes:**

```yaml
# uno-prototype (currently generic)
# Before:
description: >
  Scaffold and build a new playground prototype using the PLUS design system.
  Use when creating new feature prototypes, experiments, or proof-of-concepts.

# After:
description: >
  Scaffold a new playground prototype with proper PLUS design system integration.
  Use when the user asks to "create a prototype", "scaffold a new project",
  "set up a playground", "build a proof-of-concept", or "start a new experiment".

# uno-compound (currently generic)
# Before:
description: >
  Document a solution or learning from work just completed. Creates a searchable
  solution doc in docs/solutions/ and updates agent-context docs if patterns emerge.

# After:
description: >
  Document a solution or learning from work just completed. Creates a searchable
  solution doc in docs/solutions/. Use when the user says "document this",
  "write it up", "save this learning", "compound", or after fixing a non-trivial
  bug, discovering a gotcha, or making a design decision worth preserving.

# uno-review (currently generic)
# Before:
description: >
  Quality gate before shipping. Reviews work against PLUS conventions,
  forbidden patterns, and design system rules.

# After:
description: >
  Quality gate before shipping. Reviews work against PLUS conventions,
  forbidden patterns, and design system rules. Use when the user asks to
  "review my work", "check this", "run quality checks", "validate before shipping",
  or before committing significant UI changes or submitting to the marketplace.
```

**Rationale:** Better descriptions mean better discovery across all agent platforms. The description is the single most important metadata field for skill triggering.
**Downsides:** Longer descriptions consume slightly more context when indexed. Keep under 1024 chars.
**Confidence:** 95%
**Complexity:** Low
**Status:** Unexplored

### 4. Slim Down SKILL.md Files — Move Content to Proper Subdirectories

**Description:** Several SKILL.md files contain content that belongs in references/, examples/, or scripts/. Apply the "SKILL.md under 80 lines" guideline from past learnings.

**Concrete changes:**

| Skill | What to move | From | To |
|-------|-------------|------|-----|
| uno-post | Deployment help section (lines 43-58) | SKILL.md Phase 2 | references/deployment-guide.md |
| uno-post | Confirmation template (lines 67-93) | SKILL.md | examples/entry-template.js |
| uno-review | Grep commands (lines 48-57) | SKILL.md | Already in scripts/run-review-checks.sh — remove from SKILL.md, just reference the script |
| uno-compound | Escalation table (lines 60-68) | SKILL.md Step 3 | Already in references/escalation-rules.md — remove duplicate from SKILL.md |
| uno-prototype | Scaffold directory structure (lines 36-46) | SKILL.md Phase 2 | assets/scaffold-template/ (actual template files the agent copies) |

**Rationale:** Lean SKILL.md files load faster, stay focused, and follow the established convention. Content in the right subdirectory gets the right treatment (references → read on demand, scripts → executed, assets → copied).
**Downsides:** More files to navigate. Mitigated by clear "Load for:" headers in each reference file.
**Confidence:** 85%
**Complexity:** Low
**Status:** Unexplored

### 5. Add Human Gate to uno-compound Pattern Escalation

**Description:** uno-compound Step 3 ("Check for Pattern Escalation") instructs the agent to modify AGENTS.md, conventions.md, terminology.md, and PLUS_CHEAT_SHEET.md if patterns emerge. This is a self-modifying instruction set with no human approval gate. Add an explicit confirmation step.

**Concrete change:**

```markdown
### 3. Check for Pattern Escalation

Ask: Should this learning update broader docs?

| If... | Then propose update to... |
|-------|--------------------------|
| New forbidden pattern | `AGENTS.md` forbidden patterns section |
| New gotcha | `docs/project/conventions.md` gotchas table |
| Terminology confusion | `docs/foundations/terminology.md` |
| Component API surprise | `.agent/assets/PLUS_CHEAT_SHEET.md` |

**GATE: Show the proposed change and wait for explicit user approval before modifying any agent instruction file.** These files govern agent behavior across all future sessions — changes must be intentional.
```

**Rationale:** The agent instruction system is its own codebase. Unreviewed modifications to AGENTS.md or the cheat sheet could alter agent behavior for all future sessions across all platforms. A human gate ensures intentional changes.
**Downsides:** Adds friction to the compound workflow. But given the blast radius, this friction is warranted.
**Confidence:** 90%
**Complexity:** Low
**Status:** Unexplored

### 6. Add examples/ to uno-review (Sample Review Output)

**Description:** uno-review is the only skill without an examples/ folder. Add `examples/review-output-example.md` showing what a well-formatted PASS, WARN, and FAIL review looks like. This gives agents a concrete template for presenting findings.

**Rationale:** The current SKILL.md says "Present findings as Pass/Warn/Fail" but doesn't show what that looks like. An example makes the output format concrete and consistent across agents.
**Downsides:** Minor — one new file.
**Confidence:** 80%
**Complexity:** Low
**Status:** Unexplored

### 7. Add Skill Manifest to SKILL.md Router

**Description:** The `.agent/SKILL.md` router currently lists 4 skills in a markdown table. Enhance this to include auto-suggest conditions and pipeline position, so the router serves as a discoverable skill manifest any agent (or future UI) can parse.

**Concrete change:**

```markdown
## Skills

| Skill | Trigger | Auto-Suggest When | Next Step | Side Effects |
|-------|---------|-------------------|-----------|--------------|
| [uno-prototype](skills/uno-prototype/SKILL.md) | "scaffold", "new prototype" | User wants to explore a new feature | → uno-review | Creates files |
| [uno-review](skills/uno-review/SKILL.md) | "review", "check", "validate" | Before commit, before uno-post | → uno-post (pass) / fix + compound (fail) | Read-only |
| [uno-post](skills/uno-post/SKILL.md) | "submit", "publish", "add to market" | After uno-review passes | → uno-compound | Writes data file |
| [uno-compound](skills/uno-compound/SKILL.md) | "document", "write up", "compound" | After significant work, after bug fix | Terminal | Writes docs, may propose instruction edits |
```

**Rationale:** This table becomes the single reference for skill discovery, pipeline order, and auto-suggestion. Any agent reads it once and understands the full skill system. A future "+" button UI could render this table directly. The "Side Effects" column helps agents decide what to suggest vs. what to avoid auto-invoking.
**Downsides:** Table gets wide. Could split into two tables (triggers + pipeline).
**Confidence:** 85%
**Complexity:** Low
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Move skills to .claude/commands/ | Platform-specific. Skills stay in .agent/skills/ for cross-agent compatibility. |
| 2 | Add context: fork to skills | Claude Code-specific frontmatter. Platform-agnostic skills don't use it. |
| 3 | Add allowed-tools to skills | Claude Code-specific frontmatter. |
| 4 | Add model override to skills | Claude Code-specific frontmatter. |
| 5 | Convert grep patterns to structured JSON schema | Over-engineering. Bash scripts work across all platforms. |
| 6 | Create new skills (uno-figma, uno-sync) | Out of scope — this ideation focuses on revising existing skills, not creating new ones. |

## Recommended Execution Order

```
Phase 1 (Quick wins):     #3 Improve descriptions  →  #5 Human gate for compound
Phase 2 (Structure):      #4 Slim down SKILL.md    →  #6 Add review examples
Phase 3 (Auto-suggest):   #1 Auto-suggest conditions → #2 Next Step directives → #7 Skill manifest
```

Phase 1 is pure text edits to frontmatter and one section. Phase 2 moves content between files. Phase 3 adds new sections to every skill.

## Session Log
- 2026-03-25: Initial ideation — audited 4 skills against best practices. Identified 7 improvements focused on auto-suggest conditions, pipeline contracts, description quality, content placement, human gates, and skill discovery manifest. All improvements are platform-agnostic markdown changes to .agent/skills/ files. User corrected prior Claude Code-specific bias.
