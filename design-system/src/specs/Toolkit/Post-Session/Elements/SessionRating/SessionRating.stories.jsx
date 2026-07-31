import React, { useState } from 'react';
import SessionRating from './SessionRating';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Session Rating',
    parameters: {
        layout: 'padded',
    },
};

/** @deprecated Prefer default import of SessionRating.jsx */
export const SessionRatingField = SessionRating;

/**
 * Session Rating
 * Uses the Session Rating Element (Foundations Rating + session comment copy).
 */
export const Overview = {
    args: { value: 0 },
    argTypes: { value: { control: { type: 'range', min: 0, max: 5, step: 1 } } },
    /** Renders a controllable Session Rating field. */
    render: function SessionRatingPlayground(args) {
        const [value, setValue] = useState(args.value);
        return <SessionRating id="session-rating" value={value} onChange={setValue} />;
    },
};
