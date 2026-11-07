import React from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { px, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import IconButton, { ICON_BUTTON_APPEARANCES } from './IconButton';
import { expectFocusRing, expectHovered, expectPressed } from '@/storybook-docs/lib/button-states.js';

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const title = (name) => name.charAt(0).toUpperCase() + name.slice(1);

export default {
    title: 'Components/Forms and inputs/Button/Icon button',
    component: IconButton,
    /** Hide CSF stories from the sidebar; docs live on IconButton.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs', 'new'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'added', summary: 'Icon button: `icon`, a required `label`, `appearance` (default, subtle, primary, discovery), `spacing` (default 32, compact 24) and `shape` (default, circle).' },
        ],
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        icon: { control: 'text', table: { category: 'Content' } },
        label: { control: 'text', table: { category: 'Content' } },
        appearance: { control: 'select', options: ICON_BUTTON_APPEARANCES, table: { category: 'Design' } },
        spacing: { control: 'inline-radio', options: ['default', 'compact'], table: { category: 'Design' } },
        shape: { control: 'inline-radio', options: ['default', 'circle'], table: { category: 'Design' } },
        isSelected: { control: 'boolean', table: { category: 'Behavior' } },
        isDisabled: { control: 'boolean', table: { category: 'Behavior' } },
        isLoading: { control: 'boolean', table: { category: 'Behavior' } },
        onClick: { table: { disable: true } },
    },
    args: { icon: 'pen', label: 'Edit page', appearance: 'default', spacing: 'default', shape: 'default' },
};

export const Overview = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.iconButton } } },
    render: (args) => <IconButton {...args} />,
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Edit page' });
        await expect(button).toHaveAttribute('title', 'Edit page');
        await expect(button.getBoundingClientRect().width).toBe(32);
        await expect(button.getBoundingClientRect().height).toBe(32);
    },
};

export const Appearances = {
    render: () => (
        <div style={row}>
            {ICON_BUTTON_APPEARANCES.map((appearance) => (
                <IconButton key={appearance} icon="pen" label={`${title(appearance)} icon button`} appearance={appearance} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('button')).toHaveLength(ICON_BUTTON_APPEARANCES.length);
        await expect(canvas.getByRole('button', { name: 'Primary icon button' })).toHaveClass('plus-btn--primary');
    },
};

export const Spacing = {
    render: () => (
        <div style={row}>
            <IconButton icon="trash" label="Delete default" />
            <IconButton icon="trash" label="Delete compact" spacing="compact" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const rest = canvas.getByRole('button', { name: 'Delete default' });
        const compact = canvas.getByRole('button', { name: 'Delete compact' });
        await expect(rest.getBoundingClientRect().height).toBe(32);
        await expect(compact.getBoundingClientRect().height).toBe(24);
        await expect(compact.getBoundingClientRect().width).toBe(24);
        await expect(px(getComputedStyle(compact).borderTopLeftRadius)).toBe(tokenLength(canvasElement, '--radius-md'));
    },
};

export const Shapes = {
    render: () => (
        <div style={row}>
            <IconButton icon="bars" label="Square menu" />
            <IconButton icon="bars" label="Circle menu" shape="circle" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const circle = within(canvasElement).getByRole('button', { name: 'Circle menu' });
        await expect(getComputedStyle(circle).borderTopLeftRadius).toBe('50%');
    },
};

export const States = {
    render: () => (
        <div style={row}>
            <IconButton icon="list-ul" label="List view" appearance="subtle" isSelected />
            <IconButton icon="list-ul" label="Grid view" appearance="subtle" />
            <IconButton icon="trash" label="Delete disabled" isDisabled />
            <IconButton icon="pen" label="Saving" isLoading />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
        await expect(canvas.getByRole('button', { name: 'Delete disabled' })).toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Saving' })).toHaveAttribute('aria-busy', 'true');
    },
};

/** One story per appearance, state and size, for the Examples tab. */
export const Default = {
    render: () => <IconButton icon="pen" label="Edit page" />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Edit page' })).toBeEnabled();
    },
};

export const Subtle = {
    render: () => <IconButton icon="ellipsis" label="More actions" appearance="subtle" />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'More actions' })).toBeEnabled();
    },
};

export const Primary = {
    render: () => <IconButton icon="paper-plane" label="Send comment" appearance="primary" />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Send comment' })).toBeEnabled();
    },
};

export const Discovery = {
    render: () => <IconButton icon="wand-magic-sparkles" label="Try the new view" appearance="discovery" />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Try the new view' })).toBeEnabled();
    },
};

export const Compact = {
    render: () => <IconButton icon="trash" label="Delete session" spacing="compact" />,
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Delete session' });
        await expect(button.getBoundingClientRect().height).toBe(24);
        await expect(button.getBoundingClientRect().width).toBe(24);
    },
};

export const Circle = {
    render: () => <IconButton icon="bars" label="Open menu" shape="circle" />,
    play: async ({ canvasElement }) => {
        await expect(getComputedStyle(within(canvasElement).getByRole('button', { name: 'Open menu' })).borderTopLeftRadius).toBe('50%');
    },
};

export const Selected = {
    render: () => <IconButton icon="list-ul" label="List view" appearance="subtle" isSelected />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
    },
};

export const Disabled = {
    render: () => <IconButton icon="trash" label="Delete unavailable" isDisabled />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Delete unavailable' })).toBeDisabled();
    },
};

export const Loading = {
    render: () => <IconButton icon="pen" label="Saving" isLoading />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Saving' })).toHaveAttribute('aria-busy', 'true');
    },
};

/** Hovered takes the appearance's hovered step, laid straight on the container. */
export const HoveredState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={row}>
            {ICON_BUTTON_APPEARANCES.map((appearance) => (
                <IconButton key={appearance} icon="plus" label={`${appearance} hover`} appearance={appearance} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const appearance of ICON_BUTTON_APPEARANCES) {
            await expectHovered(canvasElement, canvas.getByRole('button', { name: `${appearance} hover` }), appearance);
        }
    },
};

/** Pressed takes the appearance's pressed step. */
export const PressedState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={row}>
            {ICON_BUTTON_APPEARANCES.map((appearance) => (
                <IconButton key={appearance} icon="plus" label={`${appearance} press`} appearance={appearance} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const appearance of ICON_BUTTON_APPEARANCES) {
            await expectPressed(canvasElement, canvas.getByRole('button', { name: `${appearance} press` }), appearance);
        }
    },
};

/** Tabbing onto it draws the 2px focus ring 2px off the edge, and no fill. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => <IconButton icon="plus" label="Add student" />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, within(canvasElement).getByRole('button', { name: 'Add student' }));
    },
};

export const Interactive = {
    render: (args) => <IconButton {...args} />,
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.iconButton } } },
};
