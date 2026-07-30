# Post-Session — local organisms (Figma ↔ Storybook)

Source of truth: [Toolkit / Post-Session](https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=3400-286833)
and [Components (Local organisms)](https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=1721-118446).

Storybook sidebar order matches Figma: **Overview → Elements → Cards → Tables → Modals → Sections → Pages**.

## Elements (`1721:118447`)

| Figma | Node | Storybook |
|---|---|---|
| Session Rating | `10661:10584` | Elements / Session Rating |
| Form Rating | `4556:16198` | Elements / Form Rating |
| Option Chip | `10661:10292` | Elements / Option Chip |
| Badges / Reflection Status | `1751:212262` | Elements / Reflection Status Badge |
| Reflection Form Actions | `5951:312403` | Elements / Reflection Form Actions |
| Navigation Button + Button Group | `6327:243019` / `6327:243100` | Elements / Navigation Buttons |
| Last Updated | `10750:475179` | Elements / Last Updated |
| Filter / Completion | `221:171321` | Pre-Session Elements / Completion Filter (shared) |
| Upload Files / Session date / No Recording Reason / Session selection | various | Session Information Form section |

Student / Self ratings are Post-Session companions to Session / Form Rating (same Rating primitive).

## Tables (`1721:118449`)

| Figma | Node | Storybook |
|---|---|---|
| Table / Reflections | `1751:176973` | Tables / Reflections |
| Students Dropdown | `20:24325` | Session Information Form (multi-select) |

## Modals (`1721:118454`)

| Figma | Node | Storybook |
|---|---|---|
| Confirmation Pop-up | `6327:241454` | Modals / Confirmation Pop-up |

## Sections (`1721:118456`)

| Figma | Node | Storybook |
|---|---|---|
| Side Nav Bar | `20:24229` | Sections / Side Nav Bar Reflection |
| Dynamic AI Prompted Question Box | `10779:8455` | Sections / AI Prompted Question Box |
| Free Response Question | `791:137860` | Sections / Form Reflection |
| Multi-Select Question | `10791:8694` | Elements / Option Chip (+ group) |

## Pages (`1721:118451`)

| Figma | Node | Storybook |
|---|---|---|
| Full Page / Reflections | `1751:114672` | Pre-Session Pages / Reflection (entry) |
| Session Info | `563:300236` | PostSessionPage + Session Information Form |
| Student Reflection | `10662:18965` | Pages / Student Reflection |
| Session Reflection | `10662:18089` | Pages / Session Reflection |
| Self Reflection | `5179:79703` | Pages / Self Reflection |
| Form Feedback | `5176:24528` | Pages / Form Feedback |
| — | — | Pages / Reflection Flow (orchestrator) |

## Docs conventions

- Every leaf: `*.stories.jsx` + sibling `*.mdx` with `<Title/>` → intro → `<ResourcesBlock/>` (deep `node-id`) → Overview / Interactive.
- Prefer PLUS primitives (`Badge`, `Button`, `Modal`, `Rating`, `Textarea`) — local organisms compose them; never hand-roll lookalikes.
- Regenerate MDX after adding stories: `node scripts/toolkit-spec-docs.mjs`.
