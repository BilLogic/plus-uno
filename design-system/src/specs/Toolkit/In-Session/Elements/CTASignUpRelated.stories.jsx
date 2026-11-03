import React from 'react';
import Button from '@/components/forms-and-inputs/Button/Button';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/In-Session/Elements/CTA Sign-Up Related',
    component: Button,
    parameters: {
        layout: 'padded',
    },
};

export const CtaSignUpRelated = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-lg)' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-on-surface)' }}>
            Overview of CTA (Sign-up Related) buttons.
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Continue</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Continue (# selected)" appearance="primary" />
                <Button text="Continue (0 selected)" appearance="primary" isDisabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Confirm & Complete</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Confirm & complete sign-up" appearance="primary" />
                <Button text="Confirm & complete sign-up" appearance="primary" isDisabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Schedule</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Icon 'eye' for check my schedule */}
                <Button text="Check my schedule" iconBefore="eye" appearance="primary" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Navigation</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Close" />
                <Button text="Back" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Copy Message</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Dark gray button, closest is probably secondary or needs custom style. 
                    Using 'secondary' for now based on 'secondary' text color in Figma code. 
                    Icon 'copy' for copy message. */}
                <Button text="Copy recruitment message" iconBefore="copy" />
                <Button text="Copy recruitment message" iconBefore="copy" isDisabled />
            </div>
            <div style={{ marginTop: 'var(--size-card-gap-md)' }}>
                {/* Success state */}
                <Button text="Copied" iconBefore="check" appearance="primary" />
            </div>
        </section>
    </div>
);
CtaSignUpRelated.storyName = 'CTA (Sign-up Related)';
