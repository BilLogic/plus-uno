# Home Template Structure

## Overview
This template contains complete page implementations for home/dashboard interfaces, including dashboard elements, data visualization, resource cards, and user feedback. These templates are based on the Home specs documentation and serve as complete, functional page implementations.

## Reference Documentation

For detailed component breakdowns and specifications, see:
- **Specs Documentation**: `../../../packages/plus-ds/specs/Home/STRUCTURE.md`
- **Specs Overview**: `../../../packages/plus-ds/specs/Home/Home.stories.js`
- **Component Library**: `../../../packages/plus-ds/components/`

## Template Structure

```
playground/templates/home/
├── STRUCTURE.md (this file)
├── [template-files].html
├── [template-files].js
└── README.md (if needed)
```

## Component Breakdown from Specs

### Elements Section
1. **ResourceType** (`Resource Type`)
   - Types: pdf, link, video, image, slides

2. **ProductAreaDropdown** (`Product Area Dropdown`)
   - States: closed, open

3. **CardBadges** (`_card badges`)
   - States: increase, decrease

4. **ButtonContainer** (`Button container`)
   - States: disabled, enabled

### Cards Section
1. **OverviewCard** (`Overview Card`)
   - Types: relationships, undefined, socio-emotional, mastering, advocacy, technology, status, completion, accuracy, avg-accuracy, avg-completion, time-spent, effort, progress

2. **ResourceCard** (`Resource Card`)
   - Resource card component

3. **MetricsCard** (`Metrics Card`)
   - Metrics card component

4. **DataVisualization** (`Data Visualization`)
   - Variants: page=skills progress, page=skills overview

5. **RecommendedLessons** (`Recommended Lessons`)
   - Variants: breakpoint=< XXL, breakpoint=XXL & above

6. **TrainingProgressCard** (`Overview Card / Training Progress`)
   - Sizes: default, small

### Modals Section
1. **UserFeedbackModal** (`User Feedback Modal`)
   - Types: problem, question, feedback

### Sections Section
1. **HomepageJumbotron** (`Homepage Jumbotron`)
   - Tabs: sign-up, session, reflection

2. **BottomDiv** (`bottom div`)
   - Variants: Property 1=Default, Property 1=Variant2

### Pages Section
1. **SkillsOverview** (`Skills Overview (Different Layout)`)
   - Complete skills overview page

2. **SkillsHomePage** (`Skills (Home Page)`)
   - Variants: Property 1=skill overview, Property 1=skill progress

## Implementation Guidelines

1. **Reference Specs First**: Always check `../../../packages/plus-ds/specs/Home/STRUCTURE.md` for detailed component breakdowns
2. **Use Design Tokens**: Always use semantic design tokens from `../../../packages/plus-ds/styles/`
3. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
4. **Figma Accuracy**: All components must match Figma designs pixel-perfectly
5. **Complete Pages**: Templates should represent complete, functional page implementations

## Best Practices

- Start from the specs documentation to understand component structure
- Implement complete pages, not just individual components
- Use existing PLUS components when possible
- Follow coding standards from `../../../.agent/SKILL.md`
- Include proper accessibility attributes
- Ensure responsive design
- Reference: `../../../packages/plus-ds/specs/Home/STRUCTURE.md` for complete component breakdown

