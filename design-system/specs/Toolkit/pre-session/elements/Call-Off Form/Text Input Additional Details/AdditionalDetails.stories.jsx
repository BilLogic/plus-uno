import React, { useState } from 'react';
import TextareaVer2 from '../../../../../../../packages/plus-ds/src/forms/TextareaVer2';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Call-Off Form/Text Input Additional Details',
    component: TextareaVer2,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

/**
 * Overview - All States
 * Shows all visual states of the Additional Details text input
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
                    label={<>Additional details <span style={{ color: 'var(--color-danger)' }}>*</span></>}
                    placeholder="Provide additional context..."
                    rows={2}
                    variant="long"
                />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Filled State</h6>
            <div style={{ maxWidth: '592px' }}>
                <TextareaVer2
                    label={<>Additional details <span style={{ color: 'var(--color-danger)' }}>*</span></>}
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
    const [details, setDetails] = useState('');

    return (
        <div>
            <h6 className="h6 mb-3">Interactive Demo</h6>
            <p className="body2-txt mb-4">
                Provide additional context for the call-off request.
            </p>
            <div style={{ maxWidth: '592px' }}>
                <TextareaVer2
                    label={<>Additional details <span style={{ color: 'var(--color-danger)' }}>*</span></>}
                    placeholder="Provide additional context..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={2}
                    variant="long"
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
