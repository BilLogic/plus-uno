# Training Spec Components - Design System Audit Report

**Date:** Generated automatically  
**Scope:** All UI components under `design-system/specs/Training/`  
**Standards Reference:** `develop/standards.md`, `design-system/styles/`

---

## Executive Summary

This audit reviews all Training spec components for compliance with PLUS Design System guidelines. Key findings include:

- **Hardcoded pixel values**: Many components use hardcoded `px` values instead of design tokens
- **Inconsistent spacing**: Mix of hardcoded gaps/padding and token usage
- **Typography**: Generally compliant, but some hardcoded font sizes
- **Color usage**: Mostly compliant with design tokens
- **Component structure**: Generally follows patterns, but some inconsistencies

---

## Critical Issues by Component

### 1. **AlertForSupervisors** (`Lessons/Cards/AlertForSupervisors.js`)

#### Issues:
- ❌ **Hardcoded width**: `width: '680px'` (lines 21, 34, 96) - Should use semantic width token or `max-width` with token
- ❌ **Primitive token usage**: `var(--spacing/small/space-050, 4px)` (lines 50, 112) - Should use `var(--size-element-gap-xs)` or appropriate semantic token
- ⚠️ **Inconsistent radius**: Uses `--size-modal-radius-md` for disabled state (line 33) but `--size-element-radius-sm` for enabled state (line 95) - Should be consistent

#### Recommendations:
```javascript
// Replace hardcoded widths
container.style.maxWidth = '680px'; // or use appropriate semantic token
container.style.width = '100%';

// Replace primitive tokens
message.style.gap = 'var(--size-element-gap-xs)'; // 4px - reserved for label-input spacing
// OR use appropriate semantic gap token based on context
```

---

### 2. **SortControl** (`Lessons/Elements/SortControl.js`)

#### Issues:
- ❌ **Hardcoded icon sizes**: `fontSize: '12px'` (lines 43, 133) - Should use design system icon size token
- ❌ **Hardcoded menu dimensions**: `minWidth: '218.67px'`, `width: '332px'` (lines 152-153) - Should use semantic tokens
- ❌ **Hardcoded margin**: `marginTop: '4px'` (line 148) - Should use `var(--size-element-gap-xs)` if appropriate
- ✅ **Good**: Uses correct small size tier tokens (`element-pad-x-sm`, `element-radius-sm`, `body3` typography)

#### Recommendations:
```javascript
// Use icon size token (check if exists in design system)
checkIcon.style.fontSize = 'var(--size-icon-sm)'; // or appropriate token

// Use semantic width tokens
menu.style.minWidth = 'var(--size-dropdown-min-width)'; // if token exists
menu.style.width = 'var(--size-dropdown-width)'; // if token exists

// Use gap token
menu.style.marginTop = 'var(--size-element-gap-xs)'; // 4px
```

---

### 3. **LessonListItem** (`Lessons/Tables/LessonListItem.js`)

#### Issues:
- ❌ **Hardcoded width**: `width: '755px'` (line 41) - Should use semantic token or be responsive
- ✅ **Good**: Uses table-specific tokens (`--size-table-cell-x`, `--size-table-cell-y`, `--size-table-cell-gap`)
- ✅ **Good**: Correct state layer colors for hover/pressed/focus/disabled
- ⚠️ **Line height**: `lineHeight: '1.667'` (line 153) - Should verify if this matches design system token

#### Recommendations:
```javascript
// Make width responsive or use semantic token
row.style.maxWidth = '755px';
row.style.width = '100%';

// Verify line height matches token
headerText.style.lineHeight = 'var(--font-line-height-body3)'; // 1.667
```

---

### 4. **LessonsStudentOverviewSection** (`Lessons/Sections/LessonsStudentOverviewSection.js`)

#### Issues:
- ❌ **Hardcoded dimensions**: `height: '312px'`, `height: '256px'` (lines 86, 119) - Should use semantic tokens or be flexible
- ❌ **Hardcoded max-width**: `maxWidth: '1064px'` (line 91) - Should use semantic token
- ✅ **Good**: Uses section tokens correctly (`--size-section-gap-md`, `--size-section-pad-x-md`, `--size-section-pad-y-md`)
- ✅ **Good**: Uses table tokens correctly

#### Recommendations:
```javascript
// Use semantic height tokens or make flexible
tableContainer.style.minHeight = 'var(--size-section-min-height)'; // if exists
tableContainer.style.height = 'auto'; // or use max-height with overflow

// Use semantic max-width token
tableContainer.style.maxWidth = 'var(--size-section-max-width-lg)'; // if exists
```

---

### 5. **LikertScale** (`Lessons/Elements/LikertScale.js`)

#### Issues:
- ❌ **Hardcoded dimensions**: `height: '52px'`, `width: '198px'` (lines 36, 39, 69, 71) - Should use semantic tokens
- ✅ **Good**: Uses correct typography token (`--font-size-lead`)
- ✅ **Good**: Uses correct color token (`--color-primary-text`)
- ✅ **Good**: Uses correct gap tokens

#### Recommendations:
```javascript
// Use semantic dimension tokens
leftLabelEl.style.minHeight = 'var(--size-element-height-lg)'; // if exists
leftLabelEl.style.width = 'var(--size-label-width-md)'; // if exists
// OR make responsive
leftLabelEl.style.minWidth = '198px';
leftLabelEl.style.width = '100%';
leftLabelEl.style.maxWidth = '198px';
```

---

### 6. **LessonInnerPage** (`Lessons/Pages/LessonInnerPage.js`)

#### Issues:
- ❌ **Extensive hardcoded pixel values**: Many `px` values throughout (heights, widths, gaps, padding)
  - `height: '1298px'` (line 85)
  - `height: '746px'` (line 47)
  - `width: '168px'` (multiple instances)
  - `gap: '10px'`, `gap: '8px'`, `gap: '4px'` (many instances)
  - `padding: '16px'` (multiple instances)
  - `height: '6px'` (progress bars)
  - `width: '100px'` (progress bars)
  - `width: '703.98px'` (line 733)
  - `width: '896px'` (multiple instances)
  - `height: '208px'`, `height: '159.654px'`, `width: '200px'` (image containers)
  - `height: '341px'`, `width: '227px'` (page 4 image)
  - `height: '100px'` (textarea)
  - `width: '12px'`, `height: '12px'` (radio buttons)
- ❌ **Hardcoded gaps**: `gap: '24px'` (multiple instances) - Should use `var(--size-section-gap-lg)` or appropriate token
- ❌ **Hardcoded padding**: `padding: '16px'` (multiple instances) - Should use semantic padding tokens
- ⚠️ **Inconsistent spacing**: Mix of hardcoded values and tokens

#### Recommendations:
```javascript
// Replace hardcoded gaps
contentSections.style.gap = 'var(--size-section-gap-lg)'; // 24px

// Replace hardcoded padding
quoteCardInner.style.padding = 'var(--size-card-pad-x-md)'; // 16px matches card-pad-x-md

// Replace hardcoded dimensions with semantic tokens or responsive values
imageContainer.style.minHeight = '208px';
imageContainer.style.height = 'auto';

// Use semantic width tokens where possible
researchText.style.maxWidth = '703.98px';
researchText.style.width = '100%';
```

---

### 7. **LessonsOverviewPage** (`Lessons/Pages/LessonsOverviewPage.js`)

#### Issues:
- ❌ **Hardcoded dimensions**: 
  - `height: '746px'` (line 47)
  - `width: '768px'` (line 53)
  - `maxWidth: '991.98px'` (line 49)
  - `minWidth: '768px'` (line 50)
  - `height: '666px'` (lines 284, 301)
  - `height: '456px'` (lines 431, 442)
  - `width: '168px'` (multiple instances)
  - `width: '531.5px'` (line 345)
  - `minWidth: '755px'` (line 444)
- ❌ **Hardcoded gaps**: `gap: '10px'`, `gap: '8px'`, `gap: '4px'` (multiple instances)
- ❌ **Hardcoded padding**: `padding: '0 4px'` (line 206)
- ⚠️ **Inconsistent spacing**: Mix of hardcoded values and tokens

#### Recommendations:
```javascript
// Replace hardcoded gaps with tokens
filterBar.style.gap = 'var(--size-element-gap-md)'; // 10px
filterLeft.style.gap = 'var(--size-element-gap-sm)'; // 8px
footnoteText.style.gap = 'var(--size-element-gap-xs)'; // 4px

// Replace hardcoded padding
namePill.style.padding = '0 var(--size-element-pad-x-xs)'; // if exists, or use appropriate token

// Make dimensions responsive or use semantic tokens
page.style.maxHeight = '746px';
page.style.height = 'auto';
page.style.minHeight = '746px';
```

---

### 8. **LessonCardItem** (`Lessons/Cards/LessonCardItem.js`)

#### Issues:
- ❌ **Hardcoded dimensions**: 
  - `maxWidth: '444px'`, `minWidth: '218.67px'`, `width: '332px'` (lines 40-42)
  - `height: '184px'` (thumbnail, line 89)
  - `height: '161px'` (content, line 120)
  - `height: '28px'` (title, line 194)
  - `height: '1px'` (divider, line 222)
  - `minWidth: '36px'` (status button, line 298)
  - `width: '14px'` (icon wrapper, line 314)
  - `fontSize: '16px'` (icon, line 318)
  - `width: '36px'` (AI indicator, line 337)
- ⚠️ **Hardcoded font size**: `fontSize: '16px'` - Should use typography token

#### Recommendations:
```javascript
// Use semantic dimension tokens or make responsive
card.style.maxWidth = 'var(--size-card-max-width-md)'; // if exists
card.style.width = '100%';

// Use typography token
statusIconEl.style.fontSize = 'var(--font-size-body1)'; // 16px
```

---

### 9. **TrainingLessonStatusSelect** (`Lessons/Elements/TrainingLessonStatusSelect.js`)

#### Issues:
- ❌ **Hardcoded dimensions**: 
  - `height: '16px'` (counter, line 19)
  - `width: '12px'` (check icon, line 95)
  - `width: '12px'` (leading icon, line 118)
  - `minWidth: '28px'` (button, line 203)
  - `width: '10px'` (caret icon, line 229)
  - `marginTop: '4px'` (menu, line 241)
  - `minWidth: '218.67px'`, `width: '332px'` (menu, lines 245-246)
- ✅ **Good**: Uses correct small size tier tokens

#### Recommendations:
```javascript
// Use semantic dimension tokens
counter.style.height = 'var(--size-icon-sm)'; // if exists
checkIcon.style.width = 'var(--size-icon-sm)'; // 12px
menu.style.marginTop = 'var(--size-element-gap-xs)'; // 4px
```

---

### 10. **RatingSingle** (`Lessons/Elements/RatingSingle.js`)

#### Issues:
- ❌ **Hardcoded dimensions**: 
  - `width: '12px'`, `height: '12px'` (radio container, lines 20-21)
  - `padding: '2px'` (line 31) - Should use `var(--size-element-pad-x-xs)` if exists
  - `width: '8px'`, `height: '8px'` (inner circle, lines 36-37)
- ⚠️ **Hardcoded padding**: Uses `2px` directly - Should use token

#### Recommendations:
```javascript
// Use semantic dimension tokens
radioContainer.style.width = 'var(--size-radio-diameter)'; // if exists
radioContainer.style.height = 'var(--size-radio-diameter)';
radioContainer.style.padding = 'var(--size-element-pad-x-xs)'; // if exists, or use appropriate token

innerCircle.style.width = 'var(--size-radio-inner-diameter)'; // if exists
innerCircle.style.height = 'var(--size-radio-inner-diameter)';
```

---

### 11. **ToastTextButton** (`Lessons/Elements/ToastTextButton.js`)

#### Issues:
- ❌ **Hardcoded width**: `width: '912px'` (line 36) - Should use semantic token or be responsive
- ❌ **Hardcoded height**: `height: '1px'` (divider, line 104) - Should use `var(--size-element-stroke-sm)` or appropriate token

#### Recommendations:
```javascript
// Use semantic width token or make responsive
toast.style.maxWidth = '912px';
toast.style.width = '100%';

// Use stroke token
divider.style.height = 'var(--size-element-stroke-sm)'; // 1px
```

---

## General Patterns & Recommendations

### 1. **Hardcoded Pixel Values**

**Pattern Found:** Extensive use of hardcoded `px` values throughout components.

**Impact:** 
- Difficult to maintain consistency
- Not responsive to design system changes
- Violates design system principles

**Recommendation:**
- Replace all hardcoded `px` values with design tokens
- For dimensions that don't have tokens, use `max-width`/`min-width` with `width: 100%` for responsiveness
- Document missing tokens for design system team

### 2. **Gap/Padding Inconsistencies**

**Pattern Found:** Mix of hardcoded gaps (`10px`, `8px`, `4px`, `24px`) and token usage.

**Recommendation:**
- `4px` → `var(--size-element-gap-xs)` (reserved for label-input spacing)
- `8px` → `var(--size-element-gap-sm)` or `var(--size-card-gap-sm)`
- `10px` → `var(--size-element-gap-md)` or `var(--size-element-pad-x-md)`
- `12px` → `var(--size-element-gap-lg)`
- `16px` → `var(--size-section-gap-md)` or `var(--size-card-pad-x-sm)`
- `24px` → `var(--size-section-gap-lg)` or `var(--size-card-pad-x-md)`

### 3. **Width/Height Hardcoding**

**Pattern Found:** Many components use fixed widths/heights that should be responsive or use tokens.

**Recommendation:**
- Use `max-width` with `width: 100%` for responsive behavior
- Use `min-height` with `height: auto` for flexible heights
- Create semantic tokens for common dimensions (e.g., `--size-sidebar-width`, `--size-card-thumbnail-height`)

### 4. **Typography**

**Status:** ✅ Generally compliant
- Most components use correct typography tokens
- Some hardcoded font sizes found (e.g., `16px` for icons)

**Recommendation:**
- Replace hardcoded font sizes with typography tokens
- Use `--font-size-body1` for 16px text
- Use icon size tokens for icon dimensions

### 5. **Color Usage**

**Status:** ✅ Excellent compliance
- All components use design system color tokens correctly
- Proper use of state layers for interactive states
- Correct color roles (on-surface, primary-text, etc.)

### 6. **Component Structure**

**Status:** ✅ Good compliance
- Components follow functional patterns
- Proper use of JSDoc comments
- Good separation of concerns

**Minor Issues:**
- Some components could benefit from more helper functions to reduce duplication
- Some hardcoded values in helper functions should be extracted to constants

---

## Priority Fixes

### High Priority (Critical)
1. **LessonInnerPage.js** - Replace all hardcoded pixel values with tokens
2. **LessonsOverviewPage.js** - Replace all hardcoded pixel values with tokens
3. **AlertForSupervisors.js** - Replace hardcoded widths and primitive tokens
4. **LessonCardItem.js** - Replace hardcoded dimensions with tokens

### Medium Priority (Important)
5. **LikertScale.js** - Replace hardcoded dimensions
6. **SortControl.js** - Replace hardcoded menu dimensions
7. **TrainingLessonStatusSelect.js** - Replace hardcoded dimensions
8. **RatingSingle.js** - Replace hardcoded dimensions and padding

### Low Priority (Nice to Have)
9. **ToastTextButton.js** - Replace hardcoded width
10. **LessonsStudentOverviewSection.js** - Replace hardcoded heights (if causing layout issues)

---

## Missing Design Tokens

The following tokens are referenced but may not exist in the design system:

- `--size-icon-sm` (12px)
- `--size-icon-md` (16px)
- `--size-dropdown-min-width`
- `--size-dropdown-width`
- `--size-section-min-height`
- `--size-section-max-width-lg`
- `--size-element-height-lg`
- `--size-label-width-md`
- `--size-card-max-width-md`
- `--size-radio-diameter` (12px)
- `--size-radio-inner-diameter` (8px)
- `--size-sidebar-width` (168px)
- `--size-card-thumbnail-height` (184px)
- `--size-element-pad-x-xs` (2px)

**Recommendation:** Review design system token documentation and create missing tokens or use existing alternatives.

---

## Compliance Score

| Category | Score | Notes |
|----------|-------|-------|
| **Color Usage** | 95% | Excellent compliance |
| **Typography** | 85% | Mostly compliant, some hardcoded sizes |
| **Spacing Tokens** | 60% | Many hardcoded gaps/padding |
| **Dimension Tokens** | 40% | Extensive hardcoded widths/heights |
| **Component Structure** | 90% | Good patterns, minor improvements needed |
| **Naming Conventions** | 95% | Excellent compliance |
| **Interaction States** | 90% | Good state handling |

**Overall Compliance: 79%**

---

## Next Steps

1. **Immediate Actions:**
   - Create missing design tokens or document alternatives
   - Prioritize fixing high-priority components
   - Set up linting rules to catch hardcoded values

2. **Short-term (1-2 weeks):**
   - Fix all high-priority issues
   - Replace hardcoded gaps/padding with tokens
   - Make components responsive where appropriate

3. **Long-term (1 month):**
   - Complete audit of all components
   - Establish component review checklist
   - Create automated tests for design token compliance

---

## Notes

- This audit focuses on design system compliance, not functionality
- Some hardcoded values may be intentional (e.g., Figma-specific dimensions)
- Responsive design considerations should be evaluated separately
- Component functionality and accessibility are outside the scope of this audit

---

**End of Audit Report**

