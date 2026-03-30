import React from 'react';
import Breadcrumb from './Breadcrumb';

const sampleItems = [
    { text: 'Home', href: '/' },
    { text: 'Training', href: '/training' },
    { text: 'Lessons', href: '/lessons' },
    { text: 'Current Page' },
];

export default {
    title: 'Components/Breadcrumb',
    component: Breadcrumb,
    tags: ['!dev'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Universal element component for navigation hierarchy. indicates the current page\'s location within a navigational hierarchy that automatically adds separators via CSS.',
            },
        },
    },
    argTypes: {
        pathPreset: {
            control: 'select',
            options: ['short', 'standard', 'deep'],
            description: 'Preset breadcrumb depth for the interactive demo',
            table: { category: 'Content' },
        },
        separator: {
            table: { disable: true, category: 'Design' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        items: {
            table: { disable: true, category: 'Development' },
        },
    },
};

const breadcrumbCol = { display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 48px)' };
const breadcrumbBlock = { display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md, 24px)' };

function BreadcrumbStandardDemo() {
    return (
        <div style={breadcrumbBlock}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-sm, 12px)' }}>Standard Breadcrumb</h6>
            <Breadcrumb items={sampleItems} />
        </div>
    );
}

function BreadcrumbShortDemo() {
    return (
        <div style={breadcrumbBlock}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-sm, 12px)' }}>Short Breadcrumb (2 Levels)</h6>
            <Breadcrumb items={[
                { text: 'Home', href: '/' },
                { text: 'Current Page' }
            ]} />
        </div>
    );
}

export const Standard = () => (
    <div style={breadcrumbCol}>
        <BreadcrumbStandardDemo />
    </div>
);

export const Short = () => (
    <div style={breadcrumbCol}>
        <BreadcrumbShortDemo />
    </div>
);

export const Overview = () => (
    <div style={breadcrumbCol}>
        <BreadcrumbStandardDemo />
        <BreadcrumbShortDemo />
    </div>
);

/**
 * Interactive Breadcrumb
 * Interactive playground for testing breadcrumb props.
 */
export const Interactive = (args) => (
    <Breadcrumb
        {...args}
        items={{
            short: [
                { text: 'Home', href: '/' },
                { text: 'Current Page' }
            ],
            standard: sampleItems,
            deep: [
                { text: 'Home', href: '/' },
                { text: 'Training', href: '/training' },
                { text: 'Lessons', href: '/lessons' },
                { text: 'Module 3', href: '/lessons/module-3' },
                { text: 'Current Page' }
            ]
        }[args.pathPreset] || sampleItems}
    />
);
Interactive.args = {
    pathPreset: 'standard',
};
