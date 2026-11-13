import React, { useState } from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import ButtonGroup from './ButtonGroup';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { expectFocusRing, expectHovered, expectPressed } from '@/storybook-docs/lib/button-states.js';
import { Button, IconButton } from '@/components';const row = { display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' };

export default {
    title: 'Components/Forms and inputs/Button/Button group',
    component: ButtonGroup,
    /** Hide CSF stories from the sidebar; docs live on ButtonGroup.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs'],
    parameters: {
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

/** Joined: outer corners keep the button radius, inner seams are square. */
export const Seams = {
    render: () => (
        <ButtonGroup label="Seams">
            <Button text="Day" />
            <Button text="Week" />
            <Button text="Month" />
        </ButtonGroup>
    ),
    play: async ({ canvasElement }) => {
        const [a, b, c] = within(canvasElement).getAllByRole('button').map((el) => getComputedStyle(el));
        await expect(a.borderTopLeftRadius).toBe('6px');
        await expect(a.borderBottomLeftRadius).toBe('6px');
        await expect(a.borderTopRightRadius).toBe('0px');
        await expect(a.borderBottomRightRadius).toBe('0px');
        for (const side of ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight']) {
            await expect(b[`border${side}Radius`], `middle ${side}`).toBe('0px');
        }
        await expect(c.borderTopLeftRadius).toBe('0px');
        await expect(c.borderBottomLeftRadius).toBe('0px');
        await expect(c.borderTopRightRadius).toBe('6px');
        await expect(c.borderBottomRightRadius).toBe('6px');
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

/** A hovered member takes the default hovered step and rises above its neighbor. */
export const HoveredState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <ButtonGroup label="Hover example">
            <Button text="Week hover" />
            <Button text="Month hover" />
        </ButtonGroup>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const name of ['Week hover', 'Month hover']) {
            const member = canvas.getByRole('button', { name });
            await expectHovered(canvasElement, member, 'default', name);
            const raised = withForcedPseudo(member, ':hover', () => getComputedStyle(member).zIndex);
            await expect(raised, `${name} rises above its neighbor`).toBe('1');
        }
    },
};

/** A pressed member takes the default pressed step. */
export const PressedState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <ButtonGroup label="Press example">
            <Button text="Week press" />
            <Button text="Month press" />
        </ButtonGroup>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const name of ['Week press', 'Month press']) {
            await expectPressed(canvasElement, canvas.getByRole('button', { name }), 'default', name);
        }
    },
};

/** Tabbing onto a member draws the 2px ring, raised above its neighbor. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => (
        <ButtonGroup label="Focus example">
            <Button text="Week focus" />
            <Button text="Month focus" />
        </ButtonGroup>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const month = canvas.getByRole('button', { name: 'Month focus' });
        await expectFocusRing(canvasElement, canvas.getByRole('button', { name: 'Week focus' }), 'first member');
        await expectFocusRing(canvasElement, month, 'last member');
        month.focus({ focusVisible: true });
        await expect(getComputedStyle(month).zIndex, 'ring sits above the neighbor').toBe('1');
        month.blur();
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
