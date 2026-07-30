import React from 'react';
import AiPromptedQuestionBox, { AiPromptedQuestionBoxInteractive } from './AiPromptedQuestionBox';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Sections/Dynamic AI Prompted Question Box',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Default · Loading · Empty on one canvas (matches Figma set — no subpages).
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            <AiPromptedQuestionBoxInteractive state="default" />
            <AiPromptedQuestionBox state="loading" />
            <AiPromptedQuestionBox state="empty" />
        </div>
    ),
};
