---
embodiment: ide
---

<!-- ~300 tokens | Load when: registering a prototype in the marketplace — handoff step 6, or a standalone "register this prototype" ask -->

# Marketplace registration

**Source of truth:** Notion Prototype Marketplace
(`references/notion-marketplace-db.md`). Do **not** dual-write a JS marketplace
UI (retired). `prototypes-data.js` is only a legacy routing registry for the
live app shell — do not add new experiment IDs there for `main`.

1. Deploy a **preview** (Deploy Preview / branch / standalone) per
   `references/deployment-guide.md`.
2. Build the Notion row: Stage, Description, Repo path, Local path (if any),
   **Deployment URL** = preview URL. Link Project card when a Roadmap card
   exists.
3. Show the draft, wait for confirmation, write via `writers/notion` /
   Notion MCP.
4. Captures → Notion file/cover (not committed PNGs on `main`).
5. When accepted: update Deployment URL to Storybook / live-app route; fold UI
   into specs + `prototypes/home-redesign/`.
