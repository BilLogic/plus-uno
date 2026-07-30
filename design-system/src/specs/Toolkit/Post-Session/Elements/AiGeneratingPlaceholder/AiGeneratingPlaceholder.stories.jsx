import React from 'react';
import AiGeneratingPlaceholder from './AiGeneratingPlaceholder';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/AI Generating Placeholder',
    parameters: {
        layout: 'padded',
    },
};

/** Default AI generating skeleton used between chip answers and follow-up prompts. */
export const Default = () => (
    <div style={{ maxWidth: '768px' }}>
        <AiGeneratingPlaceholder />
    </div>
);
