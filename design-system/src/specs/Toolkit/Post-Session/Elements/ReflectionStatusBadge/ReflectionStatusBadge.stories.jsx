import React from 'react';
import ReflectionStatusBadge from './ReflectionStatusBadge';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Reflection Status Badge',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Local organism — Badges / Reflection Status. status: not-started | in-progress | complete.',
            },
        },
    },
};

/** All three reflection status badges. */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)', alignItems: 'flex-start' }}>
        <ReflectionStatusBadge status="not-started" />
        <ReflectionStatusBadge status="in-progress" />
        <ReflectionStatusBadge status="complete" />
    </div>
);

/** Interactive control for a single badge. */
export const Interactive = {
    args: { status: 'in-progress' },
    argTypes: {
        status: {
            control: 'select',
            options: ['not-started', 'in-progress', 'complete'],
        },
    },
    render: (args) => <ReflectionStatusBadge {...args} />,
};
