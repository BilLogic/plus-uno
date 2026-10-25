---
title: "Color system: research and proposal"
type: research
status: proposal, iteration 3; brand decided (Lagoon), Plan A vs Plan B and other calls awaiting Bill
date: 2026-10-25
repos: plus-uno (design-system/src/tokens, BS4 Foundation Figma library)
artifact: https://claude.ai/artifact/SWQGFicTN9bV6HcF3fS3sk
---

# Color system: research and proposal

PLUS should replace its Material 3 color roles with an Atlassian-shaped token set. Underneath: OKLCH hue ramps and gray ramps of numbered steps. On top: 469 semantic tokens named `color.property.role.emphasis.state` (Atlassian's full color set, plus brown), and Atlassian's elevation tokens (surfaces, shadows, opacity), in four modes: light, dark, and an increased-contrast override of each. Bill has chosen the brand: **Lagoon**, a greener teal at hue 205° (`#147b84`). The ramps are generated, not hand-picked: each step number is a contrast promise against white, so step 700 and darker always carry text and 500 and darker always clear 3:1.

Iteration 3 adds three things:

- **The full Atlassian color set.** Iteration 2 emitted accents only as a pattern and skipped charts and code syntax. All ten accent families (gray included), 106 chart tokens and 17 code-syntax tokens are now generated and checked. **Brown** is added, from Notion, and the accent **teal** gets its own ramp, apart from Lagoon (§4.2).
- **Accents tuned per plan.** The hue ramps are no longer shared: Plan A fits hue and chroma to Notion's palette, Plan B to Claude's, both measured live. Step contrast is unchanged, so every pairing still passes (§4.2).
- **Increased contrast, specified.** Two more modes, generated from Atlassian's own increased-contrast references and checked against 7:1 for text and 4.5:1 for icons and borders (§4.11).

Iteration 2 added three things to the first draft:

- **All nine Atlassian accent families, tuned to sit with Lagoon.** Hues are spaced for even perceptual distance and capped in chroma so no accent outshouts the brand (§4.2).
- **Elevation in Atlassian's language**, mapped onto the UI patterns PLUS has already defined: the frame, the surface, sections, cards, tables, popovers and modals (§4.4, §4.5).
- **Two directions for the neutrals and surfaces**, to explore before committing: **Plan A, Paper**, toward Notion, and **Plan B, Neutral**, toward Claude as served today. They share every token name. Iteration 2 made them differ in grays, lines and shadows (§4.6); iteration 3 adds the accent palette (§4.2).

This is research and a proposal only. No token, component or Figma variable has changed. The visual companion is the artifact linked above. It renders both plans as a working PLUS screen in all four modes, the accent tags beside Notion's and Claude's, every ramp and every token. Section 5 lists the decisions only Bill can make, each with a recommendation.

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
- **claude.ai's accent palette** (`--cds-*`, read 2026-10-25) has eight hue ramps of about 40 steps each: red, orange, yellow, green, aqua, blue, violet and magenta, plus the clay brand (`#d97757`, emphasized `#c6613f`). Tags use step 100 as the tint and step 600 as the text (`--cds-bg-tint-blue` `#cde2fb`, `--cds-text-tint-blue` `#184f95`); fills use 450 (`#2a78d6`). The tints are fairly rich (OKLCH L 0.91, chroma 0.04–0.08) and the fills vivid (chroma 0.12–0.20). There is no brown, lime or gray accent.
- **anthropic.com** serves hex, with no `oklch()` or `hsl()` in its CSS. Grays run `--color-gray-000…1000` in steps of 50 (`050 #faf9f5`, `500 #87867f`, `950 #141413`), and sections switch themes through `--theme-{background|foreground|border}-{primary…quaternary}` ([anthropic.com](https://www.anthropic.com/) served CSS). Anthropic's own brand-guidelines skill lists the same values: dark `#141413`, light `#faf9f5`, orange `#d97757`, blue `#6a9bcc`, green `#788c5d` ([brand-guidelines SKILL.md](https://raw.githubusercontent.com/anthropics/skills/main/skills/brand-guidelines/SKILL.md)). The names "Book Cloth", "Kraft" and "Manilla" are **unverified**: they appear in no served CSS or official source.

### 2.5 Notion

- The API's color enum has ten text colors and nine backgrounds: default, gray, brown, orange, yellow, green, blue, purple, pink and red, with no teal ([rich-text reference](https://developers.notion.com/reference/rich-text)).
- **Notion's tag palette** (app stylesheet, read 2026-10-25 signed in) has ten colors: gray, brown, orange, yellow, green, teal, blue, purple, pink and red. Tags use `BacTer` as the tint and `TexSec` as the text (blue `#cee3f7` and `#387dc9`). The tints are soft (L 0.90–0.95, chroma about 0.035). The bold colors are uneven: cool hues are muted (blue chroma 0.10, green 0.085, teal 0.09) while warm ones stay vivid (red 0.18, pink 0.16, orange 0.16). Several of its text colors fall below 4.5:1 on white (orange 3.2:1, yellow 2.7:1). Dark-theme values are in the same file, which settles part of what iteration 2 left unverified.
- The served app CSS (read on a public notion.site page) has about 740 light-mode custom properties in a compressed grammar, `--c-{hue}{Property}{Rank}`: property is `Tex`, `Ico`, `Bor` or `Bac`, rank is `Pri`, `Sec` or `Ter`, and a `--ca-` prefix marks alpha values, e.g. `--c-bluTexSec`, `--ca-pinBacTerTra`. A numbered `pal*` palette sits underneath, and a teal family exists in the CSS though not in the API. Neutrals are warm: `--c-texPri #2c2c2b`, `--c-texSec #7d7a75`, `--c-borPri #e6e5e3`, `--c-bacSec #f9f8f7`. Colored text (`TexSec`) is the same value in both modes; blue text is `#387dc9`, teal `#2c8b9e`. A blue link renders as `var(--c-bluTexSec)` on the page. Source: [public notion.site page](https://johandahlberg.notion.site/Solid-Text-Color-Formating-fc39346030924c7a8865ec17a9110acd), served CSS. No official post on a 2024–25 Notion color update was found (**unverified**).

**What Claude and Notion teach, read together.** Both use a two-layer system (numbered primitives under role tokens), neither uses OKLCH, and both put a low-chroma gray under a single brand hue. Their accents differ more than their grays: Notion's are dusty and earthy, Claude's clean and saturated. That warmth is the concrete trait behind "the vibe of Notion and Claude", and it is the basis for open decision 2.

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

- **Hue families**, each with Atlassian's twelve steps (Lagoon plus ten accent ramps per plan): 100, 200, 250, 300, 400, 500, 600, 700, 800, 850, 900 and 1000.
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

**Accents: the full set.** Iteration 2 had all nine of Atlassian's hue ramps but emitted their accent tokens only as a pattern, and skipped chart and code-syntax colors. Every family and token is now generated:

| Family | Atlassian | Notion | Claude | PLUS |
|---|---|---|---|---|
| blue, green, yellow, orange, red, purple | yes | yes | yes (purple is violet) | yes |
| magenta | yes | pink | yes | yes |
| teal | yes | yes | aqua | yes, on its own ramp (below) |
| lime | yes | no | no | yes, to keep Atlassian's set and its charts whole |
| gray | yes | yes | no | yes, from each plan's neutrals |
| brown | no | yes | no | **added** |
| AI | Rovo tokens | no | clay brand | out of scope (#269) |

- **Tokens per family: 17.** Background subtlest, subtler, subtle and bolder, each with hovered and pressed; text and bolder text; icon; border and subtle border. Eleven families make 187.
- **Charts: 106.** Categorical 1–8, `bold`, `bolder` and `boldest` per hue, and a chart color per role (brand, danger, warning, success, discovery, information, neutral), each with a hovered state.
- **Code syntax: 17**, for code blocks in docs and prototypes.
- **Brown** is the one color Notion has and Atlassian lacks. It gives SMART categories and tags an eleventh, quiet option, and costs one ramp.
- **Accent teal gets its own ramp** (`aqua`, 190° in Plan A, 170° in Plan B) instead of aliasing Lagoon at 205°. Notion's teal sits at 212°, which would read as the brand; Claude's aqua at 170° shows the way out. Without the split, a teal tag would look like a brand button.

**Accents per plan.** Iteration 2 shared one set of hue ramps across both plans, so the plans differed only in grays and shadows. The accents now follow each benchmark too. The generator is unchanged: each step keeps its contrast target, and only hue, chroma cap and tint softness move.

| Family | Role | Plan A hue / cap | A 200 · 700 | Notion tag tint · color | Plan B hue / cap | B 200 · 700 | Claude tint · fill |
|---|---|---|---|---|---|---|---|
| blue | information | 245° / 0.10 | `#d1e6f8` · `#3a74a2` | `#cee3f7` · `#337ea9` | 256° / 0.16 | `#d3e5fe` · `#2b6fc6` | `#cde2fb` · `#2a78d6` |
| aqua | accent teal | 190° / 0.09 | `#cde9e7` · `#1c7c77` | `#cae9f0` · `#2c8b9e` | 170° / 0.12 | `#c5ebdd` · `#147f63` | `#bfebdb` · `#138e65` |
| green | success | 158° / 0.085 | `#d4e8db` · `#407a5b` | `#d7e6dd` · `#448361` | 145° / 0.16 | `#c9ecc9` · `#1e802c` | `#caeac7` · `#009300` |
| lime | accent | 120° / 0.085 | `#e0e5d1` · `#68743d` | — | 124° / 0.15 | `#dae9c0` · `#5e7911` | — |
| yellow | warning | 80° (92° pale) / 0.12 | `#ede3c6` · `#916812` | `#f2e3b7` · `#cb912f` | 74° (84° pale) / 0.15 | `#f6e1ba` · `#966612` | `#f9dca4` · `#a66a00` |
| orange | accent | 58° (64° pale) / 0.15 | `#fdddc3` · `#a75c12` | `#f3ddcb` · `#d9730d` | 45° (55° pale) / 0.16 | `#feddca` · `#b85014` | `#f7d8cb` · `#c25124` |
| red | danger | 27° / 0.16 | `#fedcd7` · `#bd4941` | `#f7d9d5` · `#cd3c3a` | 25° / 0.17 | `#fedcd8` · `#c14543` | `#fad6d6` · `#d03b3b` |
| magenta | accent | 350° / 0.15 | `#fedae9` · `#af4d80` | `#f4d8e4` · `#c14c8a` | 358° / 0.16 | `#fedbe5` · `#b74875` | `#f9d4e2` · `#c04873` |
| purple | discovery | 308° / 0.115 | `#ecdef9` · `#8560a3` | `#e8dbf2` · `#9065b0` | 288° / 0.17 | `#e2e0fe` · `#715fca` | `#dfdbfd` · `#7161e0` |
| brown | accent (new) | 52° / 0.075 | `#f2e0d5` · `#92654a` | `#ebdfd7` · `#9f6b53` | 48° / 0.09 | `#f8ded2` · `#9a6144` | — |

- **Plan A, toward Notion.** Cool hues muted (blue 0.10, green 0.085), warm hues vivid (red 0.16, magenta 0.15, orange 0.15), as Notion's own palette is. Ochre yellow, steel blue, sage green. Tints at 1.1× the default curve, close to Notion's tag tints. Lagoon (chroma 0.087 at 700) stays the most saturated cool color on screen.
- **Plan B, toward Claude.** Every hue at 0.15–0.17, with richer tints (1.25×). Hues follow Claude's: amber yellow 74°, grass green 145°, violet 288°, a redder orange at 45°. The cost: accents outshout Lagoon, as Claude's accents outshout its clay. Plan B's accents need to be used sparingly.
- **The 700 steps still sit at 5.00:1 on white in both plans**, so a red and a teal tag carry the same weight and only hue differs. PLUS text on tags is darker than Notion's because PLUS keeps 4.5:1.

Iteration 2's tuning (even spacing at step 700, warmer pale yellow and orange, caps of 0.13–0.15) is now the starting point both plans move from, kept in `build.py`.

**Accent contrast.** Atlassian's pairings for every family, light / dark, then increased contrast (IC). Bars: 4.5:1 for text and 3:1 for icons; 7:1 and 4.5:1 with increased contrast. All pass in both plans. Two PLUS fixes were needed, both found by the check:

1. Gray accent text in dark: Atlassian's pairing (DarkNeutral800 on DarkNeutral400) gives 3.7:1 on PLUS's dark ramp. The text moves one step lighter.
2. Dark accent fills in increased contrast: text on `subtle` and inverse text on `bolder` reached only about 6:1. Those fills move one step further from their text.

| Family | Plan | text on subtlest | text on subtler | bolder text on subtle | inverse on bolder | icon on surface |
|---|---|---|---|---|---|---|
| blue | A | 6.0 / 7.4 · IC 10.9 / 11.0 | 5.0 / 6.2 · IC 9.2 / 9.2 | 4.7 / 5.0 · IC 7.4 / 10.9 | 5.0 / 6.6 · IC 11.8 / 8.8 | 3.9 / 5.2 · IC 6.5 / 8.8 |
|  | B | 6.0 / 7.3 · IC 10.9 / 11.0 | 5.1 / 6.2 · IC 9.3 / 9.3 | 4.8 / 5.1 · IC 7.3 / 10.9 | 5.0 / 6.7 · IC 11.9 / 8.7 | 3.9 / 5.2 · IC 6.5 / 8.7 |
| teal | A | 6.0 / 7.4 · IC 11.0 / 11.0 | 5.1 / 6.3 · IC 9.3 / 9.3 | 4.8 / 5.1 · IC 7.4 / 11.0 | 5.0 / 6.7 · IC 11.9 / 8.8 | 3.9 / 5.2 · IC 6.5 / 8.8 |
|  | B | 6.0 / 7.4 · IC 11.0 / 10.9 | 5.0 / 6.3 · IC 9.2 / 9.2 | 4.8 / 5.0 · IC 7.4 / 11.0 | 5.0 / 6.7 · IC 11.9 / 8.8 | 3.9 / 5.2 · IC 6.5 / 8.8 |
| green | A | 6.0 / 7.4 · IC 10.9 / 10.9 | 5.0 / 6.2 · IC 9.2 / 9.2 | 4.7 / 5.0 · IC 7.4 / 10.9 | 5.1 / 6.7 · IC 11.8 / 8.8 | 3.9 / 5.2 · IC 6.5 / 8.8 |
|  | B | 6.0 / 7.4 · IC 10.9 / 11.0 | 5.0 / 6.2 · IC 9.2 / 9.2 | 4.7 / 5.0 · IC 7.4 / 10.9 | 5.0 / 6.7 · IC 11.8 / 8.8 | 3.9 / 5.2 · IC 6.5 / 8.8 |
| lime | A | 6.0 / 7.3 · IC 11.0 / 10.9 | 5.0 / 6.2 · IC 9.2 / 9.2 | 4.8 / 5.0 · IC 7.3 / 11.0 | 5.1 / 6.7 · IC 11.9 / 8.7 | 3.9 / 5.2 · IC 6.5 / 8.7 |
|  | B | 6.0 / 7.4 · IC 11.0 / 11.0 | 5.0 / 6.2 · IC 9.3 / 9.3 | 4.8 / 5.0 · IC 7.4 / 11.0 | 5.0 / 6.7 · IC 11.9 / 8.7 | 3.9 / 5.2 · IC 6.5 / 8.7 |
| yellow | A | 5.9 / 7.4 · IC 10.9 / 11.0 | 5.0 / 6.2 · IC 9.2 / 9.2 | 6.2 / 5.0 · IC 7.4 / 10.9 | 5.0 / 6.6 · IC 11.8 / 8.8 | 3.9 / 8.8 · IC 6.4 / 8.8 |
|  | B | 5.9 / 7.4 · IC 10.9 / 11.0 | 5.0 / 6.2 · IC 9.2 / 9.2 | 6.2 / 5.0 · IC 7.4 / 10.9 | 5.0 / 6.6 · IC 11.8 / 8.8 | 3.9 / 8.8 · IC 6.4 / 8.8 |
| orange | A | 5.9 / 7.4 · IC 10.9 / 10.9 | 5.0 / 6.2 · IC 9.2 / 9.2 | 4.7 / 5.0 · IC 7.4 / 10.9 | 5.0 / 6.7 · IC 11.8 / 8.7 | 3.9 / 5.2 · IC 6.4 / 8.7 |
|  | B | 6.0 / 7.3 · IC 10.9 / 10.9 | 5.0 / 6.2 · IC 9.2 / 9.2 | 4.7 / 5.0 · IC 7.3 / 10.9 | 5.0 / 6.6 · IC 11.8 / 8.8 | 3.9 / 5.2 · IC 6.4 / 8.8 |
| red | A | 5.9 / 7.4 · IC 10.9 / 11.0 | 5.0 / 6.2 · IC 9.2 / 9.2 | 4.7 / 5.0 · IC 9.1 / 10.9 | 5.0 / 6.7 · IC 11.8 / 8.8 | 5.0 / 4.3 · IC 6.4 / 8.8 |
|  | B | 6.0 / 7.3 · IC 11.0 / 11.0 | 5.0 / 6.2 · IC 9.3 / 9.3 | 4.7 / 5.0 · IC 9.1 / 11.0 | 5.0 / 6.7 · IC 11.9 / 8.7 | 5.0 / 4.3 · IC 6.4 / 8.7 |
| magenta | A | 5.9 / 7.3 · IC 10.9 / 11.0 | 5.0 / 6.2 · IC 9.3 / 9.3 | 4.7 / 5.0 · IC 7.3 / 10.9 | 5.0 / 6.7 · IC 11.8 / 8.7 | 3.9 / 5.2 · IC 6.4 / 8.7 |
|  | B | 6.0 / 7.3 · IC 10.9 / 11.0 | 5.0 / 6.2 · IC 9.3 / 9.3 | 4.7 / 5.0 · IC 7.3 / 10.9 | 5.0 / 6.7 · IC 11.8 / 8.7 | 3.9 / 5.2 · IC 6.4 / 8.7 |
| purple | A | 6.0 / 7.4 · IC 10.9 / 10.9 | 5.0 / 6.2 · IC 9.2 / 9.2 | 4.7 / 5.0 · IC 7.4 / 10.9 | 5.0 / 6.7 · IC 11.8 / 8.8 | 3.9 / 5.2 · IC 6.5 / 8.8 |
|  | B | 6.0 / 7.4 · IC 10.9 / 10.9 | 5.0 / 6.3 · IC 9.2 / 9.2 | 4.7 / 5.0 · IC 7.4 / 10.9 | 5.0 / 6.6 · IC 11.8 / 8.8 | 3.9 / 5.2 · IC 6.4 / 8.8 |
| gray | A | 6.8 / 7.2 · IC 9.6 / 8.4 | 5.7 / 4.7 · IC 8.1 / 9.1 | 5.2 / 4.5 · IC 7.1 / 10.2 | 5.2 / 5.9 · IC 7.7 / 7.3 | 4.0 / 4.3 · IC 7.7 / 7.3 |
|  | B | 6.8 / 7.2 · IC 9.6 / 8.3 | 5.7 / 4.7 · IC 8.1 / 9.1 | 5.2 / 4.5 · IC 7.1 / 10.1 | 5.2 / 5.8 · IC 7.7 / 7.3 | 4.0 / 4.3 · IC 7.7 / 7.3 |
| brown | A | 5.9 / 7.4 · IC 10.9 / 11.0 | 5.0 / 6.2 · IC 9.2 / 9.2 | 4.7 / 5.0 · IC 7.4 / 10.9 | 5.0 / 6.7 · IC 11.8 / 8.8 | 3.9 / 5.2 · IC 6.4 / 8.8 |
|  | B | 5.9 / 7.4 · IC 11.0 / 10.9 | 5.0 / 6.2 · IC 9.2 / 9.2 | 4.7 / 5.0 · IC 7.4 / 11.0 | 5.0 / 6.7 · IC 11.8 / 8.8 | 3.9 / 5.2 · IC 6.4 / 8.8 |

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

**Shadows, Plan A (Notion's geometry, warm ink):**

| Token | For | Light | Dark |
|---|---|---|---|
| `elevation.shadow.raised` | Box shadow of a raised card: a clickable card while hovered, or a movable card. Pair with elevation.surface.raised. *Plan A: Notion card geometry, a 5% ring plus a very wide 2% blur; the ring is the card edge, so cards need no border.* | `0px 0px 0px 1px #1f1e1e0d, 0px 12px 32px #1f1e1e05` | `0px 0px 0px 1px #00000000, 0px 1px 1px #0a090880, 0px 0px 1px #0a090880` |
| `elevation.shadow.overlay` | Box shadow of anything that sits over the UI: menus, popovers, tooltips, flags, modals, dragged items. Pair with elevation.surface.overlay. *Plan A: Notion popover geometry (ring 7%, 0 5px 8px at 3%, 0 20px 24px at 5%).* | `0px 0px 0px 1px #1f1e1e12, 0px 5px 8px #1f1e1e07, 0px 20px 24px #1f1e1e0d` | `0px 0px 0px 1px #e4e3e21f, 0px 8px 12px #0a09085c, 0px 0px 1px 1px #0a090880` |
| `elevation.shadow.overflow` | Shadow where content scrolls under other content, such as a table's sticky column. | `0px 0px 8px #1f1e1e29, 0px 0px 1px #1f1e1e1f` | `0px 0px 12px #0a09088f, 0px 0px 1px #0a090880` |
| `elevation.shadow.overflow.spread` | Fallback for overflow when a box shadow is not feasible; pair with .perimeter. | `#1f1e1e29` | `#0a09088f` |
| `elevation.shadow.overflow.perimeter` | Fallback for overflow when a box shadow is not feasible; pair with .spread. | `#1f1e1e1f` | `#0a090880` |
| `opacity.disabled` | Images and whole elements in a disabled state. *Today --color-disabled-opacity is 0.38 (M3); 0.4 is Atlassian's.* | `0.4` | `0.4` |
| `opacity.loading` | Content under a loading spinner. *New.* | `0.2` | `0.2` |

**Shadows, Plan B (claude.ai's geometry):**

| Token | For | Light | Dark |
|---|---|---|---|
| `elevation.shadow.raised` | Box shadow of a raised card: a clickable card while hovered, or a movable card. Pair with elevation.surface.raised. *Plan B: claude.ai card and composer geometry (ring 12%, 0 4px 20px at 7.5%).* | `0px 0px 0px 1px #1e1e1e1f, 0px 4px 20px #1e1e1e13` | `0px 0px 0px 1px #00000000, 0px 1px 1px #0a090880, 0px 0px 1px #0a090880` |
| `elevation.shadow.overlay` | Box shadow of anything that sits over the UI: menus, popovers, tooltips, flags, modals, dragged items. Pair with elevation.surface.overlay. *Plan B: claude.ai menu geometry (ring 8%, 0 2px 6px at 8%, 0 8px 24px at 12%).* | `0px 0px 0px 1px #1e1e1e14, 0px 2px 6px #1e1e1e14, 0px 8px 24px #1e1e1e1f` | `0px 0px 0px 1px #e3e3e31f, 0px 8px 12px #0a09085c, 0px 0px 1px 1px #0a090880` |
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
| Sidebar item: hovered / selected | Navigation state. | background.neutral.subtle.hovered / background.selected (ink at 6%) + text.selected (ink) | Same tokens; selected is ink at 10%, as claude.ai |
| Sidebar peek (below 1024, floating, no scrim) | A layer over the page. | elevation.surface.overlay + elevation.shadow.overlay | elevation.surface.overlay + elevation.shadow.overlay (soft) |
| Surface (the inner box) | Where the work happens; radius --surface-radius. | elevation.surface (white), no border; the docked sidebar ends in a hairline (Notion: 1px #f0efed inset) | elevation.surface (white), no border; the sidebar ends in color.border (claude.ai: 1px black at 10%) |
| Section | Groups content inside the surface. | No fill; color.border divider (ink 8%) when needed | No fill; color.border rule (ink 12%), as claude.ai settings rows |
| Card, at rest | A flat container (ruling 2026-10-24). | elevation.surface.raised + elevation.shadow.raised: a 5% ring and a 2% wide blur, no border (Notion home cards) | elevation.surface.raised + elevation.shadow.raised: a 12% ring and a 7.5% soft drop, no border (claude.ai cards and composer) |
| Card, clickable: hovered / dragged | Lift on interaction only. | elevation.surface.raised + elevation.shadow.raised / overlay pair | elevation.shadow.overlay on hover (Atlassian allows raised-to-overlay transitions) / overlay pair |
| Well inside a card (code block, summary strip) | Recessed area. | elevation.surface.container (ink at 3%) | elevation.surface.container (ink at 3%) |
| Table and Tree | Rows on the surface. | Grid lines color.border (Notion tables: warm 7% on every cell edge); head rule color.border.bold; row hovered: background.neutral.subtle.hovered; row selected: background.selected; sticky column: elevation.shadow.overflow | Same tokens; grid lines color.border |
| Tile | A small selectable card. | background.neutral.subtle, hovered; selected: background.selected + border.selected | Same tokens |
| Popover: Menu, Popup and flag | Floating layers without a scrim. | elevation.surface.overlay + elevation.shadow.overlay, radius 12 (Notion menus) | elevation.surface.overlay + elevation.shadow.overlay, radius 14 (claude.ai menus) |
| Popover: Tooltip | A label over anything. | background.neutral.bold + text.inverse | background.neutral.bold + text.inverse |
| Overlay (scrim) | Dims the page under a modal. | color.blanket | color.blanket |
| Modal | A layer over the scrim. | elevation.surface.overlay + elevation.shadow.overlay | elevation.surface.overlay + elevation.shadow.overlay |
| Element: input | Form fields. | background.input (white) + border.input; focus: border.focused ring | Same tokens |

**Two consequences for existing rulings:**

- **Cards.** "Cards are flat at rest" holds in spirit: both benchmarks give resting cards no border, only a 1px translucent ring with a faint shadow. In Plan A the shadow is almost invisible (2%), so the card still reads flat. In Plan B it is a soft lift.
- **Modals.** "Floating layers use light-3, modals use light-4" collapses into a single `overlay` level, as in Atlassian. The blanket under a modal already sets it apart from a menu. This reverses a ruling, so it is open decision 3.

**Name clash to settle.** PLUS calls the frame the "Surface container"; Atlassian's `elevation.surface.container` is a translucent well *inside* a card. Same words, opposite ends of the stack. Open decision 6.

### 4.6 Plan A and Plan B

**How the plans were fitted.** The plans are fitted to computed styles read from both apps on 2026-10-25, in a signed-in browser, read-only.

- **Claude** (claude.ai, color v2):
  - views: a chat, a project, the artifacts gallery and the new-chat page;
  - layers: the model menu and the settings modal;
  - dark: forced on the page for measurement, so its values are approximate.
- **Notion** (app.notion.com):
  - views: home, a table database, a doc page and the docked sidebar;
  - layers: the search modal and a popover.
  - Notion's dark theme could not be switched on without changing Bill's settings, so it is **unverified**.

For each view, the probe recorded:

- backgrounds by area;
- every border, radius and box shadow;
- text colors and type.

**What the two apps share.** This is the pattern to copy, whichever plan wins.

1. **A white page on a barely-gray docked sidebar.** Notion's sidebar is `#f9f8f7`, ending in a 1px `#f0efed` inset line. Claude's is `#fafafa`, ending in a 1px line of black at 10%.
2. **Lines, hovers and selections are translucent ink, not opaque grays.**
   - Notion: dividers and table grids at 7% warm ink (`rgba(42,28,0,.07)`); hover and selected tabs at 4–5%.
   - Claude: rules and edges at 8–12% black; selected sidebar item at 10%; chips at 5%.
3. **Cards and floating layers have no border.** Their edge is a 1px translucent ring (`0 0 0 1px`) plus a soft shadow:
   - Notion home cards: 5% ring, `0 12px 32px` at 2%.
   - Notion popovers: 7% ring, `0 5px 8px` at 3%, `0 20px 24px` at 5%.
   - Claude composer and cards: 12% ring, `0 4px 20px` at 7.5%.
   - Claude menus: 8% ring, `0 2px 6px` at 8%, `0 8px 24px` at 12%.

   This is Atlassian's paired surface-and-shadow model with the ring built into the shadow.
4. **Text is three or four levels of one ink.**
   - Notion: `#2c2c2b`, `#5f5e59`, `#7d7a75`, `#a19e99`.
   - Claude: black at 90%, 60%, 47% and 40%.
   - Both put tertiary text below 4.5:1 (`#7d7a75` is 4.2:1; black at 47% is about 3.5:1). PLUS's `text.subtlest` stays at 4.85:1 on purpose.
5. **One saturated accent; categories are pastel tints.**
   - Notion's primary button is blue `#2783de`; Claude's is near-black, with blue `#257de0` for interaction.
   - Tags are a hue at 8–13% alpha (Notion) or 12–16% mixed into white (Claude).
6. **Radii scale with the object.** Controls 6–8px, menus 12–14px, cards 16px. Modals are 12px in Claude and 20px in Notion's search.
7. **Modals are quiet.**
   - Claude's settings modal has only an 8% ring and its small card shadow over a black 40% blanket.
   - Notion's search modal is the one heavy shadow seen: `0 24px 48px` at 24%.

**Where they differ.** This is what the two plans now express:

| | Plan A · Paper (toward Notion) | Plan B · Neutral (toward Claude) |
|---|---|---|
| Ink temperature | warm: hue 85°, chroma ≤ 0.008; lines tinted brown like Notion's `rgba(42,28,0,…)` | none: chroma 0, black-based alphas like Claude's |
| Sidebar | `#f9f8f7`, hairline edge | `#f8f8f8`, `color.border` edge |
| `color.border` (lines, grids, rules) | ink at 8% | ink at 12% |
| `color.background.selected` | ink at 6% | ink at 10% |
| `elevation.shadow.raised` (cards) | 5% ring + `0 12px 32px` at 2%: barely there | 12% ring + `0 4px 20px` at 7.5%: a visible soft lift |
| `elevation.shadow.overlay` (menus, modals) | 7% ring + `0 5px 8px` 3% + `0 20px 24px` 5% | 8% ring + `0 2px 6px` 8% + `0 8px 24px` 12% |
| Overall | lighter, paper-like, structure from faint warm lines | slightly firmer, cooler, structure from rings and soft shadow |

In both plans:

- the page is white, cards have no border, and selection is translucent ink;
- Lagoon marks actions, links and focus;
- the hue ramps, token names and contrast guarantees are shared. The token map changes only `color.border`, `color.background.selected` and the two shadows, beyond the gray ramp.

**Neutral ramps, light** (0 to 1100):

- Plan A: `#ffffff #f9f8f7 #f3f1ef #e0dedc #bab8b5 #928f8a #827f7b #706d69 #555350 #3f3d3b #2c2b2a #1f1e1e`
- Plan B: `#ffffff #f8f8f8 #f1f1f1 #dedede #b8b8b8 #8f8f8f #7f7f7f #6d6d6d #535353 #3d3d3d #2b2b2b #1e1e1e`

Dark ramps, OKLCH values and alphas are in Appendix A. Dark mode in both apps follows Atlassian's rule that surfaces lighten as they rise. Claude's measured approximately:

- the page is `#191919` and the sidebar `#1f1f1f`;
- text is white at 93%, 57% and 40%;
- lines are white at 10%.

**Contrast.** Both plans pass every pair; the thinnest margins are shared:

- `color.text.brand` on its subtlest tint: 4.60:1;
- `color.border.input`: about 3.2:1;
- `color.text.subtlest` on the sunken frame: 4.85:1.

**Recommendation: Plan A, with a caveat.** The plans are now close.

- **For Plan A.** Its lighter, warm lines suit dense tutor tables and forms.
- **For Plan B.** Its firmer card lift reads better on large dashboards.

A cheap hybrid is Plan A's warm ink with Plan B's raised shadow for clickable cards. Bill should compare both on the same screen in the artifact.

### 4.7 Contrast of the key pairs

WCAG 2 ratios on opaque values, computed from the generated hex. Alpha tokens are composited over their surface first. Text needs 4.5:1 and icons and borders 3:1; with increased contrast (IC), 7:1 and 4.5:1. Every pair clears its bar in all four modes and both plans.

| Foreground | Background | Bar (IC bar) | A light | A dark | A light IC | A dark IC | B light | B dark | B light IC | B dark IC |
|---|---|---|---|---|---|---|---|---|---|---|
| `color.text.subtlest` | `elevation.surface.raised` | 4.5 (7) | 5.15 | 5.45 | 10.81 | 8.53 | 5.17 | 5.45 | 10.86 | 8.53 |
| `color.text.subtle` | `elevation.surface.sunken` | 4.5 (7) | 7.23 | 7.81 | 14.13 | 11.51 | 7.24 | 7.81 | 14.16 | 11.51 |
| `color.text` | `elevation.surface.sunken` | 4.5 (7) | 13.32 | 11.51 | 16.63 | 13.97 | 13.33 | 11.51 | 16.67 | 13.97 |
| `color.border.input` | `color.background.input` | 3 (4.5) | 3.22 | 4.03 | 7.67 | 6.76 | 3.23 | 4.04 | 7.69 | 6.76 |
| `color.text` | `elevation.surface` | 4.5 (7) | 14.13 | 10.72 | 16.63 | 13.02 | 14.16 | 10.70 | 16.67 | 12.99 |
| `color.text.subtle` | `elevation.surface` | 4.5 (7) | 7.67 | 7.28 | 14.13 | 10.72 | 7.69 | 7.26 | 14.16 | 10.70 |
| `color.text.subtlest` | `elevation.surface` | 4.5 (7) | 5.15 | 5.87 | 10.81 | 9.18 | 5.17 | 5.85 | 10.86 | 9.16 |
| `color.text.subtlest` | `elevation.surface.sunken` | 4.5 (7) | 4.85 | 6.29 | 10.81 | 9.85 | 4.87 | 6.29 | 10.86 | 9.85 |
| `color.text` | `elevation.surface.overlay` | 4.5 (7) | 14.13 | 9.08 | 16.63 | 11.03 | 14.16 | 9.09 | 16.67 | 11.03 |
| `color.text.brand` | `elevation.surface` | 4.5 (7) | 5.00 | 6.72 | 11.81 | 13.02 | 5.00 | 6.72 | 11.81 | 13.01 |
| `color.link` | `elevation.surface` | 4.5 (7) | 5.00 | 6.72 | 11.81 | 13.02 | 5.00 | 6.72 | 11.81 | 13.01 |
| `color.text.inverse` | `color.background.brand.bold` | 4.5 (7) | 5.00 | 6.72 | 11.81 | 13.02 | 5.00 | 6.72 | 11.81 | 13.01 |
| `color.text.inverse` | `color.background.selected.bold` | 4.5 (7) | 14.13 | 10.72 | 14.13 | 10.72 | 14.16 | 10.70 | 14.16 | 10.70 |
| `color.text.inverse` | `color.background.danger.bold` | 4.5 (7) | 5.01 | 6.65 | 11.81 | 13.06 | 5.00 | 6.66 | 11.88 | 13.05 |
| `color.text.inverse` | `color.background.success.bold` | 4.5 (7) | 5.06 | 6.67 | 11.81 | 13.00 | 5.02 | 6.67 | 11.83 | 12.96 |
| `color.text.inverse` | `color.background.information.bold` | 4.5 (7) | 5.00 | 6.62 | 11.82 | 13.02 | 5.01 | 6.67 | 11.88 | 13.03 |
| `color.text.inverse` | `color.background.discovery.bold` | 4.5 (7) | 5.00 | 6.67 | 11.82 | 13.02 | 5.01 | 6.63 | 11.82 | 12.96 |
| `color.text.inverse` | `color.background.neutral.bold` | 4.5 (7) | 14.13 | 10.72 | 14.13 | 10.72 | 14.16 | 10.70 | 14.16 | 10.70 |
| `color.text.warning.inverse` | `color.background.warning.bold` | 4.5 (7) | 7.43 | 8.77 | 11.77 | 13.98 | 7.44 | 8.76 | 11.78 | 14.00 |
| `color.text.selected` | `color.background.selected` | 4.5 (7) | 12.62 | 8.83 | 14.86 | 10.72 | 11.56 | 8.23 | 13.61 | 9.99 |
| `color.text.brand` | `color.background.brand.subtlest` | 4.5 (7) | 4.60 | 5.59 | 10.87 | 10.82 | 4.60 | 5.59 | 10.87 | 10.82 |
| `color.text.danger` | `color.background.danger` | 4.5 (7) | 5.94 | 7.39 | 10.95 | 11.01 | 5.97 | 7.35 | 11.01 | 10.97 |
| `color.text.warning` | `color.background.warning` | 4.5 (7) | 5.90 | 7.38 | 10.88 | 10.97 | 5.94 | 7.37 | 10.90 | 10.96 |
| `color.text.success` | `color.background.success` | 4.5 (7) | 5.97 | 7.39 | 10.90 | 10.95 | 5.95 | 7.42 | 10.91 | 10.96 |
| `color.text.information` | `color.background.information` | 4.5 (7) | 5.98 | 7.41 | 10.93 | 11.03 | 5.97 | 7.33 | 10.95 | 10.96 |
| `color.text.discovery` | `color.background.discovery` | 4.5 (7) | 5.96 | 7.38 | 10.93 | 10.94 | 5.95 | 7.43 | 10.93 | 10.90 |
| `color.text.danger.bolder` | `color.background.danger.subtler` | 4.5 (7) | 9.24 | 9.24 | 11.01 | 10.95 | 9.30 | 9.30 | 10.97 | 11.01 |
| `color.text.warning.bolder` | `color.background.warning.subtler` | 4.5 (7) | 9.19 | 9.19 | 10.97 | 10.88 | 9.20 | 9.20 | 10.96 | 10.90 |
| `color.text.success.bolder` | `color.background.success.subtler` | 4.5 (7) | 9.21 | 9.21 | 10.95 | 10.90 | 9.20 | 9.20 | 10.96 | 10.91 |
| `color.text.information.bolder` | `color.background.information.subtler` | 4.5 (7) | 9.22 | 9.22 | 11.03 | 10.93 | 9.28 | 9.28 | 10.96 | 10.95 |
| `color.text.danger` | `elevation.surface` | 4.5 (7) | 6.40 | 8.77 | 11.81 | 13.06 | 6.44 | 8.74 | 11.88 | 13.05 |
| `color.text.warning` | `elevation.surface` | 4.5 (7) | 6.38 | 8.77 | 11.77 | 13.03 | 6.42 | 8.76 | 11.78 | 13.02 |
| `color.text.success` | `elevation.surface` | 4.5 (7) | 6.47 | 8.77 | 11.81 | 13.00 | 6.46 | 8.77 | 11.83 | 12.96 |
| `color.text.information` | `elevation.surface` | 4.5 (7) | 6.47 | 8.75 | 11.82 | 13.02 | 6.47 | 8.71 | 11.88 | 13.03 |
| `color.icon` | `elevation.surface` | 3 (4.5) | 14.13 | 10.72 | 14.13 | 10.72 | 14.16 | 10.70 | 14.16 | 10.70 |
| `color.icon.subtle` | `elevation.surface` | 3 (4.5) | 7.67 | 7.28 | 10.81 | 9.18 | 7.69 | 7.26 | 10.86 | 9.16 |
| `color.icon.brand` | `elevation.surface` | 3 (4.5) | 5.00 | 6.72 | 6.39 | 8.73 | 5.00 | 6.72 | 6.39 | 8.73 |
| `color.icon.danger` | `elevation.surface` | 3 (4.5) | 5.01 | 5.20 | 5.01 | 6.65 | 5.00 | 5.20 | 5.00 | 6.66 |
| `color.icon.warning` | `elevation.surface` | 3 (4.5) | 3.90 | 8.77 | 6.38 | 8.77 | 3.89 | 8.76 | 6.42 | 8.76 |
| `color.icon.success` | `elevation.surface` | 3 (4.5) | 3.92 | 5.17 | 6.47 | 8.77 | 3.93 | 5.19 | 6.46 | 8.77 |
| `color.icon.information` | `elevation.surface` | 3 (4.5) | 3.91 | 5.20 | 6.47 | 8.75 | 3.91 | 5.17 | 6.47 | 8.71 |
| `color.icon.discovery` | `elevation.surface` | 3 (4.5) | 3.92 | 5.19 | 5.00 | 6.67 | 3.92 | 5.21 | 5.01 | 6.63 |
| `color.border.input` | `elevation.surface` | 3 (4.5) | 3.22 | 4.34 | 7.67 | 7.28 | 3.23 | 4.34 | 7.69 | 7.26 |
| `color.border.bold` | `elevation.surface` | 3 (4.5) | 3.98 | 4.34 | 7.67 | 7.28 | 4.00 | 4.34 | 7.69 | 7.26 |
| `color.border.focused` | `elevation.surface` | 3 (4.5) | 3.86 | 8.73 | 6.39 | 8.73 | 3.86 | 8.73 | 6.39 | 8.73 |
| `color.border.danger` | `elevation.surface` | 3 (4.5) | 3.91 | 5.20 | 5.01 | 6.65 | 3.91 | 5.20 | 5.00 | 6.66 |
| `color.border.warning` | `elevation.surface` | 3 (4.5) | 3.90 | 5.18 | 6.38 | 8.77 | 3.89 | 5.23 | 6.42 | 8.76 |
| `color.border.success` | `elevation.surface` | 3 (4.5) | 3.92 | 5.17 | 6.47 | 8.77 | 3.93 | 5.19 | 6.46 | 8.77 |
| `color.border.brand` | `elevation.surface` | 3 (4.5) | 5.00 | 6.72 | 6.39 | 8.73 | 5.00 | 6.72 | 6.39 | 8.73 |
| `color.border.selected` | `elevation.surface` | 3 (4.5) | 14.13 | 10.72 | 16.63 | 13.02 | 14.16 | 10.70 | 16.67 | 12.99 |

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

**Modes.** Atlassian ships two color modes, light and dark. Increased contrast is not a third mode but a second axis: `light-increased-contrast` and `dark-increased-contrast` extend their base theme and override about half its variables (§2.2). PLUS mirrors that shape: **Light** and **Dark**, each with an **increased-contrast** override, specified in §4.11.

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

1. **Two color modes only.** Light and Dark. Increased contrast exists in code but not in Figma. PLUS adds the two IC modes to its Color collection, since Figma modes are cheap and designers should see them.
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
| Primitives (hidden from publishing) | one | Lagoon, the eleven accent ramps of the chosen plan, both neutral ramps, alphas, named `teal/teal700` | ADS keeps these in a separate library; one hidden collection is simpler for one team |
| Color | Light, Dark, Light IC, Dark IC | semantic `color/…/default` and `elevation/surface/…`, with WEB code syntax `var(--ds-…)` | **scoped** (text colors to text fill, borders to stroke, backgrounds to fills) and **described** |
| Shadow colors | inside Color | `elevation/shadow/{raised,overlay,overflow}/…` | same as ADS |
| Effect styles | — | `Light/elevation.shadow.raised` … `Dark/…`, plus `Light IC/…` and `Dark IC/…` for raised and overlay, whose ring changes | ADS has no IC styles |
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

### 4.11 Increased contrast

**What it is.** An override on top of light and dark, for people who need stronger edges and text: low vision, glare, a cheap screen. Atlassian ships it as `data-contrast-mode`, with three settings: more, no preference, and auto, which follows the operating system's `prefers-contrast: more`. Its token package carries an increased-contrast value for every token, so PLUS generates the mode from those references instead of hand-picking.

**What changes.** 263 of 469 tokens change in light and 233 in dark, the same in both plans:

- **Text and icons** step darker in light and lighter in dark: `text.subtle` 800 → 1000, `text.subtlest` 700 → 900, colored text 800 → 900.
- **Borders** that carry meaning reach 4.5:1 or more: `border.input` and `border.bold` 500–600 → 800. The translucent hairline `color.border` (8% ink in Plan A, 12% in Plan B) becomes ink at 49%, which clears 3:1.
- **Bold fills** step two darker in light (brand 700 → 900) and two lighter in dark, so inverse text on them clears 7:1.
- **Selection** stays neutral; its text, icon and border go to full ink.
- **Focus** goes from teal 600 to teal 800 in light.
- **Shadows.** The 1px ring on raised and overlay layers uses the 3:1 hairline, so cards and menus keep a visible edge.
- **The sunken frame turns white**, as in Atlassian. The surface then needs an edge, so the Surface pattern draws `color.border` in this mode.

**What stays.** Tints and subtle backgrounds, surfaces, the blanket, the interaction overlays and the categorical chart colors (except where Atlassian swaps a hue for legibility).

**Bars, all met.** 7:1 for text and 4.5:1 for icons, borders and focus, for every pair in §4.7 and every accent family in §4.2, in both plans and both themes.

**Switching.** Default to the operating system setting, with a manual override in settings: the same three options Atlassian offers. Ship it with the theme toggle, after the component sweep (decision 11).

The core tokens that change, Plan A (Plan B uses the same steps on its own ramps):

| Token | Light → light IC | Dark → dark IC |
|---|---|---|
| `color.background.brand.bold` | teal.700 → teal.900 | teal.400 → teal.200 |
| `color.background.brand.bold.hovered` | teal.800 → teal.1000 | teal.300 → teal.100 |
| `color.background.brand.bold.pressed` | teal.850 → teal.1000 | teal.250 → darkNeutral.1100 |
| `color.background.danger.bold` | red.700 → red.900 | red.400 → red.200 |
| `color.background.danger.bold.hovered` | red.800 → red.1000 | red.300 → red.100 |
| `color.background.danger.bold.pressed` | red.850 → red.1000 | red.250 → darkNeutral.1100 |
| `color.background.warning.bold` | yellow.300 → yellow.900 | yellow.300 → yellow.200 |
| `color.background.warning.bold.hovered` | yellow.400 → yellow.1000 | yellow.400 → yellow.100 |
| `color.background.warning.bold.pressed` | yellow.500 → yellow.1000 | yellow.500 → darkNeutral.1100 |
| `color.background.success.bold` | green.700 → green.900 | green.400 → green.200 |
| `color.background.success.bold.hovered` | green.800 → green.1000 | green.300 → green.100 |
| `color.background.success.bold.pressed` | green.850 → green.1000 | green.250 → darkNeutral.1100 |
| `color.background.discovery.bold` | purple.700 → purple.900 | purple.400 → purple.200 |
| `color.background.discovery.bold.hovered` | purple.800 → purple.1000 | purple.300 → purple.100 |
| `color.background.discovery.bold.pressed` | purple.850 → purple.1000 | purple.250 → darkNeutral.1100 |
| `color.background.information.bold` | blue.700 → blue.900 | blue.400 → blue.200 |
| `color.background.information.bold.hovered` | blue.800 → blue.1000 | blue.300 → blue.100 |
| `color.background.information.bold.pressed` | blue.850 → blue.1000 | blue.250 → darkNeutral.1100 |
| `color.border` | ink @8% → neutralAlpha.500 | paper @10% → darkNeutralAlpha.500 |
| `color.border.disabled` | neutralAlpha.200 → neutralAlpha.300 | darkNeutralAlpha.200 → darkNeutralAlpha.300 |
| `color.border.focused` | teal.600 → teal.800 | teal.300 → teal.300 |
| `color.border.input` | neutral.500 → neutral.800 | darkNeutral.600 → darkNeutral.800 |
| `color.border.selected` | neutral.1000 → neutral.1100 | darkNeutral.1000 → darkNeutral.1100 |
| `color.border.brand` | teal.700 → teal.800 | teal.400 → teal.300 |
| `color.border.danger` | red.600 → red.700 | red.500 → red.400 |
| `color.border.warning` | yellow.600 → yellow.800 | yellow.500 → yellow.300 |
| `color.border.success` | green.600 → green.800 | green.500 → green.300 |
| `color.border.discovery` | purple.600 → purple.700 | purple.500 → purple.400 |
| `color.border.information` | blue.600 → blue.800 | blue.500 → blue.300 |
| `color.border.bold` | neutral.600 → neutral.800 | darkNeutral.600 → darkNeutral.800 |
| `color.text` | neutral.1000 → neutral.1100 | darkNeutral.1000 → darkNeutral.1100 |
| `color.text.selected` | neutral.1000 → neutral.1100 | darkNeutral.1000 → darkNeutral.1100 |
| `color.text.brand` | teal.700 → teal.900 | teal.400 → teal.200 |
| `color.text.danger` | red.800 → red.900 | red.300 → red.200 |
| `color.text.danger.bolder` | red.900 → red.1000 | red.200 → red.100 |
| `color.text.warning` | yellow.800 → yellow.900 | yellow.300 → yellow.200 |
| `color.text.warning.inverse` | neutral.1000 → neutral.0 | darkNeutral.100 → darkNeutral.0 |
| `color.text.warning.bolder` | yellow.900 → yellow.1000 | yellow.200 → yellow.100 |
| `color.text.success` | green.800 → green.900 | green.300 → green.200 |
| `color.text.success.bolder` | green.900 → green.1000 | green.200 → green.100 |
| `color.text.discovery` | purple.800 → purple.900 | purple.300 → purple.200 |
| `color.text.discovery.bolder` | purple.900 → purple.1000 | purple.200 → purple.100 |
| `color.text.information` | blue.800 → blue.900 | blue.300 → blue.200 |
| `color.text.information.bolder` | blue.900 → blue.1000 | blue.200 → blue.100 |
| `color.text.subtlest` | neutral.700 → neutral.900 | darkNeutral.700 → darkNeutral.900 |
| `color.text.subtle` | neutral.800 → neutral.1000 | darkNeutral.800 → darkNeutral.1000 |
| `color.icon.selected` | neutral.1000 → neutral.1100 | darkNeutral.1000 → darkNeutral.1100 |
| `color.icon.brand` | teal.700 → teal.800 | teal.400 → teal.300 |
| `color.icon.danger` | red.700 → red.700 | red.500 → red.400 |
| `color.icon.warning` | yellow.600 → yellow.800 | yellow.300 → yellow.300 |
| `color.icon.warning.inverse` | neutral.1000 → neutral.0 | darkNeutral.100 → darkNeutral.0 |
| `color.icon.success` | green.600 → green.800 | green.500 → green.300 |
| `color.icon.discovery` | purple.600 → purple.700 | purple.500 → purple.400 |
| `color.icon.information` | blue.600 → blue.800 | blue.500 → blue.300 |
| `color.icon.subtlest` | neutral.700 → neutral.900 | darkNeutral.700 → darkNeutral.900 |
| `color.icon.subtle` | neutral.800 → neutral.900 | darkNeutral.800 → darkNeutral.900 |
| `color.link` | teal.700 → teal.900 | teal.400 → teal.200 |
| `color.link.pressed` | teal.800 → teal.900 | teal.300 → teal.200 |
| `elevation.surface.sunken` | neutral.100 → neutral.0 | darkNeutral.0 → darkNeutral.0 |

## 5. Open decisions for Bill

Each needs Bill's call, and each has a recommendation. The brand hue is settled: Lagoon, 205°.

1. **Plan A (Paper) or Plan B (Neutral).** Each is now a whole direction: grays, lines, shadows and the accent palette (§4.2, §4.6). *Recommend A*, or a hybrid with Plan B's soft shadows on cards and overlays. Plan A's accents also keep Lagoon the most saturated cool color, which fits a teal brand; Plan B's would outshout it. The plans' grays and accents can be mixed, since token names are shared. Compare them on the same screen in the artifact before deciding.
2. **Selection color.** Both plans now select in neutral ink, as Notion, today's Claude and Atlassian's Finesse override do. The alternative is the teal tint, Atlassian's default. *Recommend neutral.* It keeps Lagoon for actions, links and focus.
3. **Modal elevation.** Collapse "modals use light-4" into the single `overlay` level, as Atlassian does, or keep a separate modal shadow. *Recommend collapsing.* The blanket already separates a modal from a menu. This reverses a ruling.
4. **Dragged items.** Overlay, as Atlassian specifies, or raised. *Recommend overlay.* A dragged card is above everything else on the page.
5. **Secondary and tertiary.** Drop both as roles. *Recommend dropping.* Secondary becomes `text.subtle` and `background.neutral`; tertiary becomes an accent. Bill's Atlassian model (one brand, functional colors, accents) already implies this.
6. **"Surface container" name clash.** PLUS's frame pattern versus Atlassian's `elevation.surface.container` well. *Recommend renaming PLUS's pattern* to "Frame" in docs and keeping Atlassian's token name, so Atlassian's guidance reads across unchanged. The alternative is to rename the token `elevation.surface.well`.
7. **Information hue.** Move info from the teal tertiary to blue. *Recommend blue.* With a Lagoon brand, a teal info reads as brand. This reverses the 2026-10-24 ruling.
8. **Information blue's chroma.** Now set per plan: 0.10 in Plan A, close to Lagoon, as Notion's blue is muted; 0.16 in Plan B, as Claude's. *Recommend following the plan.* Iteration 2's shared 0.13 was a compromise between the two.
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
    - all four modes defined in the tokens and in Figma now, including increased contrast (§4.11), and shipped together with the theme toggle after the sweep;
    - the generator in the repo as the source of truth, emitting SCSS and the Figma collections in §4.10;
    - the `--ds-` CSS prefix.

12. **Brown.** Add it as an eleventh accent, from Notion. *Recommend adding.* It is a quiet, warm option for tags and categories, and costs one ramp and 23 tokens.
13. **Accent teal on its own ramp.** Atlassian's accent teal shares the brand's hue family; with Lagoon as brand, a teal tag would read as a brand control. *Recommend the separate ramp* (190° in Plan A, 170° in Plan B). The alternative is dropping accent teal, which breaks Atlassian's set.
14. **Lime.** Neither Notion nor Claude has it. *Recommend keeping it*, so Atlassian's accent and chart tokens stay complete and charts have an eighth distinct hue.

Still out of scope and still Bill's: the AI hue (#269). Atlassian's discovery purple is where it would go if he wants one; Claude uses its clay brand and Atlassian its Rovo tokens, which this proposal leaves out.

## 6. If approved: the work, in order

1. Commit the generator and its tests, emitting `_palette.scss`, `_semantic.scss` and `_elevation.scss` beside today's files, for the chosen plan, with light, dark and both increased-contrast modes.
2. Push Primitives and Color collections (four modes), and the shadow styles, to the BS4 Foundation library, unpublished until Bill publishes.
3. Alias today's `--color-*` and `--elevation-light-*` tokens to the new ones, so nothing changes visually except brand, neutrals and shadows.
4. Sweep components onto `--ds-*` names by pattern, from the frame down to the layers, retiring the 117 state-layer tokens and the hard-coded shadows as they empty.
5. Update `design-system/guidelines/foundations/` color and elevation docs and the generated agent views.

Each step is its own ticket; step 4 splits per pattern.

## Appendix A: Primitive ramps


**Plan A hue ramps, part 1 (teal is Lagoon, shared by both plans; aqua is the accent teal)** (hex · contrast on white)

| Step | teal | blue | aqua | green | lime | yellow |
|---|---|---|---|---|---|---|
| 100 | `#e6f9fc` 1.09 | `#eff7ff` 1.08 | `#ebf9f7` 1.08 | `#eff8f2` 1.08 | `#f5f7ee` 1.08 | `#faf6e9` 1.08 |
| 200 | `#c0ebf0` 1.28 | `#d1e6f8` 1.28 | `#cde9e7` 1.28 | `#d4e8db` 1.28 | `#e0e5d1` 1.29 | `#ede3c6` 1.28 |
| 250 | `#9cdae1` 1.55 | `#b7d3ec` 1.55 | `#b0d7d4` 1.55 | `#bad6c5` 1.55 | `#cbd3b7` 1.55 | `#dfcea7` 1.55 |
| 300 | `#70c9d4` 1.91 | `#9ac0e2` 1.91 | `#8fc6c2` 1.90 | `#9ec5ad` 1.90 | `#b6c09a` 1.91 | `#d3b984` 1.90 |
| 400 | `#23b5c2` 2.48 | `#77a8d3` 2.52 | `#67b0ac` 2.51 | `#7caf91` 2.50 | `#9da978` 2.51 | `#c39e59` 2.51 |
| 500 | `#1d9eab` 3.22 | `#5895c8` 3.21 | `#3e9e99` 3.20 | `#5e9c79` 3.23 | `#88965a` 3.20 | `#b7872b` 3.22 |
| 600 | `#198f9a` 3.86 | `#4886b8` 3.91 | `#2a8e89` 3.94 | `#4f8d6b` 3.92 | `#79874c` 3.90 | `#a77916` 3.90 |
| 700 | `#147b84` 5.00 | `#3a74a2` 5.00 | `#1c7c77` 5.00 | `#407a5b` 5.06 | `#68743d` 5.06 | `#916812` 5.01 |
| 800 | `#106972` 6.39 | `#31628a` 6.47 | `#166965` 6.48 | `#36684d` 6.47 | `#586334` 6.46 | `#7c590d` 6.38 |
| 850 | `#0a545a` 8.65 | `#254e6f` 8.76 | `#0f5451` 8.72 | `#2a533d` 8.74 | `#464f28` 8.72 | `#644609` 8.67 |
| 900 | `#063e43` 11.81 | `#1a3a54` 11.82 | `#063e3c` 11.92 | `#1d3e2c` 11.81 | `#333a1b` 11.92 | `#4a3405` 11.77 |
| 1000 | `#043236` 13.86 | `#182d3f` 14.13 | `#10302f` 14.13 | `#1b3024` 14.05 | `#292e1a` 14.00 | `#39290b` 14.04 |

**Plan A hue ramps, part 2** (hex · contrast on white)

| Step | orange | red | magenta | purple | brown |
|---|---|---|---|---|---|
| 100 | `#fff4ec` 1.08 | `#fff4f2` 1.08 | `#fff3f8` 1.08 | `#f9f4ff` 1.08 | `#fdf4f0` 1.08 |
| 200 | `#fdddc3` 1.29 | `#fedcd7` 1.28 | `#fedae9` 1.28 | `#ecdef9` 1.28 | `#f2e0d5` 1.28 |
| 250 | `#f3c7a3` 1.55 | `#fdc2ba` 1.54 | `#f7c0d9` 1.56 | `#dbc8ed` 1.56 | `#e4cabc` 1.56 |
| 300 | `#ecaf7e` 1.91 | `#fba69c` 1.90 | `#f0a6c8` 1.91 | `#ccb2e3` 1.90 | `#d7b5a2` 1.91 |
| 400 | `#df9252` 2.51 | `#ef867b` 2.51 | `#e387b4` 2.50 | `#b797d4` 2.50 | `#c59b82` 2.50 |
| 500 | `#d5781c` 3.21 | `#e7685e` 3.21 | `#d86ba3` 3.21 | `#a77fca` 3.22 | `#b78566` 3.20 |
| 600 | `#c16b16` 3.90 | `#d6584f` 3.91 | `#c75c93` 3.90 | `#9870ba` 3.92 | `#a77659` 3.90 |
| 700 | `#a75c12` 5.02 | `#bd4941` 5.01 | `#af4d80` 5.00 | `#8560a3` 5.00 | `#92654a` 5.02 |
| 800 | `#904e0e` 6.40 | `#a23e37` 6.40 | `#96416e` 6.41 | `#71518c` 6.45 | `#7d563f` 6.41 |
| 850 | `#733e09` 8.67 | `#82302a` 8.73 | `#793257` 8.73 | `#5a4070` 8.74 | `#644431` 8.70 |
| 900 | `#562d05` 11.84 | `#63221e` 11.81 | `#5b2441` 11.84 | `#432f55` 11.82 | `#4b3222` 11.81 |
| 1000 | `#442307` 14.10 | `#4a1e1b` 14.07 | `#451f32` 14.05 | `#342640` 14.03 | `#39281e` 14.04 |

**Plan B hue ramps, part 1** (hex · contrast on white)

| Step | blue | aqua | green | lime | yellow |
|---|---|---|---|---|---|
| 100 | `#f1f6ff` 1.08 | `#e9faf3` 1.08 | `#eafaea` 1.08 | `#f1f9e6` 1.08 | `#fff5e4` 1.08 |
| 200 | `#d3e5fe` 1.28 | `#c5ebdd` 1.29 | `#c9ecc9` 1.29 | `#dae9c0` 1.28 | `#f6e1ba` 1.28 |
| 250 | `#b3d2fd` 1.55 | `#a4dbc7` 1.55 | `#aadcab` 1.55 | `#c3d79f` 1.55 | `#eccb95` 1.55 |
| 300 | `#91befc` 1.91 | `#7dcbb1` 1.90 | `#88cc8a` 1.90 | `#abc576` 1.91 | `#e4b469` 1.90 |
| 400 | `#6ba6f5` 2.50 | `#59b496` 2.50 | `#67b56b` 2.50 | `#91ae53` 2.50 | `#d19941` 2.52 |
| 500 | `#4790f0` 3.22 | `#1da380` 3.18 | `#3fa348` 3.21 | `#7a9b1d` 3.21 | `#c1841a` 3.19 |
| 600 | `#3881df` 3.91 | `#199173` 3.93 | `#2c9338` 3.93 | `#6d8c15` 3.88 | `#ae7616` 3.89 |
| 700 | `#2b6fc6` 5.01 | `#147f63` 4.95 | `#1e802c` 5.02 | `#5e7911` 4.98 | `#966612` 4.99 |
| 800 | `#235ea9` 6.47 | `#106b54` 6.46 | `#186d24` 6.46 | `#50660d` 6.47 | `#81560d` 6.42 |
| 850 | `#1a4b89` 8.71 | `#0a5542` 8.78 | `#11571b` 8.74 | `#3f5108` 8.78 | `#674409` 8.72 |
| 900 | `#103768` 11.88 | `#063f30` 11.92 | `#084111` 11.83 | `#2e3c05` 11.90 | `#4e3205` 11.78 |
| 1000 | `#142c4d` 14.03 | `#083227` 14.04 | `#113213` 14.10 | `#242f07` 14.14 | `#3e2703` 14.03 |

**Plan B hue ramps, part 2** (hex · contrast on white)

| Step | orange | red | magenta | purple | brown |
|---|---|---|---|---|---|
| 100 | `#fff4ee` 1.08 | `#fff4f2` 1.08 | `#fff3f7` 1.08 | `#f6f5ff` 1.08 | `#fff4f0` 1.08 |
| 200 | `#feddca` 1.28 | `#fedcd8` 1.28 | `#fedbe5` 1.27 | `#e2e0fe` 1.29 | `#f8ded2` 1.28 |
| 250 | `#fdc4a3` 1.54 | `#fdc2bc` 1.54 | `#fdbed2` 1.56 | `#cecafd` 1.56 | `#ecc8b7` 1.55 |
| 300 | `#fca87b` 1.90 | `#fca59e` 1.91 | `#fca1c0` 1.91 | `#bbb5fc` 1.89 | `#e1b299` 1.90 |
| 400 | `#ea8b5b` 2.52 | `#f4837c` 2.50 | `#ea84a9` 2.51 | `#a397f9` 2.51 | `#cd987e` 2.50 |
| 500 | `#e26f35` 3.20 | `#ec645f` 3.20 | `#e16696` 3.21 | `#917ff5` 3.20 | `#c08161` 3.20 |
| 600 | `#d15f22` 3.91 | `#da5450` 3.91 | `#cf5787` 3.91 | `#836fe4` 3.92 | `#b07253` 3.90 |
| 700 | `#b85014` 5.01 | `#c14543` 5.00 | `#b74875` 5.00 | `#715fca` 5.01 | `#9a6144` 5.04 |
| 800 | `#9e430f` 6.43 | `#a53a37` 6.44 | `#9d3c63` 6.44 | `#6150ae` 6.43 | `#84533a` 6.40 |
| 850 | `#7f3409` 8.76 | `#852d2b` 8.72 | `#7e2f4f` 8.73 | `#4d3f8c` 8.73 | `#6a412d` 8.73 |
| 900 | `#602605` 11.82 | `#651f1e` 11.88 | `#60213b` 11.81 | `#392e6b` 11.82 | `#4f301f` 11.83 |
| 1000 | `#48210e` 14.01 | `#4c1d1b` 14.01 | `#481e2d` 14.01 | `#2c264f` 14.03 | `#3c271c` 14.01 |

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

Each cell is `primitive hex` for light / dark. "same as A" means Plan B uses Plan A's values. Accent, chart and code tokens are summarized at the end; the full set of 469 in all four modes is in `semantics_A.json` and `semantics_B.json` with the generator. Shadows are in §4.4; raised and overlay also have increased-contrast variants whose 1px ring is ink at 49%.


#### Text

| Token | For | Plan A light / dark | Plan B light / dark |
|---|---|---|---|
| `color.text` | Primary text, such as body copy, sentence case headers, and buttons | neutral.1000 `#2c2b2a` / darkNeutral.1000 `#d0cfce` | neutral.1000 `#2b2b2b` / darkNeutral.1000 `#cfcfcf` |
| `color.text.disabled` | Text in a disabled state | neutralAlpha.400 `#1f1e1e4f` / darkNeutralAlpha.400 `#e4e3e247` | neutralAlpha.400 `#1e1e1e4f` / darkNeutralAlpha.400 `#e3e3e347` |
| `color.text.inverse` | Text on bold backgrounds | neutral.0 `#ffffff` / darkNeutral.100 `#1e1e1d` | neutral.0 `#ffffff` / darkNeutral.100 `#1e1e1e` |
| `color.text.selected` | Text that communicates selection, such as the active tab or a selected navigation item, or the opened state of a dropdown trigger. On bold selected backgrounds, use color.text.inverse instead. Do not use for unselected links, brand emphasis, or hover alone. Keep the selected text treatment when the element also has focus *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: selection is neutral, as on claude.ai (ink at 5%) and in Atlassian's FY27 Finesse override.* | neutral.1000 `#2c2b2a` / darkNeutral.1000 `#d0cfce` | neutral.1000 `#2b2b2b` / darkNeutral.1000 `#cfcfcf` |
| `color.text.brand` | Text that reinforces our brand | teal.700 `#147b84` / teal.400 `#23b5c2` | same as A |
| `color.text.danger` | Critical text, such as input field error messaging | red.800 `#a23e37` / red.300 `#fba69c` | red.800 `#a53a37` / red.300 `#fca59e` |
| `color.text.danger.bolder` | Text on top of danger semantic labels to ensure accessibility and desired visual appearance | red.900 `#63221e` / red.200 `#fedcd7` | red.900 `#651f1e` / red.200 `#fedcd8` |
| `color.text.warning` | Text to emphasize caution, such as in moved lozenges | yellow.800 `#7c590d` / yellow.300 `#d3b984` | yellow.800 `#81560d` / yellow.300 `#e4b469` |
| `color.text.warning.inverse` | Text when on bold warning backgrounds | neutral.1000 `#2c2b2a` / darkNeutral.100 `#1e1e1d` | neutral.1000 `#2b2b2b` / darkNeutral.100 `#1e1e1e` |
| `color.text.warning.bolder` | Text on top of warning semantic labels to ensure accessibility and desired visual appearance | yellow.900 `#4a3405` / yellow.200 `#ede3c6` | yellow.900 `#4e3205` / yellow.200 `#f6e1ba` |
| `color.text.success` | Text to communicate a favorable outcome, such as input field success messaging | green.800 `#36684d` / green.300 `#9ec5ad` | green.800 `#186d24` / green.300 `#88cc8a` |
| `color.text.success.bolder` | Text on top of success semantic labels to ensure accessibility and desired visual appearance | green.900 `#1d3e2c` / green.200 `#d4e8db` | green.900 `#084111` / green.200 `#c9ecc9` |
| `color.text.discovery` | Text to emphasize change or something new, such as in new lozenges | purple.800 `#71518c` / purple.300 `#ccb2e3` | purple.800 `#6150ae` / purple.300 `#bbb5fc` |
| `color.text.discovery.bolder` | Text on top of discovery semantic labels to ensure accessibility and desired visual appearance | purple.900 `#432f55` / purple.200 `#ecdef9` | purple.900 `#392e6b` / purple.200 `#e2e0fe` |
| `color.text.information` | Informative text or to communicate something is in progress, such as in-progress lozenges | blue.800 `#31628a` / blue.300 `#9ac0e2` | blue.800 `#235ea9` / blue.300 `#91befc` |
| `color.text.information.bolder` | Text on top of information semantic labels to ensure accessibility and desired visual appearance | blue.900 `#1a3a54` / blue.200 `#d1e6f8` | blue.900 `#103768` / blue.200 `#d3e5fe` |
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
| `color.icon.danger` | Icons communicating critical information, such as those used in error handing | red.700 `#bd4941` / red.500 `#e7685e` | red.700 `#c14543` / red.500 `#ec645f` |
| `color.icon.warning` | Icons communicating caution, such as those used in warning section messages | yellow.600 `#a77916` / yellow.300 `#d3b984` | yellow.600 `#ae7616` / yellow.300 `#e4b469` |
| `color.icon.warning.inverse` | Icons when on bold warning backgrounds | neutral.1000 `#2c2b2a` / darkNeutral.100 `#1e1e1d` | neutral.1000 `#2b2b2b` / darkNeutral.100 `#1e1e1e` |
| `color.icon.success` | Icons communicating a favorable outcome, such as those used in success section messaged | green.600 `#4f8d6b` / green.500 `#5e9c79` | green.600 `#2c9338` / green.500 `#3fa348` |
| `color.icon.discovery` | Icons communicating change or something new, such as discovery section messages | purple.600 `#9870ba` / purple.500 `#a77fca` | purple.600 `#836fe4` / purple.500 `#917ff5` |
| `color.icon.information` | Icons communicating information or something in-progress, such as information section messages | blue.600 `#4886b8` / blue.500 `#5895c8` | blue.600 `#3881df` / blue.500 `#4790f0` |
| `color.icon.subtlest` | Icons paired with color.text.subtlest | neutral.700 `#706d69` / darkNeutral.700 `#9a9998` | neutral.700 `#6d6d6d` / darkNeutral.700 `#999999` |
| `color.icon.subtle` | Icons paired with color.text.subtle | neutral.800 `#555350` / darkNeutral.800 `#acabaa` | neutral.800 `#535353` / darkNeutral.800 `#ababab` |

#### Border

| Token | For | Plan A light / dark | Plan B light / dark |
|---|---|---|---|
| `color.border` | Use to visually group or separate UI elements, such as flat cards or side panel dividers *Plan A: Notion draws dividers and table grids at about 7% warm ink (#f0efed on white); 8% here. Plan B: claude.ai draws rules and card edges at 8-12% black and dark borders at 10% white.* | ink @8% `#1f1e1e14` / paper @10% `#e4e3e21a` | ink @12% `#1e1e1e1f` / paper @10% `#e3e3e31a` |
| `color.border.disabled` | Borders of elements in a disabled state | neutralAlpha.200 `#1f1e1e0f` / darkNeutralAlpha.200 `#e4e3e214` | neutralAlpha.200 `#1e1e1e0f` / darkNeutralAlpha.200 `#e3e3e314` |
| `color.border.focused` | The focus ring or border of an element that currently has keyboard or input focus. Do not use to indicate selection or hover alone. When an element is both selected and focused, keep its selected treatment and add a separate focus indicator *One step darker than Atlassian (500), for margin: 3.9:1 on white instead of 3.2:1.* | teal.600 `#198f9a` / teal.300 `#70c9d4` | same as A |
| `color.border.input` | Borders of form UI elements, such as text fields, checkboxes, and radio buttons | neutral.500 `#928f8a` / darkNeutral.600 `#828281` | neutral.500 `#8f8f8f` / darkNeutral.600 `#828282` |
| `color.border.input.search` | The border of search inputs | neutralAlpha.300 `#1f1e1e24` / darkNeutralAlpha.300 `#e4e3e229` | neutralAlpha.300 `#1e1e1e24` / darkNeutralAlpha.300 `#e3e3e329` |
| `color.border.inverse` | Borders on bold backgrounds | neutral.0 `#ffffff` / darkNeutral.0 `#181716` | neutral.0 `#ffffff` / darkNeutral.0 `#171717` |
| `color.border.selected` | Borders or visual indicators that communicate selection, such as the active tab or a selected menu item, or the opened state of a dropdown trigger. Do not use as a keyboard focus indicator; use color.border.focused for focus and preserve the selected treatment when both states apply *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: selection is neutral, as on claude.ai (ink at 5%) and in Atlassian's FY27 Finesse override.* | neutral.1000 `#2c2b2a` / darkNeutral.1000 `#d0cfce` | neutral.1000 `#2b2b2b` / darkNeutral.1000 `#cfcfcf` |
| `color.border.brand` | Borders or visual indicators of elements that reinforce our brand, such as logos or primary buttons | teal.700 `#147b84` / teal.400 `#23b5c2` | same as A |
| `color.border.danger` | Borders communicating critical information, such as the borders on invalid text fields | red.600 `#d6584f` / red.500 `#e7685e` | red.600 `#da5450` / red.500 `#ec645f` |
| `color.border.danger.subtle` | Decorative danger borders that do not need to meet 3:1 contrast requirements | red.300 `#fba69c` / red.800 `#a23e37` | red.300 `#fca59e` / red.800 `#a53a37` |
| `color.border.warning` | Borders communicating caution | yellow.600 `#a77916` / yellow.500 `#b7872b` | yellow.600 `#ae7616` / yellow.500 `#c1841a` |
| `color.border.warning.subtle` | Decorative warning borders that do not need to meet 3:1 contrast requirements | yellow.300 `#d3b984` / yellow.800 `#7c590d` | yellow.300 `#e4b469` / yellow.800 `#81560d` |
| `color.border.success` | Borders communicating a favorable outcome, such as the borders on validated text fields | green.600 `#4f8d6b` / green.500 `#5e9c79` | green.600 `#2c9338` / green.500 `#3fa348` |
| `color.border.success.subtle` | Decorative success borders that do not need to meet 3:1 contrast requirements | green.300 `#9ec5ad` / green.800 `#36684d` | green.300 `#88cc8a` / green.800 `#186d24` |
| `color.border.discovery` | Borders communicating change or something new, such as the borders in onboarding spotlights | purple.600 `#9870ba` / purple.500 `#a77fca` | purple.600 `#836fe4` / purple.500 `#917ff5` |
| `color.border.discovery.subtle` | Decorative discovery borders that do not need to meet 3:1 contrast requirements | purple.300 `#ccb2e3` / purple.800 `#71518c` | purple.300 `#bbb5fc` / purple.800 `#6150ae` |
| `color.border.information` | Borders communicating information or something in-progress | blue.600 `#4886b8` / blue.500 `#5895c8` | blue.600 `#3881df` / blue.500 `#4790f0` |
| `color.border.information.subtle` | Decorative information borders that do not need to meet 3:1 contrast requirements | blue.300 `#9ac0e2` / blue.800 `#31628a` | blue.300 `#91befc` / blue.800 `#235ea9` |
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
| `color.background.selected` | The background of an element that communicates selection, such as a selected navigation item, or the opened state of a dropdown trigger. Use color.background.selected.hovered or color.background.selected.pressed when interacting with a selected element. Selection is distinct from keyboard focus and hover alone *Plan A: selection is neutral, as in Notion and Atlassian's FY27 Finesse override. Plan B: claude.ai marks the selected sidebar item with black at 10%.* | neutralAlpha.200 `#1f1e1e0f` / darkNeutralAlpha.200 `#e4e3e214` | ink @10% `#1e1e1e1a` / paper @10% `#e3e3e31a` |
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
| `color.background.danger` | Backgrounds communicating critical information, such in error section messages | red.100 `#fff4f2` / red.1000 `#4a1e1b` | red.100 `#fff4f2` / red.1000 `#4c1d1b` |
| `color.background.danger.hovered` | Hovered state for color.background.danger | red.200 `#fedcd7` / red.900 `#63221e` | red.200 `#fedcd8` / red.900 `#651f1e` |
| `color.background.danger.pressed` | Pressed state for color.background.danger | red.250 `#fdc2ba` / red.850 `#82302a` | red.250 `#fdc2bc` / red.850 `#852d2b` |
| `color.background.danger.subtler` | Backgrounds of danger lozenges and badges to ensure accessibility and desired visual appearance | red.200 `#fedcd7` / red.900 `#63221e` | red.200 `#fedcd8` / red.900 `#651f1e` |
| `color.background.danger.subtler.hovered` | Hovered state of color.background.danger.subtler | red.250 `#fdc2ba` / red.850 `#82302a` | red.250 `#fdc2bc` / red.850 `#852d2b` |
| `color.background.danger.subtler.pressed` | Pressed state of color.background.danger.subtler | red.300 `#fba69c` / red.800 `#a23e37` | red.300 `#fca59e` / red.800 `#a53a37` |
| `color.background.danger.subtle` | Background color for non-interactive elements communicating critical danger information (e.g. semantic badges, status pills, callout chips). Sits between subtler and bold in visual emphasis. Not for interactive surfaces — see color.background.danger.bold or color.background.danger.subtler for interactive states | red.300 `#fba69c` / red.800 `#a23e37` | red.300 `#fca59e` / red.800 `#a53a37` |
| `color.background.danger.bold` | A vibrant background option for communicating critical information, such as in danger buttons and error banners | red.700 `#bd4941` / red.400 `#ef867b` | red.700 `#c14543` / red.400 `#f4837c` |
| `color.background.danger.bold.hovered` | Hovered state of color.background.danger.bold | red.800 `#a23e37` / red.300 `#fba69c` | red.800 `#a53a37` / red.300 `#fca59e` |
| `color.background.danger.bold.pressed` | Pressed state of color.background.danger.bold | red.850 `#82302a` / red.250 `#fdc2ba` | red.850 `#852d2b` / red.250 `#fdc2bc` |

#### Link, interaction, skeleton, blanket

| Token | For | Plan A light / dark | Plan B light / dark |
|---|---|---|---|
| `color.link` | Links in a default or hovered state. Add an underline for hovered states | teal.700 `#147b84` / teal.400 `#23b5c2` | same as A |
| `color.link.pressed` | Links in a pressed state | teal.800 `#106972` / teal.300 `#70c9d4` | same as A |
| `color.link.visited` | Visited links | purple.800 `#71518c` / purple.300 `#ccb2e3` | purple.800 `#6150ae` / purple.300 `#bbb5fc` |
| `color.link.visited.pressed` | Visited links in a pressed state | purple.900 `#432f55` / purple.200 `#ecdef9` | purple.900 `#392e6b` / purple.200 `#e2e0fe` |
| `color.interaction.hovered` | A background overlay for elements in a hovered state when their background color cannot change, such as avatars *PLUS state-layer ruling (2026-10-24): hover is an 8% overlay. Atlassian uses 16%.* | neutralAlpha ink @8% `#1f1e1e14` / paper @8% `#e4e3e214` | neutralAlpha ink @8% `#1e1e1e14` / paper @8% `#e3e3e314` |
| `color.interaction.pressed` | A background overlay for elements in a pressed state when their background color cannot change, such as avatars *PLUS ruling: pressed is a 12% overlay. Atlassian uses 32%.* | neutralAlpha ink @12% `#1f1e1e1f` / paper @12% `#e4e3e21f` | neutralAlpha ink @12% `#1e1e1e1f` / paper @12% `#e3e3e31f` |
| `color.skeleton` | Skeleton loading states | neutralAlpha.200 `#1f1e1e0f` / darkNeutralAlpha.200 `#e4e3e214` | neutralAlpha.200 `#1e1e1e0f` / darkNeutralAlpha.200 `#e3e3e314` |
| `color.skeleton.subtle` | The pulse or shimmer effect in skeleton loading states | neutralAlpha.100 `#1f1e1e08` / darkNeutralAlpha.100 `#e4e3e20a` | neutralAlpha.100 `#1e1e1e08` / darkNeutralAlpha.100 `#e3e3e30a` |
| `color.blanket` | The screen overlay that appears with modal dialogs *Keeps today's 0.32 scrim (#383). Atlassian is ~46%.* | ink @32% `#1f1e1e52` / black @60% `#00000099` | ink @32% `#1e1e1e52` / black @60% `#00000099` |
| `color.blanket.selected` | A translucent blanket to communicate selection when changing the background of the selected content is not possible, such as selected Editor blocks. The content beneath remains visible. Do not use to indicate keyboard focus or hover alone | teal.500 @8% `#1d9eab14` / teal.600 @8% `#198f9a14` | same as A |
| `color.blanket.danger` | An overlay to communicate danger states when a simple background color change isn't possible, such as deletion of Editor block elements | red.500 @8% `#e7685e14` / red.600 @8% `#d6584f14` | red.500 @8% `#ec645f14` / red.600 @8% `#da545014` |
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
| `[default]` | `#faf6e9` / `#39290b` | `#eff8f2` / `#1b3024` | `#eff7ff` / `#182d3f` | `#f9f4ff` / `#342640` |
| `.subtler` | `#ede3c6` / `#4a3405` | `#d4e8db` / `#1d3e2c` | `#d1e6f8` / `#1a3a54` | `#ecdef9` / `#432f55` |
| `.subtle` | `#dfcea7` / `#7c590d` | `#9ec5ad` / `#36684d` | `#9ac0e2` / `#31628a` | `#ccb2e3` / `#71518c` |
| `.bold` | `#d3b984` / `#d3b984` | `#407a5b` / `#7caf91` | `#3a74a2` / `#77a8d3` | `#8560a3` / `#b797d4` |
| `.bold.hovered` | `#c39e59` / `#c39e59` | `#36684d` / `#9ec5ad` | `#31628a` / `#9ac0e2` | `#71518c` / `#ccb2e3` |

#### Accent pattern (repeat for blue, teal, green, lime, yellow, orange, red, magenta, purple, brown; gray uses the neutrals)

Steps shown for blue. Teal aliases the accent-teal ramp (`aqua`), not Lagoon. Increased contrast (IC) differs from the base where shown.

| Token | For | Light | Dark | Light IC | Dark IC |
|---|---|---|---|---|---|
| `color.background.accent.{f}.subtlest` | Blue backgrounds when there is no meaning tied to the color. Reserved for when you only want a hint of color | 100 | 1000 | 100 | 1000 |
| `color.background.accent.{f}.subtlest.hovered` | Hovered state of color.background.accent.blue.subtlest | 200 | 900 | 200 | 900 |
| `color.background.accent.{f}.subtlest.pressed` | Pressed state of color.background.accent.blue.subtlest | 250 | 850 | 250 | 850 |
| `color.background.accent.{f}.subtler` | Blue backgrounds when there is no meaning tied to the color, such as colored tags | 200 | 900 | 200 | 900 |
| `color.background.accent.{f}.subtler.hovered` | Hovered state of color.background.accent.blue.subtler | 250 | 850 | 250 | 850 |
| `color.background.accent.{f}.subtler.pressed` | Pressed state of color.background.accent.blue.subtler | 300 | 800 | 300 | 800 |
| `color.background.accent.{f}.subtle` | Vibrant backgrounds when there is no meaning tied to the color, such as colored tags | 400 | 800 | 300 | 900 |
| `color.background.accent.{f}.subtle.hovered` | Hovered state of color.background.accent.blue.subtle | 300 | 850 | 200 | 1000 |
| `color.background.accent.{f}.subtle.pressed` | Pressed state of color.background.accent.blue.subtle | 250 | 900 | 100 | 1000 |
| `color.background.accent.{f}.bolder` | Blue backgrounds when there is no meaning tied to the color, and the background needs to pass min 3:1 contrast requirements | 700 | 400 | 900 | 300 |
| `color.background.accent.{f}.bolder.hovered` | Hovered state of color.background.accent.blue.bolder | 800 | 300 | 1000 | 250 |
| `color.background.accent.{f}.bolder.pressed` | Pressed state of color.background.accent.blue.bolder | 850 | 250 | 1000 | 200 |
| `color.border.accent.{f}` | Blue borders on non-bold backgrounds when there is no meaning tied to the color | 600 | 500 | 800 | 300 |
| `color.border.accent.{f}.subtle` | Decorative borders that do not need to meet 3:1 contrast requirements | 300 | 800 | 300 | 800 |
| `color.text.accent.{f}` | Blue text on subtlest and subtler accent backgrounds when there is no meaning tied to the color | 800 | 300 | 900 | 200 |
| `color.text.accent.{f}.bolder` | Blue text on subtle accent backgrounds when there is no meaning tied to the color | 900 | 200 | 1000 | 100 |
| `color.icon.accent.{f}` | Blue icons on non-bold backgrounds when there is no meaning tied to the color, such as file type icons | 600 | 500 | 800 | 300 |

#### Charts

| Token | Plan A light / dark | Plan B light / dark | IC (A) light / dark |
|---|---|---|---|
| `color.chart.categorical.1` | blue.600 `#4886b8` / blue.500 `#5895c8` | blue.600 `#3881df` / blue.500 `#4790f0` | aqua.800 / aqua.300 |
| `color.chart.categorical.2` | lime.500 `#88965a` / lime.400 `#9da978` | lime.500 `#7a9b1d` / lime.400 `#91ae53` | lime.500 / lime.400 |
| `color.chart.categorical.3` | purple.500 `#a77fca` / purple.400 `#b797d4` | purple.500 `#917ff5` / purple.400 `#a397f9` | orange.800 / orange.300 |
| `color.chart.categorical.4` | orange.500 `#d5781c` / orange.400 `#df9252` | orange.500 `#e26f35` / orange.400 `#ea8b5b` | orange.500 / orange.400 |
| `color.chart.categorical.5` | blue.800 `#31628a` / blue.800 `#31628a` | blue.800 `#235ea9` / blue.800 `#235ea9` | blue.800 / blue.800 |
| `color.chart.categorical.6` | purple.700 `#8560a3` / purple.700 `#8560a3` | purple.700 `#715fca` / purple.700 `#715fca` | purple.800 / purple.300 |
| `color.chart.categorical.7` | aqua.500 `#3e9e99` / aqua.500 `#3e9e99` | aqua.500 `#1da380` / aqua.500 `#1da380` | aqua.500 / aqua.500 |
| `color.chart.categorical.8` | orange.700 `#a75c12` / orange.600 `#c16b16` | orange.700 `#b85014` / orange.600 `#d15f22` | orange.700 / orange.600 |
| `color.chart.neutral` | neutral.500 `#928f8a` / darkNeutral.600 `#828281` | neutral.500 `#8f8f8f` / darkNeutral.600 `#828282` | neutral.700 / darkNeutral.700 |
| `color.chart.blue.bold` | blue.500 `#5895c8` / blue.600 `#4886b8` | blue.500 `#4790f0` / blue.600 `#3881df` | blue.800 / blue.300 |
| `color.chart.blue.bolder` | blue.600 `#4886b8` / blue.500 `#5895c8` | blue.600 `#3881df` / blue.500 `#4790f0` | blue.900 / blue.200 |
| `color.chart.blue.boldest` | blue.800 `#31628a` / blue.300 `#9ac0e2` | blue.800 `#235ea9` / blue.300 `#91befc` | blue.1000 / blue.100 |
| `color.chart.brand` | teal.600 `#198f9a` / teal.500 `#1d9eab` | teal.600 `#198f9a` / teal.500 `#1d9eab` | teal.700 / teal.400 |
| `color.chart.danger` | red.600 `#d6584f` / red.600 `#d6584f` | red.600 `#da5450` / red.600 `#da5450` | red.700 / red.400 |
| `color.chart.danger.bold` | red.850 `#82302a` / red.250 `#fdc2ba` | red.850 `#852d2b` / red.250 `#fdc2bc` | red.900 / red.250 |
| `color.chart.warning` | yellow.500 `#b7872b` / yellow.500 `#b7872b` | yellow.500 `#c1841a` / yellow.500 `#c1841a` | yellow.800 / yellow.500 |
| `color.chart.warning.bold` | yellow.700 `#916812` / yellow.300 `#d3b984` | yellow.700 `#966612` / yellow.300 `#e4b469` | yellow.900 / yellow.300 |
| `color.chart.success` | green.500 `#5e9c79` / green.500 `#5e9c79` | green.500 `#3fa348` / green.500 `#3fa348` | green.800 / green.500 |
| `color.chart.success.bold` | green.700 `#407a5b` / green.300 `#9ec5ad` | green.700 `#1e802c` / green.300 `#88cc8a` | green.900 / green.300 |
| `color.chart.discovery` | purple.500 `#a77fca` / purple.500 `#a77fca` | purple.500 `#917ff5` / purple.500 `#917ff5` | purple.700 / purple.400 |
| `color.chart.discovery.bold` | purple.800 `#71518c` / purple.300 `#ccb2e3` | purple.800 `#6150ae` / purple.300 `#bbb5fc` | purple.900 / purple.300 |
| `color.chart.information` | blue.600 `#4886b8` / blue.500 `#5895c8` | blue.600 `#3881df` / blue.500 `#4790f0` | blue.700 / blue.400 |
| `color.chart.information.bold` | blue.800 `#31628a` / blue.300 `#9ac0e2` | blue.800 `#235ea9` / blue.300 `#91befc` | blue.900 / blue.300 |

Every hue has `color.chart.{hue}.bold`, `.bolder` and `.boldest`, with `.hovered` for each, following blue; every token above also has `.hovered`.

#### Code syntax

| Token | Light / dark (A) |
|---|---|
| `color.background.code.added.highlight` | green.100 / green.1000 |
| `color.background.code.added.line` | green.200 @40% / green.900 @70% |
| `color.background.code.default` | neutral.0 / darkNeutral.100 |
| `color.background.code.gutter` | neutral.200 / darkNeutral.200 |
| `color.background.code.highlight` | neutral.200 / darkNeutral.200 |
| `color.background.code.removed.highlight` | red.100 / red.1000 |
| `color.background.code.removed.line` | red.200 @40% / red.900 @70% |
| `color.border.code` | neutralAlpha.300 / darkNeutralAlpha.300 |
| `color.text.code.accent.1` | magenta.800 / magenta.300 |
| `color.text.code.accent.2` | blue.800 / blue.300 |
| `color.text.code.comments` | neutral.800 / darkNeutral.800 |
| `color.text.code.default` | neutral.800 / darkNeutral.800 |
| `color.text.code.functions` | green.800 / green.300 |
| `color.text.code.gutter` | neutral.700 / darkNeutral.700 |
| `color.text.code.keywords` | red.800 / red.300 |
| `color.text.code.numbers` | yellow.800 / yellow.300 |
| `color.text.code.operators` | neutral.1000 / darkNeutral.1000 |
| `color.text.code.strings` | lime.800 / lime.300 |
| `color.text.code.tags` | orange.800 / orange.400 |
