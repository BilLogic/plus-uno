import React, { useState } from 'react';
import Dropdown from './Dropdown';

export default {
    title: 'Components/Dropdown',
    component: Dropdown,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Dropdown component for displaying actionable lists and menus. Supports multi-select, icons, dividers, and different directions.'
            }
        }
    },
    argTypes: {
        // CONTENT
        buttonText: {
            control: 'text',
            description: 'Text displayed on the dropdown toggle button',
            table: { category: 'Content' }
        },
        items: {
            table: { disable: true, category: 'Content' }
        },

        // DESIGN
        style: {
            control: 'select',
            options: ['default', 'primary', 'secondary', 'success', 'danger', 'warning', 'info'],
            description: 'Button style variant',
            table: { category: 'Design' }
        },
        size: {
            control: 'radio',
            options: ['small', 'default', 'large'],
            description: 'Button size',
            table: { category: 'Design' }
        },
        direction: {
            control: 'select',
            options: ['dropdown', 'dropup', 'dropleft', 'dropright'],
            description: 'Direction the menu opens',
            table: { category: 'Design' }
        },
        split: {
            control: 'boolean',
            description: 'Split button style with separate action and toggle',
            table: { category: 'Design' }
        },

        // DEVELOPMENT
        id: {
            control: 'text',
            description: 'HTML ID attribute',
            table: { category: 'Development' }
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes',
            table: { category: 'Development' }
        }
    }
};

// Sample items for demos
const basicItems = [
    { text: 'Action', onClick: () => console.log('Action clicked') },
    { text: 'Another action', onClick: () => console.log('Another action clicked') },
    { text: 'Something else here', onClick: () => console.log('Something else clicked') }
];

const itemsWithDivider = [
    { text: 'Action' },
    { text: 'Another action' },
    { text: 'Something else', divider: true },
    { text: 'Separated link' }
];

const itemsWithIcons = [
    { text: 'Edit', leadingIcon: 'edit' },
    { text: 'Duplicate', leadingIcon: 'copy' },
    { text: 'Archive', leadingIcon: 'archive', divider: true },
    { text: 'Delete', leadingIcon: 'trash', trailingIcon: 'exclamation-triangle' }
];

const itemsWithSelection = [
    { text: 'Option 1', selected: true },
    { text: 'Option 2' },
    { text: 'Option 3' }
];

/**
 * Overview
 * Comprehensive view of Dropdown variants and configurations.
 */
export const Overview = () => {
    const [multiSelectItems, setMultiSelectItems] = useState([
        { text: 'Option A', multiSelectCheckbox: true, multiSelectChecked: true },
        { text: 'Option B', multiSelectCheckbox: true, multiSelectChecked: false },
        { text: 'Option C', multiSelectCheckbox: true, multiSelectChecked: true }
    ]);

    const toggleMultiSelect = (index) => {
        setMultiSelectItems(items =>
            items.map((item, i) =>
                i === index ? { ...item, multiSelectChecked: !item.multiSelectChecked } : item
            )
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '700px' }}>

            {/* 1. Basic Dropdown */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Basic Dropdown</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Standard dropdown with simple text items.
                </p>
                <Dropdown buttonText="Dropdown" items={basicItems} />
            </section>

            {/* 2. Style Variants */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Style Variants</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Different button styles for various contexts.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Dropdown buttonText="Primary" style="primary" items={basicItems} />
                    <Dropdown buttonText="Secondary" style="secondary" items={basicItems} />
                    <Dropdown buttonText="Success" style="success" items={basicItems} />
                    <Dropdown buttonText="Danger" style="danger" items={basicItems} />
                </div>
            </section>

            {/* 3. Sizes */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Sizes</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Small, default, and large button sizes.
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <Dropdown buttonText="Small" size="small" items={basicItems} />
                    <Dropdown buttonText="Default" size="default" items={basicItems} />
                    <Dropdown buttonText="Large" size="large" items={basicItems} />
                </div>
            </section>

            {/* 4. Split Button */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Split Button</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Separate clickable action from the dropdown toggle.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Dropdown buttonText="Split Action" split items={basicItems} />
                    <Dropdown buttonText="Primary Split" split style="primary" items={basicItems} />
                </div>
            </section>

            {/* 5. Directions */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Directions</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Menus can open in different directions.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '120px', paddingBottom: '120px' }}>
                    <Dropdown buttonText="Dropdown" direction="dropdown" items={basicItems} />
                    <Dropdown buttonText="Dropup" direction="dropup" items={basicItems} />
                    <Dropdown buttonText="Dropright" direction="dropright" items={basicItems} />
                    <Dropdown buttonText="Dropleft" direction="dropleft" items={basicItems} />
                </div>
            </section>

            {/* 6. With Dividers */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>With Dividers</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Group related items using dividers.
                </p>
                <Dropdown buttonText="Actions" items={itemsWithDivider} />
            </section>

            {/* 7. With Icons */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>With Icons</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Items can include leading and trailing icons.
                </p>
                <Dropdown buttonText="Edit Menu" items={itemsWithIcons} />
            </section>

            {/* 8. With Selection Indicator */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>With Selection</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Show currently selected item with a checkmark.
                </p>
                <Dropdown buttonText="Select Option" items={itemsWithSelection} />
            </section>

            {/* 9. Multi-Select */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Multi-Select</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Allow multiple selections with checkboxes.
                </p>
                <Dropdown
                    buttonText="Filter"
                    items={multiSelectItems.map((item, index) => ({
                        ...item,
                        onClick: () => toggleMultiSelect(index)
                    }))}
                />
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize dropdown attributes in real-time.
 */
export const Interactive = {
    args: {
        buttonText: 'Dropdown',
        style: 'default',
        size: 'default',
        direction: 'dropdown',
        split: false
    },
    render: (args) => (
        <div style={{ padding: '100px 50px' }}>
            <Dropdown
                {...args}
                items={[
                    { text: 'Action 1' },
                    { text: 'Action 2' },
                    { text: 'Action 3', divider: true },
                    { text: 'Separated Action' }
                ]}
            />
        </div>
    )
};
