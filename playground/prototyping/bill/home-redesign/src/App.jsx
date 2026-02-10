import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import { useNavigate, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { PageLayout } from '@/specs/Universal/Pages';
import { Dashboard } from './components/Dashboard';
import './App.css';

import { ShellContext } from './context/ShellContext';

// Import other prototypes (content only, no PageLayout)
import InSessionContent from '../../sessions/InSessionContent';
import { LessonsContent } from './components/LessonsContent';
import { ReflectionAssistantChat as ReflectionPage } from '../../sessions/ReflectionAssistant/ReflectionAssistantChat';
import TutorAdminContent from '../../research-assistant-chat/src/views/TutorAdminContent';
import WeeklyReportsListContent from '../../weekly-report/src/WeeklyReportsListContent';
import WeeklyReportContent from '../../weekly-report/src/WeeklyReportContent';

import DevIndexPage from './components/DevIndexPage';

import StudentInsightsModal from '../../sessions/StudentInsightsModal';

// Map URL paths to sidebar tab IDs
const pathToTab = {
    '/': 'home',
    '/home': 'home',
    '/dev': null,
    '/reflection': 'sessions',
    '/sessions': 'sessions',
    '/lessons': 'lessons',
    '/lessons/supporting-growth-mindset': 'lessons',
    '/admin': 'tutors',
    '/research-assistant': 'tutors',
    '/weekly-reports': 'weekly-report',
    '/weekly-report': 'weekly-report'
};

// Map URL paths to user type (tutor vs supervisor)
const pathToUserType = {
    '/': 'tutor',
    '/home': 'tutor',
    '/reflection': 'tutor',
    '/sessions': 'tutor',
    '/lessons': 'tutor',
    '/lessons/supporting-growth-mindset': 'tutor',
    '/admin': 'supervisor',
    '/research-assistant': 'supervisor',
    '/weekly-reports': 'tutor',
    '/weekly-report': 'tutor'
};

// ShellLayout: Persistent PageLayout with Outlet for child routes
const ShellLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [shellEntered, setShellEntered] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setShellEntered(true));
    }, []);

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

    // Reset override when URL changes so the new page's tab highlights correctly
    useEffect(() => {
        setActiveTabOverride(null);
        setMainClassName('');
        setContentDirect(false);
        setIsInsightsModalOpen(false); // Close modal on navigation
    }, [location.pathname]);

    // Cross-remount guard: keep route on research assistant right after compare-button navigation.
    useEffect(() => {
        if (location.pathname !== '/admin') return;
        if (typeof window === 'undefined') return;
        const forceUntilRaw = window.sessionStorage.getItem('forceResearchAssistantUntil');
        const forceUntil = forceUntilRaw ? Number(forceUntilRaw) : 0;
        if (Number.isFinite(forceUntil) && forceUntil > Date.now()) {
            navigate('/research-assistant', { replace: true });
        }
    }, [location.pathname, navigate]);

    // Derive activeTab from URL (or use override if set)
    const normalizedPath = (location.pathname || '/').replace(/\/+$/, '') || '/';
    const browserPath = typeof window !== 'undefined'
        ? ((window.location.pathname || '/').replace(/\/+$/, '') || '/')
        : normalizedPath;
    const effectivePath = browserPath === '/research-assistant' ? browserPath : normalizedPath;
    const isLessonsPath = location.pathname.startsWith('/lessons');
    const isAdminRoute = effectivePath === '/admin' || effectivePath === '/research-assistant';
    const activeTab = activeTabOverride || (isLessonsPath ? 'lessons' : (pathToTab[effectivePath] || 'home'));
    const userType = isLessonsPath ? 'tutor' : (pathToUserType[effectivePath] || 'supervisor');

    useLayoutEffect(() => {
        const root = document.getElementById('root');
        if (!root) return undefined;
        if (isAdminRoute) {
            root.classList.add('admin-demo-frame');
        } else {
            root.classList.remove('admin-demo-frame');
        }
        return () => {
            root.classList.remove('admin-demo-frame');
        };
    }, [isAdminRoute]);

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
            if (id === 'weekly-report') navigate('/weekly-reports');
            if (id === 'tutors') navigate(effectivePath === '/research-assistant' ? '/research-assistant' : '/admin');
            if (id === 'onboarding') navigate('/lessons/supporting-growth-mindset');
            if (id === 'admin-sessions') navigate('/admin');
            if (id === 'students') navigate('/admin');
            if (id === 'groups') navigate('/admin');
            if (id === 'compliance-monitor') navigate('/admin');
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
                className={`plus-page-reveal ${isAdminRoute ? 'admin-demo-layout' : ''} ${mainClassName}`.trim()}
                shellEntered={shellEntered}
                contentDirect={contentDirect}
                floatingContent={floatingContent}
                sidebarHidden={isAdminRoute}
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
        setMainClassName('home-scrollable'); // Enable scrolling
        setFloatingContent(null); // Clear any FABs from other pages
        return () => setMainClassName(''); // Reset on unmount
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

function App() {
    return (
        <Routes>
            <Route path="/" element={<DevIndexPage />} />
            <Route element={<ShellLayout />}>
                <Route path="/home" element={<HomeContent />} />
                <Route path="/reflection" element={<ReflectionContent />} />
                <Route path="/sessions" element={<InSessionContent />} />
                <Route path="/lessons" element={<Navigate to="/lessons/supporting-growth-mindset" replace />} />
                <Route path="/lessons/*" element={<Navigate to="/lessons/supporting-growth-mindset" replace />} />
                <Route path="/lessons/supporting-growth-mindset" element={<LessonsContent />} />
                <Route path="/admin" element={<TutorAdminContent />} />
                <Route path="/research-assistant" element={<TutorAdminContent />} />
                <Route path="/weekly-reports" element={<WeeklyReportsListContent />} />
                <Route path="/weekly-report" element={<WeeklyReportContent />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
            </Route>
        </Routes>
    );
}

export default App;
