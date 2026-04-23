# Skill Quality Audit Workflow (Embedded in uno-review)

Use this workflow when the review target is skill documentation.

## Inputs

Accept one of:
- Single skill folder path
- Multiple skill folder paths
- A parent folder containing skill folders

If inputs are ambiguous, ask for explicit target paths before continuing.

## Step 1: Resolve Targets

1. Expand input into concrete folders.
2. Keep only folders containing `SKILL.md`.
3. If no valid folders remain, report searched paths and stop.

## Step 2: Load Materials

For each target skill:
1. Read `SKILL.md`.
2. Read directly referenced docs needed to evaluate checklist compliance.
3. Capture frontmatter metadata (`name`, `description`, flags, tools).

## Step 3: Evaluate Checklist

Use `references/skill-quality/checklist.md` as the only scoring authority.

Per checklist item, assign one status:
- `Pass`
- `Partial`
- `Fail`
- `N/A` (include reason)

## Step 4: Capture Evidence

For each `Partial` or `Fail`, include:
- Specific problem
- Code location
- Original snippet
- Why it violates checklist criteria
- Improvement suggestion
- Suggested revised code
- Priority (`P0`, `P1`, `P2`)

## Step 5: Produce Report

Use `references/skill-quality/output-template.md` exactly.

When auditing multiple skills:
1. Include per-skill findings
2. Add cross-skill consistency summary
3. Add a prioritized fix plan

## Failure Handling

- Missing target skills: ask user for explicit paths.
- Missing referenced docs: continue audit and log maintainability risk.
- Insufficient evidence: mark `Partial` and list additional evidence needed.
