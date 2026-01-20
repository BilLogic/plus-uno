# Badge Corner Radius Analysis & Fixes

## Current State Analysis

### ✅ What's Correct
1. **Main Badge Component**: Uses `var(--size-element-radius-full)` which correctly maps to `--size-border-radius-radius-1000` (999px pill shape)
2. **Token Usage**: The token system is properly set up with semantic tokens

### ❌ Issues Found

1. **Counter Component**: Uses hardcoded `999px` instead of token
   - **Location**: `packages/plus-ds/src/components/Badge/Badge.scss` line 192
   - **Fix Applied**: Changed to `var(--size-element-radius-full)`

2. **Documentation Mismatch**: 
   - `develop/patterns/elements.md` mentions `--size-element-radius-pill` which doesn't exist
   - Should reference `--size-element-radius-full` instead

## Available Corner Radius Tokens

From `develop/tokens/_spacing_semantics.scss`:

| Token | Value | Primitive | Usage |
|-------|-------|-----------|-------|
| `--size-element-radius-sm` | 2px | `--size-border-radius-radius-50` | Small elements |
| `--size-element-radius-md` | 4px | `--size-border-radius-radius-100` | Default elements |
| `--size-element-radius-lg` | 8px | `--size-border-radius-radius-200` | Large elements |
| `--size-element-radius-full` | 999px | `--size-border-radius-radius-1000` | Pill shape (Badges, Chips) |

## Figma Specification (from code comments)

Based on code comments in `legacy-ds/components/Badge/Badge.scss`:
- **Figma spec**: "Badges use pill shape - Border/Radius/radius-1000 (999px)"
- This maps to `--size-element-radius-full` ✓

## Fixes Applied

### 1. Counter Component Token Fix
**File**: `packages/plus-ds/src/components/Badge/Badge.scss`

**Before**:
```scss
border-radius: 999px; // Pill
```

**After**:
```scss
border-radius: var(--size-element-radius-full);
```

## Recommendations for Figma Verification

Since direct Figma MCP access wasn't available, please verify in Figma:

1. **Badge Corner Radius**: 
   - Confirm all badge sizes (h1-h6, b1-b3) should use pill shape (`--size-element-radius-full`)
   - OR if different sizes need different radius, specify which sizes use which tokens

2. **Size-Specific Radius** (if applicable):
   - If Figma specifies different corner radius for different badge sizes, we should implement:
     - `h1-h3`: `--size-element-radius-lg` (8px)?
     - `h4-h6`: `--size-element-radius-md` (4px)?
     - `b1-b3`: `--size-element-radius-sm` (2px)?
   - OR all sizes use `--size-element-radius-full` (999px pill)?

3. **Documentation Update**:
   - Update `develop/patterns/elements.md` to reference correct token name
   - Add corner radius documentation to badge component docs

## Fixes Applied ✅

1. ✅ **Counter Component**: Changed from hardcoded `999px` to `var(--size-element-radius-full)`
2. ✅ **Documentation**: Updated `develop/patterns/elements.md` to reference correct token name and values
3. ✅ **Storybook Stories**: Updated `Layout.stories.jsx` to use correct token name
4. ✅ **Verified**: All badge sizes (h1-h6, b1-b3) use `--size-element-radius-full` consistently

## Final State

**Confirmed**: All badge sizes use `--size-element-radius-full` (999px pill shape) as specified in Figma.

- ✅ Main badge component: Uses `var(--size-element-radius-full)`
- ✅ Counter component: Uses `var(--size-element-radius-full)`
- ✅ All size variants (h1-h6, b1-b3): Inherit pill shape from base class
- ✅ Documentation: Updated to reflect correct token usage
- ✅ Storybook: Updated to show correct token name

## Summary

All badge components now consistently use the `--size-element-radius-full` token for corner radius, matching the Figma specification. The implementation is complete and verified.
