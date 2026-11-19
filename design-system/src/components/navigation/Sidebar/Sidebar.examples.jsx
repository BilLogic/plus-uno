import React, { useState } from 'react';

import Sidebar from './Sidebar';

/**
 * The do and don't examples on the Sidebar docs page: the real, live Sidebar,
 * cut down to the groups each rule is about. Each uses a distinct navigation
 * landmark label so multiple examples on one page remain unambiguous.
 */

const Box = ({ children }) => (
    <div className="plus-frame__sidebar plus-frame__sidebar--docked not-prose sb-unstyled">
        {children}
    </div>
);

const InteractiveSidebar = ({ activeId: initialActiveId, tabs: initialTabs, ...props }) => {
    const [activeId, setActiveId] = useState(initialActiveId);
    const [tabs, setTabs] = useState(initialTabs);

    const handleCloseTab = (closedTab, item) => {
        if (!tabs) return;
        setTabs((current) => {
            const list = current[item.id] ?? [];
            return { ...current, [item.id]: list.filter((entry) => entry.id !== closedTab.id) };
        });
        if (activeId === closedTab.id) setActiveId(item.id);
    };

    const handleCloseAllTabs = (item) => {
        if (!tabs) return;
        const closingIds = new Set((tabs[item.id] ?? []).map((entry) => entry.id));
        setTabs((current) => ({ ...current, [item.id]: [] }));
        if (closingIds.has(activeId)) setActiveId(item.id);
    };

    return (
        <Box>
            <Sidebar
                storageKey={null}
                onToggle={() => {}}
                {...props}
                activeId={activeId}
                onSelect={(id) => setActiveId(id)}
                onHome={() => setActiveId('home')}
                tabs={tabs}
                onSelectTab={(tab) => setActiveId(tab.id)}
                onCloseTab={tabs ? handleCloseTab : undefined}
                onCloseAllTabs={tabs ? handleCloseAllTabs : undefined}
            />
        </Box>
    );
};

const home = { id: 'home', items: [{ id: 'home', text: 'Home', icon: 'house' }] };
const training = {
    id: 'training',
    title: 'Training',
    items: [
        { id: 'lessons', text: 'Lessons', icon: 'lightbulb', training: 'lessons' },
        { id: 'onboarding', text: 'Onboarding', icon: 'compass', training: 'modules' },
    ],
};
const toolkit = (sessions = 'Sessions', students = 'Students') => ({
    id: 'toolkit',
    title: 'Toolkit',
    lockedDuringOnboarding: true,
    items: [
        { id: 'sessions', text: sessions, icon: 'calendar' },
        { id: 'students', text: students, icon: 'user' },
    ],
});

/** Do: each row names its area in a word. */
export const NamesDo = ({ label = 'Area names — do' } = {}) => (
    <InteractiveSidebar label={label} groups={[home, toolkit()]} activeId="sessions" />
);

/** Don't: each row is a sentence, and the labels truncate. */
export const NamesDont = ({ label = "Area names — don't" } = {}) => (
    <InteractiveSidebar
        label={label}
        groups={[home, toolkit('All of my tutoring sessions this term', 'Every student I am assigned to')]}
        activeId="sessions"
    />
);

/** Do: mid-onboarding, the Toolkit shows, locked. */
export const LockDo = ({ label = 'Locked toolkit — do' } = {}) => (
    <InteractiveSidebar label={label} groups={[home, training, toolkit()]} modulesLeft={3} activeId="onboarding" />
);

/** Don't: mid-onboarding, the Toolkit is left out, so the tutor cannot see what training unlocks. */
export const LockDont = ({ label = "Locked toolkit — don't" } = {}) => (
    <InteractiveSidebar label={label} groups={[home, training]} modulesLeft={3} activeId="onboarding" />
);

const tab = (label, tooltip) => ({ id: `t-${label}`, label, tooltip });

/** Do: a tab names the session by its time and the teacher; the school is in its tooltip. */
export const TabLabelDo = ({ label = 'Open item labels — do' } = {}) => (
    <InteractiveSidebar
        label={label}
        groups={[home, toolkit()]}
        activeId="home"
        tabs={{ sessions: [tab('4:00 PM · Ms. Ortiz', 'Hillside · Ms. Ortiz'), tab('5:30 PM · Mr. Patel', 'Roosevelt · Mr. Patel')] }}
    />
);

/** Don't: a tab carries everything, and the time it is found by is cut off. */
export const TabLabelDont = ({ label = "Open item labels — don't" } = {}) => (
    <InteractiveSidebar
        label={label}
        groups={[home, toolkit()]}
        activeId="home"
        tabs={{
            sessions: [
                tab('Session at Hillside with Ms. Ortiz, 4:00 PM', 'Hillside · Ms. Ortiz'),
                tab('Session at Roosevelt with Mr. Patel, 5:30 PM', 'Roosevelt · Mr. Patel'),
            ],
        }}
    />
);
