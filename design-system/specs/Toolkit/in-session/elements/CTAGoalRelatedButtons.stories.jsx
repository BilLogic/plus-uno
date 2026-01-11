import React from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';

export default {
    title: 'Specs/Toolkit/In-Session/Elements',
    component: Button,
    parameters: {
        layout: 'padded',
    },
};

export const CtaGoalRelatedButtons = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-lg)' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>
            Overview of CTA / Goal Related buttons with various states.
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Set Goals</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Set goals" leadingVisual="plus" style="primary" />
                <Button text="Set goals" leadingVisual="plus" style="primary" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Mark Goals</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Mark goals as checked" leadingVisual="check" style="primary" />
                <Button text="Mark goals as checked" leadingVisual="check" style="primary" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Undo Check</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Undo goals check" leadingVisual="rotate-left" style="secondary" fill="tonal" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Update Goals</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Update goals" leadingVisual="pen-to-square" style="primary" />
                <Button text="Update goals" leadingVisual="pen-to-square" style="primary" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Save Goals</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Save goals" leadingVisual="floppy-disk" style="primary" />
                <Button text="Save goals" leadingVisual="floppy-disk" style="primary" disabled />
            </div>
        </section>
    </div>
);
CtaGoalRelatedButtons.storyName = 'CTA & Goal Related Buttons';
