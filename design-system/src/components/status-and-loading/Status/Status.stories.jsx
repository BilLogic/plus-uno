import React, { useState } from 'react';
import { expect, fireEvent, spyOn, userEvent, waitFor, within } from 'storybook/test';

import { alpha, px, tokenColor } from '@/storybook-docs/lib/style-probes.js';

import Status, { STATUS_DATE_STYLES, STATUS_SIZES, STATUS_STYLES, STATUS_TYPES } from './Status';

/**
 * `Status` — the condition something is in.
 *
 * THE TEST SEAM IS THIS FILE: story `play:` functions run by `check:storybook`
 * in a real browser. Every assertion is something a person could observe —
 * rendered text, roles, focus, the tooltip, computed size and color — and never
 * a class name. Colors are compared against the token they should resolve to,
 * read through a probe element. A Status is found by the `data-testid` a story
 * gives it, which the component passes through like any other attribute.
 *
 * Contrast is not re-asserted: the a11y ratchet tracks `color-contrast` over
 * every story rendered.
 */

export default {
    title: 'Components/Status and loading/Status, Count & Tag/Status',
    component: Status,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-09-29', kind: 'deprecated', summary: '`style` started accepting `positive`, `negative` and `information` as deprecated aliases for `success`, `danger` and `info`, rendering the same and warning in development.' },
        ],
        docs: {
            description: {
                component:
                    'The condition something is in, whether the system calculated it or a '
                    + 'person set it. For a number, use Count; for a category, use Tag.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const grid = { display: 'grid', gap: '12px' };

/* ------------------------------------------------------------------ helpers */

const SIZE = { medium: 20, large: 32 };
/** Left and right padding when there is no count: Element xs (4) and md (12). */
const PAD = { medium: 4, large: 12 };
/** The nested count's height, and its inset from the top and right edges. */
const COUNT = { medium: { height: 16, inset: 2 }, large: { height: 20, inset: 6 } };

/** [fill, text, inner border] per style, from the Figma set. Info is Tertiary. */
const STATE_COLORS = {
    neutral: ['--color-surface-container', '--color-on-surface-variant', '--color-on-surface-variant-state-16'],
    success: ['--color-success-state-08', '--color-success-text', '--color-success-state-16'],
    warning: ['--color-warning-state-08', '--color-warning-text', '--color-warning-state-16'],
    danger: ['--color-danger-state-08', '--color-danger-text', '--color-danger-state-16'],
    info: ['--color-tertiary-state-08', '--color-tertiary-text', '--color-tertiary-state-16'],
    discovery: ['--color-mastering-content-state-08', '--color-mastering-content-text', '--color-mastering-content-state-16'],
};

/** [border, text, icon] per date style. A date is outlined: it has no fill. */
const DATE_LOOK = {
    neutral: ['--color-outline-variant', '--color-on-surface-variant', 'fa-calendar'],
    warning: ['--color-warning-border-subtle', '--color-warning-text', 'fa-clock'],
    danger: ['--color-danger-border-subtle', '--color-danger-text', 'fa-triangle-exclamation'],
};

/** The 1px inside border is an inset box-shadow, so the height stays exact. */
const innerBorder = (el) => {
    const shadow = getComputedStyle(el).boxShadow;
    const match = shadow.match(/^(rgba?\([^)]*\)) 0px 0px 0px 1px inset$/);
    return match ? match[1] : null;
};

/** The glyph a Font Awesome solid class draws, read through a probe icon. */
const glyphOf = (host, iconClass) => {
    const probe = document.createElement('i');
    probe.className = `fa-solid ${iconClass}`;
    host.appendChild(probe);
    const glyph = getComputedStyle(probe, '::before').content;
    probe.remove();
    return glyph;
};

const iconIn = (el) => el.querySelector('i');

/** What a font-weight token resolves to as a computed weight, read through a probe. */
const tokenWeight = (host, token) => {
    const probe = document.createElement('span');
    probe.style.fontWeight = `var(${token})`;
    host.appendChild(probe);
    const value = getComputedStyle(probe).fontWeight;
    probe.remove();
    return value;
};

/* ----------------------------------------------------------------- stories */

/** The six styles at both sizes. Fill is the style's 08 layer, text its (Text), border its 16 layer. */
export const Styles = () => (
    <div style={grid}>
        {STATUS_SIZES.map((size) => (
            <div key={size} style={row}>
                {STATUS_STYLES.map((style) => (
                    <Status key={style} style={style} size={size} data-testid={`${style}-${size}`}>
                        {style}
                    </Status>
                ))}
            </div>
        ))}
    </div>
);
Styles.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);

    for (const size of STATUS_SIZES) {
        for (const [style, [fill, ink, edge]] of Object.entries(STATE_COLORS)) {
            const name = `${style}-${size}`;
            const el = canvas.getByTestId(name);
            const s = getComputedStyle(el);
            await expect(el.getBoundingClientRect().height, `${name} height`).toBe(SIZE[size]);
            await expect(s.backgroundColor, `${name} fill`).toBe(token(fill));
            await expect(s.color, `${name} text`).toBe(token(ink));
            await expect(innerBorder(el), `${name} 1px inside border`).toBe(token(edge));
            await expect(px(s.borderRadius), `${name} radius`).toBe(size === 'large' ? 6 : 4);

            const label = within(el).getByText(style);
            await expect(px(getComputedStyle(label).fontSize), `${name} text size`).toBe(size === 'large' ? 14 : 12);
            const box = el.getBoundingClientRect();
            const text = label.getBoundingClientRect();
            await expect(text.left - box.left, `${name} left padding`).toBe(PAD[size]);
            await expect(box.right - text.right, `${name} right padding`).toBe(PAD[size]);
        }
    }

    // Neutral is a solid surface; the others are translucent state layers.
    await expect(alpha(getComputedStyle(canvas.getByTestId('neutral-medium')).backgroundColor)).toBe(1);
    await expect(alpha(getComputedStyle(canvas.getByTestId('success-medium')).backgroundColor)).toBeCloseTo(0.08, 2);
};

/** A date is outlined, with a fixed icon per style: calendar, clock, alert. */
export const Dates = () => (
    <div style={grid}>
        {STATUS_SIZES.map((size) => (
            <div key={size} style={row}>
                <Status type="date" size={size} data-testid={`neutral-${size}`}>Due Oct 14</Status>
                <Status type="date" style="warning" size={size} data-testid={`warning-${size}`}>Due tomorrow</Status>
                <Status type="date" style="danger" size={size} data-testid={`danger-${size}`}>2 days overdue</Status>
            </div>
        ))}
    </div>
);
Dates.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);

    for (const size of STATUS_SIZES) {
        for (const [style, [edge, ink, icon]] of Object.entries(DATE_LOOK)) {
            const name = `${style}-${size}`;
            const el = canvas.getByTestId(name);
            const s = getComputedStyle(el);
            await expect(el.getBoundingClientRect().height, `${name} height`).toBe(SIZE[size]);
            await expect(alpha(s.backgroundColor), `${name} has no fill`).toBe(0);
            await expect(innerBorder(el), `${name} border`).toBe(token(edge));
            await expect(s.color, `${name} text`).toBe(token(ink));

            const glyph = iconIn(el);
            await expect(glyph, `${name} has an icon`).not.toBeNull();
            await expect(getComputedStyle(glyph, '::before').content, `${name} icon is ${icon}`).toBe(glyphOf(canvasElement, icon));
            await expect(glyph).toHaveAttribute('aria-hidden', 'true');
            await expect(getComputedStyle(glyph).color, `${name} icon color`).toBe(token(ink));
            await expect(px(getComputedStyle(glyph).fontSize), `${name} icon size`).toBe(size === 'large' ? 16 : 12);
        }
    }
};

/**
 * `count` nests a Count of the same style: small (16) in medium, medium (20) in
 * large, inset equally from the top and the right.
 */
export const WithCount = () => (
    <div style={grid}>
        {STATUS_SIZES.map((size) => (
            <div key={size} style={row}>
                {STATUS_STYLES.map((style) => (
                    <Status key={style} style={style} size={size} count={38} data-testid={`${style}-${size}`}>
                        {style}
                    </Status>
                ))}
            </div>
        ))}
        <div style={row}>
            <Status style="success" count={0} data-testid="zero">Completed</Status>
        </div>
    </div>
);
WithCount.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);

    for (const size of STATUS_SIZES) {
        for (const [style, [, ink]] of Object.entries(STATE_COLORS)) {
            const name = `${style}-${size}`;
            const el = canvas.getByTestId(name);
            await expect(el.getBoundingClientRect().height, `${name} keeps its height`).toBe(SIZE[size]);

            const pill = within(el).getByText('38').parentElement;
            const box = el.getBoundingClientRect();
            const p = pill.getBoundingClientRect();
            await expect(p.height, `${name} count height`).toBe(COUNT[size].height);
            await expect(p.top - box.top, `${name} count top inset`).toBe(COUNT[size].inset);
            await expect(box.right - p.right, `${name} count right inset`).toBe(COUNT[size].inset);

            // The count takes the Status style: its subtle 08 layer and (Text).
            const ground = style === 'neutral' ? '--color-on-surface-variant-state-08' : STATE_COLORS[style][0];
            await expect(getComputedStyle(pill).backgroundColor, `${name} count ground`).toBe(token(ground));
            await expect(getComputedStyle(pill).color, `${name} count text`).toBe(token(ink));
        }
    }

    // A count of 0 is hidden, and the padding stays as if there were none.
    const zero = canvas.getByTestId('zero');
    await expect(within(zero).queryByText('0')).toBeNull();
    const label = within(zero).getByText('Completed').getBoundingClientRect();
    await expect(zero.getBoundingClientRect().right - label.right).toBe(PAD.medium);
};

/** `leadingVisual` adds one icon before the label, in the text color. */
export const LeadingVisual = () => (
    <div style={row}>
        <Status style="success" leadingVisual="circle-check" data-testid="medium">Completed</Status>
        <Status style="warning" leadingVisual="triangle-exclamation" data-testid="warning">Needs review</Status>
        <Status style="success" size="large" leadingVisual="circle-check" data-testid="large">Completed</Status>
        <Status
            style="info"
            leadingVisual={<svg width="12" height="12" data-testid="node-visual"><circle cx="6" cy="6" r="6" fill="currentColor" /></svg>}
            data-testid="node"
        >
            Syncing
        </Status>
    </div>
);
LeadingVisual.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [id, size] of [['medium', 12], ['large', 16]]) {
        const el = canvas.getByTestId(id);
        const icon = iconIn(el);
        const label = within(el).getByText('Completed');
        await expect(icon.getBoundingClientRect().right, 'the icon comes first').toBeLessThanOrEqual(label.getBoundingClientRect().left);
        await expect(px(getComputedStyle(icon).fontSize)).toBe(size);
        await expect(getComputedStyle(icon).color).toBe(getComputedStyle(el).color);
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
        await expect(icon.getBoundingClientRect().left - el.getBoundingClientRect().left).toBe(PAD[id]);
    }
    await expect(getComputedStyle(iconIn(canvas.getByTestId('warning')), '::before').content)
        .toBe(glyphOf(canvasElement, 'fa-triangle-exclamation'));

    // A node visual is hidden too: the wrapper, not the caller, owns that.
    const node = canvas.getByTestId('node-visual');
    await expect(node.closest('[aria-hidden="true"]'), 'a node visual is hidden from assistive technology').not.toBeNull();
    await expect(canvas.getByTestId('node')).toHaveTextContent('Syncing');
};

/**
 * Past `maxWidth` (200) the label ends in an ellipsis, and the full text is a
 * tooltip reachable by pointer and by keyboard. A Status that fits is not a tab
 * stop.
 */
export const Truncation = () => (
    <div style={row}>
        <button type="button">Before</button>
        <Status style="info" data-testid="short">In progress</Status>
        <Status style="info" data-testid="long">
            Waiting on the district data export before the next session
        </Status>
    </div>
);
Truncation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const full = 'Waiting on the district data export before the next session';
    const long = canvas.getByTestId('long');
    const label = within(long).getByText(full);

    await expect(long.getBoundingClientRect().width, 'capped at 200').toBeLessThanOrEqual(200);
    await expect(label.scrollWidth, 'the label really is clipped').toBeGreaterThan(label.clientWidth);
    await expect(getComputedStyle(label).textOverflow).toBe('ellipsis');

    // Keyboard: the short Status is skipped, the truncated one takes focus and
    // shows the full text.
    await userEvent.click(canvas.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    await expect(long, 'the truncated Status is the next tab stop').toHaveFocus();
    await expect(canvas.getByTestId('short')).not.toHaveAttribute('tabindex');
    const tooltip = await within(document.body).findByRole('tooltip');
    await expect(tooltip).toHaveTextContent(full);
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(within(document.body).queryByRole('tooltip')).toBeNull());

    // Pointer: hovering shows the same tooltip.
    await userEvent.hover(long);
    await expect(await within(document.body).findByRole('tooltip')).toHaveTextContent(full);
    await userEvent.unhover(long);
    await waitFor(() => expect(within(document.body).queryByRole('tooltip')).toBeNull());
};

/**
 * The cap never outgrows the container: in a column narrower than 200 the
 * Status clamps to the column and truncates, rather than overflowing it. A
 * smaller `maxWidth` still caps it in a wide one.
 */
export const NarrowContainer = () => (
    <div style={grid}>
        <div data-testid="column" style={{ width: '120px', border: '1px dashed var(--color-outline-variant)' }}>
            <Status style="info" data-testid="clamped">Waiting on the district data export</Status>
        </div>
        <div style={{ width: '400px' }}>
            <Status style="info" maxWidth={100} data-testid="capped">Waiting on the district data export</Status>
        </div>
    </div>
);
NarrowContainer.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = 'Waiting on the district data export';

    const column = canvas.getByTestId('column');
    const clamped = canvas.getByTestId('clamped');
    await expect(clamped.getBoundingClientRect().width, 'clamped to the column').toBeLessThanOrEqual(column.clientWidth);
    await expect(clamped.getBoundingClientRect().right, 'does not overflow').toBeLessThanOrEqual(column.getBoundingClientRect().right);
    const label = within(clamped).getByText(text);
    await expect(label.scrollWidth, 'the label truncates instead').toBeGreaterThan(label.clientWidth);
    await waitFor(() => expect(clamped).toHaveAttribute('tabindex', '0'));

    const capped = canvas.getByTestId('capped');
    await expect(capped.getBoundingClientRect().width, 'a smaller maxWidth still caps it').toBeLessThanOrEqual(100);
};

/**
 * A Status is never a button: no button role, no click handler, and it is read
 * as its text. An `onClick`, a `role` or a `tabIndex` passed to it is dropped
 * with a development warning; `role="button"` never reaches the DOM.
 */
export const NeverAButton = () => {
    const [mounted, setMounted] = useState(false);
    const [clicks, setClicks] = useState(0);
    return (
        <div style={row}>
            <button type="button" onClick={() => setMounted(true)}>Mount a Status with onClick</button>
            <span data-testid="clicks">{clicks}</span>
            {mounted && (
                <Status
                    style="success"
                    data-testid="status"
                    onClick={() => setClicks((n) => n + 1)}
                    role="button"
                    tabIndex={0}
                >
                    Completed
                </Status>
            )}
        </div>
    );
};
NeverAButton.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        await userEvent.click(canvas.getByRole('button', { name: 'Mount a Status with onClick' }));
        const status = canvas.getByTestId('status');
        for (const name of ['onClick', 'role', 'tabIndex']) {
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining(`\`${name}\` is ignored`));
        }
        await expect(canvas.getAllByRole('button'), 'the only button is the story\'s own').toHaveLength(1);
        await expect(status).not.toHaveAttribute('role');
        await expect(status).not.toHaveAttribute('tabindex');
        await expect(status).toHaveTextContent('Completed');
        fireEvent.click(status);
        await expect(canvas.getByTestId('clicks')).toHaveTextContent('0');
    } finally {
        warn.mockRestore();
    }
};

/**
 * A date takes only neutral, warning and danger. Any other style falls back to
 * neutral with a development warning. The Status mounts on a button press after
 * the console is watched.
 */
export const DateStyleFallback = () => {
    const [mounted, setMounted] = useState(false);
    return (
        <div style={row}>
            <button type="button" onClick={() => setMounted(true)}>Mount a success date</button>
            <Status type="date" data-testid="neutral">Due Oct 14</Status>
            {mounted && <Status type="date" style="success" data-testid="fallback">Due Oct 14</Status>}
        </div>
    );
};
DateStyleFallback.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        await userEvent.click(canvas.getByRole('button', { name: 'Mount a success date' }));
        const fallback = canvas.getByTestId('fallback');
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('type="date"'));
        const neutral = canvas.getByTestId('neutral');
        await expect(innerBorder(fallback)).toBe(innerBorder(neutral));
        await expect(getComputedStyle(fallback).color).toBe(getComputedStyle(neutral).color);
        await expect(getComputedStyle(iconIn(fallback), '::before').content).toBe(glyphOf(canvasElement, 'fa-calendar'));
    } finally {
        warn.mockRestore();
    }
};

/**
 * The weight is pinned at both sizes: regular (B3) in medium, semibold (B2) in
 * large. A Status inside a table header or a heading does not inherit bold.
 */
export const PinnedWeight = () => (
    <table>
        <thead>
            <tr>
                <th><Status style="success" data-testid="th-medium">Completed</Status></th>
                <th><Status style="success" size="large" data-testid="th-large">Completed</Status></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><Status style="success" data-testid="td-medium">Completed</Status></td>
                <td><Status style="success" size="large" data-testid="td-large">Completed</Status></td>
            </tr>
        </tbody>
    </table>
);
PinnedWeight.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const weight = (id) => getComputedStyle(within(canvas.getByTestId(id)).getByText('Completed')).fontWeight;
    const header = getComputedStyle(canvasElement.querySelector('th')).fontWeight;
    await expect(Number(header), 'the header around it is bold').toBeGreaterThanOrEqual(600);

    const regular = tokenWeight(canvasElement, '--font-weight-body3-regular');
    const semibold = tokenWeight(canvasElement, '--font-weight-body2-semibold');
    for (const where of ['th', 'td']) {
        await expect(weight(`${where}-medium`), `medium in a ${where} is B3 regular`).toBe(regular);
        await expect(weight(`${where}-large`), `large in a ${where} is B2 semibold`).toBe(semibold);
    }
};

/**
 * An unknown style falls back to neutral, and an unknown type to state, each
 * with a development warning, rather than rendering an unstyled label. The
 * Statuses mount on a button press after the console is watched.
 */
export const UnknownValuesFallBack = () => {
    const [mounted, setMounted] = useState(false);
    return (
        <div style={row}>
            <button type="button" onClick={() => setMounted(true)}>Mount unknown values</button>
            <Status data-testid="neutral">Not started</Status>
            {mounted && (
                <>
                    <Status style="purple" data-testid="unknown-style">Not started</Status>
                    <Status type="deadline" style="success" data-testid="unknown-type">Not started</Status>
                </>
            )}
        </div>
    );
};
UnknownValuesFallBack.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        await userEvent.click(canvas.getByRole('button', { name: 'Mount unknown values' }));
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('style="purple" falls back to neutral'));
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('type="deadline"'));

        // The unknown style renders exactly as neutral.
        const neutral = canvas.getByTestId('neutral');
        const unknownStyle = canvas.getByTestId('unknown-style');
        await expect(getComputedStyle(unknownStyle).backgroundColor).toBe(token('--color-surface-container'));
        await expect(getComputedStyle(unknownStyle).color).toBe(getComputedStyle(neutral).color);
        await expect(innerBorder(unknownStyle)).toBe(innerBorder(neutral));

        // The unknown type is a filled state, keeping its valid style.
        const unknownType = canvas.getByTestId('unknown-type');
        await expect(getComputedStyle(unknownType).backgroundColor).toBe(token('--color-success-state-08'));
        await expect(innerBorder(unknownType)).toBe(token('--color-success-state-16'));
        await expect(iconIn(unknownType), 'a state has no date icon').toBeNull();
    } finally {
        warn.mockRestore();
    }
};

/**
 * The old names keep working. `positive`, `negative` and `information` are
 * the names Badge variants used, and each renders exactly as the library word
 * that replaced it, on a state and on a date, with a development warning that
 * names the replacement. The Statuses mount on a button press after the
 * console is watched.
 */
export const DeprecatedStyleNames = () => {
    const [mounted, setMounted] = useState(false);
    return (
        <div style={grid}>
            <button type="button" onClick={() => setMounted(true)}>Mount the old names</button>
            <div style={row}>
                <Status style="success" data-testid="success">Completed</Status>
                <Status style="danger" data-testid="danger">Overdue</Status>
                <Status style="info" data-testid="info">In progress</Status>
                <Status type="date" style="danger" data-testid="date-danger">Due Oct 14</Status>
            </div>
            {mounted && (
                <div style={row}>
                    <Status style="positive" data-testid="positive">Completed</Status>
                    <Status style="negative" data-testid="negative">Overdue</Status>
                    <Status style="information" data-testid="information">In progress</Status>
                    <Status type="date" style="negative" data-testid="date-negative">Due Oct 14</Status>
                </div>
            )}
        </div>
    );
};
DeprecatedStyleNames.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        await userEvent.click(canvas.getByRole('button', { name: 'Mount the old names' }));
        const pairs = [['positive', 'success'], ['negative', 'danger'], ['information', 'info'], ['date-negative', 'date-danger']];
        for (const [old, current] of pairs) {
            const a = getComputedStyle(canvas.getByTestId(old));
            const b = getComputedStyle(canvas.getByTestId(current));
            await expect(a.backgroundColor, `${old} fills as ${current}`).toBe(b.backgroundColor);
            await expect(a.color, `${old} reads as ${current}`).toBe(b.color);
            await expect(a.boxShadow, `${old} is edged as ${current}`).toBe(b.boxShadow);
            await expect(a.borderTopColor, `${old} is outlined as ${current}`).toBe(b.borderTopColor);
        }
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('style="positive" is deprecated; use style="success"'));
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('style="negative" is deprecated; use style="danger"'));
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('style="information" is deprecated; use style="info"'));
        // An alias is not an unknown value: it never falls back to neutral.
        const messages = warn.mock.calls.map(([m]) => String(m));
        await expect(messages.some((m) => m.includes('falls back to neutral'))).toBe(false);
    } finally {
        warn.mockRestore();
    }
};

/* -------------------------------------------------------------- playground */

/** Interactive playground. */
export const Interactive = {
    args: {
        children: 'Needs review',
        type: 'state',
        style: 'warning',
        size: 'medium',
        leadingVisual: '',
        count: 0,
        maxWidth: 200,
    },
    argTypes: {
        type: { control: 'inline-radio', options: STATUS_TYPES },
        style: { control: 'select', options: STATUS_STYLES },
        size: { control: 'inline-radio', options: STATUS_SIZES },
    },
    parameters: {
        docs: {
            description: {
                story: `A date takes only ${STATUS_DATE_STYLES.join(', ')}.`,
            },
        },
    },
    render: ({ leadingVisual, ...args }) => <Status {...args} leadingVisual={leadingVisual || undefined} />,
};
