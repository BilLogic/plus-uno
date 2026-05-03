import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
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
    tags: ['!dev'],
    // Define argTypes to create the custom controls user requested
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
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
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onDismiss: {
            table: { disable: true, category: 'Development' }
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

const badgeGalleryCol = { display: 'flex', flexDirection: 'column', gap: '40px' };
const contentVariantCol = { display: 'flex', flexDirection: 'column', gap: '24px' };
const contentVariantCard = {
    padding: '12px',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '12px',
    background: 'var(--color-surface-container-low)',
};

function BadgeSizesDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ALL SIZES</span>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Badges are available in both Header (Lato) and Body (Merriweather Sans) scales.
            </p>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <Badge text="Body 1" size="b1" style="tertiary" />
                <Badge text="Body 2 (Default)" size="b2" style="tertiary" />
                <Badge text="Body 3" size="b3" style="tertiary" />
            </div>
        </section>
    );
}

function BadgeVariantsDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ALL COLOR THEMES</span>
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
    );
}

function BadgeContentDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">RECOMMENDED COMBINATIONS</span>
            <div style={contentVariantCol}>
                <section>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">STATUS INDICATORS</span>
                    <p className="plus-body-2" style={{ marginBottom: '12px', color: 'var(--color-neutral-text)' }}>
                        Text + leading icon for success, warning, and error semantics.
                    </p>
                    <div style={contentVariantCard}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Badge text="Success" style="success" leadingVisual={<i className="fa-solid fa-check"></i>} />
                            <Badge text="Warning" style="warning" leadingVisual={<i className="fa-solid fa-triangle-exclamation"></i>} />
                            <Badge text="Error" style="danger" leadingVisual={<i className="fa-solid fa-circle-exclamation"></i>} />
                        </div>
                    </div>
                </section>
                <section>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LABELS & CATEGORIES</span>
                    <p className="plus-body-2" style={{ marginBottom: '12px', color: 'var(--color-neutral-text)' }}>
                        Compact badges in smaller size for metadata and labels.
                    </p>
                    <div style={contentVariantCard}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Badge text="New Feature" style="info" size="b3" />
                            <Badge text="Beta" style="tertiary" size="b3" />
                        </div>
                    </div>
                </section>
                <section>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">COUNTS</span>
                    <p className="plus-body-2" style={{ marginBottom: '12px', color: 'var(--color-neutral-text)' }}>
                        Text + counter for inbox/message counts and similar tallies.
                    </p>
                    <div style={contentVariantCard}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Badge text="Inbox" style="primary" counter="12" />
                            <Badge text="Messages" style="secondary" counter="99+" />
                        </div>
                    </div>
                </section>
                <section>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FILTERS & SELECTIONS</span>
                    <p className="plus-body-2" style={{ marginBottom: '12px', color: 'var(--color-neutral-text)' }}>
                        Dismissible badges for active filters and selected entities.
                    </p>
                    <div style={contentVariantCard}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Badge text="Filter: Active" style="primary" dismissible />
                            <Badge text="Jane Doe" style="secondary" dismissible leadingVisual={<i className="fa-solid fa-user"></i>} />
                        </div>
                    </div>
                </section>
            </div>
        </section>
    );
}

export const Sizes = () => (
    <div style={badgeGalleryCol}>
        <BadgeSizesDemos />
    </div>
);

export const Styles = () => (
    <div style={badgeGalleryCol}>
        <BadgeVariantsDemos />
    </div>
);

/** Icons, counter, dismissible — content & behavior patterns */
export const Content = () => (
    <div style={badgeGalleryCol}>
        <BadgeContentDemos />
    </div>
);

export const Overview = () => (
    <Badge text="Primary" style="primary" size="b2" />
);
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.badge }
    }
};

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
