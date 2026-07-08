<!-- Load for: the conventions-staleness sweep (monthly, at retro). Registry row: docs/conventions/automations.md. Run by reviewers/auditor — inspect and file intakes only, never fix in-sweep. -->

# Staleness sweep checklist

One intake per finding (evidence + suggested tier), through the normal pipeline in `method.md`. Tier 1 only for pure path/date/link rot; anything touching skills, persona, DS, or requirements is Tier 2.

## A. Mirror provenance

- [ ] Every `docs/conventions/*.md` mirror carries `source:` + `synced:` in its header.
- [ ] For each mirror, compare `synced:` against the source page's `last_edited_time` — drift → intake to re-sync (update body *and* `synced:` date).
- [ ] The staleness rule line ("prefer the source, file an intake") is present in each mirror.

## B. Agents ↔ docs cross-references (both ways)

- [ ] Every agent's "Conventions it obeys" pointers resolve to existing docs.
- [ ] Every "applied by `agents/<kind>/<name>`" pointer in docs names an agent file that exists.
- [ ] No agent restates a rule a doc owns (non-duplication rule, `agents/README.md`).
- [ ] Every row in `docs/conventions/automations.md` still names an existing agent and an existing skill method.

## C. Routing & path integrity

- [ ] `AGENTS.md` roster lists exactly six skills; each `skills/*/SKILL.md` + `bot.md` exists and both load `references/method.md`.
- [ ] Reference links inside each `SKILL.md` resolve (run `scripts/validate-doc-links.sh`).
- [ ] Paths referenced from `docs/context/design-system/` exist; index JSONs match current paths and commands.

## D. Token & DS integrity

- [ ] Token docs align with `design-system/src/tokens/*.scss`; no guidance conflicts with generated sources.
- [ ] Export barrels (`design-system/src/index.js`, `components/index.js`, `forms/index.js`) match the components docs reference.
- [ ] Storybook story paths referenced in docs still resolve under `.storybook/main.js` config.
