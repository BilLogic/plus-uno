import React from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { alpha, computedShadow, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { applyColorModes } from '@/storybook-docs/lib/color-modes.js';
import PatternTable from '@/patterns/PatternTable';
import PatternCard from '@/patterns/PatternCard';
import Button from '@/components/forms-and-inputs/Button';

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

const toolbarSlot = (
    <>
        <span className="h6" style={{ margin: 0 }}>Team members</span>
        <div style={{ marginLeft: 'auto' }}>
            <Button text="Add member" style="primary" fill="filled" size="small" onClick={() => {}} />
        </div>
    </>
);

const paginationSlot = (
    <span className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>
        Pagination slot — 1 of 4
    </span>
);

const emptyStateSlot = (
    <>
        <span className="h6" style={{ margin: 0 }}>No members yet</span>
        <span className="body1-txt">Empty-state slot — invite someone to get started.</span>
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

/** Full shell inside a card — docs section only */
function PatternTableCompositionDemo() {
    return (
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TABLE SHELL INSIDE A CARD</span>
            <PatternCard>
                <PatternTable toolbar={toolbarSlot} pagination={paginationSlot}>
                    {tableContent}
                </PatternTable>
            </PatternCard>
        </div>
    );
}

/** Empty state */
function PatternTableEmptyDemo() {
    return (
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">EMPTY STATE</span>
            <PatternCard>
                <PatternTable toolbar={toolbarSlot} empty emptyState={emptyStateSlot} />
            </PatternCard>
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
            description: 'Show the empty-state slot instead of the table',
            table: { category: 'State' },
        },
        stickyHeader: {
            control: 'boolean',
            description: 'Pin the head row while the rows scroll under it',
            table: { category: 'Design' },
        },
        stickyColumn: {
            control: 'boolean',
            description: 'Pin the first column while the other columns scroll under it',
            table: { category: 'Design' },
        },
        maxHeight: {
            control: 'text',
            description: 'Bound the scroll region height',
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
    <PatternTable toolbar={toolbarSlot} pagination={paginationSlot}>
        {tableContent}
    </PatternTable>
);

export const Composition = () => <PatternTableCompositionDemo />;

export const EmptyState = () => <PatternTableEmptyDemo />;

export const Interactive = {
    args: {
        empty: false,
        stickyHeader: false,
        stickyColumn: false,
        maxHeight: '',
    },
    render: (args) => (
        <PatternTable
            toolbar={toolbarSlot}
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

/** Light, dark, and each at more contrast: the four modes a table is held in. */
const MODES = [
    ['light', 'no-preference'],
    ['dark', 'no-preference'],
    ['light', 'more'],
    ['dark', 'more'],
];

/** Runs `check` once per mode, then puts <html> back as the toolbar left it. */
const inEveryMode = async (check) => {
    const root = document.documentElement;
    const saved = ['data-color-mode', 'data-contrast-mode', 'data-bs-theme'].map((name) => [name, root.getAttribute(name)]);
    try {
        for (const [colorMode, contrastMode] of MODES) {
            applyColorModes(colorMode, contrastMode);
            await check(`${colorMode}, ${contrastMode} contrast`);
        }
    } finally {
        saved.forEach(([name, value]) => (value === null ? root.removeAttribute(name) : root.setAttribute(name, value)));
    }
};

/**
 * Row states, layered over each cell's fill: hovered and pressed rows take the
 * neutral subtle steps, and a selected row the selected ladder with a 2px
 * Lagoon bar at its leading edge. The head rule is the bold border. Held in
 * all four modes.
 */
export const RowStates = {
    render: () => (
        <PatternTable>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {sampleRows.map((row, i) => (
                    <tr key={row.name} aria-selected={i === 1}>
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

        await inEveryMode(async (mode) => {
            const head = canvas.getByText('Name');
            const rest = canvas.getByText('Jordan Blake');
            const selected = canvas.getByText('Casey Rivera');
            const selectedRole = selected.nextElementSibling;
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
            await expect(layers(selected), `${mode}: the selected bar`).toContain(color('--ds-border-selected'));
            await expect(getComputedStyle(selected).backgroundSize, `${mode}: the bar is 2px`).toMatch(/^2px 100%/);
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
            await inEveryMode(async (mode) => {
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
