import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/specs/Universal/Pages';
import WeeklyReportPage from './WeeklyReportPage';

export default function WeeklyReportApp() {
    const navigate = useNavigate();

    // TopBar Configuration
    const topBarConfig = {
        breadcrumbs: [
            { text: 'Toolkit', href: '#' },
            { text: 'Weekly Report', href: '#' }
        ],
        user: { name: 'Albus Dumbledore', counter: null, counterValue: null, type: 'lead tutor' },
    };

    // Sidebar Configuration
    const sidebarConfig = {
        user: 'tutor',
        activeTabId: 'weekly-report', // Must match the ID we added to Sidebar.jsx
        onHomeClick: () => navigate('/home'),
        onTabClick: (id) => {
            if (id === 'sessions') navigate('/sessions');
            if (id === 'weekly-report') navigate('/weekly-report');
            if (id === 'tutors') navigate('/admin');
        }
    };

    // Simulate shell loading sequence like other prototypes
    const [shellLoading, setShellLoading] = React.useState(true);
    const [shellEntered, setShellEntered] = React.useState(false);

    React.useEffect(() => {
        // Fast shell load
        const t = setTimeout(() => {
            setShellLoading(false);
            setShellEntered(true);
        }, 500);
        return () => clearTimeout(t);
    }, []);

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="weekly-report-page"
            shellLoading={shellLoading}
            shellEntered={shellEntered}
            contentDirect={true}
        >
            <WeeklyReportPage />
        </PageLayout>
    );
}
