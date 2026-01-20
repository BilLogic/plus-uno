# Badge Shape Fix - Summary

## 🐛 Issue
The user clearly indicated that the "Group Size" badges still appeared as squares, even though a "Pill" shape (standard Design System style) was expected/preferred following the "Use Plus Design System" instruction.

## 🛠️ Fix Implemented
- **File**: `packages/plus-ds/src/specs/Admin/Group Admin/Tables/GroupsTable/GroupsTable.scss`
- **Action**:
  - Removed the `min-width` and specific `padding` overrides that forced the square shape.
  - Updated `border-radius` to use the correct token `var(--size-element-radius-full)` (which resolves to `999px`) instead of the potentially undefined `radius-pill` or the previous square setting.

## ✅ Verification
- **Browser Check**: Confirmed via computed style inspection that the badge `border-radius` is now **999px**.
- **Visual Result**: The badges now appear as proper **Pills**, consistent with the standard Universal Design System badges.

The badges now strictly follow the PLUS Design System's standard badge component styling (Pill shape).
