---
title: Claude-on-Vertex cron first-run gotchas (CLI prompt parsing, Model Garden enablement, turn budgets)
date: 2026-07-16
tags: [automations, vertex, claude-code-cli, github-actions]
rule_candidate: false
---

# Claude-on-Vertex cron first-run gotchas

**Problem:** the three new scheduled sweeps (integrity, Tier-1 digest, shipped
watchdog) all failed their first `workflow_dispatch` runs, for three distinct
reasons that will recur on any new claude-vertex automation.

**Root causes & fixes (in the order they surfaced):**

1. **`claude -p "$(cat file)"` breaks on YAML frontmatter.** Our prompt
   adapters start with `---`, which the CLI parses as an option
   (`error: unknown option '---'`). Fix: pipe the prompt via **stdin**
   (`claude -p ... < "$PROMPT_FILE"`). Baked into
   `.github/actions/claude-vertex/action.yml`.
2. **Model Garden enablement ≠ tier tables.** `hcii-plus` has ONLY
   `claude-sonnet-4-5@20250929` on the sonnet tier and `claude-opus-4-8` on
   opus — `claude-sonnet-5` and `claude-sonnet-4-6` both return "not available
   on your vertex deployment". The CLI's error names the nearest enabled model,
   which is an efficient probe. Implication: the Worker's `routing.ts` sonnet
   tier (`claude-sonnet-5`) will hit the same wall if `MODEL_PROVIDER` is ever
   flipped to `vertex-claude` before the admin enables it.
3. **Turn caps need headroom for allowlist denials.** The digest at
   `--max-turns 20` died at the cap ("Reached max turns") — reading
   conventions + window check + compose + post + sentinel plus a few denied
   command shapes needs ~25-30 turns. Now 40. Rule of thumb: budget ~1.5× the
   happy-path turn estimate when a tool allowlist is active.

**Prevention:** the composite action now surfaces the head of the output file
on nonzero exit (startup errors print before any transcript exists) — without
that, all three failures were invisible because stdout is deliberately never
published (public repo). First green runs: integrity sweep filed real intakes
(#71 missing canonical headers, #72 dead `@/forms` barrel ref); digest posted
sentinel-verified; watchdog reconciled on opus.
