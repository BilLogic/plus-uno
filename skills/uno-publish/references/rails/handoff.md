---
embodiment: ide
summary: The handoff rail — componentize, Handoff Spec, review gates, and dev sign-off.
---

<!-- ~450 tokens | Load when: the rail decision is HANDOFF — dev-ready package, sign-offs, marketplace -->

# Handoff rail — IDE execution

1. **Componentize & spec** — decompose into DS components with explicit tokens,
   states, behaviors; summon `writers/figma` for spec promotion and Dev-Mode
   annotations.
2. **Handoff Spec** — summon `writers/notion` to instantiate the team's Handoff
   Spec template on the project hub (template pointers:
   `docs/connectors/notion.md`).
3. **Rails propagation** — inside the designer-confirmed handoff only,
   apply-logged:
   - `uno-storybook`: update stories/MDX in `design-system/` directly (in-repo
     write; validate in Storybook).
   - `uno-blueprint`: this skill holds no blueprint write access
     (`docs/connectors/supabase/overview.md`) — route the paired PRD + blueprint update
     through `skills/uno-maintain`, citing the confirmed handoff as
     pre-authorization.
4. **Review gate** — hand to `skills/uno-review` for DS / UNO / a11y. Findings
   route back to prototyping; re-review after fixes — hand the prototype's
   one-line artifact manifest forward with the package.
5. **Human gate** — dev + PM + stakeholder ✅ sign-offs in the handoff thread
   (uno-bot collects). Verify all three exist before proceeding. **No sign-off,
   no publish.**
6. **Marketplace entry** — load `references/marketplace.md` and register the
   prototype.
