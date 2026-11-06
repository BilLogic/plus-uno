import React from 'react';
import { expect, within } from 'storybook/test';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { TableRow, TableCell, HeadCell } from '@/components/text-and-data-display/Table';

/**
 * The Tree table: records nested up to three levels, built in Figma from
 * `_Tree row`. No code component draws the nesting or the expand/collapse
 * behavior yet — this page composes the indentation from the shared
 * `TableRow`/`TableCell` parts the Static and Dynamic tables already use, so
 * the one real implementation stays one implementation. The chevron here is
 * static; wiring it to actually collapse a branch is unbuilt.
 */

export default {
    title: 'Components/Text and data display/Tree table',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Records that nest, up to three levels. No code component owns the nesting yet — this page shows the indentation composed from the shared `_Table` parts, the same parts the Static and Dynamic tables use.'
            }
        }
    }
};

const TreeCell = ({ depth, expandable, children }) => (
    <TableCell
        emphasis="title"
        leading={expandable ? <i className="fa-solid fa-chevron-down" aria-hidden="true" /> : null}
        style={{ paddingLeft: `calc(var(--size-table-cell-pad-x) + ${depth} * var(--space-125))` }}
    >
        {children}
    </TableCell>
);

const ROWS = [
    { depth: 0, expandable: true, name: 'Algebra I', sessions: '12' },
    { depth: 1, expandable: true, name: 'Linear equations', sessions: '5' },
    { depth: 2, expandable: false, name: 'Solving for x', sessions: '2' },
    { depth: 2, expandable: false, name: 'Graphing a line', sessions: '3' },
    { depth: 1, expandable: false, name: 'Quadratics', sessions: '7' },
    { depth: 0, expandable: true, name: 'Geometry', sessions: '9' }
];

export const Overview = () => (
    <div className="plus-table-wrapper">
        <div className="plus-table-scroll">
            <table className="plus-table plus-table-40" data-testid="tree-table">
                <thead>
                    <tr>
                        <HeadCell label="Topic" width="60%" />
                        <HeadCell label="Sessions" align="number" width="40%" />
                    </tr>
                </thead>
                <tbody>
                    {ROWS.map((row) => (
                        <TableRow key={row.name}>
                            <TreeCell depth={row.depth} expandable={row.expandable}>{row.name}</TreeCell>
                            <TableCell align="number">{row.sessions}</TableCell>
                        </TableRow>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

/** Depth sets indentation; a branch's title cell carries the expand chevron. */
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByTestId('tree-table');
    const leaf = within(table).getByText('Solving for x').closest('td');
    const root = within(table).getByText('Algebra I').closest('td');
    const leafPad = parseFloat(getComputedStyle(leaf).paddingLeft);
    const rootPad = parseFloat(getComputedStyle(root).paddingLeft);
    await expect(leafPad, 'a depth-2 row indents further than depth-0').toBeGreaterThan(rootPad);
    await expect(root.querySelector('.fa-chevron-down')).not.toBeNull();
    await expect(leaf.querySelector('.fa-chevron-down')).toBeNull();
};

const treeRow = (canvasElement, name) => within(canvasElement).getByText(name).closest('tr');

/** Rest: a row is clear, its title cell is semibold and the chevron sits in the leading slot. */
export const Rest = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        const row = treeRow(canvasElement, 'Algebra I');
        await expect(getComputedStyle(row).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        await expect(row.querySelector('.fa-chevron-down')).not.toBeNull();
    },
};

/** Hovered: the tree table has no `hover` class, so a row under the pointer does not change. */
export const Hovered = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(treeRow(canvasElement, 'Linear equations'), ':hover', 'tree row');
    },
};

/** Pressed: a row is not a control, so a press does not change it either. */
export const Pressed = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(treeRow(canvasElement, 'Linear equations'), ':active', 'tree row');
    },
};

/** Focused: nothing in the tree table takes focus yet; the chevron is static. */
export const Focused = {
    render: () => <Overview />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(treeRow(canvasElement, 'Algebra I'), 'tree row');
    },
};
