import React from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { px, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import IconButton, { ICON_BUTTON_APPEARANCES } from './IconButton';

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const title = (name) => name.charAt(0).toUpperCase() + name.slice(1);

export default {
    title: 'Components/Forms and inputs/Button/Icon button',
    component: IconButton,
    /** Hide CSF stories from the sidebar; docs live on IconButton.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'added', summary: 'Icon button: `icon`, a required `label`, `appearance` (default, subtle, primary, discovery), `spacing` (default 32, compact 24) and `shape` (default, circle).' },
        ],
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        icon: { control: 'text', description: 'A Font Awesome Free glyph name, or a node.', table: { category: 'Content' } },
        label: { control: 'text', description: 'The accessible name and the tooltip. Sentence case; name the object acted on.', table: { category: 'Content' } },
        appearance: { control: 'select', options: ICON_BUTTON_APPEARANCES, description: 'The visual style.', table: { category: 'Design' } },
        spacing: { control: 'inline-radio', options: ['default', 'compact'], description: 'Height, width and radius: `default` is 32, `compact` is 24. Compact is for tables and tight toolbars.', table: { category: 'Design' } },
        shape: { control: 'inline-radio', options: ['default', 'circle'], description: 'Square or round. Round is for top navigation.', table: { category: 'Design' } },
        isSelected: { control: 'boolean', description: 'Marks the button selected and sets `aria-pressed`.', table: { category: 'Behavior' } },
        isDisabled: { control: 'boolean', description: 'Prevents interaction. Avoid it; see Accessibility.', table: { category: 'Behavior' } },
        isLoading: { control: 'boolean', description: 'Shows a spinner in place of the icon and blocks interaction.', table: { category: 'Behavior' } },
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

export const Interactive = {
    render: (args) => <IconButton {...args} />,
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.iconButton } } },
};
