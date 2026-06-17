import React, { useState } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import SessionsPage from './components/SessionsPage';
import './App.scss';

export default function App() {
    const [activeTab, setActiveTab] = useState('my-sessions');

    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '/' },
            { text: 'Sessions', active: true },
        ],
        user: { name: 'John Doe', role: 'Lead', type: 'lead tutor' },
    };

    const sidebarConfig = {
        user: 'tutor',
        activeTabId: 'sessions',
        onHomeClick: () => {},
        onTabClick: () => {},
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="sessions-page"
        >
            <SessionsPage activeTab={activeTab} onTabChange={setActiveTab} />
        </PageLayout>
    );
}
