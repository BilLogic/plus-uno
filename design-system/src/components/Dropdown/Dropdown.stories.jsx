import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
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
            control: 'radio',
            options: ['outline', 'ghost'],
            description: 'Trigger surface treatment (outline default per spec; ghost for minimal emphasis)',
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

const SEMANTIC_STYLES = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'default'];

function DropdownVariantsDemos() {
    return (
        <section>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {SEMANTIC_STYLES.map((s) => (
                    <Dropdown
                        key={s}
                        buttonText={s.charAt(0).toUpperCase() + s.slice(1)}
                        style={s}
                        items={basicItems}
                    />
                ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                <Dropdown buttonText="Ghost" style="primary" fill="ghost" items={basicItems} />
            </div>
        </section>
    );
}

function DropdownSizesDemos() {
    return (
        <section>
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
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Dropdown buttonText="Primary split" split style="primary" items={basicItems} />
                    <Dropdown buttonText="Secondary split" split style="secondary" items={basicItems} />
                    <Dropdown buttonText="Default split" split style="default" items={basicItems} />
                    <Dropdown buttonText="Ghost split" split style="primary" fill="ghost" items={basicItems} />
                </div>
            </section>
            <section style={{ marginTop: '48px' }}>
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
    <div style={{ padding: '100px 24px 160px' }}>
        <Dropdown buttonText="Dropdown" style="primary" items={basicItems} />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.dropdown }
    }
};

export const Interactive = {
    args: {
        buttonText: 'Dropdown',
        style: 'default',
        fill: 'outline',
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
