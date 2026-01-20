import React from 'react';
import Spinner from './Spinner';

export default {
    title: 'Components/Loading',
    component: Spinner,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Loading indicators for asynchronous operations. Supports standard Bootstrap spinners (border, grow) and custom animated variants (growing, rotating, stacking).'
            }
        }
    },
    argTypes: {
        variant: {
            control: 'select',
            options: ['border', 'grow', 'growing', 'rotating', 'stacking'],
            description: 'Animation variant type',
            table: { category: 'Design', defaultValue: { summary: 'border' } }
        },
        color: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'],
            description: 'Color theme (for border/grow variants)',
            table: { category: 'Design', defaultValue: { summary: 'primary' } }
        },
        size: {
            control: 'select',
            options: [null, 'sm'],
            description: 'Size variant',
            table: { category: 'Design', defaultValue: { summary: null } }
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes',
            table: { category: 'Development' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of all Loading spinner configurations.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
        {/* All Variants */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Variants</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Different animation styles for loading indicators.
            </p>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="border" color="primary" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Border</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="grow" color="primary" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Grow</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="growing" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Growing (3x3)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="rotating" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Rotating</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="stacking" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Stacking</p>
                </div>
            </div>
        </section>

        {/* Colors */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Colors</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Color variations for standard spinners.
            </p>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                {['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].map(color => (
                    <div key={color} style={{ textAlign: 'center' }}>
                        <Spinner variant="border" color={color} />
                        <p style={{ marginTop: '8px', fontSize: '12px' }}>{color}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* Sizes */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Sizes</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Size variations for spinners.
            </p>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="border" color="primary" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Default</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="border" color="primary" size="sm" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Small (sm)</p>
                </div>
            </div>
        </section>
    </div>
);
Overview.parameters = {
    docs: {
        description: {
            story: 'Comprehensive view of all Loading spinner variants, colors, and sizes.'
        }
    }
};

/**
 * Interactive
 * Playground with controls for customizing spinner props.
 */
export const Interactive = (args) => <Spinner {...args} />;
Interactive.args = {
    variant: 'border',
    color: 'primary',
    size: null
};
Interactive.parameters = {
    docs: {
        description: {
            story: 'Interactive playground - use the controls panel to customize the spinner.'
        }
    }
};
