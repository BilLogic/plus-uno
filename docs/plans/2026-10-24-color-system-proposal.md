---
title: "Color system: research and proposal"
type: research
status: proposal; awaiting Bill's decisions
date: 2026-10-24
repos: plus-uno (design-system/src/tokens, BS4 Foundation Figma library)
artifact: https://claude.ai/artifact/SWQGFicTN9bV6HcF3fS3sk
---

# Color system: research and proposal

PLUS should replace its Material 3 color roles with an Atlassian-shaped token set: nine OKLCH hue ramps and two gray ramps of numbered steps underneath, and about 160 semantic tokens named `color.property.role.emphasis.state` on top, in light and dark. The brand stays teal, moved from today's cerulean (hue 240°) to a greener teal (205° recommended). The ramps are generated, not hand-picked: each step number is a contrast promise against white, calibrated to Atlassian's own palette, so step 700 and darker always carry text and 500 and darker always clear 3:1 for icons and borders.

This is research and a proposal only. No token, component or Figma variable has changed. The visual companion, with every ramp and every semantic token in both themes, is the artifact linked above. Section 5 lists the decisions only Bill can make, each with a recommendation.

The generator and the data behind every table here are reproducible: they are small Python scripts with no dependencies (OKLab math from [Ottosson](https://bottosson.github.io/posts/oklab/)), kept with this doc's copy in `~/Documents/Claude/Projects/PLUS/color-system/`.

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
- **Themes.** light, dark, light-increased-contrast and dark-increased-contrast, the last two also reachable with `data-contrast-mode="more"`; legacy themes were removed in 11.0.0 (2026-02-02) ([theme-ids.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/theme-ids.js), [CL](https://unpkg.com/@atlaskit/tokens@20.7.0/CHANGELOG.md) § 11.0.0). A flag-gated "FY27 Finesse" override (September 2026) turns selected states neutral gray instead of blue ([CL](https://unpkg.com/@atlaskit/tokens@20.7.0/CHANGELOG.md) § 16.11.2); whether it becomes the default is **unverified**.
- **CSS emission.** `--ds-` plus the path without `color.`: `color.background.brand.bold` → `--ds-background-brand-bold`, `elevation.surface` → `--ds-surface` ([get-css-custom-property.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/utils/get-css-custom-property.js)). `token(path, fallback)` returns `var(--ds-…, fallback)`; `setGlobalTheme` sets `data-theme` and `data-color-mode` on `<html>` ([set-global-theme.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/set-global-theme.js)).
- **Custom brand ramps are generated in HCT, not OKLCH.** `generateColors(brandHex)` keeps the brand's hue and chroma and solves each step's tone to hit a fixed WCAG ratio against white, from one of two tables chosen by how light the hue is: `[1.12, 1.33, 2.03, 2.73, 3.33, 4.27, 5.2, 6.62, 12.46, 14.25]` for dark hues and `[1.08, 1.24, 1.55, 1.99, 2.45, 3.34, 4.64, 6.1, 10.19, 12.6]` for light ones. It then swaps the nearest step for the exact brand hex ([GEN](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/utils/generate-colors.js); HCT and contrast code "copied from @material/material-color-utilities", [contrast.js](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/utils/hct-color-utils/contrast.js)). There is no OKLCH anywhere in the package.

### 2.3 shadcn/ui, Radix Colors, Tailwind v4

- **shadcn/ui** pairs every surface with a `-foreground` token (`primary` ↔ `primary-foreground`) ([theming](https://ui.shadcn.com/docs/theming)). Its Tailwind v4 migration states "HSL colors are now converted to OKLCH" ([tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4)). The neutral theme's values are exactly Tailwind's `neutral` ramp, e.g. `--background: oklch(1 0 0)`, `--foreground: oklch(0.145 0 0)`, `--destructive: oklch(0.577 0.245 27.325)`; dark `border` and `input` are translucent white at 10% and 15% ([registry neutral.json](https://ui.shadcn.com/r/colors/neutral.json)). `secondary`, `muted` and `accent` share one value: they are three roles, not three colors.
- **Radix Colors** gives each of 12 steps a job: 1–2 app and subtle backgrounds, 3–5 component backgrounds at rest, hover and selected, 6–8 borders and focus rings, 9–10 solid fills and their hover, 11–12 low- and high-contrast text ([understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)). Steps 11 and 12 are guaranteed APCA Lc 60 and Lc 90 against step 2. Step 9 is the purest color and is identical in light and dark (`#0090ff`); dark scales are hand-tuned, not inversions ([blue.css](https://unpkg.com/@radix-ui/colors@3.0.0/blue.css), [blue-dark.css](https://unpkg.com/@radix-ui/colors@3.0.0/blue-dark.css)). The custom generator works in OKLCH through colorjs.io and picks step 9's text color with APCA ([generate-radix-colors.tsx](https://raw.githubusercontent.com/radix-ui/website/main/components/generate-radix-colors.tsx)).
- **Tailwind v4** writes every color as `oklch()`, steps 50–950 ([colors](https://tailwindcss.com/docs/colors), [theme.css 4.3.3](https://unpkg.com/tailwindcss@4.3.3/theme.css)). Lightness is tuned per hue (blue-500 is L 62.3%, yellow-500 79.5%); chroma arches to a peak at 600–700 (blue 0.245) and hue drifts about 13° along the blue ramp. The theme file has no P3 rules; high-chroma steps fall outside sRGB and rely on the browser's gamut mapping.

What PLUS takes from these: the foreground-pairing idea (Atlassian's `text.inverse` and `text.warning.inverse` do the same job), Radix's habit of writing down each step's job, and OKLCH as the authoring space. What it does not take: Tailwind's per-hue lightness, which makes step 500 mean a different contrast in every hue.

### 2.4 Claude and Anthropic

- **claude.ai** serves HSL channel triplets, not OKLCH. Role tokens are `--bg-000…500`, `--text-000…500`, `--border-*`, `--accent-*`, `--brand-*`, `--danger-*` and `--oncolor-*`, with `000` the strongest; the current "v2" set points them at raw primitives `--_gray-0…900`, `--_blue-*`, `--_violet-*` on an uneven step grid. Light grays are warm (hue 45–60°, saturation 9–14%) and the darkest grays go fully neutral. Brand clay is `#d97757`, emphasized clay `#c6613f`. (Read from claude.ai's served stylesheet in a signed-in browser pane, CSS rules only; plain requests return 403, so there is no public URL to cite.)
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

### 4.1 Primitives

Nine hue families, each with Atlassian's twelve steps (100, 200, 250, 300, 400, 500, 600, 700, 800, 850, 900, 1000); a light neutral ramp 0–1100 and a dark neutral ramp 0–1100 with 250 and 350; and five alpha neutrals per theme. Family roles: **teal** brand, selected, focus and link; **blue** information; **green** success; **yellow** warning; **red** danger; **purple** discovery; **lime**, **orange** and **magenta** accents only.

**Generation method.**

1. **Lightness from contrast.** Each step has one WCAG contrast target against white, the same for every family: 100 → 1.08, 200 → 1.28, 250 → 1.55, 300 → 1.9, 400 → 2.6, 500 → 3.2, 600 → 3.9, 700 → 5.0, 800 → 6.4, 850 → 8.7, 900 → 11.0, 1000 → 14.0. OKLCH L is solved per hue to hit it. The targets sit between Atlassian's two generator tables (§2.2), so a step behaves like Atlassian's; using one table instead of two means a step number is the same contrast promise in every hue. What the step numbers guarantee: **500 and darker clear 3:1** (icons, borders, focus), **700 and darker clear 4.5:1** (text, and white text on the fill), **850 and darker clear 7:1**.
2. **Chroma on a curve.** Chroma is a share of a per-family cap (0.15 for teal, green, lime, yellow and purple; 0.16 orange and magenta; 0.17 blue and red), shaped 14% at 100, 58% at 300, 100% at 500–600, 84% at 800 and 42% at 1000. Atlassian's blues and reds peak near 0.19–0.21; capping lower keeps the palette in the pastel register Bill asked for.
3. **Gamut mapping.** Where the target chroma is outside sRGB at that L and H, chroma is reduced at constant L and H until it fits, the CSS Color 4 approach. Teal is the family this binds most: sRGB cannot show a vivid mid-teal, so teal 500–700 land at chroma 0.087–0.104.
4. **Constant hue.** Hue is fixed per family. Yellow and orange drift warmer across their five lightest steps (up to 10° and 8°) so pale yellow does not go green-gray.
5. **Hex fallback.** Each step ships its OKLCH value as the source and the gamut-mapped hex as the fallback. No P3 values for now (open decision 9).
6. **Neutrals.** Warm gray at hue 75°, solved to the contrast of Atlassian's current neutral ramp step for step. Chroma lives in the light, paper-like steps (0.005–0.009) and falls back toward neutral in the inks, as Notion's and Claude's do. The dark ramp borrows the lightness profile of Atlassian's DarkNeutral. The alphas are the light ink and the dark paper at 3, 6, 14, 31 and 49% (light) and 4, 8, 16, 28 and 50% (dark).

**Check of the method.** Run at today's primary hue (240°), the generator reproduces `#0472a8` between steps 700 (`#1376ab`, 4.99:1) and 800 (`#0f6593`), against its own 5.28:1. The warm neutrals land close to Notion's served grays: warm neutral 100 is `#faf8f5` against Notion's `#f9f8f7`, and 700 is `#716d69` against `#7d7a75`.

The full ramps, with hex and contrast for every step, are in Appendix A and in the artifact.

### 4.2 Brand primary

All three options are teal ramps from the same generator; the brand fill is step 700 with white text, as Atlassian's is (`Blue700`).

| | Option A · Lagoon | Option B · Teal | Option C · Cerulean teal | Today |
|---|---|---|---|---|
| Hue | 205° | 190° | 222° | 240° (`#0472a8`) |
| subtlest (100) | `#e6f9fc` | `#e7faf9` | `#e9f9ff` | `#61b5cf` container |
| bold (700) | `#147b84` | `#147d78` | `#147995` | `#0472a8` |
| hover / text (800) | `#106972` | `#106b66` | `#10687f` | `#00547e` text |
| White on bold | 5.00:1 | 4.96:1 | 5.00:1 | 5.28:1 |
| Text (800) on subtlest (100) | 5.88:1 | 5.86:1 | 5.88:1 | 7.36:1 (on-container ink on container) |
| Bold on warm neutral.100 | 4.72:1 | 4.68:1 | 4.72:1 | |

- **Option A, Lagoon (205°). Recommended.** It is the literal reading of "a slightly greener shade of teal": 35° greener than today, still blue-leaning enough to read as a confident primary rather than a success color. It sits 50° from success green (155°) and 50° from information blue (255°), so the three never read as each other.
- **Option B, Teal (190°).** A true teal, almost exactly today's tertiary `#0e8175`. It reads most "natural" and pastel, but sits only 35° from success green, so a teal button beside a green success badge is the closest call in the system.
- **Option C, Cerulean teal (222°).** The smallest move, and Atlassian's own Teal hue (220–225°). It is the safest migration and the least change: users may not notice it, which is either the point or the problem.

All three clear 4.5:1 for white text on the fill and for brand text on the subtlest tint. Anna's brand work can move the hue within 190–222° without changing anything else in this proposal: the generator, the step contracts and the semantic mapping are hue-independent.

### 4.3 Semantic layer

The semantic layer copies Atlassian's token list and its step references, and swaps Atlassian's families for PLUS's. Blue becomes teal wherever it means brand, selected, focused or link, and stays blue where it means information; Orange (warning) becomes yellow, because PLUS's ruling keeps warning yellow; Lime (success) becomes green; Red and Purple stay.

**Totals:** 157 tokens outside the accent and chart groups (155 from Atlassian plus two PLUS additions), and 17 accent tokens for each of ten accent families. Chart and code-block tokens are left out until a chart or code surface needs them.

**Where PLUS deliberately differs from Atlassian:**

| Token | Atlassian | PLUS | Why |
|---|---|---|---|
| `color.interaction.hovered` / `.pressed` | black at 16% / 32% | ink at 8% / 12% | The 08/12/16 state-layer ruling. |
| `color.interaction.dragged` | none | ink at 16% | The ruling's 16% step, for selected-or-dragged overlays. |
| `color.border.focused.inverse` | none | white (dark: darkNeutral.100) | Today's `--color-focus-ring-inverse`; Atlassian has no ring for colored grounds. |
| `color.blanket` | Neutral500A, about 46% | ink at 32% | Keeps today's 0.32 scrim. |
| warning family | Orange (yellow light steps, orange dark steps) | Yellow throughout | PLUS warning is yellow by ruling. |
| success family | Lime | Green (155°) | Today's success `#3e691a` sits at 134°, between the two; green keeps distance from lime accents. Open decision 8. |
| link | Blue (= brand) | Teal (= brand) | Same rule: link follows brand. |

The full list, with each token's use and its light and dark values, is in Appendix B; the artifact shows every token as a swatch in both themes, filterable by property.

**How to read the roles, in short.**

- `color.text` (neutral.1000) is body text and buttons; `.subtle` (800) is secondary text, labels and navigation; `.subtlest` (700) is metadata, placeholders and helper text. This answers the intern question about neutral vs secondary text directly: there is no secondary color, only three emphasis levels of one neutral.
- `color.background.neutral.subtle` is transparent at rest and is what menu items and subtle buttons use; `color.background.neutral` is the default button fill.
- `color.background.brand.bold` is the primary action; `color.background.selected.bold` is a checked checkbox or selected radio, and Atlassian says not to use it for primary actions.
- Each semantic role (danger, warning, success, information, discovery) has a tint (`[default]`, for section messages), `subtler` for lozenges and badges, `subtle` for non-interactive chips, and `bold` for the filled version with `color.text.inverse` on it. Warning's bold is a light yellow with `color.text.warning.inverse`, as Atlassian's is and as PLUS's ruling already requires.
- `border.*.subtle` is decorative and exempt from 3:1; every other border clears it.
- Surfaces follow #268: `elevation.surface` (white), `.sunken` (warm neutral.100), `.raised` and `.overlay` (white, lifted by shadow). In dark, raised and overlay get lighter as they rise.

### 4.4 Naming convention

**Primitives:** `color.palette.{family}{step}` in the token source, emitted as `--palette-{family}-{step}`. Families are lower-case words (`teal`, `neutral`, `darkNeutral`); alpha neutrals take an `A` suffix (`neutral300A`). Examples: `color.palette.teal700` → `--palette-teal-700`; `color.palette.neutral300A` → `--palette-neutral-300a`. Primitives are for the token source and the docs; components never reference them.

**Semantics:** `color.{property}.{role}.{emphasis}.{state}`, every segment after the property optional, emitted as `--ds-` plus the path without `color.`, as Atlassian does.

| Segment | Values | Rule |
|---|---|---|
| property | `text`, `icon`, `border`, `background`, `link`, `interaction`, `blanket`, `skeleton`; `elevation.surface`, `elevation.shadow` | What the color paints. Required. |
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

### 4.5 Migration map

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
| `--elevation-light-1 … 5` |  | `elevation.shadow.raised (light-2) · elevation.shadow.overlay (light-3, modal light-4)` | Shadows stay as they are for now; renaming only. |

### 4.6 Contrast of the key pairs

WCAG 2 ratios on opaque values, computed from the generated hex. Text needs 4.5:1; icons and borders need 3:1. Every pair clears its bar in both themes.

| Foreground | Background | Bar | Light | Dark |
|---|---|---|---|---|
| `color.text` | `elevation.surface` | 4.5 | 14.12 | 10.74 |
| `color.text.subtle` | `elevation.surface` | 4.5 | 7.62 | 7.22 |
| `color.text.subtlest` | `elevation.surface` | 4.5 | 5.13 | 5.87 |
| `color.text.subtlest` | `elevation.surface.sunken` | 4.5 | 4.84 | 6.30 |
| `color.text` | `elevation.surface.overlay` | 4.5 | 14.12 | 9.08 |
| `color.text.brand` | `elevation.surface` | 4.5 | 5.00 | 6.37 |
| `color.link` | `elevation.surface` | 4.5 | 5.00 | 6.37 |
| `color.text.inverse` | `color.background.brand.bold` | 4.5 | 5.00 | 6.37 |
| `color.text.inverse` | `color.background.selected.bold` | 4.5 | 5.00 | 6.37 |
| `color.text.inverse` | `color.background.danger.bold` | 4.5 | 5.01 | 6.39 |
| `color.text.inverse` | `color.background.success.bold` | 4.5 | 5.04 | 6.38 |
| `color.text.inverse` | `color.background.information.bold` | 4.5 | 5.02 | 6.40 |
| `color.text.inverse` | `color.background.discovery.bold` | 4.5 | 5.02 | 6.37 |
| `color.text.inverse` | `color.background.neutral.bold` | 4.5 | 14.12 | 10.74 |
| `color.text.warning.inverse` | `color.background.warning.bold` | 4.5 | 7.42 | 8.77 |
| `color.text.selected` | `color.background.selected` | 4.5 | 4.60 | 5.30 |
| `color.text.brand` | `color.background.brand.subtlest` | 4.5 | 4.60 | 5.30 |
| `color.text.danger` | `color.background.danger` | 4.5 | 5.94 | 7.38 |
| `color.text.warning` | `color.background.warning` | 4.5 | 5.90 | 7.33 |
| `color.text.success` | `color.background.success` | 4.5 | 5.89 | 7.31 |
| `color.text.information` | `color.background.information` | 4.5 | 5.94 | 7.39 |
| `color.text.discovery` | `color.background.discovery` | 4.5 | 5.96 | 7.39 |
| `color.text.danger.bolder` | `color.background.danger.subtler` | 4.5 | 8.66 | 8.66 |
| `color.text.warning.bolder` | `color.background.warning.subtler` | 4.5 | 8.60 | 8.60 |
| `color.text.success.bolder` | `color.background.success.subtler` | 4.5 | 8.68 | 8.68 |
| `color.text.information.bolder` | `color.background.information.subtler` | 4.5 | 8.61 | 8.61 |
| `color.text.danger` | `elevation.surface` | 4.5 | 6.41 | 8.77 |
| `color.text.warning` | `elevation.surface` | 4.5 | 6.39 | 8.77 |
| `color.text.success` | `elevation.surface` | 4.5 | 6.40 | 8.70 |
| `color.text.information` | `elevation.surface` | 4.5 | 6.45 | 8.77 |
| `color.icon` | `elevation.surface` | 3 | 14.12 | 10.74 |
| `color.icon.subtle` | `elevation.surface` | 3 | 7.62 | 7.22 |
| `color.icon.brand` | `elevation.surface` | 3 | 5.00 | 6.37 |
| `color.icon.danger` | `elevation.surface` | 3 | 5.01 | 5.19 |
| `color.icon.warning` | `elevation.surface` | 3 | 3.88 | 8.77 |
| `color.icon.success` | `elevation.surface` | 3 | 3.88 | 5.24 |
| `color.icon.information` | `elevation.surface` | 3 | 3.90 | 5.16 |
| `color.icon.discovery` | `elevation.surface` | 3 | 3.90 | 5.21 |
| `color.border.input` | `elevation.surface` | 3 | 3.21 | 4.30 |
| `color.border.bold` | `elevation.surface` | 3 | 3.98 | 4.30 |
| `color.border.focused` | `elevation.surface` | 3 | 3.22 | 8.73 |
| `color.border.danger` | `elevation.surface` | 3 | 3.90 | 5.19 |
| `color.border.warning` | `elevation.surface` | 3 | 3.88 | 5.21 |
| `color.border.success` | `elevation.surface` | 3 | 3.88 | 5.24 |
| `color.border.brand` | `elevation.surface` | 3 | 5.00 | 6.37 |
| `color.border.selected` | `elevation.surface` | 3 | 5.00 | 6.37 |

Thinnest margins: `color.border.input` at 3.20:1 and `color.border.focused` at 3.22:1 in light; `color.text.selected` on `color.background.selected` at 4.60:1. Today's equivalents fail: `--color-primary` is 4.08:1 on `surface-container-highest`, and `--color-tertiary` (info) fails 4.5:1 on four of five surfaces.

## 5. Open decisions for Bill

Each needs Bill's call; each has a recommendation.

1. **Brand hue.** A Lagoon 205°, B Teal 190° or C Cerulean teal 222°. *Recommend A.* It is the "slightly greener teal" he described and stays clear of success green and information blue. Anna's shade work can fine-tune within 190–222° without touching anything else.
2. **Neutral temperature.** Warm gray at 75° or a cool gray tinted toward the brand. *Recommend warm.* It is the one trait Notion and Claude share in their served CSS, and it gives the pastel, natural feel he asked for. The cool ramp is generated and shown in the artifact as the alternative.
3. **Secondary and tertiary.** Keep them as roles or drop them. *Recommend dropping both.* Atlassian has neither. Secondary becomes `text.subtle` and `background.neutral`; tertiary becomes `accent.teal` or `accent.green`. This answers the 2025 complaint that secondary competed with primary.
4. **Information hue.** Keep info on the teal tertiary, as decided on 2026-10-24, or move it to blue. *Recommend blue.* With a teal brand, a teal info reads as brand. This reverses a ruling, so it is Bill's.
5. **SMART category colors.** Use the accent tokens directly, or add a thin product layer `color.smart.{subject}.*` that aliases them. *Recommend the alias layer*: mastering-content → purple, relationship → magenta, technology-tools → blue, advocacy → green, social-emotional → orange. The subjects carry domain meaning and appear in 167 places, and an alias lets a subject change hue in one line.
6. **Selected state.** Use Atlassian's opaque `background.selected` steps (teal.100 / 200 / 300), or keep translucent primary 08 and 16 for selected rows and navigation. *Recommend opaque steps* for selection, keeping 08/12/16 only as `color.interaction.*` overlays on grounds that cannot change. Note that Atlassian's flag-gated Finesse theme is moving selection to neutral gray; PLUS need not follow it yet.
7. **Warning edge darkness.** The ruling put the warning border and icon at `#715c00`. The Atlassian mapping gives `border.warning` and `icon.warning` yellow.600 (`#a17c16`, 3.9:1) and `text.warning` yellow.800 (`#775b0d`, close to `#715c00`). *Recommend following the mapping.* It clears 3:1, and the dark value stays where it belongs, in text. The alternative is to point border and icon at yellow.800 as an exception.
8. **Success hue.** Green at 155° or Atlassian's Lime. *Recommend green.* It keeps lime free as an accent and reads more clearly as success to K-12 users; today's success sits between the two.
9. **Gamut and dark mode scope.** *Recommend sRGB only* for now, with no P3 values, and *recommend defining dark values in the tokens now but not shipping a theme toggle* until the component sweep is done. Increased-contrast themes wait.
10. **Source of truth and CSS prefix.** *Recommend* making the generator script in the repo the source: it emits SCSS and pushes two Figma collections, Primitives (one mode) and Semantic (light and dark modes). Today's direction runs the other way, from a Figma export. *Recommend the `--ds-` prefix*, which avoids colliding with today's `--color-*` during migration and lets Atlassian's docs and lint rules read across directly.

Still out of scope and still Bill's: the AI hue (#269). Atlassian's discovery purple and its Rovo tokens are where it would go if he wants one.

## 6. If approved: the work, in order

1. Commit the generator and its tests, emitting `_palette.scss` and `_semantic.scss` beside today's files.
2. Push Primitives and Semantic collections to the BS4 Foundation library (unpublished until Bill publishes).
3. Alias today's `--color-*` tokens to the new ones, so nothing changes visually except the brand and neutral values.
4. Sweep components onto `--ds-*` names by property, retiring the 117 state-layer tokens as they empty.
5. Update `design-system/guidelines/foundations/` color docs and the generated agent views.

Each step is its own ticket; step 4 splits per component group.

## Appendix A: Primitive ramps

**Hue ramps, part 1** (hex · contrast on white)

| Step | teal | blue | green | lime | yellow |
|---|---|---|---|---|---|
| 100 | `#e6f9fc` 1.09 | `#f0f6ff` 1.09 | `#ebf9ef` 1.09 | `#f1f8ea` 1.08 | `#faf6e7` 1.08 |
| 200 | `#c0ebf0` 1.28 | `#d3e5fe` 1.28 | `#cbebd5` 1.28 | `#dae8c9` 1.28 | `#ede3c2` 1.28 |
| 250 | `#9cdae1` 1.55 | `#b2d2fd` 1.55 | `#addabc` 1.55 | `#c2d6ab` 1.56 | `#decfa1` 1.55 |
| 300 | `#70c9d4` 1.91 | `#91bffb` 1.90 | `#8bc9a0` 1.92 | `#aac588` 1.90 | `#d2ba7a` 1.90 |
| 400 | `#22b0be` 2.62 | `#61a3f5` 2.60 | `#55b27a` 2.61 | `#87ac55` 2.60 | `#c19b38` 2.62 |
| 500 | `#1d9eab` 3.22 | `#3d90f5` 3.23 | `#1da561` 3.18 | `#719d28` 3.20 | `#b38a19` 3.20 |
| 600 | `#198f9a` 3.86 | `#2c81e5` 3.90 | `#199457` 3.88 | `#648e15` 3.87 | `#a17c16` 3.88 |
| 700 | `#147b84` 5.00 | `#1f6fca` 5.02 | `#147f4a` 5.04 | `#567b11` 4.96 | `#8b6b11` 4.99 |
| 800 | `#106972` 6.39 | `#195eae` 6.45 | `#0f6d3f` 6.40 | `#49690d` 6.34 | `#775b0d` 6.39 |
| 850 | `#0a545a` 8.65 | `#124b8c` 8.71 | `#0a5631` 8.79 | `#395208` 8.81 | `#5f4808` 8.69 |
| 900 | `#074449` 10.87 | `#0f3c71` 11.02 | `#064526` 11.13 | `#2d4305` 10.96 | `#4d3905` 11.04 |
| 1000 | `#043236` 13.86 | `#102c4f` 14.04 | `#07331c` 14.01 | `#22300a` 14.05 | `#392a03` 13.94 |

**Hue ramps, part 2** (hex · contrast on white)

| Step | orange | red | magenta | purple |
|---|---|---|---|---|
| 100 | `#fff4ed` 1.08 | `#fff4f2` 1.08 | `#fff3f8` 1.08 | `#f6f5ff` 1.08 |
| 200 | `#fedec8` 1.27 | `#fedcd7` 1.28 | `#fedae9` 1.28 | `#e4e0fe` 1.28 |
| 250 | `#f5c6a8` 1.55 | `#fdc2ba` 1.54 | `#f6c1d8` 1.55 | `#d1caf8` 1.55 |
| 300 | `#eeae86` 1.90 | `#f9a79e` 1.90 | `#eea7c8` 1.91 | `#bfb4f2` 1.90 |
| 400 | `#e48a52` 2.61 | `#f08075` 2.61 | `#e282b1` 2.60 | `#a594ea` 2.62 |
| 500 | `#df7126` 3.22 | `#ec645a` 3.21 | `#dc68a4` 3.20 | `#9780e7` 3.20 |
| 600 | `#cc6416` 3.89 | `#da554b` 3.90 | `#cb5895` 3.91 | `#8871d6` 3.90 |
| 700 | `#b15612` 4.99 | `#c1453e` 5.01 | `#b34982` 5.01 | `#7660be` 5.02 |
| 800 | `#98490e` 6.37 | `#a63a34` 6.41 | `#993e6e` 6.42 | `#6551a3` 6.44 |
| 850 | `#7a3909` 8.69 | `#852d28` 8.74 | `#7b3058` 8.73 | `#504083` 8.74 |
| 900 | `#642d06` 10.94 | `#6b2420` 11.06 | `#632646` 11.07 | `#403369` 11.08 |
| 1000 | `#472109` 14.10 | `#4c1d1a` 14.02 | `#461e33` 14.06 | `#2e264a` 14.07 |

**Neutral ramps** (hex · contrast on white)

| Step | neutral | darkNeutral | neutralCool | darkNeutralCool |
|---|---|---|---|---|
| 0 | `#ffffff` 1.00 | `#191715` 17.88 | `#ffffff` 1.00 | `#12181c` 17.90 |
| 100 | `#faf8f5` 1.06 | `#1f1e1b` 16.67 | `#f6f8fa` 1.06 | `#181f23` 16.68 |
| 200 | `#f4f1ee` 1.13 | `#262422` 15.47 | `#eff2f4` 1.12 | `#1f2629` 15.36 |
| 300 | `#e1deda` 1.34 | `#32302e` 13.14 | `#dbdfe2` 1.34 | `#2b3236` 13.03 |
| 400 | `#bcb8b4` 1.97 | `#4f4d4a` 8.42 | `#b3b9bd` 1.98 | `#474e52` 8.47 |
| 500 | `#938f8a` 3.21 | `#676461` 5.88 | `#899196` 3.20 | `#5c676c` 5.81 |
| 600 | `#837f7a` 3.98 | `#84817d` 3.88 | `#788186` 3.98 | `#7a8489` 3.83 |
| 700 | `#716d69` 5.13 | `#9c9994` 2.84 | `#666f74` 5.13 | `#919ba0` 2.84 |
| 800 | `#57534f` 7.62 | `#aeaaa6` 2.31 | `#4b555b` 7.64 | `#a4adb1` 2.28 |
| 900 | `#3f3d39` 10.84 | `#c3c0bc` 1.81 | `#343f45` 10.81 | `#bac2c6` 1.81 |
| 1000 | `#2d2b28` 14.12 | `#d2cfcb` 1.55 | `#212d33` 14.11 | `#cad1d4` 1.55 |
| 1100 | `#201e1c` 16.62 | `#e6e3de` 1.28 | `#152026` 16.58 | `#dfe4e7` 1.28 |

**OKLCH source values, brand teal (Option A) and warm neutral**

| Step | teal | neutral |
|---|---|---|
| 0 |  | `oklch(1.000 0.000 90)` |
| 100 | `oklch(0.969 0.020 208)` | `oklch(0.980 0.005 78)` |
| 200 | `oklch(0.911 0.045 205)` | `oklch(0.960 0.005 68)` |
| 300 | `oklch(0.784 0.087 206)` | `oklch(0.902 0.006 75)` |
| 400 | `oklch(0.694 0.112 205)` | `oklch(0.785 0.007 68)` |
| 500 | `oklch(0.641 0.104 206)` | `oklch(0.652 0.009 74)` |
| 600 | `oklch(0.595 0.097 205)` | `oklch(0.598 0.009 74)` |
| 700 | `oklch(0.534 0.087 204)` | `oklch(0.537 0.008 68)` |
| 800 | `oklch(0.477 0.077 206)` | `oklch(0.445 0.008 68)` |
| 900 | `oklch(0.354 0.057 204)` | `oklch(0.361 0.007 85)` |
| 1000 | `oklch(0.290 0.047 204)` | `oklch(0.290 0.006 78)` |
| 1100 |  | `oklch(0.236 0.005 68)` |

**Alpha neutrals**

| Step | neutralAlpha (light) | darkNeutralAlpha (dark) |
|---|---|---|
| 100A | `#201e1c08` (3%) | `#e6e3de0a` (4%) |
| 200A | `#201e1c0f` (6%) | `#e6e3de14` (8%) |
| 300A | `#201e1c24` (14%) | `#e6e3de29` (16%) |
| 400A | `#201e1c4f` (31%) | `#e6e3de47` (28%) |
| 500A | `#201e1c7d` (49%) | `#e6e3de80` (50%) |

## Appendix B: Semantic tokens, light and dark

Values show the primitive step and the resolved hex. The "For" column is Atlassian's own token description from [RAW-L](https://unpkg.com/@atlaskit/tokens@20.7.0/dist/cjs/artifacts/tokens-raw/atlassian-light.js), lightly trimmed; `@atlaskit/tokens` is Apache-2.0 licensed ([npm](https://registry.npmjs.org/@atlaskit/tokens)). PLUS deviations are marked in italics.

#### Text

| Token | For | Light | Dark |
|---|---|---|---|
| `color.text` | Primary text, such as body copy, sentence case headers, and buttons | neutral.1000 `#2d2b28` | darkNeutral.1000 `#d2cfcb` |
| `color.text.disabled` | Text in a disabled state | neutralAlpha.400 `#201e1c4f` | darkNeutralAlpha.400 `#e6e3de47` |
| `color.text.inverse` | Text on bold backgrounds | neutral.0 `#ffffff` | darkNeutral.100 `#1f1e1b` |
| `color.text.selected` | Text that communicates selection, such as the active tab or a selected navigation item, or the opened state of a dropdown trigger. On bold selected backgrounds, use color.text.inverse instead. Do not use for unselected links, brand emphasis, or hover alone. Keep the selected text treatment when the element also has focus | teal.700 `#147b84` | teal.400 `#22b0be` |
| `color.text.brand` | Text that reinforces our brand | teal.700 `#147b84` | teal.400 `#22b0be` |
| `color.text.danger` | Critical text, such as input field error messaging | red.800 `#a63a34` | red.300 `#f9a79e` |
| `color.text.danger.bolder` | Text on top of danger semantic labels to ensure accessibility and desired visual appearance | red.900 `#6b2420` | red.200 `#fedcd7` |
| `color.text.warning` | Text to emphasize caution, such as in moved lozenges | yellow.800 `#775b0d` | yellow.300 `#d2ba7a` |
| `color.text.warning.inverse` | Text when on bold warning backgrounds | neutral.1000 `#2d2b28` | darkNeutral.100 `#1f1e1b` |
| `color.text.warning.bolder` | Text on top of warning semantic labels to ensure accessibility and desired visual appearance | yellow.900 `#4d3905` | yellow.200 `#ede3c2` |
| `color.text.success` | Text to communicate a favorable outcome, such as input field success messaging | green.800 `#0f6d3f` | green.300 `#8bc9a0` |
| `color.text.success.bolder` | Text on top of success semantic labels to ensure accessibility and desired visual appearance | green.900 `#064526` | green.200 `#cbebd5` |
| `color.text.discovery` | Text to emphasize change or something new, such as in new lozenges | purple.800 `#6551a3` | purple.300 `#bfb4f2` |
| `color.text.discovery.bolder` | Text on top of discovery semantic labels to ensure accessibility and desired visual appearance | purple.900 `#403369` | purple.200 `#e4e0fe` |
| `color.text.information` | Informative text or to communicate something is in progress, such as in-progress lozenges | blue.800 `#195eae` | blue.300 `#91bffb` |
| `color.text.information.bolder` | Text on top of information semantic labels to ensure accessibility and desired visual appearance | blue.900 `#0f3c71` | blue.200 `#d3e5fe` |
| `color.text.subtlest` | Tertiary text, such as meta-data, breadcrumbs, input field placeholder and helper text | neutral.700 `#716d69` | darkNeutral.700 `#9c9994` |
| `color.text.subtle` | Secondary text, such as navigation, subtle button links, input field labels, and all caps subheadings | neutral.800 `#57534f` | darkNeutral.800 `#aeaaa6` |

#### Icon

| Token | For | Light | Dark |
|---|---|---|---|
| `color.icon` | Icon-only buttons, or icons paired with color.text | neutral.1000 `#2d2b28` | darkNeutral.1000 `#d2cfcb` |
| `color.icon.disabled` | Icons in a disabled state | neutralAlpha.400 `#201e1c4f` | darkNeutralAlpha.400 `#e6e3de47` |
| `color.icon.inverse` | Icons on bold backgrounds | neutral.0 `#ffffff` | darkNeutral.100 `#1f1e1b` |
| `color.icon.selected` | Icons that communicate selection, such as icons in selected navigation items, or the opened state of a dropdown trigger. On bold selected backgrounds, use color.icon.inverse instead. Do not use for brand emphasis or hover alone. Keep the selected icon treatment when the element also has focus | teal.700 `#147b84` | teal.400 `#22b0be` |
| `color.icon.brand` | Icons that reinforce our brand | teal.700 `#147b84` | teal.400 `#22b0be` |
| `color.icon.danger` | Icons communicating critical information, such as those used in error handing | red.700 `#c1453e` | red.500 `#ec645a` |
| `color.icon.warning` | Icons communicating caution, such as those used in warning section messages | yellow.600 `#a17c16` | yellow.300 `#d2ba7a` |
| `color.icon.warning.inverse` | Icons when on bold warning backgrounds | neutral.1000 `#2d2b28` | darkNeutral.100 `#1f1e1b` |
| `color.icon.success` | Icons communicating a favorable outcome, such as those used in success section messaged | green.600 `#199457` | green.500 `#1da561` |
| `color.icon.discovery` | Icons communicating change or something new, such as discovery section messages | purple.600 `#8871d6` | purple.500 `#9780e7` |
| `color.icon.information` | Icons communicating information or something in-progress, such as information section messages | blue.600 `#2c81e5` | blue.500 `#3d90f5` |
| `color.icon.subtlest` | Icons paired with color.text.subtlest | neutral.700 `#716d69` | darkNeutral.700 `#9c9994` |
| `color.icon.subtle` | Icons paired with color.text.subtle | neutral.800 `#57534f` | darkNeutral.800 `#aeaaa6` |

#### Border

| Token | For | Light | Dark |
|---|---|---|---|
| `color.border` | Use to visually group or separate UI elements, such as flat cards or side panel dividers | neutralAlpha.300 `#201e1c24` | darkNeutralAlpha.300 `#e6e3de29` |
| `color.border.disabled` | Borders of elements in a disabled state | neutralAlpha.200 `#201e1c0f` | darkNeutralAlpha.200 `#e6e3de14` |
| `color.border.focused` | The focus ring or border of an element that currently has keyboard or input focus. Do not use to indicate selection or hover alone. When an element is both selected and focused, keep its selected treatment and add a separate focus indicator | teal.500 `#1d9eab` | teal.300 `#70c9d4` |
| `color.border.input` | Borders of form UI elements, such as text fields, checkboxes, and radio buttons | neutral.500 `#938f8a` | darkNeutral.600 `#84817d` |
| `color.border.input.search` | The border of search inputs | neutralAlpha.300 `#201e1c24` | darkNeutralAlpha.300 `#e6e3de29` |
| `color.border.inverse` | Borders on bold backgrounds | neutral.0 `#ffffff` | darkNeutral.0 `#191715` |
| `color.border.selected` | Borders or visual indicators that communicate selection, such as the active tab or a selected menu item, or the opened state of a dropdown trigger. Do not use as a keyboard focus indicator; use color.border.focused for focus and preserve the selected treatment when both states apply | teal.700 `#147b84` | teal.400 `#22b0be` |
| `color.border.brand` | Borders or visual indicators of elements that reinforce our brand, such as logos or primary buttons | teal.700 `#147b84` | teal.400 `#22b0be` |
| `color.border.danger` | Borders communicating critical information, such as the borders on invalid text fields | red.600 `#da554b` | red.500 `#ec645a` |
| `color.border.danger.subtle` | Decorative danger borders that do not need to meet 3:1 contrast requirements | red.300 `#f9a79e` | red.800 `#a63a34` |
| `color.border.warning` | Borders communicating caution | yellow.600 `#a17c16` | yellow.500 `#b38a19` |
| `color.border.warning.subtle` | Decorative warning borders that do not need to meet 3:1 contrast requirements | yellow.300 `#d2ba7a` | yellow.800 `#775b0d` |
| `color.border.success` | Borders communicating a favorable outcome, such as the borders on validated text fields | green.600 `#199457` | green.500 `#1da561` |
| `color.border.success.subtle` | Decorative success borders that do not need to meet 3:1 contrast requirements | green.300 `#8bc9a0` | green.800 `#0f6d3f` |
| `color.border.discovery` | Borders communicating change or something new, such as the borders in onboarding spotlights | purple.600 `#8871d6` | purple.500 `#9780e7` |
| `color.border.discovery.subtle` | Decorative discovery borders that do not need to meet 3:1 contrast requirements | purple.300 `#bfb4f2` | purple.800 `#6551a3` |
| `color.border.information` | Borders communicating information or something in-progress | blue.600 `#2c81e5` | blue.500 `#3d90f5` |
| `color.border.information.subtle` | Decorative information borders that do not need to meet 3:1 contrast requirements | blue.300 `#91bffb` | blue.800 `#195eae` |
| `color.border.bold` | A neutral border option that passes min 3:1 contrast ratios | neutral.600 `#837f7a` | darkNeutral.600 `#84817d` |
| `color.border.focused.inverse` | PLUS addition. Focus ring on a bold or colored ground (today --color-focus-ring-inverse). *PLUS: today's Focus Ring Inverse* | neutral.0 `#ffffff` | darkNeutral.100 `#1f1e1b` |

#### Background · neutral, input, inverse, disabled, selected, brand

| Token | For | Light | Dark |
|---|---|---|---|
| `color.background.disabled` | Backgrounds of elements in a disabled state | neutralAlpha.200 `#201e1c0f` | darkNeutralAlpha.300 `#e6e3de29` |
| `color.background.input` | Background of form UI elements, such as text fields, checkboxes, and radio buttons | neutral.0 `#ffffff` | darkNeutral.200 `#262422` |
| `color.background.input.hovered` | Hovered state for color.background.input | neutral.100 `#faf8f5` | darkNeutral.250 `#2d2b29` |
| `color.background.input.pressed` | Pressed state for color.background.input | neutral.0 `#ffffff` | darkNeutral.200 `#262422` |
| `color.background.inverse.subtle` | Backgrounds of elements on a bold background, such as in the buttons on spotlight cards | ink @16% `#201e1c29` | paper @16% `#e6e3de29` |
| `color.background.inverse.subtle.hovered` | The hovered state of color.background.inverse.subtle | ink @24% `#201e1c3d` | paper @24% `#e6e3de3d` |
| `color.background.inverse.subtle.pressed` | The pressed state of color.background.inverse.subtle | ink @32% `#201e1c52` | paper @32% `#e6e3de52` |
| `color.background.neutral` | The default background for neutral elements, such as default buttons | neutralAlpha.200 `#201e1c0f` | darkNeutralAlpha.200 `#e6e3de14` |
| `color.background.neutral.hovered` | Hovered state for color.background.neutral | neutralAlpha.300 `#201e1c24` | darkNeutralAlpha.300 `#e6e3de29` |
| `color.background.neutral.pressed` | Pressed state for color.background.neutral | neutralAlpha.400 `#201e1c4f` | darkNeutralAlpha.400 `#e6e3de47` |
| `color.background.neutral.subtle` | The background of elements that appear to have no background in a resting state, such as subtle buttons and menu items | transparent `#00000000` | transparent `#00000000` |
| `color.background.neutral.subtle.hovered` | Hovered state for color.background.neutral.subtle | neutralAlpha.200 `#201e1c0f` | darkNeutralAlpha.200 `#e6e3de14` |
| `color.background.neutral.subtle.pressed` | Pressed state for color.background.neutral.subtle | neutralAlpha.300 `#201e1c24` | darkNeutralAlpha.300 `#e6e3de29` |
| `color.background.neutral.bold` | A vibrant background option for neutral UI elements, such as announcement banners | neutral.1000 `#2d2b28` | darkNeutral.1000 `#d2cfcb` |
| `color.background.neutral.bold.hovered` | Hovered state of color.background.neutral.bold | neutral.900 `#3f3d39` | darkNeutral.900 `#c3c0bc` |
| `color.background.neutral.bold.pressed` | Pressed state of color.background.neutral.bold | neutral.800 `#57534f` | darkNeutral.800 `#aeaaa6` |
| `color.background.selected` | The background of an element that communicates selection, such as a selected navigation item, or the opened state of a dropdown trigger. Use color.background.selected.hovered or color.background.selected.pressed when interacting with a selected element. Selection is distinct from keyboard focus and hover alone | teal.100 `#e6f9fc` | teal.1000 `#043236` |
| `color.background.selected.hovered` | The background of an element that is selected and hovered. This preserves selection while showing pointer hover; do not use for an unselected element or keyboard focus alone | teal.200 `#c0ebf0` | teal.900 `#074449` |
| `color.background.selected.pressed` | The background of an element that is selected and being pressed. Return to color.background.selected or color.background.selected.hovered when the press ends and the element remains selected. Do not use for an unselected element or keyboard focus alone | teal.300 `#70c9d4` | teal.800 `#106972` |
| `color.background.selected.bold` | The bold background of selected controls, such as checked checkboxes and selected radio buttons. Pair with color.text.inverse or color.icon.inverse for foreground content. Do not use for primary actions or keyboard focus alone | teal.700 `#147b84` | teal.400 `#22b0be` |
| `color.background.selected.bold.hovered` | The background of a selected control that uses color.background.selected.bold while it is hovered, such as a checked checkbox. Pair with color.text.inverse or color.icon.inverse for foreground content. Do not use for an unselected control or keyboard focus alone | teal.800 `#106972` | teal.300 `#70c9d4` |
| `color.background.selected.bold.pressed` | The background of a selected control that uses color.background.selected.bold while it is being pressed, such as a checked checkbox. Pair with color.text.inverse or color.icon.inverse for foreground content. Do not use for an unselected control or keyboard focus alone | teal.900 `#074449` | teal.200 `#c0ebf0` |
| `color.background.brand.subtlest` | The background of elements used to reinforce our brand, but with less emphasis | teal.100 `#e6f9fc` | teal.1000 `#043236` |
| `color.background.brand.subtlest.hovered` | Hovered state of color.background.brand.subtlest | teal.200 `#c0ebf0` | teal.900 `#074449` |
| `color.background.brand.subtlest.pressed` | Pressed state of color.background.brand.subtlest | teal.250 `#9cdae1` | teal.850 `#0a545a` |
| `color.background.brand.bold` | The background of elements used to reinforce our brand, but with more emphasis | teal.700 `#147b84` | teal.400 `#22b0be` |
| `color.background.brand.bold.hovered` | Hovered state of color.background.brand.bold | teal.800 `#106972` | teal.300 `#70c9d4` |
| `color.background.brand.bold.pressed` | Pressed state of color.background.brand.bold | teal.850 `#0a545a` | teal.250 `#9cdae1` |
| `color.background.brand.boldest` | The background of elements used to reinforce our brand, that need to stand out a lot | teal.1000 `#043236` | teal.100 `#e6f9fc` |
| `color.background.brand.boldest.hovered` | Hovered state of color.background.brand.boldest | teal.900 `#074449` | teal.200 `#c0ebf0` |
| `color.background.brand.boldest.pressed` | Pressed state of color.background.brand.boldest | teal.850 `#0a545a` | teal.250 `#9cdae1` |

#### Link, interaction, skeleton, blanket

| Token | For | Light | Dark |
|---|---|---|---|
| `color.link` | Links in a default or hovered state. Add an underline for hovered states | teal.700 `#147b84` | teal.400 `#22b0be` |
| `color.link.pressed` | Links in a pressed state | teal.800 `#106972` | teal.300 `#70c9d4` |
| `color.link.visited` | Visited links | purple.800 `#6551a3` | purple.300 `#bfb4f2` |
| `color.link.visited.pressed` | Visited links in a pressed state | purple.900 `#403369` | purple.200 `#e4e0fe` |
| `color.interaction.hovered` | A background overlay for elements in a hovered state when their background color cannot change, such as avatars *PLUS: PLUS state-layer ruling (2026-10-24): hover is an 8% overlay. Atlassian uses 16%.* | neutralAlpha ink @8% `#201e1c14` | paper @8% `#e6e3de14` |
| `color.interaction.pressed` | A background overlay for elements in a pressed state when their background color cannot change, such as avatars *PLUS: PLUS ruling: pressed is a 12% overlay. Atlassian uses 32%.* | neutralAlpha ink @12% `#201e1c1f` | paper @12% `#e6e3de1f` |
| `color.skeleton` | Skeleton loading states | neutralAlpha.200 `#201e1c0f` | darkNeutralAlpha.200 `#e6e3de14` |
| `color.skeleton.subtle` | The pulse or shimmer effect in skeleton loading states | neutralAlpha.100 `#201e1c08` | darkNeutralAlpha.100 `#e6e3de0a` |
| `color.blanket` | The screen overlay that appears with modal dialogs *PLUS: Keeps today's 0.32 scrim (#383). Atlassian is ~46%.* | ink @32% `#201e1c52` | black @60% `#00000099` |
| `color.blanket.selected` | A translucent blanket to communicate selection when changing the background of the selected content is not possible, such as selected Editor blocks. The content beneath remains visible. Do not use to indicate keyboard focus or hover alone | teal.500 @8% `#1d9eab14` | teal.600 @8% `#198f9a14` |
| `color.blanket.danger` | An overlay to communicate danger states when a simple background color change isn't possible, such as deletion of Editor block elements | red.500 @8% `#ec645a14` | red.600 @8% `#da554b14` |
| `color.interaction.dragged` | PLUS addition. Selected-or-dragged overlay, the 16% step of the state-layer ruling. *PLUS: PLUS ruling 2026-10-24* | ink @16% `#201e1c29` | paper @16% `#e6e3de29` |

#### Surfaces

| Token | For | Light | Dark |
|---|---|---|---|
| `elevation.surface` | The primary background for the UI | neutral.0 `#ffffff` | darkNeutral.100 `#1f1e1b` |
| `elevation.surface.hovered` | Hovered state of elevation.surface | neutral.200 `#f4f1ee` | darkNeutral.200 `#262422` |
| `elevation.surface.pressed` | Pressed state of elevation.surface | neutral.300 `#e1deda` | darkNeutral.250 `#2d2b29` |
| `elevation.surface.container` | A neutral container surface background | neutralAlpha.100 `#201e1c08` | darkNeutralAlpha.100 `#e6e3de0a` |
| `elevation.surface.container.hovered` | Hovered state of elevation.surface.container | neutralAlpha.200 `#201e1c0f` | darkNeutralAlpha.200 `#e6e3de14` |
| `elevation.surface.container.pressed` | Pressed state of elevation.surface.container | neutralAlpha.300 `#201e1c24` | darkNeutralAlpha.250 `#e6e3de1a` |
| `elevation.surface.overlay` | The background of elements that sit on top of they UI, such as modals, dialogs, dropdown menus, floating toolbars, and floating single-action buttons. Also use for the background of raised cards in a dragged state. Combine with elevation.shadow.overlay | neutral.0 `#ffffff` | darkNeutral.250 `#2d2b29` |
| `elevation.surface.overlay.hovered` | Hovered state of elevation.surface.overlay | neutral.200 `#f4f1ee` | darkNeutral.300 `#32302e` |
| `elevation.surface.overlay.pressed` | Pressed state of elevation.surface.overlay | neutral.300 `#e1deda` | darkNeutral.350 `#403e3c` |
| `elevation.surface.raised` | The background of cards that can be moved, such as Jira cards on a Kanban board. Combine with elevation.shadow.raised | neutral.0 `#ffffff` | darkNeutral.200 `#262422` |
| `elevation.surface.raised.hovered` | Hovered state of elevation.surface.raised | neutral.200 `#f4f1ee` | darkNeutral.250 `#2d2b29` |
| `elevation.surface.raised.pressed` | Pressed state of elevation.surface.raised | neutral.300 `#e1deda` | darkNeutral.300 `#32302e` |
| `elevation.surface.sunken` | A secondary background for the UI commonly used for grouping items, such as Jira cards in columns | neutral.100 `#faf8f5` | darkNeutral.0 `#191715` |

#### Background · semantic roles (danger, warning, success, information, discovery)

Each role has the same eleven tokens; the full values for all five are in the artifact. Danger shown in full, the others by step.

| Token | For | Light | Dark |
|---|---|---|---|
| `color.background.danger` | Backgrounds communicating critical information, such in error section messages | red.100 `#fff4f2` | red.1000 `#4c1d1a` |
| `color.background.danger.hovered` | Hovered state for color.background.danger | red.200 `#fedcd7` | red.900 `#6b2420` |
| `color.background.danger.pressed` | Pressed state for color.background.danger | red.250 `#fdc2ba` | red.850 `#852d28` |
| `color.background.danger.subtler` | Backgrounds of danger lozenges and badges to ensure accessibility and desired visual appearance | red.200 `#fedcd7` | red.900 `#6b2420` |
| `color.background.danger.subtler.hovered` | Hovered state of color.background.danger.subtler | red.250 `#fdc2ba` | red.850 `#852d28` |
| `color.background.danger.subtler.pressed` | Pressed state of color.background.danger.subtler | red.300 `#f9a79e` | red.800 `#a63a34` |
| `color.background.danger.subtle` | Background colour for non-interactive elements communicating critical danger information (e.g. semantic badges, status pills, callout chips). Sits between subtler and bold in visual emphasis. Not for interactive surfaces — see color.background.danger.bold or color.background.danger.subtler for interactive states | red.300 `#f9a79e` | red.800 `#a63a34` |
| `color.background.danger.bold` | A vibrant background option for communicating critical information, such as in danger buttons and error banners | red.700 `#c1453e` | red.400 `#f08075` |
| `color.background.danger.bold.hovered` | Hovered state of color.background.danger.bold | red.800 `#a63a34` | red.300 `#f9a79e` |
| `color.background.danger.bold.pressed` | Pressed state of color.background.danger.bold | red.850 `#852d28` | red.250 `#fdc2ba` |

| Emphasis | warning (yellow) | success (green) | information (blue) | discovery (purple) |
|---|---|---|---|---|
| `[default]` | `#faf6e7` / `#392a03` | `#ebf9ef` / `#07331c` | `#f0f6ff` / `#102c4f` | `#f6f5ff` / `#2e264a` |
| `.subtler` | `#ede3c2` / `#4d3905` | `#cbebd5` / `#064526` | `#d3e5fe` / `#0f3c71` | `#e4e0fe` / `#403369` |
| `.subtle` | `#decfa1` / `#775b0d` | `#8bc9a0` / `#0f6d3f` | `#91bffb` / `#195eae` | `#bfb4f2` / `#6551a3` |
| `.bold` | `#d2ba7a` / `#d2ba7a` | `#147f4a` / `#55b27a` | `#1f6fca` / `#61a3f5` | `#7660be` / `#a594ea` |
| `.bold.hovered` | `#c19b38` / `#c19b38` | `#0f6d3f` / `#8bc9a0` | `#195eae` / `#91bffb` | `#6551a3` / `#bfb4f2` |

#### Accent pattern (repeat per family: teal, blue, green, lime, yellow, orange, red, magenta, purple, gray)

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
