import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FormFeedbackFilled from './Filled';
import FormFeedbackUnfilled from './Unfilled';

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
    title: 'Specs/Toolkit/Post-Session/Pages/Form Feedback/Filled',
    component: FormFeedbackFilled,
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
};

/**
 * Form Feedback - Filled State
 * 
 * This page displays the form feedback form in a filled state.
 * Shows a completed rating (4 stars) with feedback comment and
 * filled textareas with example responses.
 */
export const Filled = {
    render: ({ state, ...rest }) => (
        <BreakpointPreview
            Component={state === 'unfilled' ? FormFeedbackUnfilled : FormFeedbackFilled}
            args={rest}
        />
    ),
    argTypes: {
        state: {
            control: 'radio',
            options: ['filled', 'unfilled'],
            name: 'Form state',
            table: { category: 'State' },
        },
    },
    args: {
        state: 'filled',
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'complete' },
        ],
        activeTab: 'form-feedback',
    },
};
