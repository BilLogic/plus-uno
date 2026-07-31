import React, { useState } from 'react';
import Rating from '@/components/forms-and-inputs/Rating';
import { SESSION_RATING_COMMENTS } from '@/specs/Toolkit/Post-Session/reflectionCopy';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Session Rating',
    parameters: {
        layout: 'padded',
    },
};

export const SessionRatingField = ({ id, value = 0, commentsLabel = null, onChange }) => (
    <Rating
        id={id}
        value={value}
        onChange={onChange}
        icon="thumbs-up"
        variant="comments"
        showCommentsLabel={Boolean(commentsLabel)}
        commentsLabel={commentsLabel}
    />
);

/**
 * Session Rating
 * Uses the shared Rating form component and renders each rating state
 * with its matching feedback as the comments label.
 */
export const SessionRating = {
    args: { value: 0 },
    argTypes: { value: { control: { type: 'range', min: 0, max: 5, step: 1 } } },
    /** Renders a controllable Session Rating field. */
    render: function SessionRatingPlayground(args) {
        const [value, setValue] = useState(args.value);
        return <SessionRatingField id="session-rating" value={value} onChange={setValue} commentsLabel={SESSION_RATING_COMMENTS[value]} />;
    },
};
