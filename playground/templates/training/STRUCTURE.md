# Training Template Structure

## Overview
This template contains complete page implementations for training lessons, ratings, and student management. These templates are based on the Training specs documentation and serve as complete, functional page implementations.

## Reference Documentation

For detailed component breakdowns and specifications, see:
- **Specs Documentation**: `../../../packages/plus-ds/specs/Training/STRUCTURE.md`
- **Specs Overview**: `../../../packages/plus-ds/specs/Training/Training.stories.js`
- **Component Library**: `../../../packages/plus-ds/components/`

## Template Structure

```
playground/templates/training/
├── STRUCTURE.md (this file)
├── [template-files].html
├── [template-files].js
└── README.md (if needed)
```

## Component Breakdown from Specs

### Elements Section
1. **Rating** (`Rating`)
   - Ratings: rest (default), 1, 2, 3, 4, 5

2. **RatingSingle** (`Rating single`)
   - Status: rest (Default), selected

3. **LikertScale** (`Likert Scale`)
   - Property 1=Default

4. **AiIndicator** (`Ai Indicator`)
   - AI indicator icon

5. **SortControl** (`Sort Control`)
   - Property 1: name, Dropdown, Status, Competency Areas

6. **TrainingLessonStatusSelect** (`Training Lesson Status Select`)
   - Open?: true, false

7. **ToastTextButton** (`Toast/Text Button`)
   - Toast with text button

### Cards Section
1. **LessonCard** (`Lesson / Card Item`)
   - States: default, hover

2. **SupervisorAlert** (`Alert for supervisors`)
   - AI feature: enabled, disabled

### Tables Section
1. **LessonListItem** (`Lesson List Item`)
   - Types: header, item
   - States: default, hover, pressed, focus, disable
   - Expand?: false, true

### Sections Section
1. **StudentOverview** (`Student Overview`)
   - Student overview section

2. **MyStudentsStudentOverview** (`My Students + Student Overview`)
   - Combined my students and student overview section

3. **WelcomeRow** (`Welcome Row`)
   - Welcome row section

### Pages Section
1. **TrainingLesson** (`Training / Lesson`)
   - Pages: one, two, three, four, five

2. **ListView** (`List View`)
   - List view page

## Implementation Guidelines

1. **Reference Specs First**: Always check `../../../packages/plus-ds/specs/Training/STRUCTURE.md` for detailed component breakdowns
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
- Reference: `../../../packages/plus-ds/specs/Training/STRUCTURE.md` for complete component breakdown

