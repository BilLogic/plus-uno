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

export const HOME_ITEMS = [{ id: 'home', text: 'Home', icon: 'house' }];

export const NAV_SECTIONS = [
    {
        id: 'training',
        title: 'Training',
        items: [
            { id: 'lessons', text: 'Lessons', icon: 'book-open' },
            { id: 'onboarding', text: 'Onboarding', icon: 'graduation-cap' },
        ],
    },
    {
        id: 'toolkit',
        title: 'Toolkit',
        items: [
            { id: 'sessions', text: 'Sessions', icon: 'calendar-days' },
            { id: 'students', text: 'Students', icon: 'user-group' },
            { id: 'reviews', text: 'Reviews', icon: 'chart-simple' },
            { id: 'slack', text: 'Slack', icon: 'message', href: SLACK_URL, external: true },
        ],
    },
];
