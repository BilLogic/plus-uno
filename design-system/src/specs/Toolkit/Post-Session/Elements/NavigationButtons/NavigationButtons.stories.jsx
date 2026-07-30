import React from 'react';
import NavigationButtons from './NavigationButtons';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Navigation Buttons',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Local organism — Navigation Button + Button Group. Cancel · Save & Exit · Next/Submit with enabled/disabled states.',
            },
        },
    },
};

/** Disabled Save/Next (nothing filled yet). */
export const Disabled = () => (
    <NavigationButtons canSave={false} canNext={false} />
);

/** Save enabled, Next still disabled. */
export const SaveEnabled = {
    name: 'Save enabled',
    render: () => <NavigationButtons canSave canNext={false} />,
};

/** Ready to advance. */
export const ReadyToAdvance = {
    name: 'Ready to advance',
    render: () => <NavigationButtons canSave canNext />,
};

/** Final step — Submit instead of Next. */
export const ReadyToSubmit = {
    name: 'Ready to submit',
    render: () => <NavigationButtons canSave canNext showPrevious showSubmit />,
};

export const Interactive = {
    args: {
        canSave: true,
        canNext: true,
        showPrevious: false,
        showSubmit: false,
    },
    render: (args) => <NavigationButtons {...args} />,
};
