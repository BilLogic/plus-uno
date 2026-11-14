---
summary: ProgressBar, ProgressRing, Skeleton, Spinner or GenerativeBorder — showing work in flight
---

<!-- Tier: 2 | Load when: choosing a component from the loading group -->

# Loading — which component to reach for

Five components: `ProgressBar`, `ProgressRing`, `Skeleton`, `Spinner` and `GenerativeBorder`.
Generated facts are in `design-system/src/components/loading/index.md`.

## The choice

| You want to show | Reach for |
|---|---|
| how far along a known quantity is, across a track | `ProgressBar` |
| how far along a known quantity is, in an icon-sized slot | `ProgressRing` |
| the shape of content that is still loading | `Skeleton` |
| that something is happening, length unknown | `Spinner`, or `ProgressBar isIndeterminate` for a task with a bar's place on the page |
| that the AI is generating into a region | `GenerativeBorder` with `isActive` |

`ProgressBar` takes `value` as a percent, 0 to 100, clamped so the drawn width
and the announced `aria-valuenow` agree. Name it with `ariaLabel`: the default,
"Progress", says nothing when a page has two bars.

`ProgressRing` takes `value` (0 to 100, clamped) and a required `label` for the
same determinate signal inside a compact slot (`size` 16, 20 by default, or 24;
`appearance` `default` or `inverse`). A ring is never indeterminate; unknown
time is `Spinner`'s job.

`Spinner` is one animated ring. `size` is a pixel diameter, 16, 24 (default)
or 48; `appearance="inherit"` takes the surrounding text color and `"invert"`
sits on a bold or colored background. It renders `role="status"` with its
`label` ("Loading" by default) as visually hidden text.

`Skeleton`'s rules — composed to the real content's dimensions, with
`aria-busy` on the loading region — are on its docs page and in
`design-system/guidelines/composition/surfaces.md`.

## A spinner in a button

A busy button is `Button isLoading`, never a `Spinner` placed by hand. The
spinner takes the button's icon size, 16 in both spacings, on the icon-size
token (`--icon-md`, which is `--size-100`), and replaces the label and icons in
the label color, so the button keeps its width and height while it sends.
Disabled states: `design-system/guidelines/composition/form-behavior.md`
§ Unavailable actions and fields.

## Announcing change

`ProgressBar` updates its `aria-valuenow` on every render, which assistive
technology polls rather than announces. If a change genuinely needs to
interrupt, that is `Flag` — see
`design-system/guidelines/components/messaging.md`.

## Related

- `design-system/src/components/loading/index.md` — generated facts and coverage
- `design-system/guidelines/components/labels.md` — labeling state
- `design-system/guidelines/components/messaging.md` — messages that need to be read
