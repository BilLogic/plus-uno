<!-- ~150 tokens | Load for: example selection when mirroring existing code -->

# Implementation — Example Selection

Load when choosing which existing code to mirror. For setup/aliases, load `design-system/docs/setup.md`.

## Workflow

1. Start with the nearest component `*.stories.jsx` example
2. For page-level work, check matching `design-system/src/specs/**` composition
3. If exploratory, compare `playground/**` prototypes
4. Copy structure and interaction model; replace visual values with tokens from `design-system/agent-views/foundations/tokens.md`

## Indexes

- Story/spec/template locations: `examples-index.json`
- Pattern catalog: `../uno-research/references/patterns-index.json`

## Guardrails

- Prototypes are not source-of-truth over DS components/specs
- If ambiguous, cite two valid alternatives and ask for a directional decision
