import React from 'react';
import Button from '../../../../../../packages/plus-ds/src/components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/CTA Sign-Up Related Buttons/ConfirmFillIn',
    component: Button,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * Confirm Fill-In Button
 * Filled primary button for confirming fill-in
 * Uses design system Button component with:
 * - style="primary" for primary color
 * - fill="filled" for filled background
 * - leadingIcon="square-plus" for plus icon
 * - width: 194px (fixed width)
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
            <div style={{ width: '194px' }}>
                <Button
                    text="Confirm fill-in"
                    leadingIcon="square-plus"
                    style="primary"
                    fill="filled"
                    block
                />
            </div>
        </section>
    </div>
);

/**
 * Exportable Confirm Fill-In Button Component
 * For use in pages and other compositions
 */
export const ConfirmFillInButton = ({ ...props }) => (
    <Button
        text="Confirm fill-in"
        leadingIcon="square-plus"
        style="primary"
        fill="filled"
        block
        {...props}
    />
);
