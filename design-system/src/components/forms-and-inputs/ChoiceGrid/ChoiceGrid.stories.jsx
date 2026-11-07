import React, { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import ChoiceGrid from './ChoiceGrid';

export default {
    title: 'Components/Forms and inputs/Radio/Choice grid',
    component: ChoiceGrid,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Choice Grid component for making selections in a grid format. Supports both radio buttons (single selection per row) and checkboxes (multiple selections per row).',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        type: {
            control: 'select',
            options: ['radio', 'checkbox'],
            description: 'Type of selection: radio (single) or checkbox (multiple)',
            table: { category: 'Content' },
        },
        rows: {
            table: { disable: true, category: 'Development' },
        },
        columns: {
            table: { disable: true, category: 'Development' },
        },
        rowCount: {
            control: { type: 'range', min: 1, max: 4, step: 1 },
            description: 'Number of rows in the demo grid',
            table: { category: 'Content' },
        },
        columnCount: {
            control: { type: 'range', min: 2, max: 4, step: 1 },
            description: 'Number of columns in the demo grid',
            table: { category: 'Content' },
        },
        isDisabled: {
            control: 'boolean',
            description: 'Disable the choice grid',
            table: { category: 'Behavior' },
        },
        size: {
            control: 'select',
            options: [12, 14, 16],
            description: 'Option-label font size in px, and the control width that goes with it. Unset keeps the default rendering.',
            table: { category: 'Design' },
        },
    },
};

const columns = [
    { id: 'col-1', label: 'Column 1' },
    { id: 'col-2', label: 'Column 2' },
    { id: 'col-3', label: 'Column 3' },
    { id: 'col-4', label: 'Column 4' },
];

const singleRow = [{ id: 'row-1', label: 'Row 1' }];

const overviewColumns = columns.slice(0, 3);

export const Overview = () => {
    const [radioValues, setRadioValues] = useState({ 'row-1': 'col-2' });

    return (
        <div style={{ maxWidth: 'var(--size-5400)' }}>
            <ChoiceGrid
                id="choice-grid-overview"
                name="choice-grid-overview"
                type="radio"
                rows={singleRow}
                columns={overviewColumns}
                values={radioValues}
                onChange={(rowId, columnId) => {
                    setRadioValues({ ...radioValues, [rowId]: columnId });
                }}
            />
        </div>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formChoiceGrid }
    }
};

export const Variants = () => {
    const [radioValues, setRadioValues] = useState({ 'row-1': 'col-2' });
    const [checkboxValues, setCheckboxValues] = useState({
        'row-1': { 'col-1': true, 'col-3': true },
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)', maxWidth: 'var(--size-5400)' }}>
            <div>
                <span style={{ display: 'block', marginBottom: 'var(--space-050)', font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Radio (one per row)</span>
                <ChoiceGrid
                    id="choice-grid-radio"
                    name="choice-grid-radio"
                    type="radio"
                    rows={singleRow}
                    columns={columns}
                    values={radioValues}
                    onChange={(rowId, columnId) => {
                        setRadioValues({ ...radioValues, [rowId]: columnId });
                    }}
                />
            </div>
            <div>
                <span style={{ display: 'block', marginBottom: 'var(--space-050)', font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Checkbox (multiple per row)</span>
                <ChoiceGrid
                    id="choice-grid-checkbox"
                    name="choice-grid-checkbox"
                    type="checkbox"
                    rows={singleRow}
                    columns={columns}
                    values={checkboxValues}
                    onChange={(newValues) => {
                        setCheckboxValues(newValues);
                    }}
                />
            </div>
        </div>
    );
};

export const Layout = () => (
    <div style={{ maxWidth: 'var(--size-5400)' }}>
        <p className="body2-txt mb-3" style={{ color: 'var(--ds-text-subtle)' }}>
            Multiple rows share the same columns; each row tracks its own selection.
        </p>
        <ChoiceGrid
            id="choice-grid-multiple-rows"
            name="choice-grid-multiple-rows"
            type="radio"
            rows={[
                { id: 'row-1', label: 'Row 1' },
                { id: 'row-2', label: 'Row 2' },
                { id: 'row-3', label: 'Row 3' },
            ]}
            columns={columns}
            values={{
                'row-1': 'col-1',
                'row-2': 'col-3',
                'row-3': 'col-2',
            }}
            onChange={() => {}}
        />
    </div>
);

/** `size` sets the option-label font and the control width that goes with it. */
export const Size = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)', maxWidth: 'var(--size-5400)' }}>
        {[12, 14, 16].map((size) => (
            <div key={size}>
                <span style={{ display: 'block', marginBottom: 'var(--space-050)', font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{size}</span>
                <ChoiceGrid
                    id={`choice-grid-size-${size}`}
                    name={`choice-grid-size-${size}`}
                    type="radio"
                    rows={singleRow}
                    columns={overviewColumns}
                    values={{ 'row-1': 'col-2' }}
                    size={size}
                    onChange={() => {}}
                />
            </div>
        ))}
    </div>
);
Size.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wrappers = canvas.getAllByRole('radio', { name: 'Row 1 Column 2' })
        .map((radio) => radio.closest('.plus-choice-grid-wrapper'));
    await expect(wrappers.map((w) => w.getAttribute('data-size'))).toEqual(['12', '14', '16']);
};

export const InteractionStates = () => (
    <div style={{ maxWidth: 'var(--size-5400)' }}>
        <ChoiceGrid
            id="choice-grid-disabled"
            name="choice-grid-disabled"
            type="radio"
            rows={singleRow}
            columns={columns}
            values={{ 'row-1': 'col-2' }}
            isDisabled
        />
    </div>
);

/**
 * Two grids with no `id` or `name`. Each gets its own ids and radio names, so
 * answering a row in one leaves the other alone.
 */
export const TwoGridsWithoutIds = () => {
    const [first, setFirst] = useState({});
    const [second, setSecond] = useState({});
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)', maxWidth: 'var(--size-5400)' }}>
            <ChoiceGrid
                type="radio"
                rows={singleRow}
                columns={overviewColumns}
                values={first}
                onChange={(rowId, columnId) => setFirst({ ...first, [rowId]: columnId })}
            />
            <ChoiceGrid
                type="radio"
                rows={singleRow}
                columns={overviewColumns}
                values={second}
                onChange={(rowId, columnId) => setSecond({ ...second, [rowId]: columnId })}
            />
        </div>
    );
};
TwoGridsWithoutIds.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio', { name: 'Row 1 Column 1' });
    await expect(radios).toHaveLength(2);
    await expect(radios[0].id).not.toBe(radios[1].id);
    await expect(radios[0].nextElementSibling.name).not.toBe(radios[1].nextElementSibling.name);

    await userEvent.click(radios[0]);
    await userEvent.click(radios[1]);
    await expect(radios[0].nextElementSibling.checked).toBe(true);
    await expect(radios[1].nextElementSibling.checked).toBe(true);
};

/** Read-only: the answers show, and clicking a cell does not change them. */
export const ReadOnly = () => (
    <div style={{ maxWidth: 'var(--size-5400)' }}>
        <ChoiceGrid
            id="choice-grid-readonly"
            type="checkbox"
            rows={singleRow}
            columns={overviewColumns}
            values={{ 'row-1': { 'col-1': true } }}
            isReadOnly
            onChange={() => {
                throw new Error('a read-only grid reported a change');
            }}
        />
    </div>
);
ReadOnly.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByRole('checkbox', { name: 'Row 1 Column 2' });
    await expect(cell.getAttribute('aria-readonly')).toBe('true');
    await userEvent.click(cell);
    await expect(cell.nextElementSibling.checked).toBe(false);
};

export const Interactive = (args) => {
    const [radioValues, setRadioValues] = useState(args.type === 'radio' ? { 'row-1': 'col-1' } : {});
    const [checkboxValues, setCheckboxValues] = useState(
        args.type === 'checkbox' ? { 'row-1': { 'col-1': false } } : {},
    );

    useEffect(() => {
        setRadioValues(args.type === 'radio' ? { 'row-1': 'col-1' } : {});
        setCheckboxValues(args.type === 'checkbox' ? { 'row-1': { 'col-1': false } } : {});
    }, [args.type, args.rowCount, args.columnCount]);

    const rows = Array.from({ length: args.rowCount || 1 }, (_, index) => ({
        id: `row-${index + 1}`,
        label: `Row ${index + 1}`
    }));
    const cols = columns.slice(0, args.columnCount || columns.length);

    return (
        <div style={{ maxWidth: 'var(--size-5400)' }}>
            <ChoiceGrid
                id="choice-grid-interactive"
                name="choice-grid-interactive"
                type={args.type}
                rows={rows}
                columns={cols}
                values={args.type === 'radio' ? radioValues : checkboxValues}
                isDisabled={args.isDisabled}
                onChange={
                    args.type === 'radio'
                        ? (rowId, columnId) => setRadioValues({ ...radioValues, [rowId]: columnId })
                        : (newValues) => setCheckboxValues(newValues)
                }
            />
        </div>
    );
};

Interactive.args = {
    type: 'radio',
    rowCount: singleRow.length,
    columnCount: columns.length,
    isDisabled: false,
};

/** A radio row shares one real Base UI group, so the arrow keys roam the whole row, same as the native `name`-grouped inputs it replaces. */
export const Keyboard = () => {
    const [radioValues, setRadioValues] = useState({ 'row-1': 'col-1' });

    return (
        <div style={{ maxWidth: 'var(--size-5400)' }}>
            <ChoiceGrid
                id="choice-grid-keyboard"
                name="choice-grid-keyboard"
                type="radio"
                rows={singleRow}
                columns={overviewColumns}
                values={radioValues}
                onChange={(rowId, columnId) => {
                    setRadioValues({ ...radioValues, [rowId]: columnId });
                }}
            />
        </div>
    );
};
Keyboard.parameters = { docs: { disable: true } };
Keyboard.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');

    radios[0].focus();
    await expect(radios[0]).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(radios[1]).toHaveFocus();
    await expect(radios[1]).toHaveAttribute('aria-checked', 'true');

    await userEvent.keyboard('{ArrowRight}');
    await expect(radios[2]).toHaveFocus();
    await expect(radios[2]).toHaveAttribute('aria-checked', 'true');

    await userEvent.keyboard('{ArrowLeft}');
    await expect(radios[1]).toHaveFocus();
};

/** One story per state, for the Examples tab. */
const frame = { maxWidth: 'var(--size-5400)' };
const cell = (canvasElement, name, role = 'radio') => within(canvasElement).getByRole(role, { name });

export const Unselected = {
    render: () => (
        <div style={frame}>
            <ChoiceGrid id="cg-ex-off" type="radio" rows={singleRow} columns={overviewColumns} values={{}} onChange={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(cell(canvasElement, 'Row 1 Column 2')).toHaveAttribute('aria-checked', 'false');
    },
};

export const Selected = {
    render: () => (
        <div style={frame}>
            <ChoiceGrid id="cg-ex-on" type="radio" rows={singleRow} columns={overviewColumns} values={{ 'row-1': 'col-2' }} onChange={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const el = cell(canvasElement, 'Row 1 Column 2');
        await expect(el).toHaveAttribute('aria-checked', 'true');
        await expect(getComputedStyle(el).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected-bold'));
    },
};

export const Hovered = {
    render: () => (
        <div style={frame}>
            <ChoiceGrid id="cg-ex-hover" type="radio" rows={singleRow} columns={overviewColumns} values={{}} onChange={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const el = cell(canvasElement, 'Row 1 Column 1');
        el.style.transition = 'none';
        const border = withForcedPseudo(el, ':hover', () => getComputedStyle(el).borderTopColor);
        await expect(border).toBe(tokenColor(canvasElement, '--ds-border-brand'));
    },
};

export const Focused = {
    render: () => (
        <div style={frame}>
            <ChoiceGrid id="cg-ex-focus" type="checkbox" rows={singleRow} columns={overviewColumns} values={{ 'row-1': { 'col-1': true } }} onChange={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const el = cell(canvasElement, 'Row 1 Column 1', 'checkbox');
        el.style.transition = 'none';
        el.focus({ focusVisible: true });
        const style = getComputedStyle(el);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(px(style.outlineWidth)).toBe(2);
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        el.blur();
    },
};

export const Disabled = {
    render: () => (
        <div style={frame}>
            <ChoiceGrid id="cg-ex-disabled" type="radio" rows={singleRow} columns={overviewColumns} values={{ 'row-1': 'col-2' }} isDisabled />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const el = cell(canvasElement, 'Row 1 Column 1');
        await expect(el).toHaveAttribute('data-disabled');
        await expect(getComputedStyle(el).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-disabled'));
    },
};
