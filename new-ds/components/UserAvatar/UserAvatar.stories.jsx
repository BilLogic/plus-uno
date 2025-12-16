import React from 'react';
import UserAvatar from '@/components/UserAvatar';

export default {
    title: 'Components/UserAvatar',
    component: UserAvatar,
    tags: ['autodocs'],
    argTypes: {
        firstChar: { control: 'text', description: 'First character' },
        name: { control: 'text', description: 'User name' },
        counter: { control: 'boolean', description: 'Show counter' },
        counterValue: { control: 'number', description: 'Counter value' },
        state: {
            control: 'select',
            options: ['enabled', 'hover'],
            description: 'State',
        },
        type: {
            control: 'select',
            options: ['regular tutor', 'lead tutor', 'admin'],
            description: 'User type',
        },
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <UserAvatar name="Regular Tutor" type="regular tutor" />
        <UserAvatar name="Lead Tutor" type="lead tutor" firstChar="L" />
        <UserAvatar name="Admin User" type="admin" firstChar="A" />
        <UserAvatar name="Hover State" state="hover" />
        <UserAvatar name="No Counter" counter={false} />
    </div>
);

export const Interactive = {
    args: {
        firstChar: 'J',
        name: 'John Doe',
        counter: true,
        counterValue: 2,
        state: 'enabled',
        type: 'regular tutor',
    },
};
