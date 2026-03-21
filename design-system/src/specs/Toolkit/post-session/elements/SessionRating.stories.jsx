import React from 'react';
import Rating from '../../../../forms/Rating';

export default {
    title: 'Specs/Toolkit/Post-Session/Elements',
    parameters: {
        layout: 'padded',
    },
};

const ratingFeedback = [
    { id: 'session-rating-0', value: 0, commentsLabel: null },
    { id: 'session-rating-1', value: 1, commentsLabel: 'Lots of room for improvement.' },
    { id: 'session-rating-2', value: 2, commentsLabel: 'Not so well, adjustments are needed.' },
    { id: 'session-rating-3', value: 3, commentsLabel: "Okay, could've gone better." },
    { id: 'session-rating-4', value: 4, commentsLabel: 'Good, with some room for improvement.' },
    { id: 'session-rating-5', value: 5, commentsLabel: 'Excellent session!' },
];

export const SessionRatingField = ({ id, value = 0, commentsLabel = null, onChange }) => (
    <Rating
        id={id}
        value={value}
        onChange={onChange}
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
export const SessionRating = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-lg)',
        }}
    >
        {ratingFeedback.map(({ id, value, commentsLabel }) => (
            <SessionRatingField
                key={id}
                id={id}
                value={value}
                commentsLabel={commentsLabel}
            />
        ))}
    </div>
);
