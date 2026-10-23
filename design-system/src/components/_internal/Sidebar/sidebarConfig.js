/**
 * The PLUS sidebar's content: one config for both roles.
 *
 * It follows the Specs Sidebar (Web App Specs, node 111:227891), plus Students
 * under Toolkit from the Toolkit Information Architecture PRD. A section with
 * `roles` shows only to those roles; every other section shows to everyone.
 *
 * Two items are in code but not in Specs. They are marked `notInSpecs` and
 * hidden unless the caller sets `showItemsNotInSpecs`:
 * - Toolkit › Reviews. The demo walkthrough reaches Monthly Reports only
 *   through it, so the demo keeps it on.
 * - Admin › Compliance. Its live-app page (/admin/tutors/warnings) is also in
 *   the live app's page index.
 */

/** Where the Toolkit › Slack link goes. A placeholder until PLUS names its workspace URL. */
export const SLACK_URL = 'https://slack.com/';

/** @typedef {'tutor' | 'supervisor'} SidebarUser */

export const SIDEBAR_HOME = { id: 'home', text: 'Home', icon: 'house' };

export const SIDEBAR_SECTIONS = [
    {
        id: 'training',
        title: 'Training',
        items: [
            { id: 'lessons', text: 'Lessons', icon: 'book-open' },
            { id: 'onboarding', text: 'Onboarding', icon: 'clipboard' },
        ],
    },
    {
        id: 'toolkit',
        title: 'Toolkit',
        items: [
            { id: 'sessions', text: 'Sessions', icon: 'calendar-alt' },
            { id: 'toolkit-students', text: 'Students', icon: 'user-graduate' },
            { id: 'reviews', text: 'Reviews', icon: 'chart-bar', notInSpecs: true },
            { id: 'slack', text: 'Slack', icon: 'arrow-up-right-from-square', href: SLACK_URL, external: true },
        ],
    },
    {
        id: 'admin',
        title: 'Admin',
        roles: ['supervisor'],
        items: [
            { id: 'tutors', text: 'Tutors', icon: 'chart-pie' },
            { id: 'admin-sessions', text: 'Sessions', icon: 'calendar-week' },
            { id: 'students', text: 'Students', icon: 'users' },
            { id: 'groups', text: 'Groups', icon: 'users-rectangle' },
            { id: 'compliance-monitor', text: 'Compliance', icon: 'clipboard-check', notInSpecs: true },
        ],
    },
];

/**
 * The items and sections one role sees, ready for `PatternSidebar`.
 *
 * @param {SidebarUser} user
 * @param {{ showItemsNotInSpecs?: boolean, slackUrl?: string }} [options]
 */
export function sidebarContent(user, { showItemsNotInSpecs = false, slackUrl = SLACK_URL } = {}) {
    const keep = (item) => showItemsNotInSpecs || !item.notInSpecs;
    // eslint-disable-next-line no-unused-vars
    const shape = ({ notInSpecs, ...item }) => (item.id === 'slack' ? { ...item, href: slackUrl } : item);
    return {
        items: [SIDEBAR_HOME],
        sections: SIDEBAR_SECTIONS
            .filter((section) => !section.roles || section.roles.includes(user))
            // eslint-disable-next-line no-unused-vars
            .map(({ roles, ...section }) => ({ ...section, items: section.items.filter(keep).map(shape) })),
    };
}
