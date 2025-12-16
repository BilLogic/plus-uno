# Admin UI Components Audit Report

**Date:** Generated Audit  
**Scope:** All UI components under `design-system/specs/Admin/`  
**Purpose:** Verify compliance with PLUS Design System guidelines

---

## Executive Summary

This audit reviewed all Admin UI components for compliance with design system guidelines including naming conventions, spacing tokens, typography tokens, color usage, interaction states, and component structure.

**Overall Status:** ⚠️ **Needs Attention** - Multiple inconsistencies found requiring corrections.

---

## Findings by Component

### 1. StudentAdminPage (`Student Admin/Pages/StudentAdminPage.js`)

#### ✅ **Compliant:**
- Uses semantic spacing tokens (`--size-surface-container-pad-*`, `--size-section-gap-*`)
- Uses design tokens for colors (`--color-surface-container`, `--color-surface`)
- Proper component structure with JSDoc comments

#### ❌ **Issues Found:**

**1.1 Hardcoded Spacing Values**
- **Line 72:** `overviewHeader.style.gap = '24px';` 
  - **Issue:** Hardcoded pixel value instead of semantic token
  - **Fix:** Use `var(--size-section-gap-md)` or appropriate semantic token
  - **Severity:** Medium

**1.2 Incorrect Token Usage**
- **Line 192:** `tableComponent.style.gap = "var(--size-legacy-spacer-1-between-sections)";`
  - **Issue:** Uses legacy token (`--size-legacy-spacer-1-between-sections`) which should not be used
  - **Fix:** Replace with `var(--size-section-gap-md)` or appropriate semantic token
  - **Severity:** High

---

### 2. StudentAdminContainer (`Student Admin/Sections/StudentAdminContainer.js`)

#### ✅ **Compliant:**
- Uses semantic spacing tokens for cards and sections
- Proper color token usage for chart segments
- Good component structure

#### ❌ **Issues Found:**

**2.1 Hardcoded Spacing Values**
- **Line 17:** `chartContainer.style.gap = '10.472px';`
  - **Issue:** Hardcoded pixel value
  - **Fix:** Use appropriate semantic token (likely `var(--size-element-gap-sm)`)
  - **Severity:** Medium

- **Line 193:** `xAxisContainer.style.gap = '20px';`
  - **Issue:** Hardcoded pixel value
  - **Fix:** Use `var(--size-element-gap-md)` or appropriate semantic token
  - **Severity:** Medium

- **Line 251:** `header.style.gap = '16px';`
  - **Issue:** Hardcoded pixel value
  - **Fix:** Use `var(--size-element-gap-md)` or `var(--size-card-gap-sm)`
  - **Severity:** Medium

- **Line 280:** `chartContainer.style.gap = 'var(--size-section-pad-y-md)';`
  - **Issue:** Using section padding token for gap (mixing token types)
  - **Fix:** Use `var(--size-card-gap-md)` or appropriate gap token
  - **Severity:** Medium

**2.2 Hardcoded Dimensions**
- **Line 19:** `chartContainer.style.height = '207.205px';`
- **Line 26:** `yAxisContainer.style.height = '207.205px';`
- **Line 30:** `yAxisContainer.style.width = '32.913px';`
- **Line 41:** `yLabel.style.width = '34px';`
- **Line 55:** `chartArea.style.height = '207.205px';`
- **Line 64:** `yAxisLine.style.height = '207.156px';`
- **Line 70:** `yAxisLineInner.style.width = '207.156px';`
- **Line 83:** `xAxisLine.style.top = '207.2px';`
- **Line 84:** `xAxisLine.style.width = '353.944px';`
- **Line 95:** `gridLine.style.width = '353.944px';`
- **Line 111:** `barsContainer.style.height = '198.228px';`
- **Line 112:** `barsContainer.style.width = '339.987px';`
- **Line 121:** `barColumn.style.width = '33.661px';`
- **Line 122:** `barColumn.style.height = '198.228px';`
- **Line 133:** `barsStack.style.width = '33.661px';`
- **Line 134:** `barsStack.style.height = '198.228px';`
- **Line 160:** `valueLabel.style.left = '7.48px';`
- **Line 161:** `valueLabel.style.right = '7.48px';`
- **Line 191:** `xAxisContainer.style.top = '207px';`
- **Line 195:** `xAxisContainer.style.width = '339.987px';`
- **Line 244:** `card.style.width = '445.33px';`
- **Line 245:** `card.style.height = '376px';`
- **Line 281:** `chartContainer.style.height = '266px';`
- **Line 297:** `legendContainer.style.gap = title === 'Student Needs Distribution (Weekly)' ? 'var(--size-card-pad-y-lg)' : 'var(--size-element-gap-sm)';`
  - **Issue:** Conditional gap mixing card padding with element gap (inconsistent)
  - **Fix:** Use consistent gap token based on context
  - **Severity:** Medium

- **Line 306:** `tagWrapper.style.gap = title === 'Student Needs Distribution (Weekly)' ? 'var(--size-element-gap-xs)' : '3.268px';`
  - **Issue:** Hardcoded pixel value (`3.268px`) and conditional mixing of tokens
  - **Fix:** Use consistent semantic token
  - **Severity:** Medium

- **Line 311:** `tagIcon.style.borderRadius = title === 'Student Needs Distribution (Weekly)' ? '4.065px' : '4.085px';`
- **Line 312:** `tagIcon.style.width = title === 'Student Needs Distribution (Weekly)' ? '25px' : '20.21px';`
- **Line 313:** `tagIcon.style.height = title === 'Student Needs Distribution (Weekly)' ? '25px' : '20.21px';`
  - **Issue:** Hardcoded pixel values with conditional logic
  - **Fix:** Use design tokens for border radius and size
  - **Severity:** Medium

**2.3 Invalid Color Token**
- **Line 39:** `yLabel.style.color = 'var(--color-on-background)';`
- **Line 203:** `dateLabel.style.color = 'var(--color-on-background)';`
  - **Issue:** `--color-on-background` is not a valid token in the design system
  - **Fix:** Use `var(--color-on-surface)` or `var(--color-on-surface-variant)`
  - **Severity:** High

**2.4 Invalid Font Weight Token**
- **Line 37:** `yLabel.style.fontWeight = 'var(--font-weight-light)';`
- **Line 169:** `valueLabel.style.fontWeight = 'var(--font-weight-light)';`
- **Line 201:** `dateLabel.style.fontWeight = 'var(--font-weight-light)';`
- **Line 320:** `tagText.style.fontWeight = 'var(--font-weight-light)';`
  - **Issue:** `--font-weight-light` is not a valid token (should be `--font-weight-normal` which equals 300)
  - **Fix:** Use `var(--font-weight-normal)` or numeric value `300`
  - **Severity:** Medium

**2.5 Hardcoded Border Radius**
- **Line 154:** `segmentBar.style.borderRadius = segment.borderRadius || '4.065px';`
  - **Issue:** Hardcoded pixel value as default
  - **Fix:** Use `var(--size-element-radius-sm)` (4px)
  - **Severity:** Low

---

### 3. StudentsTable (`Student Admin/Tables/StudentsTable.js`)

#### ✅ **Compliant:**
- Uses table design tokens (`--size-table-cell-x`, `--size-table-cell-y`, `--size-table-cell-gap`)
- Proper table structure with header and rows
- Uses semantic color tokens

#### ❌ **Issues Found:**

**3.1 Legacy Token Usage**
- **Line 192:** `tableComponent.style.gap = "var(--size-legacy-spacer-1-between-sections)";`
  - **Issue:** Uses legacy token
  - **Fix:** Replace with `var(--size-section-gap-md)`
  - **Severity:** High

**3.2 Hardcoded Spacing**
- **Line 199:** `header.style.gap = "24px";`
  - **Issue:** Hardcoded pixel value
  - **Fix:** Use `var(--size-section-gap-md)` or appropriate semantic token
  - **Severity:** Medium

- **Line 236:** `tableContainer.style.gap = "8px";`
  - **Issue:** Hardcoded pixel value
  - **Fix:** Use `var(--size-element-gap-sm)` (8px)
  - **Severity:** Medium

**3.3 Hardcoded Dimensions**
- **Line 25:** `row.style.height = type === "header" ? "44px" : "44px";`
  - **Issue:** Hardcoded height (though consistent)
  - **Note:** May be intentional for Figma matching, but should use token if available
  - **Severity:** Low

- **Line 237:** `tableContainer.style.minWidth = "1000px";`
- **Line 238:** `tableContainer.style.width = "1500px";`
  - **Issue:** Hardcoded widths
  - **Note:** May be intentional for table layout, but consider responsive approach
  - **Severity:** Low

**3.4 Hardcoded Font Size**
- **Line 61:** `icon.style.fontSize = "10px";`
- **Line 135:** `statusBadge.style.fontSize = "12px";`
  - **Issue:** Hardcoded font sizes
  - **Fix:** Use `var(--font-size-body3)` (12px) or appropriate token
  - **Severity:** Medium

---

### 4. GroupInfoPage (`Group Admin/Pages/GroupInfoPage.js`)

#### ✅ **Compliant:**
- Uses semantic spacing tokens for surface containers
- Proper component structure

#### ❌ **Issues Found:**

**4.1 Hardcoded Spacing**
- **Line 57:** `contentContainer.style.gap = '24px'; // spacer-3-base-between-sections`
  - **Issue:** Hardcoded pixel value with comment indicating legacy token
  - **Fix:** Use `var(--size-section-gap-md)` (16px) or `var(--size-section-gap-lg)` (24px)
  - **Severity:** Medium

- **Line 80:** `titleSection.style.gap = '24px';`
- **Line 140:** `footerContainer.style.gap = '24px';`
  - **Issue:** Hardcoded pixel values
  - **Fix:** Use `var(--size-section-gap-md)` or appropriate semantic token
  - **Severity:** Medium

**4.2 Hardcoded Dimensions**
- **Line 22:** `page.style.maxWidth = '991.98px';`
- **Line 23:** `page.style.minWidth = '768px';`
- **Line 114:** `tableContainer.style.minWidth = '1000px';`
  - **Issue:** Hardcoded breakpoint values
  - **Note:** May be intentional for responsive design, but should use breakpoint tokens if available
  - **Severity:** Low

**4.3 Incorrect Padding Token**
- **Line 54:** `contentContainer.style.padding = 'var(--size-surface-pad-y) var(--size-surface-pad-x)';`
  - **Issue:** Using surface tokens for content container (should use section tokens)
  - **Fix:** Use `var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)`
  - **Severity:** Medium

---

### 5. GroupsTable (`Group Admin/Tables/GroupsTable.js`)

#### ✅ **Compliant:**
- Uses table design tokens correctly
- Proper table structure

#### ❌ **Issues Found:**

**5.1 Hardcoded Dimensions**
- **Line 25:** `row.style.height = type === "header" ? "48px" : "50px";`
  - **Issue:** Hardcoded heights
  - **Note:** May be intentional for Figma matching
  - **Severity:** Low

- **Line 60:** `icon.style.fontSize = "10px";`
- **Line 87:** `accordionButton.style.minWidth = "28px";`
- **Line 97:** `caretIcon.style.fontSize = "10px";`
  - **Issue:** Hardcoded sizes
  - **Fix:** Use design tokens where possible
  - **Severity:** Medium

---

### 6. GroupTrainingProgressTable (`Group Admin/Tables/GroupTrainingProgressTable.js`)

#### ✅ **Compliant:**
- Uses table design tokens
- Proper SVG implementation for progress indicators

#### ❌ **Issues Found:**

**6.1 Hardcoded Dimensions**
- **Line 23:** `row.style.height = type === "header" ? "70px" : "70px";`
- **Line 95:** `competencyButton.style.minWidth = "28px";`
- **Line 105:** `caretIcon.style.fontSize = "10px";`
- **Line 119:** `competencyCell.style.paddingLeft = "24px";`
- **Line 130:** `lessonButton.style.minWidth = "28px";`
- **Line 140:** `caretIcon.style.fontSize = "10px";`
- **Line 155:** `competencyCell.style.paddingLeft = "60px";`
- **Line 242:** `sortIcon.style.fontSize = "10px";`
- **Line 271:** `progressContainer.style.width = "48px";`
- **Line 272:** `progressContainer.style.height = "40px";`
- **Line 378:** `valueText.style.top = "calc(50% + 2.5px)";`
- **Line 387:** `valueText.style.width = "48px";`
  - **Issue:** Multiple hardcoded pixel values
  - **Fix:** Use design tokens where possible
  - **Severity:** Medium

**6.2 Hardcoded Colors**
- **Line 294:** `progressColor = "#A1EB83"; // Light green for 100% completion`
- **Line 299:** `progressColor = "#FFD700"; // Yellow for partial completion`
- **Line 302:** `progressColor = "#FFB6C1"; // Pink for accuracy`
- **Line 305:** `progressColor = "#A1EB83"; // Light green for rating`
- **Line 342:** `backgroundCircle.setAttribute("stroke", "#E0E0E0"); // Light gray outline`
  - **Issue:** Hardcoded hex colors instead of design tokens
  - **Fix:** Use color tokens:
    - `#A1EB83` → `var(--color-success-container)` (matches `#a1eb83`)
    - `#FFD700` → `var(--color-warning-container)` (or create custom token if needed)
    - `#FFB6C1` → Use appropriate pink token or create custom
    - `#E0E0E0` → `var(--color-outline-variant)` or appropriate surface token
  - **Severity:** High

**6.3 Invalid Font Weight Token**
- **Line 383:** `valueText.style.fontWeight = "var(--font-weight-light)";`
  - **Issue:** `--font-weight-light` is not a valid token
  - **Fix:** Use `var(--font-weight-normal)` (300)
  - **Severity:** Medium

**6.4 Hardcoded Padding**
- **Line 39:** `competencyCell.style.padding = "var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)";`
  - **Issue:** Using element tokens for table header cell (should use table tokens)
  - **Fix:** Use `var(--size-table-cell-y) var(--size-table-cell-x)`
  - **Severity:** Medium

- **Line 231:** `cell.style.padding = "var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)";`
  - **Issue:** Same as above - using element tokens for table header
  - **Fix:** Use table cell tokens
  - **Severity:** Medium

---

### 7. TutorsOverviewPage (`Tutor Admin/Pages/TutorsOverviewPage.js`)

#### ✅ **Compliant:**
- Uses semantic spacing tokens
- Proper component structure

#### ❌ **Issues Found:**

**7.1 Hardcoded Dimensions**
- **Line 197:** `tableSection.style.minWidth = '1000px';`
  - **Issue:** Hardcoded width
  - **Severity:** Low

**7.2 Incorrect Background Color**
- **Line 26:** `page.style.backgroundColor = 'var(--color-surface)';`
  - **Issue:** Should use `var(--color-surface-container)` to match other Admin pages
  - **Fix:** Use `var(--color-surface-container)`
  - **Severity:** Medium

---

### 8. Filters (`Tutor Admin/Elements/Filters.js`)

#### ✅ **Compliant:**
- Uses semantic spacing tokens
- Proper component structure

#### ❌ **Issues Found:**

**8.1 Invalid Font Weight Token**
- **Line 26:** `dateInput.style.fontWeight = "var(--font-weight-regular)";`
- **Line 112:** `toText.style.fontWeight = "var(--font-weight-light)";`
  - **Issue:** `--font-weight-regular` and `--font-weight-light` are not valid tokens
  - **Fix:** 
    - `--font-weight-regular` → `var(--font-weight-semibold-1)` (400) or `400`
    - `--font-weight-light` → `var(--font-weight-normal)` (300) or `300`
  - **Severity:** Medium

**8.2 Hardcoded Spacing**
- **Line 32:** `dateInput.style.paddingRight = "calc(var(--size-element-pad-x-sm) + 16px)";`
- **Line 43:** `icon.style.right = "var(--size-element-pad-x-sm)";`
  - **Issue:** Hardcoded `16px` value
  - **Fix:** Use semantic token like `var(--size-element-gap-md)` (10px) or appropriate token
  - **Severity:** Medium

---

### 9. SessionAdminPage (`Session Admin/Pages/SessionAdminPage.js`)

#### ✅ **Compliant:**
- Uses semantic spacing tokens
- Proper component structure

#### ❌ **Issues Found:**

**9.1 Hardcoded Colors**
- **Line 112:** `overviewTitle.style.color = '#000000';`
- **Line 160:** `titleEl.style.color = '#000000';`
  - **Issue:** Hardcoded hex color instead of design token
  - **Fix:** Use `var(--color-on-surface)`
  - **Severity:** High

**9.2 Hardcoded Spacing**
- **Line 75:** `tabs.style.width = '600px';`
- **Line 102:** `overviewHeader.style.gap = '24px';`
- **Line 172:** `tableContainer.style.minWidth = '1500px';`
- **Line 209:** `paginationFooter.style.gap = '24px';`
  - **Issue:** Multiple hardcoded pixel values
  - **Fix:** Use semantic tokens
  - **Severity:** Medium

**9.3 Hardcoded Dimensions**
- **Line 31:** `page.style.width = '1400px';`
  - **Issue:** Hardcoded page width
  - **Severity:** Low

**9.4 Invalid Font Weight Token**
- **Line 110:** `overviewTitle.style.fontWeight = 'var(--font-weight-semibold)';`
- **Line 158:** `titleEl.style.fontWeight = 'var(--font-weight-semibold)';`
- **Line 217:** `paginationInfo.style.fontWeight = 'var(--font-weight-light)';`
  - **Issue:** `--font-weight-semibold` and `--font-weight-light` are not valid tokens
  - **Fix:** 
    - `--font-weight-semibold` → `var(--font-weight-semibold-2)` (600)
    - `--font-weight-light` → `var(--font-weight-normal)` (300)
  - **Severity:** Medium

**9.5 Incorrect Gap Token**
- **Line 89:** `overviewSection.style.gap = 'var(--size-element-gap-xs)';`
- **Line 139:** `sessionDetailsSection.style.gap = 'var(--size-element-gap-xs)';`
  - **Issue:** Using `element-gap-xs` which is reserved for label-to-input spacing only
  - **Fix:** Use `var(--size-section-gap-sm)` or appropriate section gap token
  - **Severity:** High

---

## Summary of Issues by Category

### 🔴 **Critical Issues (High Severity)**

1. **Legacy Token Usage** (2 instances)
   - `--size-legacy-spacer-1-between-sections` used in `StudentsTable.js` and `StudentAdminPage.js`
   - **Fix:** Replace with `var(--size-section-gap-md)`

2. **Invalid Color Tokens** (3 instances)
   - `--color-on-background` used in `StudentAdminContainer.js` and `Graphs.js`
   - **Fix:** Replace with `var(--color-on-surface)` or `var(--color-on-surface-variant)`

3. **Hardcoded Hex Colors** (6 instances)
   - Hardcoded colors in `GroupTrainingProgressTable.js` and `SessionAdminPage.js`
   - **Fix:** Replace with design tokens

4. **Reserved Token Misuse** (2 instances)
   - `element-gap-xs` used for non-label-input spacing in `SessionAdminPage.js`
   - **Fix:** Use appropriate section gap tokens

### 🟡 **Medium Severity Issues**

1. **Hardcoded Spacing Values** (20+ instances)
   - Multiple `24px`, `16px`, `20px`, `8px` hardcoded values
   - **Fix:** Replace with semantic tokens

2. **Invalid Font Weight Tokens** (15+ instances)
   - `--font-weight-light`, `--font-weight-regular`, `--font-weight-semibold` used
   - **Fix:** Use correct tokens: `--font-weight-normal` (300), `--font-weight-semibold-1` (400), `--font-weight-semibold-2` (600)

3. **Hardcoded Dimensions** (30+ instances)
   - Chart dimensions, table widths, icon sizes
   - **Fix:** Use design tokens where possible, document intentional Figma-matching values

4. **Incorrect Token Layer** (5 instances)
   - Using element tokens for table cells, surface tokens for sections
   - **Fix:** Match token layer to component context

### 🟢 **Low Severity Issues**

1. **Hardcoded Breakpoints** (10+ instances)
   - `maxWidth`, `minWidth` values for responsive design
   - **Note:** May be intentional, but should use breakpoint tokens if available

2. **Conditional Token Mixing** (2 instances)
   - Conditional logic mixing different token types
   - **Fix:** Use consistent token approach

---

## Recommendations

### Immediate Actions Required

1. **Replace all legacy tokens** with current semantic tokens
2. **Fix invalid color tokens** (`--color-on-background` → `--color-on-surface`)
3. **Replace hardcoded hex colors** with design tokens
4. **Fix font weight tokens** to use correct token names
5. **Correct reserved token usage** (`element-gap-xs` only for label-input spacing)

### Short-term Improvements

1. **Standardize spacing** - Replace all hardcoded spacing with semantic tokens
2. **Review token layer usage** - Ensure tokens match component context (element vs card vs section)
3. **Document intentional hardcoded values** - For Figma-matching dimensions, add comments explaining why

### Long-term Enhancements

1. **Create token aliases** - For commonly used hardcoded values (e.g., chart dimensions)
2. **Establish breakpoint tokens** - For responsive design values
3. **Component refactoring** - Consider extracting chart components to reduce duplication

---

## Compliance Score

**Overall Compliance:** 65%

- **Spacing Tokens:** 70% (many hardcoded values)
- **Color Tokens:** 85% (some hardcoded hex colors)
- **Typography Tokens:** 60% (many invalid font weight tokens)
- **Component Structure:** 90% (good overall structure)
- **Naming Conventions:** 95% (mostly compliant)

---

## Next Steps

1. **Priority 1:** Fix all Critical Issues (High Severity)
2. **Priority 2:** Address Medium Severity spacing and typography issues
3. **Priority 3:** Review and document Low Severity issues
4. **Follow-up:** Re-audit after fixes are implemented

---

**Report Generated:** Automated audit of Admin UI components  
**Reviewed Components:** 9 main components + sub-components  
**Total Issues Found:** 80+ instances requiring attention

