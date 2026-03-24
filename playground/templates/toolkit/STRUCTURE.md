# Toolkit Template Structure

## Overview
This template contains complete page implementations for sessions, sign-ups, call-offs, reflections, student management, and tutor assignments. These templates are based on the Toolkit specs documentation and serve as complete, functional page implementations.

## Reference Documentation

For detailed component breakdowns and specifications, see:
- **Specs Documentation**: `../../../packages/plus-ds/specs/Toolkit/STRUCTURE.md`
- **Specs Overview**: `../../../packages/plus-ds/specs/Toolkit/Toolkit.stories.js`
- **Component Library**: `../../../packages/plus-ds/components/`

## Template Structure

```
playground/templates/toolkit/
├── STRUCTURE.md (this file)
├── [template-files].html
├── [template-files].js
└── README.md (if needed)
```

## Component Breakdown from Specs

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

## Implementation Guidelines

1. **Reference Specs First**: Always check `../../../packages/plus-ds/specs/Toolkit/STRUCTURE.md` for detailed component breakdowns
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
- Reference: `../../../packages/plus-ds/specs/Toolkit/STRUCTURE.md` for complete component breakdown

