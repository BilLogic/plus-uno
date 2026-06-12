<!-- ~300 tokens | Load for: staleness prevention checks on .agent docs -->

# Sync Checklist

Use this checklist to prevent `.agent` guidance from going stale.

## A. Skill Routing Integrity

- [ ] `.agent/SKILL.md` still lists exactly six skills (research, plan, prototype, review, post, compound).
- [ ] Routing logic table maps signals to correct skills.
- [ ] Each skill SKILL.md path in `.agent/skills/*/SKILL.md` exists.

## B. Path Accuracy

- [ ] Every path referenced in `docs/context/design-system/` exists.
- [ ] Every path referenced in nested reference files (for example mode references and core references) exists.
- [ ] Skill `references/` directories contain only relevant index/guide files.
- [ ] Import conventions still match `design-system/src` and Storybook alias config.

## C. Token Integrity

- [ ] Token docs align with `design-system/src/tokens/*.scss`.
- [ ] Semantic token layer examples still valid.
- [ ] No hardcoded-value guidance conflicts with source conventions.

## D. Component Discovery Integrity

- [ ] Export barrel files still valid.
- [ ] Representative story example paths still valid.
- [ ] Spec directory references still valid.

## E. Integration Integrity

- [ ] Figma workflow links resolve.
- [ ] Token sync scripts and env variable names still accurate.
- [ ] CI workflow path and behavior still accurate.
- [ ] Index JSON files in skill `references/` and `docs/context/design-system/` still match current paths and commands.

## F. Suggested Drift Check Commands

```bash
rg --files .agent
rg -n "design-system|playground|.storybook|scripts/" .agent
.agent/scripts/validate-doc-links.sh
```
