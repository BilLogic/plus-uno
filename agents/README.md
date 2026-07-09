# agents/ — WHO does the work

Agents are roles skills summon — **never taught to users, never invoked directly**. The interaction contract: humans speak in skills · skills summon agents · agents obey conventions.

## The three kinds + the embodiment

| Kind | Does | Roster (defined 2026-07-07, at their first invocation sites — the Phase-1 skill bodies) |
|---|---|---|
| `researchers/` | gather — isolated heavy reads, return findings not file dumps | `explorer` (codebase) · `source-miner` (Slack/analytics/research-DB) · `people-scout` (SME + participant sourcing) |
| `reviewers/` | judge — parallel lenses, checklists, rubrics | `ds-lens` · `uno-lens` · `a11y-lens` · `design-qa` (Figma spec vs QA site) · `rubric-applier` (any rubric → scored verdict → eval run) · `auditor` (registry checklists → intakes) |
| `writers/` | write to external estates — **the only agents allowed to** | `notion` · `figma` · `blueprint` (paired PRD+blueprint writes, never one alone; also the single access point for blueprint *reads*) |
| `uno-bot/` | the Slack embodiment — definition (AGENT.md) + body (Worker code) in one folder | active |

Slack needs no writer: the uno-bot embodiment IS the Slack actor.

## Anatomy of an agent file

```
agents/<kind>/<name>.md         (a folder when the agent has an executable body — uno-bot/)
├─ frontmatter                  name · description · model (optional)
├─ Role & responsibility        who it is · what it owns · what it must NOT do
├─ Invoked by                   which skills / automations summon it
├─ Workflow                     how it executes when summoned
└─ Conventions it obeys         POINTERS ONLY — an agent never restates a rule; docs may point back with one line
```

## Rules

1. **Creation rule:** a new agent needs ≥2 invocation sites or a demonstrated isolated-context benefit (heavy reads, parallel lenses, headless execution). Never speculative — every file in this folder names its invocation sites; a role that loses all of them gets archived.
2. **Voice is a convention, not a role:** every writer and skill applies `docs/conventions/writing-style.md` to human-facing text. There is no copywriter agent.
3. **The auditor inspects and files; writers fix.**
4. **Agents ↔ docs, no duplication:** agents point to the docs they enforce; docs may carry a one-line "applied by `agents/<kind>/<name>`" pointer back. A rule lives exactly once. The uno-maintain staleness sweep checks these cross-references both ways.
5. Every row in `docs/conventions/automations.md` names its agent — an automation without one is unowned by definition.
6. **Frontmatter `tools`/`model` are optional** — declare `tools` when a role is read-only (makes the Must-NOT mechanical if the roster is ever registered as real subagents) and `model` when a sweep is cheap enough for a smaller tier. The uno-bot embodiment (AGENT.md + Worker code) is exempt from the file anatomy above — it is a concatenated persona delta, not a Task-dispatched role.
