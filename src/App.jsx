import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'react-bootstrap';
import NavFab from './components/NavFab/NavFab';
import HomeRedesignApp from '../prototypes/home-redesign/src/App';
import './App.scss';

/**
 * Production SPA on main:
 * - Storybook landing
 * - Live app shell (`prototypes/home-redesign`) at /home, /app, …
 * - Full demo walkthrough stays at /demo/demo.html (separate Vite build — not routed here)
 */
function StorybookEmbed() {
  const storyBookUrl = import.meta.env.VITE_STORYBOOK_URL || 'http://localhost:4200';

  if (storyBookUrl.startsWith('http') && !storyBookUrl.includes('localhost')) {
    window.location.href = storyBookUrl;
    return null;
  }

  return (
    <iframe
      src={storyBookUrl}
      title="Storybook"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        zIndex: 1,
      }}
    />
  );
}

/**
 * Root app router for the Netlify SPA shell.
 *
 * @returns {JSX.Element}
 */
function App() {
  const location = useLocation();
  const isStorybook = location.pathname.startsWith('/storybook');

  return (
    <ThemeProvider>
      {!isStorybook && <NavFab />}
      <Routes>
        <Route path="/" element={<Navigate to="/storybook" replace />} />
        <Route path="/market" element={<Navigate to="/storybook" replace />} />
        <Route path="/storybook" element={<StorybookEmbed />} />

        {/* Live app — holistic tutor flow */}
        <Route path="/app/*" element={<Navigate to="/home" replace />} />
        <Route path="/home/*" element={<HomeRedesignApp contentKey="home" />} />
        <Route path="/admin/*" element={<HomeRedesignApp contentKey="admin" />} />
        <Route path="/sessions/*" element={<HomeRedesignApp contentKey="sessions" />} />
        <Route path="/reflection/*" element={<HomeRedesignApp contentKey="reflection" />} />
        <Route path="/lessons/*" element={<HomeRedesignApp contentKey="lessons" />} />
        <Route path="/research-assistant/*" element={<HomeRedesignApp contentKey="research-assistant" />} />
        <Route path="/monthly-reports/*" element={<HomeRedesignApp contentKey="monthly-reports" />} />
        <Route path="/monthly-report/*" element={<HomeRedesignApp contentKey="monthly-report" />} />

        {/* Unknown paths (incl. retired numeric IDs) → Storybook */}
        <Route path="*" element={<Navigate to="/storybook" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
