import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { PageLayout } from '@/specs/Universal/Pages';
import { Dashboard } from './components/Dashboard';
import './App.css';

import { ShellContext } from './context/ShellContext';

// Reuse the exact same screen content as the main prototype (content only, no PageLayout).
import InSessionContent from '../../in-session-ux/InSessionContent';
import { LessonsContent } from './components/LessonsContent';
import { ReflectionAssistantChat as ReflectionPage } from '../../in-session-ux/ReflectionAssistant/ReflectionAssistantChat';
import TutorAdminContent from '../../research-assistant-chat/src/views/TutorAdminContent';
import StudentInsightsModal from '../../in-session-ux/StudentInsightsModal';
import MonthlyReportsListContent from '../../monthly-report/src/MonthlyReportsListContent';
import MonthlyReportContent from '../../monthly-report/src/MonthlyReportContent';

/**
 * Demo Recording shell.
 *
 * Differences vs the main App.jsx:
 *  - Full screen: no fixed 1280×850 frame, no admin focus/desktop frame swapping.
 *  - Sidebar stays visible on every page (the demo is recorded full-width).
 *  - Pressing Enter on the Reflection page toggles the sidebar from the tutor
 *    nav to the supervisor/admin nav (the "Admin" section with Training Progress).
 *
 * Demo navigation sequence:
 *  Home → Lessons (Supporting a Growth Mindset) → Sessions (in-session)
 *  → reflection FAB (bottom-right) → Reflection
 *  → press Enter (tutor → admin sidebar)
 *  → Training Progress (Admin ▸ Tutors) → research terminal FAB (bottom-right).
 */

// Map URL paths to sidebar tab IDs
const pathToTab = {
    '/': 'home',
    '/home': 'home',
    '/reflection': 'sessions',
    '/sessions': 'sessions',
    '/lessons': 'lessons',
    '/lessons/supporting-growth-mindset': 'lessons',
    '/monthly-reports': 'reviews',
    '/monthly-report': 'reviews',
    '/admin': 'tutors',
    '/research-assistant': 'tutors',
};

// Map URL paths to user type (tutor vs supervisor)
const pathToUserType = {
    '/': 'tutor',
    '/home': 'tutor',
    '/reflection': 'tutor',
    '/sessions': 'tutor',
    '/lessons': 'tutor',
    '/lessons/supporting-growth-mindset': 'tutor',
    '/monthly-reports': 'tutor',
    '/monthly-report': 'tutor',
    '/admin': 'supervisor',
    '/research-assistant': 'supervisor',
};

// ShellLayout: Persistent PageLayout with Outlet for child routes
const ShellLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [shellEntered, setShellEntered] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setShellEntered(true));
    }, []);

    // When true, force the supervisor (admin) sidebar even on tutor routes.
    // Flipped on by pressing Enter on the Reflection page.
    const [forceSupervisorSidebar, setForceSupervisorSidebar] = useState(false);

    // Dynamic config from child pages via context
    const [breadcrumbs, setBreadcrumbs] = useState([{ text: 'Home', href: '/home' }]);
    const [topBarUser, setTopBarUser] = useState({ name: 'Boyuan Guo', counter: null, counterValue: null, type: 'lead tutor' });
    const [mainClassName, setMainClassName] = useState('');
    const [contentDirect, setContentDirect] = useState(false);
    const [floatingContent, setFloatingContent] = useState(null);
    const [activeTabOverride, setActiveTabOverride] = useState(null);

    // Global Modal State
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
    const [modalOptions, setModalOptions] = useState({ student: null, allStudents: [], containerSelector: null });

    const openStudentInsights = (options) => {
        setModalOptions(options);
        setIsInsightsModalOpen(true);
    };

    const normalizedPath = (location.pathname || '/').replace(/\/+$/, '') || '/';

    // Reset transient page config when URL changes so the new page renders cleanly.
    useEffect(() => {
        setActiveTabOverride(null);
        setMainClassName('');
        setContentDirect(false);
        setIsInsightsModalOpen(false);
        // Returning Home resets the demo so it can be re-recorded from the top.
        if (normalizedPath === '/' || normalizedPath === '/home') {
            setForceSupervisorSidebar(false);
        }
    }, [normalizedPath]);

    // Keep the route on the research assistant right after compare-button navigation.
    useEffect(() => {
        if (normalizedPath !== '/admin') return;
        if (typeof window === 'undefined') return;
        const forceUntilRaw = window.sessionStorage.getItem('forceResearchAssistantUntil');
        const forceUntil = forceUntilRaw ? Number(forceUntilRaw) : 0;
        if (Number.isFinite(forceUntil) && forceUntil > Date.now()) {
            navigate('/research-assistant', { replace: true });
        }
    }, [normalizedPath, navigate]);

    // Demo gesture: the backslash key ("\") toggles the admin section of the
    // sidebar on/off, on any page. Chosen because it never conflicts with the
    // chat inputs (unlike Enter). Captured globally so focus never blocks it.
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key !== '\\' || e.repeat) return;
            e.preventDefault();
            setForceSupervisorSidebar((on) => !on);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    // Derive activeTab + user type from URL (or override).
    const isLessonsPath = location.pathname.startsWith('/lessons');
    const activeTab = activeTabOverride || (isLessonsPath ? 'lessons' : (pathToTab[normalizedPath] || 'home'));
    const routeUserType = isLessonsPath ? 'tutor' : (pathToUserType[normalizedPath] || 'tutor');
    const userType = forceSupervisorSidebar ? 'supervisor' : routeUserType;

    // The research terminal is an immersive full-screen chat; collapse the sidebar there.
    const sidebarHidden = normalizedPath === '/research-assistant';

    const topBarConfig = {
        breadcrumbs,
        user: topBarUser,
    };

    const sidebarConfig = {
        user: userType,
        activeTabId: activeTab,
        onHomeClick: () => navigate('/home'),
        onTabClick: (id) => {
            if (id === 'home') navigate('/home');
            if (id === 'lessons') navigate('/lessons/supporting-growth-mindset');
            if (id === 'sessions') navigate('/sessions');
            if (id === 'reviews') navigate('/monthly-reports');
            if (id === 'onboarding') navigate('/lessons/supporting-growth-mindset');
            // Admin ▸ Tutors === the Training Progress page in this demo.
            if (id === 'tutors' || id === 'admin-sessions' || id === 'students' || id === 'groups' || id === 'compliance-monitor') {
                navigate('/admin');
            }
        }
    };

    return (
        <ShellContext.Provider value={{
            setBreadcrumbs,
            setTopBarUser,
            setMainClassName,
            setContentDirect,
            setFloatingContent,
            setActiveTabOverride,
            openStudentInsights
        }}>
            <PageLayout
                topBarConfig={topBarConfig}
                sidebarConfig={sidebarConfig}
                id="home-redesign-page"
                className={`plus-page-reveal ${mainClassName}`.trim()}
                shellEntered={shellEntered}
                contentDirect={contentDirect}
                floatingContent={floatingContent}
                sidebarHidden={sidebarHidden}
            >
                <Outlet key={location.pathname} />
            </PageLayout>

            {isInsightsModalOpen && (
                <StudentInsightsModal
                    student={modalOptions.student}
                    allStudents={modalOptions.allStudents}
                    onClose={() => setIsInsightsModalOpen(false)}
                    onSelectStudent={(s) => setModalOptions(prev => ({ ...prev, student: s }))}
                    containerSelector={modalOptions.containerSelector}
                />
            )}
        </ShellContext.Provider>
    );
};

// Home Page content (uses ShellContext to set breadcrumbs)
const HomeContent = () => {
    const { setBreadcrumbs, setMainClassName, setFloatingContent } = useContext(ShellContext);

    useEffect(() => {
        setBreadcrumbs([{ text: 'Home', href: '/home' }]);
        setMainClassName('home-scrollable');
        setFloatingContent(null);
        return () => setMainClassName('');
    }, [setBreadcrumbs, setMainClassName, setFloatingContent]);

    return <Dashboard />;
};

// Reflection page wrapper (clears FAB from sessions page for smooth SPA transition)
const ReflectionContent = () => {
    const { setBreadcrumbs, setFloatingContent, setMainClassName } = useContext(ShellContext);

    useEffect(() => {
        setBreadcrumbs([
            { text: 'Toolkit', href: '#' },
            { text: 'Sessions', href: '/sessions' },
            { text: 'Session Reflection' }
        ]);
        setMainClassName('');
        setFloatingContent(null);
    }, [setBreadcrumbs, setFloatingContent, setMainClassName]);

    return <ReflectionPage />;
};

function DemoApp() {
    return (
        <Routes>
            <Route element={<ShellLayout />}>
                <Route index element={<HomeContent />} />
                <Route path="home" element={<HomeContent />} />
                <Route path="reflection" element={<ReflectionContent />} />
                <Route path="sessions" element={<InSessionContent />} />
                <Route path="lessons" element={<Navigate to="/lessons/supporting-growth-mindset" replace />} />
                <Route path="lessons/*" element={<Navigate to="/lessons/supporting-growth-mindset" replace />} />
                <Route path="lessons/supporting-growth-mindset" element={<LessonsContent />} />
                <Route path="monthly-reports" element={<MonthlyReportsListContent />} />
                <Route path="monthly-report" element={<MonthlyReportContent />} />
                <Route path="admin" element={<TutorAdminContent />} />
                <Route path="research-assistant" element={<TutorAdminContent />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
            </Route>
        </Routes>
    );
}

export default DemoApp;
