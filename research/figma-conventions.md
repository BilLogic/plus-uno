# How closely do files across the six PLUS teams follow the Figma conventions?

Research for the "uno-bot in Figma" map. Measured 2026-09-30.

## Answer

They don't follow them. `docs/connectors/figma.md` describes conventions the files do not use:

- No file name has the form `<Pillar> · <Project> · RM-<n>`, and no file name contains an `RM-` id.
- No file has a `1 Official` page. No page name contains "Official" at all.
- 3 of 6,530 top-level frames carry a `[wip]`, `[spec]`, `[replica]` or `[archive]` prefix.

The files follow an older scheme of their own, and it is consistent enough to build on:

- **File names** follow `<Project> / Card <n> / <designers>`. The `Card <n>` number is the Roadmap card's `ID`: 86 of the 101 distinct card numbers resolve to a Roadmap card.
- **Pages** are grouped under divider pages named `- - - <emoji> <Stage> - - -`: 🖼️ Cover, 📐 Specs, ⏳ WIP, 🕹️ Playground, 🔍 For Review and 🗂️ Archive. The stage lives in the page section, not in a frame prefix.

A's filters and E's rules, as written, would match nothing (A) or flag nearly everything (E). Both need rewriting against the real scheme, or the files need migrating. That choice belongs to Bill (see § What this means).

## Method

- **Probe.** A throwaway `pull_request` workflow on this branch (draft PR #889, closed unmerged) ran with the repo's `FIGMA_ACCESS_TOKEN`, Bill's personal token. It made only read-only GETs, paced at 1.5 s per call, and ran in two passes: 447 calls, then 308. There were no 429s.
- **Listing.** `GET /v2/teams/:id/folders` returned 200 for all six teams, with 5 folders each. `GET /v2/folders/:id/files` then listed 245 files. No fallback was needed.
- **Sample.** Every file for teams with 25 files or fewer. Otherwise 25 files spaced evenly by `last_modified`, so the sample holds old and new files alike. That gave 139 files sampled. Of those, 133 could be read at `depth=2`; 6 returned `400 File type not supported`, which is most likely FigJam or Slides.
- **Per file.**
  - `/v1/files/:key?depth=2` for page names and the top-level nodes on each page. Nodes counted: FRAME, SECTION, COMPONENT, COMPONENT_SET, GROUP and INSTANCE.
  - `/v1/files/:key/meta` for `last_touched_at`.
  - `/v1/files/:key/comments` for counts only. A thread is a comment with no `parent_id`; a thread is unresolved when it has no `resolved_at`.
- **Name counts.** Pass 2 counted file-name patterns over all 245 files, not the sample.
- **Roadmap cross-check.** Every `Card <n>` number was queried in the Roadmap (data source `7fba5c35-da73-4c40-ac42-1c13db7794de`, whose `ID` property is an unprefixed `unique_id`). This ran in the session through the notion-plus connector, not in CI. Three matches were checked for topic by hand: 113 "Overview Card Redesign", 733 "AI Indicator on Lesson Page" and 1149 "Session Reels" each match their file's name.
- **What the logs held.** Aggregates and at most 5 example names per category. No comment text and no handles.

**Limits**

- The REST API has no per-frame modification date. "Stale" below uses the whole file's `last_touched_at`, so a `[wip]` or ⏳ WIP item in a file untouched for 30 days is at least 30 days old. An item in a recently touched file may be older than it looks.
- `depth=2` stops at page children. Frames nested inside sections were not counted.

## The conventions in `docs/connectors/figma.md`, per team (pass 1)

| Team | Files listed | Sampled / read | `RM-` in name | Matches `<Pillar> · <Project> · RM-<n>` | `1 Official` page | Top-level nodes | Prefixed (`[wip]`…) | `[wip]` in file untouched >30 d |
|---|---|---|---|---|---|---|---|---|
| Universal | 71 | 25 / 23 | 0 | 0 | 0 | 1,561 | 0 | 0 |
| Training | 20 | 20 / 20 | 0 | 0 | 0 | 618 | 0 | 0 |
| Toolkit | 61 | 25 / 23 | 0 | 0 | 0 | 2,175 | 0 | 0 |
| Admin | 19 | 19 / 19 | 0 | 0 | 0 | 554 | 1 (`[wip]`) | 1 |
| Others | 38 | 25 / 24 | 0 | 0 | 0 | 1,185 | 2 (`[archive]`) | 0 |
| MISC | 36 | 25 / 24 | 0 | 0 | 0 | 437 | 0 | 0 |
| **All** | **245** | **139 / 133** | **0** | **0** | **0** | **6,530** | **3** | **1** |

With no `RM-` ids, the question of whether an `RM-` id resolves to a Roadmap card does not arise. The same question for `Card <n>` is answered below.

Files are mostly dormant: 125 of the 139 sampled were untouched for more than 30 days, and 118 for more than 90.

## The scheme the files actually use

### File names (pass 2, all 245 files)

| Team | Files | `… / Card <n> / …` | `… / Legacy / <term>` | Other | Distinct card numbers | Resolve to a Roadmap card |
|---|---|---|---|---|---|---|
| Universal | 71 | 17 | 7 | 47 | 18 | 14 |
| Training | 20 | 14 | 2 | 4 | 16 | 15 |
| Toolkit | 61 | 42 | 5 | 14 | 34 | 31 |
| Admin | 19 | 14 | 1 | 4 | 18 | 18 |
| Others | 38 | 12 | 4 | 22 | 15 | 8 |
| MISC | 36 | 1 | 1 | 34 | 1 | 1 |
| **All** | **245** | **100** | **20** | **125** | **101** | **86** |

The per-team resolve counts add up to 87, not 86, because card 104 appears in both Training and Others.

- **Card files.** The pattern is `<Project> / Card <n>[ & <m>] / <designers>`, e.g. `AI Indicator / Card 733 & 1002 / <designers>`. One file can name two cards. There are variants:
  - a bare number, e.g. `… / 2204 & 2251 / …`, which the `Card` regex misses;
  - a placeholder, `… / Card # / …`.
- **Legacy files.** `<Project> / Legacy / <term>`, e.g. `Designer Cards / Legacy / Summer 2022`, holds pre-Roadmap work.
- **Other files.**
  - The product teams' other files are libraries, templates and brainstorms, e.g. `Design System (S23)`, `How-We-Fig`, `Deck for Leadership`.
  - MISC is almost all workshop, onboarding and event files, e.g. `Design Jam Storyboarding Exercise`.
  - Others also holds imported community kits.
- **Unresolved card numbers.** 15 do not resolve: 37, 46, 52, 53, 83, 86, 91, 92, 93, 97, 569, 578, 590, 1229 and 1753. Most are below 100 and predate the current Roadmap numbering, or their cards were deleted. Others is the weakest team, with 7 of 15 unresolved.

### Pages: the divider scheme (pass 2, 133 files read)

Files mark stages with divider pages named `- - - <emoji> <Stage> - - -`. The working pages sit below each divider, and a placeholder page called `A page here` often fills an empty stage. Blank-named pages serve as spacers.

| Team | Read | 📐 Specs | ⏳ WIP | 🕹️ Playground | 🔍 For Review | 🗂️ Archive | Specs + WIP both | WIP section, file untouched >30 d |
|---|---|---|---|---|---|---|---|---|
| Universal | 23 | 4 | 2 | 0 | 1 | 1 | 2 | 2 |
| Training | 20 | 11 | 11 | 11 | 10 | 10 | 11 | 11 |
| Toolkit | 23 | 7 | 6 | 5 | 4 | 6 | 6 | 4 |
| Admin | 19 | 12 | 8 | 9 | 6 | 12 | 8 | 7 |
| Others | 24 | 2 | 2 | 1 | 1 | 1 | 2 | 2 |
| MISC | 24 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **All** | **133** | **36** | **29** | **26** | **22** | **30** | **29** | **26** |

- **Consistency.** The divider names, with the same emoji and spelling, are identical across every team that uses them.
  - `- - - 🖼️ Cover - - -` appears in five teams, all but MISC.
  - `📐 Specs`, `⏳ WIP`, `🕹️ Playground`, `🔍 For Review` and `🗂️ Archive` are the house scheme in Training, Admin and Toolkit.
  - Universal and Others use it only in their card files.
  - MISC never uses it; its pages are `Page 1` or cohort names.
- **Files outside the scheme** use `Cover`, `Page 1`, or component names (the Universal library files).
- **Content under each divider.** Top-level nodes under 📐 Specs: 114; ⏳ WIP: 322; 🔍 For Review: 71. Specs is the nearest thing to the doc's "Official" page, but it is not reserved for `[spec]`-grade work, and WIP outweighs it about 3 to 1.

### Comments (pass 1, with pass 2 splitting by file age)

| Team | Files with comments | Comments | Threads | Unresolved threads | Unresolved in files untouched >90 d | Most threads in one file |
|---|---|---|---|---|---|---|
| Universal | 12 / 25 | 1,469 | 1,117 | 607 | 128 | 561 |
| Training | 17 / 20 | 791 | 483 | 263 | 263 | 104 |
| Toolkit | 16 / 25 | 1,034 | 644 | 288 | 194 | 174 |
| Admin | 16 / 19 | 1,178 | 781 | 435 | 435 | 214 |
| Others | 12 / 25 | 355 | 274 | 218 | 192 | 136 |
| MISC | 6 / 25 | 171 | 138 | 116 | 115 | 129 |
| **All** | **79 / 139** | **4,998** | **3,437** | **1,927 (56%)** | **1,327 (69% of unresolved)** | — |

Comments are concentrated: one Universal file holds 561 threads, half the team's total. Most unresolved threads are abandoned rather than open, since they sit in files nobody has touched for 90 days.

## What this means

### For A (comment routing)

- **The filter as written selects nothing.** "Resolved threads, or ones with clear decision wording, on Official pages or `[spec]` frames" finds no Official pages and no `[spec]` frames. Replace it with the divider section the comment's node sits in: a node under `📐 Specs` (or `🔍 For Review`) counts as Official. That means walking the page list in order and taking the last divider above the node's page.
  - Page-level comments (FILE_COMMENT, which has no node anchor) cannot be placed in a section.
- **The owner join key is `Card <n>`, not `RM-<n>`.** Parse `\bCard\s*#?\s*(\d+)` from the file name, allowing `&`-joined pairs, and look up `ID = n` in the Roadmap.
  - That covers 100 of 245 files; 86 of 101 card numbers resolve.
  - One card number was shared by files in two teams.
  - The other 145 files fall back to the file's creator, which the brief already allows.
  - Files naming two cards need a rule: route to both cards, or to the first.
- **Scope by recency, not by resolved state.** 1,927 unresolved threads already exist, and 69% of them sit in files untouched for 90 days. The first sweep must start from a watermark (comments created or resolved since the last run), or it will surface years of backlog as "new decisions".
- **MISC and the Legacy files add little.** MISC has 1 card file, and Legacy files have no card. Consider leaving MISC out of A, or reading it only for @uno (F).

### For E (hygiene sweep)

- **The rules as written would flag almost everything.**
  - "Unlabelled frames in Official" has no Official page to check.
  - Applied to all pages, the prefix rule would flag 6,527 of 6,530 frames.
  - "`[wip]` over 30 days" finds 1 frame.
  - Because E reports only what's new since last week, the first run would still be a wall.
- **Rules that would mean something against the real scheme:**
  1. A file in a product team with no `Card <n>` in its name, excluding `Legacy` and library files.
  2. A `Card <n>` that does not resolve to a Roadmap card. There are 15 today, 7 of them in Others.
  3. A ⏳ WIP section in a file untouched for more than N days. At N = 30, 26 of 29 files would fire, so the baseline is noisy; N = 90, or "the card is Shipped or Archived but WIP is non-empty", is sharper.
  4. A 📐 Specs section that is empty or missing in a file whose card is Under Dev or Shipped.
- **Frame age is not available.** Rules that need it can only use file-level `last_touched_at`.
- **Fix the doc either way.** Either `docs/connectors/figma.md` is rewritten to describe the divider scheme and `Card <n>` (and A's and E's specs follow it), or the doc's scheme is adopted and existing files are migrated. Migration is manual; uno-bot never renames. This is Bill's call. Until it is made, the doc is the harness saying something that isn't true of the workspace.

## Sources

- Probe workflow: `.github/workflows/figma-conventions-probe.yml` on this branch; runs 36737465686 (pass 1) and 36739820299 (pass 2).
- Figma REST reference: <https://developers.figma.com/docs/rest-api/folders-endpoints/> (v2 folders, `folders:read`, Tier 2) and <https://developers.figma.com/docs/rest-api/projects-endpoints/> (v1 projects deprecated in favour of folders).
- Conventions under test: `docs/connectors/figma.md` § Placement / lifecycle prefixes, § File & page structure, § Agent duties.
- Roadmap: Notion data source `7fba5c35-da73-4c40-ac42-1c13db7794de`, property `ID` (`unique_id`, no prefix).
