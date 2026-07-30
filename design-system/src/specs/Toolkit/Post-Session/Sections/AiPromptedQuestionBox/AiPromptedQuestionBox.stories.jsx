import React from 'react';
import AiPromptedQuestionBox, { AiPromptedQuestionBoxInteractive } from './AiPromptedQuestionBox';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Sections/AI Prompted Question Box',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Local organism — Dynamic AI Prompted Question Box. States: default | loading | empty. Hide entirely on LLM failure/timeout.',
            },
        },
    },
};

/** Default · Loading · Empty stacked like the Figma set. */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
        <AiPromptedQuestionBox state="default" />
        <AiPromptedQuestionBox state="loading" />
        <AiPromptedQuestionBox state="empty" />
    </div>
);

export const Default = {
    render: () => <AiPromptedQuestionBoxInteractive state="default" />,
};

export const Loading = {
    render: () => <AiPromptedQuestionBox state="loading" />,
};

export const Empty = {
    render: () => <AiPromptedQuestionBox state="empty" />,
};
