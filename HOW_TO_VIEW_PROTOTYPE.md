# How to View the Supervisor Session Prototype

## File Location
The prototype file is located at: `supervisor-session-prototype.html` (in the project root)

## Steps to View

1. **Make sure you're in the project root directory:**
   ```bash
   cd /Users/victorwang/plus-vibe-coding-starting-kit
   ```

2. **Build the CSS (if you haven't already):**
   ```bash
   npm run build:css
   ```

3. **Start a local HTTP server from the project root:**
   ```bash
   python3 -m http.server 8000
   ```
   OR
   ```bash
   python -m http.server 8000
   ```

4. **Open in your browser:**
   ```
   http://localhost:8000/supervisor-session-prototype.html
   ```

## Important Notes

- The prototype requires the compiled CSS file (`dist/css/main.css`)
- Make sure `npm run build:css` has been run to compile all SCSS changes
- The server must be running from the project root directory (where `supervisor-session-prototype.html` is located)
- If you see 404 errors, check that you're accessing the correct URL and the server is running from the correct directory

## Features

- **Home Screen**: Displays sessions list with filters, summary cards, and navigation tabs
- **Create Session Modal**: Click "Fill in" button to open a 3-step modal for creating a new session
- **Session Details Modal**: Click "Details" on any session row to view session information
- **Responsive Design**: Uses PLUS design system tokens and components throughout

