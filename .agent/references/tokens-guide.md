# Tokens Guide

## When to Load
- Load this for token-application rules and decision-making.
- For exact token file paths, source JSON, sync scripts, and env vars, load `.agent/assets/tokens-index.json`.

## Non-Negotiable Rules
- Never hardcode colors, spacing, typography, radius, or elevation when a token exists.
- Choose semantic layer first (element/card/section/modal/table), then pick token.
- Use primitives only for token-definition work, not feature implementation.

## Quick Usage Pattern
- Correct: `var(--color-*)`, `var(--size-*)`, `var(--font-*)`, `var(--elevation-*)`
- Incorrect: hex literals, px literals, ad hoc shadow/radius values in feature code.

## Maintenance Rule
- If token naming/values change via sync, update docs and references that depend on those names.
