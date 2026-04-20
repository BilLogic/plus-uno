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
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
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
        },}
};

const sampleOptions = [
    { value: 'option-1', label: 'Option #1' },
    { value: 'option-2', label: 'Option #2' },
    { value: 'option-3', label: 'Option #3' },
    { value: 'option-4', label: 'Option #4' },
    { value: 'option-5', label: 'Option #5' },
];

/** Content — Placeholder and value display in single-select mode. */
export const Content = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: "auto", display: "grid", gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">CLOSED AND EMPTY</span>
                <Select options={sampleOptions} placeholder="Select (a/an) {value} from below" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">CLOSED AND FILLED</span>
                <Select defaultValue="option-1" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
            </div>
        </div>
    )
};

/** Styles — Multi-select, searchable, and creatable behaviors. */
export const Styles = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: "auto", display: "grid", gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MULTI-SELECT</span>
                <Select mode="multi" options={sampleOptions} placeholder="Select {value(s)} from below" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SEARCHABLE</span>
                <Select searchable options={sampleOptions} placeholder="Select (a/an) {value} from below" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">CREATABLE</span>
                <Select mode="multi" searchable creatable options={sampleOptions} placeholder="Select {value(s)} from below" />
            </div>
        </div>
    )
};

/** Sizes — Small, medium, and large. */
export const Sizes = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SMALL</span>
                <Select size="small" options={sampleOptions} placeholder="Select..." />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MEDIUM (DEFAULT)</span>
                <Select size="medium" options={sampleOptions} placeholder="Select..." />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LARGE</span>
                <Select size="large" options={sampleOptions} placeholder="Select..." />
            </div>
        </div>
    )
};

/** InteractionStates — Enabled, disabled, and read-only. */
export const InteractionStates = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: "auto", display: "grid", gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ENABLED</span>
                <Select defaultValue="option-1" options={sampleOptions} placeholder="Select..." />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
                <Select disabled defaultValue="option-1" options={sampleOptions} placeholder="Select..." />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY</span>
                <Select readonly defaultValue="option-1" options={sampleOptions} placeholder="Select..." />
            </div>
        </div>
    )
};

/**
 * Overview
 * Full component showcase with all use cases.
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
                <div className="sb-select-interactive-override" style={{ pointerEvents: "auto", backgroundColor: "rgba(221, 227, 234, 0.16)", borderRadius: 8, padding: 64, display: "flex", justifyContent: "center" }}>
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
                <div className="sb-select-interactive-override" style={{ pointerEvents: "auto", backgroundColor: "rgba(221, 227, 234, 0.16)", borderRadius: 8, padding: 64, display: "grid", gap: 20, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">CLOSED AND EMPTY</span>
                        <Select options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">OPEN AND EMPTY</span>
                        <Select options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">CLOSED AND FILLED</span>
                        <Select defaultValue="option-1" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">OPEN AND FILLED</span>
                        <Select defaultValue="option-3" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Read only and Disabled</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    There are 2 additional special states: Read only (display only, no add/delete/edit) and Disabled (cannot be used temporarily).
                </p>
                <div className="sb-select-interactive-override" style={{ pointerEvents: "auto", backgroundColor: "rgba(221, 227, 234, 0.16)", borderRadius: 8, padding: 64, display: "grid", gap: 20, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY: SINGLE-SELECT</span>
                        <Select readonly defaultValue="option-1" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY: MULTI-SELECT</span>
                        <Select mode="multi" readonly defaultValue={['option-1', 'option-2']} options={sampleOptions} placeholder="Select {value(s)} from below" />
                    </div>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED: SINGLE-SELECT</span>
                        <Select disabled defaultValue="option-1" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED: MULTI-SELECT</span>
                        <Select mode="multi" disabled defaultValue={['option-1', 'option-2']} options={sampleOptions} placeholder="Select {value(s)} from below" />
                    </div>
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Search + Single-Select</h6>
                <div className="sb-select-interactive-override" style={{ pointerEvents: "auto", backgroundColor: "rgba(221, 227, 234, 0.16)", borderRadius: 8, padding: 64, display: "grid", gap: 20, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">OPEN AND EMPTY</span>
                        <Select searchable options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">OPEN AND FILLED</span>
                        <Select searchable defaultValue="option-3" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
                    </div>
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Search + Multi-Select</h6>
                <div className="sb-select-interactive-override" style={{ pointerEvents: "auto", backgroundColor: "rgba(221, 227, 234, 0.16)", borderRadius: 8, padding: 64, display: "grid", gap: 20, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">OPEN AND EMPTY</span>
                        <Select mode="multi" searchable options={sampleOptions} placeholder="Select {value(s)} from below" />
                    </div>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">OPEN AND FILLED</span>
                        <Select mode="multi" searchable defaultValue={['option-1', 'option-2']} options={sampleOptions} placeholder="Select {value(s)} from below" />
                    </div>
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Add New Value + Multi-Select</h6>
                <div className="sb-select-interactive-override" style={{ pointerEvents: "auto", backgroundColor: "rgba(221, 227, 234, 0.16)", borderRadius: 8, padding: 64, display: "grid", gap: 20, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">OPEN AND EMPTY</span>
                        <Select mode="multi" searchable creatable options={sampleOptions} placeholder="Select {value(s)} from below" />
                    </div>
                    <div>
                        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">OPEN AND FILLED</span>
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
