# Post-Session — local organisms (Figma ↔ Storybook)

Source of truth: [Toolkit / Post-Session](https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=3400-286833)
and [Components (Local organisms)](https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=1721-118446).

Storybook sidebar order matches Figma: **Overview → Elements → Cards → Tables → Modals → Sections → Pages**.

Audited against Figma `1721:118446` (2026-07-30). Every non-obsolete organism below has code + Storybook docs (MDX).

## Elements (`1721:118447`)

| Figma | Node | Storybook |
|---|---|---|
| Badges / Reflection Status | `1751:212262` | Elements / Reflection Status Badge |
| Button Group | `6327:243100` | Elements / Navigation Buttons |
| Filter / Completion | `221:171321` | Pre-Session Elements / Completion Filter (shared) |
| Form Rating | `4556:16198` | Elements / Form Rating |
| File List Item | `10750:475180` | Elements / File List Item |
| Last Updated | `10750:475179` | Elements / Last Updated |
| Navigation Button | `6327:243019` | Elements / Navigation Buttons |
| No Recording Reason | `10925:11334` | Elements / No Recording Reason |
| Option Chip | `10661:10292` | Elements / Option Chip |
| Reflection Form Actions | `5951:312403` | Elements / Reflection Form Actions |
| Session date | `10882:170725` | Elements / Session Date |
| Session Rating | `10661:10584` | Elements / Session Rating |
| Session selection | `20:24370` | Elements / Session Selection |
| Students Dropdown | `20:24325` | Elements / Students Dropdown |
| Upload Files | `7486:93070` | Elements / Upload Files |

## Cards (`1721:118453`)

Empty in Figma — no Storybook leaves.

## Tables (`1721:118449`)

| Figma | Node | Storybook |
|---|---|---|
| Table / Reflections | `1751:176973` | Tables / Reflections |

## Modals (`1721:118454`)

| Figma | Node | Storybook |
|---|---|---|
| Confirmation Pop-up (`exit` · `exit without saving` · `reflection submitted`) | `6327:241454` | Modals / Confirmation Pop-up |

## Sections (`1721:118456`)

| Figma | Node | Storybook |
|---|---|---|
| Dynamic AI Prompted Question Box | `10779:8455` | Sections / Dynamic AI Prompted Question Box |
| Free Response Question | `791:137860` | Sections / Free Response Question |
| Linear Scale | `10819:11602` | Sections / Linear Scale |
| Multi-Select Question | `10791:8694` | Sections / Multi-Select Question |
| Other Text Input | `10807:115523` | Sections / Other Text Input |
| Session Notes | `10808:478232` | Sections / Session Notes |
| Side Nav Bar | `20:24229` | Sections / Side Nav Bar |

## Pages (`1721:118451`)

One Storybook docs leaf per Figma page. Empty / filled / AI states are **story variants or Controls args**, not nested Unfilled/Filled docs.

| Figma | Node | Storybook |
|---|---|---|
| Full Page / Reflections | `1751:114672` | Pre-Session Pages / Reflection (shared entry) |
| Session Info | `563:300236` | Pages / Session Info |
| Student Reflection | `10662:18965` | Pages / Student Reflection |
| Session Reflection | `10662:18089` | Pages / Session Reflection |
| Self Reflection | `5179:79703` | Pages / Self Reflection |
| Form Feedback | `5176:24528` | Pages / Form Feedback |

### Reflection Flow (orchestrator — not a Figma page)

| | Storybook |
|---|---|
| End-to-end clickable prototype (hi-fi app mounts this) | Pages / Reflection Flow |

Use **page docs** for single-step visual QA against Figma masters. Use **Reflection Flow** to walk Session Info → Students → Session → Self → Form Feedback with nav, cadence, cancellation, and modals.

## Obsolete (removed from Storybook catalog)

These are **not** in the current Figma Components strip. Source may remain as `.archive` / wrapper for back-compat:

| Was | Reason |
|---|---|
| Student Rating / Self Rating | Superseded by Option Chips + Linear Scale |
| AI Generating Placeholder | Loading is a state of Dynamic AI Prompted Question Box |
| Session Info (Element) | Session Info is a **Page** |
| Save And Exit (separate modal) | Confirmation Pop-up `type=exit without saving` |
| Sections / Form Feedback | Form Feedback is a **Page** |
| Post Session Page shell | Superseded by Reflection Flow + page states |

## Docs conventions

- Every leaf: `*.stories.jsx` + sibling `*.mdx` with `<Title/>` → intro → `<ResourcesBlock/>` (deep `node-id`) → Overview.
- Prefer PLUS primitives (`Badge`, `Button`, `Modal`, `Rating`, `Textarea`, `DatePicker`, `Dropdown`) — local organisms compose them.
- Do not invent organisms that are not in the Figma strip.
