# Training Organism Structure

## Overview
The Training organism contains components for training lessons, ratings, and student management.

## Directory Structure

```
design-system/components/organisms/Training/
├── STRUCTURE.md (this file)
├── Training.stories.js (main organism overview story)
│
├── Elements/
│   ├── Rating/
│   │   ├── Rating.stories.js
│   │   ├── Rating.scss
│   │   └── index.js
│   ├── RatingSingle/
│   │   ├── RatingSingle.stories.js
│   │   ├── RatingSingle.scss
│   │   └── index.js
│   ├── LikertScale/
│   │   ├── LikertScale.stories.js
│   │   ├── LikertScale.scss
│   │   └── index.js
│   ├── AiIndicator/
│   │   ├── AiIndicator.stories.js
│   │   ├── AiIndicator.scss
│   │   └── index.js
│   ├── SortControl/
│   │   ├── SortControl.stories.js
│   │   ├── SortControl.scss
│   │   └── index.js
│   ├── TrainingLessonStatusSelect/
│   │   ├── TrainingLessonStatusSelect.stories.js
│   │   ├── TrainingLessonStatusSelect.scss
│   │   └── index.js
│   └── ToastTextButton/
│       ├── ToastTextButton.stories.js
│       ├── ToastTextButton.scss
│       └── index.js
│
├── Cards/
│   ├── LessonCard/
│   │   ├── LessonCard.stories.js
│   │   ├── LessonCard.scss
│   │   ├── LessonCard.States.stories.js
│   │   └── index.js
│   └── SupervisorAlert/
│       ├── SupervisorAlert.stories.js
│       ├── SupervisorAlert.scss
│       ├── SupervisorAlert.Variants.stories.js
│       └── index.js
│
├── Tables/
│   └── LessonListItem/
│       ├── LessonListItem.stories.js
│       ├── LessonListItem.scss
│       ├── LessonListItem.States.stories.js
│       └── index.js
│
├── Modals/
│   └── (to be added as needed)
│
├── Sections/
│   ├── StudentOverview/
│   │   ├── StudentOverview.stories.js
│   │   ├── StudentOverview.scss
│   │   └── index.js
│   ├── MyStudentsStudentOverview/
│   │   ├── MyStudentsStudentOverview.stories.js
│   │   ├── MyStudentsStudentOverview.scss
│   │   └── index.js
│   └── WelcomeRow/
│       ├── WelcomeRow.stories.js
│       ├── WelcomeRow.scss
│       └── index.js
│
├── Pages/
│   ├── TrainingLesson/
│   │   ├── TrainingLesson.stories.js
│   │   ├── TrainingLesson.scss
│   │   ├── TrainingLesson.Variants.stories.js
│   │   └── index.js
│   └── ListView/
│       ├── ListView.stories.js
│       ├── ListView.scss
│       └── index.js
│
└── index.js (main export file for Training organism)
```

## Component Breakdown from Figma

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

## Storybook Organization

Each subcategory (Elements, Cards, Tables, Modals, Sections, Pages) will have its own Storybook page/section, making it easy to navigate and view all components within that category.

## Implementation Notes

1. **Organisms vs Molecules**: Organisms are higher-level compositions that may use molecules and elements as building blocks
2. **Token Usage**: Follow the same token reference guidelines, but may use tokens from multiple component types (elements, cards, sections, etc.)
3. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
4. **Figma Accuracy**: All components must match Figma designs pixel-perfectly

