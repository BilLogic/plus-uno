import React from 'react';

import PatternSidebar from '@/patterns/Sidebar';

/**
 * The do and don't examples on the Sidebar docs page: the real Sidebar,
 * cut down to the groups each rule is about. Each is a picture, so it is
 * inert and hidden from assistive technology: the docs page gains no second
 * navigation landmark and no tab stops.
 */

const Box = ({ children }) => (
    <div className="plus-frame__sidebar plus-frame__sidebar--docked not-prose sb-unstyled" inert aria-hidden="true">
        {children}
    </div>
);

const sidebar = (props) => (
    <Box>
        <PatternSidebar storageKey={null} label="Example" onToggle={() => {}} {...props} />
    </Box>
);

const home = { id: 'home', items: [{ id: 'home', text: 'Home', icon: 'fa-regular fa-house' }] };
const training = {
    id: 'training',
    title: 'Training',
    items: [
        { id: 'lessons', text: 'Lessons', icon: 'fa-regular fa-lightbulb', training: 'lessons' },
        { id: 'onboarding', text: 'Onboarding', icon: 'fa-regular fa-compass', training: 'modules' },
    ],
};
const toolkit = (sessions = 'Sessions', students = 'Students') => ({
    id: 'toolkit',
    title: 'Toolkit',
    lockedDuringOnboarding: true,
    items: [
        { id: 'sessions', text: sessions, icon: 'fa-regular fa-calendar' },
        { id: 'students', text: students, icon: 'fa-regular fa-user' },
    ],
});

/** Do: each row names its area in a word. */
export const NamesDo = () => sidebar({ groups: [home, toolkit()], activeId: 'sessions' });

/** Don't: each row is a sentence, and the labels truncate. */
export const NamesDont = () => sidebar({
    groups: [home, toolkit('All of my tutoring sessions this term', 'Every student I am assigned to')],
    activeId: 'sessions',
});

/** Do: mid-onboarding, the Toolkit shows, locked. */
export const LockDo = () => sidebar({ groups: [home, training, toolkit()], modulesLeft: 3, activeId: 'onboarding' });

/** Don't: mid-onboarding, the Toolkit is left out, so the tutor cannot see what training unlocks. */
export const LockDont = () => sidebar({ groups: [home, training], modulesLeft: 3, activeId: 'onboarding' });

const tab = (label, tooltip) => ({ id: `t-${label}`, label, tooltip });

/** Do: a tab names the session by its time and the teacher; the school is in its tooltip. */
export const TabLabelDo = () => sidebar({
    groups: [home, toolkit()],
    activeId: 'home',
    tabs: { sessions: [tab('4:00 pm · Ms. Ortiz', 'Hillside · Ms. Ortiz'), tab('5:30 pm · Mr. Patel', 'Roosevelt · Mr. Patel')] },
});

/** Don't: a tab carries everything, and the time it is found by is cut off. */
export const TabLabelDont = () => sidebar({
    groups: [home, toolkit()],
    activeId: 'home',
    tabs: {
        sessions: [
            tab('Session at Hillside with Ms. Ortiz, 4:00 pm', 'Hillside · Ms. Ortiz'),
            tab('Session at Roosevelt with Mr. Patel, 5:30 pm', 'Roosevelt · Mr. Patel'),
        ],
    },
});
