import React from 'react';
import Rating from '../../../../forms/Rating';

export default {
    title: 'Specs/Toolkit/Post-Session/Elements',
    parameters: {
        layout: 'padded',
    },
};

const ratingFeedback = [
    { id: 'form-rating-0', value: 0, commentsLabel: null },
    { id: 'form-rating-1', value: 1, commentsLabel: 'Difficult to navigate and understand.' },
    { id: 'form-rating-2', value: 2, commentsLabel: "Managed to use it, but it wasn't straightforward." },
    { id: 'form-rating-3', value: 3, commentsLabel: 'Fairly intuitive but some aspects could be clearer.' },
    { id: 'form-rating-4', value: 4, commentsLabel: 'Easy to use with a few minor unclear elements.' },
    { id: 'form-rating-5', value: 5, commentsLabel: 'Seamless and straightforward experience.' },
];

/**
 * Form Rating
 * Uses the shared Rating form component and renders each rating state
 * with matching form feedback comments.
 */
export const FormRating = () => (
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
