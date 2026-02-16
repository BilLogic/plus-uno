import React from 'react';
import Button from '../../../../../../packages/plus-ds/src/components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/CTA Sign-Up Related Buttons/CopyRecruitmentMessage',
    component: Button,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * Copy Recruitment Message Button
 * Tonal secondary button for copying recruitment message
 * Uses design system Button component with:
 * - style="secondary" for secondary color
 * - fill="tonal" for tonal background
 * - leadingIcon="copy" for copy icon
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
            <div style={{ maxWidth: '250px' }}>
                <Button
                    text="Copy recruitment message"
                    leadingIcon="copy"
                    style="secondary"
                    fill="tonal"
                />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Disabled State</h6>
            <div style={{ maxWidth: '250px' }}>
                <Button
                    text="Copy recruitment message"
                    leadingIcon="copy"
                    style="secondary"
                    fill="tonal"
                    disabled
                />
            </div>
        </section>
    </div>
);

/**
 * Exportable Copy Recruitment Message Button Component
 * For use in pages and other compositions
 */
export const CopyRecruitmentMessageButton = ({ disabled = false, ...props }) => (
    <Button
        text="Copy recruitment message"
        leadingIcon="copy"
        style="secondary"
        fill="tonal"
        disabled={disabled}
        {...props}
    />
);
