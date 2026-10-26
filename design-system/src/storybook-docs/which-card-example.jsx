import React from 'react';
import Card from '@/components/layout-and-structure/Card';
import PatternCard from '@/patterns/PatternCard';
import { Button } from '@/components';

/** The Card component and the card pattern with the same content, side by side. */
export const WhichCardExample = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px', width: '100%' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Card component</span>
            <Card
                title="Algebra I · Thu 4:00 PM"
                body="Last note: practice set 4 assigned."
                links={[{ text: 'Session notes', href: '#' }]}
                actionButton={{ text: 'Open session', onClick: () => {} }}
            />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Card pattern</span>
            <PatternCard
                title="Algebra I · Thu 4:00 PM"
                description="Last note: practice set 4 assigned."
                footer={<Button text="Open session" style="primary" fill="filled" size="small" onClick={() => {}} />}
            >
                <span className="body1-txt">Body slot: any content you compose.</span>
            </PatternCard>
        </div>
    </div>
);
