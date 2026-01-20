# Session Breakdown Table Update - Summary

## ✅ Tasks Completed

1. **Remove Row Borders**
   - **File**: `packages/plus-ds/src/specs/Admin/Session Admin/Tables/SessionBreakdownTable/SessionBreakdownTable.scss`
   - **Action**: Commented out `border-bottom` on `tbody td` elements.
   - **Reason**: User requested removal of lines between rows to match Figma design node 987-127671.

2. **Verification**
   - Verified via Storybook (`Specs/Admin/Session Admin/Tables/SessionBreakdownTable`) that the table body rows no longer have horizontal dividers.

## 🎯 Result
The `SessionBreakdownTable` now displays cleaner rows without internal borders, cleaner and matching the desired visual spec.
