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

## Auto-Suggest

Proactively suggest this skill when:
- `/uno:review` returned PASS on a prototype
- The user completed a prototype and hasn't registered it in the marketplace yet

**Never auto-invoke this skill.** Always require the user to explicitly request publishing. This skill writes to the marketplace data file — it must be intentional.

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

If `deploymentUrl` is null, follow `references/deployment-guide.md` to help the designer deploy. Do **not** auto-deploy.

### Phase 3: Submit

1. Generate the entry object (see Confirmation Template below).
2. Show it to the designer. **Wait for confirmation before writing.**
3. Append the entry to the `prototypes` array in `src/pages/PrototypeMarket/prototypes-data.js`.
4. Suggest verifying at `http://localhost:4100/market`.

## Confirmation

Before writing to the file, show the designer the generated entry object and the target file path. See `examples/marketplace-entry-example.md` for the expected format. **Wait for explicit confirmation before writing.**

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

## Next Step

After publishing:
→ Suggest `/uno:compound` if anything non-trivial was learned during the build or publishing process.

These are suggestions — the user may choose to skip.

## References

- Data schema: `src/pages/PrototypeMarket/prototypes-data.js`
- Market page: `src/pages/PrototypeMarket/PrototypeMarket.jsx` (includes popup detail modal with Loom embed, comments, preview image, upvotes)
- Card component: `src/pages/PrototypeMarket/PrototypeCard.jsx`
- Prototyping docs: `playground/README.md`
