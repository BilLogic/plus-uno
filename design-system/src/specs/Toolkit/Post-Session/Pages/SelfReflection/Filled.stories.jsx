import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SelfReflectionFilled from './Filled';

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
    title: 'Specs/Toolkit/Post-Session/Pages/Self Reflection/Filled',
    component: SelfReflectionFilled,
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
};

export const Filled = {
    render: (args) => <BreakpointPreview Component={SelfReflectionFilled} args={args} />,
    args: {
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'complete' },
        ],
        activeTab: 'self-reflection',
    },
};









