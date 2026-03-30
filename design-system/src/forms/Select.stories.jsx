import React, { useEffect, useState } from 'react';
import Select from './Select';

/**
 * Select Component
 * 
 * Enhanced dropdown select with single/multi-select modes, searchable,
 * and creatable options. Uses ListGroup.Item for option rendering.
 */
export default {
    title: 'Forms/Select',
    component: Select,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `Enhanced Select component with custom dropdown popup.

| Feature | Description |
|---------|-------------|
| **Single Select** | Radio-style selection |
| **Multi Select** | Checkbox-style with dismissible badges |
| **Searchable** | Filter options by typing |
| **Creatable** | Add new values on the fly |
| **Sizes** | small, medium (default), large |`
            }
        }
    },
    argTypes: {
        mode: {
            control: { type: 'select' },
            options: ['single', 'multi'],
            table: { category: 'Design' }
        },
        size: {
            control: { type: 'select' },
            options: ['small', 'medium', 'large'],
            table: { category: 'Design' }
        },
        displayMode: {
            control: { type: 'select' },
            options: ['badges', 'text'],
            table: { category: 'Design' }
        },
        placeholder: {
            control: 'text',
            table: { category: 'Content' }
        },
        searchable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        creatable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        disabled: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        readonly: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        required: {
            table: { disable: true, category: 'Development' }
        },
        options: {
            table: { disable: true, category: 'Development' }
        },
        value: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        defaultValue: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onChange: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        defaultOpen: {
            table: { disable: true, category: 'Development' }
        },
        defaultSearchTerm: {
            table: { disable: true, category: 'Development' }
        },
        lineWrap: {
            table: { disable: true, category: 'Development' }
        },
        truncate: {
            table: { disable: true, category: 'Development' }
        },
        open: {
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        name: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        style: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};

const sampleOptions = [
    { value: 'option-1', label: 'Option #1' },
    { value: 'option-2', label: 'Option #2' },
    { value: 'option-3', label: 'Option #3' },
    { value: 'option-4', label: 'Option #4' },
    { value: 'option-5', label: 'Option #5' },
];

/**
 * Overview
 * Matches Figma content/copy, using the standard Forms overview vertical layout.
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Use Cases */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Use Cases</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    There are five types of Select uses: Single-select, Multi-select, Search + Single-select, Search + Multi-select, Add New Value + multi-select.
                </p>
                <div style={{ backgroundColor: 'rgba(221, 227, 234, 0.16)', borderRadius: 8, padding: 64, display: 'flex', justifyContent: 'center' }}>
                    <Select
                        mode="multi"
                        searchable
                        creatable
                        options={sampleOptions}
                        placeholder="Select {value(s)} from below"
                        style={{ maxWidth: 400 }}
                    />
                </div>
            </section>

            {/* When Activated */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>When Activated</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    When activated, Select has 4 states: closed and empty, open and empty, closed and filled, open and filled.
                </p>
                <div style={{ backgroundColor: 'rgba(221, 227, 234, 0.16)', borderRadius: 8, padding: 64, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Closed and Empty</div>
                        <Select options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Open and Empty</div>
                        <Select options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Closed and Filled</div>
                        <Select defaultValue="option-1" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Open and Filled</div>
                        <Select defaultValue="option-3" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Read only and Disabled</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    There are 2 additional special states: Read only (display only, no add/delete/edit) and Disabled (cannot be used temporarily).
                </p>
                <div style={{ backgroundColor: 'rgba(221, 227, 234, 0.16)', borderRadius: 8, padding: 64, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Read Only: Single-select</div>
                        <Select readonly defaultValue="option-1" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Read Only: Multi-select</div>
                        <Select mode="multi" readonly defaultValue={['option-1', 'option-2']} options={sampleOptions} placeholder="Select {value(s)} from below" />
                    </div>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Disabled: Single-select</div>
                        <Select disabled defaultValue="option-1" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Disabled: Multi-select</div>
                        <Select mode="multi" disabled defaultValue={['option-1', 'option-2']} options={sampleOptions} placeholder="Select {value(s)} from below" />
                    </div>
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Search + Single-Select</h6>
                <div style={{ backgroundColor: 'rgba(221, 227, 234, 0.16)', borderRadius: 8, padding: 64, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Open and Empty</div>
                        <Select searchable options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Open and Filled</div>
                        <Select searchable defaultValue="option-3" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Search + Multi-Select</h6>
                <div style={{ backgroundColor: 'rgba(221, 227, 234, 0.16)', borderRadius: 8, padding: 64, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Open and Empty</div>
                        <Select mode="multi" searchable options={sampleOptions} placeholder="Select {value(s)} from below" />
                    </div>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Open and Filled</div>
                        <Select mode="multi" searchable defaultValue={['option-1', 'option-2']} options={sampleOptions} placeholder="Select {value(s)} from below" />
                    </div>
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Add New Value + Multi-Select</h6>
                <div style={{ backgroundColor: 'rgba(221, 227, 234, 0.16)', borderRadius: 8, padding: 64, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Open and Empty</div>
                        <Select mode="multi" searchable creatable options={sampleOptions} placeholder="Select {value(s)} from below" />
                    </div>
                    <div>
                        <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>Open and Filled</div>
                        <Select mode="multi" searchable creatable defaultValue={['option-1', 'option-2', 'option-3', 'option-4']} options={sampleOptions} placeholder="Select {value(s)} from below" />
                    </div>
                </div>
            </section>
        </div>
    )
};

/**
 * Interactive
 * Full playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [value, setValue] = useState(args.mode === 'multi' ? [] : '');

        useEffect(() => {
            setValue(args.mode === 'multi' ? [] : '');
        }, [args.mode]);

        return (
            <div style={{ maxWidth: '400px' }}>
                <p className="body3-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Selected: {args.mode === 'multi'
                        ? (value.length > 0 ? value.join(', ') : 'None')
                        : (value || 'None')
                    }
                </p>
                <Select
                    mode={args.mode}
                    placeholder={args.placeholder}
                    searchable={args.searchable}
                    creatable={args.creatable}
                    displayMode={args.displayMode}
                    size={args.size}
                    disabled={args.disabled}
                    readonly={args.readonly}
                    options={sampleOptions}
                    value={value}
                    onChange={setValue}
                />
            </div>
        );
    },
    args: {
        mode: 'single',
        placeholder: 'Select...',
        searchable: false,
        creatable: false,
        displayMode: 'badges',
        size: 'medium',
        disabled: false,
        readonly: false
    }
};
