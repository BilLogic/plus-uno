<!-- Tier: 2 -->

# Composition

How components combine. Foundations answer "what is this value"; composition
answers "what goes where, and inside what".

| Doc | Answers |
|-----|---------|
| [layout.md](layout.md) | The approved page skeletons — app shell, overlay, navigation, responsive behaviour |
| [hierarchy.md](hierarchy.md) | The four context levels (element → card → section → page) and the token layer each draws from |
| [surfaces.md](surfaces.md) | Cards, tables, modals, empty and loading states |
| [forms.md](forms.md) | Field composition, spacing, validation, the modal form variant |

## The rule these share

Do not invent an outer structure. When building a page, a prototype, or a
feature, start from a skeleton in `layout.md` and compose upward through the
levels in `hierarchy.md`. Raw flexbox for page structure is how two screens end
up with three different gutters.

## Related

- `../foundations/grid.md` — the breakpoints and column spans these skeletons sit on
- `../foundations/spacing.md` — the scales behind every gap named here
- `../components/overview.md` — what each component is for
