---
embodiment: ide
summary: The mechanical share of DS-compliance findings — check:ds-usage for escapes, two greps for what it does not cover
---

<!-- Load for: reviewing coded artifacts — the mechanical checks behind ds-lens findings. scripts/run-review-checks.sh runs the checker and the raw-HTML grep; the .map() key grep runs by hand. -->

# Catch patterns — coded artifacts

The mechanical share of DS-compliance findings. Output is **evidence for ds-lens**, which turns it into findings in its own shape (`agents/reviewers/ds-lens.md` § Finding shape).

`bash skills/uno-review/scripts/run-review-checks.sh <target-dir>` runs the checker and the raw-HTML grep in one pass, the pre-flight `uno-prototype` uses; in a review, ds-lens runs the checker itself.

Sample output: `../examples/review-output-example.md`.

## Escapes: `check:ds-usage`

```bash
npm run check:ds-usage -- <dir> --json
```

One checker owns every escape (ADR-039): unknown components, deep imports, unknown props and enum values, raw colors, sizes and fonts, unknown and primitive tokens, Font Awesome Pro, retired names. Each finding names its rule ID and what to write instead; the rules, and what each one passes (a `var()` fallback, `0`, unitless numbers), are `docs/engineering/ds-usage-rules.md`.

## Raw HTML controls where DS components exist (the PLUS-components-first rule)

```bash
grep -rn '<button\|<input\|<select\|<textarea' --include="*.jsx" <dir>
```

Exception: inside DS component source files themselves. A hit is evidence for judgement: ds-lens checks whether a PLUS component fits.

## Missing key prop in .map()

```bash
grep -rn '\.map(' --include="*.jsx" -A 3 <dir> | grep -B 1 '<' | grep -v 'key='
```

Every element returned from `.map()` needs a unique `key`.

## Disabled states and slot names

```bash
grep -rnE 'isDisabled|disabled[=}]|trailing=|leading=' --include="*.jsx" <dir>
```

A hit is evidence for judgement against
`design-system/guidelines/composition/form-behavior.md` § Unavailable actions
and fields (explain on press) and `docs/engineering/coding.md` § Slot names.
