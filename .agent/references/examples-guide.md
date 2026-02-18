# Examples Guide

## When to Load
- Load this when you need selection strategy for “which example should I mirror.”
- For exhaustive story/spec/template locations, load `.agent/assets/examples-index.json`.

## Example Selection Workflow
1. Start with nearest component story example.
2. If implementing page-level behavior, check matching `specs/**` composition.
3. If still exploratory, compare playground prototypes/templates.
4. Copy structure and interaction model, then replace visual values with tokens.

## Guardrails
- Do not treat exploratory prototypes as source-of-truth over DS components/specs.
- Keep imports and state handling aligned with the selected authoritative example.
