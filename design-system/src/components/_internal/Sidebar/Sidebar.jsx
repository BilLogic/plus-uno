import React from 'react';
import PropTypes from 'prop-types';
import Logo from '@/components/_internal/Logo';
import { PatternSidebar } from '@/patterns';
import { sidebarContent } from './sidebarConfig';

/**
 * The PLUS sidebar: the foundation Sidebar pattern (`@/patterns`) with the
 * logo in its header and the Specs item list for the role (`sidebarConfig.js`).
 * Figma Specs: node 111:227891; BS4 Foundation `_Sidebar`.
 *
 * Both roles come from one config. Home is selected when nothing else is.
 */
const Sidebar = ({
    user = 'tutor',
    onHomeClick,
    onTabClick,
    /** When set, the tab with this id is shown as selected (anchored). e.g. 'sessions' for Sessions page */
    activeTabId,
    showItemsNotInSpecs = false,
    slackUrl,
    label = 'Main',
    visible = true,
    className = '',
    style,
}) => {
    if (!visible) return null;

    const { items, sections } = sidebarContent(user, { showItemsNotInSpecs, slackUrl });

    const handleSelect = (id) => {
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
            activeId={activeTabId || 'home'}
            onSelect={handleSelect}
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
