---
embodiment: ide
summary: The page standard for the BS4 Foundation Figma library — one Section per documented component, the variant matrix and reading order, the 80 px gap and reflow, annotations on the Docs frame's instances, the Docs frame and its seven sections, naming, what a page must not hold, tokens, and the done test.
---

<!-- Tier: 2 · Load when: building, cleaning or reviewing a page in the BS4 Foundation library -->

# Figma page documentation standard

Every page in the BS4 Foundation library (`zAecJNRdvJzAUOcjV32tRX`) documents
its component families. Each family lives in one **Section** that holds its
parts, its sets and its **Docs frame**, laid out with an 80 px gap: the public
sets and their parts in a column on the left, the Docs frame on the right.
Each set sits in a labeled variant matrix, and the Docs frame's live
instances carry the annotations a developer reads in Dev Mode, each on the
layer it describes. The model is the Textarea page.

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

A reader opening a Section meets the public component first, with every
variant labeled, then reads its documentation. Inside a Section, two columns,
top-aligned:

1. **The component column**, left. The primary public set first, then the
   family's other public sets, then the `_` parts, stacked top-down in the
   order the public set uses them. Parts sit below the public sets, never
   beside or above them: the first thing a reader meets is what they can use.
2. **The Docs frame**, right.

Family Sections sit side by side on one row, top-aligned, in the order the
Storybook sidebar lists them. Review and Deprecated Sections sit on a second
row below.

### The variant matrix

A component set can hold only components, so its labels sit outside it. Wrap
every set of two or more variants in a frame named `<Set> / Variant matrix`,
holding three children:

- `Column labels · <axis>`, above the set, one `axis=value` label over each
  column;
- `Row labels · <axes>`, left of the set, one right-aligned `axis=value` label
  beside each row;
- the set itself.

Lay the variants out as a grid that matches the labels:

- **Columns** take one axis, usually the one with the fewest values (input,
  size, kind).
- **Rows** take the rest, states in the order a person meets them: default,
  hover, focus, pressed, invalid, valid, read-only, disabled.
- **The default variant sits top-left**; Figma uses it to stand for the set.
- **A combination the set does not have leaves its cell empty**, so every row
  and column still reads straight across. Switch the set's auto-layout off
  (`layoutMode` `NONE`) to hold the empty cells.

Inside the set: 20 padding, 20 between rows, 32 between columns. Row labels
sit 24 left of the set, column labels 12 above it. Labels use Legacy/Body/Special/Code
in `on-surface-variant`.

### The 80 px gap

**The gap is 80 px everywhere outside a matrix**, the value of `space-1000`
(`size / primitive/Spacing/Large`): between nodes in a Section, between a
Section's edge and its content, and between Sections. A Section has no
auto-layout, so the gap is placed by hand rather than bound; the scan holds it.

**Every Section hugs its content**: exactly 80 from its nearest node on all
four sides, with no slack and no spill. That holds for the zone Sections inside
a family Section too (Components, Docs, Playground). Each zone takes its own
height, so zones side by side end at different depths, sitting 80 apart. After
any edit that grows or shrinks content, fit the innermost Section first, then
its parent.

**Nothing overlaps.** No two top-level Sections, no two nodes inside one
Section, and no two variants inside one set share any area, and every node sits
wholly inside its Section.

**When a set grows, everything after it reflows** in the same edit:

1. Grow its matrix: move the labels to the new rows and columns, and resize
   the matrix frame to its labels and set.
2. Move each node below the matrix, and the Docs frame to its right, so each
   gap is 80 again.
3. Fit each Section to its content plus 80 on every side, innermost first.
4. Move every Section to the right of it by the same growth.
5. Re-run the scan; it reads zero overlaps, tight gaps, spills and unlabeled
   sets.

## Annotations

`docs/connectors/figma/annotations.md` is the convention: the six category
labels, what each holds, and where construction, usage and status go instead.
Read it before writing or judging an annotation. What it means on a library
page:

- **The component's own notes live in its `description`**, not in an
  annotation. What the set or `_` part is, what it is built from, how to use
  it and which code component it maps to travel with every instance that way;
  an annotation on a main component reaches no product file. The Code and
  Storybook links are dev resources on the set. Sets, variants and parts
  carry no annotations.
- **Annotations sit on the Docs frame's live instances**, on the layer they
  describe: the Anatomy instance for what holds in every state, a Variants or
  States exhibit for what only that variant shows (a focus ring, an invalid
  border, a disabled fade).
- **They say what Dev Mode cannot.** Dev Mode already shows the layer's
  name, variant properties and token bindings, so an annotation carries
  behavior (Interaction), the role, name, keys and cues beyond color
  (Accessibility), copy rules (Content), or a code constraint on that layer
  that no property exposes (Development). Values the inspect panel shows are
  neither typed nor pinned.
- **One line each**, at most 120 characters. An Anatomy callout leads with its
  part's number and name from the key, in bold: `**3 Resize grip** · …`. The
  key stays as text beside the instance, since exports render no annotations.
- **The categories are the six labels, at their colors.** The BS4 file
  carries only the four presets plus Before, Guidance and two Tooltips; its
  component pages use the four presets until the file is brought in line.

Example, the Textarea page: an Interaction callout on the Anatomy instance's
resize grip, an Accessibility note on the instance itself, a Content note on
the placeholder exhibit's text, an Accessibility note on the invalid
exhibit's border, and Interaction notes on the focus, read-only and disabled
exhibits.

Read every name from the set's properties and the component's `.jsx` before
writing it.

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
| Variants | One example card per variant axis, each cell labeled `axis=value`. |
| States | Each Figma state as a live instance, and a line on any state that exists only in code (hover, focus). |
| Usage | First, when to use it: the conditions that pick this component over its neighbors, such as how many options, one choice or several, whether a good default exists, or how long the answer runs, each with the reason. Then rules, each a short imperative heading, a paragraph, and a do and don't card where a picture settles it. |
| Related | A bulleted line per neighbor: "• A need → Component." |

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
- Component and set descriptions open with what the part is in a sentence,
  then hold its construction and usage notes and its code component (see
  Annotations), in plain text: real apostrophes and quotes, never HTML
  entities such as `&#39;`, and no issue numbers.

## What a page must not hold

Each of these is a violation the scan counts:

- **Overlaps and tight gaps**: see Layout and spacing.
- **Unsectioned nodes**: anything on the canvas outside a Section, and a
  family Section with no `Docs / <Section name>` frame.
- **Unlabeled sets**: a set of two or more variants outside its
  `<Set> / Variant matrix`. See Layout and spacing.
- **Misplaced annotations**: an annotation on a set, variant or part, or
  anywhere outside a Docs frame; a label over its length limit; a category
  outside the six labels. See Annotations.
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
| Open-state examples | the field and its popup stacked in a vertical auto-layout frame, gap `Element/gap-xs`, placed by auto-layout alone |

Text uses the current text styles: Heading/large for the page title,
Heading/medium for section headings, Heading/small for subsections, Body/default
for prose and table cells (semibold weight for table headers), and Body/small for
the Header's Figma line. Code and property names carry no style; they bind the
type variables as `token-mapping.md` § Text that carries no style says. Color
comes from `on-surface` and `on-surface-variant`.

## Done

A page is done when a read-only scan of it finds:

- one Section per family, each holding its parts, sets and
  `Docs / <Component>` with all seven sections in order;
- zero overlaps, gaps under 80 px, spills past a Section's edge, and nodes
  outside a Section;
- every Section, zones included, exactly 80 from its content on all four sides;
- every set of two or more variants in a labeled variant matrix, public sets
  above parts, and the Docs frame rightmost;
- no annotation on a set, variant or part; every annotation on a layer inside
  a Docs frame, in one of the six labels, within its length limit;
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
