import React from 'react';
import Button from '../../../../components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Supervisor Sign-Up MGMT Button',
    component: Button,
    parameters: {
        layout: 'padded',
    },
};

export const SupervisorSignUpMgmtButton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-lg)' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>
            Overview of Supervisor Sign-Up MGMT buttons (Icon only).
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Management Actions</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Add: Plus icon, Outline */}
                <Button leadingVisual="plus" style="primary" fill="outline" aria-label="Add to fill-in list" />

                {/* Remove: Minus icon, Outline */}
                <Button leadingVisual="minus" style="primary" fill="outline" aria-label="Remove from fill-in list" />

                {/* Copy: Copy icon, Outline */}
                <Button leadingVisual="copy" style="primary" fill="outline" aria-label="Copy recruitment message" />

                {/* Success: Check icon, Filled Success */}
                <Button leadingVisual="check" style="success" aria-label="Success" />
            </div>
        </section>
    </div>
);
SupervisorSignUpMgmtButton.storyName = 'Supervisor Sign-Up MGMT Button';
