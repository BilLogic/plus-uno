---
embodiment: ide
summary: 4-digit numeric IDs over slugs for prototype listings
status: superseded
verified: 2026-11-26
---

> **Superseded (2026-11-26).** No prototype listing lives on `main` (`prototypes/README.md`), so there are no IDs to number. The listings and their 4-digit IDs are on `archive/legacy-ds`.

# ADR-004: 4-digit numeric IDs over slugs for prototype listings

- **Date**: 2026-03-22
- **Status**: Superseded by `main` hosting Storybook only (2026-11-26); the prototype listings and their IDs live on the `archive/legacy-ds` branch
- **Context**: String slugs caused naming collisions and awkward URL paths. Creator-based directory grouping did not scale.
- **Decision**: Use 4-digit numeric IDs (1001+) for all prototype listings. Flat project-oriented prototypes structure with creator info as metadata.
- **Source**: (pre-consolidation solution doc, no longer in the repo) _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md
