import React, { useState } from 'react';
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
        type: {
            control: 'select',
            options: ['radio', 'checkbox'],
            description: 'Type of selection: radio (single) or checkbox (multiple)',
            table: { category: 'Content' },
        },
        rows: {
            control: 'object',
            description: 'Array of row objects with id and label',
            table: { category: 'Content' },
        },
        columns: {
            control: 'object',
            description: 'Array of column objects with id and label',
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

export const Variants = () => {
    const [radioValues, setRadioValues] = useState({ 'row-1': 'col-2' });
    const [checkboxValues, setCheckboxValues] = useState({
        'row-1': { 'col-1': true, 'col-3': true },
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
            <div>
                <h6 className="h6 mb-2">Radio (one per row)</h6>
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
                <h6 className="h6 mb-2">Checkbox (many per row)</h6>
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

    const rows = args.rows || singleRow;
    const cols = args.columns || columns;

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
    rows: singleRow,
    columns,
    size: 'medium',
    disabled: false,
};
