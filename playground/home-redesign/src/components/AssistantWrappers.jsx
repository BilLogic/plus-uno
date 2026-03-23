import React, { useEffect, useContext } from 'react';
import { ResearchAssistantChat } from '../../../research-assistant-chat/src/ResearchAssistantChat';
import { ReflectionAssistantChat } from '../../../sessions/ReflectionAssistant/ReflectionAssistantChat';
import { ShellContext } from '../context/ShellContext';
import { useNavigate } from 'react-router-dom';

/**
 * ResearchAssistantPage: Full-page view of Research Assistant.
 * Preserves "Admin" (tutors) sidebar highlight.
 */
export const ResearchAssistantPage = () => {
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
            <ResearchAssistantChat onBack={() => navigate('/admin')} />
        </div>
    );
};

/**
 * ReflectionPage: Full-page view of Session Reflection.
 * Preserves "Home" sidebar highlight.
 */
export const ReflectionPage = () => {
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
            <ReflectionAssistantChat onBack={() => navigate('/home')} />
        </div>
    );
};
