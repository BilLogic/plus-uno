import React from 'react';
import PropTypes from 'prop-types';
// The pattern's own folder, not the patterns barrel: the components barrel loads
// this file, and pulling every pattern (and its stylesheet) in here would
// reorder the cascade for every component that loads after it.
import PatternSidebar, { clearOpenTabs, useOpenTabs } from '@/patterns/Sidebar';
import { sidebarGroups } from './sidebarConfig';

/**
 * The PLUS sidebar: the Sidebar pattern (`@/patterns`) filled with the groups
 * for the role (`sidebarConfig.js`), the signed-in person's account row, and
 * the open tabs. Home is selected when nothing else is.
 *
 * Open tabs come from `useOpenTabs()`: a page that opens a record (a session, a
 * student) calls `open(parentId, record)`, and the record shows here as a tab
 * under its row. A tab is selected while its row is the current page
 * (`activeTabId`); elsewhere the page's own row is. Pressing a tab selects it
 * and calls `onOpenTabSelect(tab)`, which is where an app goes to the record's
 * route if it is not already there. Signing out clears the tabs. Nothing here
 * changes the URL.
 */
const Sidebar = ({
    user = 'tutor',
    account,
    modulesLeft = 0,
    lessonsLeft = 0,
    badges,
    onHomeClick,
    onTabClick,
    onOpenTabSelect,
    onProfile,
    onSignOut,
    helpHref,
    activeTabId,
    slackUrl,
    label = 'Main',
    visible = true,
    className = '',
    style,
}) => {
    const openTabs = useOpenTabs();
    if (!visible) return null;

    const page = activeTabId || 'home';
    const selectedTab = openTabs.tabs.find((tab) => tab.id === openTabs.selectedId);
    const activeId = selectedTab && selectedTab.parentId === page ? selectedTab.id : page;

    const tabs = Object.fromEntries(Object.entries(openTabs.byParent).map(([parentId, list]) => [
        parentId,
        list.map((tab) => ({ ...tab, label: tab.title, live: tab.status === 'live' })),
    ]));

    const handleSelect = (id) => {
        openTabs.select(id);
        if (id === 'home' && onHomeClick) {
            onHomeClick();
            return;
        }
        onTabClick?.(id);
    };

    return (
        <PatternSidebar
            className={['plus-sidebar', className].filter(Boolean).join(' ')}
            style={style}
            groups={sidebarGroups(user, { slackUrl, badges })}
            activeId={activeId}
            onSelect={handleSelect}
            tabs={tabs}
            onSelectTab={(tab) => {
                openTabs.select(tab.id);
                onOpenTabSelect?.(tab);
            }}
            onCloseTab={(tab) => openTabs.close(tab.id)}
            onCloseAllTabs={(item) => openTabs.closeAll(item.id)}
            modulesLeft={user === 'tutor' ? modulesLeft : 0}
            lessonsLeft={user === 'tutor' ? lessonsLeft : 0}
            account={account}
            onProfile={onProfile}
            onSignOut={() => {
                clearOpenTabs();
                onSignOut?.();
            }}
            helpHref={helpHref}
            onHome={() => handleSelect('home')}
            label={label}
        />
    );
};

Sidebar.propTypes = {
    user: PropTypes.oneOf(['tutor', 'supervisor']),
    /** The signed-in person: name, preferred name, one-word role, and an id that keys their remembered sections */
    account: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string.isRequired,
        preferredName: PropTypes.string,
        /** Tutor, Lead or Admin; the pattern holds the list (`ACCOUNT_ROLES`), read at render, since this file loads inside the pattern's own import cycle */
        role: PropTypes.string.isRequired,
    }),
    /** A tutor's onboarding modules left. Above 0 the Toolkit is locked; supervisors are never locked. */
    modulesLeft: PropTypes.number,
    /** A tutor's assigned lessons left; counted on the Lessons row */
    lessonsLeft: PropTypes.number,
    /** The trailing slot by row id: `{ compliance-monitor: { count: 3, countLabel: '3 open flags' }, lessons: { dot: true } }` */
    badges: PropTypes.objectOf(PropTypes.shape({
        count: PropTypes.number,
        countLabel: PropTypes.string,
        dot: PropTypes.bool,
        dotLabel: PropTypes.string,
    })),
    /** Home's press (the row and the logo); without it Home calls `onTabClick('home')` */
    onHomeClick: PropTypes.func,
    /** Called with the row id for every other row (external links excepted) */
    onTabClick: PropTypes.func,
    /** Called with the open tab (`{ id, parentId, recordId, title, href, status }`) when one is pressed */
    onOpenTabSelect: PropTypes.func,
    /** The account menu's Profile */
    onProfile: PropTypes.func,
    /** The account menu's Sign out, after the open tabs are cleared */
    onSignOut: PropTypes.func,
    /** Help Center, opened in a new tab */
    helpHref: PropTypes.string,
    /** Id of the row to show as selected (e.g. 'sessions', 'home') */
    activeTabId: PropTypes.string,
    /** Where Slack links; defaults to `SLACK_URL` */
    slackUrl: PropTypes.string,
    /** Accessible name of the navigation landmark */
    label: PropTypes.string,
    visible: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Sidebar;
