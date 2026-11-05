import React from 'react';
import { expect, within } from 'storybook/test';
import UserAvatar from './UserAvatar';

const row = { display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' };

export default {
    title: 'Components/Images and icons/User avatar',
    component: UserAvatar,
    /** Hide CSF stories from the sidebar; docs live on UserAvatar.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs'],
    parameters: { docs: { toc: { title: 'On this page' } } },
    argTypes: {
        firstChar: { control: 'text', description: 'The initial shown in the pill.', table: { category: 'Content' } },
        name: { control: 'text', description: "The user's name. Truncates at the label maximum width.", table: { category: 'Content' } },
        type: { control: 'inline-radio', options: ['regular tutor', 'lead tutor', 'admin'], description: 'The user type. `lead tutor` adds the Lead status tag.', table: { category: 'Content' } },
        counter: { control: 'boolean', description: 'Show the notification counter.', table: { category: 'Content' } },
        counterValue: { control: 'number', description: 'The number in the counter.', table: { category: 'Content' } },
        size: { control: 'inline-radio', options: ['md', 'lg'], description: '`md` is 32 high, for the topbar. `lg` is padded, for table rows.', table: { category: 'Appearance' } },
        state: { control: 'inline-radio', options: ['enabled', 'hover'], description: 'Forces the hover look, for docs.', table: { category: 'Appearance' } },
        onClick: { control: false, table: { category: 'Events' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
    args: { firstChar: 'J', name: 'John Doe', type: 'regular tutor', counter: true, counterValue: 2, size: 'lg', state: 'enabled' },
};

export const Overview = {
    render: (args) => <UserAvatar {...args} />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByText('John Doe')).toBeInTheDocument();
    },
};

export const Sizes = {
    render: () => (
        <div style={row}>
            <UserAvatar size="md" />
            <UserAvatar size="lg" />
        </div>
    ),
};

export const Types = {
    render: () => (
        <div style={row}>
            <UserAvatar type="regular tutor" />
            <UserAvatar type="lead tutor" />
            <UserAvatar type="admin" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getAllByText('Lead')).toHaveLength(1);
    },
};

export const Counter = {
    render: () => (
        <div style={row}>
            <UserAvatar counter />
            <UserAvatar counter={false} />
        </div>
    ),
};

export const Interactive = {
    render: (args) => <UserAvatar {...args} />,
};
