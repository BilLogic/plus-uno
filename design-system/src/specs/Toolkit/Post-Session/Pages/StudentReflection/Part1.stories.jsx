import React, { useState } from 'react';
import StudentReflectionPart1 from './Part1';
import StudentReflectionPart2 from './Part2';
import StudentReflectionPart3 from './Part3';

const BreakpointPreview = ({ Component, args }) => (
    // Width/breakpoint + height come from the global Breakpoint toolbar (ResponsiveFrame decorator).
    <div style={{ height: '100%', width: '100%', overflow: 'hidden', borderRadius: 'var(--size-card-radius-sm)' }}>
        <Component {...args} />
    </div>
);

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Student Reflection',
    component: StudentReflectionPart1,
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
};

export const Part1 = {
    render: (args) => <BreakpointPreview Component={StudentReflectionPart1} args={args} />,
    args: {
        studentName: 'Kiera Wintervale',
        students: [
            { name: 'Kiera Wintervale', status: 'incomplete' },
            { name: 'Baxter Ellington', status: 'incomplete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'student-0',
    },
};

export const Part2 = {
    render: (args) => <BreakpointPreview Component={StudentReflectionPart2} args={args} />,
    args: {
        studentName: 'Kiera Wintervale',
        students: [
            { name: 'Kiera Wintervale', status: 'incomplete' },
            { name: 'Baxter Ellington', status: 'incomplete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'student-0',
        initialRating: 4,
    },
};

export const Part3 = {
    render: (args) => <BreakpointPreview Component={StudentReflectionPart3} args={args} />,
    args: {
        studentName: 'Milo Thorne',
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'student-2',
        initialRating: 3,
    },
};
