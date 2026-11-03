import React from 'react';
import Button from '@/components/forms-and-inputs/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/CTA Sign-Up Related Buttons/Confirm Sign Up',
    component: Button,
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
};

/**
 * Confirm Sign-Up Button
 * Filled primary button for confirming sign-up
 * Uses design system Button component with:
 * - appearance="primary"
 * - iconBefore="square-plus" for plus icon
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
                    text="Confirm sign-up"
                    iconBefore="square-plus"
                    appearance="primary"
                    shouldFitContainer
                />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Disabled State</h6>
            <div style={{ width: '194px' }}>
                <Button
                    text="Confirm sign-up"
                    iconBefore="square-plus"
                    appearance="primary"
                    isDisabled
                    shouldFitContainer
                />
            </div>
        </section>
    </div>
);

/**
 * Exportable Confirm Sign-Up Button Component
 * For use in pages and other compositions
 */
export const ConfirmSignUpButton = ({ disabled = false, ...props }) => (
    <Button
        text="Confirm sign-up"
        iconBefore="square-plus"
        appearance="primary"
        isDisabled={disabled}
        shouldFitContainer
        {...props}
    />
);
