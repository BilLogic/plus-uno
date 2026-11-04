import React from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import LinkButton from './LinkButton';
import { BUTTON_APPEARANCES } from '../Button/Button';

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const title = (name) => name.charAt(0).toUpperCase() + name.slice(1);

export default {
    title: 'Components/Forms and inputs/Button/Link button',
    component: LinkButton,
    /** Hide CSF stories from the sidebar; docs live on LinkButton.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs', 'new'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'added', summary: 'Link button: an anchor drawn as a button, with `href`, `target`, `appearance` and `spacing` and no disabled or loading state.' },
        ],
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        href: { control: 'text', table: { category: 'Content' } },
        text: { control: 'text', table: { category: 'Content' } },
        appearance: { control: 'select', options: BUTTON_APPEARANCES, table: { category: 'Design' } },
        spacing: { control: 'inline-radio', options: ['default', 'compact'], table: { category: 'Design' } },
        shouldFitContainer: { control: 'boolean', table: { category: 'Design' } },
        onClick: { table: { disable: true } },
    },
    args: { href: '#sessions', text: 'View sessions', appearance: 'default', spacing: 'default' },
};

export const Overview = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.linkButton } } },
    render: (args) => <LinkButton {...args} />,
    play: async ({ canvasElement }) => {
        const link = within(canvasElement).getByRole('link', { name: 'View sessions' });
        await expect(link.tagName).toBe('A');
        await expect(link).toHaveAttribute('href', '#sessions');
        await expect(link.getBoundingClientRect().height).toBe(32);
    },
};

export const Appearances = {
    render: () => (
        <div style={row}>
            {BUTTON_APPEARANCES.map((appearance) => (
                <LinkButton key={appearance} href="#sessions" appearance={appearance} text={title(appearance)} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('link')).toHaveLength(BUTTON_APPEARANCES.length);
        await expect(canvas.getByRole('link', { name: 'Primary' })).toHaveClass('plus-btn--primary');
    },
};

export const Spacing = {
    render: () => (
        <div style={row}>
            <LinkButton href="#sessions" text="Default spacing" />
            <LinkButton href="#sessions" text="Compact spacing" spacing="compact" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('link', { name: 'Default spacing' }).getBoundingClientRect().height).toBe(32);
        await expect(canvas.getByRole('link', { name: 'Compact spacing' }).getBoundingClientRect().height).toBe(24);
    },
};

export const WithIcons = {
    render: () => (
        <div style={row}>
            <LinkButton href="#sessions" text="Open schedule" iconBefore="calendar-days" />
            <LinkButton href="https://example.com" target="_blank" text="Read the guide" iconAfter="arrow-up-right-from-square" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const guide = within(canvasElement).getByRole('link', { name: 'Read the guide' });
        await expect(guide).toHaveAttribute('rel', 'noopener noreferrer');
        await expect(guide.querySelector('.plus-btn-visual--after i')).toHaveClass('fa-arrow-up-right-from-square');
    },
};

export const Interactive = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.linkButton } } },
    render: (args) => <LinkButton {...args} />,
};
