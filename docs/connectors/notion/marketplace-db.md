---
embodiment: ide
summary: The Prototype Marketplace database (LIVE under Design HQ) — its schema, deploy URLs and publish procedure, read by the IDE publish skill and the Worker's marketplace write
---

# notion-marketplace DB — schema & management

Status: **LIVE** — Design HQ · Prototype Marketplace.
- Database `397b7cca-4982-8002-826c-c45e2baa8e4f` — https://app.notion.com/p/plus-tutors/397b7cca49828002826cc45e2baa8e4f
- Data source `397b7cca-4982-80d8-9967-000b69521ce9`

**Source of truth: this Notion DB.** The in-app `/market` UI is retired. On `main`: Storybook + the tutor revamp (`/prototypes/tutor-revamp/`). The Vibe app and the Full Demo Walkthrough (id `1028`) are on the `archive/legacy-ds` branch, and their URLs redirect to Storybook. Experiments use branch Deploy Previews / standalone Netlify.

## Why Notion (vs. the old JS marketplace UI)

Team filtering, Project-card relations, and Roadmap rollups live in Notion. Prototypes stay **hosted** on Netlify (deploy-preview URLs, or `plus-uno.netlify.app/prototypes/{slug}/`); Notion stores the **Deployment URL** link.

## Properties

Names are exact — Notion silently auto-creates a select option on any mismatch, so
fetch the schema and exact-match before every write (see `docs/connectors/notion/overview.md`).
A given field whose column the live schema lacks goes in the page body as a `**Property:** value` line, on create and on update.

| Property | Type | Maps to JS field | Notes |
|---|---|---|---|
| **Name** | title | `title` | prototype display name |
| **Description** | rich_text | `description` | 1–2 sentences |
| **Stage** | select | `stage` | options: `Low-fi` · `Mid-fi` · `High-fi` (map from `low`/`mid`/`high`) |
| **Project card** | relation → Roadmap DB (`7fba5c35-da73-4c40-ac42-1c13db7794de`) | `notionCardUrl` / `notionCardId` | **back-link to the project** — link when a Roadmap card exists; drives rollups |
| **Product Pillar** | rollup ← Project card (show original) | `productPillar` | rolls up from the linked card — not set by hand |
| **Design status** | rollup ← Project card (show original) | — | live design status from the card |
| **Roadmap ID** | rollup ← Project card (show original) | `notionCardId` | card ID from the relation |
| **Contributors** | people | `contributors[]` (+ `creators[]`) | workspace members only |
| **Deployment URL** | url | `deploymentUrl` / production path | the deploy-preview URL, or `https://plus-uno.netlify.app/prototypes/{slug}/` for a prototype `main` builds |
| **Loom** | url | `loomVideoUrl` | null → empty |
| **Repo path** | rich_text | `repoPath` | always ends `/` |
| **Local path** | rich_text | `localPath` | app route, e.g. `/1025` |
| **Figma replica** | url | — | optional; the person-made Figma replica of the prototype |
| **Upvotes** | number | `upvotes` | new entries = 0 |
| **Last updated** | last_edited_time | `lastUpdated` | Notion-managed |

## Deploy URLs (production + unmerged branches)

| Context | URL pattern | When |
|---|---|---|
| **Production** | `https://plus-uno.netlify.app/prototypes/{slug}/` | A prototype `main` builds (today only `tutor-revamp`), with its build in `build:all` and its redirect in `netlify.toml` |
| **Deploy Preview** | `https://deploy-preview-{PR#}--plus-uno.netlify.app/{path}` | Open a PR against `main` — Netlify builds the whole site |
| **Branch deploy** | `https://{branch-name}--plus-uno.netlify.app/{path}` | If branch deploys are enabled for the site (same build as prod) |

Ritual for side-branch work (not yet on `main`):

1. Put the prototype under `prototypes/{slug}/` (`skills/uno-prototype/scripts/scaffold-prototype.sh` writes it).
2. Open a PR → wait for Netlify Deploy Preview.
3. Paste the preview URL (path to the prototype) into Notion **Deployment URL**.
4. After merge, update **Deployment URL** to the production `plus-uno.netlify.app` path.

Landing page (`/`) redirects to **Storybook** (`/storybook/`). Discovery lives in this Notion DB.

## Publish procedure (`uno-publish`)

1. Build the entry (title, description, stage, repo/local paths).
2. Set **Deployment URL** to the live Netlify URL (preview or production).
3. Link **Project card** when a Roadmap card exists (unlocks Product Pillar rollup).
4. Write the Notion row: update the row already carrying the prototype's name or Deployment URL, create one only when none does. The rollups fill themselves from **Project card**.

## Entry page body (template shape)

```
[💡 callout]  One line — what this prototype demonstrates + who it's for.

## Try it
Live preview: <Deployment URL>

## Context
Project card: <relation>  ·  Repo: <Repo path>  ·  In-app route: <Local path>
```
