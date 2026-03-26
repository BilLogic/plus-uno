---
name: uno-post
description: Guides designers through submitting a prototype to the Prototype Market. Use when the user asks to "submit", "publish", "add to market", "list my prototype", or wants to deploy and register a prototype in the market index.
user-invocable: true
argument-hint: [prototype-name]
---

# Submit to Market

Walk a designer through registering their prototype in the Prototype Market so it appears on `/market`.

## When to Use

- Designer finished a prototype and wants it listed
- Designer deployed to Netlify and wants to add the link
- Designer asks to "submit to market", "publish my prototype", or "add to the index"

## Protocol

### Phase 1: Collect Metadata

Gather the required fields. Use smart defaults where possible.

1. **Detect `repoPath`** — infer from the user's open files or current directory. Must be a path under `playground/{project}/`.
2. **Ask the user** for the fields below. Present `stage` and `productPillar` as constrained choices (use AskQuestion if available). Auto-fill `lastUpdated` with today's date and auto-generate `id` from the project folder name.

| Field | Type | How to get |
|-------|------|------------|
| `id` | string | Auto: `{project-folder-name}` |
| `title` | string | Ask user |
| `description` | string | Ask user (1-2 sentences) |
| `deploymentUrl` | string or null | Ask user; null if not deployed |
| `notionCardUrl` | string or null | Ask user; null if none |
| `notionCardId` | string or null | Ask user (e.g. `PLUS-42`); null if none |
| `stage` | `low` / `mid` / `high` | Ask user (choice) |
| `lastUpdated` | `YYYY-MM-DD` | Auto: today's date |
| `creators` | string[] | Ask user |
| `contributors` | string[] | Ask user; defaults to same as creators |
| `productPillar` | enum | Ask user (choice): `admin`, `home`, `login`, `profile`, `toolkit`, `training`, `universal` |
| `localPath` | string or null | Ask user; null if not wired into root app |
| `repoPath` | string | Auto-detect or ask |
| `loomVideoUrl` | string or null | Ask user; Loom share URL for walkthrough video (e.g. `https://www.loom.com/share/abc123`). Shown as embedded video in the popup detail modal. null if none |
| `upvotes` | number | Auto: `0` (managed in-app; do not ask user) |

### Phase 2: Deployment Help (optional)

If `deploymentUrl` is null, offer to help deploy:

1. Verify the prototype builds:
   ```bash
   cd playground/{project}
   npx vite build
   ```
2. Guide the designer to deploy via one of:
   - **Netlify CLI**: `npx netlify deploy --prod --dir dist`
   - **Netlify UI**: Drag-and-drop the `dist/` folder at app.netlify.com
3. Wait for the designer to provide the resulting URL.
4. Record it as `deploymentUrl`.

Do **not** auto-deploy. Only provide guidance and wait for the URL.

### Phase 3: Submit

1. Generate the entry object (see Confirmation Template below).
2. Show it to the designer. **Wait for confirmation before writing.**
3. Append the entry to the `prototypes` array in `src/pages/PrototypeMarket/prototypes-data.js`.
4. Suggest verifying at `http://localhost:3000/market`.

## Confirmation Template

Before writing to the file, show the designer the entry:

```
I'll add this entry to the Prototype Market:

  {
    id: 'creator-project-name',
    title: 'Short Title',
    description: 'One or two sentence summary.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'high',
    lastUpdated: 'YYYY-MM-DD',
    creators: ['Name'],
    contributors: ['Name'],
    productPillar: 'home',
    localPath: '/home',
    repoPath: 'playground/{project}/',
    loomVideoUrl: null,
  }

File: src/pages/PrototypeMarket/prototypes-data.js

Proceed?
```

## Post-Submit Checklist

After appending:

- [ ] Entry appears correctly in `prototypes-data.js`
- [ ] `/market` page loads and shows the new card
- [ ] Filters (stage, pillar) include the new entry
- [ ] Deployment link works (if provided)
- [ ] Click the card to open the popup detail modal — verify title, badges, description, links render correctly
- [ ] Loom walkthrough video embeds correctly in popup detail modal (if `loomVideoUrl` provided)
- [ ] Preview image loads in popup detail modal (run `npm run generate:previews` if missing)
- [ ] Optionally commit the change

## References

- Data schema: `src/pages/PrototypeMarket/prototypes-data.js`
- Market page: `src/pages/PrototypeMarket/PrototypeMarket.jsx` (includes popup detail modal with Loom embed, comments, preview image, upvotes)
- Card component: `src/pages/PrototypeMarket/PrototypeCard.jsx`
- Prototyping docs: `playground/README.md`
