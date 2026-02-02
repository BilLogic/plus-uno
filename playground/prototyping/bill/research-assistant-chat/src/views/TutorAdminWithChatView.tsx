import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore – plus-ds
import { PageLayout } from '@plus-ds/specs/Universal/Pages';
import { TrainingProgressContent } from '../components/TrainingProgressContent';
import { CompactChatBar } from '../components/CompactChatBar';
import { ResearchAssistantChat } from '../ResearchAssistantChat';
import { AdminSkeletons } from '../components/AdminSkeletons';
import '@plus-ds/specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage.scss';

const topBarConfig = {
  breadcrumbs: [
    { text: 'Admin', href: '#' },
    { text: 'Tutors', href: '#' },
    { text: 'Training Progress' }
  ],
  user: { name: 'Boyuan Guo', counter: null, counterValue: null, type: 'lead tutor' },
};

const sidebarConfig = {
  user: 'supervisor' as const,
  activeTab: 'tutors' as const,
};

/** Easing for full chat panel enter/exit: smooth deceleration at end. */
const CHAT_PANEL_EASE = [0.16, 1, 0.3, 1];
const CHAT_PANEL_DURATION = 0.36;

/**
 * Tutor Admin with integrated Research Assistant.
 * Content lives inside PageLayout's plus-page-content-wrapper. When chat is expanded,
 * children render directly in content-wrapper (no main) at 100% width/height.
 */
export function TutorAdminWithChatView(): React.ReactElement {
  const [chatExpanded, setChatExpanded] = useState(false);
  const navigate = useNavigate();

  // Loading & Disclosure States (matching Homepage pattern)
  const [shellLoading, setShellLoading] = useState(true);
  const [shellReady, setShellReady] = useState(false);
  const [shellEntered, setShellEntered] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  /** Shell + content sync point: slowing down to 800ms for more premium feel */
  useEffect(() => {
    const t = setTimeout(() => {
      setShellLoading(false);
      setShellReady(true);
      setContentReady(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!shellReady) return;
    const id = requestAnimationFrame(() => setShellEntered(true));
    return () => cancelAnimationFrame(id);
  }, [shellReady]);

  /** Content reveal: simultaneously with sidebar start */
  useEffect(() => {
    if (!contentReady) return;
    const t = setTimeout(() => setContentVisible(true), 0);
    return () => clearTimeout(t);
  }, [contentReady]);

  useEffect(() => {
    if (!contentVisible) return;
    const id = requestAnimationFrame(() => setHasEntered(true));
    return () => cancelAnimationFrame(id);
  }, [contentVisible]);

  const handleExpand = useCallback(() => setChatExpanded(true), []);
  const handleBack = useCallback(() => setChatExpanded(false), []);

  return (
    <PageLayout
      topBarConfig={topBarConfig}
      sidebarConfig={{
        ...sidebarConfig,
        onHomeClick: () => navigate('/home'),
        onTabClick: (id: string) => {
          if (id === 'sessions') navigate('/sessions');
          if (id === 'tutors') navigate('/admin');
        },
      }}
      id="tutor-training-progress-page"
      mainClassName={!chatExpanded ? 'tutor-training-progress-page__content' : ''}
      contentDirect={chatExpanded}
      shellLoading={shellLoading}
      shellEntered={shellEntered}
      floatingContent={
        !chatExpanded ? (
          <div style={{ maxWidth: 420 }}>
            <CompactChatBar onExpand={handleExpand} />
          </div>
        ) : null
      }
    >
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
        ) : !contentVisible ? (
          <div
            key="skeleton"
            className={`admin-skeleton-root${contentReady ? ' is-exiting' : ''}`}
            style={{ width: '100%' }}
          >
            <AdminSkeletons />
          </div>
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
    </PageLayout>
  );
}
