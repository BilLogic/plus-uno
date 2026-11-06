import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import FilterButton, { FILTER_BUTTON_APPEARANCES } from './FilterButton';

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };

export default {
    title: 'Components/Forms and inputs/Button/Filter button',
    component: FilterButton,
    /** Hide CSF stories from the sidebar; docs live on FilterButton.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs', 'new'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'added', summary: 'Filter button: a filter\'s name with an optional `trailingMetric` count and chevron, `appearance` (default, subtle), `spacing`, `isSelected`, `isDisabled` and `isLoading`.' },
        ],
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        text: { control: 'text', table: { category: 'Content' } },
        trailingMetric: { control: 'text', table: { category: 'Content' } },
        hasChevronDown: { control: 'boolean', table: { category: 'Design' } },
        appearance: { control: 'select', options: FILTER_BUTTON_APPEARANCES, table: { category: 'Design' } },
        spacing: { control: 'inline-radio', options: ['default', 'compact'], table: { category: 'Design' } },
        isSelected: { control: 'boolean', table: { category: 'Behavior' } },
        isDisabled: { control: 'boolean', table: { category: 'Behavior' } },
        isLoading: { control: 'boolean', table: { category: 'Behavior' } },
        onClick: { table: { disable: true } },
    },
    args: { text: 'Status', appearance: 'default', spacing: 'default', hasChevronDown: true },
};

export const Overview = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.filterButton } } },
    render: (args) => <FilterButton {...args} />,
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Status' });
        await expect(button.getBoundingClientRect().height).toBe(32);
        await expect(button.querySelector('.fa-chevron-down')).not.toBeNull();
    },
};

export const Metric = {
    render: () => (
        <div style={row}>
            <FilterButton text="Assignee" trailingMetric={0} />
            <FilterButton text="Subject" trailingMetric={3} />
            <FilterButton text="Grade" trailingMetric="99+" />
            <FilterButton text="Sort" hasChevronDown={false} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvasElement.querySelectorAll('.plus-filter-btn__metric')).toHaveLength(3);
        await expect(canvas.getByRole('button', { name: /Assignee/ })).toHaveTextContent('0');
        await expect(canvas.getByRole('button', { name: 'Sort' }).querySelector('.fa-chevron-down')).toBeNull();
    },
};

export const Appearances = {
    render: () => (
        <div style={row}>
            <FilterButton text="Default" />
            <FilterButton text="Subtle" appearance="subtle" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Default' })).toHaveClass('plus-btn--default');
        await expect(canvas.getByRole('button', { name: 'Subtle' })).toHaveClass('plus-btn--subtle');
    },
};

export const Spacing = {
    render: () => (
        <div style={row}>
            <FilterButton text="Default spacing" />
            <FilterButton text="Compact spacing" spacing="compact" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Default spacing' }).getBoundingClientRect().height).toBe(32);
        await expect(canvas.getByRole('button', { name: 'Compact spacing' }).getBoundingClientRect().height).toBe(24);
    },
};

const Toggle = () => {
    const [on, setOn] = useState(false);
    return <FilterButton text="Mine" hasChevronDown={false} isSelected={on} onClick={() => setOn(!on)} />;
};

export const States = {
    render: () => (
        <div style={row}>
            <Toggle />
            <FilterButton text="Disabled" isDisabled />
            <FilterButton text="Loading" isLoading />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const mine = canvas.getByRole('button', { name: 'Mine' });
        await userEvent.click(mine);
        await expect(mine).toHaveAttribute('aria-pressed', 'true');
        await expect(canvas.getByRole('button', { name: 'Disabled' })).toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
    },
};

/** Selected sets `aria-pressed`; the filter is on. */
export const Selected = {
    render: () => <FilterButton text="Mine" hasChevronDown={false} isSelected />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Mine' })).toHaveAttribute('aria-pressed', 'true');
    },
};

export const Disabled = {
    render: () => <FilterButton text="Status" isDisabled />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Status' })).toBeDisabled();
    },
};

export const Loading = {
    render: () => <FilterButton text="Status" isLoading />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Status' })).toHaveAttribute('aria-busy', 'true');
    },
};

export const Interactive = {
    render: (args) => <FilterButton {...args} />,
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.filterButton } } },
};
