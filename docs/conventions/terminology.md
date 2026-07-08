<!-- Tier: 1 -->
# PLUS Terminology

Use these terms consistently across all design system work, prototypes, and documentation. Do not substitute generic web terms.

## Product Terms

| PLUS Term | Meaning | Do NOT Use |
|-----------|---------|------------|
| **Session** | A scheduled tutoring slot (Zoom or Pencil) | "class", "meeting", "appointment" |
| **Reflection** | Post-session tutor self-report | "survey", "feedback form", "review" |
| **Escalation** | Tutor flags session for supervisor review | "report", "incident", "alert" |
| **Call-Off** | Tutor cancels a session | "cancel", "absence", "no-show" (no-show is a separate behavior) |
| **Fill-In** | Tutor covers an open session slot | "substitute", "replacement" |
| **Strike** | Compliance violation (3-strike threshold) | "warning point", "demerit" |
| **TIP** | Tutor Improvement Plan | "probation", "warning" |
| **PIP** | Performance Improvement Plan (escalated from TIP) | "final warning" |
| **Tutor Coach** | AI weekly compliance monitoring system | "monitor", "tracker" |
| **TACT** | Tutor motivation + growth feedback system | "dashboard", "report" |
| **Student Card** | UI component showing student info during session | "student profile", "student row" |
| **Student Insight** | AI-generated student engagement summary | "student report", "analytics" |

## Organizational Terms

| Term | Meaning |
|------|---------|
| **Affiliation** | University: CMU, Pitt, or Duquesne |
| **Site** | School location where students are based |
| **Lead Tutor** | Senior tutor with mentoring + attendance duties |
| **SMART** | PLUS training system |
| **Breakout Room** | Zoom sub-room for one-on-one tutoring |

## Design System Terms

| Term | Meaning |
|------|---------|
| **Context Level** | Atomic hierarchy: Element → Card → Section → Page |
| **Spec** | Full page composition (e.g., `specs/Home/Pages/`) |
| **Token** | Design value: color, spacing, typography, elevation, radius |
| **Foundation** | Fundamental design primitive (color palette, type scale, grid) |

## Harness & workflow terms (added 2026-07-08, plan Phase 2)

| Term | Meaning | Do NOT use |
|---|---|---|
| **uno** | the design agent, all embodiments (constitution: `AGENTS.md`) | "the AI" |
| **uno-bot** | uno's Slack embodiment — the Cloudflare Worker in `agents/uno-bot/` | "Slackbot" |
| **uno-blueprint** | product source of truth (Supabase) — query at task time, never cache | "the database" |
| **uno-storybook** | design-system source of truth (stories + MDX → /storybook) | "the docs site" |
| **share-out** | a feedback-rail publish: Loom + preview + decision log (+ replica for prototypes) | "post", "update" |
| **pillar** | product area (Universal · Admin · Toolkit · Training · Marketing …) — maps to a Slack channel | "category" |
| **replica** | the Figma frame mirroring a coded prototype — required in prototype share-outs | "screenshot" |
| **Tier 1 / Tier 2** (maintenance) | trivial auto-applied fix vs PR+PRD through a Slack verdict | — |
| **Tier 1 / Tier 2** (loading) | always-loaded docs vs on-demand loads (`loading-order.md`) | — |
| **RM-ID** | Roadmap card id (`RM-<n>`) — the Figma↔Notion join key | — |
