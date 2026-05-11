import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
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
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
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
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">STANDARD BREADCRUMB</span>
            <Breadcrumb items={sampleItems} />
        </div>
    );
}

function BreadcrumbShortDemo() {
    return (
        <div style={breadcrumbBlock}>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SHORT BREADCRUMB (2 LEVELS)</span>
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

export const Overview = () => <Breadcrumb items={sampleItems} />;
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.breadcrumb }
    }
};

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
