import React from 'react';
import Rating from '../../../../forms/Rating';

export default {
    title: 'Specs/Toolkit/Post-Session/Elements',
    parameters: {
        layout: 'padded',
    },
};

const studentRatingFeedback = [
    { id: 'student-rating-0', value: 0, commentsLabel: null },
    { id: 'student-rating-1', value: 1, commentsLabel: 'Lots of room for improvement.' },
    { id: 'student-rating-2', value: 2, commentsLabel: 'Not so well, adjustments are needed.' },
    { id: 'student-rating-3', value: 3, commentsLabel: "Ok, could've been better." },
    { id: 'student-rating-4', value: 4, commentsLabel: 'Good, with some room for improvement' },
    { id: 'student-rating-5', value: 5, commentsLabel: 'Wonderful interactions!' },
];

export const StudentRatingField = ({ id, value = 0, commentsLabel = null, onChange }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-sm)',
        }}
    >
        <Rating
            id={id}
            value={value}
            onChange={onChange}
            variant="comments"
            showCommentsLabel={Boolean(commentsLabel)}
            commentsLabel={commentsLabel}
        />
    </div>
);

/**
 * Student Rating Component
 * Displays rating states with corresponding feedback comments.
 * 
 * Rating States:
 * - 0 stars: No selection (no comment)
 * - 1 star: "Lots of room for improvement."
 * - 2 stars: "Not so well, adjustments are needed."
 * - 3 stars: "Ok, could've been better."
 * - 4 stars: "Good, with some room for improvement"
 * - 5 stars: "Wonderful interactions!"
 * 
 * Tokens:
 * - Gap: --size-element-gap-lg
 * - Typography: body2-txt (comments)
 * - Color: --color-on-surface
 */
export const StudentRating = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-lg)',
            maxWidth: '400px',
        }}
    >
        {studentRatingFeedback.map(({ id, value, commentsLabel }) => (
            <StudentRatingField
                key={id}
                id={id}
                value={value}
                commentsLabel={commentsLabel}
            />
        ))}
    </div>
);
