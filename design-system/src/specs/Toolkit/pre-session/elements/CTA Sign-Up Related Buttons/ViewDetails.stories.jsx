import React from 'react';
import Button from '../../../../../components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/CTA Sign-Up Related Buttons/CheckSchedule',
    component: Button,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * View Details Button
 * Filled primary button for viewing details
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
                    text="Check my schedule"
                    leadingVisual="eye"
                    style="primary"
                    fill="filled"
                    block
                />
            </div>
        </section>
    </div>
);

/**
 * Exportable View Details Button Component
 * For use in pages and other compositions
 */
export const CheckScheduleButton = ({ text = "Check my schedule", ...props }) => (
    <Button
        text={text}
        leadingVisual="eye"
        style="primary"
        fill="filled"
        block
        {...props}
    />
);
