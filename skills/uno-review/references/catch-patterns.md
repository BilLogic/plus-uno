---
embodiment: ide
summary: Grep checks for the mechanical share of DS-compliance findings
---

<!-- Load for: reviewing coded artifacts — the grep checks behind ds-lens findings. Automated by scripts/run-review-checks.sh; run individually to localize a hit. -->

# Catch patterns — coded artifacts

Grep checks for the mechanical share of DS-compliance findings. Each maps to a NAMED AGENTS.md forbidden pattern — cited by name, never by number, because the list renumbers (2026-07-30); the rule lives there, not here. Output is **evidence for ds-lens findings**, not a verdict: hits still need the severity + reference + re-entry treatment from `method.md`.

Run all at once:

```bash
bash skills/uno-review/scripts/run-review-checks.sh <target-dir>
```

Sample output: `../examples/review-output-example.md`.

## Hardcoded hex colors (the tokens-over-literals rule)

```bash
grep -rn '#[0-9a-fA-F]\{3,8\}' --include="*.jsx" --include="*.scss" --include="*.css" <dir>
```

Use `var(--color-*)` tokens. Exceptions: comments · SVG fills that intentionally override tokens · `var(--token, #hex)` fallback values (the token is the source; the hex is a safety net) · pre-mount crash/error screens that render before the token sheet loads.

## Hardcoded sizes in inline styles (the tokens-over-literals rule)

```bash
grep -rn "style={{" --include="*.jsx" <dir> | grep -E "(padding|margin|gap|fontSize|borderRadius):\s*['\"]?[0-9]+(px|rem|em)"
```

Use `var(--size-*)` / `var(--font-*)` tokens.

## Raw HTML elements where DS components exist (the DS-knowledge-is-law and PLUS-components-first rules)

```bash
grep -rn '<button\|<input\|<select\|<textarea' --include="*.jsx" <dir>
```

Exception: inside DS component source files themselves.

## Deep imports bypassing barrel exports (the no-deep-imports rule)

```bash
grep -rn "from 'design-system/src/" --include="*.jsx" --include="*.js" <dir>
```

Use the `@/` / `@plus-ds/` aliases.

## Direct react-bootstrap imports (the PLUS-components-first rule)

```bash
grep -rn "from 'react-bootstrap" --include="*.jsx" --include="*.js" <dir>
```

Import the PLUS wrapper from `@/components/` instead.

## Font Awesome Pro icons (the FA-Free-only rule)

```bash
grep -rn 'fa-light\|fa-thin\|fa-sharp\|fa-duotone' --include="*.jsx" --include="*.html" <dir>
```

Only FA Free: `fa-solid`, `fa-regular`, `fa-brands`.

## Missing key prop in .map()

```bash
grep -rn '\.map(' --include="*.jsx" -A 3 <dir> | grep -B 1 '<' | grep -v 'key='
```

Every element returned from `.map()` needs a unique `key`.
