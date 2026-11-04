import React, { useState } from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import ButtonGroup from './ButtonGroup';
import Button from '@/components/forms-and-inputs/Button/Button';
import IconButton from '@/components/forms-and-inputs/IconButton/IconButton';

const row = { display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' };

export default {
    title: 'Components/Forms and inputs/Button/Button group',
    component: ButtonGroup,
    /** Hide CSF stories from the sidebar; docs live on ButtonGroup.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'A plain container for Button children, each keeping its own appearance and spacing. `appearance`, `spacing`, the `buttons` config array and `vertical` are gone; `ariaLabel` is `label`.' },
        ],
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        children: { table: { disable: true } },
        label: { control: 'text', description: "The group's accessible name. Strongly recommended.", table: { category: 'Content' } },
        testId: { table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
    },
    args: { label: 'Date range' },
};

export const Overview = {
    render: (args) => (
        <ButtonGroup {...args}>
            <Button text="Week" />
            <Button text="Month" />
        </ButtonGroup>
    ),
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.buttonGroup } } },
    play: async ({ canvasElement }) => {
        const group = within(canvasElement).getByRole('group', { name: 'Date range' });
        await expect(group).toHaveClass('plus-button-group');
        await expect(within(group).getAllByRole('button')).toHaveLength(2);
    },
};

export const Appearances = {
    render: () => (
        <ButtonGroup label="Appearances">
            <Button text="Default" />
            <Button text="Primary" appearance="primary" />
        </ButtonGroup>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Default' })).toHaveClass('plus-btn--default');
        await expect(canvas.getByRole('button', { name: 'Primary' })).toHaveClass('plus-btn--primary');
    },
};

export const Spacing = {
    render: () => (
        <div style={row}>
            <ButtonGroup label="Compact group">
                <Button text="Day" spacing="compact" />
                <Button text="Week" spacing="compact" />
            </ButtonGroup>
            <ButtonGroup label="Default group">
                <Button text="Day" />
                <Button text="Week" />
            </ButtonGroup>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const group = canvas.getByRole('group', { name: 'Compact group' });
        const compact = within(group).getByRole('button', { name: 'Day' });
        await expect(compact.getBoundingClientRect().height).toBe(24);
    },
};

export const IconOnly = {
    render: () => {
        const [view, setView] = useState('grid');
        return (
            <ButtonGroup label="View mode">
                <IconButton icon="grip" label="Grid view" isSelected={view === 'grid'} onClick={() => setView('grid')} />
                <IconButton icon="list" label="List view" isSelected={view === 'list'} onClick={() => setView('list')} />
            </ButtonGroup>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Grid view' })).toHaveAttribute('aria-pressed', 'true');
    },
};

export const Selected = {
    render: () => {
        const [range, setRange] = useState('week');
        return (
            <ButtonGroup label="Date range">
                <Button text="Week" isSelected={range === 'week'} onClick={() => setRange('week')} />
                <Button text="Month" isSelected={range === 'month'} onClick={() => setRange('month')} />
            </ButtonGroup>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true');
        await expect(canvas.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'false');
    },
};

export const Interactive = {
    render: (args) => (
        <ButtonGroup {...args}>
            <Button text="Week" />
            <Button text="Month" />
        </ButtonGroup>
    ),
};
