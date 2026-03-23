import React from 'react';
import Badge from '../../../../../components/Badge/Badge';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Badges/Call-Off Lateness',
    component: Badge,
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const LatenessBadge = ({ isLate = true }) => {
    if (!isLate) {
        return <p className="body2-txt" style={{ color: 'var(--color-neutral-text-medium)', margin: 0 }}>-</p>;
    }

    return (
        <div title="This call-off request was submitted late (within 12 hours of the session start)." style={{ display: 'inline-block' }}>
            <Badge
                text="Late"
                style="danger"
                size="b2"
            />
        </div>
    );
};

export const CallOffLateness = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section>
            <h6 className="h6 mb-3">State: Late</h6>
            <LatenessBadge isLate={true} />
        </section>

        <section>
            <h6 className="h6 mb-3">State: On-Time</h6>
            <LatenessBadge isLate={false} />
        </section>
    </div>
);
