import React from 'react';
import { expect, within } from 'storybook/test';

import { DoDontGrid } from '@/storybook-docs/ds-docs-layout.jsx';

/**
 * Icons are Font Awesome Free glyphs written as an `<i>` element. There is no
 * Icon component, so these stories render the markup itself and the docs page
 * shows what to write.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser and read the computed size and color of the glyph.
 */

export default {
    title: 'Components/Images and icons/Icon',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A single Font Awesome Free glyph in a square box exactly its size: 12, 16 or 24.',
            },
        },
    },
};

const SIZES = [
    { token: '--icon-sm', px: 12, label: 'sm 12' },
    { token: '--icon-md', px: 16, label: 'md 16 (default)' },
    { token: '--icon-lg', px: 24, label: 'lg 24' },
];

/** The glyph, written the way product code writes it. */
const Glyph = ({ name, family = 'fa-solid', size = '--icon-md', color = '--ds-icon-subtle', ...rest }) => (
    <i
        className={`${family} fa-${name}`}
        aria-hidden="true"
        style={{
            display: 'inline-block',
            fontSize: `var(${size})`,
            lineHeight: 1,
            color: `var(${color})`,
        }}
        {...rest}
    />
);

const row = { display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-end' };
const cell = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' };
const caption = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };

/* ------------------------------------------------------------------ sizes */

export const Sizes = () => (
    <div style={row}>
        {SIZES.map(({ token, label }) => (
            <div key={token} style={cell}>
                <Glyph name="circle-check" size={token} data-testid={token} />
                <span style={caption}>{label}</span>
            </div>
        ))}
    </div>
);

/** The three size tokens are 12, 16 and 24, and the glyph takes each as its font size. */
Sizes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const { token, px } of SIZES) {
        const glyph = canvas.getByTestId(token);
        await expect(parseFloat(getComputedStyle(glyph).fontSize), token).toBe(px);
    }
};

/* ----------------------------------------------------------------- styles */

export const Styles = () => (
    <div style={row}>
        <div style={cell}>
            <Glyph name="bell" family="fa-solid" />
            <span style={caption}>fa-solid</span>
        </div>
        <div style={cell}>
            <Glyph name="bell" family="fa-regular" />
            <span style={caption}>fa-regular</span>
        </div>
        <div style={cell}>
            <Glyph name="figma" family="fa-brands" />
            <span style={caption}>fa-brands</span>
        </div>
    </div>
);

/* ----------------------------------------------------------------- colors */

const COLORS = [
    { token: '--ds-icon-subtle', label: 'Default' },
    { token: '--ds-icon', label: 'Strong' },
    { token: '--ds-icon-brand', label: 'Brand' },
    { token: '--ds-icon-success', label: 'Success' },
    { token: '--ds-icon-danger', label: 'Danger' },
];

export const Colors = () => (
    <div style={row}>
        {COLORS.map(({ token, label }) => (
            <div key={token} style={cell}>
                <Glyph name="circle-info" size="--icon-lg" color={token} data-testid={token} />
                <span style={caption}>{label}</span>
            </div>
        ))}
    </div>
);

/** The glyph paints the token it is given, in whichever color mode is on. */
Colors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const { token } of COLORS) {
        const probe = document.createElement('span');
        probe.style.color = `var(${token})`;
        canvasElement.appendChild(probe);
        const expected = getComputedStyle(probe).color;
        probe.remove();
        await expect(getComputedStyle(canvas.getByTestId(token)).color, token).toBe(expected);
    }
};

/* ------------------------------------------------------------- do / don't */

const line = { display: 'flex', alignItems: 'center', gap: 'var(--element-inline-md)' };

export const DoDont = () => (
    <DoDontGrid
        pairs={[
            {
                doExample: (
                    <div style={{ ...line, font: 'var(--body-small)' }}>
                        Show more <Glyph name="chevron-down" size="--icon-sm" color="--ds-icon" />
                    </div>
                ),
                doCaption: 'A 12 chevron beside 12 text.',
                dontExample: (
                    <div style={{ ...line, font: 'var(--body-small)' }}>
                        Show more <i className="fa-solid fa-chevron-down" aria-hidden="true" style={{ fontSize: '32px', lineHeight: 1 }} />
                    </div>
                ),
                dontCaption: 'A glyph scaled to 32. Put a large mark in a Tile.',
            },
            {
                doExample: (
                    <div style={{ display: 'inline-flex', padding: 'var(--element-pad-x-sm)', background: 'var(--ds-background-neutral)', borderRadius: 'var(--element-radius-item-md)' }}>
                        <span style={{ display: 'inline-flex', outline: '1px dashed var(--ds-icon-brand)' }}>
                            <Glyph name="gear" color="--ds-icon" />
                        </span>
                    </div>
                ),
                doCaption: 'The parent adds the padding around a 16 box.',
                dontExample: (
                    <div style={{ display: 'inline-flex', background: 'var(--ds-background-neutral)', borderRadius: 'var(--element-radius-item-md)' }}>
                        <span style={{ display: 'inline-flex', padding: 'var(--element-pad-x-sm)', outline: '1px dashed var(--ds-icon-brand)' }}>
                            <Glyph name="gear" color="--ds-icon" />
                        </span>
                    </div>
                ),
                dontCaption: 'An icon built with padding inside its own box.',
            },
            {
                doExample: (
                    <div style={{ ...line, font: 'var(--body-default)' }}>
                        <Glyph name="calendar-plus" color="--ds-icon" />
                        Schedule session
                    </div>
                ),
                doCaption: 'An icon with the words it stands for.',
                dontExample: <Glyph name="calendar-plus" color="--ds-icon" />,
                dontCaption: 'An unlabeled icon for an unfamiliar action.',
            },
        ]}
    />
);

/* -------------------------------------------------------------- playground */

export const Interactive = ({ name, style, size, color }) => (
    <Glyph name={name} family={style} size={size} color={color} />
);
Interactive.args = {
    name: 'calendar-days',
    style: 'fa-solid',
    size: '--icon-md',
    color: '--ds-icon-subtle',
};
Interactive.argTypes = {
    name: { control: 'text', description: 'Any Font Awesome Free glyph name, without the fa- prefix.' },
    style: { control: 'inline-radio', options: ['fa-solid', 'fa-regular', 'fa-brands'], description: 'The Font Awesome family.' },
    size: { control: 'inline-radio', options: ['--icon-sm', '--icon-md', '--icon-lg'], description: '12, 16 or 24.' },
    color: { control: 'select', options: COLORS.map((c) => c.token), description: 'An icon color token.' },
};
