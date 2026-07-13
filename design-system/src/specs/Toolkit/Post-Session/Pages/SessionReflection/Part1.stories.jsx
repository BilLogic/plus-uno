import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SessionReflectionPart1 from './Part1';
import SessionReflectionPart2 from './Part2';
import SessionReflectionPart3 from './Part3';
import SessionReflectionPart4 from './Part4';

const BreakpointPreview = ({ Component, args }) => (
    // Width/breakpoint + height come from the global Breakpoint toolbar (ResponsiveFrame decorator).
    <div style={{ height: '100%', width: '100%', overflow: 'hidden', borderRadius: 'var(--size-card-radius-sm)' }}>
        <Component {...args} />
    </div>
);

BreakpointPreview.propTypes = {
    Component: PropTypes.elementType.isRequired,
    args: PropTypes.object,
};

BreakpointPreview.defaultProps = {
    args: {},
};

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Session Reflection',
    component: SessionReflectionPart1,
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
};

export const Part1 = {
    render: (args) => <BreakpointPreview Component={SessionReflectionPart1} args={args} />,
    args: {
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'session-reflection',
        initialRating: 0,
    },
};

export const Part2 = {
    render: (args) => <BreakpointPreview Component={SessionReflectionPart2} args={args} />,
    args: {
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'session-reflection',
        initialRating: 3,
        initialSelectedAreas: ['technical-difficulties'],
        initialSupportText: '',
    },
};

export const Part3 = {
    render: (args) => <BreakpointPreview Component={SessionReflectionPart3} args={args} />,
    args: {
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'session-reflection',
        initialRating: 3,
        initialSelectedAreas: ['technical-difficulties'],
        initialSelectedTechDifficulties: ['whiteboard-feature'],
        initialSupportText: '',
    },
};

export const Part4 = {
    render: (args) => <BreakpointPreview Component={SessionReflectionPart4} args={args} />,
    args: {
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'session-reflection',
        initialRating: 5,
        initialSelectedAreas: ['time-management'],
        initialSelectedTechDifficulties: ['breakout-rooms'],
        initialSupportText: '',
    },
};
