/**
 * CardTitleHeader - Tutor Admin Element
 * 
 * Simple header element with title and info icon.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262205
 */

import React from 'react';
import CardTitleHeader from './CardTitleHeader';
import './CardTitleHeader.scss';

export default {
    title: 'Specs/Admin/Tutor Admin/Elements/CardTitleHeader',
    component: CardTitleHeader,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Simple header element with title text and optional info icon.

## Figma Reference
Node ID: 258-262205

## Features
- Title text with h4 styling
- Optional info icon with tooltip
- Consistent spacing and alignment
`,
            },
        },
    },
    argTypes: {
        title: {
            control: 'text',
            description: 'Title text',
            table: { category: 'Content' },
        },
        tooltip: {
            control: 'text',
            description: 'Tooltip text for info icon',
            table: { category: 'Content' },
        },
        showInfoIcon: {
            control: 'boolean',
            description: 'Whether to show info icon',
            table: { category: 'Display' },
        },
    },
};

/**
 * Docs
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>CardTitleHeader</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Simple header element displaying a title with an optional info icon for tooltips.
                        Used in card headers and section titles throughout Tutor Admin.
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Card Title Header</h6>
            <CardTitleHeader
                title="Card Title"
                tooltip="This is a tooltip"
            />
        </div>
    ),
};

/**
 * Interactive
 */
export const Interactive = {
    render: (args) => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                Card Title Header - Interactive
            </h6>
            <CardTitleHeader
                title={args.title}
                tooltip={args.tooltip}
                showInfoIcon={args.showInfoIcon}
            />
        </div>
    ),
    args: {
        title: 'Card Title',
        tooltip: 'This is a tooltip',
        showInfoIcon: true,
    },
};
