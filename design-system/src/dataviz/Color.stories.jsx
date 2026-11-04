import React from 'react';
import { chartPalette } from '@/components';

const { CATEGORICAL, BRAND, NEUTRAL, STATUS, SMART_SUBJECTS, SMART, HUES, sequentialRamp } = chartPalette;

/**
 * Specimens for Data visualizations/Color. Every swatch paints a `--ds-chart-*`
 * token, so the page shows the categorical order the page resolves right now
 * and follows the toolbar's Color mode and Contrast switches.
 */
export default {
    title: 'Data visualizations/Color',
    tags: ['!dev', '!autodocs'],
};

const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(224px, 1fr))',
    gap: 'var(--stack-md)',
};

/** `token` is a CSS value — either a bare custom property or an already-wrapped `var(...)`. */
const cssVar = (token) => (token.startsWith('--') ? `var(${token})` : token);

const swatchBox = (token, extraStyle = {}) => ({
    minHeight: 'var(--item-height-md)',
    borderRadius: 'var(--radius-lg)',
    background: cssVar(token),
    boxShadow: 'inset 0 0 0 var(--border-default) var(--ds-border)',
    ...extraStyle,
});

const label = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };

/** A labeled row of swatches, one per token. */
const Swatches = ({ items }) => (
    <ul style={{ ...grid, margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map(([token, name]) => (
            <li key={token} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <div style={swatchBox(token)} />
                <span style={label}>{name}</span>
            </li>
        ))}
    </ul>
);

/** The single-series brand color and its de-emphasized neutral comparison/reference color. */
export const BrandAndNeutral = () => <Swatches items={[[BRAND, 'Brand'], [NEUTRAL, 'Neutral']]} />;

/** The eight categorical slots, numbered in assignment order. */
export const CategoricalOrder = () => <Swatches items={CATEGORICAL.map((token, i) => [token, i + 1])} />;

/** The same eight slots, desaturated, to show the order still reads without hue. */
export const CategoricalGrayscale = () => (
    <ul style={{ ...grid, margin: 0, padding: 0, listStyle: 'none' }}>
        {CATEGORICAL.map((token, i) => (
            <li key={token} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--stack-sm)' }}>
                    <div style={swatchBox(token)} />
                    <div style={swatchBox(token, { filter: 'grayscale(1)' })} />
                </div>
                <span style={label}>{i + 1}</span>
            </li>
        ))}
    </ul>
);

/** Status marks, base and bold, for every status plus the to-do neutral. */
export const StatusColors = () => (
    <Swatches
        items={[
            [STATUS.success, 'Success'], [STATUS.successBold, 'Success (bold)'],
            [STATUS.warning, 'Warning'], [STATUS.warningBold, 'Warning (bold)'],
            [STATUS.danger, 'Danger'], [STATUS.dangerBold, 'Danger (bold)'],
            [STATUS.information, 'Information'], [STATUS.informationBold, 'Information (bold)'],
            [STATUS.discovery, 'Discovery'], [STATUS.discoveryBold, 'Discovery (bold)'],
            [STATUS.todo, 'To-do'],
        ]}
    />
);

/** Every hue's sequential ramp, low to high. */
export const HueRamps = () => (
    <ul style={{ display: 'grid', gap: 'var(--stack-lg)', margin: 0, padding: 0, listStyle: 'none' }}>
        {HUES.map((hue) => (
            <li key={hue} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <span style={label}>{hue}</span>
                <div style={{ display: 'flex', gap: 'var(--stack-sm)' }}>
                    {sequentialRamp(hue).map((token) => (
                        <div key={token} style={{ ...swatchBox(token), flex: 1 }} />
                    ))}
                </div>
            </li>
        ))}
    </ul>
);

/** The five SMART subject colors. */
export const SmartColors = () => <Swatches items={SMART_SUBJECTS.map((s) => [SMART[s], s])} />;

/** A stacked bar; `separator` toggles the `--ds-border-inverse` line between segments. */
const bar = (segments, { separator = true } = {}) => (
    <div style={{ display: 'flex', height: 'var(--item-height-md)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {segments.map(([token, flex], i) => (
            <span key={i} style={{ flex, background: cssVar(token), ...(separator && i > 0 ? { borderInlineStart: 'var(--border-default) solid var(--ds-border-inverse)' } : {}) }} />
        ))}
    </div>
);

/** A stacked bar with and without the separator line between two close tones. */
export const SeparatorCompare = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(304px, 1fr))', gap: 'var(--grid-gutter)' }}>
        <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
            {bar([['--ds-chart-categorical-3', 1], ['--ds-chart-categorical-3-hovered', 1]])}
            <figcaption style={label}>With the separator line, the seam between two close tones still reads.</figcaption>
        </figure>
        <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
            {bar([['--ds-chart-categorical-3', 1], ['--ds-chart-categorical-3-hovered', 1]], { separator: false })}
            <figcaption style={label}>Without it, the seam disappears for anyone who cannot tell the two tones apart.</figcaption>
        </figure>
    </div>
);
