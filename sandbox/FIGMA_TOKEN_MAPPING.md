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

