---
embodiment: ide
summary: The two-vocabularies rule is ratified — blueprint words and Roadmap words never mix, and CONTEXT.md is its only home (2026-08-25)
status: active
verified: 2026-08-25 (#164)
---

# ADR-023: The two-vocabularies rule is ratified (2026-08-25)

**Decision.** The rule stands: `uno-blueprint` speaks service-blueprint vocabulary
(`phase` · `scenario` · `path` · `step` · `lane` · `cell`) and the Notion Roadmap
speaks project-management vocabulary (`card` · `RM-ID` · `Design Status` ·
`Product Pillar` · `Product Tag` · `Intake Status`). Findings are reported in the
vocabulary of the estate actually read, and a question is routed by its frame
words rather than its topic. The canonical statement is `CONTEXT.md` § Two
vocabularies; the constitution carries a pointer and no second copy.

**Why it needed ratifying.** The census behind #164 found the rule cited as law in
the constitution, shaping every reply, with no ADR and no sign-off — an agent had
written it. This ADR is the review it never had. It survives the counterfactual
test on evidence rather than taste: without it an agent answers a "where are we
on X" question out of the blueprint, which holds no statuses, or reports blueprint
rows as "cards", and ADR-021 already records that source-blending was the sharpest
failure mode in the grounding eval. The vocabulary split is also what makes
ADR-021's routing table executable — routing by claim type presumes the two
estates are named apart.

**What was corrected on the way in.** The table in `CONTEXT.md` described a `path`
as "identified by NAME, not `path_type`". That rule is dead: `blueprint-navigation.md`
§4a states `path_type` is a real three-value vocabulary and is now worth reading.
The table now says to read both, matching the navigation guide.

**Consequences.** `CONTEXT.md` is the single home; `AGENTS.md` § Identity carries a
one-line pointer to it and to this ADR. The FRAME-words-render-as-code convention
(Bill, Jul 2026) stays with the table it governs. Any future edit to the
vocabulary lands in `CONTEXT.md` and is reflected here, not restated in the
constitution.
