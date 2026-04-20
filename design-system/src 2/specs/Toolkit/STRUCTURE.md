# Toolkit Organism Structure

## Overview
The Toolkit organism contains components for sessions, sign-ups, call-offs, reflections, student management, and tutor assignments.

## Directory Structure

```
design-system/src/specs/Toolkit/
├── STRUCTURE.md (this file)
├── Toolkit.stories.js (main organism overview story)
│
├── Elements/
│   ├── SessionControlButtons/
│   ├── ReflectionFilterDropdown/
│   ├── StudentsDropdown/
│   ├── SessionsDropdown/
│   ├── RatingComponents/ (student rating, self rating, session rating, form rating)
│   ├── TutorStudentTypeBadge/
│   ├── StudentTableItem/
│   ├── CopyButton/
│   ├── HeadcountStatusBadge/
│   ├── StudentCardItem/
│   ├── AssignmentCards/
│   ├── ToastReminder/
│   ├── Buttons/ (primary, supervisor sign-up mgmt)
│   ├── CallOffForm/ (dropdowns, text inputs)
│   ├── Filters/ (timeframe, call-off type, site, days, capacity, completion)
│   ├── Badges/ (session status, call-off status, reflection status, call-off lateness, School Badge, Session badges)
│   ├── SessionInfoCard/
│   ├── SessionActions/
│   ├── AttendanceComponents/ (list items, dropdown)
│   ├── TutorBadges/
│   ├── StudentBadges/
│   └── ConsentFormInputGroup/
│
├── Cards/
│   └── CallOffAlert/
│
├── Tables/
│   ├── MySessionsTable/
│   ├── CallOffsTable/
│   ├── SignUpsTable/
│   ├── ReflectionsTable/
│   ├── ScheduleRowEntry/
│   ├── ScheduleRowEntryTutor/
│   └── StudentListItem/
│
├── Modals/
│   ├── ViewTutorsModal/
│   ├── SessionSignUpModal/
│   ├── AddTutorStudentModal/
│   ├── CallOffDetailsModal/
│   ├── SessionDetailsModal/
│   ├── FillInModal/
│   ├── TutorStudentAssignmentModal/
│   ├── WelcomeBanner/
│   └── Calendar/
│
├── Sections/
│   ├── SideNavBar/
│   ├── Form/
│   └── OverviewCard/
│
├── Pages/
│   ├── SessionInfo/ (page=1-6)
│   ├── FormFeedback/ (Form Feedback - 1, Form Feedback - 2)
│   ├── Steps/ (Steps, Steps detailed)
│   ├── CallOffsPage/ (multiple views and user types)
│   ├── SignUpsPage/ (multiple views and user types)
│   ├── ReflectionsPage/
│   ├── MySessionsPage/
│   ├── SessionSignUpPage/
│   ├── StudentsDashboard/
│   ├── SessionReflection/
│   └── StudentReflection/
│
└── index.js (main export file for Toolkit organism)
```

## Component Breakdown from Figma

### Elements Section
- **Session Control Buttons**: Control buttons for sessions
- **Reflection Filter Dropdown**: Dropdown for filtering reflections (status: closed, open)
- **Students Dropdown**: Dropdown for selecting students (Fill: Unfilled/Filled, Status: Close/Open)
- **Sessions Dropdown**: Dropdown for selecting sessions (multiple states)
- **Rating Components**: Student rating, self rating, session rating, form rating (ratings: unselected, 1-5 stars)
- **Tutor/Student Type Badge**: Badges for user types and groups
- **Student Table Item**: Table items for students (type: header/content, group: tutors/students)
- **Copy Button**: Button for copying (copied?: false/true)
- **Headcount Status Badge**: Badges for tutor types (regular tutor, lead tutor)
- **Student Card Item**: Card items for students
- **Assignment Cards**: Cards for assignments (tutor type: regular tutor, lead tutor)
- **Toast/Reminder**: Toast notifications
- **Buttons**: Primary buttons, supervisor sign-up management buttons
- **Call-off Form Components**: Dropdowns (Reason, Supervisor selection), Text inputs (Additional Details, Supervisor decision rationale)
- **Filters**: Timeframe, call-off type, site, days, capacity, completion filters
- **Badges**: Session status, call-off status, reflection status, call-off lateness, School Badge, Session badges
- **Session Info Card**: Card for session information
- **Session Actions**: Actions for sessions (join, details, sign-up)
- **Attendance Components**: List items, dropdown
- **Tutor Badges**: Count, self indicator, lead badges
- **Student Badges**: New, present, late, absent, unknown badges (read only?: false/true)
- **Consent Form Input Group**: Checkbox input group

### Cards Section
- **CallOffAlert** (`Alert / Call-off`): Alerts for call-offs (type: checkbox for recurring call-off, Update, warning)

### Tables Section
- **MySessionsTable** (`Table / my sessions`): Table for my sessions (type: header/item, states: default/hover/pressed/focus/disabled)
- **CallOffsTable** (`Table / call-offs`): Table for call-offs (user: tutors/supervisors, call-off state: pending/past)
- **SignUpsTable** (`Table / sign-ups`): Table for sign-ups (user: tutors/supervisors, session type: one-time/recurring)
- **ReflectionsTable** (`Table / reflections`): Table for reflections (reflection state: complete/incomplete)
- **ScheduleRowEntry**: Schedule row entries (user type: all/regular tutor/lead tutor and admin, row type: header/item, state: disabled/rest)
- **ScheduleRowEntryTutor**: Schedule row entries for tutors (tab: shift sign-up/session fill-in)
- **StudentListItem** (`PLUS / student list item`): Student list items (type: header/content, state: default/hover)

### Modals Section
- **ViewTutorsModal**: Modal for viewing tutors (User View: Tutor, Lead Tutor)
- **SessionSignUpModal**: Modal for session sign-up
- **AddTutorStudentModal**: Modal for adding tutor/student (type: add tutor, add student)
- **CallOffDetailsModal**: Modals for call-off details (Tutors/Supervisors, multiple stages and tabs)
- **SessionDetailsModal**: Modals for session details (All users, multiple tabs)
- **FillInModal**: Modals for fill-in (user: tutor/supervisor, multiple tabs)
- **SessionSignUpModal**: Modal for session sign-up (multiple tabs)
- **TutorStudentAssignmentModal**: Modal for tutor student assignment (tab: attendance/assignment, state: loading/initial/loaded)
- **WelcomeBanner**: Welcome banner modal
- **Calendar**: Calendar modal

### Sections Section
- **SideNavBar** (`Side Nav Bar`): Side navigation bar (state: default/in progress/pre-student add/collapsed)
- **Form**: Form section (Fill: Empty/Filled)
- **OverviewCard**: Overview card (Property 1: Default, withdraw request session card)

### Pages Section
- **SessionInfo** (`Session Info`): Session info pages (page=1-6)
- **FormFeedback**: Form feedback pages (Form Feedback - 1, Form Feedback - 2)
- **Steps**: Steps pages (Steps, Steps detailed)
- **CallOffsPage** (`Full page / call-offs`): Full page for call-offs (view: pending/past, user type: tutor/supervisors, pop-up?: false/true)
- **SignUpsPage** (`Full page / sign-ups`): Full page for sign-ups (view: recurring/one-time, user type: tutor/supervisors, pop-up?: false/true)
- **ReflectionsPage** (`Full page / reflections`): Full page for reflections (type: Default)
- **MySessionsPage** (`Full page / my sessions`): Full page for my sessions (pop-up?: off/on, has alert?: no, user: both)
- **SessionSignUpPage** (`Session Sign up`): Session sign-up page
- **StudentsDashboard** (`Students Dashboard`): Students dashboard (view: Default/loading/toast)
- **SessionReflection** (`Session Reflection`): Session reflection pages (part=1-4)
- **StudentReflection** (`Student Reflection`): Student reflection pages (part=1-3)

## Storybook Organization

Each subcategory (Elements, Cards, Tables, Modals, Sections, Pages) will have its own Storybook page/section, making it easy to navigate and view all components within that category.

## Implementation Notes

1. **Organisms vs Molecules**: Organisms are higher-level compositions that may use molecules and elements as building blocks
2. **Token Usage**: Follow the same token reference guidelines, but may use tokens from multiple component types (elements, cards, sections, etc.)
3. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
4. **Figma Accuracy**: All components must match Figma designs pixel-perfectly

