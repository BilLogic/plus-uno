---
embodiment: ide
summary: The reuse ladder (use, arrange, local component, core candidate) and when a prototype builds a local piece on PLUS components and Base UI.
---

# Local components and the reuse ladder

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand) · reached from `design-system/guidelines/overview.md` § Pieces. -->

## The reuse ladder

Take the lowest rung that does the job. Each rung is allowed; none needs permission:

1. **Use.** A template slot or a component as it is, through its props.
2. **Arrange.** Existing components placed in a slot — JSX in the screen.
3. **Local component.** A named component in the build's own `components/` folder (`prototypes/<slug>/src/components/`), when an arrangement is used twice in the build or carries its own state or behavior. Built from existing components and tokens; new interactive behavior runs on `@base-ui/react` (`ds/no-raw-control`, hard rule 5).
4. **Core candidate.** A local component that another area would use unchanged. Keep it local so the build proceeds, record the gap in the artifact manifest, and file a `uno-maintain` intake for the missing core component.

Match the rung to each component's usage note: reach for a local composition when forcing a core component goes against its usage rule (such as a bare `Select` where Filtering calls for `FilterButton`, a `Table` used for layout, or a `Modal` where a `Panel` belongs).
