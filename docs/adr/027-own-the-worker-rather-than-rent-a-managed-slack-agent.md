---
embodiment: ide
summary: uno-bot stays a self-hosted Worker rather than a managed Slack agent, until a managed agent can hold the proposal gate and reach the blueprint and Notion, or the plumbing costs more than a stated bound (2026-09-04)
status: active
verified: 2026-09-04 (#422)
---

# ADR-027: Own the Worker rather than rent a managed Slack agent (2026-09-04)

**Decision.** uno-bot stays what it is: a Cloudflare Worker at `agents/uno-bot/`,
running Gemini via Vertex (ADR-018), owned and maintained by this repo. A managed
Slack agent is not adopted, and the question is closed until one of the two
triggers below is observed. The harness spec
([#417](https://github.com/BilLogic/plus-uno/issues/417)) proceeds on the Worker.

**Why.** Managed alternatives now exist — Claude in Slack is one — and the team
had never weighed owning the plumbing against renting it. A decision never made
gets remade by accident every time the plumbing costs a week, so this one is
written down once, with what would reopen it.

The plumbing is real, and all of it exists only because the bot is self-hosted:
the Gemini client, an explicit context-cache manager
(`agents/uno-bot/src/gemini/cache.ts`), tier routing
(`agents/uno-bot/src/agent/routing.ts`), a fallback model
(`GEMINI_FALLBACK_MODEL` in `agents/uno-bot/wrangler.toml`), the prompt bundler
(`agents/uno-bot/scripts/bundle-harness.mjs`) and the char budgets it asserts,
roughly eight harness checks, the auth-gated `/debug/*` routes in
`agents/uno-bot/src/index.ts`, and the Slack proposal and confirmation machinery
in `agents/uno-bot/src/slack/`. A managed agent would make most of that
someone else's problem.

Three reasons it stays ours, for now:

1. **The gate and the grounding are custom logic.** A side-effect tool stages a
   proposal card and runs only on a confirmation in the thread
   (`agents/uno-bot/src/slack/gate.ts`). Answers are grounded across three
   estates — the blueprint for the current state, the Notion Roadmap for planned
   work, the design system for DS claims — and a conflict between them is
   surfaced, never blended (ADR-021). No managed agent is known to offer either.
   Whether a managed agent can call the team's own HTTP tools behind a
   confirmation gate, reach Supabase and Notion, and expose eval hooks has
   **not been verified**; this ADR records the absence of that evidence, not a
   finding against it.
2. **Gemini on Vertex is a deliberate cost and quota decision.** Usage is
   attributable to the `hcii-plus` project quota, and the model tiers are chosen
   per turn (ADR-018, and the tier decisions in #417). A managed agent fixes the
   model and the bill.
3. **The plumbing is built.** What remains to pay is maintenance, and the
   harness spec (#417) exists to reduce it: a smaller always-loaded prompt, a
   `read_reference` tool, and five checks that hold the shape.

**Re-decide when** either of these is observed:

- A managed Slack agent is shown to call the team's own tools behind a
  confirmation gate **and** reach the blueprint and Notion. "Shown" means a spike
  run against the existing eval suite (`agents/uno-bot/scripts/run-evals.mjs`),
  not a feature list.
- Plumbing maintenance exceeds a bound. The bound is **TBD by Bill**; the
  suggested unit is hours per month spent on the self-hosting plumbing named
  above, as distinct from work on the harness documents themselves.

**Consequences.** The question is closed until a trigger fires; a "should we
just use X" thread points here. A spike against the eval suite is the way to
reopen it, and the spike's scorecard is the evidence a superseding ADR would
carry. Nothing in the Worker changes because of this ADR, and the harness spec
proceeds on the Worker without hedging for a platform move. Recorded under
[#422](https://github.com/BilLogic/plus-uno/issues/422); the one-line pointer
from the constitution's identity section is #420's.

— Bill, Sep 2026 (decided in the #417 spec; recorded by uno under #422, and the bound is still his to set)
