# Storybook Component Organization

## Who this is for

This guide is primarily for **designers** browsing Storybook to review shared UI. It explains how pages are organized today, why some entries differ, and what structure future docs should use so components feel easier to scan.

This is not a low-level implementation guide for Storybook internals. For prop-table categorization, see [`storybook.md`](storybook.md). For current Storybook ordering and discovery, see [`.storybook/preview.jsx`](../../../.storybook/preview.jsx) and [`.storybook/main.js`](../../../.storybook/main.js).

## How to read the sidebar

The default expectation is:

- one sidebar item per component or form control
- `Components/<Name>` and `Forms/<Name>` stay flat, not deeply nested
- the visible page is usually an MDX docs page, not raw CSF story leaves

That pattern is implemented with colocated `*.mdx` files, shared docs layout primitives in [`design-system/src/storybook-docs/ds-docs-layout.jsx`](../../../design-system/src/storybook-docs/ds-docs-layout.jsx), and `tags: ['!dev']` on the corresponding stories files so the docs page is the main surface. This docs-first pattern is also described in the knowledge/lessons archive (originally `docs/solutions/integration-issues/2026-03-23-storybook-mdx-autodocs-conflict-and-netlify-spa-static-coexistence.md`).

### Sidebar patterns in the current repo

1. **Single entry, MDX-first**
   Most components and many forms follow this pattern. Example references: [`Button.mdx`](../../../design-system/src/components/Button/Button.mdx), [`Checkbox.mdx`](../../../design-system/src/forms/Checkbox.mdx).

2. **Single entry, merged subcomponent stories**
   Some components have a second `*.Subcomponents.stories.jsx` file, but it reuses the same `title` so Storybook keeps everything under one sidebar item. Examples: [`Alert.mdx`](../../../design-system/src/components/Alert/Alert.mdx), [`NavPills.mdx`](../../../design-system/src/components/NavPills/NavPills.mdx).

3. **Single entry, richer composed docs**
   A few pages are more editorially composed and do not rely only on `Canvas` sections. The clearest example is [`Button.mdx`](../../../design-system/src/components/Button/Button.mdx), which uses [`button-segmented-demos.jsx`](../../../design-system/src/components/Button/button-segmented-demos.jsx).

4. **Stories-only outlier**
   Some forms still rely on a single story file and have no colocated MDX page yet. Current examples: `Forms/Rating`, `Forms/Input Group`, and `Forms/Scale`.

5. **Sidebar alias**
   A few sidebar labels are more user-facing than the implementation name. Current examples:
   - `Components/Loading` for `Spinner`
   - `Forms/Scale` for `RadioButtonGroup`
   - `Forms/Time Picker` for `DateAndTimePicker`

These aliases are acceptable when intentional, but they should be rare and kept in sync with [`storySort`](../../../.storybook/preview.jsx).

## Default section spine

The recommended default top-level section order is:

1. `Content`
2. `Styles`
3. `Sizes`
4. `Interaction States`
5. `Layout`
6. `Interactive`

Not every component needs every section. Omit sections that do not apply. The goal is not to force every page into the same length; the goal is to make pages easier for a designer to scan in a predictable order.

## Why this spine helps designers

When a component has two clear visual axes, the page can use **controlled designer-friendly labels** instead of abstract headings while still mapping back to the same taxonomy. For example:

- use `Color styles` when the axis is semantic color role
- use `Fill treatments` when the axis is surface treatment such as filled, tonal, outline, or ghost

This is a naming refinement, not a new taxonomy. The page should still behave like the default spine rather than introducing one-off organizational patterns.

### `Content`

Start with what the component **is**, what it **contains**, and the basic version a designer is most likely to recognize. This anchors the page before visual options or edge cases appear.

### `Styles`

After the baseline is clear, show the major visual treatments. This helps designers compare look-and-feel without conflating those differences with size or behavior.

### `Sizes`

Sizes are easier to compare once the designer already understands the default shape and the major modes. This keeps the page from starting with a modifier before the component itself is clear.

### `Interaction States`

State changes matter, but they make the most sense after the reader understands the stable versions first. This is where hover, focus, selected, disabled, validation, or loading changes belong.

### `Layout`

Layout is contextual. It answers how the component behaves when placed in a page, group, rail, row, stack, or container. It is important, but usually later than the component’s own visual identity.

### `Interactive`

This should usually come last. It is the sandbox where a designer or engineer can verify details after reading the curated examples above. It is most helpful as the final “try it yourself” section, not the first explanation.

#### Interactive controls policy (source of truth)

This guide defines *where* `Interactive` fits in the docs spine and *why* it belongs there.

For the detailed policy on which controls to show/hide, how to categorize props, and how to keep the playground curated and designer-friendly, follow:

- [`storybook.md`](storybook.md)

## Strict top-level exception policy

Keep the exception list small. If a custom heading does not clearly help a designer understand the component better than the default spine, it should not remain a top-level heading.

### Allowed top-level exceptions

#### `Anatomy`

Keep this when the page needs to explain the **parts** of a component or the relationship between a parent component and its internal pieces.

Use it when:

- the component has meaningful internal parts or slots
- those parts matter to how designers review or compose it
- a plain `Content` section would blur “what goes in it” with “what it is made of”

Strong current example: [`Alert.mdx`](../../../design-system/src/components/Alert/Alert.mdx).

#### `Behavior`

Keep this when the hard part of the component is **how it works**, not just what it looks like.

Use it when:

- the component’s rules of operation are a major part of design review
- `Interaction States` alone would only show screenshots, not explain the behavior model

Strong current example: [`Accordion.mdx`](../../../design-system/src/components/Accordion/Accordion.mdx).

#### `Types` (rare)

Keep this only when “type” is truly product language and not just a generic variant bucket.

Use it when:

- the component exposes distinct conceptual modes
- calling them `Variants` would hide meaningful product intent

Current example: [`Modal.mdx`](../../../design-system/src/components/Modal/Modal.mdx).

### Headings that should usually be folded back into the default spine

| Current heading | Recommended home |
|---|---|
| `Intent` | `Styles`, or a controlled axis label like `Color styles` |
| `Appearance` | `Styles`, or a controlled axis label like `Fill treatments` |
| `Actions` | `Content` or `Layout` |
| `Effects` | `Styles` |
| `Children` | `Content` or `Layout` |
| `Use cases` | intro copy or lower-level subsection, not a top-level taxonomy section |
| `Counts` | `Content` or `Layout` |
| `Basic` | `Content` |
| `With actions` | `Content` |
| `Icons` | `Content` |
| `State patterns` | `Interaction States` or `Behavior` |
| `Link trigger` | `Behavior` or `Layout` |
| `Pill group` | `Layout` or `Anatomy` |
| `Dropdown pills` | `Content` or `Layout` |
| `Full labels` | `Content` |
| `Abbreviated` | `Content` |

These labels can still be useful as lower-level subsection labels inside a broader top-level section. The recommendation here is only about keeping the **top-level taxonomy** small and predictable.

## Sidebar taxonomy matrix

The tables below summarize how current entries are organized today. The goal is to show what is already consistent, what differs, and why.

### Components

| Sidebar label | Docs profile | Top-level sections | Subcomponents merged? | Why it differs |
|---|---|---|---|---|
| `Accordion` | MDX-first | `Content`, `Styles`, `Behavior`, `Interaction States`, `Interactive` | No | `Behavior` is justified because disclosure logic matters. |
| `Alert` | MDX-first | `Content`, `Styles`, `Anatomy`, `Interactive` | Yes | `Anatomy` is justified because the internal parts matter. |
| `Badge` | MDX-first | `Content`, `Styles`, `Sizes`, `Interactive` | Yes | Mostly standard; subcomponent examples are merged into the same entry. |
| `Breadcrumb` | MDX-first | `Content`, `Layout`, `Interactive` | Yes | Mostly standard; content is partly item-level. |
| `Button` | MDX-first, composed | `Content`, `Color styles`, `Fill treatments`, `Sizes`, `Interaction States`, `Layout`, `Interactive` | No | Rich curated demos; controlled axis labels are clearer than abstract terms here. |
| `ButtonGroup` | MDX-first | `Sizes`, `Styles and fills`, `Layout`, `Counts`, `Use cases`, `Children`, `Interactive` | No | Composition-heavy; several headings should likely collapse into default sections or intro copy. |
| `Card` | MDX-first | `Content`, `Actions`, `Layout`, `Interactive` | No | `Actions` could likely fold into `Content` or `Layout`. |
| `Carousel` | MDX-first | `Content`, `Styles`, `Layout`, `Interactive` | No | Strong example of the default pattern. |
| `Collapse` | MDX-first | `Content`, `Icons`, `State patterns`, `Link trigger`, `Interactive` | No | Real interaction nuance exists, but headings could be simplified. |
| `Divider` | MDX-first | `Styles`, `Sizes`, `Layout`, `Interactive` | No | No meaningful content section. |
| `Dropdown` | MDX-first | `Content`, `Color styles`, `Fill treatments`, `Sizes`, `Layout`, `Interactive` | No | Trigger color role and fill treatment are clearer as named axes. |
| `Jumbotron` | MDX-first | `Basic`, `With actions`, `Sizes`, `Interactive` | No | More scenario-driven than taxonomy-driven. |
| `ListGroup` | MDX-first | `Content`, `List item — Content`, `List item — Variants`, `List item — Sizes`, `Styles`, `Interaction States`, `Layout`, `Interactive` | Yes | Parent/item relationship is real; top-level list-item headings may be better nested under broader sections. |
| `Loading` | MDX-first | `Styles`, `Sizes`, `Layout`, `Interactive` | Yes | Sidebar alias for `Spinner`; minimal style plus animation type is a clear split. |
| `MediaObject` | MDX-first | `Content`, `Sizes`, `Layout`, `Interactive` | No | Clean standard pattern. |
| `Modal` | MDX-first | `Content`, `Layout`, `Types`, `Interactive` | No | `Types` is a defensible rare exception. |
| `NavPills` | MDX-first | `Content`, `Interaction States`, `Layout`, `Pill group`, `Dropdown pills`, `Interactive` | Yes | Strong group/item nuance; some headings could become nested labels. |
| `NavTabs` | MDX-first | `Content`, `Interaction States`, `Layout`, `Interactive` | No | Clean standard pattern. |
| `Pagination` | MDX-first | `Content`, `Sizes`, `Interaction States`, `Interactive` | No | Close to standard; only casing drift. |
| `Popover` | MDX-first | `Content`, `Interaction States`, `Layout`, `Interactive` | No | Clean standard pattern. |
| `Progress` | MDX-first | `Styles`, `Effects`, `Sizes`, `Interactive` | No | `Effects` is probably better treated as `Styles`. |
| `RichTextEditor` | MDX-first | `Content`, `Sizes`, `Interaction States`, `Interactive` | No | No strong need for more sections. |
| `Scrollspy` | MDX-first | `Layout`, `Interactive` | No | Minimal but appropriate for a layout/behavior tool. |
| `SidebarTab` | MDX-first | `Content`, `Interaction States`, `Interactive` | No | State-first structure is appropriate. |
| `SuperCompPill` | MDX-first | `Full labels`, `Abbreviated`, `Interactive` | No | Domain-specific wording should likely fold into `Content`. |
| `Toast` | MDX-first | `Styles`, `Interactive` | No | Minimal and appropriate for a visual state component. |
| `Tooltip` | MDX-first | `Styles`, `Sizes`, `Interactive` | No | Minimal and appropriate. |

### Forms

| Sidebar label | Docs profile | Top-level sections | Subcomponents merged? | Why it differs |
|---|---|---|---|---|
| `Label and Caption` | MDX-first | `Content`, `Layout` | No | More reference/pattern oriented; no interactive playground today. |
| `Input` | MDX-first, composed | `Content`, `Styles`, `Sizes`, `Interaction States`, `Interactive` | No | Strong standard spine, but uses inline composed docs rather than all story-backed canvases. |
| `Textarea` | MDX-first | `Content`, `Layout`, `Sizes`, `Interaction States`, `Interactive` | No | Strong standard pattern. |
| `Textarea ver 2` | MDX-first | `Styles`, `Interaction States`, `Interactive` | No | Minimal; content is not the main differentiator. |
| `Number Input` | MDX-first | `Content`, `Styles`, `Sizes`, `Interaction States`, `Interactive` | No | Strong standard pattern. |
| `Select` | MDX-first, composed | `Content`, `Styles`, `Sizes`, `Interaction States`, `Interactive` | No | Same pattern as `Input`. |
| `Cascader` | MDX-first | `Content`, `Layout`, `Interaction States`, `Interactive` | No | No strong need for sizes/styles. |
| `Checkbox` | MDX-first | `Content`, `Sizes`, `Interaction States`, `Interactive` | No | Strong standard pattern. |
| `Radio` | MDX-first | `Content`, `Layout`, `Sizes`, `Interaction States`, `Interactive` | No | Strong standard pattern. |
| `Switch` | MDX-first | `Content`, `Sizes`, `Interaction States`, `Interactive` | No | Strong standard pattern. |
| `Range` | MDX-first | `Sizes`, `Interactive` | No | Minimal but likely correct for this control. |
| `Multiple Choice` | MDX-first | `Styles`, `Content`, `Sizes`, `Interaction States`, `Interactive` | No | Mostly standard, but section order should probably normalize. |
| `Choice Grid` | MDX-first | `Styles`, `Layout`, `Interaction States`, `Interactive` | No | More structural than content-led. |
| `File Upload` | MDX-first | `Content`, `Styles`, `Interaction States`, `Interactive` | No | No strong need for sizes. |
| `Date Picker` | MDX-first | `Sizes`, `Interaction States`, `Interactive` | No | Starts from usage/state instead of content. |
| `Time Picker` | MDX-first | `Content`, `Sizes`, `Styles`, `Interaction States`, `Interactive` | No | Sidebar alias for `DateAndTimePicker`. |
| `Rating` | Stories-only | `Overview` | No | Migration outlier. |
| `Input Group` | Stories-only | `Overview` | No | Migration outlier. |
| `Scale` | Stories-only | `Overview` | No | Migration outlier and sidebar alias. |

## What is already working well

- The sidebar is mostly **flat and scannable**
- Most entries are **one sidebar item per component**
- Most component pages already share a docs-first structure
- Subcomponent-heavy entries usually avoid sidebar clutter by merging under one title
- Many forms already align well with the default section spine

## What should be improved

### Standardize now

- keep the sidebar flat by default
- keep one docs-first entry per component/control
- use the default section spine whenever it clearly fits
- normalize casing and naming drift, especially `Interaction States`

### Preserve as useful nuance

- merged subcomponent stories when one sidebar item is the better browsing experience
- `Anatomy` when parts need explanation
- `Behavior` when operation is a real design concern
- rare `Types` when the product language truly needs it
- richer composed docs pages for unusually important or complex primitives

### Treat as migration debt

- forms that are still stories-only
- top-level headings that are really scenario labels rather than taxonomy
- aliases that are not clearly justified by designer-facing language
- custom headings that could become lower-level subsections instead

## Recommended rules moving forward

1. **One sidebar item per component or form control**
   Default to `Components/<Name>` or `Forms/<Name>`.

2. **Docs-first page when possible**
   Prefer colocated MDX as the primary browsing surface.

3. **Default top-level section spine**
   Use `Content`, `Styles`, `Sizes`, `Interaction States`, `Layout`, `Interactive`.

   When those labels are too abstract for designers, use a controlled axis label that still maps back to the same slot in the spine, such as `Color styles` or `Fill treatments`.

4. **Exception headings stay rare**
   Only allow `Anatomy`, `Behavior`, and rare `Types` as top-level exceptions.

5. **Custom labels usually become subsections**
   If a label is helpful but too specific to serve as a universal category, keep it lower in the page hierarchy rather than as a top-level section.

6. **Aliases must be intentional**
   If the sidebar label differs from the implementation name, make sure that is a deliberate designer-facing choice and keep it aligned with [`storySort`](../../../.storybook/preview.jsx).

## Slot transition plan

If the design system adopts **Figma's slots feature** more explicitly, the documentation model should evolve without introducing a brand new top-level taxonomy.

In this guide, “slots” refers to **Figma component slots**: named regions inside a component that are intended to be replaced, filled, or swapped while preserving the parent component's structure.

### What should stay the same

- Keep the default sidebar model: one entry per component or form control
- Keep the default section spine: `Content`, `Styles`, `Sizes`, `Interaction States`, `Layout`, `Interactive`
- Keep the strict exception policy small: `Anatomy`, `Behavior`, rare `Types`

### What Figma slots should change

Figma slots make a component's internal structure more explicit inside the design tool itself. That affects documentation in two main ways:

1. **More components may need `Anatomy`**
   Use `Anatomy` when designers need to understand the named parts or parent/child structure of a component, especially when those parts map to Figma slot regions such as title, media, badge, actions, dismiss control, or item content.

2. **`Content` should become slot-aware**
   `Content` should explain what kind of content belongs in each slot, which slots are optional, and which slot combinations are common or recommended.

3. **`Anatomy` may need to distinguish fixed parts from replaceable parts**
   When Figma slots are present, designers need to know which regions are intentionally replaceable and which regions are structural parts of the component that should stay fixed.

### What Figma slots should not change

- Do **not** add `Slots` as a new top-level section
- Do **not** create a fourth global exception category just because a component has slot-like structure
- Do **not** replace `Content` with implementation-focused slot language if designers still think about the component in terms of visible content rather than named internals
- Do **not** document slots as a technical implementation detail only; always translate them into a designer-facing explanation of replaceable regions, fixed structure, and expected composition

### How to document Figma-slot-based components

When Figma slots become part of the design model, use this decision rule:

- If the important question is **what goes inside the component**, document it under `Content`
- If the important question is **what parts the component is made of**, document it under `Anatomy`
- If slots change how the component behaves during use, explain that under `Behavior`
- If slots mainly affect placement or composition, explain that under `Layout`

### Suggested anatomy language when Figma slots exist

Inside `Anatomy`, prefer designer-facing language such as:

- **replaceable regions** — areas backed by slots in Figma
- **fixed parts** — structural pieces that are not meant to be swapped
- **common slot combinations** — the compositions most designers are expected to use

Avoid making the page read like plugin or implementation documentation. The point is to help a designer understand how to work with the component safely in Figma.

### Likely impact on current components

- **Very likely to become more anatomy-driven:** `Alert`, `ListGroup`, `NavPills`
- **Possibly slot-aware but still mostly content-driven:** `Card`, `Modal`, `ButtonGroup`
- **Unlikely to need slot-driven reorganization:** `Divider`, `Tooltip`, `Toast`, `Range`

### Migration approach

1. Start by identifying components whose structure is already being explained implicitly through subcomponent stories or repeated item-level sections.
2. For those components, prefer strengthening `Anatomy` and adding clearer nested subsections rather than inventing new top-level headings.
3. Keep the top-level taxonomy stable while making the page body more slot-aware.
4. Only promote a component to use `Anatomy` when doing so clearly helps a designer understand composition, not just implementation.

## References

- [`.storybook/main.js`](../../../.storybook/main.js)
- [`.storybook/preview.jsx`](../../../.storybook/preview.jsx)
- [`.storybook/FORMS_DOCS_PLAN.md`](../../../.storybook/FORMS_DOCS_PLAN.md)
- [`storybook.md`](storybook.md)
- [`design-system/src/storybook-docs/Introduction.mdx`](../../../design-system/src/storybook-docs/Introduction.mdx)
- [`design-system/src/storybook-docs/ds-docs-layout.jsx`](../../../design-system/src/storybook-docs/ds-docs-layout.jsx)
- [`design-system/src/components/Button/Button.mdx`](../../../design-system/src/components/Button/Button.mdx)
- [`design-system/src/components/Alert/Alert.mdx`](../../../design-system/src/components/Alert/Alert.mdx)
- [`design-system/src/components/NavPills/NavPills.mdx`](../../../design-system/src/components/NavPills/NavPills.mdx)
