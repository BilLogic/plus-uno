/**
 * The one mock-data module for the tutor revamp. Every screen reads from here
 * so they agree: today is Mon, Jan 22, 2024, and the tutor is Boyuan Guo.
 */

import growthMindsetImage from '../../../home-redesign/src/assets/supporting-growth-mindset.png';

export const TODAY = {
    iso: '2024-01-22',
    long: 'Monday, January 22',
    weekday: 'Mon, Jan 22, 2024',
    greeting: 'Good afternoon',
};

export const TUTOR = {
    name: 'Boyuan Guo',
    firstName: 'Boyuan',
    role: 'Tutor',
};

export const LEAD_TUTOR = { name: 'Priya Shah', initials: 'PS' };

/** Avatar tones come from the accent families; each student keeps one everywhere. */
export const STUDENTS = [
    {
        id: 'arlene-mccoy',
        name: 'Arlene McCoy',
        initials: 'AM',
        tone: 'blue',
        focus: { label: 'Motivation support', style: 'warning' },
        /** Practice minutes a day, last 7 sessions, oldest first */
        practice: [13, 16, 19, 18, 21, 12, 9],
    },
    {
        id: 'morgan-reed',
        name: 'Morgan Reed',
        initials: 'MR',
        tone: 'purple',
        focus: { label: 'Content support', style: 'warning' },
        practice: [6, 5, 8, 6, 5, 6, 6],
    },
    {
        id: 'taylor-brooks',
        name: 'Taylor Brooks',
        initials: 'TB',
        tone: 'yellow',
        focus: { label: 'On track', style: 'success' },
        practice: [8, 9, 9, 11, 12, 12, 13],
    },
    {
        id: 'casey-jordan',
        name: 'Casey Jordan',
        initials: 'CJ',
        tone: 'green',
        focus: { label: 'On track', style: 'success' },
        practice: [11, 9, 11, 12, 11, 12, 11],
    },
];

export const studentById = (id) => STUDENTS.find((s) => s.id === id);

/** Math 7: the class the tutor runs today. */
export const MATH_7 = {
    id: 'math-7-jan-22',
    title: 'Math 7',
    tabTitle: 'Math 7, today 1:00 pm',
    school: 'Lincoln Middle School',
    teacher: 'Ms. Rivera',
    schedule: 'Mon and Thu 1:00–2:00 pm',
    start: '1:00 pm',
    end: '2:00 pm',
    startsIn: 'Starts in 25 min',
    joinOpensAt: '12:45 pm',
    studentIds: STUDENTS.map((s) => s.id),
    prep: [
        {
            id: 'celebrate',
            label: 'Celebrate Arlene’s fractions streak',
            why: 'She’s at 92%, close to her 95% target. Name it before new work.',
            done: true,
        },
        {
            id: 'warm-up',
            label: 'Warm up on unlike denominators',
            why: 'Morgan missed 3 of 4 tries last session. Five minutes is enough.',
            done: false,
        },
        {
            id: 'explain',
            label: 'Ask Taylor to explain one step out loud',
            why: 'From the lesson Prompting Students to Explain.',
            done: false,
        },
    ],
};

/** Algebra I, Thu Jan 18: the session whose reflection is overdue. */
export const ALGEBRA_1 = {
    id: 'algebra-1-jan-18',
    title: 'Algebra I',
    tabTitle: 'Algebra I, Thu, Jan 18',
    date: 'Thu, Jan 18, 2024',
    shortDate: 'Thu, Jan 18',
    time: '9:00–10:00 am',
    school: 'Maplewood Middle School',
    teacher: 'Mr. Patel',
    reflection: 'Draft saved',
};

export const SESSIONS = [MATH_7, ALGEBRA_1];

/** Today's agenda, in order. */
export const AGENDA = [
    { id: 'lesson', time: '11:30', title: 'Lesson: Reacting to Errors', state: 'done', to: '/lessons/reacting-to-errors' },
    { id: 'math-7', time: '1:00', title: 'Math 7', state: 'now', status: 'In 25 min', to: `/sessions/${MATH_7.id}` },
    { id: 'reflect', time: '2:00', title: 'Reflect on Math 7', state: 'upcoming', to: `/sessions/${MATH_7.id}/after` },
    { id: 'geometry', time: '4:00', title: 'Geometry', state: 'upcoming', to: '/sessions' },
];

export const PAID_HOURS = { value: 16.8, target: 20, caption: 'Includes prep and training' };

export const LESSONS = [
    {
        id: 'supporting-a-growth-mindset',
        title: 'Supporting a Growth Mindset',
        area: 'socio-emotional',
        duration: '12 min',
        stepsDone: 4,
        steps: 9,
        image: growthMindsetImage,
    },
];

export const PICKED_LESSON = LESSONS[0];

/** The records the sidebar shows as open tabs on first load, most recent first. */
export const INITIAL_OPEN_TABS = [
    { parentId: 'students', record: { id: 'arlene-mccoy', title: 'Arlene McCoy' } },
    { parentId: 'sessions', record: { id: ALGEBRA_1.id, title: ALGEBRA_1.tabTitle } },
    { parentId: 'sessions', record: { id: MATH_7.id, title: MATH_7.tabTitle } },
];
