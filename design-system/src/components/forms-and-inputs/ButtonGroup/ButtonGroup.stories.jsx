import React from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import ButtonGroup from './ButtonGroup';
import { expectFocusRing, expectHovered, expectPressed } from '@/storybook-docs/lib/button-states.js';
import { Button, IconButton } from '@/components';
import { LONG_SCHOOL, expectNoSilentClip, expectInsideWell } from '../../_internal/overflowPlays';

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--stack-2xl) var(--inline-2xl)', alignItems: 'center' };

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
    render: () => (
        <ButtonGroup label="Item actions">
            <IconButton icon="pen" label="Edit" />
            <IconButton icon="copy" label="Duplicate" />
            <IconButton icon="trash" label="Delete" />
        </ButtonGroup>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const name of ['Edit', 'Duplicate', 'Delete']) {
            await expect(canvas.getByRole('button', { name })).not.toHaveAttribute('aria-pressed');
        }
    },
};

/** A plain row: each button keeps its own radius and the gap is the inline step. */
export const Spaced = {
    render: () => (
        <ButtonGroup label="Spaced">
            <Button text="Day" />
            <Button text="Week" />
            <Button text="Month" />
        </ButtonGroup>
    ),
    play: async ({ canvasElement }) => {
        const buttons = within(canvasElement).getAllByRole('button');
        for (const el of buttons) {
            const style = getComputedStyle(el);
            for (const corner of ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight']) {
                await expect(style[`border${corner}Radius`], corner).toBe('6px');
            }
        }
        const [first, second] = buttons.map((el) => el.getBoundingClientRect());
        await expect(Math.round(second.left - first.right), 'gap between buttons').toBe(8);
    },
};

/** A hovered member takes the default hovered step. */
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

/** Tabbing onto a member draws the 2px ring. */
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
        await expectFocusRing(canvasElement, canvas.getByRole('button', { name: 'Week focus' }), 'first member');
        await expectFocusRing(canvasElement, canvas.getByRole('button', { name: 'Month focus' }), 'last member');
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

/** Truncate: buttons that do not fit one row shrink, each label ending in an ellipsis; the group stays on one line inside its well. */
export const Overflow = {
    render: () => (
        <div style={{ width: '260px' /* demo frame */ }}>
            <ButtonGroup label="Sites">
                <Button text={LONG_SCHOOL} />
                <Button text="Lincoln Middle" />
            </ButtonGroup>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const group = canvasElement.querySelector('.plus-btn-group') || canvasElement.firstElementChild.firstElementChild;
        await expectNoSilentClip(canvasElement);
        await expectInsideWell(group, canvasElement.firstElementChild);
        // The exception: a button label ends in an ellipsis with no Tooltip; the full label stays in the accessible name.
        await expect(within(canvasElement).getByRole('button', { name: LONG_SCHOOL })).toBeInTheDocument();
        for (const button of within(canvasElement).getAllByRole('button')) await expect(Math.round(button.getBoundingClientRect().height)).toBe(32);
    },
};
