---
summary: How a component records what changed about it — starting empty on 2026-08-26, never backfilled
---

<!-- Tier: 2 | Load when: shipping a change to a component | Route: design-system/guidelines/components/overview.md -->

# Component changelogs

Every component has a **Changelog** tab in Storybook. On 2026-08-26 every one of
them is empty, and that is the intended state.

Nothing in this repo produced a per-component history before that date. There is
no `CHANGELOG.md` outside `node_modules`, no `.changeset/`, and no convention any
component followed. A changelog written today about last quarter would be
reconstructed from commit messages by whoever happened to be looking — which is
a guess wearing a date. The tab starts empty and accrues forward.

## Writing an entry

Entries live in the component's story meta, beside the component, in the file a
change to that component already touches:

```jsx
const meta = {
  title: 'Components/Actions/Button',
  component: Button,
  parameters: {
    changelog: [
      { date: '2026-09-04', kind: 'added', summary: 'A `tonal` fill, for secondary actions on tinted surfaces.' },
      { date: '2026-09-01', kind: 'fixed', summary: 'The loading spinner no longer collapses the label width.' },
    ],
  },
};
```

- `date` — ISO `YYYY-MM-DD`. The day the change shipped, not the day it was written.
- `kind` — one of `added` · `changed` · `deprecated` · `removed` · `fixed`. Anything else renders with no kind rather than being coerced into one of the five.
- `summary` — one sentence, in the past tense, naming what a consumer would notice. Not the commit message.

An entry missing a valid `date` or a non-empty `summary` is dropped rather than
rendered half-formed. Order does not matter; the tab sorts newest first.

## What earns an entry

A change a consumer of the component would notice: a new or removed prop, a new
variant or size, a changed default, a visual change big enough to alter a
layout, a deprecation. Refactors, test additions, and token renames that resolve
to the same value do not — the generated
`design-system/src/components/<group>/<Name>/index.md` already states what the
component accepts today, and the changelog exists to say what stopped being true.

Nothing here is generated. The tab reads what the story file declares, so an
unwritten entry is simply absent — there is no stub, and no coverage number that
would make an empty changelog look like a gap rather than a fact.

## If entries stop being written

**This is decided, not open.** The mechanism above is cheap on purpose — one
array in a file the change already touches — and cheap is the only reason to
expect it to survive. If it stops being kept anyway, the answer is **not** more
authoring ceremony: no required template, no PR checklist item, no check that
fails a component for having no entry.

The answer is to generate the changelog from git history scoped to the component
folder — `git log --follow -- design-system/src/components/<group>/<Name>/` —
and render that instead. History already exists for every component, costs
nobody an edit, and is the one source that cannot drift from what happened. It
is worse prose than a written entry, which is why it is the fallback rather than
the first move.

The trigger to switch is a judgement, not a threshold: when the tab is empty for
components that have visibly changed.

## Related

- `design-system/guidelines/components/overview.md` — what each component is for
- `design-system/guidelines/documentation-ia.md` — the tabs these entries render in
- `docs/knowledge/changelog.md` — the same append-only shape, for the knowledge folder
