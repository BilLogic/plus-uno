import React, { lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from 'react-bootstrap';
import HomeRedesignApp from '../playground/prototyping/bill/home-redesign/src/App';
import { ErrorBoundary } from '../playground/prototyping/bill/research-assistant-chat/src/ErrorBoundary';
import InSessionPage from '../playground/prototyping/bill/sessions/InSessionPage';

/** Lazy-loaded admin app so the shell loads first and /admin doesn't block or hang. */
const ResearchAdminApp = lazy(() =>
  import('../playground/prototyping/bill/research-assistant-chat/src/App').then((m) => ({ default: m.default }))
);

const WeeklyReportApp = lazy(() =>
  import('../playground/prototyping/bill/weekly-report/src/App').then((m) => ({ default: m.default }))
);

/**
 * Loading fallback shown while the admin app chunk is loading.
 * @returns {JSX.Element}
 */
function AdminPageFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--color-on-surface-variant)',
        fontFamily: 'var(--font-family-body)',
      }}
    >
      <span className="body1-txt">Loading admin…</span>
    </div>
  );
}

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
        <Route path="/" element={<IndexPage />} />
        <Route path="/home" element={<HomeRedesignApp />} />
        <Route
          path="/admin"
          element={
            <ErrorBoundary>
              <Suspense fallback={<AdminPageFallback />}>
                <ResearchAdminApp />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route path="/sessions" element={<InSessionPage />} />
        <Route
          path="/weekly-report"
          element={
            <ErrorBoundary>
              <Suspense fallback={<AdminPageFallback />}>
                <WeeklyReportApp />
              </Suspense>
            </ErrorBoundary>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
