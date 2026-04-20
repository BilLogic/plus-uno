import React, { useState } from 'react';
import ChoiceGrid from './ChoiceGrid';

export default {
    title: 'Forms/Choice Grid',
    component: ChoiceGrid,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Choice Grid component for making selections in a grid format. Supports both radio buttons (single selection per row) and checkboxes (multiple selections per row).'
            }
        }
    },
    argTypes: {
        type: {
            control: 'select',
            options: ['radio', 'checkbox'],
            description: 'Type of selection: radio (single) or checkbox (multiple)',
            table: { category: 'Content' }
        },
        rows: {
            control: 'object',
            description: 'Array of row objects with id and label',
            table: { category: 'Content' }
        },
        columns: {
            control: 'object',
            description: 'Array of column objects with id and label',
            table: { category: 'Content' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant of the choice grid',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the choice grid',
            table: { category: 'Behavior' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of Choice Grid configurations.
 */
export const Overview = () => {
    const [radioValues, setRadioValues] = useState({
        'row-1': 'col-2'
    });

    const [checkboxValues, setCheckboxValues] = useState({
        'row-1': {
            'col-1': true,
            'col-3': true
        }
    });

    const rows = [
        { id: 'row-1', label: 'Row 1' }
    ];

    const columns = [
        { id: 'col-1', label: 'Column 1' },
        { id: 'col-2', label: 'Column 2' },
        { id: 'col-3', label: 'Column 3' },
        { id: 'col-4', label: 'Column 4' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Radio Grid Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Radio Grid</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Radio button grid allows single selection per row. Only one column can be selected per row.
                </p>
                <ChoiceGrid
                    id="choice-grid-radio"
                    name="choice-grid-radio"
                    type="radio"
                    rows={rows}
                    columns={columns}
                    values={radioValues}
                    onChange={(rowId, columnId) => {
                        setRadioValues({ ...radioValues, [rowId]: columnId });
                    }}
                />
            </section>

            {/* Checkbox Grid Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Checkbox Grid</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Checkbox grid allows multiple selections per row. Multiple columns can be selected per row.
                </p>
                <ChoiceGrid
                    id="choice-grid-checkbox"
                    name="choice-grid-checkbox"
                    type="checkbox"
                    rows={rows}
                    columns={columns}
                    values={checkboxValues}
                    onChange={(newValues) => {
                        setCheckboxValues(newValues);
                    }}
                />
            </section>

            {/* Multiple Rows Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Multiple Rows</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Choice grid with multiple rows, each row can have independent selections.
                </p>
                <ChoiceGrid
                    id="choice-grid-multiple-rows"
                    name="choice-grid-multiple-rows"
                    type="radio"
                    rows={[
                        { id: 'row-1', label: 'Row 1' },
                        { id: 'row-2', label: 'Row 2' },
                        { id: 'row-3', label: 'Row 3' }
                    ]}
                    columns={columns}
                    values={{
                        'row-1': 'col-1',
                        'row-2': 'col-3',
                        'row-3': 'col-2'
                    }}
                    onChange={(rowId, columnId) => {
                        // Handle change
                    }}
                />
            </section>

            {/* Disabled State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled state prevents interaction with the choice grid.
                </p>
                <ChoiceGrid
                    id="choice-grid-disabled"
                    name="choice-grid-disabled"
                    type="radio"
                    rows={rows}
                    columns={columns}
                    values={{ 'row-1': 'col-2' }}
                    disabled
                />
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize the Choice Grid attributes in real-time.
 */
export const Interactive = (args) => {
    const [radioValues, setRadioValues] = useState(args.type === 'radio' ? { 'row-1': 'col-1' } : {});
    const [checkboxValues, setCheckboxValues] = useState(args.type === 'checkbox' ? { 'row-1': { 'col-1': false } } : {});

    const rows = args.rows || [
        { id: 'row-1', label: 'Row 1' }
    ];

    const columns = args.columns || [
        { id: 'col-1', label: 'Column 1' },
        { id: 'col-2', label: 'Column 2' },
        { id: 'col-3', label: 'Column 3' },
        { id: 'col-4', label: 'Column 4' }
    ];

    return (
        <div style={{ maxWidth: '800px' }}>
            <ChoiceGrid
                id="choice-grid-interactive"
                name="choice-grid-interactive"
                type={args.type}
                rows={rows}
                columns={columns}
                values={args.type === 'radio' ? radioValues : checkboxValues}
                size={args.size}
                disabled={args.disabled}
                onChange={args.type === 'radio' 
                    ? (rowId, columnId) => setRadioValues({ ...radioValues, [rowId]: columnId })
                    : (newValues) => setCheckboxValues(newValues)
                }
            />
        </div>
    );
};

Interactive.args = {
    type: 'radio',
    rows: [
        { id: 'row-1', label: 'Row 1' }
    ],
    columns: [
        { id: 'col-1', label: 'Column 1' },
        { id: 'col-2', label: 'Column 2' },
        { id: 'col-3', label: 'Column 3' },
        { id: 'col-4', label: 'Column 4' }
    ],
    size: 'medium',
    disabled: false
};
