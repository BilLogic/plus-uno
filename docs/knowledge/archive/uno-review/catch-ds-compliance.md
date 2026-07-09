<!-- Load for: detecting DS compliance violations — hardcoded colors, raw HTML, deep imports, Bootstrap imports, inline styles -->

# Catch Patterns: Design System Compliance

Grep patterns for detecting common PLUS convention violations. These are used by the `run-review-checks.sh` script and can be run manually.

## Hardcoded hex colors
Files should use design tokens (`var(--color-*)`) instead of raw hex values.
```bash
grep -rn '#[0-9a-fA-F]\{3,8\}' --include="*.jsx" --include="*.scss" --include="*.css" <dir>
```
**Exceptions:** Comments, SVG fill values that intentionally override tokens.

## Hardcoded colors (named CSS colors in inline styles)
```bash
grep -rn "color:\s*['\"]\\(red\\|blue\\|green\\|white\\|black\\|gray\\|grey\\)" --include="*.jsx" <dir>
```

## Raw HTML elements (should be DS components)
```bash
grep -rn '<button\|<input\|<select\|<textarea' --include="*.jsx" <dir>
```
**Exceptions:** Inside DS component source files themselves.

## Deep imports bypassing barrel exports
```bash
grep -rn "from 'design-system/src/" --include="*.jsx" --include="*.js" <dir>
```
Should use `@/` or `@plus-ds/` aliases instead.

## Direct Bootstrap imports instead of DS components
```bash
grep -rn "from 'react-bootstrap" --include="*.jsx" --include="*.js" <dir>
```
Should import from `@/components/` which wraps Bootstrap with DS styling.

## Inline styles that should use tokens
```bash
grep -rn "style={{" --include="*.jsx" <dir> | grep -E "(padding|margin|gap|fontSize|borderRadius):\s*['\"]?[0-9]+(px|rem|em)"
```
Numeric values should use `var(--size-*)` or `var(--font-*)` tokens.

## How to Use

Run against a specific directory:
```bash
bash .agent/skills/uno-review/scripts/run-review-checks.sh playground/my-project/src
```

Or manually against the full design system:
```bash
grep -rn '#[0-9a-fA-F]\{3,8\}' --include="*.jsx" --include="*.scss" design-system/src/
```
