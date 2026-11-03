import React from 'react';
import { IconButton } from '@/components';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Elements/Supervisor Sign-Up MGMT Button',
    component: IconButton,
    parameters: {
        layout: 'padded',
    },
};

export const SupervisorSignUpMgmtButton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-lg)' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-on-surface)' }}>
            Overview of Supervisor Sign-Up MGMT buttons (Icon only).
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Management Actions</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Add: Plus icon, Outline */}
                <IconButton icon="plus" label="Add to fill-in list" />

                {/* Remove: Minus icon, Outline */}
                <IconButton icon="minus" label="Remove from fill-in list" />

                {/* Copy: Copy icon, Outline */}
                <IconButton icon="copy" label="Copy recruitment message" />

                {/* Success: Check icon, Filled Success */}
                <IconButton icon="check" appearance="primary" label="Success" />
            </div>
        </section>
    </div>
);
SupervisorSignUpMgmtButton.storyName = 'Supervisor Sign-Up MGMT Button';
