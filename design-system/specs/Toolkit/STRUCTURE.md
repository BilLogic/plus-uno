# Toolkit Organism Structure

## Overview
The Toolkit organism contains components for sessions, sign-ups, call-offs, reflections, student management, and tutor assignments, organized by session phases.

## Directory Structure

```
design-system/specs/Toolkit/
├── STRUCTURE.md (this file)
├── Toolkit.stories.jsx (main organism overview story)
├── ToolkitSpec.jsx (main organism component)
├── index.js (main export file for Toolkit organism)
│
├── pre-session/ (components used before session starts)
│   ├── elements/ (UI elements and controls)
│   │   ├── SessionAvailabilitySnackbar/
│   │   ├── SessionManagementSnackbar/
│   │   ├── SessionControlButtons/
│   │   ├── ReflectionFilterDropdown/
│   │   ├── StudentsDropdown/
│   │   ├── SessionsDropdown/
│   │   ├── RatingComponents/ (student rating, self rating, session rating, form rating)
│   │   ├── TutorStudentTypeBadge/
│   │   ├── StudentTableItem/
│   │   ├── CopyButton/
│   │   ├── HeadcountStatusBadge/
│   │   ├── StudentCardItem/
│   │   ├── AssignmentCards/
│   │   ├── ToastReminder/
│   │   ├── Buttons/ (primary, supervisor sign-up mgmt)
│   │   ├── CallOffForm/ (dropdowns, text inputs)
│   │   ├── Filters/ (timeframe, call-off type, site, days, capacity, completion)
│   │   ├── Badges/ (session status, call-off status, reflection status, call-off lateness, School Badge, Session badges)
│   │   ├── SessionInfoCard/
│   │   ├── SessionActions/
│   │   ├── AttendanceComponents/ (list items, dropdown)
│   │   ├── TutorBadges/
│   │   ├── StudentBadges/
│   │   └── ConsentFormInputGroup/
│   ├── cards/ (card components)
│   │   └── CallOffAlert/
│   ├── tables/ (table components)
│   │   ├── MySessionsTable/
│   │   ├── CallOffsTable/
│   │   ├── SignUpsTable/
│   │   ├── ReflectionsTable/
│   │   ├── ScheduleRowEntry/
│   │   ├── ScheduleRowEntryTutor/
│   │   └── StudentListItem/
│   ├── modals/ (modal components)
│   │   ├── ViewTutorsModal/
│   │   ├── SessionSignUpModal/
│   │   ├── AddTutorStudentModal/
│   │   ├── CallOffDetailsModal/
│   │   ├── SessionDetailsModal/
│   │   ├── FillInModal/
│   │   ├── TutorStudentAssignmentModal/
│   │   ├── WelcomeBanner/
│   │   └── Calendar/
│   ├── sections/ (section components)
│   │   ├── SideNavBar/
│   │   ├── Form/
│   │   └── OverviewCard/
│   └── pages/ (full page components)
│       ├── SessionInfo/ (page=1-6)
│       ├── FormFeedback/ (Form Feedback - 1, Form Feedback - 2)
│       ├── Steps/ (Steps, Steps detailed)
│       ├── CallOffsPage/ (multiple views and user types)
│       ├── SignUpsPage/ (multiple views and user types)
│       ├── ReflectionsPage/
│       ├── MySessionsPage/
│       ├── SessionSignUpPage/
│       ├── StudentsDashboard/
│       ├── SessionReflection/
│       └── StudentReflection/
│
├── in-session/ (components used during active session)
│   ├── elements/ (UI elements and controls)
│   │   ├── SessionControls/ (copy assignments, manage session buttons)
│   │   ├── SortingOptions/ (student sorting dropdowns)
│   │   ├── AttendanceDropdown/ (attendance status selection)
│   │   ├── EngagementDropdown/ (engagement status selection)
│   │   ├── AttendanceBadge/ (attendance status badges)
│   │   ├── EngagementBadge/ (engagement status badges)
│   │   └── AttendanceListItems/ (attendance dropdown items)
│   ├── cards/ (card components)
│   ├── tables/ (table components)
│   │   └── StudentList/ (student management table)
│   ├── modals/ (modal components)
│   ├── sections/ (section components)
│   └── pages/ (full page components)
│       └── StudentDashboard/ (main in-session dashboard)
│
└── post-session/ (components used after session ends)
    ├── elements/ (UI elements and controls)
    ├── cards/ (card components)
    ├── tables/ (table components)
    ├── modals/ (modal components)
    ├── sections/ (section components)
    └── pages/ (full page components)
```

## Component Breakdown by Session Phase

### Pre-Session Components (before session starts)

#### Elements
- **SessionAvailabilitySnackbar**: Snackbar for session availability notifications
- **SessionManagementSnackbar**: Snackbar for session management notifications
- **SessionControlButtons**: Control buttons for sessions
- **ReflectionFilterDropdown**: Dropdown for filtering reflections (status: closed, open)
- **StudentsDropdown**: Dropdown for selecting students (Fill: Unfilled/Filled, Status: Close/Open)
- **SessionsDropdown**: Dropdown for selecting sessions (multiple states)
- **RatingComponents**: Student rating, self rating, session rating, form rating (ratings: unselected, 1-5 stars)
- **TutorStudentTypeBadge**: Badges for user types and groups
- **StudentTableItem**: Table items for students (type: header/content, group: tutors/students)
- **CopyButton**: Button for copying (copied?: false/true)
- **HeadcountStatusBadge**: Badges for tutor types (regular tutor, lead tutor)
- **StudentCardItem**: Card items for students
- **AssignmentCards**: Cards for assignments (tutor type: regular tutor, lead tutor)
- **ToastReminder**: Toast notifications
- **Buttons**: Primary buttons, supervisor sign-up management buttons
- **CallOffForm**: Dropdowns (Reason, Supervisor selection), Text inputs (Additional Details, Supervisor decision rationale)
- **Filters**: Timeframe, call-off type, site, days, capacity, completion filters
- **Badges**: Session status, call-off status, reflection status, call-off lateness, School Badge, Session badges
- **SessionInfoCard**: Card for session information
- **SessionActions**: Actions for sessions (join, details, sign-up)
- **AttendanceComponents**: List items, dropdown
- **TutorBadges**: Count, self indicator, lead badges
- **StudentBadges**: New, present, late, absent, unknown badges (read only?: false/true)
- **ConsentFormInputGroup**: Checkbox input group

#### Cards
- **CallOffAlert** (`Alert / Call-off`): Alerts for call-offs (type: checkbox for recurring call-off, Update, warning)

#### Tables
- **MySessionsTable** (`Table / my sessions`): Table for my sessions (type: header/item, states: default/hover/pressed/focus/disabled)
- **CallOffsTable** (`Table / call-offs`): Table for call-offs (user: tutors/supervisors, call-off state: pending/past)
- **SignUpsTable** (`Table / sign-ups`): Table for sign-ups (user: tutors/supervisors, session type: one-time/recurring)
- **ReflectionsTable** (`Table / reflections`): Table for reflections (reflection state: complete/incomplete)
- **ScheduleRowEntry**: Schedule row entries (user type: all/regular tutor/lead tutor and admin, row type: header/item, state: disabled/rest)
- **ScheduleRowEntryTutor**: Schedule row entries for tutors (tab: shift sign-up/session fill-in)
- **StudentListItem** (`PLUS / student list item`): Student list items (type: header/content, state: default/hover)

#### Modals
- **ViewTutorsModal**: Modal for viewing tutors (User View: Tutor, Lead Tutor)
- **SessionSignUpModal**: Modal for session sign-up
- **AddTutorStudentModal**: Modal for adding tutor/student (type: add tutor, add student)
- **CallOffDetailsModal**: Modals for call-off details (Tutors/Supervisors, multiple stages and tabs)
- **SessionDetailsModal**: Modals for session details (All users, multiple tabs)
- **FillInModal**: Modals for fill-in (user: tutor/supervisor, multiple tabs)
- **TutorStudentAssignmentModal**: Modal for tutor student assignment (tab: attendance/assignment, state: loading/initial/loaded)
- **WelcomeBanner**: Welcome banner modal
- **Calendar**: Calendar modal

#### Sections
- **SideNavBar** (`Side Nav Bar`): Side navigation bar (state: default/in progress/pre-student add/collapsed)
- **Form**: Form section (Fill: Empty/Filled)
- **OverviewCard**: Overview card (Property 1: Default, withdraw request session card)

#### Pages
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

### In-Session Components (during active session)

#### Elements
- **SessionControls**: Copy assignments and manage session buttons (user roles: lead & supervisors, regular tutors)
- **SortingOptions**: Student sorting dropdowns (Name, Status, Bookmark, Progress with ordering options)
- **AttendanceDropdown**: Attendance status selection dropdown (Present, Late, Absent, Unknown)
- **EngagementDropdown**: Engagement status selection dropdown (Fully engaged, Partially engaged, Not engaged)
- **AttendanceBadge**: Attendance status badges (Present, Late, Absent, Unknown)
- **EngagementBadge**: Engagement status badges (Fully engaged, Partially engaged, Not engaged)
- **AttendanceListItems**: Attendance dropdown menu items with checkboxes

#### Tables
- **StudentList**: Student management table with 17 columns including attendance, engagement, and goal tracking

#### Pages
- **StudentDashboard**: Main in-session dashboard with student list, session controls, and status filtering

### Post-Session Components (after session ends)
*Components for post-session activities, reflections, and reporting*

## Storybook Organization

Each session phase (pre-session, in-session, post-session) and component type (elements, cards, tables, modals, sections, pages) will have its own Storybook section, making it easy to navigate and view all components within their appropriate context.

## Implementation Notes

1. **Session-Based Organization**: Components are organized by when they're used in the session lifecycle (pre, during, post)
2. **Component Reusability**: Some components may be used across multiple session phases but are categorized by their primary use case
3. **Token Usage**: Follow the same token reference guidelines, but may use tokens from multiple component types (elements, cards, sections, etc.)
4. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
5. **Figma Accuracy**: All components must match Figma designs pixel-perfectly
6. **User Role Differentiation**: Components should account for different user roles (regular tutors, lead tutors, supervisors)

