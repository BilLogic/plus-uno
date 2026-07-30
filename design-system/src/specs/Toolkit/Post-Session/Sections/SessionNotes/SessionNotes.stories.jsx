import React from 'react';
import SessionNotes from './SessionNotes';

export default {
    title: 'Specs/Toolkit/Post-Session/Sections/Session Notes',
    component: SessionNotes,
    parameters: { layout: 'padded' },
    tags: ['!dev', '!autodocs'],
};

/**
 * Empty + Filled on one canvas — no subpages.
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SessionNotes state="empty" />
            <SessionNotes
                state="filled"
                notes="Hasn’t been spending much time on math lately and progress has slowed. Gets distracted/puts it off, needs regular check-ins and encouragement to get started."
            />
        </div>
    ),
};
