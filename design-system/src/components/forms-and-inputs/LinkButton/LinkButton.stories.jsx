import React from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import LinkButton from './LinkButton';
import { BUTTON_APPEARANCES } from '../Button/Button';
import { expectFocusRing, expectHovered, expectPressed } from '@/storybook-docs/lib/button-states.js';

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

/** Selected draws the selected role fill and sets aria-current. */
export const Selected = {
    render: () => <LinkButton href="#sessions" text="Sessions" isSelected />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('link', { name: 'Sessions' })).toHaveAttribute('aria-current', 'true');
    },
};

/** Hovered takes the appearance's hovered step, laid straight on the container. */
export const HoveredState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={row}>
            {BUTTON_APPEARANCES.map((appearance) => (
                <LinkButton key={appearance} href="#state" text={`${appearance} hover`} appearance={appearance} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const appearance of BUTTON_APPEARANCES) {
            await expectHovered(canvasElement, canvas.getByRole('link', { name: `${appearance} hover` }), appearance);
        }
    },
};

/** Pressed takes the appearance's pressed step. */
export const PressedState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={row}>
            {BUTTON_APPEARANCES.map((appearance) => (
                <LinkButton key={appearance} href="#state" text={`${appearance} press`} appearance={appearance} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const appearance of BUTTON_APPEARANCES) {
            await expectPressed(canvasElement, canvas.getByRole('link', { name: `${appearance} press` }), appearance);
        }
    },
};

/** Tabbing onto it draws the 2px focus ring 2px off the edge, and no fill. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => <LinkButton href="#state" text="Read the guide" />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, within(canvasElement).getByRole('link', { name: 'Read the guide' }));
    },
};

export const Interactive = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.linkButton } } },
    render: (args) => <LinkButton {...args} />,
};
