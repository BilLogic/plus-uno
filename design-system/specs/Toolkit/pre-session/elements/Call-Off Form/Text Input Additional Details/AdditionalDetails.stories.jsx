import React, { useState } from 'react';
import Textarea from '../../../../../../../packages/plus-ds/src/forms/Textarea';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Call-Off Form/Text Input Additional Details',
    component: Textarea,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

/**
 * Overview - All States
 * Shows all visual states of the Additional Details text input
 * 
 * Uses design system Textarea component with:
 * - placeholder for unfilled state
 * - size="small" to match B3 typography from Figma
 * - rows=2 for appropriate height
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)'
        }}
    >
        <section>
            <h6 className="h6 mb-3">Unfilled State (Placeholder)</h6>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-ele-gap-xs)',
                    maxWidth: '592px'
                }}
            >
                <div style={{ display: 'flex', gap: 'var(--size-spacing-space-050)' }}>
                    <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                        Additional details
                    </span>
                    <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
                </div>
                <Textarea
                    placeholder="Provide additional context..."
                    rows={2}
                    size="small"
                />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Filled State</h6>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-ele-gap-xs)',
                    maxWidth: '592px'
                }}
            >
                <div style={{ display: 'flex', gap: 'var(--size-spacing-space-050)' }}>
                    <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                        Additional details
                    </span>
                    <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
                </div>
                <Textarea
                    defaultValue="Bla bla bla bla"
                    rows={2}
                    size="small"
                />
            </div>
        </section>
    </div>
);

/**
 * Interactive Demo
 * Allows user to interact with the text input
 */
export const Interactive = () => {
    const [details, setDetails] = useState('');

    return (
        <div>
            <h6 className="h6 mb-3">Interactive Demo</h6>
            <p className="body2-txt mb-4">
                Provide additional context for the call-off request.
            </p>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-ele-gap-xs)',
                    maxWidth: '592px'
                }}
            >
                <div style={{ display: 'flex', gap: 'var(--size-spacing-space-050)' }}>
                    <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                        Additional details
                    </span>
                    <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
                </div>
                <Textarea
                    placeholder="Provide additional context..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={2}
                    size="small"
                />
            </div>
            {details && (
                <p className="body3-txt mt-3" style={{ color: 'var(--color-secondary-text)' }}>
                    Character count: {details.length}
                </p>
            )}
        </div>
    );
};
