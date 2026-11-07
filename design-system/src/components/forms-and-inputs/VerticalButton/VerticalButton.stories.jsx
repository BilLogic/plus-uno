import React from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import VerticalButton, { VERTICAL_BUTTON_APPEARANCES } from './VerticalButton';
import { expectFocusRing, expectHovered, expectPressed } from '@/storybook-docs/lib/button-states.js';

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
        icon: { control: 'text', table: { category: 'Content' } },
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
        await expect(button.getBoundingClientRect().width).toBe(64);
        await expect(button.getBoundingClientRect().height).toBe(64);
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

export const Selected = {
    render: () => <VerticalButton icon="user-gear" label="Admin" isSelected />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Admin' })).toHaveAttribute('aria-pressed', 'true');
    },
};

export const Disabled = {
    render: () => <VerticalButton icon="user-gear" label="Admin" isDisabled />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Admin' })).toBeDisabled();
    },
};

export const Loading = {
    render: () => <VerticalButton icon="user-gear" label="Admin" isLoading />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Admin' })).toHaveAttribute('aria-busy', 'true');
    },
};

/** Hovered takes the appearance's hovered step, laid straight on the container. */
export const HoveredState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={row}>
            {VERTICAL_BUTTON_APPEARANCES.map((appearance) => (
                <VerticalButton key={appearance} icon="user-gear" label={`${appearance} hover`} appearance={appearance} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const appearance of VERTICAL_BUTTON_APPEARANCES) {
            await expectHovered(canvasElement, canvas.getByRole('button', { name: `${appearance} hover` }), appearance);
        }
    },
};

/** Pressed takes the appearance's pressed step. */
export const PressedState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={row}>
            {VERTICAL_BUTTON_APPEARANCES.map((appearance) => (
                <VerticalButton key={appearance} icon="user-gear" label={`${appearance} press`} appearance={appearance} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const appearance of VERTICAL_BUTTON_APPEARANCES) {
            await expectPressed(canvasElement, canvas.getByRole('button', { name: `${appearance} press` }), appearance);
        }
    },
};

/** Tabbing onto it draws the 2px focus ring 2px off the edge, and no fill. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => <VerticalButton icon="user-gear" label="Admin" />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, within(canvasElement).getByRole('button', { name: 'Admin' }));
    },
};

export const Interactive = {
    render: (args) => <VerticalButton {...args} />,
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.verticalButton } } },
};
