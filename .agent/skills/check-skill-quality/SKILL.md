---
name: check-skill-quality
description: >
  Audits one or multiple skill folders against a strict quality checklist and
  returns actionable fixes with code locations, original snippets, and concrete
  rewrite suggestions. Use when the user asks to review skill quality, audit
  SKILL.md files, compare skills against best practices, or validate readiness
  before publishing skill updates.
user-invocable: true
argument-hint: [skill-path-or-folder]
allowed-tools: Read, Grep, Glob, Write
---

# Check Skill Quality

Run a strict quality audit for one or more skills using a fixed checklist based on skill best practices.

## When to Use

- The user asks to audit a skill's quality or completeness
- The user asks "is this skill well-written?" or "check this skill against best practices"
- Multiple skills need consistent quality checks before refactor or release
- The user wants concrete improvement suggestions, not high-level comments

## Not for Use

- Writing or implementing product features unrelated to skill docs
- Code debugging tasks unrelated to skill-definition quality
- Minor typo-only proofreading without structural quality review

## Inputs

Accept one of the following:
- A single skill folder path (for example `.agent/skills/uno-plan/`)
- Multiple skill folders
- A parent skills folder (audit all child skill folders containing `SKILL.md`)

If input is ambiguous, ask the user to confirm target paths before auditing.

## Required References

Read these references before evaluating:
- `references/checklist.md` (authoritative checklist and scoring rules)
- `references/output-template.md` (required report structure)

Optional examples for report tone and structure:
- `/Users/cynthialu/Downloads/Skill_Audit_-_Uno_Research.pdf`
- `/Users/cynthialu/Downloads/Skill_Audit_-_Uno_Plan.pdf`

## Workflow

### Step 1: Resolve Audit Targets

1. Expand user input into concrete skill folders.
2. Include folders only if they contain `SKILL.md`.
3. For each target, also load referenced docs under its `references/` folder when relevant.

### Step 2: Load Skill Materials

For each skill:
1. Read `SKILL.md`.
2. Collect linked references explicitly mentioned in the file (for context design and maintainability checks).
3. Record metadata from frontmatter: `name`, `description`, optional flags, and tool declarations.

### Step 3: Evaluate Against the 9 Sections

Apply every checklist item in `references/checklist.md`:
1. Skill Definition
2. Scope
3. Instructions
4. Output Structure
5. Context Design
6. Workflow Value
7. Trigger -> Action Mapping
8. Scalability & Maintainability
9. Failure Handling

For each item, mark:
- `Pass`: requirement is clearly satisfied
- `Partial`: partially satisfied or ambiguous
- `Fail`: missing or clearly violated

### Step 4: Collect Evidence

For each `Partial` or `Fail`, capture:
- File path
- Relevant section heading
- Original snippet (minimal lines needed for proof)
- Why it fails the checklist item
- Concrete improvement suggestion

Do not provide generic advice without evidence.

### Step 5: Produce Improvement Drafts

For each issue, provide:
- A precise suggestion sentence
- A suggested rewrite snippet the user can apply

Keep rewrites scoped to the issue. Do not redesign the entire skill unless requested.

## Output

Always use the exact structure in `references/output-template.md`.

Minimum requirements per issue:
- Checklist section and item ID
- Severity (`High`, `Medium`, `Low`)
- Code location
- Original code
- Why it is a problem
- Specific improvement suggestion
- Suggested rewrite

When auditing multiple skills, include:
1. Per-skill reports
2. A cross-skill consistency summary
3. A prioritized fix list (highest impact first)

## Failure Handling

- If no valid skill folder is found: explain what was searched and ask for explicit target path(s).
- If `SKILL.md` exists but referenced files are missing: continue audit, mark maintainability/context risk, and report missing files.
- If evidence is insufficient for a hard judgment: mark `Partial` and state what additional file would confirm.
- If checklist item does not apply: mark `N/A` with a short reason.

## Guardrails

- Never invent file content; cite only text actually found.
- Keep findings scoped to the checklist.
- Prefer concrete rewrite proposals over abstract recommendations.
- Keep terminology consistent across all audited skills.
