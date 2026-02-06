import React from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Session Actions Button',
    component: Button,
    parameters: {
        layout: 'padded',
    },
};

export const SessionActionsButton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-lg)' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>
            Overview of Session Actions buttons.
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Join Session</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Join: Tonal fill, Disabled aspect in design */}
                <Button text="Join" style="secondary" fill="tonal" />
                <Button text="Join" style="secondary" fill="tonal" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Session Details</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Details: Outline */}
                <Button text="Details" style="primary" fill="outline" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Sign Up</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Sign Up: Outline */}
                <Button text="Sign Up" style="primary" fill="outline" />
                <Button text="Sign Up" style="primary" fill="outline" disabled />
            </div>
        </section>
    </div>
);
SessionActionsButton.storyName = 'Session Actions Button';
