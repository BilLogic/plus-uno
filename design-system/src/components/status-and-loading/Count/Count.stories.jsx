import React, { useState } from 'react';
import { expect, spyOn, userEvent, within } from 'storybook/test';

import Count, { COUNT_APPEARANCES, COUNT_SIZES, COUNT_STYLES } from './Count';

/**
 * `Count` — a number on its own, as a pill.
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
    title: 'Components/Status and loading/Count',
    component: Count,
    parameters: {
        docs: {
            description: {
                component:
                    'A number on its own: unread items, results, errors. For the condition '
                    + 'something is in, use Status; for a category, use Tag.',
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

/** The four appearances. Subtle is the default; bold asks for action now; dot is presence. */
export const Appearances = () => (
    <div style={row}>
        <Count value={12} />
        <Count value={13} appearance="bold" style="danger" />
        <span style={{ background: 'var(--color-inverse-surface)', padding: '8px', borderRadius: '6px' }}>
            <Count value={14} appearance="inverse" />
        </span>
        <Count appearance="dot" style="danger" label="New activity" />
    </div>
);
Appearances.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const subtle = getComputedStyle(pillOf(canvas, '12'));
    await expect(subtle.backgroundColor, 'subtle neutral is on-surface-variant 08').toBe(
        tokenColor(canvasElement, '--color-on-surface-variant-state-08'),
    );
    await expect(alpha(subtle.backgroundColor), 'subtle is translucent').toBeCloseTo(0.08, 2);
    await expect(subtle.color).toBe(tokenColor(canvasElement, '--color-on-surface-variant'));

    const bold = getComputedStyle(pillOf(canvas, '13'));
    await expect(bold.backgroundColor).toBe(tokenColor(canvasElement, '--color-danger'));
    await expect(bold.color).toBe(tokenColor(canvasElement, '--color-on-danger'));

    const inverse = getComputedStyle(pillOf(canvas, '14'));
    await expect(inverse.backgroundColor, 'inverse is surface at 16%').toBe(
        tokenColor(canvasElement, '--color-surface-state-16'),
    );
    await expect(alpha(inverse.backgroundColor)).toBeCloseTo(0.16, 2);
    await expect(inverse.color).toBe(tokenColor(canvasElement, '--color-surface'));

    const dot = canvas.getByRole('img', { name: 'New activity' });
    const d = getComputedStyle(dot);
    await expect(px(d.height)).toBe(8);
    await expect(px(d.width)).toBe(8);
    await expect(d.backgroundColor).toBe(tokenColor(canvasElement, '--color-danger'));
    await expect(dot).toHaveTextContent('');
};

/** Both sizes: 20 on its own, 16 inside a Status or Tag. Min-width equals height. */
export const Sizes = () => (
    <div style={row}>
        <Count value={1} />
        <Count value={2} size="small" />
        <Count value={1204} />
    </div>
);
Sizes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const [text, size] of [['1', 20], ['2', 16]]) {
        const pill = pillOf(canvas, text);
        const s = getComputedStyle(pill);
        await expect(pill.getBoundingClientRect().height, `${text} is ${size} tall`).toBe(size);
        await expect(px(s.minWidth), 'min-width equals height').toBe(size);
        await expect(pill.getBoundingClientRect().width, 'one digit is a circle').toBe(size);
        await expect(px(s.paddingLeft), 'padding is the Element xs token, not 8').toBe(4);
        await expect(px(s.paddingRight)).toBe(4);
        await expect(px(s.borderRadius), 'fully rounded').toBeGreaterThanOrEqual(size / 2);
        await expect(px(getComputedStyle(canvas.getByText(text)).fontSize), 'B3 12').toBe(12);
    }

    const wide = pillOf(canvas, '99+');
    await expect(wide.getBoundingClientRect().width, 'grows with its digits').toBeGreaterThan(20);
    await expect(wide.getBoundingClientRect().height).toBe(20);
};

/** `max` caps the number with a `+`. */
export const Max = () => (
    <div style={row}>
        <Count value={99} />
        <Count value={100} />
        <Count value={12} max={9} />
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
        <span data-testid="hidden">Messages <Count value={0} /></span>
        <span data-testid="shown">Results <Count value={0} showZero /></span>
    </div>
);
Zero.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hidden = canvas.getByTestId('hidden');
    await expect(hidden).toHaveTextContent(/^Messages$/);
    await expect(hidden.children).toHaveLength(0);
    await expect(within(canvas.getByTestId('shown')).getByText('0')).toBeInTheDocument();
};

/** The ring, for a count pinned to an icon or avatar: 2px of surface outside the pill. */
export const Ring = () => (
    <div style={row}>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
            <i className="fa-solid fa-bell" aria-hidden="true" style={{ fontSize: '20px' }} />
            <span style={{ position: 'absolute', top: '-6px', right: '-10px' }}>
                <Count value={3} appearance="bold" style="danger" ring label="3 notifications" />
            </span>
        </span>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
            <i className="fa-solid fa-bell" aria-hidden="true" style={{ fontSize: '20px' }} />
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', display: 'flex' }}>
                <Count appearance="dot" style="danger" ring label="New notifications" />
            </span>
        </span>
    </div>
);
Ring.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const surface = tokenColor(canvasElement, '--color-surface');

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

/** Every style, subtle and bold. Bold warning uses Warning Container. */
export const Styles = () => (
    <div style={{ display: 'grid', gap: '12px' }}>
        {['subtle', 'bold'].map((appearance) => (
            <div key={appearance} style={row} data-testid={appearance}>
                {COUNT_STYLES.map((style) => (
                    <Count key={style} value={12} appearance={appearance} style={style} label={`${appearance} ${style}`} />
                ))}
            </div>
        ))}
        <div style={row}>
            {COUNT_STYLES.map((style) => (
                <Count key={style} appearance="dot" style={style} label={`dot ${style}`} />
            ))}
        </div>
    </div>
);
Styles.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ground = (appearance, style) =>
        getComputedStyle(canvas.getByText(`${appearance} ${style}`).parentElement).backgroundColor;

    const subtle = {
        success: '--color-success-state-08',
        warning: '--color-warning-state-08',
        danger: '--color-danger-state-08',
        info: '--color-tertiary-state-08',
        discovery: '--color-mastering-content-state-08',
    };
    for (const [style, token] of Object.entries(subtle)) {
        await expect(ground('subtle', style), `subtle ${style}`).toBe(tokenColor(canvasElement, token));
    }

    const bold = {
        neutral: '--color-inverse-surface',
        success: '--color-success',
        warning: '--color-warning-container',
        danger: '--color-danger',
        info: '--color-tertiary',
        discovery: '--color-mastering-content',
    };
    for (const [style, token] of Object.entries(bold)) {
        await expect(ground('bold', style), `bold ${style}`).toBe(tokenColor(canvasElement, token));
    }

    for (const style of COUNT_STYLES) {
        await expect(canvas.getByRole('img', { name: `dot ${style}` })).toBeInTheDocument();
    }
};

/**
 * A dot without `label` warns in development; with one, the name is exposed.
 * The unnamed dot mounts on a button press so the warning is observed as it
 * happens, and is removed again so the story itself stays accessible.
 */
export const DotNeedsALabel = () => {
    const [unnamed, setUnnamed] = useState(false);
    return (
        <div style={row}>
            <button type="button" onClick={() => setUnnamed((v) => !v)}>
                {unnamed ? 'Remove the unnamed dot' : 'Mount an unnamed dot'}
            </button>
            {unnamed && <span data-testid="unnamed"><Count appearance="dot" /></span>}
            <Count appearance="dot" style="success" label="Online" />
        </div>
    );
};
DotNeedsALabel.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        await expect(warn, 'a named dot does not warn').not.toHaveBeenCalled();
        await userEvent.click(canvas.getByRole('button', { name: 'Mount an unnamed dot' }));
        await expect(canvas.getByTestId('unnamed')).toBeInTheDocument();
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('needs a `label`'));
        await userEvent.click(canvas.getByRole('button', { name: 'Remove the unnamed dot' }));
    } finally {
        warn.mockRestore();
    }
    await expect(canvas.getByRole('img', { name: 'Online' })).toBeInTheDocument();
};

/** With a label, a number is read as information rather than a bare digit. */
export const LabelledNumber = () => (
    <button type="button" className="btn btn-outline-secondary">
        Messages <Count value={4} label="4 unread" />
    </button>
);
LabelledNumber.play = async ({ canvasElement }) => {
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
        appearance: 'subtle',
        style: 'neutral',
        size: 'medium',
        ring: false,
        label: '',
    },
    argTypes: {
        appearance: { control: 'inline-radio', options: COUNT_APPEARANCES },
        style: { control: 'select', options: COUNT_STYLES },
        size: { control: 'inline-radio', options: COUNT_SIZES },
    },
    render: (args) => <Count {...args} label={args.label || (args.appearance === 'dot' ? 'Notification' : undefined)} />,
};
