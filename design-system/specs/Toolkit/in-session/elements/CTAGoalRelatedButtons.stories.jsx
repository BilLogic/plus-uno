import React from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/CTA & Goal Related Buttons',
    component: Button,
    parameters: {
        layout: 'padded',
    },

};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>
            Overview of CTA / Goal Related buttons with various states.
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Set Goals</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Button text="Set goals" leadingVisual="plus" style="primary" />
                <Button text="Set goals" leadingVisual="plus" style="primary" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Mark Goals</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Button text="Mark goals as checked" leadingVisual="check" style="primary" />
                <Button text="Mark goals as checked" leadingVisual="check" style="primary" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Undo Check</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Button text="Undo goals check" leadingVisual="rotate-left" style="secondary" fill="tonal" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Update Goals</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Button text="Update goals" leadingVisual="pen-to-square" style="primary" />
                <Button text="Update goals" leadingVisual="pen-to-square" style="primary" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Save Goals</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Button text="Save goals" leadingVisual="floppy-disk" style="primary" />
                <Button text="Save goals" leadingVisual="floppy-disk" style="primary" disabled />
            </div>
        </section>
    </div>
);
