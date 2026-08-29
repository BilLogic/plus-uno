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
- **Whether anything is missing** — this was the third blind spot, and it is
  now closed once, by hand, in the section below. The npm script still only
  walks the registry outward; the reverse direction is a whole-file enumeration
  and has to be re-run the same way.

## Descriptions

A third sweep, recorded separately in [library-sweep.md](library-sweep.md):
66 of the 112 public component sets carried NO description, which is what a
designer reads in the assets panel. All 112 have one now, and writing them
surfaced a naming layer this audit could not see — four unnamed variant
properties, five sets still on Figma's default `Property 1` / `Variant2`
names, a `preppend`, and `error` where the rest of the system says `danger`.

## The reverse direction — 2026-08-29

Walked the file instead of the registry: every `COMPONENT_SET` on every page
except the dividers and the Cover.

```js
// use_figma, fileKey zAecJNRdvJzAUOcjV32tRX
for (const page of figma.root.children) {
  if (page.name.startsWith('───') || page.name === 'Cover') continue;
  for (const node of page.findAllWithCriteria({ types: ['COMPONENT_SET'] })) { /* … */ }
}
```

**157 component sets. 75 are mapped. 82 are not** — and the 82 are not one
problem:

| kind | n | mapped? |
|---|---|---|
| internal parts, `_`-prefixed | 38 | correctly not mapped — the file's own convention marks these as pieces, not products |
| on the `🗄 Archive` page | 6 | correctly not mapped |
| Foundations documentation sets (Color swatch sets, `Typography/*`, `Icon`, `Image`, `Figure`) | 10 | correctly not mapped — these document tokens, they are not code components |
| **public component sets with no mapping** | **28** | **the finding** |

### The 28

| page | set | node | variants |
|---|---|---|---|
| Choice Grid | Choice Grid Radios | `13541:7040` | 6 |
| Choice Grid | Choice Grid Checkboxes | `13541:10470` | 8 |
| Date & Time Picker | Time (no label) | `13662:9119` | 6 |
| Date & Time Picker | Month (no label) | `13686:6222` | 5 |
| Dropdown | Dropdown list Item | `37:6472` | 5 |
| Input | Form | `14841:25919` | 1 |
| Input Group | Input Group Text | `13125:6054` | 18 |
| Input Group | Input Group Checkbox | `13125:6127` | 12 |
| Input Group | Input Group Radio | `13125:6164` | 9 |
| Input Group | Input Group Button | `13125:6192` | 18 |
| Input Group | Input Group Text | `53:20700` | 6 |
| Input Group | Input Group Checkbox | `53:20962` | 4 |
| Input Group | Input Group Radio | `53:20972` | 3 |
| Input Group | Input Group Text | `13659:1414` | 1 |
| Input Group | Multiple Inputs | `13612:78094` | 4 |
| Input Group | Multiple Dropdown | `13612:78859` | 2 |
| Rating | Rating Icons | `13527:17892` | 2 |
| Select | Multi-Select Option | `15685:6233` | 3 |
| Tree Select | tree_dropdown layers | `13529:1075` | 8 |
| Tree Select | tree_dropdown component ver 1 | `13520:62188` | 3 |
| Tree Select | Indented Tree Select Item List | `13520:70443` | 9 |
| Accordion | accordion-item | `13667:4944` | 10 |
| [wip] Card | Card Components | `59:15771` | 8 |
| Nav Tabs & Nav Pills | Navbar Components | `72:16339` | 7 |
| Nav Tabs & Nav Pills | NavBar Item | `4209:30087` | 9 |
| Nav Tabs & Nav Pills | NavBar Item Dropdown | `4209:30187` | 9 |
| Nav Tabs & Nav Pills | Tab Item | `4209:20411` | 9 |
| Nav Tabs & Nav Pills | Pill Item | `4209:29515` | 9 |

### What the 28 are NOT

**They are not 28 missing components.** Reading them:

- **Nine are sub-parts of a mapped component** — `accordion-item`, `Tab Item`,
  `Pill Item`, `NavBar Item`, `NavBar Item Dropdown`, `Dropdown list Item`,
  `Multi-Select Option`, `Rating Icons`, `Card Components`. Their parent set is
  mapped; the code renders them from the parent's props rather than as
  separate exports. Mapping each would add rows nobody could act on.
- **Three are the same name three times** — `Input Group Text` at `13125:6054`
  (18 variants), `53:20700` (6) and `13659:1414` (1). That is the ver1 / ver2 /
  legacy layering the library keeps on purpose. Which is current is a question
  for design; a registry entry has to pick one and would be picking silently.
  `Tree Select` has the same shape: `tree_dropdown component ver 1` beside the
  mapped `tree_select_ver2`.
- **Two are legitimately unmapped variants of a mapped component** —
  `Time (no label)` and `Month (no label)` on the Date & Time Picker page, the
  labelless twins of `Time (Date Picker)` and `Month (Date Picker)`. Whether
  the code's `DatePicker` covers the labelless case is a design question, and
  it is the same question the `13549:6703` entry above raises.

So the number worth acting on is smaller than 28, and every reduction above is
a judgement rather than a measurement — which is exactly why the list is
recorded whole rather than filtered down to a number.

### Correcting an earlier claim

Issue #339 carries "29 unreferenced / 17 unmapped". Those were measured against
`scripts/figma-component-snapshot.json`, which was seven weeks old at the time.
**The numbers above replace them**, and they were read live.
