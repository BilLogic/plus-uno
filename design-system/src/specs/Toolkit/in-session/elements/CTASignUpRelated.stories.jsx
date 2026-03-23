import React from 'react';
import Button from '../../../../components/Button/Button';

export default {
    title: 'Specs/Toolkit/In-Session/Elements',
    component: Button,
    parameters: {
        layout: 'padded',
    },
};

export const CtaSignUpRelated = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-lg)' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>
            Overview of CTA (Sign-up Related) buttons.
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Continue</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Continue (# selected)" style="primary" />
                <Button text="Continue (0 selected)" style="primary" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Confirm & Complete</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Confirm & complete sign-up" style="primary" />
                <Button text="Confirm & complete sign-up" style="primary" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Schedule</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Icon 'eye' for check my schedule */}
                <Button text="Check my schedule" leadingVisual="eye" style="primary" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Navigation</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Close" style="primary" fill="outline" />
                <Button text="Back" style="primary" fill="outline" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Copy Message</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Dark grey button, closest is probably secondary or needs custom style. 
                    Using 'secondary' for now based on 'secondary' text color in Figma code. 
                    Icon 'copy' for copy message. */}
                <Button text="Copy recruitment message" leadingVisual="copy" style="secondary" />
                <Button text="Copy recruitment message" leadingVisual="copy" style="secondary" disabled />
            </div>
            <div style={{ marginTop: 'var(--size-card-gap-md)' }}>
                {/* Success state */}
                <Button text="Copied" leadingVisual="check" style="success" />
            </div>
        </section>
    </div>
);
CtaSignUpRelated.storyName = 'CTA (Sign-up Related)';
