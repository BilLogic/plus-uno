# Figma to PLUS Design Token Mapping

## Token Mapping Reference

### Element Tokens
- Figma: `--element/gap-sm` → PLUS: `--size-element-gap-sm`
- Figma: `--element/gap-md` → PLUS: `--size-element-gap-md`
- Figma: `--element/gap-lg` → PLUS: `--size-element-gap-lg`
- Figma: `--element/pad-x-sm` → PLUS: `--size-element-pad-x-sm`
- Figma: `--element/pad-x-md` → PLUS: `--size-element-pad-x-md`
- Figma: `--element/pad-x-lg` → PLUS: `--size-element-pad-x-lg`
- Figma: `--element/pad-y-sm` → PLUS: `--size-element-pad-y-sm`
- Figma: `--element/pad-y-md` → PLUS: `--size-element-pad-y-md`
- Figma: `--element/pad-y-lg` → PLUS: `--size-element-pad-y-lg`
- Figma: `--element/radius-sm` → PLUS: `--size-element-radius-sm`
- Figma: `--element/radius-md` → PLUS: `--size-element-radius-md`
- Figma: `--element/radius-lg` → PLUS: `--size-element-radius-lg`

### Modal Tokens
- Figma: `--modal/pad-x-md` → PLUS: `--size-modal-pad-x-md`
- Figma: `--modal/pad-y-lg` → PLUS: `--size-modal-pad-y-lg`
- Figma: `--modal/gap-sm` → PLUS: `--size-modal-gap-sm`
- Figma: `--modal/radius-md` → PLUS: `--size-modal-radius-md`

### Color Tokens
- Figma: `--_primary/primary` → PLUS: `--color-primary`
- Figma: `--_primary/on-primary` → PLUS: `--color-on-primary`
- Figma: `--_primary/primary-(text)` → PLUS: `--color-primary` (for text)
- Figma: `--_primary/on-primary-container` → PLUS: `--color-on-primary-container`
- Figma: `--_primary/state-layers/primary-08` → PLUS: `--color-primary-state-08`
- Similar mappings for secondary, tertiary, success, danger, warning, info

### Typography
- Figma: "Lato:SemiBold" → PLUS: `h4`, `h5`, `h6` classes
- Figma: "Merriweather Sans:Light" → PLUS: `body1-txt`, `body2-txt`, `body3-txt`
- Figma: "Font Awesome 6 Free:Solid" → PLUS: `fas fa-*` classes

## Component-Specific Mappings

### Alert
- Uses modal tokens for padding and radius
- Uses state-layer tokens for background colors
- Border uses primary color token

### Button
- Small size: `--element/pad-x-sm`, `--element/pad-y-sm`, `--element/gap-sm`, `--element/radius-sm`
- Medium (default): `--element/pad-x-md`, `--element/pad-y-md`, `--element/gap-md`, `--element/radius-md`
- Large: `--element/pad-x-lg`, `--element/pad-y-lg`, `--element/gap-lg`, `--element/radius-lg`

### Breadcrumb
- Uses element tokens for padding and gap
- Link color: primary text color
- Separator: neutral on-surface-variant

### Badge
- Uses element tokens for padding and radius
- Various text sizes (h1-h6, b1-b3)
- Color styles: primary, secondary, tertiary, success, danger, warning, SMART colors

### Dropdown
- **Toggle Button:**
  - Padding: `--element/pad-x-sm/md/lg`, `--element/pad-y-sm/md/lg` (based on size)
  - Gap: `--element/gap-sm` (between text and caret)
  - Border: `--element/stroke-md` (1.5px)
  - Border radius: `--element/radius-sm` (4px)
  - Border color: `--_primary/primary` (for primary style) or `--neutral-colors/outline-variant` (for default)
  - Text color: `--_primary/primary-(text)` (for primary style) or `--neutral-colors/on-surface` (for default)
  - Background: `--neutral-colors/surface`
  - Typography: Body/B2 (14px, line-height 1.571)
  
- **Dropdown Menu:**
  - Background: `--neutral-colors/Surface container/surface-container-high` (#e7e8eb)
  - Border radius: `--element/radius-md` (4px)
  - Shadow: `0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)`
  - Min width: 218.67px (col-4) or 332px (col-6)
  
- **Dropdown Items:**
  - Padding: `--element/pad-y-md` (6px) `--element/pad-x-md` (10px)
  - Gap: `--element/gap-md` (10px) between elements
  - Text color: `--neutral-colors/on-surface` (#191c1e)
  - Typography: Body/B2/Regular (Merriweather Sans Light, 14px, weight 300)
  
- **Item States:**
  - Hover: `--state-layers/on surface/opacity-0_12` (12% opacity)
  - Selected: `--state-layers/on surface/opacity-0_16` (16% opacity)
  - Disabled: opacity 0.38
  - Selected icon color: `--neutral-colors/on-surface-variant` (#3f484a)
  
- **Icons:**
  - Font Awesome Solid B2: 12px, line-height 1.833
  - Caret icon: Font Awesome Solid, color matches button style
  
- **Counters/Badges:**
  - Background: `--state-layers/on surface/opacity-0_16` (default) or `--_primary/on-primary-container` (filled-primary style)
  - Border radius: `--border/radius/radius-1000` (999px)
  - Padding: `--element/pad-x-sm` (8px)
  - Typography: Body/B3/Semibold (12px, line-height 1.667)
  
- **Sizes:**
  - Small: `pad-x-sm` (8px), `pad-y-sm` (4px), `gap-sm` (8px)
  - Medium (default): `pad-x-md` (10px), `pad-y-md` (6px), `gap-md` (10px)
  - Large: `pad-x-lg` (16px), `pad-y-lg` (8px), `gap-md` (10px)
  
- **Styles (Colors):**
  - Primary: `--_primary/primary` (#0472a8)
  - Secondary: `--_secondary/secondary` (#445c6a)
  - Success: `--_success/success` (#3e691a)
  - Danger: `--_danger/danger` (#ba1a1a)
  - Warning: `--_warning/warning` (#9f8205)
  - Info: `--_info/info` (#0e8175)
  - Default: `--neutral-colors/outline-variant`
 

