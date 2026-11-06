import React, { useState } from 'react';
import { expect, spyOn, userEvent, within } from 'storybook/test';

import { contrastRatio as contrast } from '@/storybook-docs/lib/contrast.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import CountTag, { COUNT_TAG_APPEARANCES, COUNT_TAG_SPACINGS } from './CountTag';

/**
 * `CountTag` — a number on its own, as a near-square badge.
 *
 * THE TEST SEAM IS THIS FILE: story `play:` functions run by `check:storybook`
 * in a real browser. Every assertion is something a person could observe —
 * rendered text, accessible names, computed size and color — and never a class
 * name. Colors are compared against the token they should resolve to, read
 * through a probe element, so a wrong mapping fails here rather than in review.
 *
 * Contrast is not re-asserted: the a11y ratchet tracks `color-contrast` over
 * every story rendered.
 */

export default {
    title: 'Components/Labels/Count tag',
    component: CountTag,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A number on its own: unread items, results, errors. For the condition '
                    + 'something is in, use Status tag; for a category, use Tag.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };

/* ------------------------------------------------------------------ helpers */

const px = (v) => parseFloat(v);

/** What a token resolves to as a computed color, read through a probe. */
const tokenColor = (host, token) => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = `var(${token})`;
    host.appendChild(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
};

const alpha = (color) => {
    const parts = color.match(/[\d.]+/g).map(Number);
    return parts.length === 4 ? parts[3] : 1;
};

/** The pill that holds a given piece of text. */
const pillOf = (canvas, text) => canvas.getByText(text).parentElement;

/* ----------------------------------------------------------------- stories */

/** Emphasis. Subtle is the default; `isBold` asks for action now; `isInverse` is for filled buttons and dark grounds; `isDot` is presence. */
export const Appearances = () => (
    <div style={row}>
        <CountTag value={12} />
        <CountTag value={13} isBold appearance="danger" />
        <button type="button" className="btn btn-primary">
            Review <CountTag value={14} isInverse />
        </button>
        <span style={{ background: 'var(--ds-background-neutral-bold)', padding: '8px', borderRadius: '6px' }}>
            <CountTag value={15} isInverse />
        </span>
        <CountTag isDot appearance="danger" label="New activity" />
    </div>
);
Appearances.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const subtle = getComputedStyle(pillOf(canvas, '12'));
    await expect(subtle.backgroundColor, 'subtle neutral is the neutral background').toBe(
        tokenColor(canvasElement, '--ds-background-neutral'),
    );
    await expect(subtle.color).toBe(tokenColor(canvasElement, '--ds-text'));

    const bold = getComputedStyle(pillOf(canvas, '13'));
    await expect(bold.backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-danger-bold'));
    await expect(bold.color).toBe(tokenColor(canvasElement, '--ds-text-inverse'));

    // Inverse is a solid surface badge with subtle text, on a button and on a
    // bold neutral fill alike.
    for (const text of ['14', '15']) {
        const inverse = getComputedStyle(pillOf(canvas, text));
        await expect(inverse.backgroundColor, 'inverse is the surface').toBe(
            tokenColor(canvasElement, '--ds-surface'),
        );
        await expect(alpha(inverse.backgroundColor), 'inverse is solid').toBe(1);
        await expect(inverse.color).toBe(tokenColor(canvasElement, '--ds-text-subtle'));
        await expect(contrast(inverse.color, inverse.backgroundColor), 'AA on any fill').toBeGreaterThanOrEqual(4.5);
    }

    const dot = canvas.getByRole('img', { name: 'New activity' });
    const d = getComputedStyle(dot);
    await expect(px(d.height)).toBe(8);
    await expect(px(d.width)).toBe(8);
    await expect(d.backgroundColor).toBe(tokenColor(canvasElement, '--ds-icon-danger'));
    await expect(dot).toHaveTextContent('');
    await expect(px(d.borderRadius), 'the dot stays round').toBeGreaterThanOrEqual(4);
};

/** Both spacings: 20 on its own, 16 (compact) inside a Status tag or Tag. Min-width is 24, so a digit is a near-square. */
export const Spacings = () => (
    <div style={row}>
        <CountTag value={1} />
        <CountTag value={2} spacing="compact" />
        <CountTag value={1204} />
    </div>
);
Spacings.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const [text, size] of [['1', 20], ['2', 16]]) {
        const pill = pillOf(canvas, text);
        const s = getComputedStyle(pill);
        await expect(pill.getBoundingClientRect().height, `${text} is ${size} tall`).toBe(size);
        await expect(px(s.minWidth), 'min-width is size-150').toBe(24);
        await expect(pill.getBoundingClientRect().width, 'one digit is 24 wide').toBe(24);
        await expect(px(s.paddingLeft), 'padding is the Element xs token, not 8').toBe(4);
        await expect(px(s.paddingRight)).toBe(4);
        await expect(px(s.borderRadius), 'corner is radius-0125').toBe(2);
        await expect(px(getComputedStyle(canvas.getByText(text)).fontSize), 'B3 12').toBe(12);
    }

    const wide = pillOf(canvas, '99+');
    await expect(wide.getBoundingClientRect().width, 'grows with its digits').toBeGreaterThan(24);
    await expect(wide.getBoundingClientRect().height).toBe(20);
};

/** `max` caps the number with a `+`. */
export const Max = () => (
    <div style={row}>
        <CountTag value={99} />
        <CountTag value={100} />
        <CountTag value={12} max={9} />
    </div>
);
Max.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('99')).toBeInTheDocument();
    await expect(canvas.getByText('99+')).toBeInTheDocument();
    await expect(canvas.getByText('9+')).toBeInTheDocument();
    await expect(canvas.queryByText('100')).toBeNull();
};

/** A count of 0 renders nothing, unless `showZero`. */
export const Zero = () => (
    <div style={row}>
        <span data-testid="hidden">Messages <CountTag value={0} /></span>
        <span data-testid="shown">Results <CountTag value={0} showZero /></span>
    </div>
);
Zero.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hidden = canvas.getByTestId('hidden');
    await expect(hidden).toHaveTextContent(/^Messages$/);
    await expect(hidden.children).toHaveLength(0);
    await expect(within(canvas.getByTestId('shown')).getByText('0')).toBeInTheDocument();
};

/** The ring, for a count pinned to an icon or avatar: 2px of surface outside the badge. */
export const Ring = () => (
    <div style={row}>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
            <i className="fa-solid fa-bell" aria-hidden="true" style={{ fontSize: '20px' }} />
            <span style={{ position: 'absolute', top: '-6px', right: '-10px' }}>
                <CountTag value={3} isBold appearance="danger" hasRing label="3 notifications" />
            </span>
        </span>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
            <i className="fa-solid fa-bell" aria-hidden="true" style={{ fontSize: '20px' }} />
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', display: 'flex' }}>
                <CountTag isDot appearance="danger" hasRing label="New notifications" />
            </span>
        </span>
    </div>
);
Ring.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const surface = tokenColor(canvasElement, '--ds-surface');

    const numeric = canvas.getByText('3').parentElement;
    const dot = canvas.getByRole('img', { name: 'New notifications' });
    for (const el of [numeric, dot]) {
        const shadow = getComputedStyle(el).boxShadow;
        await expect(shadow, 'the ring is the surface color').toContain(surface);
        await expect(shadow, 'the ring is 2px, spread outside the box').toMatch(/0px 0px 0px 2px/);
    }
    await expect(numeric.getBoundingClientRect().height, 'the ring does not change the height').toBe(20);
    await expect(dot.getBoundingClientRect().height).toBe(8);
};

/**
 * Every style, subtle and bold, at both sizes, and the dot. Bold warning uses
 * Warning Container.
 */
export const Styles = () => (
    <div style={{ display: 'grid', gap: '12px' }}>
        {[false, true].flatMap((isBold) => COUNT_TAG_SPACINGS.map((spacing) => (
            <div key={`${isBold}-${spacing}`} style={row}>
                {COUNT_TAG_APPEARANCES.map((appearance) => (
                    <CountTag
                        key={appearance}
                        value={12}
                        isBold={isBold}
                        appearance={appearance}
                        spacing={spacing}
                        label={`${isBold ? 'bold' : 'subtle'} ${appearance} ${spacing}`}
                    />
                ))}
            </div>
        )))}
        <div style={row}>
            {COUNT_TAG_APPEARANCES.map((appearance) => (
                <CountTag key={appearance} isDot appearance={appearance} label={`dot ${appearance}`} />
            ))}
        </div>
    </div>
);
Styles.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pill = (name) => canvas.getByText(name).parentElement;

    // [ground, ink] per style, from the Figma set.
    const expected = {
        subtle: {
            neutral: ['--ds-background-neutral', '--ds-text'],
            success: ['--ds-background-success', '--ds-text-success'],
            warning: ['--ds-background-warning', '--ds-text-warning'],
            danger: ['--ds-background-danger', '--ds-text-danger'],
            info: ['--ds-background-information', '--ds-text-information'],
            discovery: ['--ds-background-smart-mastering-content', '--ds-text-smart-mastering-content'],
        },
        bold: {
            neutral: ['--ds-background-neutral-bold', '--ds-text-inverse'],
            success: ['--ds-background-success-bold', '--ds-text-inverse'],
            warning: ['--ds-background-warning-bold', '--ds-text-warning-inverse'],
            danger: ['--ds-background-danger-bold', '--ds-text-inverse'],
            info: ['--ds-background-information-bold', '--ds-text-inverse'],
            discovery: ['--ds-background-smart-mastering-content-bold', '--ds-text-inverse'],
        },
    };

    // The same mapping holds in dark and at more contrast: every ground and
    // ink is a themed token, so a legacy light-only color fails here.
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        for (const [appearance, styles] of Object.entries(expected)) {
            for (const size of COUNT_TAG_SPACINGS) {
                for (const [style, [ground, ink]] of Object.entries(styles)) {
                    const name = `${appearance} ${style} ${size}`;
                    const s = getComputedStyle(pill(name));
                    await expect(s.backgroundColor, `${mode}: ${name} ground`).toBe(token(ground));
                    await expect(s.color, `${mode}: ${name} ink`).toBe(token(ink));
                    await expect(pill(name).getBoundingClientRect().height, `${name} height`).toBe(size === 'compact' ? 16 : 20);
                }
            }
        }

        const dots = {
            neutral: '--ds-icon-subtle',
            success: '--ds-icon-success',
            warning: '--ds-icon-warning',
            danger: '--ds-icon-danger',
            info: '--ds-icon-information',
            discovery: '--ds-icon-smart-mastering-content',
        };
        for (const [style, fill] of Object.entries(dots)) {
            const dot = canvas.getByRole('img', { name: `dot ${style}` });
            await expect(getComputedStyle(dot).backgroundColor, `${mode}: dot ${style} fill`).toBe(token(fill));
        }
    });
};

/**
 * A dot without `label` warns in development; with one, the name is exposed.
 * Both dots mount on a button press after the console is watched, so the
 * named one is shown not to warn and the unnamed one is shown to. The unnamed
 * dot is removed again so the story itself stays accessible.
 */
export const DotNeedsALabel = () => {
    const [named, setNamed] = useState(false);
    const [unnamed, setUnnamed] = useState(false);
    return (
        <div style={row}>
            <button type="button" onClick={() => setNamed(true)}>Mount a named dot</button>
            <button type="button" onClick={() => setUnnamed((v) => !v)}>
                {unnamed ? 'Remove the unnamed dot' : 'Mount an unnamed dot'}
            </button>
            {named && <CountTag isDot appearance="success" label="Online" />}
            {unnamed && <span data-testid="unnamed"><CountTag isDot /></span>}
        </div>
    );
};
DotNeedsALabel.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    const countWarnings = () => warn.mock.calls.filter(([m]) => String(m).includes('[CountTag]'));
    try {
        await userEvent.click(canvas.getByRole('button', { name: 'Mount a named dot' }));
        await expect(canvas.getByRole('img', { name: 'Online' })).toBeInTheDocument();
        await expect(countWarnings(), 'a named dot does not warn').toHaveLength(0);

        await userEvent.click(canvas.getByRole('button', { name: 'Mount an unnamed dot' }));
        await expect(canvas.getByTestId('unnamed')).toBeInTheDocument();
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('needs a `label`'));
        await userEvent.click(canvas.getByRole('button', { name: 'Remove the unnamed dot' }));
    } finally {
        warn.mockRestore();
    }
};

/** With a label, a number is read as information rather than a bare digit. */
export const LabeledNumber = () => (
    <button type="button" className="btn btn-outline-secondary">
        Messages <CountTag value={4} label="4 unread" />
    </button>
);
LabeledNumber.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Messages 4 unread' })).toBeInTheDocument();
    await expect(canvas.queryByRole('img')).toBeNull();
};

/* -------------------------------------------------------------- playground */

/** Interactive playground. */
export const Interactive = {
    args: {
        value: 12,
        max: 99,
        showZero: false,
        appearance: 'neutral',
        spacing: 'default',
        isBold: false,
        isInverse: false,
        isDot: false,
        hasRing: false,
        label: '',
    },
    argTypes: {
        appearance: { control: 'select', options: COUNT_TAG_APPEARANCES },
        spacing: { control: 'inline-radio', options: COUNT_TAG_SPACINGS },
    },
    render: (args) => <CountTag {...args} label={args.label || (args.isDot ? 'Notification' : undefined)} />,
};
