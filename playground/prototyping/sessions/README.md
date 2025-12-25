# Sessions Prototype

This prototype implements the sessions management interface based on the provided wireframes.

## Features

1. **Main Sessions Page**
   - Top bar navigation
   - Sidebar navigation
   - "Your Sessions" section with clickable session cards
   - "Create New Session" button
   - "My Sessions" overview section

2. **Edit Session Modal**
   - Tabbed interface with "Session Info" and "Attendees" tabs
   - Tutor Roster with remove functionality
   - Student Roster (read-only list)
   - Close button (X) in header

## How to View

The prototype is integrated into the main React app. To view it:

1. Start the development server:
   ```bash
   npm run dev:react
   ```

2. Open your browser to `http://localhost:3000`

3. The Sessions page will be displayed automatically.

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
playground/prototyping/sessions/
├── SessionsPage.jsx      # Main sessions page component
├── EditSessionModal.jsx   # Edit session modal with tabs
├── index.jsx              # Entry point (not used, App.jsx imports directly)
├── index.html             # HTML template (not used, main index.html is used)
└── README.md              # This file
```

