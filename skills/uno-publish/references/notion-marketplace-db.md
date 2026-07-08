# notion-marketplace DB — schema & management

Status: **spec, not yet built.** The live destination today is the repo catalog
(`src/pages/PrototypeMarket/prototypes-data.js`, schema in `marketplace-schema.md`).
This file is the contract for the Notion DB that becomes the official target once
stood up — `uno-publish` flags the gap on every handoff until it exists.

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
| **Product Pillar** | select | `productPillar` | one of the 7 pillars (`admin`, `home`, `login`, `profile`, `toolkit`, `training`, `universal`) — mirrors the Roadmap pillar set |
| **Roadmap card** | relation → Roadmap DB (`7fba5c35-da73-4c40-ac42-1c13db7794de`) | `notionCardUrl` / `notionCardId` | replaces the raw URL+ID pair; card ID surfaces via rollup |
| **Creators** | people | `creators[]` | workspace members; fall back to a `Creators (text)` rich_text only for non-members |
| **Contributors** | people | `contributors[]` | defaults to Creators |
| **Deployment URL** | url | `deploymentUrl` | null → empty |
| **Loom** | url | `loomVideoUrl` | null → empty |
| **Repo path** | rich_text | `repoPath` | always ends `/` |
| **Local path** | rich_text | `localPath` | app route, e.g. `/1025`; empty if not wired |
| **Upvotes** | number | `upvotes` | new entries = 0 |
| **Last updated** | last_edited_time | `lastUpdated` | Notion-managed; JS field auto-filled today's date |
| **Entry ID** | unique_id (prefix `MKT`) | `id` | Notion-managed auto-increment; the JS `id` mirrors the number |

**Deliberately dropped from the JS shape:** `notionCardUrl` + `notionCardId` collapse
into the **Roadmap card** relation (never store a raw URL when a relation exists).

## Page body (each entry)

Short — the row is the data; the body is a pointer:

```
[💡 callout] One-line "what this demonstrates + who it's for."

Live preview: <deployment url>  ·  Loom: <loom url>
Handoff Spec / PRD: <linked from the Roadmap card>
```

No golden-section set — marketplace entries are catalog rows, not project hubs.

## Publish procedure (`uno-publish`, handoff rail, after sign-off)

1. **Build** the entry from the handoff (title, description via `writers/notion` voice).
2. **Validate**: `Stage` and `Product Pillar` exact-match existing select options;
   `Repo path` ends `/`; `Roadmap card` relation resolves; Creators/Contributors are
   real workspace members (else route to the `(text)` fallback).
3. **Confirm** — show the row + target DB, wait for explicit go-ahead (no auto-write).
4. **Write** the Notion row, then **dual-write** the JS catalog entry
   (`marketplace-schema.md`) until the export step exists. Keep `id` ↔ `Entry ID` in sync.
5. **Verify** the row renders in the DB view and `/market` renders the card.

## Standing the DB up

The Notion API **can** create this DB (`API-create-a-data-source`) — it is not a
manual-only step. It stays unbuilt only pending a go-ahead, because it is an outward
workspace write. On approval: create under the Roadmap's parent, add the properties
above, seed the two `select` option sets exactly, then flip the `notion.md` allowlist
note from `⚠️ setup pending` to the live data-source ID and delete this file's
"spec, not yet built" banner.
