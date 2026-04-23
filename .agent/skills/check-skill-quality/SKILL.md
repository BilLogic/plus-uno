---
name: check-skill-quality
description: >
  Audit one or multiple skill folders against a strict quality checklist,
  then produce prioritized, evidence-based rewrite recommendations with
  original snippets and suggested replacement code.
user-invocable: true
argument-hint: [skill-folder-or-parent-folder]
allowed-tools: Read, Grep, Glob, Write
---

# Check Skill Quality

Run a strict quality audit for one or more skills and produce concrete fixes.

## When to Use

- The user asks to evaluate one or more skills against best practices
- The user asks whether a `SKILL.md` is "good enough" for release
- The user asks for actionable rewrite suggestions instead of general feedback
- Multiple skills need a consistent, checklist-driven quality baseline

## Trigger Keywords

- "check skill quality"
- "audit skill"
- "review SKILL.md"
- "validate skill against checklist"
- "improve skill definition"

## Not for Use

- Writing product features unrelated to skill documentation
- Debugging runtime application code
- Pure copy-editing requests without structural quality checks

## Inputs

Accept one of the following:
- A single skill folder path (for example `.agent/skills/uno-plan/`)
- Multiple skill folder paths
- A parent folder containing many skills

If target paths are ambiguous, ask for confirmation before auditing.

## Required References

Read these files before evaluation:
- `references/checklist.md`
- `references/output-template.md`
- `references/audit-examples.md`

## Workflow

### Step 1: Resolve Targets

1. Expand the user input into concrete folder paths.
2. Keep only folders that contain `SKILL.md`.
3. If none are found, stop and request explicit paths.

### Step 2: Load Skill Materials

For each target skill:
1. Read `SKILL.md`.
2. Read linked reference files that are directly relevant to checklist judgment.
3. Capture metadata in frontmatter (`name`, `description`, flags, tools).

### Step 3: Evaluate Against the 9 Checklist Sections

Use `references/checklist.md` as the single scoring authority.

For each checklist item, assign one:
- `Pass` (clearly satisfied)
- `Partial` (ambiguous or partially satisfied)
- `Fail` (missing or clearly violated)
- `N/A` (not applicable, with a short reason)

### Step 4: Collect Evidence for Every Non-Pass Item

For each `Partial` or `Fail`, include:
- Precise issue statement
- File path and section
- Original snippet (minimal but sufficient proof)
- Why the issue violates checklist criteria
- Suggested improvement
- Suggested replacement snippet
- Priority (`P0`, `P1`, `P2`)

### Step 5: Generate Structured Report

Follow `references/output-template.md` exactly.

When auditing multiple skills:
1. Produce a full section per skill
2. Add cross-skill consistency findings
3. Add prioritized global fix plan

## Output Requirements

Every issue entry must contain:
- Specific problem
- Original code
- Improvement recommendation
- Suggested revised code
- Priority and impact rationale

Avoid generic advice that lacks direct file evidence.

## Failure Handling

- If no valid skill folder is found: report searched paths and request explicit inputs.
- If referenced files are missing: continue audit and log maintainability risk.
- If evidence is insufficient for strict fail: mark `Partial` and specify missing evidence.
- If checklist item is irrelevant: mark `N/A` with one-line reason.

## Guardrails

- Never invent file contents.
- Keep findings scoped to checklist criteria.
- Prefer precise rewrites over abstract comments.
- Keep language and scoring consistent across all audited skills.
