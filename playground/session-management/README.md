# Sessions Prototype

This prototype implements the sessions management interface based on the provided wireframes. It lives under **playground/prototyping/{your-name}/{prototype-name}/** per the prototyping docs — here: `playground/prototyping/victor/sessions/`.

## Features

1. **Main Sessions Page**
   - Top bar navigation
   - Sidebar navigation
   - "Your Sessions" section with clickable session cards
   - "Create New Session" button
   - "My Sessions" overview section

2. **Attendance card and modal**
   - "Attendance" card in My Sessions; click to open a modal listing all sessions you've been assigned to, with an "Attended" or "Absent" badge per session.

3. **Edit Session Modal**
   - Tabbed interface with "Session Info" and "Attendees" tabs
   - Tutor Roster with remove functionality
   - Student Roster (read-only list)
   - Close button (X) in header

## How to run

This prototype is a React + Vite app. Run it from the **project root** (so paths to the design system resolve):

1. **Install dependencies** (only needed once):
   ```bash
   cd playground/prototyping/victor/sessions
   npm install
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Open the URL** shown in the terminal (e.g. `http://localhost:3007`). The sessions page opens in your browser.

4. Click the **Attendance** card to open the modal with assigned sessions and Attended/Absent badges. Click any session card under "Your Sessions" to open the Edit Session modal.

## Interaction

- Click on any session card in the "Your Sessions" section to open the Edit Session modal
- Click the "Create New Session" button to open the modal for creating a new session
- In the Edit Session modal:
  - Switch between "Session Info" and "Attendees" tabs
  - Click "Remove" next to a tutor in the Tutor Roster to remove them
  - Click the X button or click outside the modal to close it

## Components Used

- `PageLayout` - Main page structure with sidebar and top bar
- `Card` - Session cards and content containers
- `Button` - Action buttons
- `Modal` - Edit session dialog
- `ListGroup` - Roster lists
- `Badge` - Attendee count badge

## File Structure

```
playground/prototyping/victor/sessions/
├── SessionsPage.jsx       # Main sessions page (cards + modals)
├── AttendanceModal.jsx    # Modal: assigned sessions with Attended/Absent badges
├── EditSessionModal.jsx   # Edit session modal with tabs
├── index.jsx              # Entry point
├── index.html             # HTML template
├── vite.config.js         # Vite config (alias @ to design system)
├── package.json           # Dependencies and scripts
└── README.md              # This file
```
