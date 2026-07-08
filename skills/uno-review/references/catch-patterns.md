<!-- Load for: reviewing coded artifacts — the grep checks behind ds-lens findings. Automated by scripts/run-review-checks.sh; run individually to localize a hit. -->

# Catch patterns — coded artifacts

Grep checks for the mechanical share of DS-compliance findings. Each maps to an AGENTS.md forbidden pattern (FP-n) — the rule lives there, not here. Output is **evidence for ds-lens findings**, not a verdict: hits still need the severity + reference + re-entry treatment from `method.md`.

Run all at once:

```bash
bash skills/uno-review/scripts/run-review-checks.sh <target-dir>
```

Sample output: `../examples/review-output-example.md`.

## Hardcoded hex colors (FP-1)

```bash
grep -rn '#[0-9a-fA-F]\{3,8\}' --include="*.jsx" --include="*.scss" --include="*.css" <dir>
```

Use `var(--color-*)` tokens. Exceptions: comments, SVG fills that intentionally override tokens.

## Hardcoded sizes in inline styles (FP-1)

```bash
grep -rn "style={{" --include="*.jsx" <dir> | grep -E "(padding|margin|gap|fontSize|borderRadius):\s*['\"]?[0-9]+(px|rem|em)"
```

Use `var(--size-*)` / `var(--font-*)` tokens.

## Raw HTML elements where DS components exist (FP-2, FP-6)

```bash
grep -rn '<button\|<input\|<select\|<textarea' --include="*.jsx" <dir>
```

Exception: inside DS component source files themselves.

## Deep imports bypassing barrel exports (FP-10)

```bash
grep -rn "from 'design-system/src/" --include="*.jsx" --include="*.js" <dir>
```

Use the `@/` / `@plus-ds/` aliases.

## Direct react-bootstrap imports (FP-6)

```bash
grep -rn "from 'react-bootstrap" --include="*.jsx" --include="*.js" <dir>
```

Import the PLUS wrapper from `@/components/` instead.

## Font Awesome Pro icons (FP-15)

```bash
grep -rn 'fa-light\|fa-thin\|fa-sharp\|fa-duotone' --include="*.jsx" --include="*.html" <dir>
```

Only FA Free: `fa-solid`, `fa-regular`, `fa-brands`.

## Missing key prop in .map()

```bash
grep -rn '\.map(' --include="*.jsx" -A 3 <dir> | grep -B 1 '<' | grep -v 'key='
```

Every element returned from `.map()` needs a unique `key`.
