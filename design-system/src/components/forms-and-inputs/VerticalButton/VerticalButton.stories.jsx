import React from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import VerticalButton, { VERTICAL_BUTTON_APPEARANCES } from './VerticalButton';

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const title = (name) => name.charAt(0).toUpperCase() + name.slice(1);

export default {
    title: 'Components/Forms and inputs/Button/Vertical button',
    component: VerticalButton,
    /** Hide CSF stories from the sidebar; docs live on VerticalButton.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs', 'new'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'added', summary: 'Vertical button: an icon over a label at one size (60 by 60), with `appearance` (default, subtle, primary), `isSelected`, `isDisabled` and `isLoading`.' },
        ],
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        icon: { control: 'text', description: 'Font Awesome Free glyph name', table: { category: 'Content' } },
        label: { control: 'text', table: { category: 'Content' } },
        appearance: { control: 'select', options: VERTICAL_BUTTON_APPEARANCES, table: { category: 'Design' } },
        isSelected: { control: 'boolean', table: { category: 'Behavior' } },
        isDisabled: { control: 'boolean', table: { category: 'Behavior' } },
        isLoading: { control: 'boolean', table: { category: 'Behavior' } },
        onClick: { table: { disable: true } },
    },
    args: { icon: 'user-gear', label: 'Admin', appearance: 'default' },
};

export const Overview = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.verticalButton } } },
    render: (args) => <VerticalButton {...args} />,
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Admin' });
        await expect(button.getBoundingClientRect().width).toBe(60);
        await expect(button.getBoundingClientRect().height).toBe(60);
        const icon = button.querySelector('.plus-btn-visual');
        const text = button.querySelector('.plus-btn-text');
        await expect(icon.getBoundingClientRect().bottom).toBeLessThanOrEqual(text.getBoundingClientRect().top);
    },
};

export const Appearances = {
    render: () => (
        <div style={row}>
            {VERTICAL_BUTTON_APPEARANCES.map((appearance) => (
                <VerticalButton key={appearance} icon="chalkboard-user" label={title(appearance)} appearance={appearance} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('button')).toHaveLength(VERTICAL_BUTTON_APPEARANCES.length);
        await expect(canvas.getByRole('button', { name: 'Primary' })).toHaveClass('plus-btn--primary');
    },
};

export const States = {
    render: () => (
        <div style={row}>
            <VerticalButton icon="user-gear" label="Selected" isSelected />
            <VerticalButton icon="user-gear" label="Disabled" isDisabled />
            <VerticalButton icon="user-gear" label="Loading" isLoading />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Selected' })).toHaveAttribute('aria-pressed', 'true');
        await expect(canvas.getByRole('button', { name: 'Disabled' })).toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
    },
};

export const Interactive = {
    render: (args) => <VerticalButton {...args} />,
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.verticalButton } } },
};
