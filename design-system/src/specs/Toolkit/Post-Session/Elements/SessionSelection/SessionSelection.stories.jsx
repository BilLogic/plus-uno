import React, { useState } from 'react';
import SessionSelection from './SessionSelection';

const OPTIONS = [
    { value: 'a', label: 'El Capitan (Thompson) · 12:25–13:25' },
    { value: 'b', label: 'Life STEAM (Thompson) · 10:00' },
    { value: 'c', label: 'Life STEAM Academy · 16:00' },
];

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Session Selection',
    parameters: { layout: 'padded' },
};

/** Empty + Filled — single docs canvas. */
export const Overview = {
    render: function SessionSelectionOverview() {
        const [value, setValue] = useState('');
        const [didNotHappen, setDidNotHappen] = useState(false);
        return (
            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                <SessionSelection options={OPTIONS} />
                <SessionSelection
                    value={value || 'c'}
                    onChange={setValue}
                    options={OPTIONS}
                    didNotHappen={didNotHappen}
                    onDidNotHappenChange={setDidNotHappen}
                />
            </div>
        );
    },
};
