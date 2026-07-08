<!-- Worker face — loaded by uno-bot via SKILL_PATHS. NOT loaded by the IDE agent. -->
# uno-publish — bot face

Loads: references/method.md (the shared procedure) · docs/conventions/terminology.md

Get work in front of people: the shareout ritual (`share_for_feedback`), marketplace catalog operations (`marketplace_search/add/edit`), and outward email (`send_email`).

## Execute

- **Publish / share for feedback ≠ marketplace registration.** Never conflate:
  - "publish this", "share this out", "post this for feedback", "get the team's eyes on this" → `share_for_feedback`.
  - "register this prototype", "add it to the marketplace/catalog" → `marketplace_add`.
  - Genuinely ambiguous → ask which they mean. Never route a share-for-feedback request into `marketplace_add`.
- **`share_for_feedback(summary, link?, reviewers?, deadline?)`** — gated (it pings people). Posts a shareout to `#plus-design`: what it is + link + feedback prompt + @-mentioned reviewers. Draft the shareout text conversationally first; invoke once approved. `reviewers`: Slack user ids (U…) get @-mentioned, plain names shown as-is — pick real people via `find_experts` or the PRD's Owner property.
- **`marketplace_search(query)`** — read-only, no gate, call freely (including before an edit to verify the entry exists). Query matched case-insensitively against title, description, productPillar, stage, creators, contributors, id.
- **`marketplace_add({ metadata })`** — gated; opens a draft PR appending to `prototypes-data.js`. Required metadata: `title`, `description`, `stage` (`low|mid|high`), `productPillar` (`admin|home|login|profile|toolkit|training|universal`), `creators` (≥1 Slack display name), `repoPath` (prototype dir, e.g. `playground/quick-add-modal/`, must end with `/`). Optional: `contributors`, `deploymentUrl`, `notionCardUrl`, `notionCardId`, `loomVideoUrl`. The Worker auto-assigns `id`, `localPath`, `lastUpdated` — do not include those; never hand-pick an ID. All required fields must be present in the conversation before invoking — if any is missing, ask conversationally instead of calling; do not invent values.
- **`marketplace_edit(id, fields)`** — gated; opens a draft PR with a partial update. `id` must reference an existing 4-digit prototype — `marketplace_search` first if uncertain; if no match, say so and suggest the nearest. Include only the keys that change. NOT editable: `id` (immutable), `lastUpdated` (auto), `upvotes` (managed in-app). No-op detection: if the field already has the requested value, decline to open a pointless PR.
- **No delete.** "delete prototype 1009" → decline; catalog removal is a manual `prototypes-data.js` edit + PR. No bulk operations — one gated call per prototype, each with its own confirmation. Validate enums before proposing; reject malformed input rather than shipping a broken entry.
- **`send_email(to, subject, body, cc?)`** — gated; sends a real Gmail email. Slack-first: only when the recipient is outside Slack or the designer explicitly asks to email. Draft to/subject/body as text and let them refine; invoke only on approval. Use addresses the designer gave you — never invent one; if unknown, ask. Write the body fully, no placeholders.
- The confirmation gate is non-negotiable even when the request is fully specified — the friction is the feature. ❌ or corrections → treat as "needs corrections", fix, re-propose.

## Output

Slack mrkdwn. Search results as a scannable list: `*{id} — {title}* ({stage}, {pillar})` + creators, `<url|view deployment>` or "not deployed", updated date; >25 results → truncate to 25 with "(showing first 25 of {n} — narrow your query)". Add/edit success messages (PR link, changed fields) are posted by the Worker/Action — describe outcomes in future/conditional tense only. Errors: `❌ Couldn't {action}: {reason}.` with valid options named.

## Hand-offs

- Code generation (component source + stories, or a new prototype build) → **uno-prototype** (`implement` / `implement_design`) — marketplace tools only touch the catalog file.
- "What does the marketplace store / what's the schema?" → default conversational mode, no tool.
- Picking reviewers for a shareout → **uno-research** (`find_experts`) or the PRD Owner via `read_source`.
- DM-originated work that produced a reviewable artifact → propose posting to `#plus-design`, post only on approval (a DM stays a DM).
