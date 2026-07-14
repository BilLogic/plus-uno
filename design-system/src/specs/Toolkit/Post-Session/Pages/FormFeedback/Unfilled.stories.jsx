import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FormFeedbackUnfilled from './Unfilled';
import FormFeedbackFilled from './Filled';

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
    title: 'Specs/Toolkit/Post-Session/Pages/Form Feedback/Unfilled',
    component: FormFeedbackUnfilled,
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
};

/**
 * Form Feedback - Unfilled State
 * 
 * This page displays the form feedback form in an unfilled state.
 * Users can rate the reflection form's intuitiveness and provide feedback
 * about their reflection experience.
 */
export const Unfilled = {
    render: ({ state, ...rest }) => (
        <BreakpointPreview
            Component={state === 'filled' ? FormFeedbackFilled : FormFeedbackUnfilled}
            args={rest}
        />
    ),
    argTypes: {
        state: {
            control: 'radio',
            options: ['unfilled', 'filled'],
            name: 'Form state',
            table: { category: 'State' },
        },
    },
    args: {
        state: 'unfilled',
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'complete' },
        ],
        activeTab: 'form-feedback',
    },
};
