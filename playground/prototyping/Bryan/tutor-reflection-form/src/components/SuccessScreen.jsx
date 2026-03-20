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
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 'var(--size-section-gap-md)',
                padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
                minHeight: '400px',
            }}
        >
            <div
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <i className="fa-solid fa-check" style={{ fontSize: 36, color: 'var(--color-on-success)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                <h3 className="h3" style={{ color: 'var(--color-on-surface)', margin: 0 }}>
                    Reflection Submitted
                </h3>
                <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
                    Thank you for completing your session reflection. Your responses have been recorded.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--size-section-gap-md)', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Card paddingSize="md" gapSize="sm" radiusSize="sm">
                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Session Rating</span>
                    <span className="h5">{formState.sessionRating || 0}/5</span>
                </Card>
                <Card paddingSize="md" gapSize="sm" radiusSize="sm">
                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Students Flagged</span>
                    <span className="h5">
                        {flaggedCount}
                        {flaggedCount > 0 && <Badge text="Review" style="warning" size="b3" className="ms-2" />}
                    </span>
                </Card>
                <Card paddingSize="md" gapSize="sm" radiusSize="sm">
                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Strategies Used</span>
                    <span className="h5">{strategiesUsed}</span>
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
                    fill="tonal"
                    onClick={() => window.print()}
                />
            </div>
        </div>
    );
}
