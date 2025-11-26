# Figma Replication Test - Sign-in Portal

This prototype replicates the Sign-in Portal design from Figma.

## Figma Reference

- **Figma Link**: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=115-5206
- **Node ID**: 115-5206

## Design Specifications

### Layout
- **Background**: Surface container color (`--color-surface-container`)
- **Main Container**: Centered, vertical flex layout with gap `--size-surface-gap-lg` (32px)
- **Card**: White card with elevation light-3 shadow, rounded corners (16px), padding `--size-card-pad-x-lg` and `--size-card-pad-y-lg` (24px)

### Typography
- **Heading "Login"**: 
  - Font: Lato Bold
  - Size: 40px
  - Line height: 1.6
  - Color: `--color-on-surface`
  
- **Subtitle "Double Math Learning with PLUS."**:
  - Font: Merriweather Sans Light
  - Size: 16px
  - Line height: 1.5
  - Color: `--color-on-surface`

- **Footer Text**:
  - Font: Merriweather Sans Light
  - Size: 16px
  - Line height: 1.5
  - "Contact us" link: Bold, color #0472a8, underlined

### Components

1. **Logo**
   - Style: Colored
   - Size: S
   - With text wordmark

2. **Google Button**
   - Style: Outline with primary border
   - Text: "Continue with Google"
   - Icon: Google icon (24x24px)
   - Full width

3. **Clever Button**
   - Style: Filled
   - Background: #2e76ff
   - Image: Clever image (200x44px)
   - Full width
   - Height: 40px

4. **Divider**
   - Line: 1px, color `--color-outline-variant`
   - Text: "or" (Merriweather Sans Light, 16px)
   - Gap: `--size-element-gap-lg` (12px)

5. **Try a demo Button**
   - Style: Tonal (secondary)
   - Text: "Try a demo"
   - Full width

6. **Footer**
   - Text: "Need help? Contact us."
   - Centered
   - Link color: #0472a8

## Implementation Notes

- All spacing uses design tokens (no hardcoded values)
- All colors use design tokens (except Clever button #2e76ff which is brand-specific)
- Typography matches Figma specifications exactly
- Components use PLUS design system components where possible
- Bootstrap 4.6.2 used as functional foundation, all styling overridden with design tokens

## File Structure

```
playground/prototyping/bill/figma-replication-test/
├── index.html          # Main HTML file
├── script.js           # JavaScript for component initialization
└── README.md           # This file
```

## Import Paths

- **Components**: `../../../../design-system/components/index.js`
- **Logo**: `../../../../design-system/assets/Logo/index.js`
- **CSS**: `../../../../dist/css/main.css`
- **Images**: `../../../../design-system/assets/images/auth-providers/`

## Validation Checklist

- [x] Google Fonts loaded in `<head>`
- [x] Bootstrap 4.6.2 CSS loaded
- [x] Font Awesome loaded
- [x] PLUS Design System CSS loaded
- [x] All design tokens used (no hardcoded values except Clever brand color)
- [x] Typography matches Figma exactly
- [x] Spacing matches Figma exactly
- [x] Components use PLUS design system
- [x] Import paths correct for prototype location
- [x] Script tag has `type="module"`

## Local Development

### Starting the Server

**IMPORTANT**: The server must be run from the **project root** (not this directory) to ensure relative paths resolve correctly.

```bash
# From the project root
cd /path/to/plus-vibe-coding-starting-kit

# Start local server
python3 -m http.server 8000
```

### Opening in Browser

1. **Cursor Browser** (recommended):
   - The prototype will automatically open in Cursor's integrated browser
   - URL: `http://localhost:8000/playground/prototyping/bill/figma-replication-test/`

2. **External Browser**:
   - Navigate to `http://localhost:8000/playground/prototyping/bill/figma-replication-test/` in your preferred browser

## Testing

1. **Start the local server** (see above)
2. Open `http://localhost:8000` in a browser
3. Verify fonts load correctly (check DevTools Network tab)
4. Verify CSS variables are available (check DevTools Console)
5. Verify components render correctly
6. Verify all buttons are clickable
7. Verify responsive behavior

## Next Steps

- [ ] Test in multiple browsers
- [ ] Verify accessibility (ARIA attributes, keyboard navigation)
- [ ] Add actual OAuth integration logic
- [ ] Add error handling
- [ ] Add loading states

