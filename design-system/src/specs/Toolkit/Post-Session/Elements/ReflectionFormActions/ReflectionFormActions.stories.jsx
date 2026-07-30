import React from 'react';
import ReflectionFormActions from './ReflectionFormActions';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Reflection Form Actions',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Local organism — Reflection Form Actions. action: start | continue | edit.',
            },
        },
    },
};

/** Start · Continue · Edit actions used on the Reflections table. */
export const Overview = () => (
    <div style={{ display: 'flex', gap: 'var(--size-element-gap-md)', alignItems: 'center' }}>
        <ReflectionFormActions action="start" />
        <ReflectionFormActions action="continue" />
        <ReflectionFormActions action="edit" />
    </div>
);

export const Interactive = {
    args: { action: 'start' },
    argTypes: {
        action: { control: 'select', options: ['start', 'continue', 'edit'] },
    },
    render: (args) => <ReflectionFormActions {...args} />,
};
