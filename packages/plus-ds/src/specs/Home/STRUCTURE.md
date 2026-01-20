# Home Organism Structure

## Overview
The Home organism contains components for the home page, including dashboard elements, data visualization, resource cards, and user feedback.

## Directory Structure

```
design-system/components/organisms/Home/
├── STRUCTURE.md (this file)
├── Home.stories.js (main organism overview story)
│
├── Elements/
│   ├── ResourceType/
│   │   ├── ResourceType.stories.js
│   │   ├── ResourceType.scss
│   │   └── index.js
│   ├── ProductAreaDropdown/
│   │   ├── ProductAreaDropdown.stories.js
│   │   ├── ProductAreaDropdown.scss
│   │   └── index.js
│   ├── CardBadges/
│   │   ├── CardBadges.stories.js
│   │   ├── CardBadges.scss
│   │   └── index.js
│   └── ButtonContainer/
│       ├── ButtonContainer.stories.js
│       ├── ButtonContainer.scss
│       └── index.js
│
├── Cards/
│   ├── OverviewCard/
│   │   ├── OverviewCard.stories.js
│   │   ├── OverviewCard.scss
│   │   ├── OverviewCard.Variants.stories.js
│   │   └── index.js
│   ├── ResourceCard/
│   │   ├── ResourceCard.stories.js
│   │   ├── ResourceCard.scss
│   │   └── index.js
│   ├── MetricsCard/
│   │   ├── MetricsCard.stories.js
│   │   ├── MetricsCard.scss
│   │   ├── MetricsCard.Variants.stories.js
│   │   └── index.js
│   ├── DataVisualization/
│   │   ├── DataVisualization.stories.js
│   │   ├── DataVisualization.scss
│   │   ├── DataVisualization.Variants.stories.js
│   │   └── index.js
│   ├── RecommendedLessons/
│   │   ├── RecommendedLessons.stories.js
│   │   ├── RecommendedLessons.scss
│   │   ├── RecommendedLessons.Variants.stories.js
│   │   └── index.js
│   └── TrainingProgressCard/
│       ├── TrainingProgressCard.stories.js
│       ├── TrainingProgressCard.scss
│       ├── TrainingProgressCard.Variants.stories.js
│       └── index.js
│
├── Tables/
│   └── (to be added as needed)
│
├── Modals/
│   └── UserFeedbackModal/
│       ├── UserFeedbackModal.stories.js
│       ├── UserFeedbackModal.scss
│       ├── UserFeedbackModal.Variants.stories.js
│       └── index.js
│
├── Sections/
│   ├── HomepageJumbotron/
│   │   ├── HomepageJumbotron.stories.js
│   │   ├── HomepageJumbotron.scss
│   │   ├── HomepageJumbotron.Variants.stories.js
│   │   └── index.js
│   └── BottomDiv/
│       ├── BottomDiv.stories.js
│       ├── BottomDiv.scss
│       ├── BottomDiv.Variants.stories.js
│       └── index.js
│
├── Pages/
│   ├── SkillsOverview/
│   │   ├── SkillsOverview.stories.js
│   │   ├── SkillsOverview.scss
│   │   └── index.js
│   └── SkillsHomePage/
│       ├── SkillsHomePage.stories.js
│       ├── SkillsHomePage.scss
│       ├── SkillsHomePage.Variants.stories.js
│       └── index.js
│
└── index.js (main export file for Home organism)
```

## Component Breakdown from Figma

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

4. **MetricsCard2** (`Metrics Card 2`)
   - Variants: page=1, page=2, page=3

5. **DataVisualization** (`Data Visualization`)
   - Variants: page=skills progress, page=skills overview

6. **RecommendedLessons** (`Recommended Lessons`)
   - Variants: breakpoint=< XXL, breakpoint=XXL & above

7. **TrainingProgressCard** (`Overview Card / Training Progress`)
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

## Storybook Organization

Each subcategory (Elements, Cards, Tables, Modals, Sections, Pages) will have its own Storybook page/section, making it easy to navigate and view all components within that category.

## Implementation Notes

1. **Organisms vs Molecules**: Organisms are higher-level compositions that may use molecules and elements as building blocks
2. **Token Usage**: Follow the same token reference guidelines, but may use tokens from multiple component types (elements, cards, sections, etc.)
3. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
4. **Figma Accuracy**: All components must match Figma designs pixel-perfectly

