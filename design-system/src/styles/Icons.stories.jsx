import React from 'react';
import { Button, Tile } from '@/components';
import { Do, Dont, DoDont } from '@/storybook-docs/foundation-blocks.jsx';

/**
 * Specimens for Foundations/Iconography: Font Awesome Free glyphs at the three
 * icon sizes, in the icon color tokens.
 */
export default {
    title: 'Foundations/Iconography',
    tags: ['!dev', '!autodocs'],
};

const col = (gap) => ({ display: 'flex', flexDirection: 'column', gap });
const caption = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };
const code = { font: 'var(--code)', color: 'var(--ds-text-subtle)' };

const Glyph = ({ name, family = 'fa-solid', size = '--icon-md', color = '--ds-icon-subtle' }) => (
    <i
        className={`${family} fa-${name}`}
        aria-hidden="true"
        style={{ fontSize: `var(${size})`, width: `var(${size})`, height: `var(${size})`, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: `var(${color})` }}
    />
);

const SIZES = [
    ['--icon-sm', '12', 'chevron-down', 'Use sparingly: chevrons, small text, field validation, and inside small components such as tags and table headers.'],
    ['--icon-md', '16', 'calendar-days', 'The default. Beside 14 and 16 text in buttons, menus, fields and lists.'],
    ['--icon-lg', '24', 'folder', 'The largest icon. Empty states, section headers and standalone status marks.'],
];

/** The three icon sizes. */
export const Sizes = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-sm), 1fr))', gap: 'var(--layout-gutter)' }}>
        {SIZES.map(([token, value, name, use]) => (
            <div key={token} style={col('var(--element-stack-md)')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'var(--image-xl)', height: 'var(--image-xl)', borderRadius: 'var(--element-radius-lg)', background: 'var(--ds-surface-sunken)' }}>
                    <Glyph name={name} size={token} color="--ds-icon" />
                </span>
                <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>{value} · <span style={code}>{token}</span></span>
                <span style={caption}>{use}</span>
            </div>
        ))}
    </div>
);

/** Solid, regular and brands: the three Font Awesome Free families. */
export const Families = () => (
    <div style={{ display: 'flex', gap: 'var(--surface-stack-md)', flexWrap: 'wrap' }}>
        {[
            ['fa-solid', ['calendar-days', 'bell', 'gear', 'user', 'circle-check']],
            ['fa-regular', ['calendar-days', 'bell', 'user', 'circle-check', 'file']],
            ['fa-brands', ['figma', 'github', 'google', 'slack', 'notion']],
        ].map(([family, names]) => (
            <div key={family} style={col('var(--element-stack-md)')}>
                <span style={{ display: 'flex', gap: 'var(--element-inline-lg)' }}>
                    {names.map((n) => <Glyph key={n} name={n} family={family} size="--icon-lg" color="--ds-icon" />)}
                </span>
                <span style={code}>{family}</span>
            </div>
        ))}
    </div>
);

const COLORS = [
    ['--ds-icon', 'Beside body text'],
    ['--ds-icon-subtle', 'The default for an icon beside a label'],
    ['--ds-icon-subtlest', 'Beside metadata'],
    ['--ds-icon-brand', 'Brand marks'],
    ['--ds-icon-success', 'A success status'],
    ['--ds-icon-warning', 'A warning status'],
    ['--ds-icon-danger', 'An error'],
    ['--ds-icon-information', 'Information'],
];

/** Icons take an icon color token. */
export const Colors = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(var(--field-width-md), 1fr))', gap: 'var(--element-stack-lg)' }}>
        {COLORS.map(([token, use]) => (
            <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 'var(--element-inline-lg)' }}>
                <Glyph name="circle-info" size="--icon-lg" color={token} />
                <span style={col('var(--element-stack-sm)')}>
                    <span style={code}>{token}</span>
                    <span style={caption}>{use}</span>
                </span>
            </div>
        ))}
    </div>
);

/** A label says what the icon means. */
export const PairWithLabels = () => (
    <DoDont>
        <Do caption="An icon beside its label. The label says what it does, and a screen reader reads the label.">
            <span style={{ display: 'flex', gap: 'var(--element-inline-md)' }}>
                <Button text="Reschedule" leadingVisual="calendar-days" style="default" fill="outline" />
                <Button text="Message" leadingVisual="comment" style="default" fill="outline" />
            </span>
        </Do>
        <Dont caption="Icons alone for actions people use rarely. Each one costs the reader a guess.">
            <span style={{ display: 'flex', gap: 'var(--element-inline-md)' }}>
                <Button leadingVisual="calendar-days" title="Reschedule" aria-label="Reschedule" style="default" fill="outline" />
                <Button leadingVisual="comment" title="Message" aria-label="Message" style="default" fill="outline" />
            </span>
        </Dont>
    </DoDont>
);

/** One glyph for one meaning, across the product. */
export const OneGlyphOneMeaning = () => (
    <DoDont>
        <Do caption="Every date in the product takes the same calendar glyph.">
            <span style={col('var(--element-stack-md)')}>
                {['Tuesday, June 3', 'Due Friday', 'Started May 12'].map((t) => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--element-inline-md)', font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                        <Glyph name="calendar-days" />{t}
                    </span>
                ))}
            </span>
        </Do>
        <Dont caption="Three different glyphs for a date. People read them as three different things.">
            <span style={col('var(--element-stack-md)')}>
                {[['Tuesday, June 3', 'calendar-days'], ['Due Friday', 'clock'], ['Started May 12', 'flag']].map(([t, g]) => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--element-inline-md)', font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                        <Glyph name={g} />{t}
                    </span>
                ))}
            </span>
        </Dont>
    </DoDont>
);

/** 24 is the largest icon; a larger mark goes in a Tile. */
export const LargerMeansTile = () => (
    <div style={{ display: 'flex', gap: 'var(--surface-stack-md)', alignItems: 'flex-end' }}>
        <span style={col('var(--element-stack-md)')}>
            <Glyph name="folder" size="--icon-lg" color="--ds-icon" />
            <span style={caption}>24: the largest icon</span>
        </span>
        <span style={col('var(--element-stack-md)')}>
            <Tile content="icon" icon="book-open" size={48} color="teal" />
            <span style={caption}>Larger: a Tile</span>
        </span>
    </div>
);
