---
embodiment: ide
summary: One file per architecture decision, each checked against the code rather than ported.
---

# Architecture decisions

One decision per file, numbered. A single `decisions.md` held all 22 in a
single file and broke its own splitting rule (ADR-011) doing it.

Every ADR here was **checked against the code on 2026-08-24** during #171, not
copied across. Each file records the date it was verified, and where the code
disagreed the ADR says so instead of continuing to assert the decision.

## Status vocabulary

| Status | Means |
|--------|-------|
| `active` | The decision stands and the code matches it. |
| `superseded` | A later ADR or document replaced it; the file says which. |
| `active-with-correction` | The decision stands; a mechanism it names has since changed. |
| `contradicted` | The code does the opposite. Not retired — someone has to decide which side is wrong. |
| `unverifiable` | The artifact the decision describes could not be found. Absence of a filename is not proof the pattern is gone. |

## What the verification pass found

Four of 22 needed more than a move:

- **[ADR-009](009-bootstrap-first-no-alternative-ui-frameworks.md) — contradicted.** It bans Tailwind; `package.json` declares three Tailwind packages and ~65 source files use it.
- **[ADR-012](012-declarative-route-manifest-over-parallel-maps.md) — unverifiable.** No route manifest exists under any name searched.
- **[ADR-014](014-uno-bot-v2-pipedream-cloudflare-worker.md) — corrected.** Skills are no longer raw-fetched from GitHub at runtime; the harness is baked at build time.
- **[ADR-010](010-three-tier-context-loading-architecture.md) — superseded.** The paths it names were dissolved in #171.

The other 18 were confirmed by checking the artifact each names — the barrel, the
Worker source, the guard script, the OAuth handler — and carry the same
`verified:` stamp.

## Writing a new one

Anything surprising or hard to reverse. Next number, one file, and the same
frontmatter: `summary`, `status`, `verified`. An ADR that asserts something the
code contradicts is a bug in the ADR, not a note for later.
