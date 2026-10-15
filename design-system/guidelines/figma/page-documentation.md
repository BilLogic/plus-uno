---
embodiment: ide
summary: The page standard for the BS4 Foundation Figma library — one Section per documented component, the 80 px gap and reflow, annotations on every set and part, the Docs frame and its seven sections, naming, what a page must not hold, tokens, and the done test.
---

<!-- Tier: 2 · Load when: building, cleaning or reviewing a page in the BS4 Foundation library -->

# Figma page documentation standard

Every page in the BS4 Foundation library (`zAecJNRdvJzAUOcjV32tRX`) documents
its component families. Each family lives in one **Section** that holds its
parts, its sets and its **Docs frame**, laid out on one row with an 80 px gap.
Each set and part carries native annotations for the developer reading it in
Dev Mode. The model is the Range page, drawn inside a Section: its parts, its
set and `Docs / Range`, left to right.

## Sections

One Section per Docs frame. The Section named `<Component>` holds
`Docs / <Component>`, every public set that Docs frame documents, and their
`_` parts. A one-family page has one Section. A page with several families has
one Section per family: Status, Count & Tag gets three, Button gets Button and
Close Button, Loading gets Spinner and Skeleton.

Why this rule: the cleanest pages (Range, Label & Caption) already put parts,
set and Docs frame on one row, and the pages that hold several families are the
ones a reader gets lost on. A Section around each family draws that boundary,
gives the family one node to link to, and is the same shape on a one-family
page and a many-family page.

- A part used by two families sits in the Section of the family that owns it
  in code.
- Two more Section kinds may sit on a page, each below the family row:
  - **Review** — work awaiting sign-off, named `Review — <topic>`. It is
    removed, or folded into the family Sections, once Bill signs off.
  - **Deprecated** — sets kept only until their instances are swapped, named
    `Deprecated — <reason>`. Anything with no live instances moves to the
    🗄 Archive page.
- Sections do not nest.

Divider pages (`─── Components · Forms & Inputs ───`) stay empty. The Cover,
🗄 Archive and Proposals pages are outside this standard.

## Layout and spacing

Inside a Section, read left to right, all top-aligned on one row:

1. **Private parts** (`_Name` sets) stack in one column, top-down.
2. **Public sets** come next, the primary set first.
3. **The Docs frame** comes last.

Family Sections sit side by side on one row, top-aligned, in the order the
Storybook sidebar lists them. Review and Deprecated Sections sit on a second
row below.

**The gap is 80 px everywhere**, the value of `space-1000`
(`size / primitive/Spacing/Large`): between nodes in a Section, between a
Section's edge and its content, and between Sections. A Section has no
auto-layout, so the gap is placed by hand rather than bound; the scan holds it.

**Nothing overlaps.** No two top-level Sections, no two nodes inside one
Section, and no two variants inside one set share any area, and every node sits
wholly inside its Section.

**When a set grows, everything after it reflows** in the same edit:

1. Move each node right of the set (or below it, in the parts column) so its
   gap to the set is 80 again.
2. Resize the Section to its content plus 80 on every side.
3. Move every Section to the right of it by the same growth.
4. Re-run the scan; it reads zero overlaps, tight gaps and spills.

Variants inside a set follow the set's own grid. When a set gains a variant
axis or value, lay its variants out again so no two touch.

## Annotations

Every public set and every `_` part carries Figma's native annotations
(`node.annotations`), written in `labelMarkdown` and filed under one of the
file's four preset categories: **Development**, **Interaction**,
**Accessibility**, **Content**. The file's custom categories (Before, Guidance,
Tooltip) are left for design reviews.

Annotate the `COMPONENT_SET`, or the `COMPONENT` when it stands alone. The
Plugin API attaches annotations to sets, components, frames and shapes, never
to a `SECTION`, so a note about the whole family goes on its primary set. A
note true of one variant only goes on that variant.

| Node | Category | Holds |
|---|---|---|
| Public set | Development (required) | One line of purpose; the code component and its import from `@/components`; the key properties, each as `Figma property → code prop`. |
| Public set that responds to input | Interaction (required) | What hover, focus, press, open and close do, including states that exist only in code. |
| Public set a person operates or reads meaning from | Accessibility (required) | The role, where the accessible name comes from, the keyboard keys, and what conveys state besides colour. |
| Public set with copy rules | Content | Length, case and wording rules for its text. |
| `_` part | Development (required) | What the part is, the public set that uses it, and the swap or slot it fills there. |

The description says what the component is in a sentence; the annotation says
how to build it. Keep each to its own job.

Example, the Development annotation on `Form Range Input`:

```md
**Range** — picks one number from the span between `min` and `max`.
Code: `<Range>` from `@/components`.
- `state` → no prop; Figma draws `default` only
- Code only: `min`, `max`, `step`, `size`, `showLabel`
```

Read every name from the set's properties and the component's `.jsx`
before writing it.

## The Docs frame

Name it `Docs / <Component>`, using the Storybook display name, and name its
Section `<Component>`. One per family.

It is a vertical auto-layout frame, 1472 wide, hugging its height. Each section
is a child frame named `Docs / <Component> / <Section>`, led by its heading,
in this order:

| Section | Holds |
|---|---|
| Header | Title, one paragraph on what it is and when to reach for it, the `@/components` import line, and the Figma sets it covers with their node ids. The Code and Storybook links live on the set as dev resources; the Header says so. |
| Anatomy | One live instance in an example card, with numbered callouts and a key that names each part. |
| Properties | A table: Property · Type · Values · Default · Code prop. One row per set and property. Write "—" where code has no matching prop, and say why. |
| Variants | One example card per variant axis, each cell labelled `axis=value`. |
| States | Each Figma state as a live instance, and a line on any state that exists only in code (hover, focus). |
| Usage | Rules, each a short imperative heading, a paragraph, and a do and don't card where a picture settles it. |
| Related | A bulleted line per neighbour: "• A need → Component." |

Every section is present. When one has nothing to show, it says so in a line
("One state in Figma (default).") rather than disappearing.

Foundation pages (Color, Typography, Spacing, Elevation, Layout & Grid,
Iconography, Patterns) use the same frame and naming with Header, one section
per topic, Usage and Related.

## Naming

- Every frame, group and section carries a name a reader would search for.
  Name it after its role (`Header row`, `Do and don't`, `size=small`).
- Sets use the code component's name; private parts start with `_`.
- Variant properties are lowercase; booleans end in `?`; values match code's
  vocabulary. Names hold no issue numbers, version tags or status words.
- Component and set descriptions say what the part is in one or two sentences
  of plain text: real apostrophes and quotes, never HTML entities such as
  `&#39;`, and no issue numbers.

## What a page must not hold

Each of these is a violation the scan counts:

- **Overlaps and tight gaps**: see Layout and spacing.
- **Unsectioned nodes**: anything on the canvas outside a Section, and a
  family Section with no `Docs / <Section name>` frame.
- **Unannotated sets and parts**: see Annotations.
- **Rasters**: any node with an IMAGE fill. Rebuild the picture from live
  instances inside the Docs frame. Iconography's brand imagery is the one
  exception.
- **Default names**: `Frame 12`, `Group 3`, `image (7) 1`, `Property 1`.
- **Broken instances**: an instance whose main component was deleted.
- **Detached instances**: a frame carrying detached-instance data. Swap it back
  to the instance, or build it as a new part.
- **Stray frames**: names saying test, wip, copy, need to update, ver2 or old.
- **The legacy doc template**: the 1472-wide frame with Header and Content
  children, its `🌟 … (Copy me)` and `🔒 Main component/variant` blocks, and
  the Spacer and Section title instances it pulls from the old doc-kit library.
  Move what it says into the Docs frame, then delete it.

## Spacing and tokens

Bind every value inside the Docs frame to a semantic variable, as
`Docs / Range` does:

| Where | Bind |
|---|---|
| Docs frame | gap `Section/gap-lg`; padding `Surface/pad-x`, `Surface/pad-y`; radius `Surface/radius`; fill `Neutral Colors/surface` |
| Section frames | gap `Section/gap-md` |
| Example and do and don't cards | gap `Card/gap-lg`; padding `Surface Container/pad-x-md`, `pad-y-md`; radius `Card/radius-md`; fill `surface-container-low`; stroke `outline-variant` |
| Table rows | gap `Table/cell-gap`; vertical padding `Element/gap-sm`; stroke `outline-variant` |

Text uses the library's text styles: Title/H4 for the page title, Title/H5 for
section headings, Body/B2 for prose and table cells (Bold for table headers),
Body/B3 for the Header's Figma line, Body/Special/Code for code and property
names. Colour comes from `on-surface` and `on-surface-variant`.

## Done

A page is done when a read-only scan of it finds:

- one Section per family, each holding its parts, sets and
  `Docs / <Component>` with all seven sections in order;
- zero overlaps, gaps under 80 px, spills past a Section's edge, and nodes
  outside a Section;
- a Development annotation on every public set and `_` part, and the
  Interaction and Accessibility annotations the table above requires;
- zero rasters, default names, broken or detached instances, stray frames,
  HTML entities, issue numbers and legacy template frames;
- every Docs frame gap and padding bound to a variable, and every text node on
  a text style;
- every set and standalone component with a description.

Then screenshot the page and the Docs frame for the sign-off comment. The
library stays unpublished until Bill signs off.

## Related

- `overview.md` — the canonical file and where Figma knowledge lives
- `component-alignment.md` — the write-back gate every library edit passes
- `../documentation-ia.md` — the names this standard's titles speak
