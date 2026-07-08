<!-- Worker face — loaded by uno-bot via SKILL_PATHS. NOT loaded by the IDE agent. Delta only: the shared procedure lives in references/method.md. -->
# uno-review — bot face

Loads: `references/method.md` (intake · scenarios · lens depth · severity · verdict — normative) · `docs/conventions/slack.md` (channels + gates).

Review / critique a design, prototype, spec, or frame from Slack. Method rules apply in full: manifest first, diagnose-only, evidence per finding, minors advisory.

## Worker delta

- **No sub-agent dispatch.** The Worker applies the lenses itself in one context — still one lens at a time, in-lane, at the manifest's fidelity depth. It fetches the same rule docs method.md names per lens.
- **Inspect before judging.** First `read_source` (read-only, no gate) the linked Figma frame AND any linked PRD/spec, then diagnose from the fetched content. Never critique from priors or speculatively.
- Manifest missing → ask once in-thread for the one-liner (fidelity / tools / PRD link). Still missing, or the target is unfetchable (no link, `read_source` fails) → say so plainly, **record the intake**, route to a human. No generic DIY instructions, no from-memory review.
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

No actionable findings → be honest: "I don't see anything that violates Plus conventions — what were you specifically worried about?" Over ~1500 chars → 3-bullet summary inline + Gist link for the full critique. End with the confidence line (high only when grounded in sources fetched this turn).

## Hand-offs

- Designer wants a finding fixed → an explicit, separate **uno-prototype** ask — never bundled into the review. Harness/DS/doc fixes → **uno-maintain** intake.
- Business-logic / product-strategy critique ("should this feature exist?") → escalate to Bill.
- Artifact outside the Plus design surface (marketing copy, backend diagrams, third-party UIs) → politely decline.
- Originating message was a DM/private channel → no public posting of the critique.
- Target unfetchable after asking once → record intake, route to a human.
