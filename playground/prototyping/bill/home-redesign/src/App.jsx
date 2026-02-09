import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { PageLayout } from '@/specs/Universal/Pages';
import { Dashboard } from './components/Dashboard';
import './App.css';

import { ShellContext } from './context/ShellContext';

// Import other prototypes (content only, no PageLayout)
import { LessonsContent } from './components/LessonsContent';
import { ReflectionAssistantChat as ReflectionPage } from '../../sessions/ReflectionAssistant/ReflectionAssistantChat';
import { ResearchAssistantChat as ResearchAssistantPage } from '../../research-assistant-chat/src/ResearchAssistantChat';
import WeeklyReportsListPage from './components/WeeklyReportsListPage';
import WeeklyReportDetailContent from './components/WeeklyReportDetailContent';

// Admin / Research Assistant wrapper
const AdminContent = () => {
    const { setBreadcrumbs, setContentDirect, setActiveTabOverride } = useContext(ShellContext);
    const navigate = useNavigate();

    useEffect(() => {
        setBreadcrumbs([
            { text: 'Admin', href: '/admin' },
            { text: 'Research Assistant' }
        ]);
        setContentDirect(true);
        setActiveTabOverride('tutors');
        return () => {
            setContentDirect(false);
            setActiveTabOverride(null);
        };
    }, [setBreadcrumbs, setContentDirect, setActiveTabOverride]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', width: '100%' }}>
            <ResearchAssistantPage onBack={() => navigate('/admin')} />
        </div>
    );
};

// Reflection page wrapper
const ReflectionContent = () => {
    const { setBreadcrumbs, setContentDirect, setActiveTabOverride } = useContext(ShellContext);
    const navigate = useNavigate();

    useEffect(() => {
        setBreadcrumbs([
            { text: 'Sessions', href: '/sessions' },
            { text: 'Session Reflection' }
        ]);
        setContentDirect(true);
        setActiveTabOverride('sessions');
        return () => {
            setContentDirect(false);
            setActiveTabOverride(null);
        };
    }, [setBreadcrumbs, setContentDirect, setActiveTabOverride]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', width: '100%' }}>
            <ReflectionPage onBack={() => navigate('/home')} />
        </div>
    );
};

function App() {
    const [breadcrumbs, setBreadcrumbs] = useState([{ text: 'Home', href: '#' }]);
    const [topBarUser, setTopBarUser] = useState({ name: 'Boyuan Guo', type: 'lead tutor' });
    const [mainClassName, setMainClassName] = useState('home-redesign-content');
    const [contentDirect, setContentDirect] = useState(false);
    const [floatingContent, setFloatingContent] = useState(null);
    const [activeTabOverride, setActiveTabOverride] = useState(null);

    // Shell entrance animation
    const [shellEntered, setShellEntered] = useState(false);
    useEffect(() => {
        requestAnimationFrame(() => setShellEntered(true));
    }, []);

    const sidebarConfig = useMemo(() => ({
        user: 'tutor',
        activeTab: activeTabOverride || 'home'
    }), [activeTabOverride]);

    const topBarConfig = useMemo(() => ({
        breadcrumbs,
        user: topBarUser
    }), [breadcrumbs, topBarUser]);

    const contextValue = useMemo(() => ({
        setBreadcrumbs,
        setTopBarUser,
        setMainClassName,
        setContentDirect,
        setFloatingContent,
        setActiveTabOverride
    }), []);

    return (
        <ShellContext.Provider value={contextValue}>
            <PageLayout
                topBarConfig={topBarConfig}
                sidebarConfig={sidebarConfig}
                id="home-redesign-page"
                className={mainClassName}
                shellEntered={shellEntered}
            >
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        <Route path="/home" element={<Dashboard setBreadcrumbs={setBreadcrumbs} />} />
                        <Route path="/lessons" element={<LessonsContent />} />
                        <Route path="/reflection" element={<ReflectionContent />} />
                        <Route path="/admin" element={<AdminContent />} />
                        <Route path="/weekly-reports" element={<WeeklyReportsListPage />} />
                        <Route path="/weekly-report" element={<WeeklyReportDetailContent />} />
                        <Route path="*" element={<Navigate to="/home" replace />} />
                    </Routes>
                    {floatingContent}
                </div>
            </PageLayout>
        </ShellContext.Provider>
    );
}

export default App;
