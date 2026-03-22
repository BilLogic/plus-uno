# Forms documentation reorganization (Button-aligned)

This plan aligns **Forms** stories and MDX with the **Components** pattern used for **Button**: shared section headings, `sb-ds-component-docs` / `sb-ds-doc-section`, `DocsCanvasShell` + `Canvas`, and a single **Interactive** playground where applicable.

## Reference spine (match when applicable)

Canonical order (omit sections that do not apply):

1. **Content** — labels, captions, placeholders, icons, value vs empty, required affordances  
2. **Styles** — distinct field chrome / fills (skip if only one treatment exists)  
3. **Variants** — semantic or structural alternatives (validation tone, `type`, layout of choices, etc.)  
4. **Sizes**  
5. **Interaction states** — disabled, read-only, focus/hover demos, error/success as *states* if not under Variants  
6. **Layout** — width, grouping, rails, multi-part fields (date + time, input groups)  
7. **Interactive** — `DocsInteractivePlayground` + controls  

**Mechanical conventions**

- Colocate `FormName.mdx` next to `FormName.stories.jsx` under `packages/plus-ds/src/forms/`.  
- Use `<Meta of={FormStories} />`, `<Title />`, `<Description />`, and the same wrapper classes as `Button.mdx`.  
- Prefer `tags: ['!dev']` on the default export so the docs page is the primary surface (same idea as `Components/*`).  
- Split monolithic `Overview` stories into **named exports** (`Content`, `Variants`, …) so each `###` maps to one story.  
- After migration, expand **`storySort`** in `.storybook/preview.jsx` under **`Forms`** with an explicit array (like `Components`).

## Flagged: separate `*.Subcomponents.stories.jsx` (review before merging)

**Do not merge or delete these until you have reviewed them.** Each appears as a **nested sidebar** under Forms today:

| Forms story title | Subcomponents file | Notes |
|-------------------|--------------------|--------|
| **Forms/Rating** | `packages/plus-ds/src/forms/Rating.Subcomponents.stories.jsx` | Extra stories under `Forms/Rating/Subcomponents` |
| **Forms/Input Group** | `packages/plus-ds/src/forms/InputGroup/InputGroup.Subcomponents.stories.jsx` | Nested under `Forms/Input Group/Subcomponents` |
| **Forms/Scale** | `packages/plus-ds/src/forms/RadioButtonGroup.Subcomponents.stories.jsx` | Title is **Scale**; subfolder **Subcomponents** |

**Merge pattern (when you are ready):** Same approach as `ListGroup` / `NavPills` in Components: set `title: 'Forms/<Parent>'` on the sub file, rename exports to avoid duplicate story IDs, fold canvases into parent MDX, delete redundant sub-MDX if any, flatten `storySort`.

## Forms without subcomponent folders (proceed with Button-style MDX)

These only use a single `*.stories.jsx` (no sibling `*.Subcomponents.stories.jsx` in repo):

- Cascader  
- Checkbox ✅ *(pilot: MDX + split stories)*  
- Choice Grid  
- Date Picker (`DatePicker/DatePicker.stories.jsx`)  
- File Upload  
- Input ✅ *(pilot: MDX + split stories)*  
- Label and Caption  
- Multiple Choice  
- Number Input  
- Radio  
- Range  
- Select  
- Switch  
- Textarea  
- Textarea ver 2  
- Time Picker (`DateAndTimePicker.stories.jsx`, title **Forms/Time Picker**)  

## Suggested `storySort` order (Forms)

Use dependency-friendly order; adjust to taste:

`Label and Caption` → `Input` → `Textarea` → `Textarea ver 2` → `Number Input` → `Select` → `Cascader` → `Checkbox` → `Radio` → `Switch` → `Range` → `Multiple Choice` → `Choice Grid` → `File Upload` → `Date Picker` → `Time Picker` → `Rating` → `Input Group` → `Scale`

*(Rating, Input Group, Scale stay listed here for sort position; subcomponent merge is separate.)*

## Rollout phases

| Phase | Scope |
|-------|--------|
| **0** | This plan + `storySort` (in `.storybook/preview.jsx`) + pilots (**Input**, **Checkbox**) |
| **1** | Remaining “no subcomponents” forms: one MDX + split exports each |
| **2** | **Rating**, **Input Group**, **Scale** — after your review: merge subcomponents, single MDX |
| **3** | Optional: drop redundant `Overview` exports; align `argTypes.table.category` with section names |

## Pilot status

- [x] **Input** — `Input.mdx` + stories: `Content`, `Variants`, `Sizes`, `InteractionStates`, `Interactive`  
- [x] **Checkbox** — `Checkbox.mdx` + stories: `Content`, `Sizes`, `InteractionStates`, `Interactive`  
- [x] **Textarea** — `Textarea.mdx` + split sections (incl. `Layout`)  
- [x] **Select**, **Radio**, **Switch**, **Number Input**, **Range**, **File Upload**, **Cascader**, **Choice Grid**, **Multiple Choice**, **Label and Caption**, **Date Picker**, **Time Picker**, **Textarea ver 2** — colocated MDX + taxonomy-aligned story exports  

*(Rating, Input Group, Scale: Phase 2 — subcomponent merge still pending.)*
