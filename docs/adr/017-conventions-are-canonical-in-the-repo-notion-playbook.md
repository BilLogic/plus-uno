---
embodiment: ide
summary: Conventions are canonical in the repo; Notion playbook material obsoleted (2026-07-07)
status: active
verified: 2026-08-24 (#171)
---

# ADR-017: Conventions are canonical in the repo; Notion playbook material obsoleted (2026-07-07)

**Decision.** `docs/conventions/` is the single source of truth for team conventions. The Notion playbooks the files were distilled from (📓 Doc-Management, 🎨 Figma Workspace, the flow-doc convention fragments) are superseded — they get banners pointing at the repo, not maintenance. Headers flip from `source:/synced:` + "prefer Notion on conflict" to `status: canonical` + `distilled:` lineage. On any conflict with a legacy page, the repo wins and uno-maintain files an intake to banner the page (via writers/notion).

**Why.** (Bill, 2026-07-07, resolving plan §6 Q3): the harness lives on GitHub; keeping a second normative copy in Notion recreates the exact mirror-rot this revision was fixing — the sync problem is best solved by not having two sources. Notion remains the estate for *work* (hubs, PRDs, roadmap, templates); it just no longer owns the *rules*.

**Consequences.** The conventions-staleness sweep becomes a conventions-integrity sweep (canonicality headers, agents↔docs cross-references, superseded banners). The same treatment applies to `docs/evals/rubrics/` (distilled from the 📊 Evals page). Supersedes the mirror-provenance model in ADR-013 §(4) and the Phase-2 "middle path" in plan 2026-07-07-001 §3. One-time follow-up: banner the legacy Notion playbook pages.
