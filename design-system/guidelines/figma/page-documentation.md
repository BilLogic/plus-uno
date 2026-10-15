---
embodiment: ide
summary: The page standard for the BS4 Foundation Figma library — layout, the Docs frame and its seven sections, naming, what a page must not hold, tokens, and the done test.
---

<!-- Tier: 2 · Load when: building, cleaning or reviewing a page in the BS4 Foundation library -->

# Figma page documentation standard

Every page in the BS4 Foundation library (`zAecJNRdvJzAUOcjV32tRX`) holds one
component family and documents it in one **Docs frame**. The model is the Range
page: its component sets, its parts, and `Docs / Range` beside them, nothing
else. Dropdown, File Upload, Label & Caption and Rich Text Editor follow the
same shape.

## Page layout

Read the canvas left to right, all top-aligned on one row:

1. **Private parts** (`_Name` sets) sit left of the set that uses them.
2. **Public component sets** sit next, the primary set first.
3. **The Docs frame** sits right of the last set, with a clear gap.

Everything a reader sees lives in one of those three places. Examples, do and
don't pairs and state matrices are built inside the Docs frame, from instances.

Two kinds of material may sit on a page outside the row, each in a SECTION below
it:

- **Review** — work awaiting sign-off, in a SECTION named `Review — <topic>`.
  It is removed, or folded into the sets and the Docs frame, once Bill signs off.
- **Deprecated** — sets kept only until their instances are swapped, in a
  SECTION named `Deprecated — <reason>`. Anything with no live instances moves
  to the 🗄 Archive page.

Divider pages (`─── Components · Forms & Inputs ───`) stay empty. The Cover,
🗄 Archive and Proposals pages are outside this standard.

## The Docs frame

Name it `Docs / <Component>`, using the Storybook display name. One per page;
a page holding two families (Status, Count & Tag) gets one per family.

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
per topic, Usage and Related. Their existing `DOC — <topic>` frames become those
sections.

## Naming

- Every frame, group and section carries a name a reader would search for.
  Name it after its role (`Header row`, `Do and don't`, `size=small`).
- Sets use the code component's name; private parts start with `_`.
- Variant properties are lowercase; booleans end in `?`; values match code's
  vocabulary. Names hold no issue numbers, version tags or status words.
- Component and set descriptions say what the part is in one or two sentences
  and carry no issue numbers.

## What a page must not hold

Each of these is a violation the audit counts:

- **Rasters**: any node with an IMAGE fill. Rebuild the picture from live
  instances inside the Docs frame. Iconography's brand imagery is the one
  exception.
- **Default names**: `Frame 12`, `Group 3`, `image (7) 1`, `Property 1`.
- **Broken instances**: an instance whose main component was deleted.
- **Detached instances**: a frame carrying detached-instance data. Swap it back
  to the instance, or build it as a new part.
- **Stray frames**: names saying test, wip, copy, need to update, ver2 or old.
- **Loose top-level nodes**: anything on the canvas that is not a set, a part,
  the Docs frame, or a Review or Deprecated section.
- **The legacy doc template**: the 1472-wide frame with Header and Content
  children, its `🌟 … (Copy me)` and `🔒 Main component/variant` blocks, and
  the Spacer and Section title instances it pulls from the old doc-kit library.
  Move what it says into the Docs frame, then delete it.

## Spacing and tokens

Bind every value to a semantic variable, as `Docs / Range` does:

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

A page is done when a scan of it finds:

- the layout above, with one `Docs / <Component>` frame holding all seven
  sections in order;
- zero rasters, default names, broken or detached instances, stray frames,
  loose top-level nodes and legacy template frames;
- every Docs frame gap and padding bound to a variable, and every text node on
  a text style;
- every set and standalone component with a description.

Then screenshot the page and the Docs frame for the sign-off comment. The
library stays unpublished until Bill signs off.

## Related

- `overview.md` — the canonical file and where Figma knowledge lives
- `component-alignment.md` — the write-back gate every library edit passes
- `../documentation-ia.md` — the names this standard's titles speak
