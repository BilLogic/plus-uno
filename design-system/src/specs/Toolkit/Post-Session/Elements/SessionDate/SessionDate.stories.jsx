import React, { useState } from 'react';
import SessionDate from './SessionDate';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Session Date',
    parameters: { layout: 'padded' },
};

/**
 * Empty + Filled on one canvas — no subpages.
 */
export const Overview = {
    render: function SessionDateOverview() {
        const [value, setValue] = useState('');
        return (
            <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
                <SessionDate value={value} onChange={setValue} />
                <SessionDate value="2026-07-15" onChange={() => {}} />
            </div>
        );
    },
};
