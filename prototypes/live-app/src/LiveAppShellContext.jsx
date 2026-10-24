import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageLayoutShellProvider } from '@/specs/Universal/Pages/PageLayout/PageLayoutShellContext';
import { clearOpenTabs, getOpenTabsStore } from '@/patterns';

/** The sign-in page. Reaching it means the person is signed out. */
export const SIGN_IN_ROUTE = '/login';

/**
 * Maps Sidebar tab ids → live-app routes.
 * @type {Record<string, string>}
 */
export const SIDEBAR_TAB_ROUTES = {
  home: '/home',
  lessons: '/training/lessons',
  onboarding: '/training/onboarding',
  sessions: '/toolkit/sessions',
  // Toolkit › Students has no tutor page yet; the admin students list stands in.
  'toolkit-students': '/toolkit/students',
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
  if (pathname.startsWith('/toolkit/students')) return 'toolkit-students';
  // Post-session and reflection pages sit under Toolkit › Sessions: the sidebar
  // shows Reviews only with `showItemsNotInSpecs`, which the live app leaves off.
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

  // Open tabs last for the signed-in session: the replica has no sign-out
  // action, so arriving at sign-in is where they are cleared.
  useEffect(() => {
    if (location.pathname.startsWith(SIGN_IN_ROUTE)) clearOpenTabs();
  }, [location.pathname]);

  // A selected tab is the record on screen. Arriving anywhere other than its
  // route (the replica nav, Back) hands the selection back to its parent, so a
  // stale tab never stays highlighted or reopens its record later.
  useEffect(() => {
    const store = getOpenTabsStore();
    const { tabs, selectedId } = store.getSnapshot();
    const selected = tabs.find((tab) => tab.id === selectedId);
    if (selected?.href && selected.href !== location.pathname) store.select(selected.parentId);
  }, [location.pathname]);

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
      /**
       * An open tab links to its record's route. The tab itself never routes:
       * this is the app going to the record when it is somewhere else.
       *
       * @param {{ href?: string }} tab
       */
      onOpenTabSelect: (tab) => {
        if (tab.href && tab.href !== location.pathname) navigate(tab.href);
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
