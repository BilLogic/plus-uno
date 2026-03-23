---
name: po-review
description: >
  Quality gate before shipping. Reviews work against PLUS conventions,
  forbidden patterns, and design system rules.
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
- [ ] **PLUS terminology** — no generic web terms (see `docs/foundations/terminology.md`)
- [ ] **Storybook validated** — stories render correctly if component behavior was touched
- [ ] **No new dependencies** — unless explicitly approved

### Forbidden Pattern Scan

Run these greps to catch violations:

```bash
# Hardcoded hex colors
grep -rn '#[0-9a-fA-F]\{3,8\}' --include="*.jsx" --include="*.scss" design-system/src/

# Raw HTML elements that should be DS components
grep -rn '<button\|<input\|<select\|<textarea' --include="*.jsx" design-system/src/specs/

# Deep imports bypassing barrel
grep -rn "from 'design-system/src/" --include="*.jsx" --include="*.tsx" .
```

## Output

Present findings as:
- **Pass** — no violations found
- **Warn** — minor issues, can ship with notes
- **Fail** — violations that must be fixed before shipping
