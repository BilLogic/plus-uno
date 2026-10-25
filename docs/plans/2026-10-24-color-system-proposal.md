---
title: "Color system: research and proposal"
type: research
status: proposal, iteration 2; brand decided (Lagoon), Plan A vs Plan B and other calls awaiting Bill
date: 2026-10-25
repos: plus-uno (design-system/src/tokens, BS4 Foundation Figma library)
artifact: https://claude.ai/artifact/SWQGFicTN9bV6HcF3fS3sk
---

# Color system: research and proposal

PLUS should replace its Material 3 color roles with an Atlassian-shaped token set. Underneath: nine OKLCH hue ramps and two gray ramps of numbered steps. On top: about 160 semantic tokens named `color.property.role.emphasis.state`, plus Atlassian's elevation tokens (surfaces, shadows, opacity), all in light and dark. Bill has chosen the brand: **Lagoon**, a greener teal at hue 205° (`#147b84`). The ramps are generated, not hand-picked: each step number is a contrast promise against white, so step 700 and darker always carry text and 500 and darker always clear 3:1.

Iteration 2 adds three things to the first draft:

- **All nine Atlassian accent families, tuned to sit with Lagoon.** Hues are spaced for even perceptual distance and capped in chroma so no accent outshouts the brand (§4.2).
- **Elevation in Atlassian's language**, mapped onto the UI patterns PLUS has already defined: the frame, the surface, sections, cards, tables, popovers and modals (§4.4, §4.5).
- **Two directions for the neutrals and surfaces**, to explore before committing: **Plan A, Paper**, toward Notion, and **Plan B, Neutral**, toward Claude as served today. They share every hue ramp and every token name, and differ only in the grays and in drawing structure with borders or with tone and soft shadow (§4.6).

This is research and a proposal only. No token, component or Figma variable has changed. The visual companion is the artifact linked above. It renders both plans as a working PLUS screen in light and dark, plus every ramp and every semantic token. Section 5 lists the decisions only Bill can make, each with a recommendation.

The generator and the data behind every table here are reproducible. They are small Python scripts with no dependencies (OKLab math from [Ottosson](https://bottosson.github.io/posts/oklab/)), kept with this doc's copy in `~/Documents/Claude/Projects/PLUS/color-system/`.

## 1. Where Bill is leaning

Sources are the Zoom AI meeting summaries emailed to Bill (Zoom labels them "AI can make mistakes"), the PLUS Notion, and Bill's rulings already recorded in this repo. Quotes are from the summaries, so they are Zoom's wording, not Bill's verbatim.

| Date | Meeting | What was said |
|---|---|---|
| 2026-10-08 | Anna / Bill 1:1 | The Material-derived palette "appears too saturated for an AI-focused educational platform". The team is "considering a color revision toward a pastel, natural aesthetic similar to Notion's design, while maintaining their current teal or bluish-green primary color". The brand vibe is "closer to Notion and Claude with a preference for pastel tones"; Paper was "too sharp". For AI, "a monochromatic tone similar to Notion and Claude". |
| 2026-10-19 | PLUS Universal stand-up | Layout first, then color and type. "They aligned on using Atlassian's design system as a benchmark for their color token naming convention and semantic values, aiming for a pastel color palette with teal as the primary color to match the desired aesthetic of Claude and Notion interfaces." |
| 2026-10-23 | Anna / Bill 1:1 | The target is "a final documentation similar to Atlassian's design system with primitives and semantics". Keep teal "rather than the traditional corporate blue"; "move away from a corporate blue toward a teal or greenish-blue color to appear more modern and youthful". Color is "the current biggest blocker", to be decided "within the next 1-2 weeks". The team "decided to shift from Material Design to Atlassian's design system approach for documenting colors". |
| 2026-10-23 | Adrija / Bill stand-up | "Keeping the primary color as a slightly greener shade of teal while potentially revising the secondary and tertiary colors." Bill "recommended migrating to semantic tokens and suggested using OKLCH color space instead of Material Design", pointing to the shadcn theme generator and Atlassian's token set and source code, and "advised against manually generating color steps". He expressed "some uncertainty" about token naming. Keep the brand direction simple and "use Notion and Claude as reference points for elevation". |

**Earlier context.** Notion card 1515, "Optimization of Accent and Secondary Color Palette" (Feb–Apr 2025), produced today's accent set on Material Design 3 color roles and the Material Theme Builder. Its problem statement was that "our secondary color is too similar to the primary color". The team chose a blue primary, a neutral secondary and, by poll, a green-vs-teal tertiary. The PLUS asks corpus shows the cost of that vocabulary: interns asked "What distinguishes neutral vs secondary colors for text elements?", which color source is authoritative, and the "rationale behind the accent/secondary color scheme selection" (Notion asks corpus, captured 2026-10-02).

**Rulings already in force** (recorded 2026-10-24): hover, pressed and selected-or-dragged use 08/12/16 overlays; focus is a ring, never a fill; floating layers use elevation light-3 and modals light-4; cards are flat at rest; gray fills are for recessed areas; the warning icon and border are `#715c00`; filled warning keeps its yellow with dark ink; `info` keeps its tertiary alias.

**Reading of the lean, against the brief's four keywords:**

1. *Investigate the subject as discussed with Claude and Notion.* Both are the mood target: warm, low-saturation neutrals, pastel accents and one brand hue used sparingly. Neither publishes a token system, but both serve one in their CSS (§2.4, §2.5).
2. *Revisit the brand color for the primary.* Keep teal, go slightly greener, avoid corporate blue. Today's `--color-primary` `#0472a8` measures `oklch(0.526 0.119 240)`, which is a cerulean blue; the system's actual teal is the tertiary `#0e8175` at hue 183°. "Slightly greener teal" is therefore a real hue move from 240° toward 190–220°, not a tint.
3. *Revisit the token naming language.* Leave Material's `on-` / `container` / state-layer vocabulary for Atlassian's `property.role.emphasis.state`.
4. *Move the color space to OKLCH.* Generate the ramps; don't hand-pick steps.

## 2. Benchmark

Every claim carries its source. Atlassian facts come from the shipped package `@atlaskit/tokens@20.7.0` (published 2026-10-22), read as text from unpkg, and from atlassian.design. Short keys: **PAL** = [palette.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/artifacts/palettes-raw/palette.js), **RAW-L** = [tokens-raw/atlassian-light.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/artifacts/tokens-raw/atlassian-light.js), **CL** = [CHANGELOG.md](https://unpkg.com/@atlaskit/tokens@20.7.0/CHANGELOG.md), **GEN** = [generate-colors.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/utils/generate-colors.js), **MAP** = [generate-token-map.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/utils/generate-token-map.js).

### 2.1 Atlassian: primitives

- **Nine saturated hues, twelve steps each.** Lime, Red, Orange, Yellow, Green, Teal, Blue, Purple and Magenta, at 100, 200, 250, 300, 400, 500, 600, 700, 800, 850, 900 and 1000 ([PAL](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/artifacts/palettes-raw/palette.js)). The 250 and 850 steps arrived in 7.1.0 (2025-11-03) "to support better hover/pressed state contrast" ([CL](https://unpkg.com/@atlaskit/tokens@20.7.0/CHANGELOG.md) § 7.1.0). The docs page still says "10 swatches" ([color-palette](https://atlassian.design/foundations/color/color-palette)); the code has 12.
- **Neutrals.** Neutral runs 0–1200 with five alphas (100A–500A); DarkNeutral is a separate ramp, -100 and 0–1200 including 250 and 350, with eight alphas ([PAL](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/artifacts/palettes-raw/palette.js)). There is no gray hue family; the gray accent uses the neutrals ([RAW-L](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/artifacts/tokens-raw/atlassian-light.js)).
- **Brand blue is `Blue700 #1868DB`**, down from `#0C66E4`. The 2024 visual refresh became the default theme in 8.0.0 (2025-11-07) ([CL](https://unpkg.com/@atlaskit/tokens@20.7.0/CHANGELOG.md) § 8.0.0). It re-valued Blue, Purple, Orange, Yellow and both neutral ramps, and the neutrals lost their navy tint: Neutral1000 went from `#172B4D` to `#292A2E` ([PAL7](https://unpkg.com/@atlaskit/tokens@7.0.0/dist/cjs/artifacts/palettes-raw/palette.js) vs [PAL](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/artifacts/palettes-raw/palette.js)). The refresh announcement promised neutrals with "fewer blue tints" ([community post](https://community.developer.atlassian.com/t/a-visual-refresh-of-our-ui-foundations-is-coming/84949)).
- **Steps line up by contrast, not by lightness.** Measured from PAL (my conversion): step 600 sits at 3.3–4.0:1 on white and step 700 at 4.5–5.2:1 in every family, while OKLCH lightness at step 700 ranges from 0.54 (blue) to 0.58 (orange). Atlassian has not published how the base palette was made (**unverified**); the award write-up says only that the team "aligned contrast across colours" ([good-design.org](https://good-design.org/projects/atlassians-colour-system-at-scale/)).

### 2.2 Atlassian: semantic grammar, themes and generation

- **Grammar.** "All color design tokens start with the word 'color', followed by the property… [then] color role, emphasis level, and interaction state" ([foundations/color](https://atlassian.design/foundations/color)). An unqualified token is `[default]` in source and drops out of the name ([RAW-L](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/artifacts/tokens-raw/atlassian-light.js)). The light theme ships 467 tokens: background 208, chart 100, text 49, border 40, icon 23, elevation.surface 13, rovo 11, shadow 5, link 4, blanket 3, interaction 2, skeleton 2 (counted from RAW-L).
- **Roles:** neutral, brand, information, success, warning, danger, discovery, accent, inverse, input ([foundations/color](https://atlassian.design/foundations/color)); the code adds selected, disabled and focused (border only).
- **Emphasis is not a full cross-product.** Brand backgrounds have subtlest, bold and boldest; semantic backgrounds have default, subtler, subtle and bold; accents have subtlest, subtler, subtle and bolder ([RAW-L](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/artifacts/tokens-raw/atlassian-light.js)). "Emphasis determines the amount of contrast a color has against the default surface" ([foundations/color](https://atlassian.design/foundations/color)).
- **States.** `hovered` and `pressed` are separate tokens on interactive backgrounds only: one step darker in light (700→800) and one lighter in dark (400→300). There are none on text, icon or border, and `link` has `pressed` and `visited` but no hover: "Add an underline for hovered states" ([RAW-L](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/artifacts/tokens-raw/atlassian-light.js)). The brief's premise that `bolder` is the hover of `bold` does not hold: `bolder` is its own emphasis level.
- **Overlays are the exception.** `color.interaction.hovered` / `.pressed` (`#00000029` / `#00000052` in light) are for elements "when their background color cannot change, such as avatars" ([RAW-L](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/artifacts/tokens-raw/atlassian-light.js)). Atlassian's system is opaque named steps first, overlays second; PLUS's is the reverse.
- **Elevation.** `elevation.surface`, `.sunken`, `.raised`, `.overlay` and `.container`, each with hovered and pressed except sunken; shadows `elevation.shadow.raised`, `.overlay` and `.overflow`. "The higher the elevation, the lighter the surface looks" in dark mode ([elevation](https://atlassian.design/foundations/elevation)).
- **Dark mode mirrors light by step:** 100↔1000, 200↔900, 250↔850, 400↔700. "If a button color is 700 in light theme, it will be 400 in dark theme" ([color-palette](https://atlassian.design/foundations/color/color-palette)); the custom-theme generator computes dark as `9 - lightIndex` ([MAP](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/utils/generate-token-map.js)).
- **Themes: two color modes, each with an increased-contrast variant.** Atlassian has two modes, light and dark (`data-color-mode`). Contrast is a separate axis (`data-contrast-mode`: `more`, `no-preference` or `auto`, which follows the OS setting), and `more` swaps in `light-increased-contrast` or `dark-increased-contrast`. Those two themes `extend` their base and override only part of it: 253 of 466 light variables and 185 of 466 dark variables, mostly text, icon, border, bold backgrounds and chart colors. For example, `text.subtlest` goes from `#6B6E76` to `#3B3D42`, and `border.input` from `#8C8F97` to `#505258` (diffed from the 20.7.0 theme CSS, [themes](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/esm/artifacts/themes/), [theme-config.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/esm/theme-config.js)). So Atlassian ships four color themes in two modes, not three modes. legacy themes were removed in 11.0.0 (2026-02-02) ([theme-ids.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/theme-ids.js), [CL](https://unpkg.com/@atlaskit/tokens@20.7.0/CHANGELOG.md) § 11.0.0). A flag-gated "FY27 Finesse" override (September 2026) turns selected states neutral gray instead of blue ([CL](https://unpkg.com/@atlaskit/tokens@20.7.0/CHANGELOG.md) § 16.11.2); whether it becomes the default is **unverified**.
- **CSS emission.** `--ds-` plus the path without `color.`: `color.background.brand.bold` → `--ds-background-brand-bold`, `elevation.surface` → `--ds-surface` ([get-css-custom-property.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/utils/get-css-custom-property.js)). `token(path, fallback)` returns `var(--ds-…, fallback)`; `setGlobalTheme` sets `data-theme` and `data-color-mode` on `<html>` ([set-global-theme.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/set-global-theme.js)).
- **Custom brand ramps are generated in HCT, not OKLCH.** `generateColors(brandHex)` keeps the brand's hue and chroma and solves each step's tone to hit a fixed WCAG ratio against white, from one of two tables chosen by how light the hue is: `[1.12, 1.33, 2.03, 2.73, 3.33, 4.27, 5.2, 6.62, 12.46, 14.25]` for dark hues and `[1.08, 1.24, 1.55, 1.99, 2.45, 3.34, 4.64, 6.1, 10.19, 12.6]` for light ones. It then swaps the nearest step for the exact brand hex ([GEN](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/utils/generate-colors.js); HCT and contrast code "copied from @material/material-color-utilities", [contrast.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/utils/hct-color-utils/contrast.js)). There is no OKLCH anywhere in the package.

### 2.3 shadcn/ui, Radix Colors, Tailwind v4

- **shadcn/ui** pairs every surface with a `-foreground` token (`primary` ↔ `primary-foreground`) ([theming](https://ui.shadcn.com/docs/theming)). Its Tailwind v4 migration states "HSL colors are now converted to OKLCH" ([tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4)). The neutral theme's values are exactly Tailwind's `neutral` ramp, e.g. `--background: oklch(1 0 0)`, `--foreground: oklch(0.145 0 0)`, `--destructive: oklch(0.577 0.245 27.325)`; dark `border` and `input` are translucent white at 10% and 15% ([registry neutral.json](https://ui.shadcn.com/r/colors/neutral.json)). `secondary`, `muted` and `accent` share one value: they are three roles, not three colors.
- **Radix Colors** gives each of 12 steps a job: 1–2 app and subtle backgrounds, 3–5 component backgrounds at rest, hover and selected, 6–8 borders and focus rings, 9–10 solid fills and their hover, 11–12 low- and high-contrast text ([understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)). Steps 11 and 12 are guaranteed APCA Lc 60 and Lc 90 against step 2. Step 9 is the purest color and is identical in light and dark (`#0090ff`); dark scales are hand-tuned, not inversions ([blue.css](https://unpkg.com/@radix-ui/colors@3.0.0/blue.css), [blue-dark.css](https://unpkg.com/@radix-ui/colors@3.0.0/blue-dark.css)). The custom generator works in OKLCH through colorjs.io and picks step 9's text color with APCA ([generate-radix-colors.tsx](https://raw.githubusercontent.com/radix-ui/website/main/components/generate-radix-colors.tsx)).
- **Tailwind v4** writes every color as `oklch()`, steps 50–950 ([colors](https://tailwindcss.com/docs/colors), [theme.css 4.3.3](https://unpkg.com/tailwindcss@4.3.3/theme.css)). Lightness is tuned per hue (blue-500 is L 62.3%, yellow-500 79.5%); chroma arches to a peak at 600–700 (blue 0.245) and hue drifts about 13° along the blue ramp. The theme file has no P3 rules; high-chroma steps fall outside sRGB and rely on the browser's gamut mapping.

What PLUS takes from these: the foreground-pairing idea (Atlassian's `text.inverse` and `text.warning.inverse` do the same job), Radix's habit of writing down each step's job, and OKLCH as the authoring space. What it does not take: Tailwind's per-hue lightness, which makes step 500 mean a different contrast in every hue.

### 2.4 Claude and Anthropic

- **claude.ai has three color generations in its stylesheet,** read 2026-10-25 from the served CSS in a signed-in browser pane (CSS rules only; plain requests return 403, so there is no public URL to cite):
  - **v1, warm ivory.** Under `[data-theme="claude"]` without a color version: `--bg-100` is `hsl(48 33.3% 97.1%)`, i.e. `#faf9f5`. This is the Claude look the first draft of this doc benchmarked, and it is retired.
  - **v2 base, barely warm.** Under `[data-color-version="v2"]`, role tokens point at a `--cds-gray-*` ramp from 0 to 900 that is close to neutral: `#f9f9f7`, `#e1e0d9`, `#6d6b67`, `#0b0b0b`.
  - **v2 with the `color` flag, pure gray.** `data-cds-fizzy-lake="color"` overrides that ramp with pure grays (`#f9f9f9`, `#e0e0e0`, `#6b6b6b`). This is what Bill's account is served today: a `#fafafa` sidebar on a white page, no borders on content, selection at ink 5%, a near-black `#191919` primary button. One blue accent (`#257de0`) handles interaction, and the clay brand (`#d97757`) appears only in the mark.
  - Whether the flag is rolled out to everyone is **unverified**. Both v2 states are near-neutral, so the direction is the same either way.
  - **Shadows.** v2 shadows are soft and diffuse, for example `--cds-shadow-sm: 0 1px 2px` at 6% plus `0 2px 8px` at 8%, and `--cds-shadow-popover: 0 8px 24px` at 12% plus `0 2px 6px` at 8%. Dark mode starts at `#0b0b0b` and its surfaces get lighter as they rise (`gray-850`, `-830`, `-800`), as Atlassian's do.
- **anthropic.com** serves hex, with no `oklch()` or `hsl()` in its CSS. Grays run `--color-gray-000…1000` in steps of 50 (`050 #faf9f5`, `500 #87867f`, `950 #141413`), and sections switch themes through `--theme-{background|foreground|border}-{primary…quaternary}` ([anthropic.com](https://www.anthropic.com/) served CSS). Anthropic's own brand-guidelines skill lists the same values: dark `#141413`, light `#faf9f5`, orange `#d97757`, blue `#6a9bcc`, green `#788c5d` ([brand-guidelines SKILL.md](https://raw.githubusercontent.com/anthropics/skills/main/skills/brand-guidelines/SKILL.md)). The names "Book Cloth", "Kraft" and "Manilla" are **unverified**: they appear in no served CSS or official source.

### 2.5 Notion

- The API's color enum has ten text colors and nine backgrounds: default, gray, brown, orange, yellow, green, blue, purple, pink and red, with no teal ([rich-text reference](https://developers.notion.com/reference/rich-text)).
- The served app CSS (read on a public notion.site page) has about 740 light-mode custom properties in a compressed grammar, `--c-{hue}{Property}{Rank}`: property is `Tex`, `Ico`, `Bor` or `Bac`, rank is `Pri`, `Sec` or `Ter`, and a `--ca-` prefix marks alpha values, e.g. `--c-bluTexSec`, `--ca-pinBacTerTra`. A numbered `pal*` palette sits underneath, and a teal family exists in the CSS though not in the API. Neutrals are warm: `--c-texPri #2c2c2b`, `--c-texSec #7d7a75`, `--c-borPri #e6e5e3`, `--c-bacSec #f9f8f7`. Colored text (`TexSec`) is the same value in both modes; blue text is `#387dc9`, teal `#2c8b9e`. A blue link renders as `var(--c-bluTexSec)` on the page. Source: [public notion.site page](https://johandahlberg.notion.site/Solid-Text-Color-Formating-fc39346030924c7a8865ec17a9110acd), served CSS. No official post on a 2024–25 Notion color update was found (**unverified**).

**What Claude and Notion teach, read together.** Both use a two-layer system (numbered primitives under role tokens), neither uses OKLCH, and both put a warm, low-chroma gray under a single brand hue. That warmth is the concrete trait behind "the vibe of Notion and Claude", and it is the basis for open decision 2.

### 2.6 OKLCH in the browser

`oklch()` has 95.1% global support: Chrome and Edge 111+, Firefox 113+, Safari 15+ ([caniuse data](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/css-lch-lab.json)). Evil Martians, who moved their work to OKLCH, recommend an explicit sRGB fallback plus P3 values under `@media (color-gamut: p3)` because some browsers clip poorly ([OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)). CSS Color 4 maps out-of-gamut colors by reducing chroma at constant lightness and hue ([css-color-4 § gamut mapping](https://www.w3.org/TR/css-color-4/#gamut-mapping); not re-read in this session).

## 3. PLUS today

**Code.** `design-system/src/tokens/_colors.scss` is generated from a Figma export by `scripts/generate-all-tokens.js`; its header still reads "Material Design 3 Color Tokens… Follows M3 color role guidance". `_color_roles.scss` is hand-maintained and adds the `-icon` and `-border` roles, the focus rings and the surface-role aliases. Together they define **225 color custom properties**. Across `design-system/` and `prototypes/`, **162 distinct color tokens are referenced 3,536 times**, and **75 defined tokens are never referenced**.

| Measure | Count |
|---|---|
| Color custom properties defined (`_colors.scss` + `_color_roles.scss`) | 225 |
| Of those, state-layer overlays (`*-state-08/12/16`) | 117, of which 49 are used |
| Distinct tokens referenced | 162 |
| References in total | 3,536 |
| Most-used | `on-surface` 653 · `on-surface-variant` 627 · `outline-variant` 348 · `primary` 185 |
| SMART category tokens (five families) | 167 references |
| Secondary family | 130 references |
| Tertiary + info | 84 references |

**Figma.** The BS4 Foundation library (`zAecJNRdvJzAUOcjV32tRX`) holds 232 color variables in three collections: `colors / accent` (165, one mode), `colors / neutral` (67, one mode) and `color / patterns` (1, the overlay scrim). Read from `scripts/figma-variables-snapshot.json`, captured 2026-10-25 from the library by Plugin API; the library itself was not touched. There is **no primitives collection**: every role variable holds a raw hex, so a ramp change means editing roles one by one. There is **no dark mode** in either collection. A `Proposal` group holds five unpublished warning and info candidates from #1444.

**Shape.** Today's system is Material 3: each intent (primary, secondary, tertiary, danger, success, warning, info and five SMART subjects) carries a base, `-text`, `on-`, `-container`, `on-…-container`, `-border-subtle` and six translucent state overlays. That gives each intent about thirteen tokens with no ramp behind them, and the overlays account for half the token count.

**What maps cleanly to an Atlassian-style set:**

- The neutral M3 roles: `on-surface` → `color.text`, `on-surface-variant` → `color.text.subtle`, `outline-variant` → `color.border`, `outline` → `color.border.bold`, `scrim` → `color.blanket`.
- The surface roles from #268 (`--surface-default / raised / overlay / sunken`), already named after Atlassian's elevation surfaces.
- The `-icon` and `-border` role split from #368 and #378, and `--color-focus-ring`, which correspond to `color.icon.*`, `color.border.*` and `color.border.focused`.
- Danger, success and warning: base → `background.*.bold` + `border.*` + `icon.*`; `-text` → `text.*`; `-container` → `background.*`.

**What does not map:**

- **Secondary and tertiary.** Atlassian has no secondary or tertiary role, only brand and neutral. Secondary is used mostly as a subdued text color (`--color-secondary-text`, 63 references), which is `color.text.subtle`'s job; tertiary is a second brand hue that a teal primary would absorb.
- **Info aliased to tertiary.** With a teal brand, a teal info would read as brand. Atlassian's information role is blue.
- **Translucent state overlays per color.** Atlassian names opaque `.hovered` and `.pressed` steps per background, and keeps overlays only for grounds that cannot change. PLUS's 08/12/16 ruling survives as `color.interaction.*`, but the 117 per-color overlays do not.
- **The five SMART subject colors** are category colors, which is Atlassian's accent role, with a domain meaning Atlassian has no slot for.
- **Five surface-container steps.** `surface-container-low` through `-highest` have no one-to-one Atlassian match; they collapse into `elevation.surface.container` and `color.background.neutral`.
- **Contrast is not a property of the step.** `_color_roles.scss` measures `--color-primary` at 4.08:1 on `surface-container-highest` and `--color-tertiary` failing 4.5:1 on four of five surfaces. Nothing in today's names tells you which colors carry text.


## 4. Proposal

### 4.1 Primitives and how they are made

The set has three parts:

- **Nine hue families**, each with Atlassian's twelve steps: 100, 200, 250, 300, 400, 500, 600, 700, 800, 850, 900 and 1000.
- **Two neutral ramps**: a light ramp from 0 to 1100, and a dark ramp from 0 to 1100 that adds 250 and 350.
- **Alpha neutrals**: five per theme in light, six in dark.

Family roles:

- **teal (Lagoon)**: brand, selected, focus and link;
- **blue**: information;
- **green**: success;
- **yellow**: warning;
- **red**: danger;
- **purple**: discovery;
- **lime**, **orange** and **magenta**: accents only.

**No third-party tool made these ramps.** A small Python generator does, mirroring Atlassian's own method:

- Atlassian generates custom brand ramps in HCT against a contrast table (§2.2).
- This generator does the same thing in OKLCH, with one table for every family.

**Method.**

1. **Lightness from contrast.** Each step has one WCAG contrast target against white, the same in every family:

   | Step | 100 | 200 | 250 | 300 | 400 | 500 | 600 | 700 | 800 | 850 | 900 | 1000 |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Target | 1.08 | 1.28 | 1.55 | 1.9 | 2.5 | 3.2 | 3.9 | 5.0 | 6.4 | 8.7 | 11.8 | 14.0 |

   OKLCH L is solved per hue to hit the target. The targets sit between Atlassian's two generator tables. What the step numbers guarantee:
   - **500 and darker clear 3:1**, for icons, borders and focus;
   - **700 and darker clear 4.5:1**, for text and for white text on a fill;
   - **850 and darker clear 7:1**.

   Iteration 2 moved 400 from 2.6 to 2.5 and 900 from 11.0 to 11.8, so that `text.accent.*.bolder` on `background.accent.*.subtle` clears 4.5:1 in every family. Before the change, the worst family read 4.23:1.
2. **Chroma on a curve.** Chroma is a share of a per-family cap (§4.2), shaped 14% at 100, 58% at 300, 100% at 500–600, 84% at 800 and 42% at 1000.
3. **Gamut mapping.** Where the target chroma falls outside sRGB at that L and H, chroma is reduced at constant L and H until it fits, the CSS Color 4 approach. Teal is the family this binds most. sRGB cannot show a vivid mid-teal, so Lagoon 700 lands at chroma 0.087.
4. **Constant hue.** Hue is fixed per family. Two exceptions, so pale yellow does not go green-gray:
   - yellow drifts warmer across its lightest steps, from 88° to 94°;
   - orange does the same, from 56° to 64°.
5. **Hex fallback.** Each step ships its OKLCH value as the source and the gamut-mapped hex as the fallback. sRGB only for now.
6. **Neutrals.** Each plan has its own gray ramp, fitted to its benchmark's served CSS (§4.6):
   - the light steps are solved to the contrast of Atlassian's current Neutral ramp, step for step;
   - the dark ramp borrows the lightness profile of Atlassian's DarkNeutral;
   - the alphas are the light ink and the dark paper at fixed opacities (Appendix A).

**How component use shaped the ramps.** Nothing was tuned on swatches alone. Three checks drove the changes:

- **Atlassian's token-to-step mapping.** The semantic layer copies Atlassian's references (text on 800, icon on 600, bold fill on 700, subtler on 200), so each step was tuned for the job that mapping gives it.
- **Contrast of each pair a component draws.** 50 semantic pairs and Atlassian's five accent pairings were checked in both themes and both plans (§4.7, §4.2).
- **A rendered specimen.** The artifact draws the frame, sidebar, cards, buttons, fields, a table, lozenges, tags, section messages, a menu, a tooltip and a modal from the tokens alone, in both plans and both themes.

**Atlassian's skills and MCP.** Atlassian's agent skills (`atlassian-design-system`, `ui-styling-standard`) are restricted to Atlassian employees, so they were not available. Its public MCP server (`https://mcp.atlassian.com/v1/ads/public/mcp`) was queried read-only instead. Its color and elevation guidelines, its lint rules and its full token list are the source for:

- the surface and shadow pairing rules in §4.4;
- the "no `.hovered` token for raised surfaces" and "dark surfaces get lighter as they rise" rules;
- the z-index scale.

**Check of the method.** Run at today's primary hue (240°), the generator reproduces `#0472a8` between its steps 700 (`#1376ab`) and 800 (`#0f6593`).

The full ramps, with hex and contrast for every step, are in Appendix A and in the artifact.

### 4.2 Brand and accents in harmony

**Brand: Lagoon, decided.** The fill is step 700 with white text, as Atlassian's is (`Blue700`). The hue sits about 50° from both success green and information blue, so the three never read as each other.

| | Option A · Lagoon (chosen) | Option B · Teal | Option C · Cerulean teal | Today |
|---|---|---|---|---|
| Hue | 205° | 190° | 222° | 240° (`#0472a8`) |
| subtlest (100) | `#e6f9fc` | `#e7faf9` | `#e9f9ff` | `#61b5cf` container |
| bold (700) | `#147b84` | `#147d78` | `#147995` | `#0472a8` |
| hover / text (800) | `#106972` | `#106b66` | `#10687f` | `#00547e` text |
| White on bold | 5.00:1 | 4.96:1 | 5.00:1 | 5.28:1 |

**Accents.** PLUS keeps all nine of Atlassian's hue families: blue, teal, green, lime, yellow, orange, red, magenta and purple. Gray comes from the neutrals. Out of the box, Atlassian's accents are built around a vivid blue brand, and three problems showed up against Lagoon:

1. **Chroma.** sRGB caps Lagoon at about 0.09 chroma at step 700, while Atlassian's blues and reds run near 0.19–0.21. At equal lightness, any accent with much more chroma than the brand reads louder than the brand.
2. **Uneven spacing.** Hue angles alone hide uneven perceptual distance. Measured in OKLab at step 700, some neighbors nearly touched while others sat far apart.
3. **Drift in the pale steps.** Pale yellow and orange go green-gray if their hue is held constant.

The fixes, one per problem:

| Family | Role | Hue | Chroma cap | 700 | White on 700 |
|---|---|---|---|---|---|
| teal | brand | 205° | 0.15 (sRGB binds at 0.087) | `#147b84` | 5.00 |
| blue | information | 258° | 0.13 | `#406fb6` | 5.00 |
| green | success | 158° | 0.13 | `#148051` | 5.00 |
| lime | accent | 122° | 0.13 | `#627713` | 5.00 |
| yellow | warning | 88°, 94° at the pale end | 0.14 | `#8a6b11` | 5.00 |
| orange | accent | 56°, 64° at the pale end | 0.14 | `#a95b12` | 5.00 |
| red | danger | 25° | 0.15 | `#b84d48` | 5.00 |
| magenta | accent | 350° | 0.14 | `#ab507f` | 5.00 |
| purple | discovery | 300° | 0.13 | `#7f60af` | 5.00 |

- **Caps lowered from 0.15–0.17 to 0.13–0.15.** No accent's 700 carries more than 0.141 chroma. That keeps the palette in the pastel register Bill asked for and leaves Lagoon the most saturated thing a user sees only where it is a fill.
- **Hues re-spaced for even distance.** Tuned at step 700, the closest neighbors moved from 0.061 to 0.067 apart in OKLab, and the widest gap closed from 0.142 to 0.106. Blue moved from 255° to 258°, green from 155° to 158°, lime from 128° to 122°, yellow from 86° to 88°, orange from 50° to 56°, red from 27° to 25° and purple from 292° to 300°; magenta stayed at 350°. The tuner is `tune.py`.
- **Equal lightness per step.** Every family's 700 is 5.00:1 on white, so a red tag and a teal tag sit at the same visual weight and only hue differs.

One tradeoff remains. Information blue at 700 carries 0.122 chroma against Lagoon's 0.087, so an info section message reads slightly more vivid than a brand tint. It is acceptable because information is rare and never a primary action; open decision 8 offers a lower cap.

**Accent contrast.** Atlassian's accent pairings, for every family, as light / dark ratios. Text needs 4.5:1 and icons 3:1. All pass.

| Family | text (800) on subtlest | text (800) on subtler | bolder (900) on subtle | inverse on bolder | icon (600) on surface |
|---|---|---|---|---|---|
| teal | 5.88 / 7.26 | 4.99 / 6.18 | 4.76 / 4.99 | 5.00 / 6.72 | 3.86 / 5.18 |
| blue | 5.90 / 7.39 | 4.97 / 6.27 | 4.74 / 4.97 | 5.04 / 6.63 | 3.92 / 5.21 |
| green | 5.97 / 7.37 | 5.04 / 6.14 | 4.68 / 5.04 | 4.96 / 6.66 | 3.90 / 5.18 |
| lime | 5.93 / 7.33 | 5.01 / 6.12 | 4.67 / 5.01 | 5.04 / 6.65 | 3.91 / 5.19 |
| yellow | 5.87 / 7.37 | 4.96 / 6.15 | 4.68 / 4.96 | 5.01 / 6.66 | 3.88 / 5.20 |
| orange | 5.90 / 7.34 | 4.96 / 6.18 | 4.73 / 4.96 | 5.01 / 6.67 | 3.91 / 5.20 |
| red | 5.94 / 7.32 | 5.02 / 6.20 | 4.73 / 5.02 | 5.01 / 6.64 | 3.90 / 5.20 |
| magenta | 5.95 / 7.40 | 5.01 / 6.22 | 4.71 / 5.01 | 5.02 / 6.63 | 3.90 / 5.20 |
| purple | 5.95 / 7.37 | 5.04 / 6.18 | 4.71 / 5.04 | 5.01 / 6.65 | 3.90 / 5.17 |

### 4.3 Semantic layer

The semantic layer copies Atlassian's token list and its step references, and swaps Atlassian's families for PLUS's:

- Blue becomes teal wherever it means brand, selected, focused or link, and stays blue where it means information.
- Orange (warning) becomes yellow, because PLUS's ruling keeps warning yellow.
- Lime (success) becomes green.
- Red and Purple stay.

**Totals:** 157 color and surface tokens, 17 accent tokens per family, five shadow tokens and two opacity tokens. Chart and code-block tokens are left out until a chart or code surface needs them.

**Where PLUS deliberately differs from Atlassian:**

| Token | Atlassian | PLUS | Why |
|---|---|---|---|
| warning family | Orange (yellow light steps, orange dark steps) | Yellow throughout | PLUS warning is yellow by ruling. |
| success family | Lime | Green (158°) | Keeps lime free as an accent; reads more clearly as success. |
| link | Blue (= brand) | Teal (= brand) | Link follows brand. |
| `color.border.focused` | Blue 500 | teal.600 (3.86:1) | Iteration 2 refinement. Lagoon 500 cleared 3:1 by only 0.2, too thin for the one ring keyboard users rely on. |
| `color.border.focused.inverse` | none | New | A focus ring on bold fills and inverse surfaces. |
| `color.interaction.hovered` / `.pressed` | black at 16% / 32% | ink at 8% / 12% | PLUS's state-layer ruling (08/12/16). |
| `color.interaction.dragged` | none | New, 16% | Completes the 08/12/16 ruling. |
| `color.blanket` | Neutral500A, about 46% | ink at 32% | Lighter, in the pastel register; open to tuning on the specimen. |
| Selection | Blue tint | Neutral ink | Both benchmarks select in neutral, as does Atlassian's FY27 Finesse override (§4.6). |

The full list, with each token's use and its light and dark values in both plans, is in Appendix B. The artifact shows every token as a swatch in both themes.

**How to read the roles, in short.**

- **Text.** `color.text` (neutral.1000) is body text and buttons; `.subtle` (800) is secondary text, labels and navigation; `.subtlest` (700) is metadata, placeholders and helper text. There is no secondary color, only three emphasis levels of one neutral.
- **Neutral backgrounds.** `color.background.neutral.subtle` is transparent at rest and is what menu items and subtle buttons use. `color.background.neutral` is the default button fill.
- **Brand and selected.** `color.background.brand.bold` is the primary action. `color.background.selected.bold` is a checked checkbox or a selected radio, and Atlassian says not to use it for primary actions.
- **Semantic roles.** Danger, warning, success, information and discovery each have four emphasis levels:
  - `[default]`, a tint for section messages;
  - `subtler`, for lozenges and badges;
  - `subtle`, for non-interactive chips;
  - `bold`, the filled version, with `color.text.inverse` on it.

  Warning's bold is a light yellow with `color.text.warning.inverse`, as Atlassian's is and as PLUS's ruling already requires.
- **Borders.** `border.*.subtle` is decorative and exempt from 3:1. Every other border clears it.

### 4.4 Elevation, in Atlassian's words

Atlassian treats elevation as **paired tokens**: a surface color and its shadow always travel together. This replaces PLUS's `--elevation-light-1…5` scale, which named shadow strengths, not layers.

**The levels**, lowest to highest:

| Level | Surface token | Shadow token | What sits there |
|---|---|---|---|
| Sunken | `elevation.surface.sunken` | none | A backdrop or recessed area that content sits in front of. |
| Default | `elevation.surface` | none | The page itself and flat content on it. |
| Raised | `elevation.surface.raised` | `elevation.shadow.raised` | Cards that can be clicked or moved. |
| Overlay | `elevation.surface.overlay` | `elevation.shadow.overlay` | Anything over the UI: menus, popovers, tooltips, flags, modals, dragged items. |
| Overflow | none | `elevation.shadow.overflow` | Where content scrolls under other content, such as a sticky table column. |

**Atlassian's rules, adopted as-is:**

1. **Always pair.** `surface.raised` goes with `shadow.raised`, and `surface.overlay` with `shadow.overlay`. A shadow on a default surface, or a raised surface without its shadow, breaks the dark theme.
2. **Dark surfaces get lighter as they rise.** In dark, raised and overlay are lighter grays rather than relying on a shadow you cannot see on black.
3. **Raised and overlay have no `.hovered` token.** A hovered card changes its shadow (raised to overlay), not its fill.
4. **Wells use `elevation.surface.container`**, a translucent fill, so a recessed strip inside a card works on any surface beneath it.
5. **Z-index follows Atlassian's scale**: card 100, navigation 200, dialog 300, layer 400, blanket 500, modal 510, flag 600, spotlight 700, tooltip 800. `_layout.scss` already uses it.

**Shadows, Plan A (crisp, Atlassian's geometry with a warm ink):**

| Token | For | Light | Dark |
|---|---|---|---|
| `elevation.shadow.raised` | Box shadow of a raised card: a clickable card while hovered, or a movable card. Pair with elevation.surface.raised. *PLUS ruling: cards rest flat on a border; only clickable cards lift, on hover. Replaces elevation-light-2.* | `0px 1px 1px #1f1e1e40, 0px 0px 1px #1f1e1e4f` | `0px 0px 0px 1px #00000000, 0px 1px 1px #0a090880, 0px 0px 1px #0a090880` |
| `elevation.shadow.overlay` | Box shadow of anything that sits over the UI: menus, popovers, tooltips, flags, modals, dragged items. Pair with elevation.surface.overlay. *Replaces elevation-light-3, -4 and -5 (open decision: modals join overlay).* | `0px 8px 12px #1f1e1e26, 0px 0px 1px #1f1e1e4f` | `0px 0px 0px 1px #e4e3e21f, 0px 8px 12px #0a09085c, 0px 0px 1px 1px #0a090880` |
| `elevation.shadow.overflow` | Shadow where content scrolls under other content, such as a table's sticky column. | `0px 0px 8px #1f1e1e29, 0px 0px 1px #1f1e1e1f` | `0px 0px 12px #0a09088f, 0px 0px 1px #0a090880` |
| `elevation.shadow.overflow.spread` | Fallback for overflow when a box shadow is not feasible; pair with .perimeter. | `#1f1e1e29` | `#0a09088f` |
| `elevation.shadow.overflow.perimeter` | Fallback for overflow when a box shadow is not feasible; pair with .spread. | `#1f1e1e1f` | `#0a090880` |
| `opacity.disabled` | Images and whole elements in a disabled state. *Today --color-disabled-opacity is 0.38 (M3); 0.4 is Atlassian's.* | `0.4` | `0.4` |
| `opacity.loading` | Content under a loading spinner. *New.* | `0.2` | `0.2` |

**Shadows, Plan B (soft, claude.ai's geometry):**

| Token | For | Light | Dark |
|---|---|---|---|
| `elevation.shadow.raised` | Box shadow of a raised card: a clickable card while hovered, or a movable card. Pair with elevation.surface.raised. *Plan B: claude.ai --cds-shadow-sm geometry; cards have no border, so the soft shadow is their edge.* | `0px 1px 2px #1e1e1e0f, 0px 2px 8px #1e1e1e14` | `0px 0px 0px 1px #00000000, 0px 1px 1px #0a090880, 0px 0px 1px #0a090880` |
| `elevation.shadow.overlay` | Box shadow of anything that sits over the UI: menus, popovers, tooltips, flags, modals, dragged items. Pair with elevation.surface.overlay. *Plan B: claude.ai --cds-shadow-popover geometry.* | `0px 8px 24px #1e1e1e1f, 0px 2px 6px #1e1e1e14` | `0px 0px 0px 1px #e3e3e31f, 0px 8px 12px #0a09085c, 0px 0px 1px 1px #0a090880` |
| `elevation.shadow.overflow` | Shadow where content scrolls under other content, such as a table's sticky column. | `0px 0px 8px #1e1e1e29, 0px 0px 1px #1e1e1e1f` | `0px 0px 12px #0a09088f, 0px 0px 1px #0a090880` |
| `elevation.shadow.overflow.spread` | Fallback for overflow when a box shadow is not feasible; pair with .perimeter. | `#1e1e1e29` | `#0a09088f` |
| `elevation.shadow.overflow.perimeter` | Fallback for overflow when a box shadow is not feasible; pair with .spread. | `#1e1e1e1f` | `#0a090880` |
| `opacity.disabled` | Images and whole elements in a disabled state. *Today --color-disabled-opacity is 0.38 (M3); 0.4 is Atlassian's.* | `0.4` | `0.4` |
| `opacity.loading` | Content under a loading spinner. *New.* | `0.2` | `0.2` |

In dark mode, shadows use a near-black base (`#0a0908`). The overlay shadow adds a faint paper rim, because a drop shadow alone disappears on a dark page.

### 4.5 Elevation mapped to PLUS's patterns

PLUS has already defined its UI patterns:

- **The frame chain:** the Surface container (topbar and docked sidebar), then the Surface (the inner box), then Section, then Card, Table and Tree, and Tile.
- **The layers:** Popover (menu, popup and flag, tooltip), Overlay (the scrim), Modal, and the sidebar peek.

Atlassian went through the same exercise when it moved its products onto elevation tokens: each pattern gets exactly one level, so nobody chooses a shadow by eye. The table assigns PLUS's patterns, in both plans.

| Pattern | What it is | Plan A · Paper | Plan B · Neutral |
|---|---|---|---|
| Surface container (the frame: topbar + docked sidebar) | The backdrop the work sits in. | elevation.surface.sunken (neutral.100 #f9f8f7, Notion's sidebar gray) | elevation.surface.sunken (neutral.100, near claude.ai's #fafafa sidebar) |
| Topbar | Part of the frame. | Frame fill, no border | Frame fill, no border |
| Sidebar item: hovered / selected | Navigation state. | background.neutral.subtle.hovered / background.selected (ink at 6%) + text.selected (ink) | Same tokens; neutral selection, as claude.ai (ink at 5%) |
| Sidebar peek (below 1024, floating, no scrim) | A layer over the page. | elevation.surface.overlay + elevation.shadow.overlay | elevation.surface.overlay + elevation.shadow.overlay (soft) |
| Surface (the inner box) | Where the work happens; radius --surface-radius. | elevation.surface (white) + color.border hairline | elevation.surface (white), no border: the frame-to-surface step reads by tone alone |
| Section | Groups content inside the surface. | No fill; color.border divider when needed | No fill; spacing first, color.border divider only in dense lists |
| Card, at rest | A flat container (ruling 2026-10-24). | elevation.surface (white) + color.border | elevation.surface.raised (white) + elevation.shadow.raised (soft, no border) |
| Card, clickable: hovered / dragged | Lift on interaction only. | elevation.surface.raised + elevation.shadow.raised / overlay pair | elevation.shadow.overlay on hover (Atlassian allows raised-to-overlay transitions) / overlay pair |
| Well inside a card (code block, summary strip) | Recessed area. | elevation.surface.container (ink at 3%) | elevation.surface.container (ink at 3%) |
| Table and Tree | Rows on the surface. | Head: color.border.bold rule; row hovered: background.neutral.subtle.hovered; row selected: background.selected; sticky column: elevation.shadow.overflow | Same tokens; row rules use color.border (lighter) rather than .bold |
| Tile | A small selectable card. | background.neutral.subtle, hovered; selected: background.selected + border.selected | Same tokens |
| Popover: Menu, Popup and flag | Floating layers without a scrim. | elevation.surface.overlay + elevation.shadow.overlay | elevation.surface.overlay + elevation.shadow.overlay (soft) |
| Popover: Tooltip | A label over anything. | background.neutral.bold + text.inverse | background.neutral.bold + text.inverse |
| Overlay (scrim) | Dims the page under a modal. | color.blanket | color.blanket |
| Modal | A layer over the scrim. | elevation.surface.overlay + elevation.shadow.overlay | elevation.surface.overlay + elevation.shadow.overlay |
| Element: input | Form fields. | background.input (white) + border.input; focus: border.focused ring | Same tokens |

**Two consequences for existing rulings:**

- **Cards.** "Cards are flat at rest" survives in Plan A literally: a white card with a hairline border. Plan B keeps it in spirit: no border, and a soft shadow so faint it reads as an edge rather than a lift.
- **Modals.** "Floating layers use light-3, modals use light-4" collapses into a single `overlay` level, as in Atlassian. The blanket under a modal already sets it apart from a menu. This reverses a ruling, so it is open decision 3.

**Name clash to settle.** PLUS calls the frame the "Surface container"; Atlassian's `elevation.surface.container` is a translucent well *inside* a card. Same words, opposite ends of the stack. Open decision 6.

### 4.6 Plan A and Plan B

Notion and Claude are both calm, low-chroma and monochrome around a single accent, but they draw structure differently. Notion uses warm grays and hairline borders. Claude, as served today, uses pure grays and no borders: tone and soft shadow do the work. The two plans make that choice explicit. Both use Lagoon, the same nine accents, the same token names and the same contrast guarantees.

**Which Claude.** The first draft of Plan B (Ivory) was fitted to Claude's warm ivory theme, and that theme is v1, now retired (§2.4). claude.ai as served to Bill on 2026-10-25 is v2 with its `color` flag, and its gray ramp is achromatic:

- the sidebar is `#fafafa` and the main surface is white;
- the grays include `#e0e0e0`, `#6b6b6b` and `#0b0b0b`;
- content has no borders;
- a selected item is ink at 5%;
- the primary button is near-black `#191919`, with the clay orange only in the logo;
- interactive accents use one blue (`#257de0`).

Plan B is rebuilt on that.

| | Plan A · Paper (toward Notion) | Plan B · Neutral (toward Claude, 2026) |
|---|---|---|
| Neutral hue and chroma | 85°, chroma 0.008 at most: a barely warm gray | chroma 0: pure gray |
| Fit to benchmark | neutral.100 `#f9f8f7` is Notion's sidebar gray, to the hex | neutral.100 `#f8f8f8`, against claude.ai's `#fafafa` sidebar and `#f9f9f9` surface-0 |
| Frame (Surface container) | sunken neutral.100 | sunken neutral.100 |
| Surface (inner box) | white, hairline border | white, no border; the frame-to-surface step is tone alone |
| Cards at rest | white, flat, bordered | white, no border, soft shadow as the edge |
| Shadows | crisp, short (Atlassian geometry) | soft, diffuse (claude.ai's `--cds-shadow-sm` and `--cds-shadow-popover` geometry) |
| Selection | neutral: ink at 6%, ink text | neutral: the same tokens |
| Brand presence | Lagoon on actions, links and focus | the same |
| Risk | borders add visual noise in dense tables | cards and sections lean on spacing and shadow; harder to keep consistent across hand-built prototypes |

Both plans now select in neutral, because both benchmarks do (Notion, and Claude at ink 5%), as does Atlassian's FY27 Finesse override. Teal selection stays possible in either plan as a variant (open decision 2).

**Neutral ramps, light** (0 to 1100):

- Plan A: `#ffffff #f9f8f7 #f3f1ef #e0dedc #bab8b5 #928f8a #827f7b #706d69 #555350 #3f3d3b #2c2b2a #1f1e1e`
- Plan B: `#ffffff #f8f8f8 #f1f1f1 #dedede #b8b8b8 #8f8f8f #7f7f7f #6d6d6d #535353 #3d3d3d #2b2b2b #1e1e1e`

Dark ramps, OKLCH values and alphas for both plans are in Appendix A.

**Contrast.** The two plans share step contrast, so their thinnest margins are the same:

- `color.text.brand` on `color.background.brand.subtlest`: 4.60:1;
- `color.border.input` on white: 3.22–3.23:1;
- `color.text.subtlest` on the sunken frame: 4.85–4.87:1.

The thin margins of the old Ivory plan (3.02:1 on ivory) are gone.

**Recommendation: still Plan A, but closer than before.** The plans now differ in two axes only: warm or pure gray, and borders or shadows.

- **For Plan A.** PLUS's patterns already lean on borders and flat cards, and tutor dashboards are dense tables where hairlines carry structure.
- **For Plan B.** It is the cleaner, more current look. It fits the "monochromatic tone for AI" Bill described for both benchmarks. Lagoon stands out more against pure gray.

A hybrid is cheap to try: Plan A's warm gray and borders in tables and forms, with Plan B's soft shadows on cards and overlays. The artifact shows both plans on the same screen.


### 4.7 Contrast of the key pairs

WCAG 2 ratios on opaque values, computed from the generated hex. Alpha tokens are composited over their surface first. Text needs 4.5:1; icons and borders need 3:1. Every pair clears its bar in both themes and both plans.

| Foreground | Background | Bar | A light | A dark | B light | B dark |
|---|---|---|---|---|---|---|
| `color.text.subtlest` | `elevation.surface.raised` | 4.5 | 5.15 | 5.45 | 5.17 | 5.45 |
| `color.text.subtle` | `elevation.surface.sunken` | 4.5 | 7.23 | 7.81 | 7.24 | 7.81 |
| `color.text` | `elevation.surface.sunken` | 4.5 | 13.32 | 11.51 | 13.33 | 11.51 |
| `color.border.input` | `color.background.input` | 3 | 3.22 | 4.03 | 3.23 | 4.04 |
| `color.text` | `elevation.surface` | 4.5 | 14.13 | 10.72 | 14.16 | 10.70 |
| `color.text.subtle` | `elevation.surface` | 4.5 | 7.67 | 7.28 | 7.69 | 7.26 |
| `color.text.subtlest` | `elevation.surface` | 4.5 | 5.15 | 5.87 | 5.17 | 5.85 |
| `color.text.subtlest` | `elevation.surface.sunken` | 4.5 | 4.85 | 6.29 | 4.87 | 6.29 |
| `color.text` | `elevation.surface.overlay` | 4.5 | 14.13 | 9.08 | 14.16 | 9.09 |
| `color.text.brand` | `elevation.surface` | 4.5 | 5.00 | 6.72 | 5.00 | 6.72 |
| `color.link` | `elevation.surface` | 4.5 | 5.00 | 6.72 | 5.00 | 6.72 |
| `color.text.inverse` | `color.background.brand.bold` | 4.5 | 5.00 | 6.72 | 5.00 | 6.72 |
| `color.text.inverse` | `color.background.selected.bold` | 4.5 | 14.13 | 10.72 | 14.16 | 10.70 |
| `color.text.inverse` | `color.background.danger.bold` | 4.5 | 5.01 | 6.65 | 5.01 | 6.65 |
| `color.text.inverse` | `color.background.success.bold` | 4.5 | 4.96 | 6.66 | 4.96 | 6.66 |
| `color.text.inverse` | `color.background.information.bold` | 4.5 | 5.04 | 6.64 | 5.04 | 6.63 |
| `color.text.inverse` | `color.background.discovery.bold` | 4.5 | 5.01 | 6.65 | 5.01 | 6.65 |
| `color.text.inverse` | `color.background.neutral.bold` | 4.5 | 14.13 | 10.72 | 14.16 | 10.70 |
| `color.text.warning.inverse` | `color.background.warning.bold` | 4.5 | 7.41 | 8.75 | 7.42 | 8.74 |
| `color.text.selected` | `color.background.selected` | 4.5 | 12.62 | 8.83 | 12.65 | 8.84 |
| `color.text.brand` | `color.background.brand.subtlest` | 4.5 | 4.60 | 5.59 | 4.60 | 5.59 |
| `color.text.danger` | `color.background.danger` | 4.5 | 5.94 | 7.32 | 5.94 | 7.32 |
| `color.text.warning` | `color.background.warning` | 4.5 | 5.87 | 7.37 | 5.87 | 7.37 |
| `color.text.success` | `color.background.success` | 4.5 | 5.97 | 7.37 | 5.97 | 7.37 |
| `color.text.information` | `color.background.information` | 4.5 | 5.90 | 7.39 | 5.90 | 7.39 |
| `color.text.discovery` | `color.background.discovery` | 4.5 | 5.95 | 7.37 | 5.95 | 7.37 |
| `color.text.danger.bolder` | `color.background.danger.subtler` | 4.5 | 9.29 | 9.29 | 9.29 | 9.29 |
| `color.text.warning.bolder` | `color.background.warning.subtler` | 4.5 | 9.16 | 9.16 | 9.16 | 9.16 |
| `color.text.success.bolder` | `color.background.success.subtler` | 4.5 | 9.14 | 9.14 | 9.14 | 9.14 |
| `color.text.information.bolder` | `color.background.information.subtler` | 4.5 | 9.25 | 9.25 | 9.25 | 9.25 |
| `color.text.danger` | `elevation.surface` | 4.5 | 6.41 | 8.72 | 6.41 | 8.72 |
| `color.text.warning` | `elevation.surface` | 4.5 | 6.35 | 8.75 | 6.35 | 8.74 |
| `color.text.success` | `elevation.surface` | 4.5 | 6.46 | 8.74 | 6.46 | 8.74 |
| `color.text.information` | `elevation.surface` | 4.5 | 6.40 | 8.77 | 6.40 | 8.77 |
| `color.icon` | `elevation.surface` | 3 | 14.13 | 10.72 | 14.16 | 10.70 |
| `color.icon.subtle` | `elevation.surface` | 3 | 7.67 | 7.28 | 7.69 | 7.26 |
| `color.icon.brand` | `elevation.surface` | 3 | 5.00 | 6.72 | 5.00 | 6.72 |
| `color.icon.danger` | `elevation.surface` | 3 | 5.01 | 5.21 | 5.01 | 5.21 |
| `color.icon.warning` | `elevation.surface` | 3 | 3.88 | 8.75 | 3.88 | 8.74 |
| `color.icon.success` | `elevation.surface` | 3 | 3.90 | 5.18 | 3.90 | 5.18 |
| `color.icon.information` | `elevation.surface` | 3 | 3.92 | 5.21 | 3.92 | 5.21 |
| `color.icon.discovery` | `elevation.surface` | 3 | 3.90 | 5.17 | 3.90 | 5.17 |
| `color.border.input` | `elevation.surface` | 3 | 3.22 | 4.34 | 3.23 | 4.34 |
| `color.border.bold` | `elevation.surface` | 3 | 3.98 | 4.34 | 4.00 | 4.34 |
| `color.border.focused` | `elevation.surface` | 3 | 3.86 | 8.73 | 3.86 | 8.73 |
| `color.border.danger` | `elevation.surface` | 3 | 3.90 | 5.21 | 3.90 | 5.21 |
| `color.border.warning` | `elevation.surface` | 3 | 3.88 | 5.21 | 3.88 | 5.20 |
| `color.border.success` | `elevation.surface` | 3 | 3.90 | 5.18 | 3.90 | 5.18 |
| `color.border.brand` | `elevation.surface` | 3 | 5.00 | 6.72 | 5.00 | 6.72 |
| `color.border.selected` | `elevation.surface` | 3 | 14.13 | 10.72 | 14.16 | 10.70 |

Today's equivalents fail: `--color-primary` is 4.08:1 on `surface-container-highest`, and `--color-tertiary` (info) fails 4.5:1 on four of five surfaces.

### 4.8 Naming convention

**Primitives:** `color.palette.{family}{step}` in the token source, emitted as `--palette-{family}-{step}`. Families are lower-case words (`teal`, `neutral`, `darkNeutral`); alpha neutrals take an `A` suffix (`neutral300A`). Examples: `color.palette.teal700` → `--palette-teal-700`; `color.palette.neutral300A` → `--palette-neutral-300a`. Primitives are for the token source and the docs; components never reference them.

**Semantics:** `color.{property}.{role}.{emphasis}.{state}`, every segment after the property optional, emitted as `--ds-` plus the path without `color.`, as Atlassian does.

| Segment | Values | Rule |
|---|---|---|
| property | `text`, `icon`, `border`, `background`, `link`, `interaction`, `blanket`, `skeleton`; `elevation.surface`, `elevation.shadow`; `opacity` | What the color paints. Required. |
| role | `brand`, `neutral`, `selected`, `input`, `inverse`, `disabled`, `focused`, `danger`, `warning`, `success`, `information`, `discovery`, `accent.{family}` | What it means. Omitted for the default neutral. |
| emphasis | `subtlest`, `subtler`, `subtle`, (default), `bold`, `bolder`, `boldest` | How much contrast against the surface. Only the levels the table defines exist. |
| state | `hovered`, `pressed`, `visited` (links) | Interactive backgrounds and links only. |

| Token | CSS variable | Reads as |
|---|---|---|
| `color.text` | `--ds-text` | default text |
| `color.text.subtle` | `--ds-text-subtle` | secondary text |
| `color.background.brand.bold.hovered` | `--ds-background-brand-bold-hovered` | primary button, hovered |
| `color.border.danger` | `--ds-border-danger` | invalid field edge |
| `color.background.accent.purple.subtler` | `--ds-background-accent-purple-subtler` | mastering-content tag |
| `elevation.surface.raised` | `--ds-surface-raised` | a draggable card |

**Rules that keep the names honest.**

1. Name by meaning, never by value. Atlassian: "Don't use a token just because the colors appear to match" ([design-tokens](https://atlassian.design/foundations/tokens/design-tokens)).
2. One token per property. A danger fill, its edge and its icon are three tokens even when they share a value, which is the lesson of #368 already.
3. No `on-` prefix and no `container` suffix. A pairing is `text.inverse` on any `*.bold`, or the role's `text.*.bolder` on its `subtler`.
4. No secondary or tertiary roles. A second emphasis is `subtle`; a second hue is an accent.
5. American spelling throughout: color, gray.

6. **Elevation pairs.** A surface token and its shadow are named for the same level (`elevation.surface.raised` with `elevation.shadow.raised`) and are never mixed across levels.
7. **Opacity is its own property.** `opacity.disabled` and `opacity.loading` dim whole elements; they are not colors.

### 4.9 Migration map

Reference counts are from `design-system/` and `prototypes/` today. The new names do not collide with any existing `--color-*` variable, so old and new can coexist during the component sweep.

| Today | Refs | Proposed | Note |
|---|---|---|---|
| `--color-primary` | 185 | `color.background.brand.bold · color.border.brand · color.link` | One M3 role splits three ways by property. Fill, edge and link can then move apart. |
| `--color-primary-text` | 44 | `color.text.brand` |  |
| `--color-on-primary` | 29 | `color.text.inverse · color.icon.inverse` | Shared by every bold fill, not per intent. |
| `--color-primary-container` | 26 | `color.background.brand.subtlest` | Today #61b5cf fails 4.5:1 under its own on-color pairing in places; subtlest is teal.100. |
| `--color-on-primary-container` | 19 | `color.text (or color.text.brand)` |  |
| `--color-inverse-primary` | 5 | `color.border.focused (dark theme value) · Field hover exception: decide` | Today the Field hover border is a documented exception on inverse-primary. |
| `--color-primary-state-08 / 12 / 16` | 33 | `color.background.selected · .hovered · .pressed` | Translucent overlays become opaque steps. Dense-list 08 and nav 16 rule needs restating (open decision 6). |
| `--color-secondary · -text · -container` | 38 | `color.text.subtle · color.background.neutral · color.background.neutral.bold` | Atlassian has no secondary role. 130 references today, mostly secondary-text used as subdued text. |
| `--color-tertiary family` | 20 | `color.*.accent.teal (or .green)` | Tertiary stops being a role. With a teal brand it would collide anyway. |
| `--color-info family (aliases tertiary)` | 10 | `color.*.information (blue)` | Info moves to blue, the Atlassian convention, so it stops reading as brand. |
| `--color-danger` | 80 | `color.background.danger.bold · color.border.danger · color.icon.danger` |  |
| `--color-danger-text` | 24 | `color.text.danger` |  |
| `--color-danger-container / on-danger-container` | 5 | `color.background.danger / color.text.danger.bolder (on .subtler)` |  |
| `--color-danger-border-subtle` | 1 | `color.border.danger.subtle` | Decorative; exempt from 3:1, as Atlassian documents. |
| `--color-success family` | 48 | `color.*.success (green)` | Same split as danger. |
| `--color-warning (#9f8205) / on-warning` | 18 | `color.background.warning.bold + color.text.warning.inverse` | Keeps the ruling: a yellow fill with dark ink. New fill is yellow.300. |
| `--color-warning-text` | 15 | `color.text.warning (yellow.800)` |  |
| `--color-warning-border / -icon (#715c00)` | 7 | `color.border.warning · color.icon.warning` | yellow.600 measures 3.9:1 on white (bar 3:1). If Bill wants to keep the darker #715c00 look, use yellow.800. |
| `SMART: mastering-content · relationship · technology-tools · advocacy · social-emotional` |  | `color.*.accent.purple · .magenta · .blue · .green · .orange` | Category colors become accents. An optional product alias (color.smart.*) is open decision 5. |
| `--color-surface (#f9f9fc)` | 96 | `elevation.surface.sunken` | Matches today's --surface-sunken alias. |
| `--color-surface-container-lowest (#fff)` | 88 | `elevation.surface · .raised · .overlay` | Matches today's surface roles. |
| `--color-surface-container-low … -highest` | 92 | `elevation.surface.container · .hovered · color.background.neutral` | Five gray steps collapse to translucent container fills. Ruling stands: gray is for recessed areas. |
| `--color-surface-variant · -dim · -bright` | 41 | `color.background.neutral · (drop) · elevation.surface` |  |
| `--color-on-surface` | 653 | `color.text · color.icon` | 653 references, the most-used color token. |
| `--color-on-surface-variant` | 627 | `color.text.subtle · color.icon.subtle` | 627 references. |
| `--color-outline` | 51 | `color.border.bold · color.border.input` |  |
| `--color-outline-variant` | 348 | `color.border` | 348 references. |
| `--color-scrim` | 3 | `color.blanket` |  |
| `--color-disabled-opacity` | 22 | `opacity.disabled + color.text.disabled · color.background.disabled` |  |
| `--color-inverse-surface / inverse-on-surface` | 11 | `color.background.neutral.bold / color.text.inverse` |  |
| `--color-on-surface-state-08 / 12 / 16` | 50 | `color.interaction.hovered · .pressed · .dragged` | Keeps the 08/12/16 ruling. |
| `other *-state-* (117 defined, 49 used)` |  | `drop: hovered and pressed become named steps` | Atlassian names .hovered/.pressed per background instead of a generic overlay per color. |
| `--color-focus-ring / -inverse` | 42 | `color.border.focused / color.border.focused.inverse` | Inverse is a PLUS addition. |
| `--surface-default / raised / overlay / sunken` |  | `elevation.surface / .raised / .overlay / .sunken` | Already Atlassian-shaped (#268). |
| `--elevation-light-1 · -2 (22 refs)` |  | `elevation.shadow.raised` | Hovered clickable cards, movable cards. Pair with elevation.surface.raised. |
| `--elevation-light-3 · -4 · -5 (12 refs)` |  | `elevation.shadow.overlay` | Menus, popovers, tooltips, flags, modals, dragged items. Pair with elevation.surface.overlay. The modal light-4 ruling collapses into overlay (open decision). |
| `~15 hard-coded box-shadow literals` |  | `elevation.shadow.raised · .overlay · .overflow` | Swept with the components. |
| `--color-disabled-opacity (0.38)` | 22 | `opacity.disabled (0.4)` | Atlassian value. |

### 4.10 Color modes and the Figma setup

**Modes.** Atlassian ships two color modes, light and dark. Increased contrast is not a third mode but a second axis: `light-increased-contrast` and `dark-increased-contrast` extend their base theme and override about half its variables (§2.2). PLUS should mirror that shape:

- define **Light** and **Dark** now, as two modes of one Semantic collection;
- leave **increased contrast** as a later override layer on text, icons, borders and bold fills.

The generator makes that cheap. Increased contrast is the same token map pointed one or two steps darker (light) or lighter (dark), so no new primitives are needed.

**Atlassian's public Figma libraries.** Atlassian publishes three current community files:

- [ADS Foundations](https://www.figma.com/community/file/1527530559648073327/ads-foundations), with the semantic color, typography and spacing tokens and styles;
- [ADS Components](https://www.figma.com/community/file/1527532229258392178/ads-components);
- [ADS Iconography](https://www.figma.com/community/file/1592321163746398016/ads-iconography).

All three are CC BY 4.0, and each replaces a "(Legacy)" file.

**How ADS Foundations is built.** Read 2026-10-25, read-only, from Bill's duplicate of the community file. It is not a palette file: it holds the semantic layer and aliases into a separate primitives library that the community copy does not include. Seven variable collections:

| Collection | Modes | Count | Holds |
|---|---|---|---|
| 🌮 Color | Light, Dark | 601 color | `color/text…`, `color/icon…`, `color/border…`, `color/background…` (196), `color/chart…` (100), `color/link`, `color/blanket`, `color/interaction`, `color/skeleton`, `elevation/surface…` (10), `elevation/shadow…` (10); plus 190 under `color/⛔️ DST team only/…` for logos and lozenge internals |
| 🌮 Typography | Default (Atlassian fonts), Legacy (system fonts) | 4 strings | font family per role: Heading, Body, Code, Metric |
| 🌮 Typography text styles | one | 42 numbers | font size, line height, weight and paragraph spacing per style |
| 🌮 Spacing | one | 14 | `space/0` … `space/1000`, scoped to gap |
| 🌮 Radius | one | 19 | xs to xxl, full round, a matching **focus** radius per size, and tile radii per tile size; each has a usage description |
| 🌮 Border | one | 3 | border widths: default, selected, focused |
| 🌮 Responsive | six breakpoints, XL 1768+ down to XXS 320 | 28 | breakpoint booleans, grid columns, gutter, margin, nav widths |

What the file shows:

1. **Two color modes only.** Light and Dark. Increased contrast exists in code but not in Figma.
2. **Primitives are a separate, hidden library.** Every semantic token aliases a remote primitive named like `Blue/Blue700` or `Neutral/Opaque/Neutral0`. Designers can only pick semantics.
3. **Paths mirror the code name**, with `default` as the leaf for the unqualified token: `color/text/accent/red/default`. Every variable carries code syntax, such as `token('color.text.accent.red')`, so Dev Mode shows the code name.
4. **Shadows are split in two:**
   - **Effect styles, one set per mode:** `Light/elevation.shadow.raised`, `Dark/elevation.shadow.overlay`, and so on. Effect styles cannot switch modes, so the mode is in the style name.
   - **Shadow color variables per layer:** `elevation/shadow/raised/spread`, `…/perimeter`, `…/inner`. These are mode-aware, so the colors follow the theme even though the geometry does not.
5. **Text styles are fully bound.** All 20 (`Heading/XXL` to `XXS`; `Body/L`, `M (Default)` and `S`, each in Regular, Medium and Bold; `Metric/L`, `M` and `S`; `Code`) bind size, line height, weight, paragraph spacing and family to variables. Swapping the Typography mode swaps every style's typeface at once.
6. **No color paint styles.** The 189 paint styles are illustrations, not colors. Color lives only in variables.
7. **Gaps not to copy:**
   - 598 of 601 color variables are left at `ALL_SCOPES`, so every color shows in every picker.
   - Only one variable has a description.
8. **Visible conventions.** 🌮 marks published collections and styles; 🔒 marks internal parts.

**Recommended PLUS Figma setup**, aligned with ADS Foundations and fixing its two gaps:

| Collection or style | Modes | Holds | Differs from ADS |
|---|---|---|---|
| Primitives (hidden from publishing) | one | nine hue ramps, both neutral ramps, alphas, named `teal/teal700` | ADS keeps these in a separate library; one hidden collection is simpler for one team |
| Color | Light, Dark (Increased contrast later as two more modes) | semantic `color/…/default` and `elevation/surface/…`, with WEB code syntax `var(--ds-…)` | **scoped** (text colors to text fill, borders to stroke, backgrounds to fills) and **described** |
| Shadow colors | inside Color | `elevation/shadow/{raised,overlay,overflow}/…` | same as ADS |
| Effect styles | — | `Light/elevation.shadow.raised` … `Dark/…` | same as ADS |
| Typography | Default, plus a fallback mode | font family per role | same pattern, PLUS families |
| Type scale | one | size, line height, weight per style | same as ADS |
| Text styles | — | `Heading/…`, `Body/{L,M,S}/{Regular,Medium,Bold}`, `Metric/…`, `Code`, all bound | same as ADS |

**Type, in brief.** Atlassian's type scale is the same in code ([atlassian-typography](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/esm/artifacts/themes/atlassian-typography.js)) and in Figma:

| Role | Sizes (size / line height) |
|---|---|
| Heading XXL–XXS | 32/36, 28/32, 24/28, 20/24, 16/20, 14/20, 12/16 |
| Body L, M, S | 16/24, 14/20, 12/16 |
| Metric L, M, S | 28/32, 24/28, 16/20 |
| Code | 12/20 in Figma |

Weights are 400, 500, 600 and 653, where 653 is a variable-font bold.

Four things carry over to PLUS, which already follows Atlassian's type structure with its own families:

1. Composite tokens per role, so size and line height never drift apart.
2. Families as tokens, so a typeface swap is one mode change.
3. A separate Metric role for dashboard numbers.
4. Bold mapped to the nearest weight PLUS's families ship.

Spacing, Radius, Border and Responsive follow the same pattern. PLUS already has its own tokens there, so they are listed for completeness, not proposed here. One idea worth borrowing later is radius: a focus-ring radius paired with each corner radius, so the ring stays concentric.

## 5. Open decisions for Bill

Each needs Bill's call, and each has a recommendation. The brand hue is settled: Lagoon, 205°.

1. **Plan A (Paper) or Plan B (Neutral).** *Recommend A*, or a hybrid with Plan B's soft shadows on cards and overlays (§4.6). Compare the two on the same screen in the artifact before deciding.
2. **Selection color.** Both plans now select in neutral ink, as Notion, today's Claude and Atlassian's Finesse override do. The alternative is the teal tint, Atlassian's default. *Recommend neutral.* It keeps Lagoon for actions, links and focus.
3. **Modal elevation.** Collapse "modals use light-4" into the single `overlay` level, as Atlassian does, or keep a separate modal shadow. *Recommend collapsing.* The blanket already separates a modal from a menu. This reverses a ruling.
4. **Dragged items.** Overlay, as Atlassian specifies, or raised. *Recommend overlay.* A dragged card is above everything else on the page.
5. **Secondary and tertiary.** Drop both as roles. *Recommend dropping.* Secondary becomes `text.subtle` and `background.neutral`; tertiary becomes an accent. Bill's Atlassian model (one brand, functional colors, accents) already implies this.
6. **"Surface container" name clash.** PLUS's frame pattern versus Atlassian's `elevation.surface.container` well. *Recommend renaming PLUS's pattern* to "Frame" in docs and keeping Atlassian's token name, so Atlassian's guidance reads across unchanged. The alternative is to rename the token `elevation.surface.well`.
7. **Information hue.** Move info from the teal tertiary to blue. *Recommend blue.* With a Lagoon brand, a teal info reads as brand. This reverses the 2026-10-24 ruling.
8. **Information blue's chroma.** Keep blue's cap at 0.13, so info reads slightly more vivid than Lagoon, or lower it to about 0.10 to match. *Recommend keeping 0.13.* Lower makes info blue look gray beside red and green.
9. **SMART category colors.** Add a thin product layer `color.smart.{subject}.*` aliasing the accents. *Recommend the alias layer:*
   - mastering-content → purple;
   - relationship → magenta;
   - technology-tools → blue;
   - advocacy → green;
   - social-emotional → orange.
10. **Warning edge darkness.** The ruling put the warning border and icon at `#715c00`; the Atlassian mapping gives yellow.600 (`#a17c16`) for border and icon and yellow.800 for text. *Recommend the mapping*: it clears 3:1 and keeps the dark value in text.
11. **Scope.** *Recommend:*
    - sRGB only, no P3;
    - Light and Dark modes defined in the tokens now, but no theme toggle shipped until the component sweep is done;
    - increased contrast as a later override, as Atlassian does it (§4.10);
    - the generator in the repo as the source of truth, emitting SCSS and the Figma collections in §4.10;
    - the `--ds-` CSS prefix.

Still out of scope and still Bill's: the AI hue (#269). Atlassian's discovery purple is where it would go if he wants one.

## 6. If approved: the work, in order

1. Commit the generator and its tests, emitting `_palette.scss`, `_semantic.scss` and `_elevation.scss` beside today's files, for the chosen plan.
2. Push Primitives and Semantic collections, and the shadow styles, to the BS4 Foundation library, unpublished until Bill publishes.
3. Alias today's `--color-*` and `--elevation-light-*` tokens to the new ones, so nothing changes visually except brand, neutrals and shadows.
4. Sweep components onto `--ds-*` names by pattern, from the frame down to the layers, retiring the 117 state-layer tokens and the hard-coded shadows as they empty.
5. Update `design-system/guidelines/foundations/` color and elevation docs and the generated agent views.

Each step is its own ticket; step 4 splits per pattern.

## Appendix A: Primitive ramps


**Hue ramps, part 1** (hex · contrast on white)

| Step | teal | blue | green | lime | yellow |
|---|---|---|---|---|---|
| 100 | `#e6f9fc` 1.09 | `#f1f6ff` 1.08 | `#ecf9f1` 1.08 | `#f3f8eb` 1.08 | `#faf6e8` 1.08 |
| 200 | `#c0ebf0` 1.28 | `#d3e4fe` 1.29 | `#ceead8` 1.28 | `#dee7cb` 1.28 | `#ede3c5` 1.28 |
| 250 | `#9cdae1` 1.55 | `#bad1f4` 1.55 | `#b0d9c0` 1.55 | `#c8d4ad` 1.56 | `#ddcfa4` 1.55 |
| 300 | `#70c9d4` 1.91 | `#9ebeed` 1.90 | `#90c8a7` 1.91 | `#b2c28c` 1.91 | `#d0ba7f` 1.91 |
| 400 | `#23b5c2` 2.48 | `#7aa5e6` 2.51 | `#61b487` 2.50 | `#97ac5e` 2.51 | `#c1a047` 2.50 |
| 500 | `#1d9eab` 3.22 | `#5c91de` 3.20 | `#32a26c` 3.22 | `#819934` 3.21 | `#b08b1a` 3.20 |
| 600 | `#198f9a` 3.86 | `#4e81ce` 3.92 | `#1b935e` 3.90 | `#728a22` 3.91 | `#9f7d16` 3.88 |
| 700 | `#147b84` 5.00 | `#406fb6` 5.04 | `#148051` 4.96 | `#627713` 5.04 | `#8a6b11` 5.01 |
| 800 | `#106972` 6.39 | `#365f9d` 6.40 | `#0f6c44` 6.46 | `#536610` 6.41 | `#765c0d` 6.35 |
| 850 | `#0a545a` 8.65 | `#294b7e` 8.74 | `#0a5635` 8.77 | `#425109` 8.70 | `#5e4908` 8.63 |
| 900 | `#063e43` 11.81 | `#1c375f` 11.92 | `#064126` 11.72 | `#303d05` 11.70 | `#463605` 11.73 |
| 1000 | `#043236` 13.86 | `#1a2c47` 14.05 | `#0d3220` 14.05 | `#272f0e` 14.01 | `#372a03` 14.05 |

**Hue ramps, part 2** (hex · contrast on white)

| Step | orange | red | magenta | purple |
|---|---|---|---|---|
| 100 | `#fff4ec` 1.08 | `#fff4f2` 1.08 | `#fff3f8` 1.08 | `#f8f4ff` 1.08 |
| 200 | `#f9dec8` 1.29 | `#fedcd8` 1.28 | `#fcdae9` 1.28 | `#e8dffc` 1.28 |
| 250 | `#eec8aa` 1.56 | `#f9c2bd` 1.56 | `#f1c3d8` 1.55 | `#d6c9f0` 1.56 |
| 300 | `#e5b189` 1.91 | `#f2a9a3` 1.91 | `#e9aac7` 1.90 | `#c5b3e8` 1.91 |
| 400 | `#dd935b` 2.50 | `#eb8881` 2.51 | `#df89b2` 2.51 | `#b197e0` 2.51 |
| 500 | `#d37930` 3.21 | `#e36b65` 3.20 | `#d46ea2` 3.21 | `#a07fd7` 3.22 |
| 600 | `#c26a1c` 3.91 | `#d15c57` 3.90 | `#c35f93` 3.90 | `#9171c6` 3.90 |
| 700 | `#a95b12` 5.01 | `#b84d48` 5.01 | `#ab507f` 5.02 | `#7f60af` 5.01 |
| 800 | `#924d0e` 6.38 | `#9e413d` 6.41 | `#93436d` 6.43 | `#6c5196` 6.45 |
| 850 | `#743d09` 8.70 | `#7f322f` 8.75 | `#763456` 8.77 | `#564079` 8.73 |
| 900 | `#582c05` 11.81 | `#612321` 11.86 | `#5a2540` 11.84 | `#402f5c` 11.80 |
| 1000 | `#43240c` 14.03 | `#48201d` 14.00 | `#432032` 14.08 | `#312644` 14.08 |

**Neutral ramps, Plan A (Paper) and Plan B (Neutral)** (hex · contrast on white)

| Step | A dark | B dark | A light | B light |
|---|---|---|---|---|
| 0 | `#181716` 17.90 | `#171717` 17.93 | `#ffffff` 1.00 | `#ffffff` 1.00 |
| 100 | `#1e1e1d` 16.68 | `#1e1e1e` 16.67 | `#f9f8f7` 1.06 | `#f8f8f8` 1.06 |
| 200 | `#252423` 15.49 | `#242424` 15.52 | `#f3f1ef` 1.13 | `#f1f1f1` 1.13 |
| 250 | `#2c2b2a` 14.13 | `#2b2b2b` 14.16 |  |  |
| 300 | `#313130` 13.02 | `#313131` 13.01 | `#e0dedc` 1.34 | `#dedede` 1.35 |
| 350 | `#3f3e3d` 10.67 | `#3e3e3e` 10.70 |  |  |
| 400 | `#4d4d4c` 8.46 | `#4d4d4d` 8.45 | `#bab8b5` 1.98 | `#b8b8b8` 1.98 |
| 500 | `#656564` 5.84 | `#656565` 5.83 | `#928f8a` 3.22 | `#8f8f8f` 3.23 |
| 600 | `#828281` 3.85 | `#828282` 3.84 | `#827f7b` 3.98 | `#7f7f7f` 4.00 |
| 700 | `#9a9998` 2.84 | `#999999` 2.85 | `#706d69` 5.15 | `#6d6d6d` 5.17 |
| 800 | `#acabaa` 2.29 | `#ababab` 2.30 | `#555350` 7.67 | `#535353` 7.69 |
| 900 | `#c1c0bf` 1.82 | `#c0c0c0` 1.82 | `#3f3d3b` 10.81 | `#3d3d3d` 10.86 |
| 1000 | `#d0cfce` 1.56 | `#cfcfcf` 1.56 | `#2c2b2a` 14.13 | `#2b2b2b` 14.16 |
| 1100 | `#e4e3e2` 1.28 | `#e3e3e3` 1.28 | `#1f1e1e` 16.63 | `#1e1e1e` 16.67 |

**OKLCH source values: Lagoon and both light neutrals**

| Step | teal (Lagoon) | neutral A | neutral B |
|---|---|---|---|
| 0 |  | `oklch(1.000 0.000 90)` | `oklch(1.000 0.000 90)` |
| 100 | `oklch(0.969 0.020 208)` | `oklch(0.980 0.002 68)` | `oklch(0.979 0.000 90)` |
| 200 | `oklch(0.911 0.045 205)` | `oklch(0.959 0.003 68)` | `oklch(0.958 0.000 90)` |
| 300 | `oklch(0.784 0.087 206)` | `oklch(0.902 0.003 68)` | `oklch(0.901 0.000 90)` |
| 400 | `oklch(0.708 0.115 204)` | `oklch(0.783 0.005 78)` | `oklch(0.783 0.000 90)` |
| 500 | `oklch(0.641 0.104 206)` | `oklch(0.651 0.008 81)` | `oklch(0.650 0.000 90)` |
| 600 | `oklch(0.595 0.097 205)` | `oklch(0.598 0.007 75)` | `oklch(0.596 0.000 90)` |
| 700 | `oklch(0.534 0.087 204)` | `oklch(0.536 0.007 75)` | `oklch(0.535 0.000 90)` |
| 800 | `oklch(0.477 0.077 206)` | `oklch(0.443 0.006 78)` | `oklch(0.442 0.000 90)` |
| 900 | `oklch(0.333 0.054 204)` | `oklch(0.361 0.004 68)` | `oklch(0.360 0.000 90)` |
| 1000 | `oklch(0.290 0.047 204)` | `oklch(0.290 0.002 68)` | `oklch(0.289 0.000 90)` |
| 1100 |  | `oklch(0.236 0.002 17)` | `oklch(0.235 0.000 90)` |

**Alpha neutrals** (ink in light, paper in dark)

| Step | A light | A dark | B light | B dark |
|---|---|---|---|---|
| 100A | `#1f1e1e08` | `#e4e3e20a` | `#1e1e1e08` | `#e3e3e30a` |
| 200A | `#1f1e1e0f` | `#e4e3e214` | `#1e1e1e0f` | `#e3e3e314` |
| 250A |  | `#e4e3e21a` |  | `#e3e3e31a` |
| 300A | `#1f1e1e24` | `#e4e3e229` | `#1e1e1e24` | `#e3e3e329` |
| 400A | `#1f1e1e4f` | `#e4e3e247` | `#1e1e1e4f` | `#e3e3e347` |
| 500A | `#1f1e1e7d` | `#e4e3e280` | `#1e1e1e7d` | `#e3e3e380` |

## Appendix B: Semantic tokens, light and dark, both plans

Each cell is `primitive hex` for light / dark. "same as A" means Plan B uses Plan A's values.


#### Text

| Token | For | Plan A light / dark | Plan B light / dark |
|---|---|---|---|
| `color.text` | Primary text, such as body copy, sentence case headers, and buttons | neutral.1000 `#2c2b2a` / darkNeutral.1000 `#d0cfce` | neutral.1000 `#2b2b2b` / darkNeutral.1000 `#cfcfcf` |
| `color.text.disabled` | Text in a disabled state | neutralAlpha.400 `#1f1e1e4f` / darkNeutralAlpha.400 `#e4e3e247` | neutralAlpha.400 `#1e1e1e4f` / darkNeutralAlpha.400 `#e3e3e347` |
| `color.text.inverse` | Text on bold backgrounds | neutral.0 `#ffffff` / darkNeutral.100 `#1e1e1d` | neutral.0 `#ffffff` / darkNeutral.100 `#1e1e1e` |
| `color.text.selected` | Text that communicates selection, such as the active tab or a selected navigation item, or the opened state of a dropdown trigger. On bold selected backgrounds, use color.text.inverse instead. Do not use for unselected links, brand emphasis, or hover alone. Keep the selected text treatment when the element also has focus *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: selection is neutral, as on claude.ai (ink at 5%) and in Atlassian's FY27 Finesse override.* | neutral.1000 `#2c2b2a` / darkNeutral.1000 `#d0cfce` | neutral.1000 `#2b2b2b` / darkNeutral.1000 `#cfcfcf` |
| `color.text.brand` | Text that reinforces our brand | teal.700 `#147b84` / teal.400 `#23b5c2` | same as A |
| `color.text.danger` | Critical text, such as input field error messaging | red.800 `#9e413d` / red.300 `#f2a9a3` | same as A |
| `color.text.danger.bolder` | Text on top of danger semantic labels to ensure accessibility and desired visual appearance | red.900 `#612321` / red.200 `#fedcd8` | same as A |
| `color.text.warning` | Text to emphasize caution, such as in moved lozenges | yellow.800 `#765c0d` / yellow.300 `#d0ba7f` | same as A |
| `color.text.warning.inverse` | Text when on bold warning backgrounds | neutral.1000 `#2c2b2a` / darkNeutral.100 `#1e1e1d` | neutral.1000 `#2b2b2b` / darkNeutral.100 `#1e1e1e` |
| `color.text.warning.bolder` | Text on top of warning semantic labels to ensure accessibility and desired visual appearance | yellow.900 `#463605` / yellow.200 `#ede3c5` | same as A |
| `color.text.success` | Text to communicate a favorable outcome, such as input field success messaging | green.800 `#0f6c44` / green.300 `#90c8a7` | same as A |
| `color.text.success.bolder` | Text on top of success semantic labels to ensure accessibility and desired visual appearance | green.900 `#064126` / green.200 `#ceead8` | same as A |
| `color.text.discovery` | Text to emphasize change or something new, such as in new lozenges | purple.800 `#6c5196` / purple.300 `#c5b3e8` | same as A |
| `color.text.discovery.bolder` | Text on top of discovery semantic labels to ensure accessibility and desired visual appearance | purple.900 `#402f5c` / purple.200 `#e8dffc` | same as A |
| `color.text.information` | Informative text or to communicate something is in progress, such as in-progress lozenges | blue.800 `#365f9d` / blue.300 `#9ebeed` | same as A |
| `color.text.information.bolder` | Text on top of information semantic labels to ensure accessibility and desired visual appearance | blue.900 `#1c375f` / blue.200 `#d3e4fe` | same as A |
| `color.text.subtlest` | Tertiary text, such as meta-data, breadcrumbs, input field placeholder and helper text | neutral.700 `#706d69` / darkNeutral.700 `#9a9998` | neutral.700 `#6d6d6d` / darkNeutral.700 `#999999` |
| `color.text.subtle` | Secondary text, such as navigation, subtle button links, input field labels, and all caps subheadings | neutral.800 `#555350` / darkNeutral.800 `#acabaa` | neutral.800 `#535353` / darkNeutral.800 `#ababab` |

#### Icon

| Token | For | Plan A light / dark | Plan B light / dark |
|---|---|---|---|
| `color.icon` | Icon-only buttons, or icons paired with color.text | neutral.1000 `#2c2b2a` / darkNeutral.1000 `#d0cfce` | neutral.1000 `#2b2b2b` / darkNeutral.1000 `#cfcfcf` |
| `color.icon.disabled` | Icons in a disabled state | neutralAlpha.400 `#1f1e1e4f` / darkNeutralAlpha.400 `#e4e3e247` | neutralAlpha.400 `#1e1e1e4f` / darkNeutralAlpha.400 `#e3e3e347` |
| `color.icon.inverse` | Icons on bold backgrounds | neutral.0 `#ffffff` / darkNeutral.100 `#1e1e1d` | neutral.0 `#ffffff` / darkNeutral.100 `#1e1e1e` |
| `color.icon.selected` | Icons that communicate selection, such as icons in selected navigation items, or the opened state of a dropdown trigger. On bold selected backgrounds, use color.icon.inverse instead. Do not use for brand emphasis or hover alone. Keep the selected icon treatment when the element also has focus *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: selection is neutral, as on claude.ai (ink at 5%) and in Atlassian's FY27 Finesse override.* | neutral.1000 `#2c2b2a` / darkNeutral.1000 `#d0cfce` | neutral.1000 `#2b2b2b` / darkNeutral.1000 `#cfcfcf` |
| `color.icon.brand` | Icons that reinforce our brand | teal.700 `#147b84` / teal.400 `#23b5c2` | same as A |
| `color.icon.danger` | Icons communicating critical information, such as those used in error handing | red.700 `#b84d48` / red.500 `#e36b65` | same as A |
| `color.icon.warning` | Icons communicating caution, such as those used in warning section messages | yellow.600 `#9f7d16` / yellow.300 `#d0ba7f` | same as A |
| `color.icon.warning.inverse` | Icons when on bold warning backgrounds | neutral.1000 `#2c2b2a` / darkNeutral.100 `#1e1e1d` | neutral.1000 `#2b2b2b` / darkNeutral.100 `#1e1e1e` |
| `color.icon.success` | Icons communicating a favorable outcome, such as those used in success section messaged | green.600 `#1b935e` / green.500 `#32a26c` | same as A |
| `color.icon.discovery` | Icons communicating change or something new, such as discovery section messages | purple.600 `#9171c6` / purple.500 `#a07fd7` | same as A |
| `color.icon.information` | Icons communicating information or something in-progress, such as information section messages | blue.600 `#4e81ce` / blue.500 `#5c91de` | same as A |
| `color.icon.subtlest` | Icons paired with color.text.subtlest | neutral.700 `#706d69` / darkNeutral.700 `#9a9998` | neutral.700 `#6d6d6d` / darkNeutral.700 `#999999` |
| `color.icon.subtle` | Icons paired with color.text.subtle | neutral.800 `#555350` / darkNeutral.800 `#acabaa` | neutral.800 `#535353` / darkNeutral.800 `#ababab` |

#### Border

| Token | For | Plan A light / dark | Plan B light / dark |
|---|---|---|---|
| `color.border` | Use to visually group or separate UI elements, such as flat cards or side panel dividers | neutralAlpha.300 `#1f1e1e24` / darkNeutralAlpha.300 `#e4e3e229` | neutralAlpha.300 `#1e1e1e24` / darkNeutralAlpha.300 `#e3e3e329` |
| `color.border.disabled` | Borders of elements in a disabled state | neutralAlpha.200 `#1f1e1e0f` / darkNeutralAlpha.200 `#e4e3e214` | neutralAlpha.200 `#1e1e1e0f` / darkNeutralAlpha.200 `#e3e3e314` |
| `color.border.focused` | The focus ring or border of an element that currently has keyboard or input focus. Do not use to indicate selection or hover alone. When an element is both selected and focused, keep its selected treatment and add a separate focus indicator *One step darker than Atlassian (500), for margin: 3.9:1 on white instead of 3.2:1.* | teal.600 `#198f9a` / teal.300 `#70c9d4` | same as A |
| `color.border.input` | Borders of form UI elements, such as text fields, checkboxes, and radio buttons | neutral.500 `#928f8a` / darkNeutral.600 `#828281` | neutral.500 `#8f8f8f` / darkNeutral.600 `#828282` |
| `color.border.input.search` | The border of search inputs | neutralAlpha.300 `#1f1e1e24` / darkNeutralAlpha.300 `#e4e3e229` | neutralAlpha.300 `#1e1e1e24` / darkNeutralAlpha.300 `#e3e3e329` |
| `color.border.inverse` | Borders on bold backgrounds | neutral.0 `#ffffff` / darkNeutral.0 `#181716` | neutral.0 `#ffffff` / darkNeutral.0 `#171717` |
| `color.border.selected` | Borders or visual indicators that communicate selection, such as the active tab or a selected menu item, or the opened state of a dropdown trigger. Do not use as a keyboard focus indicator; use color.border.focused for focus and preserve the selected treatment when both states apply *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: selection is neutral, as on claude.ai (ink at 5%) and in Atlassian's FY27 Finesse override.* | neutral.1000 `#2c2b2a` / darkNeutral.1000 `#d0cfce` | neutral.1000 `#2b2b2b` / darkNeutral.1000 `#cfcfcf` |
| `color.border.brand` | Borders or visual indicators of elements that reinforce our brand, such as logos or primary buttons | teal.700 `#147b84` / teal.400 `#23b5c2` | same as A |
| `color.border.danger` | Borders communicating critical information, such as the borders on invalid text fields | red.600 `#d15c57` / red.500 `#e36b65` | same as A |
| `color.border.danger.subtle` | Decorative danger borders that do not need to meet 3:1 contrast requirements | red.300 `#f2a9a3` / red.800 `#9e413d` | same as A |
| `color.border.warning` | Borders communicating caution | yellow.600 `#9f7d16` / yellow.500 `#b08b1a` | same as A |
| `color.border.warning.subtle` | Decorative warning borders that do not need to meet 3:1 contrast requirements | yellow.300 `#d0ba7f` / yellow.800 `#765c0d` | same as A |
| `color.border.success` | Borders communicating a favorable outcome, such as the borders on validated text fields | green.600 `#1b935e` / green.500 `#32a26c` | same as A |
| `color.border.success.subtle` | Decorative success borders that do not need to meet 3:1 contrast requirements | green.300 `#90c8a7` / green.800 `#0f6c44` | same as A |
| `color.border.discovery` | Borders communicating change or something new, such as the borders in onboarding spotlights | purple.600 `#9171c6` / purple.500 `#a07fd7` | same as A |
| `color.border.discovery.subtle` | Decorative discovery borders that do not need to meet 3:1 contrast requirements | purple.300 `#c5b3e8` / purple.800 `#6c5196` | same as A |
| `color.border.information` | Borders communicating information or something in-progress | blue.600 `#4e81ce` / blue.500 `#5c91de` | same as A |
| `color.border.information.subtle` | Decorative information borders that do not need to meet 3:1 contrast requirements | blue.300 `#9ebeed` / blue.800 `#365f9d` | same as A |
| `color.border.bold` | A neutral border option that passes min 3:1 contrast ratios | neutral.600 `#827f7b` / darkNeutral.600 `#828281` | neutral.600 `#7f7f7f` / darkNeutral.600 `#828282` |
| `color.border.focused.inverse` | PLUS addition. Focus ring on a bold or colored ground (today --color-focus-ring-inverse). *today's Focus Ring Inverse* | neutral.0 `#ffffff` / darkNeutral.100 `#1e1e1d` | neutral.0 `#ffffff` / darkNeutral.100 `#1e1e1e` |

#### Background: neutral, input, inverse, disabled, selected, brand

| Token | For | Plan A light / dark | Plan B light / dark |
|---|---|---|---|
| `color.background.disabled` | Backgrounds of elements in a disabled state | neutralAlpha.200 `#1f1e1e0f` / darkNeutralAlpha.300 `#e4e3e229` | neutralAlpha.200 `#1e1e1e0f` / darkNeutralAlpha.300 `#e3e3e329` |
| `color.background.input` | Background of form UI elements, such as text fields, checkboxes, and radio buttons | neutral.0 `#ffffff` / darkNeutral.200 `#252423` | neutral.0 `#ffffff` / darkNeutral.200 `#242424` |
| `color.background.input.hovered` | Hovered state for color.background.input | neutral.100 `#f9f8f7` / darkNeutral.250 `#2c2b2a` | neutral.100 `#f8f8f8` / darkNeutral.250 `#2b2b2b` |
| `color.background.input.pressed` | Pressed state for color.background.input | neutral.0 `#ffffff` / darkNeutral.200 `#252423` | neutral.0 `#ffffff` / darkNeutral.200 `#242424` |
| `color.background.inverse.subtle` | Backgrounds of elements on a bold background, such as in the buttons on spotlight cards | ink @16% `#1f1e1e29` / paper @16% `#e4e3e229` | ink @16% `#1e1e1e29` / paper @16% `#e3e3e329` |
| `color.background.inverse.subtle.hovered` | The hovered state of color.background.inverse.subtle | ink @24% `#1f1e1e3d` / paper @24% `#e4e3e23d` | ink @24% `#1e1e1e3d` / paper @24% `#e3e3e33d` |
| `color.background.inverse.subtle.pressed` | The pressed state of color.background.inverse.subtle | ink @32% `#1f1e1e52` / paper @32% `#e4e3e252` | ink @32% `#1e1e1e52` / paper @32% `#e3e3e352` |
| `color.background.neutral` | The default background for neutral elements, such as default buttons | neutralAlpha.200 `#1f1e1e0f` / darkNeutralAlpha.200 `#e4e3e214` | neutralAlpha.200 `#1e1e1e0f` / darkNeutralAlpha.200 `#e3e3e314` |
| `color.background.neutral.hovered` | Hovered state for color.background.neutral | neutralAlpha.300 `#1f1e1e24` / darkNeutralAlpha.300 `#e4e3e229` | neutralAlpha.300 `#1e1e1e24` / darkNeutralAlpha.300 `#e3e3e329` |
| `color.background.neutral.pressed` | Pressed state for color.background.neutral | neutralAlpha.400 `#1f1e1e4f` / darkNeutralAlpha.400 `#e4e3e247` | neutralAlpha.400 `#1e1e1e4f` / darkNeutralAlpha.400 `#e3e3e347` |
| `color.background.neutral.subtle` | The background of elements that appear to have no background in a resting state, such as subtle buttons and menu items | transparent `#00000000` / transparent `#00000000` | same as A |
| `color.background.neutral.subtle.hovered` | Hovered state for color.background.neutral.subtle | neutralAlpha.200 `#1f1e1e0f` / darkNeutralAlpha.200 `#e4e3e214` | neutralAlpha.200 `#1e1e1e0f` / darkNeutralAlpha.200 `#e3e3e314` |
| `color.background.neutral.subtle.pressed` | Pressed state for color.background.neutral.subtle | neutralAlpha.300 `#1f1e1e24` / darkNeutralAlpha.300 `#e4e3e229` | neutralAlpha.300 `#1e1e1e24` / darkNeutralAlpha.300 `#e3e3e329` |
| `color.background.neutral.bold` | A vibrant background option for neutral UI elements, such as announcement banners | neutral.1000 `#2c2b2a` / darkNeutral.1000 `#d0cfce` | neutral.1000 `#2b2b2b` / darkNeutral.1000 `#cfcfcf` |
| `color.background.neutral.bold.hovered` | Hovered state of color.background.neutral.bold | neutral.900 `#3f3d3b` / darkNeutral.900 `#c1c0bf` | neutral.900 `#3d3d3d` / darkNeutral.900 `#c0c0c0` |
| `color.background.neutral.bold.pressed` | Pressed state of color.background.neutral.bold | neutral.800 `#555350` / darkNeutral.800 `#acabaa` | neutral.800 `#535353` / darkNeutral.800 `#ababab` |
| `color.background.selected` | The background of an element that communicates selection, such as a selected navigation item, or the opened state of a dropdown trigger. Use color.background.selected.hovered or color.background.selected.pressed when interacting with a selected element. Selection is distinct from keyboard focus and hover alone *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: selection is neutral, as on claude.ai (ink at 5%) and in Atlassian's FY27 Finesse override.* | neutralAlpha.200 `#1f1e1e0f` / darkNeutralAlpha.200 `#e4e3e214` | neutralAlpha.200 `#1e1e1e0f` / darkNeutralAlpha.200 `#e3e3e314` |
| `color.background.selected.hovered` | The background of an element that is selected and hovered. This preserves selection while showing pointer hover; do not use for an unselected element or keyboard focus alone *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: selection is neutral, as on claude.ai (ink at 5%) and in Atlassian's FY27 Finesse override.* | neutralAlpha.300 `#1f1e1e24` / darkNeutralAlpha.300 `#e4e3e229` | neutralAlpha.300 `#1e1e1e24` / darkNeutralAlpha.300 `#e3e3e329` |
| `color.background.selected.pressed` | The background of an element that is selected and being pressed. Return to color.background.selected or color.background.selected.hovered when the press ends and the element remains selected. Do not use for an unselected element or keyboard focus alone *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: selection is neutral, as on claude.ai (ink at 5%) and in Atlassian's FY27 Finesse override.* | neutralAlpha.400 `#1f1e1e4f` / darkNeutralAlpha.400 `#e4e3e247` | neutralAlpha.400 `#1e1e1e4f` / darkNeutralAlpha.400 `#e3e3e347` |
| `color.background.selected.bold` | The bold background of selected controls, such as checked checkboxes and selected radio buttons. Pair with color.text.inverse or color.icon.inverse for foreground content. Do not use for primary actions or keyboard focus alone *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: selection is neutral, as on claude.ai (ink at 5%) and in Atlassian's FY27 Finesse override.* | neutral.1000 `#2c2b2a` / darkNeutral.1000 `#d0cfce` | neutral.1000 `#2b2b2b` / darkNeutral.1000 `#cfcfcf` |
| `color.background.selected.bold.hovered` | The background of a selected control that uses color.background.selected.bold while it is hovered, such as a checked checkbox. Pair with color.text.inverse or color.icon.inverse for foreground content. Do not use for an unselected control or keyboard focus alone *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: selection is neutral, as on claude.ai (ink at 5%) and in Atlassian's FY27 Finesse override.* | neutral.900 `#3f3d3b` / darkNeutral.900 `#c1c0bf` | neutral.900 `#3d3d3d` / darkNeutral.900 `#c0c0c0` |
| `color.background.selected.bold.pressed` | The background of a selected control that uses color.background.selected.bold while it is being pressed, such as a checked checkbox. Pair with color.text.inverse or color.icon.inverse for foreground content. Do not use for an unselected control or keyboard focus alone *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: selection is neutral, as on claude.ai (ink at 5%) and in Atlassian's FY27 Finesse override.* | neutral.800 `#555350` / darkNeutral.800 `#acabaa` | neutral.800 `#535353` / darkNeutral.800 `#ababab` |
| `color.background.brand.subtlest` | The background of elements used to reinforce our brand, but with less emphasis | teal.100 `#e6f9fc` / teal.1000 `#043236` | same as A |
| `color.background.brand.subtlest.hovered` | Hovered state of color.background.brand.subtlest | teal.200 `#c0ebf0` / teal.900 `#063e43` | same as A |
| `color.background.brand.subtlest.pressed` | Pressed state of color.background.brand.subtlest | teal.250 `#9cdae1` / teal.850 `#0a545a` | same as A |
| `color.background.brand.bold` | The background of elements used to reinforce our brand, but with more emphasis | teal.700 `#147b84` / teal.400 `#23b5c2` | same as A |
| `color.background.brand.bold.hovered` | Hovered state of color.background.brand.bold | teal.800 `#106972` / teal.300 `#70c9d4` | same as A |
| `color.background.brand.bold.pressed` | Pressed state of color.background.brand.bold | teal.850 `#0a545a` / teal.250 `#9cdae1` | same as A |
| `color.background.brand.boldest` | The background of elements used to reinforce our brand, that need to stand out a lot | teal.1000 `#043236` / teal.100 `#e6f9fc` | same as A |
| `color.background.brand.boldest.hovered` | Hovered state of color.background.brand.boldest | teal.900 `#063e43` / teal.200 `#c0ebf0` | same as A |
| `color.background.brand.boldest.pressed` | Pressed state of color.background.brand.boldest | teal.850 `#0a545a` / teal.250 `#9cdae1` | same as A |

#### Background: danger (warning, success, information and discovery follow the same shape)

| Token | For | Plan A light / dark | Plan B light / dark |
|---|---|---|---|
| `color.background.danger` | Backgrounds communicating critical information, such in error section messages | red.100 `#fff4f2` / red.1000 `#48201d` | same as A |
| `color.background.danger.hovered` | Hovered state for color.background.danger | red.200 `#fedcd8` / red.900 `#612321` | same as A |
| `color.background.danger.pressed` | Pressed state for color.background.danger | red.250 `#f9c2bd` / red.850 `#7f322f` | same as A |
| `color.background.danger.subtler` | Backgrounds of danger lozenges and badges to ensure accessibility and desired visual appearance | red.200 `#fedcd8` / red.900 `#612321` | same as A |
| `color.background.danger.subtler.hovered` | Hovered state of color.background.danger.subtler | red.250 `#f9c2bd` / red.850 `#7f322f` | same as A |
| `color.background.danger.subtler.pressed` | Pressed state of color.background.danger.subtler | red.300 `#f2a9a3` / red.800 `#9e413d` | same as A |
| `color.background.danger.subtle` | Background color for non-interactive elements communicating critical danger information (e.g. semantic badges, status pills, callout chips). Sits between subtler and bold in visual emphasis. Not for interactive surfaces — see color.background.danger.bold or color.background.danger.subtler for interactive states | red.300 `#f2a9a3` / red.800 `#9e413d` | same as A |
| `color.background.danger.bold` | A vibrant background option for communicating critical information, such as in danger buttons and error banners | red.700 `#b84d48` / red.400 `#eb8881` | same as A |
| `color.background.danger.bold.hovered` | Hovered state of color.background.danger.bold | red.800 `#9e413d` / red.300 `#f2a9a3` | same as A |
| `color.background.danger.bold.pressed` | Pressed state of color.background.danger.bold | red.850 `#7f322f` / red.250 `#f9c2bd` | same as A |

#### Link, interaction, skeleton, blanket

| Token | For | Plan A light / dark | Plan B light / dark |
|---|---|---|---|
| `color.link` | Links in a default or hovered state. Add an underline for hovered states | teal.700 `#147b84` / teal.400 `#23b5c2` | same as A |
| `color.link.pressed` | Links in a pressed state | teal.800 `#106972` / teal.300 `#70c9d4` | same as A |
| `color.link.visited` | Visited links | purple.800 `#6c5196` / purple.300 `#c5b3e8` | same as A |
| `color.link.visited.pressed` | Visited links in a pressed state | purple.900 `#402f5c` / purple.200 `#e8dffc` | same as A |
| `color.interaction.hovered` | A background overlay for elements in a hovered state when their background color cannot change, such as avatars *PLUS state-layer ruling (2026-10-24): hover is an 8% overlay. Atlassian uses 16%.* | neutralAlpha ink @8% `#1f1e1e14` / paper @8% `#e4e3e214` | neutralAlpha ink @8% `#1e1e1e14` / paper @8% `#e3e3e314` |
| `color.interaction.pressed` | A background overlay for elements in a pressed state when their background color cannot change, such as avatars *PLUS ruling: pressed is a 12% overlay. Atlassian uses 32%.* | neutralAlpha ink @12% `#1f1e1e1f` / paper @12% `#e4e3e21f` | neutralAlpha ink @12% `#1e1e1e1f` / paper @12% `#e3e3e31f` |
| `color.skeleton` | Skeleton loading states | neutralAlpha.200 `#1f1e1e0f` / darkNeutralAlpha.200 `#e4e3e214` | neutralAlpha.200 `#1e1e1e0f` / darkNeutralAlpha.200 `#e3e3e314` |
| `color.skeleton.subtle` | The pulse or shimmer effect in skeleton loading states | neutralAlpha.100 `#1f1e1e08` / darkNeutralAlpha.100 `#e4e3e20a` | neutralAlpha.100 `#1e1e1e08` / darkNeutralAlpha.100 `#e3e3e30a` |
| `color.blanket` | The screen overlay that appears with modal dialogs *Keeps today's 0.32 scrim (#383). Atlassian is ~46%.* | ink @32% `#1f1e1e52` / black @60% `#00000099` | ink @32% `#1e1e1e52` / black @60% `#00000099` |
| `color.blanket.selected` | A translucent blanket to communicate selection when changing the background of the selected content is not possible, such as selected Editor blocks. The content beneath remains visible. Do not use to indicate keyboard focus or hover alone | teal.500 @8% `#1d9eab14` / teal.600 @8% `#198f9a14` | same as A |
| `color.blanket.danger` | An overlay to communicate danger states when a simple background color change isn't possible, such as deletion of Editor block elements | red.500 @8% `#e36b6514` / red.600 @8% `#d15c5714` | same as A |
| `color.interaction.dragged` | PLUS addition. Selected-or-dragged overlay, the 16% step of the state-layer ruling. *PLUS ruling 2026-10-24* | ink @16% `#1f1e1e29` / paper @16% `#e4e3e229` | ink @16% `#1e1e1e29` / paper @16% `#e3e3e329` |

#### Elevation surfaces

| Token | For | Plan A light / dark | Plan B light / dark |
|---|---|---|---|
| `elevation.surface` | The primary background for the UI | neutral.0 `#ffffff` / darkNeutral.100 `#1e1e1d` | neutral.0 `#ffffff` / darkNeutral.100 `#1e1e1e` |
| `elevation.surface.hovered` | Hovered state of elevation.surface | neutral.200 `#f3f1ef` / darkNeutral.200 `#252423` | neutral.200 `#f1f1f1` / darkNeutral.200 `#242424` |
| `elevation.surface.pressed` | Pressed state of elevation.surface | neutral.300 `#e0dedc` / darkNeutral.250 `#2c2b2a` | neutral.300 `#dedede` / darkNeutral.250 `#2b2b2b` |
| `elevation.surface.container` | A neutral container surface background | neutralAlpha.100 `#1f1e1e08` / darkNeutralAlpha.100 `#e4e3e20a` | neutralAlpha.100 `#1e1e1e08` / darkNeutralAlpha.100 `#e3e3e30a` |
| `elevation.surface.container.hovered` | Hovered state of elevation.surface.container | neutralAlpha.200 `#1f1e1e0f` / darkNeutralAlpha.200 `#e4e3e214` | neutralAlpha.200 `#1e1e1e0f` / darkNeutralAlpha.200 `#e3e3e314` |
| `elevation.surface.container.pressed` | Pressed state of elevation.surface.container | neutralAlpha.300 `#1f1e1e24` / darkNeutralAlpha.250 `#e4e3e21a` | neutralAlpha.300 `#1e1e1e24` / darkNeutralAlpha.250 `#e3e3e31a` |
| `elevation.surface.overlay` | The background of elements that sit on top of they UI, such as modals, dialogs, dropdown menus, floating toolbars, and floating single-action buttons. Also use for the background of raised cards in a dragged state. Combine with elevation.shadow.overlay | neutral.0 `#ffffff` / darkNeutral.250 `#2c2b2a` | neutral.0 `#ffffff` / darkNeutral.250 `#2b2b2b` |
| `elevation.surface.overlay.hovered` | Hovered state of elevation.surface.overlay | neutral.200 `#f3f1ef` / darkNeutral.300 `#313130` | neutral.200 `#f1f1f1` / darkNeutral.300 `#313131` |
| `elevation.surface.overlay.pressed` | Pressed state of elevation.surface.overlay | neutral.300 `#e0dedc` / darkNeutral.350 `#3f3e3d` | neutral.300 `#dedede` / darkNeutral.350 `#3e3e3e` |
| `elevation.surface.raised` | The background of cards that can be moved, such as Jira cards on a Kanban board. Combine with elevation.shadow.raised | neutral.0 `#ffffff` / darkNeutral.200 `#252423` | neutral.0 `#ffffff` / darkNeutral.200 `#242424` |
| `elevation.surface.raised.hovered` | Hovered state of elevation.surface.raised | neutral.200 `#f3f1ef` / darkNeutral.250 `#2c2b2a` | neutral.200 `#f1f1f1` / darkNeutral.250 `#2b2b2b` |
| `elevation.surface.raised.pressed` | Pressed state of elevation.surface.raised | neutral.300 `#e0dedc` / darkNeutral.300 `#313130` | neutral.300 `#dedede` / darkNeutral.300 `#313131` |
| `elevation.surface.sunken` | A secondary background for the UI commonly used for grouping items, such as Jira cards in columns | neutral.100 `#f9f8f7` / darkNeutral.0 `#181716` | neutral.100 `#f8f8f8` / darkNeutral.0 `#171717` |

| Emphasis | warning (yellow) | success (green) | information (blue) | discovery (purple) |
|---|---|---|---|---|
| `[default]` | `#faf6e8` / `#372a03` | `#ecf9f1` / `#0d3220` | `#f1f6ff` / `#1a2c47` | `#f8f4ff` / `#312644` |
| `.subtler` | `#ede3c5` / `#463605` | `#ceead8` / `#064126` | `#d3e4fe` / `#1c375f` | `#e8dffc` / `#402f5c` |
| `.subtle` | `#ddcfa4` / `#765c0d` | `#90c8a7` / `#0f6c44` | `#9ebeed` / `#365f9d` | `#c5b3e8` / `#6c5196` |
| `.bold` | `#d0ba7f` / `#d0ba7f` | `#148051` / `#61b487` | `#406fb6` / `#7aa5e6` | `#7f60af` / `#b197e0` |
| `.bold.hovered` | `#c1a047` / `#c1a047` | `#0f6c44` / `#90c8a7` | `#365f9d` / `#9ebeed` | `#6c5196` / `#c5b3e8` |

#### Accent pattern (repeat for teal, blue, green, lime, yellow, orange, red, magenta, purple; gray uses the neutrals)

| Token | For | Light step | Dark step |
|---|---|---|---|
| `color.background.accent.{f}.subtlest` | Blue backgrounds when there is no meaning tied to the color. Reserved for when you only want a hint of color | 100 | 1000 |
| `color.background.accent.{f}.subtlest.hovered` | Hovered state of color.background.accent.blue.subtlest | 200 | 900 |
| `color.background.accent.{f}.subtlest.pressed` | Pressed state of color.background.accent.blue.subtlest | 250 | 850 |
| `color.background.accent.{f}.subtler` | Blue backgrounds when there is no meaning tied to the color, such as colored tags | 200 | 900 |
| `color.background.accent.{f}.subtler.hovered` | Hovered state of color.background.accent.blue.subtler | 250 | 850 |
| `color.background.accent.{f}.subtler.pressed` | Pressed state of color.background.accent.blue.subtler | 300 | 800 |
| `color.background.accent.{f}.subtle` | Vibrant blue backgrounds when there is no meaning tied to the color, such as colored tags | 400 | 800 |
| `color.background.accent.{f}.subtle.hovered` | Hovered state of color.background.accent.blue.subtle | 300 | 850 |
| `color.background.accent.{f}.subtle.pressed` | Pressed state of color.background.accent.blue.subtle | 250 | 900 |
| `color.background.accent.{f}.bolder` | Blue backgrounds when there is no meaning tied to the color, and the background needs to pass min 3:1 contrast requirements | 700 | 400 |
| `color.background.accent.{f}.bolder.hovered` | Hovered state of color.background.accent.blue.bolder | 800 | 300 |
| `color.background.accent.{f}.bolder.pressed` | Pressed state of color.background.accent.blue.bolder | 850 | 250 |
| `color.border.accent.{f}` | Blue borders on non-bold backgrounds when there is no meaning tied to the color | 600 | 500 |
| `color.border.accent.{f}.subtle` | Decorative blue borders that do not need to meet 3:1 contrast requirements | 300 | 800 |
| `color.text.accent.{f}` | Blue text on subtlest and subtler blue accent backgrounds when there is no meaning tied to the color | 800 | 300 |
| `color.text.accent.{f}.bolder` | Blue text on subtle blue accent backgrounds when there is no meaning tied to the color | 900 | 200 |
| `color.icon.accent.{f}` | Blue icons on non-bold backgrounds when there is no meaning tied to the color, such as file type icons | 600 | 500 |
