import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore – plus-ds
import { PageLayout } from '@plus-ds/specs/Universal/Pages';
import { TrainingProgressContent } from '../components/TrainingProgressContent';
import { CompactChatBar } from '../components/CompactChatBar';
import { ResearchAssistantChat } from '../ResearchAssistantChat';
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
  const location = useLocation();
  const normalizedPath = (location.pathname || '/').replace(/\/+$/, '') || '/';
  const browserPath = typeof window !== 'undefined'
    ? ((window.location.pathname || '/').replace(/\/+$/, '') || '/')
    : normalizedPath;
  const isResearchAssistantRoute = normalizedPath === '/research-assistant' || browserPath === '/research-assistant';
  const showResearchAssistant = isResearchAssistantRoute || chatExpanded;
  const lockResearchRouteRef = useRef(false);

  // Loading & Disclosure States (matching Homepage pattern)
  const [shellEntered, setShellEntered] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const [hasStageOverview, setHasStageOverview] = useState(false);
  const [hasStageDetails, setHasStageDetails] = useState(false);
  const [hasStageRows, setHasStageRows] = useState(false);

  /** Shell reveal immediately (no skeleton phase). */
  useEffect(() => {
    const id = requestAnimationFrame(() => setShellEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Demo-only admin frame: 800x900 and admin-specific shell treatment.
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) {
      return undefined;
    }
    root.classList.add('admin-demo-frame');
    return () => {
      root.classList.remove('admin-demo-frame');
    };
  }, []);

  useEffect(() => {
    if (!contentVisible) return;
    const id = requestAnimationFrame(() => setHasEntered(true));
    return () => cancelAnimationFrame(id);
  }, [contentVisible]);

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

    setHasStageOverview(true);
    const detailsTimer = window.setTimeout(() => setHasStageDetails(true), 420);
    const rowsTimer = window.setTimeout(() => setHasStageRows(true), 900);

    return () => {
      window.clearTimeout(detailsTimer);
      window.clearTimeout(rowsTimer);
    };
  }, [hasEntered, showResearchAssistant]);

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

  const handleExpand = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('forceResearchAssistantUntil', String(Date.now() + 10000));
    }
    lockResearchRouteRef.current = true;
    setChatExpanded(true);
    navigate('/research-assistant');
  }, [navigate]);

  return (
    <PageLayout
      topBarConfig={topBarConfig}
      sidebarConfig={{
        ...sidebarConfig,
        onHomeClick: () => navigate('/home'),
        onTabClick: (id: string) => {
          if (id === 'sessions') navigate('/sessions');
          if (id === 'tutors') navigate(isResearchAssistantRoute ? '/research-assistant' : '/admin');
        },
      }}
      id="tutor-training-progress-page"
      className="admin-demo-layout"
      mainClassName={!showResearchAssistant ? 'tutor-training-progress-page__content' : ''}
      contentDirect={showResearchAssistant}
      shellEntered={shellEntered}
      floatingContent={
        !showResearchAssistant ? (
          <div style={{ width: 'min(680px, calc(100vw - 160px))' }}>
            <CompactChatBar onExpand={handleExpand} />
          </div>
        ) : null
      }
    >
      <AnimatePresence mode="wait">
        {showResearchAssistant ? (
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
            <ResearchAssistantChat />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`admin-reveal-root${hasEntered ? ' has-entered' : ''}${hasStageOverview ? ' has-stage-overview' : ''}${hasStageDetails ? ' has-stage-details' : ''}${hasStageRows ? ' has-stage-rows' : ''}`}
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
