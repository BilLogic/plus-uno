import React, { useState } from 'react';
import NoRecordingReason from './NoRecordingReason';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/No Recording Reason',
    parameters: { layout: 'padded' },
};

/** Empty + filled on one canvas. */
export const Overview = {
    render: function NoRecordingReasonOverview() {
        const [value, setValue] = useState('');
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '480px' }}>
                <NoRecordingReason value={value} onChange={setValue} />
                <NoRecordingReason value="Forgot to record" onChange={() => {}} />
            </div>
        );
    },
};
