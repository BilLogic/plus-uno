# notion-marketplace DB — schema & management

Status: **LIVE** — built under Design HQ on 2026-07-08.
- Database `397b7cca-4982-8002-826c-c45e2baa8e4f` — https://app.notion.com/p/397b7cca49828002826cc45e2baa8e4f
- Data source `397b7cca-4982-80d8-9967-000b69521ce9`

The repo catalog (`src/pages/PrototypeMarket/prototypes-data.js`, schema in
`marketplace-schema.md`) still renders `/market`; publish **dual-writes** both surfaces
until the export step lands.

## Why a Notion DB (vs. the JS catalog)

The JS array renders `/market` in the app; the Notion DB is the team-facing,
filterable, relation-linked index that sits next to the Roadmap. Both hold the same
entries. **Source of truth once built: the Notion DB.** The JS catalog is generated
from it (export step) so `/market` and Notion never drift — until that export exists,
publish **dual-writes** (append the JS entry *and* create the Notion row) and says so.

## Properties

Names are exact — Notion silently auto-creates a select option on any mismatch, so
fetch the schema and exact-match before every write (see `notion.md`).

| Property | Type | Maps to JS field | Notes |
|---|---|---|---|
| **Name** | title | `title` | prototype display name |
| **Description** | rich_text | `description` | 1–2 sentences |
| **Stage** | select | `stage` | options: `Low-fi` · `Mid-fi` · `High-fi` (map from `low`/`mid`/`high`) |
| **Project card** | relation → Roadmap DB (`7fba5c35-da73-4c40-ac42-1c13db7794de`) | `notionCardUrl` / `notionCardId` | **the back-link to the project** — required; drives the rollups below |
| **Product Pillar** | rollup ← Project card (show original) | `productPillar` | **rolls up from the linked card** — not set by hand; the project owns its pillar |
| **Design status** | rollup ← Project card (show original) | — | live design status from the card, no double-entry |
| **Roadmap ID** | rollup ← Project card (show original) | `notionCardId` | the card's ID (e.g. `2439`), surfaced from the relation |
| **Contributors** | people | `contributors[]` (+ `creators[]`) | who built the prototype (may differ from the card's contributor) — kept manual |
| **Deployment URL** | url | `deploymentUrl` | null → empty |
| **Loom** | url | `loomVideoUrl` | null → empty |
| **Repo path** | rich_text | `repoPath` | always ends `/` |
| **Local path** | rich_text | `localPath` | app route, e.g. `/1025`; empty if not wired |
| **Upvotes** | number | `upvotes` | new entries = 0 |
| **Last updated** | last_edited_time | `lastUpdated` | Notion-managed; JS field auto-filled today's date |
| **Entry ID** | unique_id (prefix `MKT`) | `id` | Notion-managed auto-increment; the JS `id` mirrors the number |

**Streamlined from the JS shape:**
- `creators` + `contributors` collapse into a single **Contributors** field (no separate Creators — one people field covers "who made this").
- `notionCardUrl` + `notionCardId` collapse into the **Project card** relation (never store a raw URL when a relation exists; the relation is the required link back to the project).
- Fields the project already owns — **Product Pillar · Design status · Roadmap ID** — are **rollups** off the Project card, not manual columns (set once on the card, reused here).

## Entry page template (inner body)

Each DB row opens to this template — short, since the row properties are the data and
the linked project card holds the depth. This is the DB's default template (set once the
DB is built; until then it's the shape publish writes by hand):

```
[💡 callout]  One line — what this prototype demonstrates + who it's for.

## Try it
Live preview: <Deployment URL>   ·   Walkthrough: <Loom>

## Context
Project card: <Project card relation>  → PRD · Handoff Spec live there, not here.
Repo: <Repo path>   ·   In-app route: <Local path>
```

No golden-section set — marketplace entries are catalog rows, not project hubs; the
project card is the single source for everything beyond the catalog fields.

## Publish procedure (`uno-publish`, handoff rail, after sign-off)

1. **Build** the entry from the handoff (title, description via `writers/notion` voice).
2. **Validate**: `Stage` and `Product Pillar` exact-match existing select options;
   `Repo path` ends `/`; the `Project card` relation resolves (required); Contributors
   are real workspace members (else route to the `(text)` fallback).
3. **Confirm** — show the row + target DB, wait for explicit go-ahead (no auto-write).
4. **Write** the Notion row, then **dual-write** the JS catalog entry
   (`marketplace-schema.md`) until the export step exists. Keep `id` ↔ `Entry ID` in sync.
5. **Verify** the row renders in the DB view and `/market` renders the card.

## How it was built — and the two manual bits left

Built 2026-07-08: a human created a blank DB under Design HQ's *🧩 Prototype Marketplace*
section (the `notion-plus` integration can't create new databases on Notion API
2025-09-03+), then UNO configured the full schema via `API-update-a-data-source` — all
properties, the `Stage` / `Product Pillar` option sets, and the `Project card` relation
to the Roadmap.

Two things the API can't set — do them once in the Notion UI:
- **`Entry ID`** (unique_id, prefix `MKT`) — the API can't create unique_id properties.
- **Entry-page default template** — the inner-body shape above; DB templates are UI-only.
