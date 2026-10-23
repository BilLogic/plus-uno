import React from 'react';
import PropTypes from 'prop-types';
import Logo from '@/components/_internal/Logo';
// The pattern's own folder, not the patterns barrel: the components barrel loads
// this file, and pulling every pattern (and its stylesheet) in here would
// reorder the cascade for every component that loads after it.
import PatternSidebar, { useOpenTabs } from '@/patterns/Sidebar';
import { sidebarContent } from './sidebarConfig';

/**
 * The PLUS sidebar: the foundation Sidebar pattern (`@/patterns`) with the
 * logo in its header and the Specs item list for the role (`sidebarConfig.js`).
 * Figma Specs: node 111:227891; BS4 Foundation `_Sidebar`.
 *
 * Both roles come from one config. Home is selected when nothing else is.
 *
 * Open tabs come from `useOpenTabs()`: a page that opens a record (a session, a
 * student) calls `open(parentId, record)`, and the record shows here as a tab
 * under that item. A tab is selected while its parent is the current page
 * (`activeTabId`); elsewhere the page's own item is. Pressing a tab selects it
 * and calls `onOpenTabSelect(tab)`, which is where an app goes to the record's
 * route if it is not already there. Nothing here changes the URL.
 */
const Sidebar = ({
    user = 'tutor',
    onHomeClick,
    onTabClick,
    onOpenTabSelect,
    /** When set, the tab with this id is shown as selected (anchored). e.g. 'sessions' for Sessions page */
    activeTabId,
    showItemsNotInSpecs = false,
    slackUrl,
    label = 'Main',
    visible = true,
    className = '',
    style,
}) => {
    const openTabs = useOpenTabs();
    if (!visible) return null;

    const { items, sections } = sidebarContent(user, { showItemsNotInSpecs, slackUrl });

    const page = activeTabId || 'home';
    const selectedTab = openTabs.tabs.find((tab) => tab.id === openTabs.selectedId);
    const activeId = selectedTab && selectedTab.parentId === page ? selectedTab.id : page;

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
            header={<Logo style="colored" size="XS" text={true} className="p-0" />}
            items={items}
            sections={sections}
            activeId={activeId}
            onSelect={handleSelect}
            openTabs={openTabs.byParent}
            onTabSelect={(tab) => {
                openTabs.select(tab.id);
                onOpenTabSelect?.(tab);
            }}
            onTabClose={(tab) => openTabs.close(tab.id)}
            onTabsCloseAll={(item) => openTabs.closeAll(item.id)}
            label={label}
        />
    );
};

Sidebar.propTypes = {
    user: PropTypes.oneOf(['tutor', 'supervisor']),
    /** Home's press; without it Home calls `onTabClick('home')` */
    onHomeClick: PropTypes.func,
    /** Called with the item id for every other item (external links excepted) */
    onTabClick: PropTypes.func,
    /** Called with the open tab (`{ id, parentId, recordId, title, href, status }`) when one is pressed */
    onOpenTabSelect: PropTypes.func,
    /** Id of the tab to show as selected (e.g. 'sessions', 'home') */
    activeTabId: PropTypes.string,
    /** Also show the code-only items that are not in Specs: Toolkit › Reviews and Admin › Compliance */
    showItemsNotInSpecs: PropTypes.bool,
    /** Where Toolkit › Slack links; defaults to `SLACK_URL` */
    slackUrl: PropTypes.string,
    /** Accessible name of the navigation landmark */
    label: PropTypes.string,
    visible: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Sidebar;
