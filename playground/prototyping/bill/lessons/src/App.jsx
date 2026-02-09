import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/specs/Universal/Pages';
import '@/shell-animations.css';

function App() {
    const navigate = useNavigate();
    // Removed shellLoading state
    const [shellEntered, setShellEntered] = useState(false);

    useEffect(() => {
        // Trigger entrance animation immediately on mount
        requestAnimationFrame(() => setShellEntered(true));
    }, []);

    const topBarConfig = {
        user: { name: 'Boyuan Guo', type: 'tutor' },
        breadcrumbs: [{ text: 'Training', href: '#' }, { text: 'Lessons', href: '#' }, { text: 'Supporting a Growth Mindset' }]
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            shellEntered={shellEntered}
            sidebarConfig={{
                user: 'tutor', // Lessons view hides Admin section
                activeTab: 'lessons',
                onHomeClick: () => {
                    sessionStorage.removeItem('plus-shell-loaded');
                    navigate('/'); // Nav to Home
                },
                onTabClick: (id) => {
                    if (id === 'home') {
                        sessionStorage.removeItem('plus-shell-loaded');
                        navigate('/');
                    }
                    if (id === 'sessions') navigate('/sessions');
                    if (id === 'weekly-report') navigate('/weekly-reports');
                    if (id === 'tutors') navigate('/admin');
                }
            }}
            id="lessons-page"
            className="plus-page-reveal"
        >
            <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--size-surface-radius, 16px)',
                padding: 'var(--Surface-pad-y, 24px) var(--Surface-pad-x, 32px)',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
            }}>
                <h1 style={{ marginBottom: '1rem', fontFamily: 'var(--font-family-header)' }}>Supporting a Growth Mindset</h1>
                <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    This prototype is currently under development.
                </p>
            </div>
        </PageLayout>
    );
}

export default App;
