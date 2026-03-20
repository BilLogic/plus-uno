import React from 'react';
import Rating from '@/forms/Rating';
import Textarea from '@/forms/Textarea';

const sessionRatingCommentsByValue = {
    1: 'Lots of room for improvement.',
    2: 'Not so well, adjustments are needed.',
    3: "Okay, could've gone better.",
    4: 'Good, with some room for improvement.',
    5: 'Excellent session!',
};

export default function SessionOverview({ formState, dispatch }) {
    const { sessionRating, whatWentWell, whatWasChallenging } = formState;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-lg)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-element-gap-lg)',
                }}
            >
                <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                    How was the overall session?
                    <span style={{ color: 'var(--color-danger)' }}> *</span>
                </p>

                <Rating
                    id="session-rating"
                    name="sessionRating"
                    value={sessionRating}
                    variant="comments"
                    showCommentsLabel={!!sessionRatingCommentsByValue[sessionRating]}
                    commentsLabel={sessionRatingCommentsByValue[sessionRating] || null}
                    onChange={(val) =>
                        dispatch({ type: 'SET_FIELD', field: 'sessionRating', value: val })
                    }
                />
            </div>

            <Textarea
                name="whatWentWell"
                label="What went well?"
                placeholder="Describe what worked during this session..."
                rows={4}
                value={whatWentWell}
                onChange={(e) =>
                    dispatch({
                        type: 'SET_FIELD',
                        field: 'whatWentWell',
                        value: e.target.value,
                    })
                }
            />

            <Textarea
                name="whatWasChallenging"
                label="What was challenging?"
                placeholder="Describe any difficulties or areas for improvement..."
                rows={4}
                value={whatWasChallenging}
                onChange={(e) =>
                    dispatch({
                        type: 'SET_FIELD',
                        field: 'whatWasChallenging',
                        value: e.target.value,
                    })
                }
            />
        </div>
    );
}
