import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHref, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components';
import { Frame, PatternSidebar, Topbar, useOpenTabs } from '@/patterns';
import { SESSIONS, STUDENTS, TUTOR } from '../data/mock';
import { HOME_ITEMS, NAV_SECTIONS, ROUTES, recordPath } from './nav';
import './AppShell.css';

/** The record a route names, for its sidebar tab: `/sessions/:id` or `/students/:id`. */
const recordFromPath = (pathname) => {
    const [, parentId, recordId] = pathname.split('/');
    if (parentId === 'sessions') {
        const session = SESSIONS.find((s) => s.id === recordId);
        return session ? { parentId, record: { id: session.id, title: session.tabTitle } } : null;
    }
    if (parentId === 'students') {
        const student = STUDENTS.find((s) => s.id === recordId);
        return student ? { parentId, record: { id: student.id, title: student.name } } : null;
    }
    return null;
};

/** The sidebar row a route selects: the record's tab when it is open, else the section's item. */
const activeIdFor = (pathname, tabs) => {
    if (pathname === '/' || pathname === '') return 'home';
    const [, section, recordId] = pathname.split('/');
    if (recordId && tabs.some((t) => t.id === `${section}:${recordId}`)) return `${section}:${recordId}`;
    return section;
};

/**
 * AppShell: the tutor app's frame. `Frame` with a `Topbar` (breadcrumbs, Help
 * Center, the tutor) and a `PatternSidebar`: Home; Training (Lessons,
 * Onboarding); Toolkit (Sessions, Students, Reviews, Slack ↗).
 *
 * Opened sessions and students are temporary tabs under their item, kept by
 * the open-tabs store the app provides. Visiting a session or a student opens
 * (or brings forward) its tab; the route decides which row is selected.
 * Page content goes in `children`, straight onto the Frame's 12-column grid.
 */
const AppShell = ({ breadcrumbs = [], children }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const base = useHref('/').replace(/\/$/, '');
    const { tabs, byParent, open, close, closeAll } = useOpenTabs();

    useEffect(() => {
        const found = recordFromPath(pathname);
        if (found) open(found.parentId, found.record);
    }, [pathname, open]);

    const withHrefs = Object.fromEntries(
        Object.entries(byParent).map(([parentId, list]) => [
            parentId,
            list.map((tab) => ({ ...tab, href: `${base}${recordPath(tab.parentId, tab.recordId)}` })),
        ]),
    );

    const go = (path) => (event) => {
        event?.preventDefault?.();
        navigate(path);
    };

    const crumbs = breadcrumbs.map((c) => (c.to ? { text: c.text, href: `${base}${c.to}`, onClick: go(c.to) } : { text: c.text }));

    const closeTab = (tab) => {
        close(tab.id);
        if (pathname.startsWith(recordPath(tab.parentId, tab.recordId))) navigate(ROUTES[tab.parentId]);
    };

    return (
        <Frame
            className="tr-shell"
            contentAs="main"
            topbar={(
                <Topbar
                    breadcrumbs={crumbs}
                    user={{ name: TUTOR.name, type: 'regular tutor' }}
                />
            )}
            sidebar={(
                <PatternSidebar
                    header={<Logo style="colored" size="XS" text={true} className="p-0" />}
                    items={HOME_ITEMS}
                    sections={NAV_SECTIONS}
                    activeId={activeIdFor(pathname, tabs)}
                    onSelect={(id) => navigate(ROUTES[id] ?? '/')}
                    openTabs={withHrefs}
                    onTabSelect={(tab) => navigate(recordPath(tab.parentId, tab.recordId))}
                    onTabClose={closeTab}
                    onTabsCloseAll={(item) => {
                        closeAll(item.id);
                        if (pathname.startsWith(`${ROUTES[item.id]}/`)) navigate(ROUTES[item.id]);
                    }}
                />
            )}
        >
            {children}
        </Frame>
    );
};

AppShell.propTypes = {
    /** The page's trail; the last is the current page. `to` is a route. */
    breadcrumbs: PropTypes.arrayOf(PropTypes.shape({ text: PropTypes.string.isRequired, to: PropTypes.string })),
    /** Page content, on the Frame's 12-column grid */
    children: PropTypes.node,
};

export default AppShell;
