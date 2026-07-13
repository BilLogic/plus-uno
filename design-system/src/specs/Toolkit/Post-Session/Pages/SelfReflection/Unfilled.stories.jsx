import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SelfReflectionUnfilled from './Unfilled';

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
    title: 'Specs/Toolkit/Post-Session/Pages/Self Reflection/Unfilled',
    component: SelfReflectionUnfilled,
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
};

/**
 * Self Reflection - Unfilled State
 * 
 * This page displays the self reflection form in an unfilled state.
 * Users can rate their own performance during the session.
 */
export const Unfilled = {
    render: (args) => <BreakpointPreview Component={SelfReflectionUnfilled} args={args} />,
    args: {
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'complete' },
        ],
        activeTab: 'self-reflection',
    },
};









