import React from 'react';
import { chartPalette } from '@/components';

const { CATEGORICAL } = chartPalette;

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
    gridTemplateColumns: 'repeat(auto-fill, minmax(var(--card-min-width-sm), 1fr))',
    gap: 'var(--element-stack-md)',
};

const swatchBox = (token, extraStyle = {}) => ({
    minHeight: 'var(--item-height-md)',
    borderRadius: 'var(--element-radius-lg)',
    background: `var(${token})`,
    boxShadow: 'inset 0 0 0 var(--border-default) var(--ds-border)',
    ...extraStyle,
});

const label = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };

/** The eight categorical slots, numbered in assignment order. */
export const CategoricalOrder = () => (
    <ul style={{ ...grid, margin: 0, padding: 0, listStyle: 'none' }}>
        {CATEGORICAL.map((token, i) => (
            <li key={token} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)' }}>
                <div style={swatchBox(token.match(/var\((--ds-[\w-]+)\)/)[1])} />
                <span style={label}>{i + 1}</span>
            </li>
        ))}
    </ul>
);

/** The same eight slots, desaturated, to show the order still reads without hue. */
export const CategoricalGrayscale = () => (
    <ul style={{ ...grid, margin: 0, padding: 0, listStyle: 'none' }}>
        {CATEGORICAL.map((token, i) => {
            const name = token.match(/var\((--ds-[\w-]+)\)/)[1];
            return (
                <li key={token} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--element-stack-sm)' }}>
                        <div style={swatchBox(name)} />
                        <div style={swatchBox(name, { filter: 'grayscale(1)' })} />
                    </div>
                    <span style={label}>{i + 1}</span>
                </li>
            );
        })}
    </ul>
);

const bar = (segments) => (
    <div style={{ display: 'flex', height: 'var(--item-height-md)', borderRadius: 'var(--element-radius-lg)', overflow: 'hidden' }}>
        {segments.map(([token, flex], i) => (
            <span key={i} style={{ flex, background: `var(${token})`, ...(i > 0 ? { borderInlineStart: 'var(--border-default) solid var(--ds-border-inverse)' } : {}) }} />
        ))}
    </div>
);

const barNoSeparator = (segments) => (
    <div style={{ display: 'flex', height: 'var(--item-height-md)', borderRadius: 'var(--element-radius-lg)', overflow: 'hidden' }}>
        {segments.map(([token, flex], i) => (
            <span key={i} style={{ flex, background: `var(${token})` }} />
        ))}
    </div>
);

/** A stacked bar with and without the separator line between two close tones. */
export const SeparatorCompare = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-md), 1fr))', gap: 'var(--layout-gutter)' }}>
        <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
            {bar([['--ds-chart-categorical-3', 1], ['--ds-chart-categorical-3-hovered', 1]])}
            <figcaption style={label}>With the separator line, the seam between two close tones still reads.</figcaption>
        </figure>
        <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
            {barNoSeparator([['--ds-chart-categorical-3', 1], ['--ds-chart-categorical-3-hovered', 1]])}
            <figcaption style={label}>Without it, the seam disappears for anyone who cannot tell the two tones apart.</figcaption>
        </figure>
    </div>
);
