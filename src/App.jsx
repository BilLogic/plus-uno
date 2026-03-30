import React, { Suspense } from 'react';
import { Routes, Route, useParams, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'react-bootstrap';
import NavFab from './components/NavFab/NavFab';
import HomeRedesignApp from '../playground/home-redesign/src/App';
import SidebarIterationApp from '../playground/sidebar-iteration/src/App';
import { PrototypeMarket } from './pages/PrototypeMarket';
import { prototypes } from './pages/PrototypeMarket/prototypes-data';
import './App.scss';

// --- Lazy-loaded Group 1 prototypes (have src/App.jsx with default export) ---
const WeeklyReportApp = React.lazy(() => import('../playground/weekly-report-demo/src/App'));
const FillInFlowApp = React.lazy(() => import('../playground/fill-in-flow/App'));
const TutorReflectionFormApp = React.lazy(() => import('../playground/tutor-reflection-form/src/App'));
const RecommendSessionsApp = React.lazy(() => import('../playground/recommend-sessions/App'));
const StarterApp = React.lazy(() => import('../playground/starter/src/App'));
const StudentGoalDashboardApp = React.lazy(() => import('../playground/student-goal-dashboard-flow/src/App'));
const StudentOnboardingWizardApp = React.lazy(() => import('../playground/student-onboarding-wizard/src/App'));

// --- Lazy-loaded Group 2 prototypes (page components, no App shell) ---
const SessionsPage = React.lazy(() => import('../playground/session-management/SessionsPage'));
const TutorPerformancePage = React.lazy(() => import('../playground/tutor-performance/TutorPerformancePage'));
const TrainingProgressPage = React.lazy(() => import('../playground/training-progress/TrainingProgressPage'));
const GroupPerformanceV2Page = React.lazy(() => import('../playground/group-performance-v2/GroupPerformanceV2Page'));
const TutorRiskInterventionsPage = React.lazy(() => import('../playground/tutor-risk-interventions/TutorRiskInterventionsPage'));
const TrainingOnboardingClickthrough = React.lazy(() => import('../playground/training-onboarding/TrainingOnboardingClickthrough'));

function StorybookEmbed() {
  const storyBookUrl = import.meta.env.VITE_STORYBOOK_URL || 'http://localhost:4200';

  // If external URL, redirect instead of iframe
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
        zIndex: 1
      }}
    />
  );
}

// Map prototype IDs to their internal route within the home-redesign shell
const HOME_SHELL_ROUTES = {
  '1001': '/home',           // Redesigned Homepage
  '1002': '/admin',          // Tutor Admin
  '1003': '/sessions',       // Sessions
  '1004': '/reflection',     // Session Reflection
  '1005': '/lessons/supporting-growth-mindset', // Lessons Simulator
  '1006': '/research-assistant', // Research Assistant Chat
  '1008': '/monthly-reports',   // Monthly Report
};

// Marketplace numeric IDs redirect to the shell's named path.
// HomeRedesignApp then picks up the initialRoute via the InitialRouteRedirect
// helper and navigates internally within the same BrowserRouter.
function HomeShellRedirect() {
  const { prototypeId } = useParams();
  const homeRoute = HOME_SHELL_ROUTES[prototypeId];
  if (!homeRoute) return <Navigate to="/" replace />;
  return <Navigate to={homeRoute} replace />;
}

function PrototypeRouter() {
  const { prototypeId } = useParams();

  // Standalone embedded prototypes
  if (prototypeId === '1014') { // Sidebar Iteration
    return <SidebarIterationApp />;
  }

  // Map of lazy-loaded standalone prototypes
  const STANDALONE_ROUTES = {
    '1009': WeeklyReportApp,
    '1010': SessionsPage,
    '1011': TutorPerformancePage,
    '1012': TrainingProgressPage,
    '1013': FillInFlowApp,
    '1016': GroupPerformanceV2Page,
    '1017': TutorRiskInterventionsPage,
    '1018': TutorReflectionFormApp,
    '1022': RecommendSessionsApp,
    '1023': StarterApp,
    '1024': StudentGoalDashboardApp,
    '1025': StudentOnboardingWizardApp,
    '1026': TrainingOnboardingClickthrough,
  };

  const LazyComponent = STANDALONE_ROUTES[prototypeId];
  if (LazyComponent) {
    return (
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui' }}>Loading prototype…</div>}>
        <LazyComponent />
      </Suspense>
    );
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
  const location = useLocation();
  const isStorybook = location.pathname.startsWith('/storybook');

  return (
    <ThemeProvider>
      {!isStorybook && <NavFab />}
      <Routes>
        {/* Marketplace is the landing page */}
        <Route path="/" element={<PrototypeMarket />} />
        <Route path="/market" element={<PrototypeMarket />} />

        {/* Storybook — embedded via iframe from port 4200 */}
        <Route path="/storybook" element={<StorybookEmbed />} />

        {/* Home-redesign shell — contentKey tells the shell which content to
            render at its index route (parent prefix gets stripped by RR6). */}
        <Route path="/home/*" element={<HomeRedesignApp contentKey="home" />} />
        <Route path="/admin/*" element={<HomeRedesignApp contentKey="admin" />} />
        <Route path="/sessions/*" element={<HomeRedesignApp contentKey="sessions" />} />
        <Route path="/reflection/*" element={<HomeRedesignApp contentKey="reflection" />} />
        <Route path="/lessons/*" element={<HomeRedesignApp contentKey="lessons" />} />
        <Route path="/research-assistant/*" element={<HomeRedesignApp contentKey="research-assistant" />} />
        <Route path="/monthly-reports/*" element={<HomeRedesignApp contentKey="monthly-reports" />} />
        <Route path="/monthly-report/*" element={<HomeRedesignApp contentKey="monthly-report" />} />

        {/* Numeric prototype IDs: redirect shell IDs to named paths, others to PrototypeRouter */}
        <Route path="/:prototypeId/*" element={<PrototypeRouterOrRedirect />} />
      </Routes>
    </ThemeProvider>
  );
}

// Dispatcher: numeric IDs that belong to the home-redesign shell get redirected
// to named paths (which match the routes above). Everything else goes to PrototypeRouter.
function PrototypeRouterOrRedirect() {
  const { prototypeId } = useParams();
  const homeRoute = HOME_SHELL_ROUTES[prototypeId];
  if (homeRoute) {
    return <Navigate to={homeRoute} replace />;
  }
  return <PrototypeRouter />;
}

export default App;
