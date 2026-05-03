import React, { useEffect, useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import ChoiceGrid from './ChoiceGrid';

export default {
    title: 'Forms/Choice Grid',
    component: ChoiceGrid,
    tags: ['!dev'],
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
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant of the choice grid',
            table: { category: 'Design' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the choice grid',
            table: { category: 'Behavior' },
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
        <div style={{ maxWidth: '800px' }}>
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
        source: { language: 'html', code: webAppSourceSnippets.formChoiceGrid }
    }
};

export const Styles = () => {
    const [radioValues, setRadioValues] = useState({ 'row-1': 'col-2' });
    const [checkboxValues, setCheckboxValues] = useState({
        'row-1': { 'col-1': true, 'col-3': true },
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">RADIO (ONE PER ROW)</span>
                <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Single selection per row.
                </p>
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">CHECKBOX (MANY PER ROW)</span>
                <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Multiple selections per row.
                </p>
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
    <div style={{ maxWidth: '800px' }}>
        <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
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

export const InteractionStates = () => (
    <div style={{ maxWidth: '800px' }}>
        <ChoiceGrid
            id="choice-grid-disabled"
            name="choice-grid-disabled"
            type="radio"
            rows={singleRow}
            columns={columns}
            values={{ 'row-1': 'col-2' }}
            disabled
        />
    </div>
);

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
        <div style={{ maxWidth: '800px' }}>
            <ChoiceGrid
                id="choice-grid-interactive"
                name="choice-grid-interactive"
                type={args.type}
                rows={rows}
                columns={cols}
                values={args.type === 'radio' ? radioValues : checkboxValues}
                size={args.size}
                disabled={args.disabled}
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
    size: 'medium',
    disabled: false,
};
