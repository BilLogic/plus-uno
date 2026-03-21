import React from 'react';
import Rating from '../../../../forms/Rating';

export default {
    title: 'Specs/Toolkit/Post-Session/Elements',
    parameters: {
        layout: 'padded',
    },
};

const ratingFeedback = [
    { id: 'self-rating-0', value: 0, commentsLabel: null },
    { id: 'self-rating-1', value: 1, commentsLabel: 'I have a lot to improve on.' },
    { id: 'self-rating-2', value: 2, commentsLabel: 'Not so well, there are things I should adjust.' },
    { id: 'self-rating-3', value: 3, commentsLabel: "Okay, I could've done better." },
    { id: 'self-rating-4', value: 4, commentsLabel: 'Good, with some room for improvement.' },
    { id: 'self-rating-5', value: 5, commentsLabel: 'Excellent performance!' },
];

/**
 * Self Rating
 * Uses the shared Rating form component and renders each rating state
 * with matching self-feedback comments.
 */
export const SelfRating = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-lg)',
        }}
    >
        {ratingFeedback.map(({ id, value, commentsLabel }) => (
            <Rating
                key={id}
                id={id}
                value={value}
                variant="comments"
                showCommentsLabel={Boolean(commentsLabel)}
                commentsLabel={commentsLabel}
            />
        ))}
    </div>
);
