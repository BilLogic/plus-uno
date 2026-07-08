<!-- Load for: the conventions-integrity sweep (monthly, at retro). Registry row: docs/conventions/automations.md. Run by reviewers/auditor — inspect and file intakes only, never fix in-sweep. -->

# Integrity sweep checklist

One intake per finding (evidence + suggested tier), through the normal pipeline in `method.md`. Tier 1 only for pure path/date/link rot; anything touching skills, persona, DS, or requirements is Tier 2.

## A. Canonicality headers (conventions are repo-canonical — ADR-017)

- [ ] Every `docs/conventions/*.md` header declares `status: canonical` with a `distilled:` lineage date.
- [ ] No conventions file still carries a "prefer Notion on conflict" rule line.
- [ ] Legacy Notion playbook pages duplicating a conventions file carry a superseded banner pointing at the repo — missing banner → intake for writers/notion.

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
