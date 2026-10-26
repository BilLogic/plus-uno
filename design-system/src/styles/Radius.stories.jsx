import React from 'react';
import { Button, Switch, Tag } from '@/components';
import { PatternCard } from '@/patterns';
import { Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';

/**
 * Specimens for Foundations/Radius: an Item's radius from its height, round
 * pills, a menu's inset rows, a clipped flush image and the focus ring.
 */
export default {
    title: 'Foundations/Radius',
    tags: ['!dev', '!autodocs'],
};

const col = (gap) => ({ display: 'flex', flexDirection: 'column', gap });
const caption = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };
const title = { font: 'var(--heading-xsmall)', color: 'var(--ds-text)' };

const Menu = ({ rowRadius }) => (
    <div
        style={{
            ...col(0),
            width: 'var(--popover-min-width-menu)',
            padding: 'var(--popover-pad-menu)',
            borderRadius: 'var(--popover-radius-menu-md)',
            background: 'var(--ds-surface-overlay)',
            boxShadow: 'var(--ds-shadow-overlay)',
        }}
    >
        {['Rename', 'Duplicate', 'Move to…'].map((t, i) => (
            <span
                key={t}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 'var(--item-height-md)',
                    padding: '0 var(--element-pad-x-md)',
                    borderRadius: rowRadius,
                    background: i === 0 ? 'var(--ds-background-neutral-subtle-hovered)' : 'transparent',
                    font: 'var(--body-default)',
                    color: 'var(--ds-text)',
                }}
            >
                {t}
            </span>
        ))}
    </div>
);

/** The five radius rules, one specimen each. */
export const Rules = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-sm), 1fr))', gap: 'var(--layout-gutter)', alignItems: 'start' }}>
        <div style={col('var(--element-stack-md)')}>
            <span style={{ display: 'inline-flex', gap: 'var(--element-inline-md)', alignItems: 'center' }}>
                <Button text="Compact" size="small" style="default" fill="outline" />
                <Button text="Default" style="default" fill="outline" />
            </span>
            <span style={title}>Items: height ÷ 4</span>
            <span style={caption}>Compact 24 at radius 6, default 32 at radius 8.</span>
        </div>
        <div style={col('var(--element-stack-md)')}>
            <span style={{ display: 'inline-flex', gap: 'var(--element-inline-md)', alignItems: 'center' }}>
                <Switch id="radius-pill" label="Repeats weekly" defaultChecked />
            </span>
            <span style={title}>Pills and circles</span>
            <span style={caption}>Toggle, radio, avatar and pill tag take <C>--element-radius-full</C>.</span>
        </div>
        <div style={col('var(--element-stack-md)')}>
            <Menu rowRadius="var(--element-radius-item-md)" />
            <span style={title}>Inset parts</span>
            <span style={caption}>Menu 12, rows inset 4, so rows take 8 (12 − 4).</span>
        </div>
        <div style={col('var(--element-stack-md)')}>
            <PatternCard
                title="Fractions review"
                description="Grade 6"
                image={<div aria-hidden="true" style={{ aspectRatio: '16 / 9', background: 'var(--ds-background-accent-teal-subtler)' }} />}
            />
            <span style={title}>Flush parts are clipped</span>
            <span style={caption}>The image touches the card’s edge, so the card’s radius 16 clips it.</span>
        </div>
        <div style={col('var(--element-stack-md)')}>
            <span style={{ display: 'inline-flex', padding: 'var(--border-focused)' }}>
                <span style={{ display: 'inline-flex', borderRadius: 'var(--element-radius-item-md)', outline: 'var(--border-focused) solid var(--ds-border-focused)', outlineOffset: 'var(--border-focused)' }}>
                    <Button text="Save" style="primary" fill="filled" />
                </span>
            </span>
            <span style={title}>The focus ring sits 2 outside</span>
            <span style={caption}>Button radius 8; the ring is drawn 2 outside, at radius 10.</span>
        </div>
        <div style={col('var(--element-stack-md)')}>
            <span><Tag text="Grade 7" /></span>
            <span style={title}>Containers keep their own radius</span>
            <span style={caption}>A pattern’s radius never changes with where it sits.</span>
        </div>
    </div>
);

/** Inset rows take the parent's radius minus the inset. */
export const InsetRows = () => (
    <DoDont>
        <Do caption="Rows inset 4 inside a 12 menu take 8, so the gap between the two curves stays even.">
            <Menu rowRadius="var(--element-radius-item-md)" />
        </Do>
        <Dont caption="Rows at the menu’s own 12. Their corners bulge toward the menu’s edge, and the inset looks uneven.">
            <Menu rowRadius="var(--popover-radius-menu-md)" />
        </Dont>
    </DoDont>
);
