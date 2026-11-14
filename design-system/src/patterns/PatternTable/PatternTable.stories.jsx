import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { alpha, computedShadow, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import { settleAnimations, withReducedMotion } from '@/storybook-docs/lib/overlay-motion-plays';
import PatternTable from '@/patterns/PatternTable';
import PatternSection from '@/patterns/PatternSection';
import { Checkbox, Button } from '@/components';

const sampleRows = [
    { name: 'Jordan Blake', role: 'Tutor', status: 'Active' },
    { name: 'Casey Rivera', role: 'Coach', status: 'Invited' },
    { name: 'Morgan Lee', role: 'Tutor', status: 'Active' },
];

const tableContent = (
    <>
        <thead>
            <tr>
                <th className="body-small">Name</th>
                <th className="body-small">Role</th>
                <th className="body-small">Status</th>
            </tr>
        </thead>
        <tbody>
            {sampleRows.map((row) => (
                <tr key={row.name}>
                    <td className="body-large">{row.name}</td>
                    <td className="body-large">{row.role}</td>
                    <td className="body-large">{row.status}</td>
                </tr>
            ))}
        </tbody>
    </>
);

/** The Section header carries the title and the actions; the table has no toolbar of its own. */
const sectionActions = (
    <Button text="Add member" appearance="primary" spacing="compact" onClick={() => {}} />
);

const paginationSlot = (
    <span className="body-small" style={{ color: 'var(--ds-text-subtle)' }}>
        Pagination slot — 1 of 4
    </span>
);

/** The empty type of the message row: icon, title, description and the first action. */
const emptyStateSlot = (
    <>
        <i className="fa-regular fa-folder" aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', color: 'var(--ds-icon-subtle)' }} />
        <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>No members yet</span>
        <span style={{ font: 'var(--body-small)' }}>Members you invite show up here.</span>
        <Button text="Invite a member" appearance="subtle" spacing="compact" onClick={() => {}} />
    </>
);

const wideColumns = ['Name', 'Role', 'Status', 'School', 'Platform', 'Sessions', 'Last session', 'Mentor'];
const wideRows = Array.from({ length: 12 }, (_, i) => [
    `Tutor ${i + 1}`, i % 2 ? 'Coach' : 'Tutor', i % 3 ? 'Active' : 'Invited',
    'Lincoln Middle', 'Zoom', `${10 + i}`, `Oct ${i + 1}`, 'Avery Kim',
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

export default {
    title: 'Templates/Table',
    component: PatternTable,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        toolbar: { table: { disable: true } },
        footer: { table: { disable: true } },
        emptyState: { table: { disable: true } },
        empty: {
            control: 'boolean',
            table: { category: 'State' },
        },
        stickyHeader: {
            control: 'boolean',
            table: { category: 'Design' },
        },
        stickyColumn: {
            control: 'boolean',
            table: { category: 'Design' },
        },
        maxHeight: {
            control: 'text',
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
        <PatternTable footer={paginationSlot}>
            {tableContent}
        </PatternTable>
    </PatternSection>
);

/**
 * The empty state sits inside the table, under its head row, as a message row
 * spanning every column; the Section header above stays usable. It is not a
 * data row, so it takes no hover state, and the pager hides with the rows.
 * Held in all four modes.
 */
export const EmptyState = {
    render: () => (
        <PatternSection title="Team members" actions={sectionActions}>
            <PatternTable empty emptyState={emptyStateSlot} footer={paginationSlot}>
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

/**
 * With a sticky column, the message row spans it rather than pinning to it:
 * the head cell stays sticky, the message cell does not.
 */
export const EmptyWithStickyColumn = {
    parameters: { docs: { disable: true } },
    render: () => (
        <PatternTable empty emptyState={emptyStateSlot} stickyColumn stickyHeader maxHeight={240}>
            {tableContent}
        </PatternTable>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const message = canvas.getByText('No members yet').closest('td');
        await expect(getComputedStyle(canvas.getByText('Name')).position, 'the head cell is sticky').toBe('sticky');
        await expect(getComputedStyle(message).position, 'the message cell is not pinned').not.toBe('sticky');
        await expect(getComputedStyle(message).boxShadow, 'the message cell draws no overflow shadow').toBe('none');
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
            footer={paginationSlot}
            emptyState={emptyStateSlot}
            empty={args.empty}
            stickyHeader={args.stickyHeader}
            stickyColumn={args.stickyColumn}
            maxHeight={args.maxHeight || undefined}
        >
            {tableContent}
        </PatternTable>
    ),
    play: async ({ canvasElement }) => {
        const scroll = canvasElement.querySelector('.plus-pattern-table-scroll');
        await expect(getComputedStyle(scroll).borderTopLeftRadius, 'Table radius is 12').toBe('12px');
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
                        <td><Checkbox aria-label={`Select ${row.name}`} isChecked={i === 1} isReadOnly/></td>
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
 * A sticky header and first column in a Section. The sticky cells paint the
 * current surface, so they match what the table sits on, and take the
 * overflow shadow only once content is scrolled under them. Held in all four
 * modes.
 */
export const Sticky = {
    render: () => (
        <div style={{ maxWidth: '480px' }}>
            <PatternSection title="Tutors">
                <PatternTable stickyHeader stickyColumn maxHeight={240}>
                    {wideTable}
                </PatternTable>
            </PatternSection>
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
                await expect(getComputedStyle(head).backgroundColor, `${mode}: a sticky head cell matches the surface it sits on`)
                    .toBe(color('--ds-utility-elevation-surface-current'));
                await expect(getComputedStyle(selectedFirst).backgroundColor, `${mode}: a sticky column cell matches the surface`)
                    .toBe(color('--ds-utility-elevation-surface-current'));
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

/* ---------------------------------------------------- one value per story */

/** `stickyHeader` with `maxHeight`: the head row stays while the rows scroll. */
export const StickyHeader = {
    name: 'Sticky header',
    render: () => (
        <PatternSection title="Tutors">
            <PatternTable stickyHeader maxHeight="var(--card-max-height-sm)">
                {wideTable}
            </PatternTable>
        </PatternSection>
    ),
};

/** `stickyColumn`: the first column stays while the others scroll sideways. */
export const StickyColumn = {
    name: 'Sticky column',
    render: () => (
        <div style={{ maxWidth: 'var(--card-min-width-lg)' }}>
            <PatternSection title="Tutors">
                <PatternTable stickyColumn>
                    {wideTable}
                </PatternTable>
            </PatternSection>
        </div>
    ),
};

/* ------------------------------------------------------------------- motion */

const withProductiveMotion = (Story) => (
    <MotionPreferenceContext.Provider value={false}>
        <Story />
    </MotionPreferenceContext.Provider>
);

const INITIAL_ROSTER = [
    { id: 'jordan', name: 'Jordan Blake', school: 'Lincoln Middle', sessions: 12 },
    { id: 'casey', name: 'Casey Rivera', school: 'Roosevelt Middle', sessions: 6 },
    { id: 'morgan', name: 'Morgan Lee', school: 'North High', sessions: 15 },
];

const ADDED_MEMBER = { id: 'maya', name: 'Maya Lin', school: 'Lincoln Middle', sessions: 9 };

const AddRemoveTableDemo = ({ mode }) => {
    const [rows, setRows] = React.useState(INITIAL_ROSTER);
    const hasMaya = rows.some((row) => row.id === 'maya');
    return (
        <PatternSection
            title="Sessions"
            actions={mode === 'add' ? (
                <Button
                    text={hasMaya ? 'Reset roster' : 'Add session'}
                    appearance="primary"
                    spacing="compact"
                    onClick={() => setRows(hasMaya
                        ? INITIAL_ROSTER
                        : [INITIAL_ROSTER[0], ADDED_MEMBER, ...INITIAL_ROSTER.slice(1)])}
                />
            ) : undefined}
        >
            <PatternTable>
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>School</th>
                        <th>Sessions</th>
                        {mode === 'remove' && <th>Action</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>{row.school}</td>
                            <td>{row.sessions}</td>
                            {mode === 'remove' && (
                                <td>
                                    <Button
                                        text={`Remove ${row.name}`}
                                        appearance="subtle"
                                        spacing="compact"
                                        onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                                    />
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </PatternTable>
        </PatternSection>
    );
};

const playAddRow = (reduced = false) => async ({ canvasElement }) => {
    await settleAnimations(canvasElement);
    const canvas = within(canvasElement);
    const morganBefore = canvas.getByText('Morgan Lee').closest('tr').getBoundingClientRect().top;

    await userEvent.click(canvas.getByRole('button', { name: 'Add session' }));
    const entering = canvasElement.querySelector('[data-row-key="maya"]');
    await expect(entering, 'new row mounts keyed in tbody').not.toBeNull();
    if (reduced) {
        await expect(entering.querySelector('[data-table-seam]'), 'reduced motion skips spatial seam wrapper').toBeNull();
    } else {
        await expect(entering).toHaveAttribute('data-row-motion', 'enter');
    }

    await settleAnimations(canvasElement);
    await waitFor(() => expect(entering.hasAttribute('data-row-motion')).toBe(false));
    await expect(canvas.getByText('Maya Lin')).toBeVisible();
    const morganAfter = canvas.getByText('Morgan Lee').closest('tr').getBoundingClientRect().top;
    await expect(morganAfter, 'rows below moved down to make room').toBeGreaterThan(morganBefore);
};

export const MotionAddRow = {
    name: 'Motion: Add an item',
    decorators: [withProductiveMotion],
    render: () => <AddRemoveTableDemo mode="add" />,
    play: playAddRow(false),
};

export const MotionAddRowReduced = {
    name: 'Motion: Add an item (reduced)',
    decorators: [withReducedMotion],
    render: () => <AddRemoveTableDemo mode="add" />,
    play: playAddRow(true),
};

const playRemoveRow = (reduced = false) => async ({ canvasElement }) => {
    await settleAnimations(canvasElement);
    const canvas = within(canvasElement);
    const caseyRow = canvas.getByText('Casey Rivera').closest('tr');
    const morganRow = canvas.getByText('Morgan Lee').closest('tr');
    const caseyTopBefore = caseyRow.getBoundingClientRect().top;
    const morganTopBefore = morganRow.getBoundingClientRect().top;

    await userEvent.click(canvas.getByRole('button', { name: 'Remove Casey Rivera' }));

    // Exit before reflow: the leaving row stays in place fading out before rows below move into its space.
    const leaving = canvasElement.querySelector('[data-leaving-key="casey"]');
    await expect(leaving, 'leaving row stays mounted during exit fade').not.toBeNull();
    await expect(leaving).toHaveAttribute('data-row-motion', 'exit-fade');
    if (!reduced) {
        const morganDuringFade = morganRow.getBoundingClientRect().top;
        await expect(morganDuringFade, 'rows below hold their space while leaving row fades out')
            .toBeCloseTo(morganTopBefore, 0);
    }

    await waitFor(() => expect(canvasElement.querySelector('[data-leaving-key="casey"]')).toBeNull(), { timeout: 4000 });
    await settleAnimations(canvasElement);
    await expect(canvas.queryByText('Casey Rivera')).toBeNull();
    await expect(morganRow.getBoundingClientRect().top, 'rows below closed up into removed row place')
        .toBeCloseTo(caseyTopBefore, 1);
};

export const MotionRemoveRow = {
    name: 'Motion: Remove an item (exit before reflow)',
    decorators: [withProductiveMotion],
    render: () => <AddRemoveTableDemo mode="remove" />,
    play: playRemoveRow(false),
};

export const MotionRemoveRowReduced = {
    name: 'Motion: Remove an item (reduced)',
    decorators: [withReducedMotion],
    render: () => <AddRemoveTableDemo mode="remove" />,
    play: playRemoveRow(true),
};

const ReorderTableDemo = () => {
    const [descending, setDescending] = React.useState(false);
    const sorted = React.useMemo(() => {
        const copy = [...INITIAL_ROSTER, ADDED_MEMBER];
        copy.sort((a, b) => (descending ? b.sessions - a.sessions : a.name.localeCompare(b.name)));
        return copy;
    }, [descending]);

    return (
        <PatternSection
            title="Students"
            actions={(
                <Button
                    text={descending ? 'Sort by name' : 'Sort by sessions'}
                    appearance="default"
                    spacing="compact"
                    onClick={() => setDescending((prev) => !prev)}
                />
            )}
        >
            <PatternTable>
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>School</th>
                        <th>Sessions</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((row) => (
                        <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>{row.school}</td>
                            <td>{row.sessions}</td>
                        </tr>
                    ))}
                </tbody>
            </PatternTable>
        </PatternSection>
    );
};

const playReorderRows = (reduced = false) => async ({ canvasElement }) => {
    await settleAnimations(canvasElement);
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Sort by sessions' }));
    const morganRow = canvasElement.querySelector('[data-row-key="morgan"]');
    await expect(morganRow).not.toBeNull();
    if (reduced) {
        await expect(getComputedStyle(morganRow).transform, 'reduced reorder never translates').toBe('none');
    } else {
        await expect(morganRow).toHaveAttribute('data-row-motion', 'reorder');
    }

    await settleAnimations(canvasElement);
    await waitFor(() => expect(morganRow.hasAttribute('data-row-motion')).toBe(false), { timeout: 4000 });
    const names = Array.from(canvasElement.querySelectorAll('tbody tr td:first-child')).map((td) => td.textContent);
    await expect(names).toEqual(['Morgan Lee', 'Jordan Blake', 'Maya Lin', 'Casey Rivera']);
};

export const MotionReorderRows = {
    name: 'Motion: Reorder items',
    decorators: [withProductiveMotion],
    render: () => <ReorderTableDemo />,
    play: playReorderRows(false),
};

export const MotionReorderRowsReduced = {
    name: 'Motion: Reorder items (reduced)',
    decorators: [withReducedMotion],
    render: () => <ReorderTableDemo />,
    play: playReorderRows(true),
};

