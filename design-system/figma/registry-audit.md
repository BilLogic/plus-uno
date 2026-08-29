# Figma registry audit

`component-registry.json` maps 59 code components to 97 Figma nodes, and 87 of
those carry `status: "verified"`. **Nothing in this repository can check that
word.** A node id only resolves inside Figma, and no CI job has Figma access —
so `verified` was load-bearing and unbacked for as long as it has existed.

This file is where the claim gets backed. Re-run the audit with:

```bash
npm run audit:figma-registry
```

It prints the mapped ids grouped by file, plus a ready-to-run Plugin API script
per file. Paste each into `use_figma` against that file's key and record what
comes back here, with the date.

## Why grouped by file

The registry spans **two** Figma files, and that is the first thing to get
wrong. `figmaMeta.fileKey` is per-component:

| file | key | nodes |
|---|---|---|
| Design System - BS4 Foundation (Component Library) | `zAecJNRdvJzAUOcjV32tRX` | 87 |
| Design System - Web App Specs | `W0qzhXWxFsMwSJzkdV2yal` | 10 |

The first pass of this audit checked all 97 against the BS4 file and reported
thirteen missing nodes. Ten of those were the Web App Specs components —
`TopBar`, `Sidebar`, `PageLayout`, `UserAvatar` and the rest — and the registry
was right about every one of them. **Only three of the thirteen were real.**

## 2026-08-29

97 nodes, both files.

### Resolved to nothing — 4 fixed

Every one was marked `status: "verified"`, and every one generated a Figma link
that opens on nothing.

| component | set | was | is | note |
|---|---|---|---|---|
| RadioButtonGroup | Scale Options | `13536:9084` | `13536:9083` | off by one |
| RadioButtonGroup | Linear Scale | `13611:16853` | `13536:9208` | a different node entirely, not a near miss |
| Rating | Rating System (with text) | `13536:196` | `13536:195` | off by one |
| Footer | Footnote | `111:227939` | `111:227940` | pointed at an **instance** of the component |

Two off-by-ones is the shape of an id copied from a child frame rather than
from the component itself. The Footer case is different and worth calling out:
its own note asked design to "promote it to a component" — but the component
already existed at `111:227940`, and the registry was simply linking a copy of
it. The request was for work that had already been done.

### Not a component set — 12, unfixed and recorded

The field is called `componentSetNodeId`. Twelve nodes are not sets:

| kind | n | which |
|---|---|---|
| `PAGE` | 3 | Badge, Button (both `source: docs-page`, honest) · **DatePicker `13549:6703`**, which is marked `verified` and is a docs page |
| `COMPONENT` | 9 | Card, Dropdown List, Rich Text Editor, Scrollbar, Scale Options, Linear Scale, Rating System (with text), Maintenance Alert, Page Layout |

A plain `COMPONENT` is not an error — a component with no variants has no set —
but the field name says otherwise, and a write-back that assumed
`componentPropertyDefinitions` on one of these would fail on the getter (see
`figma-use` rule 18). The four repointed above now carry
`"isComponentSet": false`. The rest are left as they are: relabelling nine
entries is a schema change to the generator and its check, and belongs in its
own pass rather than being smuggled into a fix for four broken links.

`DatePicker / Date & Time Picker → 13549:6703` is the one that is arguably
wrong rather than merely mislabelled: it is a `verified`, `manual`-sourced
mapping to a PAGE. That page holds four sets — `Month (Date Picker)`
`13574:1150` and `Time (Date Picker)` `16560:4508` are already mapped
separately, and `Time (no label)` `13662:9119` and `Month (no label)`
`13686:6222` are not mapped at all. Which of those the component actually
corresponds to is a design question, so it is recorded rather than guessed.

### Resolved correctly

70 of 87 in the BS4 file resolve to a `COMPONENT_SET`. All 10 Web App Specs
nodes resolve; 7 are sets, 2 are components, and the Footnote instance is fixed
above.

## What this audit still cannot tell you

- **Whether the mapped node is the RIGHT one.** `Alert → 11:324` resolves to a
  component set named `Alert`. Whether it is the alert the code implements is a
  judgement no id check makes.
- **Whether the variant props still line up.** `figmaMeta.variantProps` records
  name divergences (TopBar's Figma `expand?` vs code's `mode`). Nothing
  re-reads them.
- **Whether anything is missing.** This walks the registry and asks Figma. It
  never walks Figma and asks the registry, so a component that exists in the
  library and is mapped nowhere is invisible here.
