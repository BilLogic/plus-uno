import React from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'react-bootstrap';
import NavFab from './components/NavFab/NavFab';
import HomeRedesignApp from '../playground/home-redesign/src/App';
import SidebarIterationApp from '../playground/sidebar-iteration/src/App';
import { PrototypeMarket } from './pages/PrototypeMarket';
import { prototypes } from './pages/PrototypeMarket/prototypes-data';
import './App.scss';

function StorybookEmbed() {
  return (
    <iframe
      src="http://localhost:4200"
      title="Storybook"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        zIndex: 1
      }}
    />
  );
}

// Map prototype IDs to their internal route within the home-redesign shell
const HOME_SHELL_ROUTES = {
  'redesigned-homepage': '/home',
  'tutor-admin': '/admin',
  'sessions-prototype': '/sessions',
  'session-reflection': '/reflection',
  'lessons-simulator': '/lessons/supporting-growth-mindset',
  'research-assistant-chat': '/research-assistant',
  'monthly-report': '/monthly-reports',
};

function PrototypeRouter() {
  const { prototypeId } = useParams();

  // Check if this ID maps to a home-redesign shell route
  const homeRoute = HOME_SHELL_ROUTES[prototypeId];
  if (homeRoute) {
    return <HomeRedesignApp initialRoute={homeRoute} />;
  }

  // Standalone embedded prototypes
  if (prototypeId === 'sidebar-iteration') {
    return <SidebarIterationApp />;
  }

  // Check if this is a valid prototype ID
  const proto = prototypes.find(p => p.id === prototypeId);
  if (!proto) {
    return <Navigate to="/" replace />;
  }

  // Prototype exists but doesn't have an embedded app yet
  return (
    <div style={{ fontFamily: 'system-ui', padding: '60px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 8 }}>{proto.title}</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>{proto.description}</p>
      <p style={{ fontSize: 14, color: '#999' }}>
        Run standalone: <code style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>
          npx vite --config playground/{proto.repoPath?.split('/').pop() || prototypeId}/vite.config.js
        </code>
      </p>
      <a href="/" style={{ color: '#61b5cf', textDecoration: 'none', fontWeight: 500 }}>Back to Marketplace</a>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <NavFab />
      <Routes>
        {/* Marketplace is the landing page */}
        <Route path="/" element={<PrototypeMarket />} />
        <Route path="/market" element={<PrototypeMarket />} />

        {/* Storybook — embedded via iframe from port 4200 */}
        <Route path="/storybook" element={<StorybookEmbed />} />

        {/* Dynamic prototype routes by marketplace listing ID */}
        <Route path="/:prototypeId/*" element={<PrototypeRouter />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
