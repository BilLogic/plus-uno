<!-- ~200 tokens | Load for: implementation guardrails, pattern rules, and example selection -->

# Implementation Guide

## When to Load
- Load this when choosing an implementation approach or selecting an example to mirror.
- For exhaustive pattern catalog and file references, load `.agent/skills/uno-research/references/patterns-index.json`.
- For exhaustive story/spec/template locations, load `.agent/skills/uno-prototype/references/examples-index.json`.

## Core Pattern Rules
- Use tokens over literals.
- Prefer PLUS components/specs before generic framework primitives.
- Keep Storybook coverage in sync with behavior/state changes.
- Fetch design context first when implementing from design tooling.
- Verify responsive behavior and critical interactive states before finalization.

## Example Selection Workflow
1. Start with nearest component story example.
2. If implementing page-level behavior, check matching `specs/**` composition.
3. If still exploratory, compare playground prototypes/templates.
4. Copy structure and interaction model, then replace visual values with tokens.

## Guardrails
- Do not treat exploratory prototypes as source-of-truth over DS components/specs.
- Keep imports and state handling aligned with the selected authoritative example.
- If a pattern choice is ambiguous, cite two valid alternatives and ask for a directional decision.
