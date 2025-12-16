import React from 'react';
import Badge from './Badge';

// Icons for interactive playground
const icons = {
    'None': null,
    'Star': <i className="fa-solid fa-star"></i>,
    'Check': <i className="fa-solid fa-check"></i>,
    'User': <i className="fa-solid fa-user"></i>,
    'Bell': <i className="fa-solid fa-bell"></i>,
};

export default {
    title: 'Components/Badge',
    component: Badge,
    tags: ['autodocs'],
    // Define argTypes to create the custom controls user requested
    argTypes: {
        // Content
        text: {
            control: 'text',
            description: 'Badge Text',
            table: { category: 'Content' }
        },
        showLeadingVisual: {
            control: 'boolean',
            description: 'Toggle leading visual',
            table: { category: 'Content' }
        },
        leadingVisualIcon: {
            control: 'select',
            options: Object.keys(icons),
            if: { arg: 'showLeadingVisual' },
            table: { category: 'Content' }
        },
        showTrailingVisual: {
            control: 'boolean',
            description: 'Toggle trailing visual',
            table: { category: 'Content' }
        },
        trailingVisualIcon: {
            control: 'select',
            options: Object.keys(icons),
            if: { arg: 'showTrailingVisual' },
            table: { category: 'Content' }
        },
        showCounter: {
            control: 'boolean',
            description: 'Toggle counter',
            table: { category: 'Content' }
        },
        counterValue: {
            control: 'text',
            if: { arg: 'showCounter' },
            table: { category: 'Content' }
        },

        // Design
        style: {
            control: 'select',
            options: [
                'primary', 'secondary', 'tertiary', 'success', 'warning', 'danger',
                'social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools'
            ],
            description: 'Color theme of the badge',
            table: { category: 'Design' }
        },
        size: {
            control: 'select',
            options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
            description: 'Size hierarchy',
            table: { category: 'Design' }
        },

        // Behavior
        dismissible: {
            control: 'boolean',
            description: 'Enable dismissible mode (automates trailing xmark)',
            table: { category: 'Behavior' }
        },

        // Development
        id: {
            control: 'text',
            description: 'HTML ID attribute',
            table: { category: 'Development' }
        },
        className: {
            control: 'text',
            description: 'Custom CSS classes',
            table: { category: 'Development' }
        },
        onDismiss: {
            action: 'dismissed',
            description: 'Dismiss callback',
            table: { category: 'Development' }
        },
        leadingVisual: {
            table: { disable: true, category: 'Development' }
        },
        trailingVisual: {
            table: { disable: true, category: 'Development' }
        },
        counter: {
            table: { disable: true, category: 'Development' }
        },
    },
};

/**
 * Overview
 * comprehensive view of Badge styles, sizes, and recommended usage patterns.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

        {/* 1. All Sizes */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>All Sizes</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Badges are available in both Header (Lato) and Body (Merriweather Sans) scales.
            </p>

            {/* Headers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <Badge text="Headline 1" size="h1" style="primary" />
                <Badge text="Headline 2" size="h2" style="primary" />
                <Badge text="Headline 3" size="h3" style="primary" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <Badge text="Title H4" size="h4" style="secondary" />
                <Badge text="Title H5" size="h5" style="secondary" />
                <Badge text="Title H6" size="h6" style="secondary" />
            </div>

            {/* Body */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <Badge text="Body 1" size="b1" style="tertiary" />
                <Badge text="Body 2 (Default)" size="b2" style="tertiary" />
                <Badge text="Body 3" size="b3" style="tertiary" />
            </div>
        </section>

        {/* 2. All Color Themes */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>All Color Themes</h6>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'info'].map(style => (
                    <Badge key={style} text={style.charAt(0).toUpperCase() + style.slice(1)} style={style} />
                ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
                {['social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools'].map(style => (
                    <Badge key={style} text={style.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} style={style} />
                ))}
            </div>
        </section>

        {/* 3. Recommended Combinations */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Recommended Combinations</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Status Indicators */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Badge text="Success" style="success" leadingVisual={<i className="fa-solid fa-check"></i>} />
                    <Badge text="Warning" style="warning" leadingVisual={<i className="fa-solid fa-triangle-exclamation"></i>} />
                    <Badge text="Error" style="danger" leadingVisual={<i className="fa-solid fa-circle-exclamation"></i>} />
                    <span className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>Status Indicators (Text + Leading Visual)</span>
                </div>

                {/* Labels/Categories */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Badge text="New Feature" style="info" size="b3" />
                    <Badge text="Beta" style="tertiary" size="b3" />
                    <span className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>Labels & Categories (Small size)</span>
                </div>

                {/* Counts */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Badge text="Inbox" style="primary" counter="12" />
                    <Badge text="Messages" style="secondary" counter="99+" />
                    <span className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>Counts (Text + Counter)</span>
                </div>

                {/* Dismissible / Filters */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Badge text="Filter: Active" style="primary" dismissible />
                    <Badge text="Jane Doe" style="secondary" dismissible leadingVisual={<i className="fa-solid fa-user"></i>} />
                    <span className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>Filters & Selections (Dismissible)</span>
                </div>
            </div>
        </section>
    </div>
);

/**
 * Interactive Playground
 * Customize the badge attributes, visuals, and content.
 */
export const Interactive = (args) => {
    // Map custom controls back to component props
    const leadingNode = args.showLeadingVisual ? icons[args.leadingVisualIcon] : null;
    const trailingNode = args.showTrailingVisual ? icons[args.trailingVisualIcon] : null;
    const counterContent = args.showCounter ? args.counterValue : undefined;

    return (
        <Badge
            {...args}
            leadingVisual={leadingNode}
            trailingVisual={trailingNode}
            counter={counterContent}
        />
    );
};
Interactive.args = {
    text: 'Interactive Badge',
    style: 'primary',
    size: 'b2',
    dismissible: false,

    // Custom Control Defaults
    showLeadingVisual: false,
    leadingVisualIcon: 'Star',
    showTrailingVisual: false,
    trailingVisualIcon: 'Check',
    showCounter: false,
    counterValue: '5',
};
