import React from 'react';
import Button from '@/components/forms-and-inputs/Button/Button';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Elements/Supervisor Call-Offs Button',
    component: Button,
    parameters: {
        layout: 'padded',
    },

};

export const SupervisorCalloffsButton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-lg)' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-on-surface)' }}>
            Overview of Supervisor Call-offs buttons.
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Approve / Reject</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Approve: Success style (Green), Check icon */}
                <Button text="Approve" iconBefore="circle-check" appearance="primary" />
                <Button text="Approve" iconBefore="circle-check" appearance="primary" isDisabled />

                {/* Reject: Danger style (Red), X/Cross icon (using circle-xmark or xmark if available) */}
                <Button text="Reject" iconBefore="circle-xmark" appearance="danger" />
                <Button text="Reject" iconBefore="circle-xmark" appearance="danger" isDisabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Excused / Not Excused</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Excused: Success style (Green), Check icon */}
                <Button text="Excused" iconBefore="circle-check" appearance="primary" />
                <Button text="Excused" iconBefore="circle-check" appearance="primary" isDisabled />

                {/* Not Excused: Danger style (Red), X/Cross icon */}
                <Button text="Not Excused" iconBefore="circle-xmark" appearance="danger" />
                <Button text="Not Excused" iconBefore="circle-xmark" appearance="danger" isDisabled />
            </div>
        </section>
    </div>
);
SupervisorCalloffsButton.storyName = 'Supervisor Call-offs Button';
