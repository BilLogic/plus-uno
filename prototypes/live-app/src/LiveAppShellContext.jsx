import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageLayoutShellProvider } from '@/specs/Universal/Pages/PageLayout/PageLayoutShellContext';

/**
 * Maps Sidebar tab ids → live-app routes.
 * @type {Record<string, string>}
 */
export const SIDEBAR_TAB_ROUTES = {
  home: '/home',
  lessons: '/training/lessons',
  onboarding: '/training/onboarding',
  sessions: '/toolkit/sessions',
  reviews: '/toolkit/post-session',
  tutors: '/admin/tutors/training',
  'admin-sessions': '/admin/sessions',
  students: '/admin/students',
  groups: '/admin/groups',
  'compliance-monitor': '/admin/tutors/warnings',
};

/**
 * Resolve the active sidebar tab from the current pathname.
 *
 * @param {string} pathname
 * @returns {string}
 */
export function activeTabFromPath(pathname) {
  if (pathname.startsWith('/home')) return 'home';
  if (pathname.startsWith('/training/lessons')) return 'lessons';
  if (pathname.startsWith('/training/onboarding')) return 'onboarding';
  if (pathname.startsWith('/toolkit/in-session')) return 'sessions';
  if (
    pathname.startsWith('/toolkit/post-session')
    || pathname.startsWith('/toolkit/session-reflection')
    || pathname.startsWith('/toolkit/student-reflection')
    || pathname.startsWith('/toolkit/form-feedback')
    || pathname.startsWith('/toolkit/self-reflection')
  ) {
    return 'reviews';
  }
  if (pathname.startsWith('/toolkit')) return 'sessions';
  if (pathname.startsWith('/admin/tutors')) return 'tutors';
  if (pathname.startsWith('/admin/sessions')) return 'admin-sessions';
  if (pathname.startsWith('/admin/students')) return 'students';
  if (pathname.startsWith('/admin/groups')) return 'groups';
  if (pathname.startsWith('/admin')) return 'tutors';
  return 'home';
}

/**
 * Provides PageLayout shell overrides for the live app (Admin nav, routing, fullscreen).
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function LiveAppShellProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const value = useMemo(
    () => ({
      enabled: true,
      fullscreen: true,
      user: /** @type {'supervisor'} */ ('supervisor'),
      forceSidebarExpanded: true,
      activeTab: activeTabFromPath(location.pathname),
      goHome: () => navigate('/home'),
      /**
       * @param {string} tabId
       */
      onTabClick: (tabId) => {
        const to = SIDEBAR_TAB_ROUTES[tabId];
        if (to) navigate(to);
      },
    }),
    [navigate, location.pathname],
  );

  return (
    <PageLayoutShellProvider value={value}>
      {children}
    </PageLayoutShellProvider>
  );
}

export default LiveAppShellProvider;
