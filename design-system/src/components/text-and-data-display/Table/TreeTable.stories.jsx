import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { TreeTable } from '@/components/text-and-data-display/Table';
import { tokenColor, tokenLength, px } from '@/storybook-docs/lib/style-probes.js';

/**
 * The Tree table: records nested up to three levels, built in Figma from
 * `_Tree row`. `TreeTable` draws it on the `PatternTable` shell with the
 * shared `TableRow` and `TableCell` parts, and follows the WAI-ARIA treegrid
 * pattern for the keyboard.
 */

export default {
    title: 'Components/Text and data display/Tree table',
    component: TreeTable,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Records that nest, up to three levels. Each level indents one step and keeps every column. The chevron opens a parent; a parent with `hasChildren` and no `children` loads them through `loadChildren`. The table is one tab stop, and the arrow keys move, open and close rows.'
            }
        }
    },
    argTypes: {
        head: { control: 'object', description: 'One `{ key, content, width, align }` per column', table: { category: 'Content' } },
        items: { control: 'object', description: 'One `{ id, cells, children, hasChildren, count }` per row', table: { category: 'Content' } },
        label: { control: 'text', table: { category: 'Content' } },
        emptyMessage: { control: 'text', table: { category: 'Content' } },
        loadChildren: { control: false, table: { category: 'Behavior' } },
        shouldExpandOnClick: { control: 'boolean', table: { category: 'Behavior' } },
        expandedIds: { control: false, table: { category: 'Behavior' } },
        defaultExpandedIds: { control: 'object', table: { category: 'Behavior' } },
        onExpandedChange: { control: false, table: { category: 'Behavior' } },
        size: { control: 'inline-radio', options: [32, 40, 48], table: { category: 'Appearance' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        testId: { control: false, table: { disable: true, category: 'Development' } }
    }
};

const head = {
    cells: [
        { key: 'name', content: 'Name' },
        { key: 'type', content: 'Type' },
        { key: 'sessions', content: 'Sessions', align: 'number' }
    ]
};

const node = (id, name, type, sessions, more = {}) => ({
    id,
    cells: [{ content: name }, { content: type }, { content: String(sessions) }],
    ...more
});

const items = [
    node('lincoln', 'Lincoln Middle', 'School', 54, {
        count: 3,
        children: [
            node('g7', 'Grade 7 · Math', 'Class', 27, {
                count: 2,
                children: [node('ava', 'Ava Thompson', 'Student', 12), node('sofia', 'Sofia Ramirez', 'Student', 15)]
            }),
            node('g8', 'Grade 8 · Math', 'Class', 19, { children: [] }),
            node('g6', 'Grade 6 · Reading', 'Class', 8, {
                children: [node('marcus', 'Marcus Lee', 'Student', 8)]
            })
        ]
    }),
    node('roosevelt', 'Roosevelt K-8', 'School', 31, { hasChildren: true })
];

const row = (canvas, name) => canvas.getByText(name).closest('tr');

export const Overview = {
    args: { head, items, label: 'Schools', defaultExpandedIds: ['lincoln', 'g7', 'g8'] },
    parameters: { docs: { description: { story: 'Each level indents one step and keeps the columns. A parent shows its count; an open parent with nothing in it shows a message row at the child level.' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const grid = canvas.getByRole('treegrid', { name: 'Schools' });
        await expect(grid).toBeVisible();
        const school = row(canvas, 'Lincoln Middle');
        const student = row(canvas, 'Ava Thompson');
        await expect(school).toHaveAttribute('aria-level', '1');
        await expect(school).toHaveAttribute('aria-expanded', 'true');
        await expect(student).toHaveAttribute('aria-level', '3');
        await expect(student).not.toHaveAttribute('aria-expanded');
        const left = (el) => el.querySelector('.plus-table-cell-text').getBoundingClientRect().left;
        const step = tokenLength(canvasElement, '--table-indent');
        await expect(left(row(canvas, 'Grade 7 · Math')) - left(school), 'one step per level').toBeCloseTo(step, 0);
        await expect(left(student) - left(school), 'two steps at level 3').toBeCloseTo(step * 2, 0);
        const chevron = school.querySelector('.plus-tree-table-toggle i');
        await expect(px(getComputedStyle(chevron).fontSize), 'the chevron is 12').toBe(tokenLength(canvasElement, '--icon-sm'));
        const hit = school.querySelector('.plus-tree-table-toggle').getBoundingClientRect();
        await expect(hit.width, 'in a 24 hit area').toBe(tokenLength(canvasElement, '--item-height-sm'));
        await expect(canvas.getByText('Nothing in here yet')).toBeVisible();
    }
};

const loadChildren = (item) => new Promise((resolve) => {
    setTimeout(() => resolve([
        node(`${item.id}-k`, 'Kindergarten · Reading', 'Class', 12),
        node(`${item.id}-g5`, 'Grade 5 · Math', 'Class', 19)
    ]), 400);
});

export const LoadingChildren = {
    args: { head, items, label: 'Schools', loadChildren },
    parameters: { docs: { description: { story: 'A parent with `hasChildren` and no `children` loads them the first time it opens. Until they arrive, the chevron turns into a spinner and a loading message row sits under the parent.' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const school = row(canvas, 'Roosevelt K-8');
        await userEvent.click(school.querySelector('.plus-tree-table-toggle'));
        await expect(school).toHaveAttribute('aria-busy', 'true');
        await waitFor(() => expect(row(canvas, 'Grade 5 · Math')).toHaveAttribute('aria-level', '2'), { timeout: 3000 });
        await expect(school).not.toHaveAttribute('aria-busy');
    }
};

export const Keyboard = {
    args: { head, items, label: 'Schools' },
    parameters: { docs: { description: { story: 'The treegrid is one tab stop. Down and Up move between rows, Home and End jump to the ends. Right opens a closed parent, then moves into it; Left closes an open parent, then moves out to its parent. Enter toggles. A focused row draws a ring, never a fill.' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        const school = row(canvas, 'Lincoln Middle');
        await expect(school).toHaveFocus();
        await expect(getComputedStyle(school).outlineStyle, 'focus is a ring').toBe('solid');
        await userEvent.keyboard('{ArrowRight}');
        await expect(school).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{ArrowRight}');
        await expect(row(canvas, 'Grade 7 · Math')).toHaveFocus();
        await userEvent.keyboard('{End}');
        await expect(row(canvas, 'Roosevelt K-8')).toHaveFocus();
        await userEvent.keyboard('{Home}');
        await userEvent.keyboard('{ArrowDown}');
        await expect(row(canvas, 'Grade 7 · Math')).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        await expect(school).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        await expect(school).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('{Enter}');
        await expect(school).toHaveAttribute('aria-expanded', 'true');
    }
};

export const ExpandOnRowPress = {
    args: { head, items, label: 'Schools', shouldExpandOnClick: true },
    parameters: { docs: { description: { story: 'With `shouldExpandOnClick` a press anywhere on a parent row opens it. Use it only on rows without controls: a press on a control inside the row stays the control\'s own.' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const school = row(canvas, 'Lincoln Middle');
        await userEvent.click(within(school).getByText('School'));
        await expect(school).toHaveAttribute('aria-expanded', 'true');
    }
};

/** Rest: rows are clear; a parent carries the chevron and a leaf keeps the empty box. */
export const Rest = {
    args: { head, items, label: 'Schools', defaultExpandedIds: ['lincoln'] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const parent = row(canvas, 'Lincoln Middle');
        await expect(parent.querySelector('.plus-tree-table-toggle--expanded i')).not.toBeNull();
        const leafToggle = row(canvas, 'Grade 7 · Math').querySelector('.plus-tree-table-toggle');
        await expect(leafToggle).not.toBeNull();
        await expect(getComputedStyle(parent).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    }
};

/** Focused: the focused row draws the 2px ring, inset on the row. */
export const Focused = {
    args: { head, items, label: 'Schools' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        const parent = row(canvas, 'Lincoln Middle');
        await expect(parent).toHaveFocus();
        await expect(getComputedStyle(parent).outlineStyle).toBe('solid');
        await expect(getComputedStyle(parent).outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
    }
};

/** The playground: the overview story's args, with every control live. */
export const Interactive = {
    args: { ...Overview.args }
};
