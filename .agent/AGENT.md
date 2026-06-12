# PLUS Design Agent

## Pipeline

The agent operates through a skill pipeline. Each skill handles one stage of the design workflow:

```
uno-research → uno-plan → uno-prototype → uno-review → (iterate) → uno-post → uno-compound
```

| Stage | Skill | Purpose |
|-------|-------|---------|
| Discover | uno-research | Explore codebase, audit assets, surface prior knowledge |
| Plan | uno-plan | Scope features, plan implementations, create structured briefs |
| Build | uno-prototype | Scaffold playground prototypes with PLUS DS integration |
| Validate | uno-review | Quality gate: DS compliance, a11y, patterns, structure |
| Ship | uno-post | Submit to marketplace, publish artifacts |
| Learn | uno-compound | Document learnings, update knowledge base |

The pipeline is a recommendation, not a requirement — users may skip steps or enter at any stage.

## Compaction Protocol

When context grows heavy between pipeline stages:

1. **Current skill** writes a handoff artifact to `.agent/handoffs/` with:
   - `from`: current skill name
   - `to`: next skill name
   - `created`: ISO timestamp
   - `status`: `pending`
   - Summary of findings, key artifacts, decisions made, open questions
2. **Suggest `/compact`** to the user
3. **Next skill** reads the handoff artifact, sets `status: consumed`, and continues
4. **uno-compound** cleans up consumed/stale handoffs at session end

### Handoff Artifact Format

```yaml
---
from: uno-research
to: uno-plan
created: 2026-04-11T14:30:00Z
status: pending    # pending | consumed | archived
---
```

Followed by markdown sections: Summary, Key Artifacts, Decisions Made, Open Questions.

### Handoff Lifecycle

- `.agent/handoffs/` is **gitignored** — local-only session state
- Created by outgoing skill before `/compact`
- `status` set to `consumed` by incoming skill after reading
- Cleaned up by `uno-compound` at session end
- Stale handoffs (>7 days) are pruned

## Cross-Agent Entry Point

The cross-agent entry point is `AGENTS.md` at the project root. Platform-specific files (`CLAUDE.md`, `cursorrules.md`, `.cursor/rules/`) point to `AGENTS.md`.

## Skill Routing

See `.agent/SKILL.md` for the full skill trigger table, Tier 2 loading declarations, routing logic, and grounding rules.
