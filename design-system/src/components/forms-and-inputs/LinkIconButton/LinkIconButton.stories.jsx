import React from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import LinkIconButton from './LinkIconButton';
import { ICON_BUTTON_APPEARANCES } from '../IconButton/IconButton';

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const title = (name) => name.charAt(0).toUpperCase() + name.slice(1);

export default {
    title: 'Components/Forms and inputs/Button/Link icon button',
    component: LinkIconButton,
    /** Hide CSF stories from the sidebar; docs live on LinkIconButton.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs', 'new'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'added', summary: 'Link icon button: an icon that navigates, with `href`, `icon`, a required `label`, `appearance`, `spacing` and `shape`.' },
        ],
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        href: { control: 'text', table: { category: 'Content' } },
        icon: { control: 'text', table: { category: 'Content' } },
        label: { control: 'text', table: { category: 'Content' } },
        appearance: { control: 'select', options: ICON_BUTTON_APPEARANCES, table: { category: 'Design' } },
        spacing: { control: 'inline-radio', options: ['default', 'compact'], table: { category: 'Design' } },
        shape: { control: 'inline-radio', options: ['default', 'circle'], table: { category: 'Design' } },
        onClick: { table: { disable: true } },
    },
    args: { href: '#help', icon: 'circle-question', label: 'Open Help Center', appearance: 'default', spacing: 'default', shape: 'default' },
};

export const Overview = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.linkIconButton } } },
    render: (args) => <LinkIconButton {...args} />,
    play: async ({ canvasElement }) => {
        const link = within(canvasElement).getByRole('link', { name: 'Open Help Center' });
        await expect(link.tagName).toBe('A');
        await expect(link).toHaveAttribute('href', '#help');
        await expect(link.getBoundingClientRect().width).toBe(32);
    },
};

export const Appearances = {
    render: () => (
        <div style={row}>
            {ICON_BUTTON_APPEARANCES.map((appearance) => (
                <LinkIconButton key={appearance} href="#help" icon="circle-question" label={`${title(appearance)} help link`} appearance={appearance} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('link')).toHaveLength(ICON_BUTTON_APPEARANCES.length);
        await expect(canvas.getByRole('link', { name: 'Primary help link' })).toHaveClass('plus-btn--primary');
    },
};

export const Spacing = {
    render: () => (
        <div style={row}>
            <LinkIconButton href="#help" icon="circle-question" label="Help default" />
            <LinkIconButton href="#help" icon="circle-question" label="Help compact" spacing="compact" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('link', { name: 'Help default' }).getBoundingClientRect().height).toBe(32);
        await expect(canvas.getByRole('link', { name: 'Help compact' }).getBoundingClientRect().height).toBe(24);
    },
};

export const Selected = {
    render: () => <LinkIconButton href="#help" icon="circle-question" label="Open Help Center" isSelected />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('link', { name: 'Open Help Center' })).toHaveAttribute('aria-current', 'true');
    },
};

export const Interactive = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.linkIconButton } } },
    render: (args) => <LinkIconButton {...args} />,
};
