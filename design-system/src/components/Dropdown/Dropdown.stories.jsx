import React from 'react';
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
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        buttonText: {
            control: 'text',
            description: 'Text displayed on the dropdown toggle button',
            table: { category: 'Content' }
        },
        items: {
            table: { disable: true, category: 'Content' }
        },
        contentPreset: {
            control: 'select',
            options: ['basic', 'with-divider', 'with-icons', 'with-selection'],
            description: 'Preset menu content for the interactive demo',
            table: { category: 'Content' }
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
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
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

const contentItems = [
    { text: 'Form', leadingIcon: 'file-lines', counter: 20, dropright: true },
    { text: 'Form', leadingIcon: 'file-lines', counter: 20, dropright: true },
    { text: 'Form', leadingIcon: 'file-lines', counter: 20, dropright: true }
];

const dropdownCol = { display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '700px' };
const contentVariantCard = {
    padding: '12px',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '12px',
    background: 'var(--color-surface-container-low)',
};

function DropdownContentDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SINGLE AND SPLIT DROPDOWNS</span>
            <p className="plus-body-2" style={{ marginBottom: '12px', color: 'var(--color-neutral-text)' }}>
                Core content states from the design system: closed and open, using both single-button and split-button triggers.
            </p>
            <div
                style={{
                    ...contentVariantCard,
                    padding: '28px 48px 164px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(240px, 1fr))',
                    columnGap: '96px',
                    rowGap: '24px',
                    alignItems: 'start',
                    overflow: 'visible',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Dropdown buttonText="Dropdown" style="primary" size="small" items={contentItems} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Dropdown buttonText="Split Dropdown" style="primary" size="small" split items={contentItems} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Dropdown buttonText="Dropdown" style="primary" size="small" items={contentItems} isOpen />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Dropdown buttonText="Split Dropdown" style="primary" size="small" split items={contentItems} isOpen />
                </div>
            </div>
        </section>
    );
}

function DropdownVariantsDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TOGGLE STYLE</span>
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
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TOGGLE FILL</span>
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
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SIZES</span>
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SPLIT BUTTON</span>
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MENU DIRECTION</span>
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
        fill: 'filled',
        size: 'default',
        direction: 'dropdown',
        split: false,
        contentPreset: 'basic'
    },
    render: (args) => (
        <div style={{ padding: '100px 50px' }}>
            <Dropdown
                {...args}
                items={{
                    'basic': basicItems,
                    'with-divider': itemsWithDivider,
                    'with-icons': itemsWithIcons,
                    'with-selection': itemsWithSelection
                }[args.contentPreset] || basicItems}
            />
        </div>
    )
};
