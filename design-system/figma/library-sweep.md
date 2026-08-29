# Figma library sweep — component set descriptions

A component's **description** is what a designer reads in the Figma assets panel.
It is the closest thing the library has to a docs page, and on 2026-08-29
**66 of the 112 public component sets had none**.

All 112 have one now. Each says what the set is, lists its variant props, and —
where the registry maps one — names the code component and its import path.
Descriptions written from live reads of `componentPropertyDefinitions`, not from
the seven-week-old snapshot.

```
public component sets   112   (excluding `_`-prefixed internals and the Archive page)
described before         46
described after         112
```

## What writing them surfaced

A description forces you to name every variant property out loud, and that is
where the naming stops holding up. Each of these is recorded in the set's own
description as well as here, so a designer meets it where they meet the
component.

### Unnamed variant properties — 4

The property has no name at all, so the picker shows an unlabelled dropdown and
the values carry the whole meaning:

| set | node | values | what they mean |
|---|---|---|---|
| Cascade list | `13584:55731` | 1–6 | column count |
| Multiple Choice (Radio) | `13540:9207` | 2–7 | option count |
| Multiple Choice (Checkbox) | `13540:9717` | 2–7 | option count |
| tree_dropdown layers | `13529:1075` | 0–3 | indent depth |

### Unrenamed defaults — 5 sets

`Property 1`, `Variant2`, `Variant3`, `size3`, `addon position4` are what Figma
names a thing when nobody names it. Two of them are on the newest sets in the
file:

- `CheckBox Grid` `13541:9240` — `Property 1: Default | Row`, where its radio
  sibling calls the same axis `Variant`
- `Date Picker (Range)` `9538:17087` — `Property 1`, where the single-date
  sibling calls it `state`
- `Overview Card` `12785:189314` — `Property 1: size3 | Variant2`; **both**
  values are defaults, so neither says what it is
- `Pattern/Pages` `17353:7781` — `Surface container | Variant2 | Variant3`
- `Pattern/Tables` `17353:8584` — `Table | Variant2`

### One concept, two spellings

- **`preppend`.** `Multiple Dropdown` `13612:78859` spells it with two p's;
  `Multiple Inputs` `13612:78094`, on the same page, spells it correctly. The
  same idea reads two ways within one component.
- **`size` vs `type` for head-or-body.** The borderless table sets (`10:473`,
  `10:507`) call the axis `size`; the bordered set (`10:502`) calls it `type`.
  Neither is a size.
- **Trailing spaces.** `Input Group` `13671:3218` and `Input Group Text`
  `13659:1414` both define `leadingVisual ` and `trailingVisual ` **with a
  trailing space**, which is how they read in the panel and in any Code Connect
  mapping.

### Vocabulary drift against the code — the #265 question, concretely

`Table/Contextual Color` `10:721` and `Table/Background Color` `10:722`:

| Figma says | the system says |
|---|---|
| `error` | `danger` (`--color-danger`) |
| `mastering` | `--color-mastering-content` |
| `social` | `--color-social-emotional` |
| `technology` | `--color-technology-tools` |

`error` is the one that matters: it is a different word for a semantic the rest
of the library, the token file and every component call `danger`. The domain
names are truncations rather than different words, but a designer reading
`social` in a picker has no route to `--color-social-emotional`.

### Values that are literals where the system has tokens

`Divider` `10:174` — `size: 1px | 2px | 3px | 4px`. Every other set in the file
names a token or a semantic step.

### A picker whose order is not the animation's order

`Loading Animations 3 - stacking` `9297:3156` has fifteen steps and Figma sorts
variant values as TEXT, so the panel reads `1, 10, 11, 12, 13, 14, 15, 2, 3 …`.
Zero-padding (`01`) is the usual fix. The twelve-step set `9297:3104` has the
same shape and is not sorted wrongly only because it happens to be picked in
order less often.

## What is NOT a finding here

Recorded because a sweep that reports everything reports nothing:

- **The `_`-prefixed sets.** 38 of them. The file's own convention marks them as
  pieces rather than products, and they are excluded from this count.
- **Duplicate sets kept on purpose.** `Input Group Text` exists three times
  (`13125:6054`, `53:20700`, `13659:1414`), `tree_dropdown component ver 1` sits
  beside `tree_select_ver2`, and the student-row colour sample exists twice. The
  library keeps obsoleted work beside its replacement deliberately. Each
  description now says which siblings exist and that choosing between them is a
  design decision — it does not choose.
- **Sets that are parts of a mapped component.** `accordion-item`, `Tab Item`,
  `Pill Item`, `Dropdown list Item`, `Rating Icons`, `Multi-Select Option`,
  `Card Components` and the rest map to no code component because code renders
  them from the parent's props. Their descriptions say so rather than leaving
  the absence unexplained.

## What a description cannot carry

- **Whether the variant set is right.** `Overview Card` has two variants and
  neither is named; the description says so, but whether the card needs two
  variants at all is a design question.
- **Whether the code and the Figma props agree.** `figmaMeta.variantProps`
  records known divergences (TopBar's Figma `expand?` against code's `mode`).
  Nothing re-reads them, and this sweep did not.
- **Publishing.** Every description written here is **unpublished** until the
  library is published from Figma. Consumers see nothing until then.

## Role-token blast radius — measured 2026-08-29, corrected the same day

The role variables added in #368 (`_<Intent>/<Intent> Icon`,
`_<Intent>/<Intent> Border`) only matter where a component draws a stroke or an
icon from an intent BASE. That was measured rather than guessed.

**The first measurement over-counted, and the correction is the finding.** It
reported 391 nodes across 23 sets, counting every node that resolved to an
intent base colour. Most of those are not decisions. A stroke inside an INSTANCE
belongs to the set that instance came from: change the owner and every instance
follows. Splitting the same scan by ownership:

| | nodes | sets |
| --- | --- | --- |
| **owned** — the set's own strokes | **122** | **8** |
| inherited through an instance | 293 | 15 |

`Dropdown button` was the largest number in the first table, at 216. It owns
**none** of them: every one is an `Outlined buttons` instance, and all 216 are
inherited rather than overridden — checked field by field through
`instance.overrides`, which lists radii, sizing and stroke WEIGHTS and never
`strokes`. It is a dependant, not an offender. The same is true of `Tonal
buttons` and `Text buttons` (from a private `_Button`), of `Nav Pills` (from
`Pill Item`), of the three radio sets (from `_Form Radio Button`), and of
`Scrollspy`, `Navbar`, `Input`, `File Upload`, `Form Checkbox`, `Dropdown list
Item`, `Form Switch Button` and `Number Input Group Button`.

### The eight sets that own an intent stroke

| set | owned strokes | of which warning |
| --- | --- | --- |
| Outlined buttons | 63 | 9 |
| Dismissible Badges | 28 | 4 |
| Vertical Outlined buttons | 9 | 0 |
| Alert | 6 | 1 |
| Form Textarea | 6 | 0 |
| Tab Item | 4 | 0 |
| Pill Item | 4 | 0 |
| Tag | 2 | 0 |

**The warning strokes are the ones that fail.** `_Warning/Warning` is 2.87:1
against `surface-container-highest`, under the 3:1 bar WCAG 1.4.11 sets for a
border. Fourteen of the 122 are warning strokes, and each is an outline that can
fail against the surface it sits on while its token name says nothing about
being a border.

### Eight role-bound proposals, one per owning set

Each is a clone placed BELOW its original with every intent stroke the set owns
rebound from `_<Intent>/<Intent>` to `_<Intent>/<Intent> Border`. The originals
are untouched, per the standing rule that an obsoleted component is kept beside
its replacement rather than deleted. Together they cover all 122.

Two things the verification pass established. The originals were already bound
to intent **variables** rather than to raw hexes, so each proposal is a
variable-to-variable move and not a re-colouring. And every non-intent stroke
was correctly left alone: `Neutral Colors/outline` and `outline-variant`,
`_Primary/Inverse Primary` — which is the focus ring, not an intent — and
`_Primary/Primary Container`.

### One gap the proposals surfaced

`Tag` binds five SMART **subject** colours as strokes — Advocacy,
Mastering-Content, Relationship, Social-Emotional, Technology-Tools — and none
of them has a `Border` role, because #368 scoped the role layer to the seven
intents. Measured against the five surface steps, all five clear 3:1 as a
border (worst 4.05:1, Mastering-Content and Social-Emotional on
`surface-container-highest`), so this is a **naming gap and not a contrast
defect**. Four of the five fail 4.5:1 as text on the darker grounds, which is
the same shape the intents have.

### What the proposal set taught, and changed

The Alert set paints its leading icon from three different roles depending on
variant — the base for `primary`, the neutral `on-surface-variant` for
`secondary`, and the `-text` token for the other four. Binding all six to a
base-valued `-icon` would have LIGHTENED four of them (danger 6.7:1 to 5.0:1,
warning 8.7:1 to 5.0:1). That is why every `-icon` now resolves to its `-text`
value instead: 3:1 is the floor an icon must clear, not the value it should
take. See PR #373.

### Not scanned

Fills. A fill on an intent base is usually correct — the base IS the ground —
and the role tokens do not cover it.
