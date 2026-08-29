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

## Role-token blast radius — measured 2026-08-29

The role variables added in #368 (`_<Intent>/<Intent> Icon`,
`_<Intent>/<Intent> Border`) only matter where a component draws a stroke or an
icon from an intent BASE today. That was measured rather than guessed: sixty
public component sets were scanned for nodes whose stroke is one of the six
intent base colours, and for Font Awesome glyphs whose fill is one.

**23 of the 60 sets, 391 nodes.**

| set | stroke or glyph nodes on an intent base |
| --- | --- |
| Dropdown button | 216 — 36 in each of the six intents |
| Outlined buttons | 63 |
| Dismissible Badges | 28 |
| Vertical Outlined buttons | 9 |
| Alert | 7 (6 strokes, 1 glyph) |
| Number Input Group Button, Form Textarea, Nav Pills | 6 each |
| Choice Grid Radios, Form Radio Button, Scale Radio Button | 5 each |
| Input, Form Switch Button, Tab Item, Pill Item | 4 each |
| Form Checkbox, Dropdown list Item, Scrollspy | 3 each |
| Tonal buttons, Text buttons, File Upload, Tag | 2 each |
| Navbar | 1 |

**The warning strokes are the ones that fail.** `_Warning/Warning` is 2.87:1
against `surface-container-highest`, under the 3:1 bar WCAG 1.4.11 sets for a
border. Fifty of the 391 are warning strokes: 36 in `Dropdown button`, 9 in
`Outlined buttons`, 4 in `Dismissible Badges`, 1 in `Alert`. Each is an outline
that can fail against the surface it sits on, and none of them says in its name
that it is a border.

Nothing here has been rebound. `Alert · role-bound (proposal)` on the Alert page
is the worked example — a clone of `11:324` with its six strokes bound to
`_<Intent>/<Intent> Border` and its leading icon to `_<Intent>/<Intent> Icon`,
placed below the original so the two can be compared. The original set is
untouched, per the standing rule that an obsoleted component is kept beside its
replacement rather than deleted.

**What the proposal set taught, and changed.** The Alert set paints its leading
icon from three different roles depending on variant — the base for `primary`,
the neutral `on-surface-variant` for `secondary`, and the `-text` token for the
other four. Binding all six to a base-valued `-icon` would have LIGHTENED four of
them (danger 6.7:1 to 5.0:1, warning 8.7:1 to 5.0:1). That is why every `-icon`
now resolves to its `-text` value instead: 3:1 is the floor an icon must clear,
not the value it should take. See PR #373.

**Not scanned.** Fills. A fill on an intent base is usually correct — the base
IS the ground — and the role tokens do not cover it. The 46 sets with no hits
are mostly typographic, layout or animation sets with no intent colour at all.
