---
embodiment: ide
---

<!-- GOLDEN EXAMPLE — wireframe/static-mockup prompt-spec for an external tool
     (references/deliverables/wireframe.md Route C, Stitch). The source PRD is
     hypothetical and inlined below (no external fixture); the spec is
     downstream of the ASCII sketch in ascii-wireframe.md — the settled layout
     feeds this spec, which adds only what Stitch needs. -->

# Prompt-spec — Session notes quick-capture · wireframes (Stitch)

**Source PRD (inline, hypothetical):**

- During a live session, a tutor can jot short notes without leaving the
  session view.
- Each note is timestamped automatically and attached to the session.
- A tutor can review a session's notes afterward.

**Confirmed brief:** Goal = align stakeholders on layout before any build ·
Artifact = static wireframes, 3 screens · Fidelity = Visual low-mid
(wireframe-clean, real copy), Interaction none (static), Scope 3 screens ·
Won't include = note editing/deleting, sharing controls, session chrome
beyond the panel.

## Screens (layout settled in the ASCII pass — follow it)

1. **Notes panel, populated** — header "Session notes" + primary button
   "+ Quick note"; note list, each note: timestamp chip + text (1–2 lines);
   "view earlier notes" link at the bottom.
2. **Notes panel, empty** — same header; centered message "No notes yet.
   Capture a moment while it's fresh." with the same primary button.
3. **Capture composer** — back link, title "Quick note"; auto-timestamp line
   ("0:12 into session — added automatically"), note textarea, primary
   button "Save note".

## Copy (use verbatim — no lorem)

Note 1: 0:08 — "Borrowing in subtraction finally clicked — used base-10
blocks." · Note 2: 0:23 — "Rushed word problems; slow down next time and
underline the question."

## Out of scope — do not draw

Edit/delete controls · share or visibility toggles · student-facing views ·
any session chrome beyond the panel and back link.

## Open questions — answer before higher fidelity (do NOT invent)

1. **Editing:** can a note be corrected or removed after saving? The PRD is
   silent, so no edit/delete affordance is drawn.
2. **Visibility:** who besides the authoring tutor sees these notes —
   coordinators, the next tutor, the student? Unstated.
3. **Format:** plain text only, or checklists and length limits? The composer
   shows a plain textarea until ruled.

## Self-check (verify before returning; regenerate once if any fail)

- [ ] Exactly 3 screens, matching the settled layout above
- [ ] Empty state present with its call-to-action
- [ ] Real copy used verbatim — no placeholder text
- [ ] Wireframe fidelity — no color styling, no photography
- [ ] Nothing from the out-of-scope list appears
- [ ] Nothing drawn states a fact the PRD does not (e.g. an edit control or
      a share toggle) — an invented requirement is a defect, not a helpful
      default
