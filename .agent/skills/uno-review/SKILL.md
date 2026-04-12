---
name: uno-review
description: >
  Quality gate before shipping. Reviews work against PLUS conventions,
  forbidden patterns, and design system rules. Use when the user asks to
  "review my work", "check this", "run quality checks", "validate before
  shipping", or before committing significant UI changes or submitting
  to the marketplace.
user-invocable: true
argument-hint: [files-or-description]
---

# Quality Review

Review work against PLUS conventions before shipping.

## When to Use

- Before committing significant UI work
- Before submitting a prototype to marketplace
- When unsure if implementation follows DS patterns
- As a final check before a PR

## Auto-Suggest

Proactively suggest this skill when:
- The user says "done", "finished", "ready to ship", or "looks good"
- Before any git commit that touches files under `playground/` or `design-system/src/specs/`
- Before the user invokes `/uno:post` (review should precede publishing)
- After completing work in Prototyping or Finalization mode

Suggest once per work session — do not repeat if declined.

## Checklist

### Design System Compliance

- [ ] **No hardcoded values** — grep for hex colors (`#[0-9a-fA-F]`), px values in inline styles
- [ ] **Using DS components** — no raw `<button>`, `<input>`, `<div className="card">` when PLUS equivalents exist
- [ ] **Correct imports** — using `@/` alias, not deep paths into `design-system/src/`
- [ ] **Token-driven styling** — CSS variables from token system, not literal values
- [ ] **Props match source** — all component props verified against `.jsx` source files

### Layout & Structure

- [ ] **PageLayout used** — pages use `<PageLayout>` from specs/Universal
- [ ] **Context levels respected** — Elements → Cards → Sections → Pages (no skipping)
- [ ] **Responsive** — works at standard breakpoints

### Conventions

- [ ] **File naming** — PascalCase components, kebab-case directories
- [ ] **PLUS terminology** — no generic web terms (see `docs/context/conventions/terminology.md`)
- [ ] **Storybook validated** — stories render correctly if component behavior was touched
- [ ] **No new dependencies** — unless explicitly approved

### Forbidden Pattern Scan

Run the automated review script:

```bash
bash .agent/skills/uno-review/scripts/run-review-checks.sh <target-dir>
```

For individual grep patterns, see `references/catch-ds-compliance.md`.

## Output

Present findings as (see `examples/review-output-example.md` for format):
- **Pass** — no violations found
- **Warn** — minor issues, can ship with notes
- **Fail** — violations that must be fixed before shipping

## Next Step

- If **Pass** → Suggest `/uno:post` to register the prototype in the marketplace.
- If **Warn** → Note the issues, then suggest `/uno:post` if the user wants to ship with notes.
- If **Fail** → Help fix violations, then re-run the review.
- After fixing violations → Suggest `/uno:compound` to document what was learned.

These are suggestions — the user may choose to skip steps.
