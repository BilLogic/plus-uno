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
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Universal element component for navigation hierarchy. indicates the current page\'s location within a navigational hierarchy that automatically adds separators via CSS.',
            },
        },
    },
    argTypes: {
        items: {
            control: 'object',
            description: 'Array of breadcrumb items',
            table: { category: 'Content' },
        },
        separator: {
            control: 'text',
            description: 'Custom separator character (Note: Default / is styled via CSS)',
            table: { category: 'Design' },
        },
        id: {
            control: 'text',
            description: 'HTML ID for the last item',
            table: { category: 'Development' },
        },
        className: {
            control: 'text',
            description: 'Custom CSS classes',
            table: { category: 'Development' },
        },
    },
};

/**
 * Overview
 * Shows common breadcrumb configurations.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 48px)' }}>
        {/* Standard Breadcrumb */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md, 24px)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-sm, 12px)' }}>Standard Breadcrumb</h6>
            <Breadcrumb items={sampleItems} />
        </div>

        {/* Short Breadcrumb */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md, 24px)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-sm, 12px)' }}>Short Breadcrumb (2 Levels)</h6>
            <Breadcrumb items={[
                { text: 'Home', href: '/' },
                { text: 'Current Page' }
            ]} />
        </div>

        {/* Custom Separator (Simulated via Prop/CSS Variable override check) */}
        {/* Note: Provide mechanism to verify separator overrides if needed in future */}
    </div>
);

/**
 * Interactive Breadcrumb
 * Interactive playground for testing breadcrumb props.
 */
export const Interactive = (args) => <Breadcrumb {...args} />;
Interactive.args = {
    items: [
        { text: 'Home', href: '/' },
        { text: 'Section', href: '/section' },
        { text: 'Subsection', href: '/subsection' },
        { text: 'Current Page' } // No href for current page
    ],
    separator: '/',
};
