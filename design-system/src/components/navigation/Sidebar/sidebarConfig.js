/**
 * The PLUS sidebar's content: one config for both roles.
 *
 * Home and Slack, then Training, then the Toolkit, then Admin for
 * supervisors. Training comes before the Toolkit because it gates it: a tutor
 * mid-onboarding sees the Toolkit locked. Sessions and Students show in the
 * Toolkit and in Admin with different meanings: a tutor's own, and everyone's.
 * A group with `roles` shows only to those roles; every other group shows to
 * everyone.
 */

/** Where Slack links. A placeholder until PLUS names its workspace URL. */
export const SLACK_URL = 'https://slack.com/';

/** @typedef {'tutor' | 'supervisor'} SidebarUser */

export const SIDEBAR_GROUPS = [
    {
        id: 'home',
        items: [
            { id: 'home', text: 'Home', icon: 'house' },
            { id: 'slack', text: 'Slack', icon: 'fa-brands fa-slack', href: SLACK_URL, external: true },
        ],
    },
    {
        id: 'training',
        title: 'Training',
        items: [
            { id: 'lessons', text: 'Lessons', icon: 'lightbulb', training: 'lessons' },
            { id: 'onboarding', text: 'Onboarding', icon: 'compass', training: 'modules' },
        ],
    },
    {
        id: 'toolkit',
        title: 'Toolkit',
        lockedDuringOnboarding: true,
        items: [
            { id: 'sessions', text: 'Sessions', icon: 'calendar' },
            { id: 'toolkit-students', text: 'Students', icon: 'user' },
        ],
    },
    {
        id: 'admin',
        title: 'Admin',
        roles: ['supervisor'],
        items: [
            { id: 'compliance-monitor', text: 'Compliance', icon: 'flag' },
            { id: 'reflections', text: 'Reflections', icon: 'comment-dots' },
            { id: 'tutors', text: 'Tutors', icon: 'id-badge' },
            { id: 'admin-sessions', text: 'Sessions', icon: 'calendar-check' },
            { id: 'students', text: 'Students', icon: 'address-book' },
            { id: 'groups', text: 'Groups', icon: 'object-group' },
        ],
    },
];

/**
 * The groups one role sees, ready for `PatternSidebar`.
 *
 * Pass `groups` to add or override groups and rows by `id` while keeping the
 * role's navigation: matching group and item ids merge in place; new items and
 * groups append.
 *
 * @param {SidebarUser} user
 * @param {{ slackUrl?: string, countTags?: Record<string, { count?: number, countLabel?: string, dot?: boolean, dotLabel?: string }>, groups?: Array<{ id: string, title?: string, lockedDuringOnboarding?: boolean, items?: Array<object> }> }} [options]
 */
export function sidebarGroups(user, { slackUrl = SLACK_URL, countTags = {}, groups = [] } = {}) {
    const shape = (item) => ({
        ...item,
        ...(item.id === 'slack' ? { href: slackUrl } : {}),
        ...(countTags[item.id] ?? {}),
    });
    const merged = SIDEBAR_GROUPS
        .filter((group) => !group.roles || group.roles.includes(user))
        // eslint-disable-next-line no-unused-vars
        .map(({ roles, ...group }) => ({ ...group, items: [...group.items] }));

    for (const override of groups ?? []) {
        const target = merged.find((group) => group.id === override.id);
        if (target) {
            if (override.title !== undefined) target.title = override.title;
            if (override.lockedDuringOnboarding !== undefined) {
                target.lockedDuringOnboarding = override.lockedDuringOnboarding;
            }
            for (const item of override.items ?? []) {
                const index = target.items.findIndex((existing) => existing.id === item.id);
                if (index >= 0) target.items[index] = { ...target.items[index], ...item };
                else target.items.push(item);
            }
        } else {
            const known = SIDEBAR_GROUPS.find((group) => group.id === override.id);
            merged.push({
                ...(known?.title ? { title: known.title } : {}),
                ...override,
                items: [...(override.items ?? [])],
            });
        }
    }

    return merged.map((group) => ({ ...group, items: group.items.map(shape) }));
}
