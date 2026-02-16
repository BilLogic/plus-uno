import React from 'react';
import Page1 from './Page1';

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/1 Learnings',
    component: Page1,
    parameters: {
        layout: 'fullscreen',
    },
    argTypes: {
        onSave: { action: 'saved' },
    },
};

const defaultStudents = [
    { name: 'Kiera Wintervale', status: 'incomplete', data: {} },
    { name: 'Baxter Ellington', status: 'incomplete', data: {} },
];

const defaultSessionData = {
    date: '2023-10-27',
    sessionOption: 'math_tutoring',
    didNotHappen: false,
};

export const Default = {
    args: {
        initialSessionData: defaultSessionData,
        initialStudents: defaultStudents,
        initialSelectedStudents: ['Kiera Wintervale', 'Baxter Ellington'],
    },
};

export const EmptyState = {
    args: {
        initialSessionData: {
            date: '',
            sessionOption: '',
            didNotHappen: false,
        },
        initialStudents: defaultStudents,
        initialSelectedStudents: [],
    },
};

export const SessionDidNotHappen = {
    args: {
        initialSessionData: { ...defaultSessionData, didNotHappen: true },
        initialStudents: defaultStudents,
        initialSelectedStudents: ['Kiera Wintervale', 'Baxter Ellington'],
    },
};
