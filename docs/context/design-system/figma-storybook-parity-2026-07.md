# Figma ↔ Storybook parity report (2026-07-13)

Full-inventory sweep across both Figma files and the Storybook docs after the
IA overhaul and BS4 library publish. Method: extracted every top-level
`COMPONENT`/`COMPONENT_SET` from **BS4 Foundation + Component Library**
(197 nodes) and every spec organism from **Web App Specs** (180 nodes,
per-page shallow section walk), then diffed against Storybook titles
(58 component/pattern pages, 266 spec MDX docs).

## Spec docs → Figma links: 100% node-id'd

Every `ResourcesBlock figmaLink` in `design-system/src/specs/**` now points at
a real Figma node (previously 145 were file-level placeholders):

| Tier | Count | Meaning |
|---|---|---|
| Pre-existing node-id | 121 | untouched |
| Name-matched | 28 | exact/prefix/contains match to a top-level Figma organism |
| Curated set-level | 70 | fine-grained sub-organisms (modal states, CTA buttons, filters) linked to their parent Figma component set |
| Page anchor | 47 | Toolkit micro-organisms with no Figma set — linked to their area's Figma page |
| **Placeholders remaining** | **0** | |

The 47 page-anchored docs are honest links (they open the right Figma page)
but each represents a Figma-side gap: the organism exists in code but was
never componentized in Figma. List: predominantly
`Toolkit/Pre-Session/Elements/**` (filters, steppers, dropdowns, snackbars)
and `Toolkit/In-Session/Elements/**` (badges, session controls).

## Component library: mapping status

Every Figma component page maps to a Storybook component page, with these
exceptions and notes:

| Finding | Side | Detail / decision needed |
|---|---|---|
| **Table** | code gap | Figma has 6 public Table sets (`Table/Normal Borderless`, `Small Borderless`, `Normal Border`, `Contextual Color`, `Background Color`, `_Base/Table`); code has `_internal/Table` only — no Storybook page. **Graduate `_internal/Table` → `components/layout-and-structure/Table`?** |
| **Navbar** | code gap | Figma has `Navbar`, `Navbar Components`, `NavBar Item(+Dropdown)` sets; code has `_internal/Navbar` — no Storybook page. **Graduate?** |
| **Pattern/Surface** | Figma gap | Storybook documents `Foundations/Patterns/Surfaces` (the `Surface` React shell) but the Figma Patterns page has no `Pattern/Surface` component (only Surface container/Card/Section/Modal/Table). Needs a designer to add the slot component. |
| **[wip] Card** | Figma note | The Card page is still marked `[wip]` in Figma while Storybook's Card docs are live. |
| **Input Group duplicates** | Figma cleanup | Three overlapping generations of Input Group sets coexist (`53:*` legacy, `13125:*`, `13659:*` + `13671:*` ver2). Candidates for the Archive page. |
| **Counter** | ok | Figma `Counter` badge set is covered by Badge subcomponent stories. |
| **Icon/Logo/Figure/Image** | ok | Foundation-level asset sets; documented under Foundations (Iconography/Logos/Imagery), not Components — intentional. |

## Naming sync (applied)

- BS4 `Side Bar Tab` → **`Sidebar Tab`** (matches `Components/Navigation/Sidebar tab`).
- BS4 `Pattern/Table shell` → **`Pattern/Table`** (matches `Foundations/Patterns/Table`).
- Web App Specs (earlier rounds): `Side Bar` → `Sidebar`, `Side Bar Tab` → `Sidebar Tab`, `App Outer Layout` → `Page Layout`.

## Token/visual drift

- **Badge** (found + fixed): code rendered 999px pills; Figma truth is rounded
  rects by size tier (h1–h3 8px / h4–h6 6px / b1–b3 4px). Fixed in `Badge.scss`.
- A per-component visual audit (screenshot diff of every set) is queued as its
  own background task; this report covers inventory/naming/link parity.

## Refresh procedure

Re-extract inventories with `use_figma` (top-level COMPONENT/COMPONENT_SET walk
per page; shallow SECTION walk for Web App Specs), diff against
`title:` fields in `*.stories.jsx` and `figmaLink=` in spec MDX. The spec
inventory snapshot lives at the extraction date in this report's git history.
