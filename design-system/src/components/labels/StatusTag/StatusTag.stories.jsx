import React, { useState } from 'react';
import { Button } from '@/components';
import { expect, fireEvent, spyOn, userEvent, waitFor, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';

import StatusTag, { STATUS_TAG_APPEARANCES, STATUS_TAG_SPACINGS } from './StatusTag';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';

/**
 * `StatusTag` — the condition something is in.
 *
 * THE TEST SEAM IS THIS FILE: story `play:` functions run by `check:storybook`
 * in a real browser. Every assertion is something a person could observe —
 * rendered text, roles, focus, the tooltip, computed size and color — and never
 * a class name. Colors are compared against the token they should resolve to,
 * read through a probe element. A Status tag is found by the `data-testid` a story
 * gives it, which the component passes through like any other attribute.
 *
 * Contrast is not re-asserted: the a11y ratchet tracks `color-contrast` over
 * every story rendered.
 */

export default {
    title: 'Components/Labels/Status tag',
    component: StatusTag,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'The condition something is in, whether the system calculated it or a '
                    + 'person set it. For a number, use Count tag; for a category, use Tag.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const grid = { display: 'grid', gap: '12px' };

/* ------------------------------------------------------------------ helpers */

const SIZE = { default: 20, spacious: 32 };
/** Left and right padding when there is no count: Element xs (4) and md (12). */
const PAD = { default: 4, spacious: 12 };
/** The nested count's height, and its inset from the top and right edges. */
const COUNT = { default: { height: 16, inset: 2 }, spacious: { height: 20, inset: 6 } };

/** [fill, text, inner border] per appearance, from the Figma set. Info is Tertiary. */
const STATE_COLORS = {
    neutral: ['--ds-background-neutral', '--ds-text', '--ds-background-neutral-pressed'],
    success: ['--ds-background-success', '--ds-text-success', '--ds-background-success-pressed'],
    warning: ['--ds-background-warning', '--ds-text-warning', '--ds-background-warning-pressed'],
    danger: ['--ds-background-danger', '--ds-text-danger', '--ds-background-danger-pressed'],
    info: ['--ds-background-information', '--ds-text-information', '--ds-background-information-pressed'],
    discovery: ['--ds-background-smart-mastering-content', '--ds-text-smart-mastering-content', '--ds-background-smart-mastering-content-pressed'],
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

/** Every appearance at every spacing. Fill is the appearance's tinted background, text its (Text), border its pressed step. */
export const Styles = () => (
    <div style={grid}>
        {STATUS_TAG_SPACINGS.map((size) => (
            <div key={size} style={row}>
                {STATUS_TAG_APPEARANCES.map((appearance) => (
                    <StatusTag key={appearance} appearance={appearance} spacing={size} data-testid={`${appearance}-${size}`}>
                        {appearance}
                    </StatusTag>
                ))}
            </div>
        ))}
    </div>
);
Styles.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);

    // The mapping holds in dark and at more contrast: every fill, text and
    // edge is a themed token, so a light-only color fails here.
    await inEveryColorModeOf(canvasElement, async (mode, themed) => {
        for (const size of STATUS_TAG_SPACINGS) {
            for (const [style, [fill, ink, edge]] of Object.entries(STATE_COLORS)) {
                const el = canvas.getByTestId(`${style}-${size}`);
                const s = getComputedStyle(el);
                const name = `${mode}: ${style}-${size}`;
                await expect(s.backgroundColor, `${name} fill`).toBe(themed(fill));
                await expect(s.color, `${name} text`).toBe(themed(ink));
                await expect(innerBorder(el), `${name} 1px inside border`).toBe(themed(edge));
            }
        }
    });

    for (const size of STATUS_TAG_SPACINGS) {
        for (const [style] of Object.entries(STATE_COLORS)) {
            const name = `${style}-${size}`;
            const el = canvas.getByTestId(name);
            const s = getComputedStyle(el);
            await expect(el.getBoundingClientRect().height, `${name} height`).toBe(SIZE[size]);
            await expect(px(s.borderRadius), `${name} radius`).toBe(size === 'spacious' ? 8 : 4);

            const label = within(el).getByText(style);
            await expect(px(getComputedStyle(label).fontSize), `${name} text size`).toBe(size === 'spacious' ? 14 : 12);
            const box = el.getBoundingClientRect();
            const text = label.getBoundingClientRect();
            await expect(text.left - box.left, `${name} left padding`).toBe(PAD[size]);
            await expect(box.right - text.right, `${name} right padding`).toBe(PAD[size]);
        }
    }
};

/**
 * `trailingMetric` nests a Count tag of the same appearance: compact (16) in default,
 * default (20) in spacious, inset equally from the top and the right.
 */
export const WithCount = () => (
    <div style={grid}>
        {STATUS_TAG_SPACINGS.map((size) => (
            <div key={size} style={row}>
                {STATUS_TAG_APPEARANCES.map((appearance) => (
                    <StatusTag key={appearance} appearance={appearance} spacing={size} trailingMetric={38} data-testid={`${appearance}-${size}`}>
                        {appearance}
                    </StatusTag>
                ))}
            </div>
        ))}
        <div style={row}>
            <StatusTag appearance="success" trailingMetric={0} data-testid="zero">Completed</StatusTag>
        </div>
    </div>
);
WithCount.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);

    for (const size of STATUS_TAG_SPACINGS) {
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

            // The count takes the Status tag appearance: its subtle tinted background and (Text).
            const ground = style === 'neutral' ? '--ds-background-neutral' : STATE_COLORS[style][0];
            await expect(getComputedStyle(pill).backgroundColor, `${name} count ground`).toBe(token(ground));
            await expect(getComputedStyle(pill).color, `${name} count text`).toBe(token(style === 'neutral' ? '--ds-text' : ink));
        }
    }

    // A count of 0 is hidden, and the padding stays as if there were none.
    const zero = canvas.getByTestId('zero');
    await expect(within(zero).queryByText('0')).toBeNull();
    const label = within(zero).getByText('Completed').getBoundingClientRect();
    await expect(zero.getBoundingClientRect().right - label.right).toBe(PAD.default);
};

/**
 * `trailingMetricAppearance` sets the nested Count tag's own appearance, which
 * otherwise follows the Status tag's.
 */
export const TrailingMetricAppearance = () => (
    <div style={row}>
        <StatusTag appearance="success" trailingMetric={4} data-testid="follows">Completed</StatusTag>
        <StatusTag appearance="success" trailingMetric={4} trailingMetricAppearance="danger" data-testid="own">Completed</StatusTag>
    </div>
);
TrailingMetricAppearance.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pillIn = (id) => within(canvas.getByTestId(id)).getByText('4').parentElement;

    // The metric follows the tag's appearance, or takes its own, in every mode.
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        const follows = getComputedStyle(pillIn('follows'));
        await expect(follows.backgroundColor, `${mode}: follows the tag`).toBe(token('--ds-background-success'));
        await expect(follows.color).toBe(token('--ds-text-success'));
        const own = getComputedStyle(pillIn('own'));
        await expect(own.backgroundColor, `${mode}: its own appearance`).toBe(token('--ds-background-danger'));
        await expect(own.color).toBe(token('--ds-text-danger'));
    });

    // It is a compact Count tag nested at the end of the tag.
    const box = canvas.getByTestId('follows').getBoundingClientRect();
    const pill = pillIn('follows').getBoundingClientRect();
    await expect(pill.height).toBe(COUNT.default.height);
    await expect(box.right - pill.right).toBe(COUNT.default.inset);
};

/** `iconBefore` adds one icon before the label, in the text color. */
export const IconBefore = () => (
    <div style={row}>
        <StatusTag appearance="success" iconBefore="circle-check" data-testid="default">Completed</StatusTag>
        <StatusTag appearance="warning" iconBefore="triangle-exclamation" data-testid="warning">Needs review</StatusTag>
        <StatusTag appearance="success" spacing="spacious" iconBefore="circle-check" data-testid="spacious">Completed</StatusTag>
    </div>
);
IconBefore.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [id, size] of [['default', 12], ['spacious', 16]]) {
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

};

/**
 * Past `maxWidth` (200) the label ends in an ellipsis, and the full text is a
 * tooltip reachable by pointer and by keyboard. A Status that fits is not a tab
 * stop.
 */
export const Truncation = () => (
    <div style={row}>
        <Button>Before</Button>
        <StatusTag appearance="info" data-testid="short">In progress</StatusTag>
        <StatusTag appearance="info" data-testid="long">
            Waiting on the district data export before the next session
        </StatusTag>
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

    // The state mixin's ring: 2px of `border.focused`, 2px off the tag.
    const ring = getComputedStyle(long);
    await expect(ring.outlineStyle, 'ring style').toBe('solid');
    await expect(px(ring.outlineWidth), 'ring width').toBe(2);
    await expect(px(ring.outlineOffset), 'ring sits 2px outside').toBe(2);
    await expect(ring.outlineColor, 'ring color').toBe(tokenColor(canvasElement, '--ds-border-focused'));
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
        <div data-testid="column" style={{ width: '120px', border: '1px dashed var(--ds-border)' }}>
            <StatusTag appearance="info" data-testid="clamped">Waiting on the district data export</StatusTag>
        </div>
        <div style={{ width: '400px' }}>
            <StatusTag appearance="info" maxWidth={100} data-testid="capped">Waiting on the district data export</StatusTag>
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
            <Button onClick={() => setMounted(true)}>Mount a Status with onClick</Button>
            <span data-testid="clicks">{clicks}</span>
            {mounted && (
                <StatusTag
                    appearance="success"
                    data-testid="status"
                    onClick={() => setClicks((n) => n + 1)}
                    role="button"
                    tabIndex={0}
                >
                    Completed
                </StatusTag>
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
 * The weight is pinned at every spacing: regular, from body.small in default and
 * body.default in spacious. A Status tag inside a table header or a heading does not
 * inherit bold.
 */
export const PinnedWeight = () => (
    <table>
        <thead>
            <tr>
                <th><StatusTag appearance="success" data-testid="th-default">Completed</StatusTag></th>
                <th><StatusTag appearance="success" spacing="spacious" data-testid="th-spacious">Completed</StatusTag></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><StatusTag appearance="success" data-testid="td-default">Completed</StatusTag></td>
                <td><StatusTag appearance="success" spacing="spacious" data-testid="td-spacious">Completed</StatusTag></td>
            </tr>
        </tbody>
    </table>
);
PinnedWeight.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const weight = (id) => getComputedStyle(within(canvas.getByTestId(id)).getByText('Completed')).fontWeight;
    const header = getComputedStyle(canvasElement.querySelector('th')).fontWeight;
    await expect(Number(header), 'the header around it is bold').toBeGreaterThanOrEqual(600);

    const regular = tokenWeight(canvasElement, '--type-weight-regular');
    for (const where of ['th', 'td']) {
        await expect(weight(`${where}-default`), `default in a ${where} is regular`).toBe(regular);
        await expect(weight(`${where}-spacious`), `spacious in a ${where} is regular`).toBe(regular);
    }
};

/**
 * An unknown appearance falls back to neutral, with a development warning,
 * rather than rendering an unstyled label. The Status mounts on a button
 * press after the console is watched.
 */
export const UnknownValuesFallBack = () => {
    const [mounted, setMounted] = useState(false);
    return (
        <div style={row}>
            <Button onClick={() => setMounted(true)}>Mount an unknown appearance</Button>
            <StatusTag data-testid="neutral">Not started</StatusTag>
            {mounted && <StatusTag appearance="purple" data-testid="unknown-style">Not started</StatusTag>}
        </div>
    );
};
UnknownValuesFallBack.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = (name) => tokenColor(canvasElement, name);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        await userEvent.click(canvas.getByRole('button', { name: 'Mount an unknown appearance' }));
        await expect(warn).toHaveBeenCalledWith(expect.stringContaining('appearance="purple" is not one of'));

        // The unknown style renders exactly as neutral.
        const neutral = canvas.getByTestId('neutral');
        const unknownStyle = canvas.getByTestId('unknown-style');
        await expect(getComputedStyle(unknownStyle).backgroundColor).toBe(token('--ds-background-neutral'));
        await expect(getComputedStyle(unknownStyle).color).toBe(getComputedStyle(neutral).color);
        await expect(innerBorder(unknownStyle)).toBe(innerBorder(neutral));
    } finally {
        warn.mockRestore();
    }
};

/* -------------------------------------------------------------- playground */

/** Interactive playground. */
export const Interactive = {
    args: {
        children: 'Needs review',
        appearance: 'warning',
        spacing: 'default',
        iconBefore: '',
        trailingMetric: 0,
        maxWidth: 200,
    },
    argTypes: {
        appearance: { control: 'select', options: STATUS_TAG_APPEARANCES },
        spacing: { control: 'inline-radio', options: STATUS_TAG_SPACINGS },
    },
    render: ({ iconBefore, ...args }) => <StatusTag {...args} iconBefore={iconBefore || undefined} />,
};

/* ------------------------------------------------------------------- states */

/** Rest, the only state: a status tag is a label, not a control. */
export const Rest = {
    render: () => <StatusTag data-testid="status">In review</StatusTag>,
    play: async ({ canvasElement }) => {
        const el = within(canvasElement).getByTestId('status');
        await expect(px(getComputedStyle(el).height), 'default is 20').toBe(20);
        await expect(el).not.toHaveAttribute('tabindex');
    },
};

/** Hovered: nothing changes. */
export const Hovered = {
    render: () => <StatusTag data-testid="status">In review</StatusTag>,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(within(canvasElement).getByTestId('status'), ':hover', 'StatusTag');
    },
};

/** Pressed: nothing changes. */
export const Pressed = {
    render: () => <StatusTag data-testid="status">In review</StatusTag>,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(within(canvasElement).getByTestId('status'), ':active', 'StatusTag');
    },
};

/** Focused: not in the tab order, so Tab skips it. */
export const Focused = {
    render: () => <StatusTag data-testid="status">In review</StatusTag>,
    play: async ({ canvasElement }) => {
        await expectNotAControl(within(canvasElement).getByTestId('status'), 'StatusTag');
    },
};

/** Disabled: there is none. A label is never dimmed; a disabled thing is described by the control beside it. */
export const Disabled = {
    render: () => <StatusTag data-testid="status">In review</StatusTag>,
    play: async ({ canvasElement }) => {
        const el = within(canvasElement).getByTestId('status');
        await expect(el).not.toHaveAttribute('aria-disabled');
        await expect(getComputedStyle(el).opacity, 'never dimmed').toBe('1');
    },
};
