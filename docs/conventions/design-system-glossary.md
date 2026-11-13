---
embodiment: all
disclosure: reference
summary: Design-system vocabulary — load for component, pattern, token, motion and sound terms
---

# Design-system glossary

<!-- canonical per ADR-017 (docs/adr/) · distilled 2026-07-07 · split from GLOSSARY.md 2026-11-13 -->

## Language

### Design system: structure

**Pattern**:
Code-free guidance for a situation, shown on annotated **Template**s used as they are or tweaked: when to use a choice, which choice fits, and the words. A pattern holds a rule that applies across two or more templates and has no anatomy and no code. A **Component** is one piece with props; a **Template** arranges components; a pattern guides.
_Avoid_: "layout component", "practice"

**Template**:
An arrangement of components with named **Slot**s, holding its key scenarios and key states and linking to each component for the rest: **Frame**, **Page**, **Section**, Form, Modal, Panel and Popup. The tie-break: behavior splits out into a component, and a template that only redraws one component stays a component. How pieces sit in one template goes on that template's page; a rule that holds across two or more templates is a **Pattern**.
_Avoid_: "container", "starter", "page template" for the **Frame** alone

**Frame**:
The template for the app's outer shell: the **Sidebar** and **Panel** that stay put while the **Page** inside changes. Frame has three types: **Frame default**, **Frame focused** and **Frame bare**. The browser window is drawn around it in examples only. "App shell" is an informal alias for talk; code and docs say Frame.
_Avoid_: "surface container", bare "shell"

**Frame default**:
The **Frame** type for pages people move among: the **Sidebar**, the **Page** and the slot for the AI **Panel**.
_Avoid_: "main frame"

**Frame focused**:
The **Frame** type for one task: no **Sidebar**, a Close button at the start of the title row, steps down a left **Section** side when there are five or more and across the top when there are four or fewer, and a bottom bar with Cancel on the left and Back and Next on the right.
_Avoid_: "wizard page", "full-screen modal"

**Frame bare**:
The **Frame** type with no **Sidebar** and one centered column, such as sign-in.
_Avoid_: "blank frame"

**Screen**:
A **Frame** with its **Slot**s filled for one page. The empty Frame is the **Template**; a filled Frame is a Screen. Screens are documented under Flows in Figma, and stay apart from the templates.
_Avoid_: "page" for the whole filled Frame, "mockup"

**Flow**:
A sequence of **Screen**s that fulfills one user story. Flows are documented under Flows in Figma, and stay apart from the templates.
_Avoid_: "journey" for a Flow (the blueprint's journey is a different thing), "wizard"

**Sidebar**:
The full-height area at the left of the **Frame**, holding navigation. From 1024 it is **docked**; below it is collapsed, where a hover **peek**s it and the toggle opens it as an **overlay**. A peek and an overlay look the same; they differ in how they open and close.
_Avoid_: "left nav", "side nav"

**Panel**:
The full-height area at the right of the **Frame**, holding AI chat first. It is app-level, 320 to 640 wide (400 by default), and **docked** beside the **Page** or opens as an **overlay** on a **Backdrop** when there is no room. The Panel parts (`PanelContainer` and its header, body and footer) fill it.
_Avoid_: "right sidebar", "side panel", "inspector", "Card" for the area

**Docked / overlay**:
The two states of the **Sidebar** and the **Panel**. Docked sits beside the **Page** and moves it; overlay opens over the **Page**, and an overlay **Panel** has a **Backdrop**.
_Avoid_: "inline", "pinned", "floating" as a state

**Peek**:
A collapsed **Sidebar**, or a closed **Panel** whose `panelPeek` option is on, shown over the **Page** while a pointer rests on its toggle or edge. It has no **Backdrop**, does not move the **Page**, and closes on an outside click or Escape.
_Avoid_: "flyout" as our word, "hover menu"

**Splitter**:
The draggable edge of the docked **Panel**, a vertical separator that resizes it from 320 to 640 and leaves the **Sidebar** as it is. It resists past its limit and springs back; the arrow keys move it by 16, with Shift by 64.
_Avoid_: "resize handle", "drag bar"

**Page**:
The template for the main content area inside a **Frame**: it carries the page title and a body.
_Avoid_: "surface" as a name

**Section**:
The template for a span of the page grid that groups content, including **Card**s, under one heading with a `_Section header`. It can carry an optional `detail` region on its right that shows one record of its content: the body takes 7 of the **Page**'s 12 columns and the detail, a Section with a subtle fill, takes 5; the split holds from 960 and below that the detail replaces the list under a back link. A bare "Section" always means this template.
_Avoid_: "block" as a name, "region" as a name; "section" for a **Figma section** or a **Menu section**

**Card**:
The pattern for the container of one object, raised at rest with no border. Related cards group in a **Section**, one card level deep.
_Avoid_: "tile" (Tile is its own component), "panel" (Panel is the Frame's right area)

**Backdrop**:
The pattern for the layer that dims what sits behind it: full screen for a **Modal**, which it also holds and sizes. A **Panel** floats with none.
_Avoid_: "overlay" for the pattern (the word is a **Panel** and **Sidebar** state), "scrim"

**Modal**:
The component and pattern for content that takes over the screen until it is closed: a follow-up decision swaps the same Modal's content for its confirm view, and one Modal is open at a time. `Modal` is the component; `PatternModal` draws its shell inline.
_Avoid_: "Modal dialog", "ModalDialog", "popup" for a blocking dialog

**Part**:
A `_`-prefixed piece only its parent uses, such as `_Section header` or `_Modal header`: it lives inside its parent and stays out of the public exports.
_Avoid_: "sub-component" for a part, "element"

**Slot**:
A named drop zone in a pattern or component where your own content goes: empty and tinted in the source component, filled with realistic placeholder content in examples and the **Playground**.
_Avoid_: "children area", "placeholder" for the slot itself

### Design system: components

**Category**:
A component group name, identical in Figma pages, Storybook and code folders, such as Forms and inputs or Text and data display; the component index lists them.
_Avoid_: "Actions", "group" for a category

**Static table**:
A fixed grid people read, with nothing to act on: a link in a cell is fine, and rows rest or are highlighted. Which table type to use is `design-system/guidelines/composition/surfaces.md` § Choosing a table.
_Avoid_: "basic table", bare "table" for this type

**Dynamic table**:
Any table people act on: sorting, filtering, selection, paging, row expansion or row actions.
_Avoid_: "data table", "interactive table"

**Tree table**:
A table whose rows nest under parent rows.
_Avoid_: "table tree", "nested table"

**Popup**:
A floating layer anchored to its trigger, closed by clicking outside: a menu, a select list, a filter menu or content, with no **Backdrop**.
_Avoid_: "popover", "inline dialog"

**Menu**:
The item primitive behind **Dropdown menu** and **Popup select**: menu groups, **Menu section**s and items. Reach for those two; Menu is not a component of its own.
_Avoid_: "dropdown" for a menu, "list group"

**Menu section**:
A titled or separated group of items inside a **Menu**.
_Avoid_: bare "section"

**Dropdown menu**:
A button trigger that opens a **Menu** of actions in a **Popup**.
_Avoid_: bare "dropdown"

**Popup select**:
One list in a **Popup**, applied the moment a row is picked; its labeled trigger ("Status: Upcoming") is the toolbar filter for a second-level view.
_Avoid_: a second tab strip

**Filter menu**:
Several filter categories in a **Popup**, held until Apply. `FilterMenu` in code.
_Avoid_: "filter dropdown"

**SearchField**:
A search field with three modes: `active` filters held rows as you type, `basic` runs on Enter, and `focused` opens a Popup panel with recent searches, grouped matches and See all. Source: `design-system/src/components/forms-and-inputs/SearchField/index.md`.

**Select**:
A form field for picking a value from a list of options. A list loaded from a server is the `loadOptions` property of Select.
_Avoid_: "dropdown", "Dropdown menu" for a value picker, "async select"

**Close / Dismiss**:
Close ends a blocking layer (**Modal**); Dismiss removes a message (the default Flag, Banner, Section message).

**Flag**:
A short message at the screen corner; `appearance` alone decides its kind. `normal` is the default flag, with the dismiss × and actions as links. Every other appearance is bold: no ×, collapsed to its title, actions as buttons, and it leaves when its action resolves.
_Avoid_: "toast", "snackbar"

**Section message**:
A message that sits in the page flow inside a **Section** or form, colored by its meaning.
_Avoid_: "alert", "callout"

**Toggle**:
An on/off control that applies at once.
_Avoid_: "switch" as a name

**Status tag**:
A label that shows the state of one thing, with a color for its meaning.
_Avoid_: "pill" as a name, "lozenge"

**Count tag**:
A label that shows a number.
_Avoid_: "counter", "badge"

**Tag**:
A label a person can attach, filter by or remove: it names a category rather than a state. No color square unless `swatchBefore` opts in; `elemBefore` is its leading slot.
_Avoid_: "chip"

**Tag group**:
A set of **Tag**s laid out together.
_Avoid_: "tag list"

**Change tag**:
A label for change over time, such as "+3 vs last week": the arrow follows the sign, and which way is good sets the tone.
_Avoid_: "delta tag", "trend indicator"

**Date tag**:
A label that shows a date or due date, colored by how close it is.
_Avoid_: "date pill"

**SMART tag**:
A label for one of the **SMART** competencies, in its curriculum color.
_Avoid_: "skill tag"

**Suggestion**:
A label that offers something the AI proposes, which a person accepts or dismisses.
_Avoid_: "AI chip"

**Fieldset**:
A legend plus the fields it groups: one `fieldset` and `legend`, built on Base UI. The base `RadioGroup` and a Checkbox group compose on top of.
_Avoid_: "field group"

**Radio group**:
One question and its radio answers: a `Fieldset` holding `Radio`s, pick one.
_Avoid_: "multiple choice", "radio list"

**Choice grid**:
A PLUS-only pattern: the same question asked of several rows, as a table: one **Radio group** per row, built from `Radio`.
_Avoid_: "matrix question"

**Linear scale**:
A PLUS pattern on **Radio group**: an inline row of options with a label at either end, used for a reflection form's five-point scale.
_Avoid_: "scale", bare "slider" for this pattern

**appearance**:
The prop that picks how a component looks within its role, such as `default`, `subtle` or `primary`.
_Avoid_: `style`, `fill`, `variant` for this axis

**spacing**:
The prop that sets a component's density in words: `default`, `compact` or `spacious`.
_Avoid_: "density", "small/medium/large"

**size**:
The prop that scales the whole component in pixels bound to a token, such as `size=32`.
_Avoid_: "small", "medium", "large" as sizes

**is… prop**:
A boolean state prop such as `isDisabled`, `isSelected` or `isLoading`.
_Avoid_: bare `disabled`, `selected` or `loading` props

**Base UI**:
The one behavior layer every interactive component wraps (focus, keyboard, ARIA, open and close), decided in ADR-037.
_Avoid_: Bootstrap or React-Bootstrap as a precedent; PLUS ships neither (ADR-042)

**FieldBox / FieldFrame**:
FieldBox is an input's box (leading and trailing slots, density, radius); FieldFrame carries its label, caption and error, and is the only piece choice controls share.
_Avoid_: "input wrapper", "form group"

**Overlay module**:
The shared layer code for everything that floats: the portal, the z-index scale and the stacking rules.
_Avoid_: "overlay" for the **Backdrop**

**State mixin**:
The one shared source of hover, pressed, selected and focus styling, reading **Named state token**s.
_Avoid_: "state layer"

**Focus ring**:
The ring that shows keyboard focus, drawn in the focused border color rather than as a fill.
_Avoid_: "focus outline", "focus state color"

**Icon**:
The component that draws one Font Awesome Free glyph at a token size and an icon color, with an accessible name or marked decorative. Components that take an icon name render it. Its **style** is regular or solid (`iconStyle` in code, `style` in Figma); regular is the default where Font Awesome Free has one. Brand logos are a separate family, chosen by name. **Iconography** is the foundation page with the guidance; Icon is the component.
_Avoid_: "glyph" for the component, a bare `<i>` with Font Awesome classes

**Illustration**:
The component that draws one PLUS character, a SMART character or a math character, at a size. **Illustrations** is the foundation page that says which character to use and when; Illustration is the component.
_Avoid_: "mascot", "avatar" for a character

**Progress indicator**:
A row of dots that shows the current step of a sequence. With `progress`, the current dot stretches into a bar that fills over the step's time, as in a **Carousel**; without a clock (autoplay off, or reduced motion) the stretched dot shows full.
_Avoid_: "dots", "slide marker"

### Design system: tokens

**Token**:
A design value: color, spacing, typography, elevation, radius.

**Foundation**:
A fundamental design primitive (color palette, type scale, grid), and the Figma and Storybook pages that document one. A docs word: the token collections say semantics.

**Token tier**:
The four levels every spacing token sits on, one Figma collection each and the same in code: `spacing / primitives` → `spacing / semantics` → `spacing / patterns` → `spacing / components`, read as **Primitive** → **Semantic** → **Pattern token** → **Component token**. Color mirrors it with `color / primitives`, `color / semantics` and `color / opacity`; the fallback rule for picking a tier is in `design-system/src/styles/Tokens.mdx` § The four-tier ladder.
_Avoid_: "token layer", "level", "foundations" for a collection

**Primitive**:
A raw value on the PLUS ×16 ladder, where `space-100` is 16px.
_Avoid_: "base token", "core token"

**Semantic**:
A token named by its job, the safety net every value falls back to: Pad, Stack, Inline and Radius sit directly in `spacing / semantics`, named by steps (Radius reads sm to xxl, plus full) with no density words; Radius / Control is a group beside them, sm, md and lg, one per control height (radius = height ÷ 4).
_Avoid_: "element token", "foundation token"

**Pattern token**:
A token one pattern owns, such as a Card's padding or a Modal's width, named for the pattern and keyed to `spacing` (default, compact, spacious) where the pattern has one.
_Avoid_: "role token", "container token"

**Component token**:
A token only one component needs, such as Button's radius, used when no shared token fits and keyed to `spacing` (default, compact, spacious) where the component has one.
_Avoid_: "local variable"

**Private variable**:
A `--_<name>-*` custom property inside one component's SCSS that wires its states or sums and only points at tokens. It is not a token.
_Avoid_: "component token" for it

**Named state token**:
A color token that names the state it paints, such as `--ds-background-brand-bold-hovered` or `--ds-background-selected`, so a hover, press or selection reads from its name.
_Avoid_: "state layer", "08/12/16"

**Elevation**:
Six levels, lowest first: Sunken, Default, Raised, Overlay, Blocking and Overflow; a surface and its shadow travel together, while Overflow is shadow only. Layer tokens name z-index, not elevation; `design-system/src/styles/Elevation.mdx` owns the choice by behavior.
_Avoid_: "surface" for a layout box

**Radius**:
A corner chosen by role and nesting, following the ordered rules in `design-system/src/styles/Radius.mdx`: template radii, control height ÷ 4, and inner radius = outer radius − padding are distinct roles. Buttons use the field radius minus the slot inset.

### Design system: motion

**Motion registry**:
The per-template, pattern and component event-to-token table for enter, exit and change, with semantic transitions and optional sound cells; `design-system/agent-views/motion/library.md` is its generated view. Motion tokens follow primitives, semantics, patterns and components (ADR-041).

**Productive**:
The default motion mode: springs at damping ratio 1 everywhere, so nothing overshoots. Controls, fields and anything done dozens of times a day stay Productive.
_Avoid_: "Standard" motion, "normal" motion

**Expressive**:
The motion mode one container opts into with `data-motion="expressive"`, for the end of something worth finishing: a completed reflection or a milestone. Only the spatial tokens change, with a small overshoot; page transitions and data marks stay **Productive**.
_Avoid_: "Playful" motion, "bouncy" for the mode

**Go to**:
The transition between unrelated areas, such as Toolkit to Admin: nothing on the new Page relates to where the person was.
_Avoid_: "navigate" for any move

**Drill in**:
The transition that makes the Breadcrumb longer: a list item or card grows into its detail.
_Avoid_: "open" for a deeper level

**Climb out**:
The transition that makes the Breadcrumb shorter: the detail returns to the place it came from, the reverse of **Drill in**.
_Avoid_: "go back", "close"

<!-- retired-names-ok: the Switch transition is a motion name; the retired Switch component is Toggle -->
**Switch**:
The transition between Tabs or views of one place, with the Breadcrumb unchanged.
_Avoid_: "toggle" for a view change

**Step**:
The transition to the next or previous item of an ordered set, such as a ProgressTracker step; the Breadcrumb keeps its length.
_Avoid_: "next page" for the transition

**Swap**:
The transition that replaces content in place, with the container unchanged.
_Avoid_: "crossfade" for any replacement

**Add or remove**:
The transition for one item entering or leaving a collection, with its neighbors making or closing the gap.
_Avoid_: "insert", "delete" for the motion

**Reorder**:
The transition for items changing position, by drag or keyboard: the carried item follows the hand and its neighbors move aside.
_Avoid_: "sort animation"

**Expand**:
The transition that opens and closes content in place, such as an accordion panel or a row's detail.
_Avoid_: "collapse" as a separate transition

**Load**:
The transition for content that arrives after a wait: a placeholder, then the content.
_Avoid_: "spinner" for the transition

**Open**:
The transition of an overlay appearing and leaving: Popup, Modal, floating Panel or Flag.
_Avoid_: "show", "hide" for the motion

**Dock**:
The transition of a Panel attaching to or detaching from the **Frame**.
_Avoid_: "slide in" for a Panel

**Update**:
The transition that marks a value or state changing in place, such as a count, a ChangeTag or a validation state.
_Avoid_: "flash"

**Call attention**:
The transition that draws the eye to something the person did not ask for: a shake for an error, a pulse for new content.
_Avoid_: "alert animation"

### Design system: sound

**Sound switch**:
The single persisted setting that turns all sound off, on by default and independent of reduced motion; device volume still applies. `design-system/src/styles/SoundSettings.mdx` owns the setting.

**Always silent**:
Moments that carry no sound: Banners, field errors, blocked submits, empty states and load failures, AI generation, saves, live counts, navigation, search and filtering; also revisions, goal updates, copying, strikes, Tutor Coach flags, TIP/PIP, escalations and any concern a student can hear. `design-system/src/styles/SoundWhenToPlay.mdx` and its generated table own the list.

**Notify sound**:
`sound.notify`, G4 then C5 + E5: something arrived that the person has not seen, such as a Flag outside a session.
_Avoid_: "ping", "ding"

**Prompt sound**:
`sound.prompt`, C5 E5 D5 then A5 over C5: something asks the person to act now, such as a session link ready.
_Avoid_: "alert sound"

**Roster sound**:
`sound.roster`, A4 + E5 struck twice: the tutor's student list changed, such as a new student or a lead assigned.
_Avoid_: "assignment ding"

**Goal sound**:
`sound.goal`, G4 and G5 gliding to C5 then C6: a goal was reached, heard by the tutor and the student together.
_Avoid_: "win sound", "achievement"

**Commit sound**:
`sound.commit`, C5 then G5: the person committed to something, such as a completed signup or a submitted form.
_Avoid_: "save sound"

**Done sent**:
`sound.done.sent`, a soft C6 dot: a message or small action went out.
_Avoid_: "send whoosh"

**Done step**:
`sound.done.step`, C5 E5 G5: a step, lesson or reflection finished. An Expressive finish plays it.
_Avoid_: "success sound"

**Done milestone**:
`sound.done.milestone`, G4 rising to B5 in five notes, the fullest sound in the set: onboarding complete, a first session, a goal reached, a term start or end, a badge claimed. An Expressive milestone plays it.
_Avoid_: "fanfare", "celebration sound"

**Concern sound**:
`sound.error`, E5 then D5: something needs a second look, such as a rejected submit or a failed background job.
_Avoid_: "error buzz", "failure sound"

