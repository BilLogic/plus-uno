---
title: "Blueprint skills (whatif / audit / slice) as uno-bot slash commands"
type: feat
status: draft
date: 2026-08-06
---

# Blueprint skills in Slack

Bring `sb:whatif`, `sb:audit`, and `sb:slice` to uno-bot as `/uno-*` slash
commands. **`sb:map` is deliberately excluded** — it ingests, imports, deploys,
and takes hash-bound sign-off. None of that is a Slack interaction, and none of
it is possible on a read-only key.

## What exists today

**The bot knows the blueprint as a TOOL, not a skill.** `blueprint_search`
(`src/tools/blueprint-search.ts` → `src/integrations/blueprint.ts`) reads the
Supabase over PostgREST with three degrading paths: semantic vector search
(`semantic_search.match_corpus_chunks`, ~2 subrequests), the `search_blueprint`
RPC (one subrequest), then direct table queries. Rows carry `layer` and `step`,
which is why answers attribute activities to actors instead of guessing.

**The skills are a plugin.** Canonical home is `BilLogic/agentic-service-blueprinting`
(installed locally as the `sb` plugin, v0.2.2): four skills, five subagents
(`auditor`, `impact-tracer`, `document-reader`, `blueprint-reviewer`,
`render-checker`), Python tooling (`audit_tools.py`, `slice_tools.py`,
`compute_signoff_hash.py`), and a validated JSON IR on disk.

**There is already a second consumer, and it set the pattern.**
`BilLogic/plus-uno-blueprint` vendors the plugin's `references/` and `skills/`
into `src/lib/agent/skill/`, one-way, via `scripts/sync-agent-skill.mjs`, whose
`--check` mode exits 1 when vendored bytes drift from source. The vendored
`whatif.md` is byte-identical to the plugin's.

uno-bot should be the **third consumer of the same files**, not a fork.

## The two constraints that shape everything

**1. uno-bot cannot run these skills as written.** They assume subagents,
Python, a filesystem IR, and DB writes. The Worker has a 50-subrequest budget
per invocation, no subagents, no Python, and a read-only anon key. A port is
not on the table; what is on the table is a *Slack half* per skill.

**2. Read-only is the correct ceiling, not a limitation to route around.**
The bot's access should equal what an unauthenticated browser viewer gets. That
maps cleanly onto how the skills already draw their own lines:

| skill | its own write rule | Slack fit |
|---|---|---|
| `whatif` | "never writes cells or DB variants"; only `findings` rows; promotion goes through a change-request → `sb:map` handoff | **best fit** — read + reason + report is the whole skill |
| `slice` | "a slice never invents. It selects, orders, captions, and cites" | **strong fit** for composing/presenting; the write-back is out of reach |
| `audit` | "never fixes anything: it points, with severities, at cells by key" | **read half only** — reporting and triaging findings; running the roster spawns a fresh auditor per check |
| `map` | writes everything | **excluded** |

Every write path stays where it is today: a proposal behind the ✅ gate, or a
handoff prompt for the IDE. The bot's job here is to *answer*, not to change.

## Slack-first output is the actual design work

The vendored skill bodies are written for an IDE agent whose output is files
and long markdown. That is the wrong shape for Slack, and copying it across is
the main risk in this plan — a wall of harness prose in a DM is a worse answer
than three sentences and a citation.

The `bot.md` for each skill carries the Slack contract:

- **Answer first, evidence under it.** No preamble, no restated question.
- **Cite by cell key**, the way `blueprint_search` answers already cite rows.
- **Block Kit, not markdown documents.** Sections, a context footer, and the
  existing 👍/👎 + disclaimer. Long output is a thread, never a wall.
- **Say where the ceiling is.** When the answer needs a write — promoting a
  whatif, saving a slice, resolving a finding — name it and hand off, the way
  `uno-prototype` hands IDE work back as a ready-to-paste prompt.
- **Zero results is not "nothing exists"** — the same honesty rule
  `slack_search` already enforces.

`references/method.md` stays the runtime-neutral core and is vendored from the
plugin near-verbatim (the playbooks — `whatif-playbook.md`, `audit-playbook.md`,
`data-model.md`, `layer-roles.md`, `lane-vocabulary.md` — are the domain logic
and should not be paraphrased).

## Phases

**A. Tooling gap.** `blueprint_search` returns matching rows; whatif needs to
walk `trigger`/`needs` edges (the `impact-tracer` agent's job in the plugin) and
audit needs to read `findings`. Decide: add a `blueprint_trace` tool, or accept a
shallower Slack answer that names affected cells without the graph walk. This
decision gates the quality of `/uno-whatif` and should be made before authoring.

**B. Vendor + drift check.** Mirror `sync-agent-skill.mjs`: one-way copy from
the plugin repo into `skills/uno-*/references/`, with a `--check` mode wired
into the staleness sweep. Pin the plugin version in a header comment.

**C. Author `bot.md` per skill** (whatif → slice → audit), then
`npm run generate:skill-surfaces` — slash commands, IDE stubs, and the Worker
dispatch map all fall out of one scan.

**D. Ship.** Paste the regenerated `slack-app-manifest-commands.yaml` block into
app settings (the manifest API is dead for this app — PKCE; the web editor
works). Deploy so the harness bundle carries the new skills. Verify with
`npm run slack:diff` and a live DM per command.

## Open questions

1. **Does the anon role actually grant read on the tables these need** —
   cells, edges, `findings`? `blueprint_search` proves cells are readable;
   edges and findings are unverified. If not, that is a Supabase RLS change and
   belongs to the blueprint repo, not here.
2. **Is `search_blueprint` / the `semantic_search` schema deployed?** The code
   carries fallbacks for both, so the bot may be silently running the slow path
   today. Worth confirming before adding load.
3. **Three new commands or one?** `/uno-blueprint [whatif|audit|slice]` keeps
   the slash menu small and the three share a domain; three commands are more
   discoverable. Recommend three — discoverability is why the six `/uno-*`
   commands exist at all.
