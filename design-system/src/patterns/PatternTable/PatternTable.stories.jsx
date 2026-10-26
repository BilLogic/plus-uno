import React from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { alpha, computedShadow, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import PatternTable from '@/patterns/PatternTable';
import PatternCard from '@/patterns/PatternCard';
import PatternSection from '@/patterns/PatternSection';
import Button from '@/components/forms-and-inputs/Button';
import { Checkbox } from '@/components';

const sampleRows = [
    { name: 'Jordan Blake', role: 'Tutor', status: 'Active' },
    { name: 'Casey Rivera', role: 'Coach', status: 'Invited' },
    { name: 'Morgan Lee', role: 'Tutor', status: 'Active' },
];

const tableContent = (
    <>
        <thead>
            <tr>
                <th className="body3-txt">Name</th>
                <th className="body3-txt">Role</th>
                <th className="body3-txt">Status</th>
            </tr>
        </thead>
        <tbody>
            {sampleRows.map((row) => (
                <tr key={row.name}>
                    <td className="body1-txt">{row.name}</td>
                    <td className="body1-txt">{row.role}</td>
                    <td className="body1-txt">{row.status}</td>
                </tr>
            ))}
        </tbody>
    </>
);

/** The Section header carries the title and the actions; the table has no toolbar of its own. */
const sectionActions = (
    <Button text="Add member" style="primary" fill="filled" size="small" onClick={() => {}} />
);

const paginationSlot = (
    <span className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>
        Pagination slot — 1 of 4
    </span>
);

/** The empty type of the message row: icon, title, description and the first action. */
const emptyStateSlot = (
    <>
        <i className="fa-regular fa-folder" aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', color: 'var(--ds-icon-subtle)' }} />
        <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>No members yet</span>
        <span style={{ font: 'var(--body-small)' }}>Members you invite show up here.</span>
        <Button text="Invite a member" style="primary" fill="text" size="small" onClick={() => {}} />
    </>
);

const wideColumns = ['Name', 'Role', 'Status', 'School', 'Subject', 'Sessions', 'Last session', 'Mentor'];
const wideRows = Array.from({ length: 12 }, (_, i) => [
    `Tutor ${i + 1}`, i % 2 ? 'Coach' : 'Tutor', i % 3 ? 'Active' : 'Invited',
    'Lincoln High', 'Algebra', `${10 + i}`, `Oct ${i + 1}`, 'Avery Kim',
]);

/** Eight columns and twelve rows, the third selected: enough to scroll both ways. */
const wideTable = (
    <>
        <thead>
            <tr>
                {wideColumns.map((col) => <th key={col} style={{ whiteSpace: 'nowrap' }}>{col}</th>)}
            </tr>
        </thead>
        <tbody>
            {wideRows.map((row, i) => (
                <tr key={row[0]} aria-selected={i === 2}>
                    {row.map((value, j) => <td key={wideColumns[j]} style={{ whiteSpace: 'nowrap' }}>{value}</td>)}
                </tr>
            ))}
        </tbody>
    </>
);

/** The table in a Section: the header carries the title and actions, paging stays under the rows — docs section only */
function PatternTableCompositionDemo() {
    return (
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TABLE IN A SECTION</span>
            <PatternSection title="Team members" actions={sectionActions}>
                <PatternTable pagination={paginationSlot}>
                    {tableContent}
                </PatternTable>
            </PatternSection>
        </div>
    );
}

export default {
    title: 'Foundations/Patterns/Table',
    component: PatternTable,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        toolbar: { table: { disable: true } },
        pagination: { table: { disable: true } },
        emptyState: { table: { disable: true } },
        empty: {
            control: 'boolean',
            description: 'Swap the body rows for the empty-state message row; the head row stays',
            table: { category: 'State' },
        },
        stickyHeader: {
            control: 'boolean',
            description: 'Pin the head row while the rows scroll under it; set maxHeight too, or there is nothing to scroll',
            table: { category: 'Design' },
        },
        stickyColumn: {
            control: 'boolean',
            description: 'Pin the first column while the other columns scroll under it',
            table: { category: 'Design' },
        },
        maxHeight: {
            control: 'text',
            description: 'Bound the scroll region height (e.g. 160px); stickyHeader pins only within it',
            table: { category: 'Design' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Overview = () => (
    <PatternSection title="Team members" actions={sectionActions}>
        <PatternTable pagination={paginationSlot}>
            {tableContent}
        </PatternTable>
    </PatternSection>
);

export const Composition = () => <PatternTableCompositionDemo />;

/**
 * The empty state sits inside the table, under its head row, as a message row
 * spanning every column; the Section header above stays usable. It is not a
 * data row, so it takes no hover state, and the pager hides with the rows.
 * Held in all four modes.
 */
export const EmptyState = {
    render: () => (
        <PatternSection title="Team members" actions={sectionActions}>
            <PatternTable empty emptyState={emptyStateSlot} pagination={paginationSlot}>
                {tableContent}
            </PatternTable>
        </PatternSection>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const color = (token) => tokenColor(canvasElement, token);
        const table = canvas.getByRole('table');

        await inEveryColorMode(async (mode) => {
            const message = within(table).getByText('No members yet').closest('td');
            const row = message.closest('tr');
            await expect(within(table).getByRole('columnheader', { name: 'Role' }), `${mode}: the head row stays`).toBeVisible();
            await expect(within(table).queryByText('Jordan Blake'), `${mode}: the body rows are replaced`).toBeNull();
            await expect(message.colSpan, `${mode}: the message spans every column`).toBe(3);
            await expect(row.closest('tbody'), `${mode}: the message is a row of the table body`).not.toBeNull();
            await expect(getComputedStyle(message).color, `${mode}: message text`).toBe(color('--ds-text-subtle'));
            await expect(getComputedStyle(message).borderBottomColor, `${mode}: the message row's rule`).toBe(color('--ds-border'));
            await expect(withForcedPseudo(row, ':hover', () => getComputedStyle(message).backgroundImage), `${mode}: no hover on a message row`)
                .not.toContain(color('--ds-background-neutral-subtle-hovered'));
            await expect(canvas.getByRole('button', { name: 'Add member' }), `${mode}: the Section header stays usable`).toBeEnabled();
            await expect(canvas.queryByText(/Pagination slot/), `${mode}: no pager without rows`).toBeNull();
        });
    },
};

export const Interactive = {
    args: {
        empty: false,
        stickyHeader: false,
        stickyColumn: false,
        maxHeight: '',
    },
    render: (args) => (
        <PatternTable
            pagination={paginationSlot}
            emptyState={emptyStateSlot}
            empty={args.empty}
            stickyHeader={args.stickyHeader}
            stickyColumn={args.stickyColumn}
            maxHeight={args.maxHeight || undefined}
        >
            {tableContent}
        </PatternTable>
    ),
};

/**
 * The deprecated `toolbar` slot still renders above the table, so existing
 * callers keep working while they move their actions to the Section header.
 */
export const DeprecatedToolbar = {
    parameters: { docs: { disable: true } },
    render: () => (
        <PatternTable toolbar={<span>Old toolbar</span>}>
            {tableContent}
        </PatternTable>
    ),
    play: async ({ canvasElement }) => {
        const toolbar = canvasElement.querySelector('.plus-pattern-table-toolbar');
        await expect(toolbar, 'the deprecated toolbar still renders').toHaveTextContent('Old toolbar');
        await expect(toolbar.nextElementSibling, 'above the table').toHaveClass('plus-pattern-table-scroll');
    },
};

/**
 * Row states, layered over each cell's fill: hovered and pressed rows take the
 * neutral subtle steps, and a selected row the selected ladder across the
 * whole row, with no stripe on its leading edge. The row's checkbox is the cue
 * that does not rest on color. The head rule is the bold border. Held in all
 * four modes.
 */
export const RowStates = {
    render: () => (
        <PatternTable>
            <thead>
                <tr>
                    <th><span className="visually-hidden">Select</span></th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {sampleRows.map((row, i) => (
                    <tr key={row.name} aria-selected={i === 1}>
                        <td><Checkbox aria-label={`Select ${row.name}`} checked={i === 1} readOnly /></td>
                        <td>{row.name}</td>
                        <td>{row.role}</td>
                        <td>{row.status}</td>
                    </tr>
                ))}
            </tbody>
        </PatternTable>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const color = (token) => tokenColor(canvasElement, token);
        const layers = (el) => getComputedStyle(el).backgroundImage;

        await inEveryColorMode(async (mode) => {
            const head = canvas.getByText('Name');
            const rest = canvas.getByText('Jordan Blake');
            const selected = canvas.getByText('Casey Rivera');
            const selectedRole = selected.nextElementSibling;
            const selectedLeading = selected.closest('tr').firstElementChild;
            const row = rest.closest('tr');

            await expect(getComputedStyle(head).borderBottomColor, `${mode}: the head rule`).toBe(color('--ds-border-bold'));
            await expect(getComputedStyle(rest).borderBottomColor, `${mode}: a grid line`).toBe(color('--ds-border'));
            await expect(getComputedStyle(rest).color, `${mode}: body text`).toBe(color('--ds-text'));
            await expect(getComputedStyle(head).color, `${mode}: head text`).toBe(color('--ds-text-subtle'));
            await expect(alpha(getComputedStyle(rest).backgroundColor), `${mode}: a cell has no fill of its own`).toBe(0);

            await expect(withForcedPseudo(row, ':hover', () => layers(rest)), `${mode}: a hovered row`)
                .toContain(color('--ds-background-neutral-subtle-hovered'));
            await expect(withForcedPseudo(row, ':active', () => layers(rest)), `${mode}: a pressed row`)
                .toContain(color('--ds-background-neutral-subtle-pressed'));

            await expect(layers(selectedRole), `${mode}: a selected row`).toContain(color('--ds-background-selected'));
            // State is the whole row, never a stripe on its leading edge: the
            // first cell draws the same single layer as the rest, and the
            // checkbox carries the cue that does not rest on color.
            await expect(layers(selectedLeading), `${mode}: the leading cell matches the row`).toBe(layers(selectedRole));
            await expect(layers(selectedLeading), `${mode}: no selected edge on the leading cell`).not.toContain(color('--ds-border-selected'));
            await expect(getComputedStyle(selectedLeading).boxShadow, `${mode}: no inset bar`).toBe('none');
            await expect(getComputedStyle(selectedLeading, '::before').content, `${mode}: no bar drawn before the cell`).toBe('none');
            await expect(canvas.getByLabelText('Select Casey Rivera'), `${mode}: the selected row's checkbox`).toBeChecked();
            await expect(withForcedPseudo(selected.closest('tr'), ':hover', () => layers(selectedRole)), `${mode}: a hovered selected row`)
                .toContain(color('--ds-background-selected-hovered'));
        });
    },
};

/**
 * A sticky header and first column inside a card. The sticky cells paint the
 * current surface, which the card sets to its raised fill, and take the
 * overflow shadow only once content is scrolled under them. Held in all four
 * modes.
 */
export const Sticky = {
    render: () => (
        <div style={{ maxWidth: '480px' }}>
            <PatternCard title="Tutors">
                <PatternTable stickyHeader stickyColumn maxHeight={240}>
                    {wideTable}
                </PatternTable>
            </PatternCard>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const scroller = canvasElement.querySelector('.plus-pattern-table-scroll');
        const head = canvas.getByText('Role');
        const selectedFirst = canvas.getByText('Tutor 3');
        const color = (token) => tokenColor(canvasElement, token);
        const shadow = (el) => getComputedStyle(el).boxShadow;

        try {
            await inEveryColorMode(async (mode) => {
                scroller.scrollTo(0, 0);
                await waitFor(() => expect(scroller.hasAttribute('data-scrolled-y')).toBe(false));
                await expect(getComputedStyle(head).position, `${mode}: the head row is sticky`).toBe('sticky');
                await expect(getComputedStyle(head).backgroundColor, `${mode}: a sticky head cell matches the card it sits in`)
                    .toBe(color('--ds-surface-raised'));
                await expect(getComputedStyle(selectedFirst).backgroundColor, `${mode}: a sticky column cell matches the card`)
                    .toBe(color('--ds-surface-raised'));
                await expect(getComputedStyle(selectedFirst).backgroundImage, `${mode}: a sticky cell keeps the selected row's layer`)
                    .toContain(color('--ds-background-selected'));
                await expect(shadow(head), `${mode}: no shadow before anything scrolls under the header`).toBe('none');

                scroller.scrollTo(40, 40);
                await waitFor(() => expect(scroller.hasAttribute('data-scrolled-y')).toBe(true));
                await waitFor(() => expect(scroller.hasAttribute('data-scrolled-x')).toBe(true));
                const overflow = computedShadow(canvasElement, 'var(--ds-shadow-overflow)');
                await expect(shadow(head), `${mode}: the scrolled header takes the overflow shadow`).toBe(overflow);
                await expect(shadow(selectedFirst), `${mode}: the scrolled column takes the overflow shadow`).toBe(overflow);
            });
        } finally {
            scroller.scrollTo(0, 0);
        }
    },
};

/**
 * `stickyHeader` pairs with `maxHeight`: only a bounded region scrolls
 * vertically, so without it the header is not pinned and the region takes no
 * tab stop it could not use.
 */
export const StickyHeaderNeedsMaxHeight = {
    parameters: { docs: { disable: true } },
    render: () => (
        <PatternTable stickyHeader>
            {tableContent}
        </PatternTable>
    ),
    play: async ({ canvasElement }) => {
        const scroller = canvasElement.querySelector('.plus-pattern-table-scroll');
        await expect(getComputedStyle(within(canvasElement).getByText('Role')).position, 'an unbounded header is not pinned').not.toBe('sticky');
        await expect(scroller.hasAttribute('tabindex'), 'an unbounded region takes no tab stop').toBe(false);
    },
};
