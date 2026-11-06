/**
 * The sidebar's rows and each row's route. Which rows a tutor sees is this
 * config; the sidebar draws whatever it is given.
 */

export const ROUTES = {
    home: '/',
    lessons: '/lessons',
    onboarding: '/onboarding',
    sessions: '/sessions',
    students: '/students',
    reviews: '/reviews',
};

/** A record's own route: an opened session or student. */
export const recordPath = (parentId, recordId) => `${ROUTES[parentId]}/${recordId}`;

export const SLACK_URL = 'https://slack.com/';

/** The sidebar's groups: Home and Slack, then Training, then the Toolkit. */
export const NAV_GROUPS = [
    {
        id: 'home',
        items: [
            { id: 'home', text: 'Home', icon: 'fa-regular fa-house' },
            { id: 'slack', text: 'Slack', icon: 'fa-brands fa-slack', href: SLACK_URL, external: true },
        ],
    },
    {
        id: 'training',
        title: 'Training',
        items: [
            { id: 'lessons', text: 'Lessons', icon: 'fa-regular fa-lightbulb' },
            { id: 'onboarding', text: 'Onboarding', icon: 'fa-regular fa-compass' },
        ],
    },
    {
        id: 'toolkit',
        title: 'Toolkit',
        items: [
            { id: 'sessions', text: 'Sessions', icon: 'fa-regular fa-calendar' },
            { id: 'students', text: 'Students', icon: 'fa-regular fa-user' },
            { id: 'reviews', text: 'Reviews', icon: 'fa-regular fa-chart-bar' },
        ],
    },
];
