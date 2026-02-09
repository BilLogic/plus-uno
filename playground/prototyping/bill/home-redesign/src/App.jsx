import React, { useState } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { PageLayout } from '@/specs/Universal/Pages';
import { Dashboard } from './components/Dashboard';
import { LessonsContent } from './components/LessonsContent';
import './App.css';

function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const [breadcrumbs, setBreadcrumbs] = useState([{ text: 'Home', href: '#' }]);

    // Determine active tab based on location
    const getActiveTab = (path) => {
        if (path.includes('/lessons')) return 'lessons';
        if (path.includes('/sessions')) return 'sessions';
        return 'home';
    };

    const activeTab = getActiveTab(location.pathname);

    // Dynamic config
    const topBarConfig = {
        breadcrumbs: activeTab === 'lessons'
            ? [
                { text: 'Training', href: '#' },
                { text: 'Lessons', href: '#' },
                { text: 'Supporting a Growth Mindset' }
            ]
            : breadcrumbs,
        user: { name: 'Boyuan Guo', counter: null, counterValue: null, type: 'lead tutor' },
    };

    const sidebarConfig = {
        user: 'tutor',
        activeTab: activeTab,
        onHomeClick: () => navigate('/'),
        onTabClick: (id) => {
            if (id === 'home') navigate('/');
            if (id === 'lessons') navigate('/lessons');
            // External / Other prototypes
            if (id === 'sessions') navigate('/sessions');
            if (id === 'weekly-report') navigate('/weekly-reports');
            if (id === 'tutors') navigate('/admin');
            if (id === 'slack') window.open('https://slack.com', '_blank');
        }
    };

    // Shell state is managed by PageLayout (persistent verification), but we pass initial loading true
    // PageLayout will handle the "once-only" animation logic we added.
    const [shellLoading] = useState(true);
    const [shellEntered] = useState(false); // PageLayout handles transition

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="home-redesign-page"
            className="plus-page-reveal"
            mainClassName="home-redesign-content"
            shellLoading={shellLoading}
            shellEntered={shellEntered}
        >
            <Routes>
                <Route path="/" element={<Dashboard setBreadcrumbs={setBreadcrumbs} />} />
                <Route path="/lessons" element={<LessonsContent />} />
            </Routes>
        </PageLayout>
    );
}

export default App;
