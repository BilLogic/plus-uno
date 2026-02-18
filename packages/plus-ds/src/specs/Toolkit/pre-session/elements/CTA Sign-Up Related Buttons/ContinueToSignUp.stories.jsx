import React from 'react';
import Button from '../../../../../components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/CTA Sign-Up Related Buttons/ContinueToSignUp',
    component: Button,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * Continue to Sign-Up Button
 * Filled primary button for continuing to sign-up flow
 * Uses design system Button component with:
 * - style="primary" for primary color
 * - fill="filled" for filled background
 * - leadingIcon="square-plus" for plus icon
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
                    text="Continue to sign-up"
                    leadingIcon="square-plus"
                    style="primary"
                    fill="filled"
                />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Disabled State</h6>
            <div style={{ maxWidth: '200px' }}>
                <Button
                    text="Continue to sign-up"
                    leadingIcon="square-plus"
                    style="primary"
                    fill="filled"
                    disabled
                />
            </div>
        </section>
    </div>
);

/**
 * Exportable Continue to Sign-Up Button Component
 * For use in pages and other compositions
 */
export const ContinueToSignUpButton = ({ disabled = false, ...props }) => (
    <Button
        text="Continue to sign-up"
        leadingIcon="square-plus"
        style="primary"
        fill="filled"
        disabled={disabled}
        {...props}
    />
);
