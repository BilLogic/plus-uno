import React from 'react';
import Button from '../../../../../components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/CTA Sign-Up Related Buttons/Cancel',
    component: Button,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * Cancel Button
 * Outlined primary button for canceling action
 * Uses design system Button component with:
 * - style="primary" for primary color
 * - fill="outline" for outlined style
 * - leadingIcon="times" for X icon
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
            <h6 className="h6 mb-3">Default State</h6>
            <div style={{ maxWidth: '200px' }}>
                <Button
                    text="Cancel"
                    leadingIcon="times"
                    style="primary"
                    fill="outline"
                />
            </div>
        </section>
    </div>
);

/**
 * Exportable Cancel Button Component
 * For use in pages and other compositions
 */
export const CancelButton = ({ ...props }) => (
    <Button
        text="Cancel"
        leadingIcon="times"
        style="primary"
        fill="outline"
        {...props}
    />
);
