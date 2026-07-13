import React, { useEffect, useContext, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShellContext } from '../../../home-redesign/src/context/ShellContext';
import { TrainingProgressContent } from '../components/TrainingProgressContent';
import { CompactChatBar } from '../components/CompactChatBar';
import { ResearchAssistantChat } from '../ResearchAssistantChat';
import '../ResearchAssistantChat.css';

import '@/specs/Admin/Tutor/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage.scss';

/**
 * TutorAdminContent: Content-only version for use inside ShellLayout.
 * Uses ShellContext to update TopBar, Layout, and FloatingContent.
 */
export const TutorAdminContent = () => {
    const { setBreadcrumbs, setMainClassName, setFloatingContent, setContentDirect } = useContext(ShellContext);

    const [hasEntered, setHasEntered] = useState(false);
    const [hasStageOverview, setHasStageOverview] = useState(false);
    const [hasStageDetails, setHasStageDetails] = useState(false);
    const [hasStageRows, setHasStageRows] = useState(false);
    const [chatExpanded, setChatExpanded] = useState(false);
    const lockResearchRouteRef = useRef(false);

    const navigate = useNavigate();
    const location = useLocation();
    const normalizedPath = (location.pathname || '/').replace(/\/+$/, '') || '/';
    const browserPath = typeof window !== 'undefined'
        ? ((window.location.pathname || '/').replace(/\/+$/, '') || '/')
        : normalizedPath;
    const isResearchAssistantRoute = normalizedPath === '/research-assistant' || browserPath === '/research-assistant';
    const showResearchAssistant = isResearchAssistantRoute || chatExpanded;
    const handleExpand = () => {
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('forceResearchAssistantUntil', String(Date.now() + 10000));
        }
        lockResearchRouteRef.current = true;
        setChatExpanded(true);
        navigate('/research-assistant');
    };

    useEffect(() => {
        setChatExpanded(isResearchAssistantRoute);
    }, [isResearchAssistantRoute]);

    useEffect(() => {
        if (!lockResearchRouteRef.current) {
            return;
        }
        if (!isResearchAssistantRoute) {
            navigate('/research-assistant', { replace: true });
        }
    }, [isResearchAssistantRoute, navigate]);

    // Update shell context for admin content route.
    useEffect(() => {
        if (showResearchAssistant) {
            setBreadcrumbs([
                { text: 'Admin', href: '#' },
                { text: 'Research Assistant' }
            ]);
            setMainClassName('');
            setContentDirect(true);
            setFloatingContent(null);
            return;
        }

        setBreadcrumbs([
            { text: 'Admin', href: '#' },
            { text: 'Tutors', href: '#' },
            { text: 'Training Progress' }
        ]);
        setMainClassName('tutor-training-progress-page__content');
        setContentDirect(false);
        setFloatingContent(
            <div style={{ width: 'min(680px, calc(100vw - 160px))' }}>
                <CompactChatBar onExpand={handleExpand} />
            </div>
        );
        // Depend only on showResearchAssistant: the context setters are stable
        // useState dispatchers, and `navigate` can change identity on navigation —
        // including it here re-ran this effect every render, calling
        // setFloatingContent(<new element>) repeatedly (infinite update loop).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showResearchAssistant]);

    useEffect(() => {
        // setTimeout (not requestAnimationFrame) so the reveal still triggers when
        // the tab isn't foregrounded — rAF is paused in background/hidden tabs.
        const t = window.setTimeout(() => setHasEntered(true), 0);
        return () => window.clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!hasEntered || showResearchAssistant) {
            return undefined;
        }

        const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
            setHasStageOverview(true);
            setHasStageDetails(true);
            setHasStageRows(true);
            return undefined;
        }

        // Top (overview) reveals first; the bottom (details) starts as the top is
        // finishing, so the cascade reads cleanly top-to-bottom with light overlap.
        setHasStageOverview(true);
        const detailsTimer = window.setTimeout(() => setHasStageDetails(true), 620);
        const rowsTimer = window.setTimeout(() => setHasStageRows(true), 900);

        return () => {
            window.clearTimeout(detailsTimer);
            window.clearTimeout(rowsTimer);
        };
    }, [hasEntered, showResearchAssistant]);

    if (showResearchAssistant) {
        return (
            <motion.div
                key="research-assistant-content"
                initial={{ opacity: 0, scale: 0.995 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                }}
            >
                <ResearchAssistantChat />
            </motion.div>
        );
    }

    return (
        <div
            className={`admin-reveal-root${hasEntered ? ' has-entered' : ''}${hasStageOverview ? ' has-stage-overview' : ''}${hasStageDetails ? ' has-stage-details' : ''}${hasStageRows ? ' has-stage-rows' : ''}`}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}
        >
            <div className="reveal-section">
                <TrainingProgressContent />
            </div>
        </div>
    );
};

export default TutorAdminContent;
