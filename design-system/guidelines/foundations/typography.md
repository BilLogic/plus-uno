---
summary: Text styles, type tokens and the text-style classes
---

<!-- Tier: 2 -->

# Typography Tokens

## Type scale in components

Component text takes a text style: `font: var(--heading-small)`, `var(--body-default)` and the rest of the Type Scale in `design-system/agent-views/tokens/tokens.md`. An icon glyph takes an icon size (`--icon-md`). `npm run check:font-size-literals` holds components and patterns to that.

- **Headings step one size per nesting level**, and the tag follows the nesting: the page's one `h1` is Heading/large 24, a section's `h2` Heading/medium 20, a subsection's `h3` Heading/small 16. `PatternSection` picks its level from `@/lib/headingLevel`; a page or a dialog is level 1.
- **Container titles are fixed**: a modal's is Heading/medium 20 and is the dialog's `h1`, named by `aria-labelledby`; a card's, a popup's and a flag's are Heading/xsmall 14, and a card's sits over a Body/default 14 description, tagged one level below its section. Card and PatternCard read the card title's type from one mixin, `card-title-type` in `design-system/src/styles/_card-title.scss`, so a size change is that one edit.
- **Group labels** are Heading/xxsmall 12 and name a `role="group"` or a table head cell; they are never headings.
- **Button and Tab group labels** are Body/default at `--type-weight-medium`, with no separate button style.
- **A Sidebar tab's label is Body/default at regular weight**: a Sidebar tab is a navigation row, not a tab in a Tab group.
- **Code has no Figma style**: `--code` is code-only.
- Binding a weighted label or a code sample in Figma: `design-system/guidelines/figma/token-mapping.md` § Text that carries no style.

- **A Jumbotron's title is the page's `h1`**, so a page that has one gives its `Surface` no `title`.

## Font Families

| Usage | Token | Font |
|-------|-------|------|
| Headings 32 to 20 (Heading xxlarge to medium) | `--type-family-heading-serif` | Noto Serif, weight 500 |
| Headings 16 to 12, metrics (tabular numbers) | `--type-family-heading` | Noto Sans, weight 600 |
| Body text | `--type-family-body` | Noto Sans, weight 400 and 500 |
| Code | `--type-family-code` | Noto Sans Mono |
| Brand headings and body | `--type-family-brand-heading`, `--type-family-brand-body` | Noto Serif, Noto Sans |

Letter spacing is `-0.02em` at 32 and `-0.01em` at 28 and 24, set beside the
`font` shorthand from `--heading-xxlarge-tracking` and its siblings; everything
20 and under is 0. A quote takes the body family. Fraunces is not part of the
system. Tuning notes: Foundations/Typography in Storybook.

## Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--type-weight-regular` | 400 | Body text |
| `--type-weight-medium` | 500 | Labels, emphasis, Noto Serif headings 20 and up |
| `--type-weight-semibold` | 600 | Noto Sans headings 16 and under, metrics |

## Text-style classes

Markup with no stylesheet of its own takes the text style as a class, one per
style, generated beside the type tokens: `.heading-xxlarge` … `.heading-xxsmall`,
`.body-large`, `.body-default`, `.body-small`, and `.metric-large` …
`.metric-small`. Each sets the `font` shorthand, and the tracked headings their
letter spacing. A component's own stylesheet sets `font: var(--…)` instead.

```jsx
<p className="body-default">Helper text</p>
<h2 className="heading-medium">Section title</h2>
```

## Rules

1. **Do not hardcode font values.** Use a text style, a type token, or an icon size.
2. **Match the style to the hierarchy**, not to the size you want: Heading by nesting level, Body for content, Metric for numbers that are the point.
3. **Body text is regular (400)**; labels and emphasis use medium (500).
4. **Headings 20 and up are Noto Serif at 500**; 16 and under are Noto Sans at 600.

## Figma text styles

- Heading, Body, Metric and Code are the text styles for all work; pick by where the text sits on the page, not by how big it should look.
- Heading/large 24 is the page's one h1, Heading/medium 20 a section's h2, Heading/small 16 an h3; a modal title is Heading/medium, a card, popup or flag title Heading/xsmall. Never skip a level.
- Labels (button, tab, menu) use Body/default/medium; there is no separate button style.
- Numbers that are the point use Metric, never a heading style.
- Names and titles truncate to one line; text that is the content wraps. Never shrink type to fit.
- Sizes are in rem, so text follows the reader's browser setting.

