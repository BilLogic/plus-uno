import React from 'react';
import SessionNotes from './SessionNotes';

export default {
    title: 'Specs/Toolkit/Post-Session/Sections/Session Notes',
    component: SessionNotes,
    parameters: { layout: 'padded' },
    tags: ['!dev', '!autodocs'],
};

/**
 * Figma Session Notes — State=Empty.
 */
export const Empty = {
    render: () => <SessionNotes state="empty" />,
};

/**
 * Figma Session Notes — State=Filled.
 */
export const Filled = {
    render: () => (
        <SessionNotes
            state="filled"
            notes="Hasn’t been spending much time on math lately and progress has slowed. Gets distracted/puts it off, needs regular check-ins and encouragement to get started."
        />
    ),
};
