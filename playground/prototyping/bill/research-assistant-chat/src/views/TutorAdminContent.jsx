import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShellContext } from '../../../home-redesign/src/context/ShellContext';
import { TrainingProgressContent } from '../components/TrainingProgressContent';
import { CompactChatBar } from '../components/CompactChatBar';
import { ResearchAssistantChat } from '../ResearchAssistantChat';

import '@/specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage.scss';

const CHAT_PANEL_EASE = [0.16, 1, 0.3, 1];
const CHAT_PANEL_DURATION = 0.36;

/**
 * TutorAdminContent: Content-only version for use inside ShellLayout.
 * Uses ShellContext to update TopBar, Layout, and FloatingContent.
 */
export const TutorAdminContent = () => {
    const { setBreadcrumbs, setMainClassName, setFloatingContent, setContentDirect } = useContext(ShellContext);

    const [chatExpanded, setChatExpanded] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);

    const navigate = useNavigate();
    const handleExpand = () => navigate('/research-assistant');
    const handleBack = () => setChatExpanded(false);

    // Update shell context on mount and when chat state changes
    useEffect(() => {
        setBreadcrumbs([
            { text: 'Admin', href: '#' },
            { text: 'Tutors', href: '#' },
            { text: 'Training Progress' }
        ]);
        setMainClassName(!chatExpanded ? 'tutor-training-progress-page__content' : '');
        setContentDirect(chatExpanded);
        setFloatingContent(!chatExpanded ? (
            <div style={{ maxWidth: 420 }}>
                <CompactChatBar onExpand={handleExpand} />
            </div>
        ) : null);
    }, [chatExpanded, setBreadcrumbs, setMainClassName, setContentDirect, setFloatingContent]);

    useEffect(() => {
        requestAnimationFrame(() => setHasEntered(true));
    }, []);

    return (
        <AnimatePresence mode="wait">
            {chatExpanded ? (
                <motion.div
                    key="chat"
                    initial={{ opacity: 0, scale: 0.995 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.995 }}
                    transition={{ duration: CHAT_PANEL_DURATION, ease: CHAT_PANEL_EASE }}
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
                    <ResearchAssistantChat onBack={handleBack} />
                </motion.div>
            ) : (
                <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`admin-reveal-root${hasEntered ? ' has-entered' : ''}`}
                    style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}
                >
                    <div className="reveal-section">
                        <TrainingProgressContent />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TutorAdminContent;
