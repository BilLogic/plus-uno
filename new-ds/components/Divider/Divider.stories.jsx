import React from 'react';
import Divider from '@/components/Divider';

export default {
    title: 'Components/Divider',
    component: Divider,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Divider component for visually separating content sections. Supports different thicknesses and styles.'
            }
        }
    },
    argTypes: {
        // DESIGN
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg', 'xl'],
            description: 'Divider thickness',
            table: { category: 'Design' }
        },
        style: {
            control: 'radio',
            options: ['light', 'dark'],
            description: 'Color style of the divider',
            table: { category: 'Design' }
        },
        opacity10: {
            control: 'boolean',
            description: 'Apply 10% opacity for subtle separation',
            table: { category: 'Design' }
        },
        width: {
            control: 'text',
            description: 'Custom width (e.g., "50%", "200px")',
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
        },
        customStyles: {
            table: { disable: true, category: 'Development' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of Divider variants and configurations.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', width: '100%', maxWidth: '600px' }}>

        {/* 1. Sizes */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Sizes</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Dividers come in four thicknesses: sm (1px), md (1.5px), lg (2px), and xl (2.5px).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <span className="plus-label" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>Small (sm)</span>
                    <Divider size="sm" />
                </div>
                <div>
                    <span className="plus-label" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>Medium (md) - Default</span>
                    <Divider size="md" />
                </div>
                <div>
                    <span className="plus-label" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>Large (lg)</span>
                    <Divider size="lg" />
                </div>
                <div>
                    <span className="plus-label" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>Extra Large (xl)</span>
                    <Divider size="xl" />
                </div>
            </div>
        </section>

        {/* 2. Styles */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Styles</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Light style for standard backgrounds, dark style for light backgrounds.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <span className="plus-label" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>Light Style</span>
                    <Divider style="light" />
                </div>
                <div style={{ backgroundColor: 'var(--color-surface-container)', padding: '16px', borderRadius: '8px' }}>
                    <span className="plus-label" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>Dark Style</span>
                    <Divider style="dark" />
                </div>
            </div>
        </section>

        {/* 3. Opacity Variant */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Opacity Variant</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Apply 10% opacity for subtle, less prominent separation.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <span className="plus-label" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>Normal</span>
                    <Divider size="lg" />
                </div>
                <div>
                    <span className="plus-label" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>Opacity 10%</span>
                    <Divider size="lg" opacity10 />
                </div>
            </div>
        </section>

        {/* 4. Custom Width */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Custom Width</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Set custom widths for specific layout needs.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <Divider width="25%" />
                <Divider width="50%" />
                <Divider width="75%" />
                <Divider width="100%" />
            </div>
        </section>

        {/* 5. Use Case Example */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Use Case Example</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Dividers are commonly used to separate content sections.
            </p>
            <div style={{ padding: '16px', border: '1px solid var(--color-outline-variant)', borderRadius: '8px' }}>
                <p className="plus-body-1">First section of content goes here.</p>
                <Divider className="my-3" />
                <p className="plus-body-1">Second section of content goes here.</p>
                <Divider className="my-3" />
                <p className="plus-body-1">Third section of content goes here.</p>
            </div>
        </section>
    </div>
);

/**
 * Interactive Playground
 * Customize divider attributes in real-time.
 */
export const Interactive = {
    args: {
        size: 'md',
        style: 'light',
        opacity10: false,
        width: '100%'
    },
    render: (args) => (
        <div style={{ width: '100%', maxWidth: '600px' }}>
            <p className="plus-body-2" style={{ marginBottom: '16px' }}>Content above the divider.</p>
            <Divider {...args} />
            <p className="plus-body-2" style={{ marginTop: '16px' }}>Content below the divider.</p>
        </div>
    )
};
