import React from 'react';
import Button from '../../../../../../packages/plus-ds/src/components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/CTA Sign-Up Related Buttons/Success',
    component: Button,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * Success Button
 * Filled success button for success actions
 * Uses design system Button component with:
 * - style="success" for success color
 * - fill="filled" for filled background
 * - leadingVisual="check" for check icon
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
                    text="Copied"
                    leadingVisual="check"
                    style="success"
                    fill="filled"
                />
            </div>
        </section>
    </div>
);

/**
 * Exportable Success Button Component
 * For use in pages and other compositions
 */
export const SuccessButton = ({ text = "Copied", ...props }) => (
    <Button
        text={text}
        leadingVisual="check"
        style="success"
        fill="filled"
        {...props}
    />
);
