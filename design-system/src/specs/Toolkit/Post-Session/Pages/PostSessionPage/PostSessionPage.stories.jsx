import React from 'react';
import PostSessionPage from './PostSessionPage';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Pages/Post Session Page',
    component: PostSessionPage,
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

const sessionStateData = {
    default: {
        initialSessionData: defaultSessionData,
        initialSelectedStudents: ['Kiera Wintervale', 'Baxter Ellington'],
    },
    empty: {
        initialSessionData: { date: '', sessionOption: '', didNotHappen: false },
        initialSelectedStudents: [],
    },
    'did-not-happen': {
        initialSessionData: { ...defaultSessionData, didNotHappen: true },
        initialSelectedStudents: ['Kiera Wintervale', 'Baxter Ellington'],
    },
};

export const Default = {
    render: ({ state, ...rest }) => {
        const data = sessionStateData[state] || sessionStateData.default;
        return (
            <PostSessionPage
                key={state}
                initialStudents={defaultStudents}
                initialSessionData={data.initialSessionData}
                initialSelectedStudents={data.initialSelectedStudents}
                {...rest}
            />
        );
    },
    argTypes: {
        state: {
            control: 'radio',
            options: ['default', 'empty', 'did-not-happen'],
            name: 'Form state',
            table: { category: 'State' },
        },
    },
    args: {
        state: 'default',
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
