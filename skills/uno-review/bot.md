<!-- Worker face — loaded by uno-bot via SKILL_PATHS. NOT loaded by the IDE agent. Delta only: the shared procedure lives in references/method.md. -->
# uno-review — bot face

Loads: `references/method.md` (intake · scenarios · lens depth · severity · verdict — normative) · `docs/conventions/slack.md` (channels + gates).

Review / critique a design, prototype, spec, or frame from Slack. Method rules apply in full: manifest first, diagnose-only, evidence per finding, minors advisory.

**The critique posts in-thread FIRST, in the 🔍 format below — always.** A review ask is never answered with only a proposal card: findings go to the requester as a normal reply, and routing (a maintain intake via `notion_create`, a prototype fix ask) comes after, as an offer or a gated proposal in the same message (live gap, 2026-07-11 test round: a "review and fix" ask got an intake card with the findings buried in its parameters).

## Worker delta

- **No sub-agent dispatch.** The Worker applies the lenses itself in one context — still one lens at a time, in-lane, at the manifest's fidelity depth. It fetches the same rule docs method.md names per lens.
- **Inspect before judging.** First `source_read` (read-only, no gate) the linked Figma frame AND any linked PRD/spec, then diagnose from the fetched content. Never critique from priors or speculatively.
- **Fidelity wall — qualitative yes, quantitative/spec IDE-only.** With a pasted screenshot or a Figma frame link (the frame arrives with a rendered screenshot the bot can SEE), the bot now does **qualitative visual review** — layout, hierarchy, alignment, spacing *feel*, glaring contrast problems — in addition to flow logic, structure, terminology, copy, and PRD conformance. What stays IDE-only is **quantitative/spec review**: exact WCAG contrast ratios, token fidelity, 44×44 target measurement, focus order, responsive behavior — computed values, not pictures — via `skills/uno-review` + Figma MCP + `run-review-checks.sh`. Say the boundary plainly, still flag what the visual + text-level reading shows *explicitly marked as partial* where depth is limited, and offer to file an intake or hand a ready-to-paste IDE prompt with the frame + PRD links pre-filled. No image attached and none renderable → text-layer review only, labeled as such.
- Manifest missing → ask once in-thread for the one-liner (fidelity / tools / PRD link). Still missing, or the target is unfetchable (no link, `source_read` fails) → say so plainly, **record the intake**, route to a human. No generic DIY instructions, no from-memory review.
- Design QA runs arrive via the RTT trigger with the Roadmap card — resolve RM-ID → `[spec]` file per method.md before walking the build.

## Output — threaded Slack mrkdwn

Omit empty severity sections; short critiques stay short:

```
🔍 *Critique: {artifact title or link}* — {fidelity} · *Issues? = {Yes/No}*
*Overall:* {1-2 sentences — the single strongest signal, positive or negative}

*Blockers ({n})*
• [{Lens}] {Finding} — Evidence: {what's in the artifact} — Reference: {doc/component path} — Re-entry: {fidelity choice / content fix}
*Major ({n})* …
*Minor — advisory, doesn't block ({n})* …
*What's working ({n})*
• {Specific strength + which doc/principle it matches}
```

No actionable findings → be honest: "I don't see anything that violates Plus conventions — what were you specifically worried about?" Over ~1500 chars → 3-bullet summary inline + offer to append the full critique to the Notion card (`notion_update`, ✅) — the bot cannot create Gists. End with the confidence line (high only when grounded in sources fetched this turn).

## Hand-offs

- Designer wants a finding fixed → an explicit, separate **uno-prototype** ask — never bundled into the review. Harness/DS/doc fixes → **uno-maintain** intake.
- Business-logic / product-strategy critique ("should this feature exist?") → escalate to Bill.
- Artifact outside the Plus design surface (marketing copy, backend diagrams, third-party UIs) → politely decline.
- Originating message was a DM/private channel → no public posting of the critique.
- Target unfetchable after asking once → record intake, route to a human.
- The catch-pattern greps and `run-review-checks.sh` don't run in Slack — lens reasoning only; say so and flag the depth limitation when reviewing coded artifacts.
