import React from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Badge from '@/components/Badge';

export default function SuccessScreen({ formState, onReturnToDashboard }) {
    const flaggedCount = Object.values(formState.studentCheckIn || {}).filter(
        (s) => s.flagForDeepDive
    ).length;
    const strategiesUsed = (formState.selectedStrategies || []).length;

    return (
        <div className="success-screen">
            <i className="fa-solid fa-circle-check success-screen__icon" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                <h2 className="h3-txt" style={{ color: 'var(--color-on-surface)' }}>
                    Reflection Submitted
                </h2>
                <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Thank you for completing your session reflection. Your responses have been recorded.
                </p>
            </div>

            <div className="success-screen__stats">
                <Card paddingSize="md" gapSize="sm" radiusSize="sm">
                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Session Rating
                    </span>
                    <span className="h5-txt">{formState.sessionRating || 0}/5</span>
                </Card>
                <Card paddingSize="md" gapSize="sm" radiusSize="sm">
                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Students Flagged
                    </span>
                    <span className="h5-txt">
                        {flaggedCount}
                        {flaggedCount > 0 && (
                            <Badge text="Review" style="warning" size="b3" className="ms-2" />
                        )}
                    </span>
                </Card>
                <Card paddingSize="md" gapSize="sm" radiusSize="sm">
                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Strategies Used
                    </span>
                    <span className="h5-txt">{strategiesUsed}</span>
                </Card>
            </div>

            <div style={{ display: 'flex', gap: 'var(--size-element-gap-md)' }}>
                <Button
                    text="Return to Dashboard"
                    style="primary"
                    fill="filled"
                    onClick={onReturnToDashboard}
                />
                <Button
                    text="View Summary"
                    style="primary"
                    fill="outline"
                    onClick={() => window.print()}
                />
            </div>
        </div>
    );
}
