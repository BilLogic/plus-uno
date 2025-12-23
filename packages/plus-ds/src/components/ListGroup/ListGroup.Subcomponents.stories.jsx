import React, { useState } from 'react';
import ListGroup from './ListGroup';

export default {
    title: 'Components/ListGroup/Subcomponents',
    component: ListGroup.Item,
    subcomponents: {
        'ListGroup.Option': ListGroup.Option,
        'ListGroup.OptionList': ListGroup.OptionList
    },
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Subcomponents for ListGroup: ListGroup.Item for basic list items, ListGroup.Option for selectable options with checkbox/radio, and ListGroup.OptionList for a complete selection list container.'
            }
        }
    },
    argTypes: {
        active: {
            control: 'boolean',
            description: 'Whether the item is active/selected',
            table: { category: 'State' }
        },
        disabled: {
            control: 'boolean',
            description: 'Whether the item is disabled',
            table: { category: 'State' }
        },
        action: {
            control: 'boolean',
            description: 'Makes the item actionable (clickable)',
            table: { category: 'Behavior' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of all ListGroup subcomponents.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '500px' }}>
        {/* ListGroup.Item */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>ListGroup.Item</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Basic list items for displaying content in a vertical list.
            </p>
            <ListGroup>
                <ListGroup.Item>Default item</ListGroup.Item>
                <ListGroup.Item active>Active item</ListGroup.Item>
                <ListGroup.Item disabled>Disabled item</ListGroup.Item>
            </ListGroup>
        </section>

        {/* ListGroup.Option */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>ListGroup.Option</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Selectable options with checkbox (multi) or radio (single) controls.
            </p>
            <OptionDemo />
        </section>

        {/* ListGroup.OptionList */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>ListGroup.OptionList</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Complete selection list container. Pass options array and get selected values.
            </p>
            <OptionListDemo />
        </section>
    </div>
);

// Helper for Option demo
const OptionDemo = () => {
    const [selected, setSelected] = useState(['opt1']);

    const handleToggle = (value) => {
        setSelected(prev =>
            prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]
        );
    };

    return (
        <ListGroup>
            <ListGroup.Option
                value="opt1"
                label="Option One"
                mode="multi"
                checked={selected.includes('opt1')}
                onChange={() => handleToggle('opt1')}
            />
            <ListGroup.Option
                value="opt2"
                label="Option Two"
                mode="multi"
                checked={selected.includes('opt2')}
                onChange={() => handleToggle('opt2')}
            />
            <ListGroup.Option
                value="opt3"
                label="Option Three (Disabled)"
                mode="multi"
                checked={false}
                disabled
            />
        </ListGroup>
    );
};

// Helper for OptionList demo
const OptionListDemo = () => {
    const options = [
        { value: 'react', text: 'React' },
        { value: 'vue', text: 'Vue' },
        { value: 'angular', text: 'Angular' },
        { value: 'svelte', text: 'Svelte' }
    ];

    return (
        <ListGroup.OptionList
            options={options}
            defaultSelectedValues={['react']}
            onChange={(result) => console.log('Selected:', result)}
        />
    );
};

/**
 * Interactive
 * Playground for ListGroup.Item with controls.
 */
export const Interactive = (args) => (
    <ListGroup style={{ maxWidth: '300px' }}>
        <ListGroup.Item
            active={args.active}
            disabled={args.disabled}
            action={args.action}
        >
            {args.children || 'List Item'}
        </ListGroup.Item>
        <ListGroup.Item>Other Item</ListGroup.Item>
    </ListGroup>
);
Interactive.args = {
    children: 'Interactive Item',
    active: false,
    disabled: false,
    action: true
};

/**
 * OptionList Modes
 * Single-select vs. multi-select option lists.
 */
export const OptionListModes = () => {
    const options = [
        { value: '1', text: 'First Option' },
        { value: '2', text: 'Second Option' },
        { value: '3', text: 'Third Option' }
    ];

    return (
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ width: '200px' }}>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Multi-Select</h6>
                <ListGroup.OptionList
                    options={options}
                    defaultSelectedValues={['1', '2']}
                />
            </div>
        </div>
    );
};
