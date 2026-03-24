import React, { useState } from 'react';
import Dropdown from './Dropdown';

export default {
    title: 'Components/Dropdown',
    component: Dropdown,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Dropdown component for displaying actionable lists and menus. Supports multi-select, icons, dividers, and different directions.'
            }
        }
    },
    argTypes: {
        buttonText: {
            control: 'text',
            description: 'Text displayed on the dropdown toggle button',
            table: { category: 'Content' }
        },
        items: {
            table: { disable: true, category: 'Content' }
        },
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
        fill: {
            control: 'select',
            options: ['filled', 'tonal', 'outline', 'ghost'],
            description: 'Button fill style',
            table: { category: 'Design' }
        },
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

const dropdownCol = { display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '700px' };
const contentVariantCard = {
    padding: '12px',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '12px',
    background: 'var(--color-surface-container-low)',
};

function DropdownContentDemos() {
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
        <>
            <section>
                <h6 className="h6" style={{ marginBottom: '8px' }}>Basic</h6>
                <p className="plus-body-2" style={{ marginBottom: '12px', color: 'var(--color-neutral-text)' }}>
                    Standard dropdown with simple text items.
                </p>
                <div style={contentVariantCard}>
                    <Dropdown buttonText="Dropdown" items={basicItems} />
                </div>
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '8px' }}>With dividers</h6>
                <p className="plus-body-2" style={{ marginBottom: '12px', color: 'var(--color-neutral-text)' }}>
                    Group related items using dividers.
                </p>
                <div style={contentVariantCard}>
                    <Dropdown buttonText="Actions" items={itemsWithDivider} />
                </div>
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '8px' }}>With icons</h6>
                <p className="plus-body-2" style={{ marginBottom: '12px', color: 'var(--color-neutral-text)' }}>
                    Leading and trailing icons on items.
                </p>
                <div style={contentVariantCard}>
                    <Dropdown buttonText="Edit Menu" items={itemsWithIcons} />
                </div>
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '8px' }}>Selection indicator</h6>
                <p className="plus-body-2" style={{ marginBottom: '12px', color: 'var(--color-neutral-text)' }}>
                    Currently selected item with a checkmark.
                </p>
                <div style={contentVariantCard}>
                    <Dropdown buttonText="Select Option" items={itemsWithSelection} />
                </div>
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '8px' }}>Multi-select</h6>
                <p className="plus-body-2" style={{ marginBottom: '12px', color: 'var(--color-neutral-text)' }}>
                    Multiple selections with checkboxes.
                </p>
                <div style={contentVariantCard}>
                    <Dropdown
                        buttonText="Filter"
                        items={multiSelectItems.map((item, index) => ({
                            ...item,
                            onClick: () => toggleMultiSelect(index)
                        }))}
                    />
                </div>
            </section>
        </>
    );
}

function DropdownVariantsDemos() {
    return (
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Toggle style</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Semantic styles on the dropdown trigger.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Dropdown buttonText="Primary" style="primary" items={basicItems} />
                <Dropdown buttonText="Secondary" style="secondary" items={basicItems} />
                <Dropdown buttonText="Success" style="success" items={basicItems} />
                <Dropdown buttonText="Danger" style="danger" items={basicItems} />
            </div>
        </section>
    );
}

function DropdownStylesDemos() {
    return (
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Toggle fill</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Filled, tonal, outline, and ghost fills on a primary trigger.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Dropdown buttonText="Filled" style="primary" fill="filled" items={basicItems} />
                <Dropdown buttonText="Tonal" style="primary" fill="tonal" items={basicItems} />
                <Dropdown buttonText="Outline" style="primary" fill="outline" items={basicItems} />
                <Dropdown buttonText="Ghost" style="primary" fill="ghost" items={basicItems} />
            </div>
        </section>
    );
}

function DropdownSizesDemos() {
    return (
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Sizes</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Small, default, and large triggers.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Dropdown buttonText="Small" size="small" items={basicItems} />
                <Dropdown buttonText="Default" size="default" items={basicItems} />
                <Dropdown buttonText="Large" size="large" items={basicItems} />
            </div>
        </section>
    );
}

function DropdownLayoutDemos() {
    return (
        <>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Split button</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Separate primary action from the menu toggle.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Dropdown buttonText="Filled Split" split style="primary" fill="filled" items={basicItems} />
                    <Dropdown buttonText="Tonal Split" split style="primary" fill="tonal" items={basicItems} />
                    <Dropdown buttonText="Outline Split" split style="primary" fill="outline" items={basicItems} />
                    <Dropdown buttonText="Ghost Split" split style="primary" fill="ghost" items={basicItems} />
                </div>
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Menu direction</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Open below, above, or to the sides.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '120px', paddingBottom: '120px' }}>
                    <Dropdown buttonText="Dropdown" direction="dropdown" items={basicItems} />
                    <Dropdown buttonText="Dropup" direction="dropup" items={basicItems} />
                    <Dropdown buttonText="Dropright" direction="dropright" items={basicItems} />
                    <Dropdown buttonText="Dropleft" direction="dropleft" items={basicItems} />
                </div>
            </section>
        </>
    );
}

export const Content = () => (
    <div style={dropdownCol}>
        <DropdownContentDemos />
    </div>
);

export const StyleVariants = () => (
    <div style={dropdownCol}>
        <DropdownVariantsDemos />
    </div>
);

export const Styles = () => (
    <div style={dropdownCol}>
        <DropdownStylesDemos />
    </div>
);

export const Sizes = () => (
    <div style={dropdownCol}>
        <DropdownSizesDemos />
    </div>
);

export const Layout = () => (
    <div style={dropdownCol}>
        <DropdownLayoutDemos />
    </div>
);

export const Overview = () => (
    <div style={dropdownCol}>
        <DropdownContentDemos />
        <DropdownVariantsDemos />
        <DropdownStylesDemos />
        <DropdownSizesDemos />
        <DropdownLayoutDemos />
    </div>
);

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
