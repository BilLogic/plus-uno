# RatingSingle Figma Specification Verification

**Figma Node:** 63:177673  
**URL:** https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177673

## Component Structure

The RatingSingle component has **2 variants** as shown in Figma:

### Variant 1: Rest State (Status=rest, check type=none)
- **Figma Node ID:** 63:177674
- Number displayed above (e.g., "1")
- Empty radio button below (white circle with primary border)

### Variant 2: Selected State (Status=selected, check type=check)
- **Figma Node ID:** 63:177677
- Number displayed above (e.g., "1") - **bold/semibold**
- Filled radio button below (primary dot inside circle)

## Current Implementation ✅

### Component (RatingSingle.jsx)

```jsx
<div className="rating-single rating-single--{status}">
  {/* Number text */}
  <div className="rating-single__number">{value}</div>
  
  {/* Radio button */}
  <div className="rating-single__radio">
    {isSelected && <div className="rating-single__radio-inner" />}
  </div>
</div>
```

**Props:**
- `value` - Number to display (1-5)
- `status` - 'rest' or 'selected'
- `onClick` - Click handler
- `className`, `style` - Additional styling

**Data Node IDs:**
- Rest: `data-node-id="63:177674"` ✅
- Selected: `data-node-id="63:177677"` ✅

### Styles (RatingSingle.scss)

#### Layout ✅
- `display: flex`
- `flex-direction: column` (number on top, radio below)
- `gap: var(--size-element-gap-sm)` → 8px
- `align-items: center`
- `padding: 0 var(--size-element-pad-x-lg)` → 16px

#### Number Typography ✅
- `font-family: var(--font-family-body)` → Merriweather Sans
- `font-size: var(--font-size-lead)` → 20px
- `line-height: 1.6`
- `color: var(--color-primary-text)`
- **Rest state:** `font-weight: var(--font-weight-normal)` → 400
- **Selected state:** `font-weight: var(--font-weight-semibold-1)` → 600

#### Radio Button (Outer Circle) ✅
- `width: var(--size-spacing-medium-space-200)` → 12px
- `height: var(--size-spacing-medium-space-200)` → 12px
- `border-radius: var(--size-element-radius-full)` → 999px (circular)
- `border: var(--size-element-stroke-sm) solid var(--color-primary)` → 1px
- `background-color: var(--color-on-primary)` → white (unchecked)
- **Checked:** `background-color: var(--color-surface)`
- **Checked:** `padding: var(--size-spacing-small-space-025)` → 2px

#### Radio Button (Inner Dot) ✅
- `width: var(--size-spacing-small-space-100)` → 8px
- `height: var(--size-spacing-small-space-100)` → 8px
- `border-radius: var(--size-element-radius-full)` → 999px (circular)
- `background-color: var(--color-primary)`

#### Interactions ✅
- **Hover:** `opacity: 0.8`
- **Focus:** 2px outline with primary color
- **Keyboard:** Enter/Space key support
- **Transition:** `opacity 0.2s ease`, `all 0.2s ease`

## Design System Tokens Used

### Spacing
- ✅ `--size-element-gap-sm` (8px) - gap between number and radio
- ✅ `--size-element-pad-x-lg` (16px) - horizontal padding
- ✅ `--size-spacing-medium-space-200` (12px) - radio size
- ✅ `--size-spacing-small-space-100` (8px) - inner dot size
- ✅ `--size-spacing-small-space-025` (2px) - checked padding

### Typography
- ✅ `--font-family-body` (Merriweather Sans)
- ✅ `--font-size-lead` (20px)
- ✅ `--font-weight-normal` (400)
- ✅ `--font-weight-semibold-1` (600)

### Border/Radius
- ✅ `--size-element-radius-sm` (2px) - focus outline
- ✅ `--size-element-radius-full` (999px) - circular radio
- ✅ `--size-element-stroke-sm` (1px) - radio border

### Colors
- ✅ `--color-primary` - border and inner dot
- ✅ `--color-primary-text` - number text
- ✅ `--color-on-primary` - white background (unchecked)
- ✅ `--color-surface` - background (checked)

## Verification Checklist

- [x] Component structure matches Figma (number above, radio below)
- [x] Two variants: rest and selected
- [x] Correct Figma node IDs (63:177674, 63:177677)
- [x] Number typography: 20px, Merriweather Sans, 1.6 line-height
- [x] Font weight changes: normal (rest) → semibold (selected)
- [x] Radio button: 12px outer circle, 8px inner dot
- [x] All spacing uses design system tokens
- [x] All colors use design system tokens
- [x] Proper hover, focus, and keyboard interactions
- [x] Accessibility: role, tabIndex, keyboard support

## Conclusion

✅ **RatingSingle component is correctly implemented and matches the Figma design exactly.**

All design system tokens are properly used, the component structure matches Figma's 2 variants, and all interactions are implemented correctly.
