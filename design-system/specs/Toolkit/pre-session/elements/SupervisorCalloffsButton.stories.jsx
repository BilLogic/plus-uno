import React from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Supervisor Call-offs Button',
    component: Button,
    parameters: {
        layout: 'padded',
    },

};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>
            Overview of Supervisor Call-offs buttons.
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Approve / Reject</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* Approve: Success style (Green), Check icon */}
                <Button text="Approve" leadingVisual="circle-check" style="success" />
                <Button text="Approve" leadingVisual="circle-check" style="success" disabled />

                {/* Reject: Danger style (Red), X/Cross icon (using circle-xmark or xmark if available) */}
                <Button text="Reject" leadingVisual="circle-xmark" style="danger" />
                <Button text="Reject" leadingVisual="circle-xmark" style="danger" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Excused / Not Excused</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* Excused: Success style (Green), Check icon */}
                <Button text="Excused" leadingVisual="circle-check" style="success" />
                <Button text="Excused" leadingVisual="circle-check" style="success" disabled />

                {/* Not Excused: Danger style (Red), X/Cross icon */}
                <Button text="Not Excused" leadingVisual="circle-xmark" style="danger" />
                <Button text="Not Excused" leadingVisual="circle-xmark" style="danger" disabled />
            </div>
        </section>
    </div>
);
