import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'react-bootstrap';
import NavFab from './components/NavFab/NavFab';
import { LiveAppRoutes } from '../prototypes/live-app/src/App';
import './App.scss';

/**
 * Production SPA on main:
 * - Storybook landing
 * - Live app — Storybook Specs pages as one full-screen product
 * - Demo walkthrough — separate Vite build under `/demo/*`
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
        <Route path="/app/*" element={<Navigate to="/home" replace />} />

        {/* Live app routes — declared as siblings so absolute paths match */}
        {LiveAppRoutes()}

        <Route path="*" element={<Navigate to="/storybook" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
