import React from 'react';
import { expect, within } from 'storybook/test';

import Logo, { LOGO_SIZES, LOGO_APPEARANCES, LOCKUP_MIN_SIZE } from './Logo';
import LogoClearSpace from './LogoClearSpace';
import LogoConstruction, { CONSTRUCTION_RADII } from './LogoConstruction';
import { CORNER_CENTERS } from './logoConstructionGeometry.js';

/**
 * `Logo` — the PLUS mark and lockup.
 *
 * THE TEST SEAM IS THIS FILE. Play functions run by `check:storybook` in a real
 * browser and assert what a person could see: the rendered height, the small-size
 * plus, the lockup falling back to the mark. Logos are found by `data-testid`.
 */
export default {
    title: 'Components/Images and icons/Logo',
    component: Logo,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        appearance: { control: 'select', options: LOGO_APPEARANCES, description: 'One of six appearances', table: { category: 'Appearance' } },
        size: { control: 'select', options: LOGO_SIZES, description: 'Height of the mark in pixels', table: { category: 'Appearance' } },
        wordmark: { control: 'boolean', description: 'Show the lockup. From size 24; below that the mark stands alone', table: { category: 'Appearance' } },
        className: { control: 'text', description: 'Additional CSS classes', table: { category: 'Development' } },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--stack-lg)', alignItems: 'flex-end' };
const caption = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };

/** A ground for a theme: the dark theme the logo's stronger glows are drawn for. */
const Ground = ({ mode, children }) => (
    <div
        data-color-mode={mode}
        style={{
            ...row,
            padding: 'var(--card-pad-spacious)',
            borderRadius: 'var(--card-radius)',
            background: 'var(--ds-surface)',
            color: 'var(--ds-text)',
        }}
    >
        {children}
    </div>
);

const reversedGround = (appearance) => (['outlined-reversed', 'colored-dark', 'dark'].includes(appearance) ? 'dark' : 'light');

const sizeRow = (props) => LOGO_SIZES.map((size) => (
    <figure key={size} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', alignItems: 'flex-start' }}>
        <Logo size={size} {...props} data-testid={`logo-${size}`} />
        <figcaption style={caption}>{size}</figcaption>
    </figure>
));

const heightOf = (el) => el.querySelector('svg').getBoundingClientRect().height;
const plusHeight = (el) => parseFloat(el.querySelectorAll('.plus-logo__plus rect')[1].getAttribute('height'));

export const Playground = { args: { appearance: 'colored', size: 32, wordmark: false } };

/** Each size, light. */
export const Sizes = {
    render: () => <Ground mode="light">{sizeRow({})}</Ground>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const size of LOGO_SIZES) {
            await expect(heightOf(canvas.getByTestId(`logo-${size}`))).toBeCloseTo(size, 0);
        }
    },
};

/** Each size, dark: the stronger glows. */
export const SizesDark = {
    render: () => <Ground mode="dark">{sizeRow({})}</Ground>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(heightOf(canvas.getByTestId('logo-96'))).toBeCloseTo(96, 0);
    },
};

/** The small-size drawing at 24 and below keeps the plus open. */
export const SmallSizeDrawing = {
    render: () => <Ground mode="light">{sizeRow({})}</Ground>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(plusHeight(canvas.getByTestId('logo-16'))).toBe(27);
        await expect(plusHeight(canvas.getByTestId('logo-24'))).toBe(27);
        await expect(plusHeight(canvas.getByTestId('logo-32'))).toBe(24);
    },
};

/** The lockup from 24; below that the mark stands alone. */
export const Lockup = {
    render: () => <Ground mode="light">{sizeRow({ wordmark: true })}</Ground>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const size of LOGO_SIZES) {
            const el = canvas.getByTestId(`logo-${size}`);
            const wide = el.querySelector('svg').getBoundingClientRect().width > size * 1.5;
            await expect(wide).toBe(size >= LOCKUP_MIN_SIZE);
        }
    },
};

/** The lockup in the dark theme. */
export const LockupDark = {
    render: () => <Ground mode="dark">{sizeRow({ wordmark: true })}</Ground>,
};

/** Every appearance at 48, mark and lockup, on the ground it is drawn for. */
export const Appearances = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            {LOGO_APPEARANCES.map((appearance) => (
                <Ground key={appearance} mode={reversedGround(appearance)}>
                    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                        <div style={row}>
                            <Logo appearance={appearance} size={48} data-testid={`mark-${appearance}`} />
                            <Logo appearance={appearance} size={48} wordmark data-testid={`lockup-${appearance}`} />
                        </div>
                        <figcaption style={caption}>{appearance}</figcaption>
                    </figure>
                </Ground>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const appearance of LOGO_APPEARANCES) {
            await expect(canvas.getByTestId(`mark-${appearance}`)).toHaveClass(`plus-logo--${appearance}`);
        }
    },
};

/** Light and dark side by side for each appearance that follows the theme. */
export const LightAndDark = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            {['light', 'dark'].map((mode) => (
                <Ground key={mode} mode={mode}>
                    {LOGO_APPEARANCES.map((appearance) => (
                        <Logo key={appearance} appearance={appearance} size={64} data-testid={`${mode}-${appearance}`} />
                    ))}
                </Ground>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const glows = (id) => {
            const el = canvas.getByTestId(id);
            return getComputedStyle(el.querySelector('.plus-logo__glows--light') ?? el.querySelector('.plus-logo__glows--dark')).display;
        };
        // The colored mark swaps its light glows out for the strong set in dark mode.
        await expect(glows('light-colored')).not.toBe('none');
        const darkLight = canvas.getByTestId('dark-colored').querySelector('.plus-logo__glows--light');
        await expect(getComputedStyle(darkLight).display).toBe('none');
    },
};

/** The construction drawing, docs only: guides over the Logo at a large size. The Logo itself takes no extra props. */
export const Construction = {
    render: () => (
        <Ground mode="light">
            <LogoConstruction />
        </Ground>
    ),
    play: async ({ canvasElement }) => {
        const guides = canvasElement.querySelector('[data-testid="construction-guides"]');
        const radii = [...guides.querySelectorAll('circle[r]:not(.plus-logo-construction__dot)')].map((c) => parseFloat(c.getAttribute('r')));
        await expect(radii.sort((a, b) => a - b)).toEqual([
            ...CORNER_CENTERS.map(() => CONSTRUCTION_RADII.corner),
            CONSTRUCTION_RADII.inner,
            CONSTRUCTION_RADII.outer,
        ]);
        await expect(guides.querySelectorAll('.plus-logo-construction__dot').length).toBe(3);
        // The Logo underneath is the ordinary 96 mark, unchanged.
        const logo = within(canvasElement).getByTestId('construction-logo');
        await expect(logo).toHaveClass('plus-logo--colored');
        await expect(logo.querySelector('svg').getAttribute('viewBox')).toBe('0 0 96 96');
        await expect(plusHeight(logo)).toBe(24);
    },
};

/** The clear-space drawing, docs only: half the mark's height on every side of the lockup. */
export const ClearSpace = {
    render: () => (
        <Ground mode="light">
            <LogoClearSpace />
        </Ground>
    ),
    play: async ({ canvasElement }) => {
        const zone = canvasElement.querySelector('[data-testid="logo-clear-space"]');
        const mark = within(canvasElement).getByTestId('clear-space-logo').querySelector('svg');
        const z = zone.getBoundingClientRect();
        const m = mark.getBoundingClientRect();
        await expect(Math.abs(m.left - z.left - m.height / 2)).toBeLessThanOrEqual(2); // the zone's own 1px border
        await expect(Math.abs(m.top - z.top - m.height / 2)).toBeLessThanOrEqual(2); // the zone's own 1px border
        await expect(Math.abs(z.right - m.right - m.height / 2)).toBeLessThanOrEqual(2); // the zone's own 1px border
        await expect(Math.abs(z.bottom - m.bottom - m.height / 2)).toBeLessThanOrEqual(2);
    },
};
