<!-- ~150 tokens | Load for: shared baseline context, terminology, context-level heuristic -->

# Foundations Guide

## When to Load
- Load this for shared baseline context before deep implementation work.
- For exhaustive foundation lookup data (commands, key paths, context levels, terminology), load `.agent/assets/foundations-index.json`.

## Shared Baseline Rules
- Use repository terminology consistently (element/card/section/table/modal/spec).
- Identify context level first, then choose matching semantic token layer.
- Keep command and tool usage aligned with current `package.json` scripts and Storybook config.

## Context-Level Heuristic
- Element -> `--size-element-*`
- Card -> `--size-card-*`
- Section -> `--size-section-*`
- Table -> `--size-table-*`
- Modal -> `--size-modal-*`

## Communication Heuristic
- Cite concrete files for recommendations.
- Ask for clarification when multiple component families are equally plausible.
