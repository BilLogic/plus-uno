import React from 'react';
import Button from '@/components/forms-and-inputs/Button/Button';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/In-Session/Elements/CTA Goal Related Buttons',
    component: Button,
    parameters: {
        layout: 'padded',
    },
};

export const CtaGoalRelatedButtons = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-lg)' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-on-surface)' }}>
            Overview of CTA / Goal Related buttons with various states.
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Set Goals</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Set goals" iconBefore="plus" appearance="primary" />
                <Button text="Set goals" iconBefore="plus" appearance="primary" isDisabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Mark Goals</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Mark goals as checked" iconBefore="check" appearance="primary" />
                <Button text="Mark goals as checked" iconBefore="check" appearance="primary" isDisabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Undo Check</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Undo goals check" iconBefore="rotate-left" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Update Goals</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Update goals" iconBefore="pen-to-square" appearance="primary" />
                <Button text="Update goals" iconBefore="pen-to-square" appearance="primary" isDisabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Save Goals</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Save goals" iconBefore="floppy-disk" appearance="primary" />
                <Button text="Save goals" iconBefore="floppy-disk" appearance="primary" isDisabled />
            </div>
        </section>
    </div>
);
CtaGoalRelatedButtons.storyName = 'CTA & Goal Related Buttons';
