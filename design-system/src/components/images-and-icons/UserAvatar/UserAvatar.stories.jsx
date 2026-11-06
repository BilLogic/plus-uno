import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
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
        name: { control: 'text', description: "The user's name. Truncates with an ellipsis; at the label maximum width in the compact spacing.", table: { category: 'Content' } },
        type: { control: 'inline-radio', options: ['regular tutor', 'lead tutor', 'admin'], description: 'The user type. `lead tutor` adds the Lead status tag.', table: { category: 'Content' } },
        counter: { control: 'boolean', description: 'Show the notification counter.', table: { category: 'Content' } },
        counterValue: { control: 'number', description: 'The number in the counter.', table: { category: 'Content' } },
        spacing: { control: 'inline-radio', options: ['compact', 'default'], description: '`compact` is 32 high, for the topbar. `default` is padded, for table rows.', table: { category: 'Appearance' } },
        state: { control: 'inline-radio', options: ['enabled', 'hover', 'disabled'], description: 'Forces the hover look, for docs, or dims the row as disabled.', table: { category: 'Appearance' } },
        onClick: { control: false, table: { category: 'Events' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
    args: { firstChar: 'J', name: 'John Doe', type: 'regular tutor', counter: true, counterValue: 2, spacing: 'default', state: 'enabled' },
};

export const Overview = {
    render: (args) => <UserAvatar {...args} />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByText('John Doe')).toBeInTheDocument();
    },
};

export const Spacing = {
    render: () => (
        <div style={row}>
            {['compact', 'default'].map((spacing) => <UserAvatar key={spacing} spacing={spacing} />)}
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

/* ------------------------------------------------------- one per state */

const rowOf = (canvasElement, name = 'John Doe') => within(canvasElement).getByText(name).closest('.plus-user-avatar');

export const Rest = {
    render: () => <UserAvatar onClick={fn()} />,
    play: async ({ canvasElement }) => {
        const el = within(canvasElement).getByRole('button');
        await expect(getComputedStyle(el).cursor).toBe('pointer');
        await expect(el).toHaveAttribute('tabindex', '0');
    },
};

export const Hovered = {
    render: () => <UserAvatar spacing="default" onClick={fn()} />,
    play: async ({ canvasElement }) => {
        const el = rowOf(canvasElement);
        el.style.transition = 'none';
        const fill = withForcedPseudo(el, ':hover', () => getComputedStyle(el).backgroundColor);
        await expect(fill).toBe(tokenColor(canvasElement, '--ds-interaction-hovered'));
    },
};

export const Pressed = {
    args: { onClick: fn() },
    render: (args) => <UserAvatar onClick={args.onClick} />,
    play: async ({ canvasElement, args }) => {
        const el = within(canvasElement).getByRole('button');
        await userEvent.click(el);
        await expect(args.onClick).toHaveBeenCalledTimes(1);
        el.focus();
        await userEvent.keyboard('{Enter}');
        await expect(args.onClick).toHaveBeenCalledTimes(2);
        await userEvent.keyboard(' ');
        await expect(args.onClick).toHaveBeenCalledTimes(3);
    },
};

export const Focused = {
    render: () => <UserAvatar onClick={fn()} />,
    play: async ({ canvasElement }) => {
        const el = within(canvasElement).getByRole('button');
        el.style.transition = 'none';
        el.focus({ focusVisible: true });
        await waitFor(() => expect(getComputedStyle(el).outlineStyle).toBe('solid'));
        const style = getComputedStyle(el);
        await expect(px(style.outlineWidth)).toBe(2);
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        el.blur();
    },
};

export const Disabled = {
    render: () => <UserAvatar state="disabled" onClick={fn()} />,
    play: async ({ canvasElement }) => {
        const el = rowOf(canvasElement);
        await expect(el).toHaveAttribute('aria-disabled', 'true');
        await expect(el.hasAttribute('tabindex')).toBe(false);
        await expect(within(canvasElement).queryByRole('button')).toBeNull();
    },
};
