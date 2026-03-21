import React, { useState } from 'react';
import TextareaVer2 from '@/forms/TextareaVer2';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Call-Off Form/Supervisor Decision Rationale Text Input',
    component: TextareaVer2,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

/**
 * Overview - All States
 * Shows all visual states of the Supervisor Decision Rationale text input
 * 
 * Uses design system TextareaVer2 component with:
 * - variant="long" for boxed style
 * - placeholder for unfilled state
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
            <div style={{ maxWidth: '592px' }}>
                <TextareaVer2
                    label={<>Rationale <span style={{ color: 'var(--color-danger)' }}>*</span></>}
                    placeholder="Please provide a reason for this decision..."
                    rows={2}
                    variant="long"
                />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Filled State</h6>
            <div style={{ maxWidth: '592px' }}>
                <TextareaVer2
                    label={<>Rationale <span style={{ color: 'var(--color-danger)' }}>*</span></>}
                    defaultValue="Bla bla bla bla"
                    rows={2}
                    variant="long"
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
    const [rationale, setRationale] = useState('');

    return (
        <div>
            <h6 className="h6 mb-3">Interactive Demo</h6>
            <p className="body2-txt mb-4">
                Provide a rationale for the supervisor's decision on the call-off request.
            </p>
            <div style={{ maxWidth: '592px' }}>
                <TextareaVer2
                    label={<>Rationale <span style={{ color: 'var(--color-danger)' }}>*</span></>}
                    placeholder="Please provide a reason for this decision..."
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    rows={2}
                    variant="long"
                />
            </div>
            {rationale && (
                <p className="body3-txt mt-3" style={{ color: 'var(--color-secondary-text)' }}>
                    Character count: {rationale.length}
                </p>
            )}
        </div>
    );
};
