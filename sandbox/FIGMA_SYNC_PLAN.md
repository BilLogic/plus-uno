# Figma to Storybook Sync Plan

## Components from Figma Screenshot (Molecules)

### Currently Implemented
- ✅ Button
- ✅ Checkbox  
- ✅ Alert

### Missing Components (Need Implementation)
1. **Breadcrumb** - Navigation breadcrumb component
2. **Badge & Chip** - Badge and chip components for labels/tags
3. **Button Group** - Group of buttons
4. **Card** - Card container component
5. **Carousel** - Carousel/slider component
6. **Collapse** - Collapsible/accordion component
7. **Radio** - Radio button component
8. **Switch** - Toggle switch component
9. **Divider** - Divider/separator component
10. **Dropdown** - Dropdown/select component
11. **Date Picker** - Date picker component
12. **Form** - Form container component

## Implementation Plan

### Phase 1: Get Figma Design Specs
1. Get Figma file URL/fileKey from user
2. Use Figma MCP to fetch design context for each component
3. Extract:
   - Visual design (colors, spacing, typography)
   - Component variants and states
   - Interaction patterns
   - Design tokens used

### Phase 2: Reference GitHub Repo
1. Access CMU-PLUS/web-app GitHub repo (may need user access)
2. Find component implementations
3. Understand component APIs and structure
4. Adapt code to match current codebase patterns

### Phase 3: Implement Components
1. Create component files in `src/js/components/universal/elements/`
2. Implement based on Figma designs and GitHub reference
3. Use PLUS design tokens
4. Follow coding standards and patterns

### Phase 4: Create Storybook Stories
1. Update existing stories (Button, Checkbox, Alert) to match Figma
2. Create new stories for all missing components
3. Include all variants and states from Figma
4. Add interactive controls (argTypes)
5. Document component usage

## Next Steps

1. **Get Figma File Information**
   - Request Figma file URL or fileKey
   - Get node IDs for components or browse the file

2. **Fetch Design Specs**
   - Use `mcp_Figma_get_design_context` for each component
   - Extract design tokens, spacing, colors, typography
   - Get component variants and states

3. **Implement Components**
   - Create component code based on Figma specs
   - Reference GitHub repo for implementation patterns
   - Ensure components use PLUS design tokens

4. **Create Stories**
   - Create comprehensive Storybook stories
   - Match Figma designs exactly
   - Include all variants and interactive controls

