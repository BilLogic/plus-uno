import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from 'react-bootstrap';
import HomeRedesignApp from '../playground/prototyping/bill/home-redesign/src/App';

/**
 * Index page: list of prototype links (index into different pages).
 * @returns {JSX.Element}
 */
function IndexPage() {
  return (
    <div style={{ padding: 'var(--size-section-pad-y-md, 24px) var(--size-section-pad-x-md, 32px)', maxWidth: 600 }}>
      <h1 className="h1" style={{ marginBottom: 'var(--size-section-gap-md)' }}>PLUS Prototypes</h1>
      <p className="body1-txt" style={{ marginBottom: 'var(--size-section-gap-lg)', color: 'var(--color-on-surface-variant)' }}>
        Choose a prototype to view. All run on localhost:3000.
      </p>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
        <Link to="/home" className="body1-txt" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
          Homepage prototype
        </Link>
        <Link to="/admin" className="body1-txt" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
          Research admin (AI chat with assistant-ui)
        </Link>
        <Link to="/sessions" className="body1-txt" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
          In-session (Your Students) prototype
        </Link>
        <Link to="/weekly-report" className="body1-txt" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
          Weekly Report (Email Teaser + App)
        </Link>
        <a href="/storybook/index.html" className="body1-txt" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
          Storybook Documentation
        </a>
      </nav>
    </div>
  );
}

/**
 * Root app: router with index page and prototype routes.
 * @returns {JSX.Element}
 */
function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/prototypes" element={<IndexPage />} />
        <Route path="/*" element={<HomeRedesignApp />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
