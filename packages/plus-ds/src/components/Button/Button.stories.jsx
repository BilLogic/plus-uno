import React from 'react';
import Button from './Button';

const icons = {
    'none': null,
    'plus': 'plus',
    'xmark': 'xmark',
    'check': 'check',
    'arrow-right': 'arrow-right',
    'chevron-right': 'chevron-right',
    'star': 'star',
    'user': 'user',
    'trash': 'trash',
    'upload': 'upload'
};

export default {
    title: 'Components/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        // CONTENT
        text: {
            control: 'text',
            description: 'Button label text',
            table: { category: 'Content' }
        },
        leadingVisual: {
            control: 'select',
            options: Object.keys(icons),
            mapping: icons,
            description: 'Icon at start of button',
            table: { category: 'Content' }
        },
        trailingVisual: {
            control: 'select',
            options: Object.keys(icons),
            mapping: icons,
            description: 'Icon at end of button',
            table: { category: 'Content' }
        },

        // DESIGN
        style: {
            control: 'select',
            options: [
                'primary', 'secondary', 'tertiary',
                'success', 'warning', 'danger', 'info',
                'social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools', 'default'
            ],
            table: { category: 'Design' }
        },
        fill: {
            control: 'select',
            options: ['filled', 'tonal', 'outline', 'ghost'],
            table: { category: 'Design' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            table: { category: 'Design' }
        },
        vertical: {
            control: 'boolean',
            description: 'Stack content vertically',
            table: { category: 'Design' }
        },
        block: {
            control: 'boolean',
            description: 'Full width button',
            table: { category: 'Design' }
        },

        // BEHAVIOR
        disabled: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        active: {
            control: 'boolean',
            description: 'Manually trigger active/pressed state',
            table: { category: 'Behavior' }
        },
        loading: {
            control: 'boolean',
            description: 'Show loading spinner',
            table: { category: 'Behavior' }
        },
        onClick: {
            action: 'clicked',
            table: { category: 'Behavior' }
        },
        href: {
            control: 'text',
            description: 'URL (renders as anchor tag)',
            table: { category: 'Behavior' }
        },
        target: {
            control: 'text',
            table: { category: 'Behavior' }
        },
        type: {
            control: 'select',
            options: ['button', 'submit', 'reset'],
            table: { category: 'Behavior' }
        },

        // DEVELOPMENT
        title: {
            control: 'text',
            description: 'HTML Title attribute',
            table: { category: 'Development' }
        },
        id: {
            control: 'text',
            table: { category: 'Development' }
        },
        className: {
            control: 'text',
            table: { category: 'Development' }
        },
        children: {
            table: { disable: true, category: 'Development' }
        },
        as: {
            table: { disable: true, category: 'Development' }
        }
    }
};

/**
 * Overview
 * Matrix of all Styles x Fills, plus Size and layout examples.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

        {/* Metric Matrix */}
        <section>
            <h6 className="h6" style={{ marginBottom: '24px' }}>Styles & Variants</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {['filled', 'tonal', 'outline', 'ghost'].map(fill => (
                    <div key={fill}>
                        <p className="plus-body-2" style={{ marginBottom: '12px', textTransform: 'capitalize', color: 'var(--color-neutral-text)' }}>{fill}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                            {['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger'].map(style => (
                                <Button
                                    key={style}
                                    text={style.charAt(0).toUpperCase() + style.slice(1)}
                                    style={style}
                                    fill={fill}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Sizes */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Sizes (Filled Style)</h6>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Button text="Small" size="small" style="primary" fill="filled" />
                <Button text="Medium" size="medium" style="primary" fill="filled" />
                <Button text="Large" size="large" style="primary" fill="filled" />
            </div>
        </section>

        {/* Disabled States per Variant */}
        <section>
            <h6 className="h6" style={{ marginBottom: '24px' }}>Disabled States</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {['filled', 'tonal', 'outline', 'ghost'].map(fill => (
                    <div key={fill}>
                        <p className="plus-body-2" style={{ marginBottom: '12px', textTransform: 'capitalize', color: 'var(--color-neutral-text)' }}>{fill} – disabled</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                            {['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger'].map(s => (
                                <Button key={s} text={s.charAt(0).toUpperCase() + s.slice(1)} style={s} fill={fill} disabled leadingVisual="square-plus" trailingVisual="square-plus" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Icon spacing */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Icon Spacing (gap only, no extra margin)</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Button text="Small" size="small" style="primary" fill="filled" leadingVisual="plus" trailingVisual="chevron-right" />
                <Button text="Medium" size="medium" style="primary" fill="filled" leadingVisual="plus" trailingVisual="chevron-right" />
                <Button text="Large" size="large" style="primary" fill="filled" leadingVisual="plus" trailingVisual="chevron-right" />
            </div>
        </section>

        {/* States / Layouts */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>States & Layouts</h6>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>Status</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button text="Disabled" disabled style="primary" />
                        <Button text="Loading" loading style="primary" />
                        <Button text="Active" active style="secondary" />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>Block</p>
                    <div style={{ width: '300px' }}>
                        <Button text="Block Button" block style="primary" fill="outline" />
                    </div>
                </div>
            </div>
        </section>
    </div>
);

/**
 * Interactive Playground
 */
export const Interactive = {
    args: {
        text: 'Interactive Button',
        style: 'primary',
        fill: 'filled',
        size: 'medium',
        leadingVisual: 'none',
        trailingVisual: 'none',
        disabled: false,
        active: false,
        loading: false,
        block: false
    }
};
