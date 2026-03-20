import React from 'react';
import Card from '@/components/Card';
import Rating from '@/forms/Rating';
import Textarea from '@/forms/Textarea';

export default function SessionOverview({ formState, dispatch }) {
    const { sessionRating, whatWentWell, whatWasChallenging } = formState;

    return (
        <div className="section-container">
            <div className="section-header">
                <h2 className="h5-txt" style={{ color: 'var(--color-on-surface)' }}>
                    Session Overview
                </h2>
                <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Reflect on the session as a whole. This is asked once, not per student.
                </p>
            </div>

            <Card paddingSize="lg" gapSize="md" radiusSize="sm">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-lg)' }}>
                    <Rating
                        name="sessionRating"
                        label="How would you rate this session overall?"
                        value={sessionRating}
                        variant="comments"
                        showCommentsLabel={false}
                        onChange={(val) =>
                            dispatch({ type: 'SET_FIELD', field: 'sessionRating', value: val })
                        }
                    />

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
            </Card>
        </div>
    );
}
