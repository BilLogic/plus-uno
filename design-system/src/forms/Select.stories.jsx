import React, { useEffect, useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
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
                component: 'Enhanced select input with single/multi selection plus optional searchable and creatable modes.'
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Closed, empty</span>
                <Select options={sampleOptions} placeholder="Select (a/an) {value} from below" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Closed, filled</span>
                <Select defaultValue="option-1" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
            </div>
        </div>
    )
};

/** Modes — Multi-select, searchable, and creatable behaviors. */
export const Modes = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: "auto", display: "grid", gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Multi-select</span>
                <Select mode="multi" options={sampleOptions} placeholder="Select {value(s)} from below" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Searchable</span>
                <Select searchable options={sampleOptions} placeholder="Select (a/an) {value} from below" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Creatable</span>
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Small</span>
                <Select size="small" options={sampleOptions} placeholder="Select..." />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Medium (default)</span>
                <Select size="medium" options={sampleOptions} placeholder="Select..." />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Large</span>
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Enabled</span>
                <Select defaultValue="option-1" options={sampleOptions} placeholder="Select..." />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Disabled</span>
                <Select disabled defaultValue="option-1" options={sampleOptions} placeholder="Select..." />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">Read only</span>
                <Select readonly defaultValue="option-1" options={sampleOptions} placeholder="Select..." />
            </div>
        </div>
    )
};

/** Overview — Single-select default for docs landing. */
export const Overview = {
    render: () => (
        <div
            className="sb-select-interactive-override"
            style={{
                pointerEvents: 'auto',
                maxWidth: 400,
                width: '100%',
                minHeight: 48,
                paddingBottom: 320,
            }}
        >
            <Select options={sampleOptions} placeholder="Select (a/an) {value} from below" />
        </div>
    ),
    parameters: {
        docs: {
            source: { language: 'html', code: webAppSourceSnippets.formSelect }
        }
    }
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
