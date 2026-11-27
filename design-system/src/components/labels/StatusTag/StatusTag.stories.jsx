import React, { useState } from 'react';
import { Button, ButtonItem } from '@/components';
import { expect, fireEvent, spyOn, userEvent, waitFor, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';

import StatusTag, { STATUS_TAG_APPEARANCES, STATUS_TAG_SPACINGS } from './StatusTag';
import { expectNoSilentClip, expectInsideWell } from '../../_internal/overflowPlays';
import { expectGroundUnder, expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';

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

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--stack-xl) var(--inline-xl)', alignItems: 'center' };
const grid = { display: 'grid', gap: 'var(--stack-lg)' };

/* ------------------------------------------------------------------ helpers */

const SIZE = { default: 20, spacious: 32 };
/** Left and right padding when there is no count: Element xs (4) and md (12). */
const PAD = { default: 4, spacious: 12 };
/** The nested count's height, and its inset from the top and right edges. */
const COUNT = { default: { height: 16, top: 2, right: 2 }, spacious: { height: 16, top: 8, right: 6 } };

/** [fill, text, inner border] per appearance, from the Figma set. Info is Tertiary. */
const STATE_COLORS = {
    neutral: ['--ds-background-neutral', '--ds-text', '--ds-background-neutral-pressed'],
    success: ['--ds-background-success', '--ds-text-success', '--ds-background-success-pressed'],
    warning: ['--ds-background-warning', '--ds-text-warning', '--ds-background-warning-pressed'],
    danger: ['--ds-background-danger', '--ds-text-danger', '--ds-background-danger-pressed'],
    info: ['--ds-background-information', '--ds-text-information', '--ds-background-information-pressed'],
    discovery: ['--ds-background-discovery', '--ds-text-discovery', '--ds-background-discovery-pressed'],
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

/** Colored material: `material` (bold or subtle) fills a colored status over a picture, with the material edge. Neutral has none. */
export const ColoredMaterial = () => (
    <div style={{ ...row, padding: 'var(--pad-x-lg)', backgroundImage: 'linear-gradient(135deg, var(--ds-background-accent-orange-subtler), var(--ds-background-accent-teal-bolder) 45%, var(--ds-background-neutral-bold))' }}>
        <StatusTag appearance="success" material="bold" data-testid="bold">Approved</StatusTag>
        <StatusTag appearance="danger" material="subtle" data-testid="subtle">Overdue</StatusTag>
        <StatusTag appearance="neutral" material="bold" data-testid="neutral">Draft</StatusTag>
    </div>
);

ColoredMaterial.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = (token) => tokenColor(canvasElement, token);
    const bold = getComputedStyle(canvas.getByTestId('bold'));
    await expect(bold.backgroundColor, 'bold fills in the appearance color').toBe(t('--ds-background-success-material-bold'));
    await expect(bold.boxShadow, 'the material edge').toContain(t('--ds-border-material'));
    const subtle = getComputedStyle(canvas.getByTestId('subtle'));
    await expect(subtle.backgroundColor, 'subtle sits on the overlay material').toBe(t('--ds-surface-material-overlay'));
    await expect(subtle.color, 'subtle text takes the color').toBe(t('--ds-text-danger'));
    await expect(getComputedStyle(canvas.getByTestId('neutral')).backgroundColor, 'neutral has no colored material')
        .not.toBe(t('--ds-surface-material-overlay'));
};

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
 * `trailingMetric` nests a 16 Count tag of the same appearance, centered
 * vertically and inset from the trailing edge.
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
            await expect(p.top - box.top, `${name} count top inset`).toBe(COUNT[size].top);
            await expect(box.right - p.right, `${name} count right inset`).toBe(COUNT[size].right);

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

    // It is a 16 Count tag nested at the end of the tag.
    const box = canvas.getByTestId('follows').getBoundingClientRect();
    const pill = pillIn('follows').getBoundingClientRect();
    await expect(pill.height).toBe(COUNT.default.height);
    await expect(box.right - pill.right).toBe(COUNT.default.right);
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
 * Truncate: past `maxWidth` (200) the label ends in an ellipsis, and the full text is a
 * tooltip reachable by pointer and by keyboard. A Status that fits is not a tab
 * stop.
 */
export const Overflow = () => (
    <div style={row}>
        <Button>Before</Button>
        <StatusTag appearance="info" data-testid="short">In progress</StatusTag>
        <StatusTag appearance="info" data-testid="long">
            Waiting on the district data export before the next session
        </StatusTag>
    </div>
);
Overflow.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoSilentClip(canvasElement);
    await expectInsideWell(canvas.getByTestId('long'), canvasElement.firstElementChild);
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
        <div data-testid="column" style={{ width: '120px' /* token gap: 120px */, border: 'var(--border-width-default) dashed var(--ds-border)' }}>
            <StatusTag appearance="info" data-testid="clamped">Waiting on the district data export</StatusTag>
        </div>
        <div style={{ width: '400px' /* demo frame */ }}>
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

/* --------------------------------------------------------------- with a menu */

/** The statuses a menu offers, the current one checked. */
const MENU_STATUSES = ['Present', 'Late', 'Absent', 'Excused'];
/** Each row is the Status tag it stands for, so the menu reads as the tags a person can pick. */
const MENU_TONES = { Present: 'success', Late: 'warning', Absent: 'danger', Excused: 'neutral' };
const statusRow = (status, current, props = {}) => (
    <ButtonItem key={status} isSelected={status === current} {...props}>
        <StatusTag appearance={MENU_TONES[status]}>{status}</StatusTag>
    </ButtonItem>
);
const menuRows = (current = 'Present') => MENU_STATUSES.map((status) => statusRow(status, current));

/** The gap between label and chevron (`--stack-sm`, `--tag-gap`), and the chevron's glyph size (`--icon-sm`, `--icon-md`). */
const MENU_GAP = { default: 4, spacious: 6 };
const CHEVRON_BOX = { default: 12, spacious: 16 };

/** The hovered background token of each appearance. */
const HOVERED = {
    neutral: '--ds-background-neutral-hovered',
    success: '--ds-background-success-hovered',
    warning: '--ds-background-warning-hovered',
    danger: '--ds-background-danger-hovered',
    info: '--ds-background-information-hovered',
    discovery: '--ds-background-discovery-hovered',
};

/** Every appearance at both spacings, each a menu trigger named like a row's field. */
const MenuMatrix = ({ tagProps = {}, current = 'Present' }) => (
    <div style={grid}>
        {STATUS_TAG_SPACINGS.map((size) => (
            <div key={size} style={row}>
                {STATUS_TAG_APPEARANCES.map((appearance) => (
                    <StatusTag
                        key={appearance}
                        appearance={appearance}
                        spacing={size}
                        menu={menuRows(current)}
                        aria-label={`Attendance, Hermione Granger: ${appearance}`}
                        data-testid={`${appearance}-${size}`}
                        {...tagProps}
                    >
                        {appearance}
                    </StatusTag>
                ))}
            </div>
        ))}
    </div>
);

const eachMenuTag = async (canvasElement, check) => {
    const canvas = within(canvasElement);
    for (const size of STATUS_TAG_SPACINGS) {
        for (const appearance of STATUS_TAG_APPEARANCES) {
            await check(canvas.getByTestId(`${appearance}-${size}`), appearance, size, `${appearance}-${size}`);
        }
    }
};

/** The menu is portaled out of the canvas, so its rows are found from the document. */
const inDocument = (canvasElement) => within(canvasElement.ownerDocument.body);

/**
 * The label's type, read from a plain tag of the same spacing built from the
 * same classes beside it, so a menu tag that picks up the button's font fails.
 */
const plainLabelType = (host, block, size) => {
    const tag = document.createElement('span');
    tag.className = `${block} ${block}--neutral ${size === 'spacious' ? `${block}--spacious` : ''}`;
    const label = document.createElement('span');
    label.className = `${block}__label`;
    label.textContent = 'Plain';
    tag.appendChild(label);
    host.appendChild(tag);
    const { fontSize, lineHeight } = getComputedStyle(label);
    tag.remove();
    return { fontSize, lineHeight };
};

/**
 * With a `menu` the tag is a button that opens the other statuses. Same box and
 * tone as the label, plus the `angle-down` chevron: 12 in a default tag, 16 in a
 * spacious one, with equal padding on both sides.
 */
export const WithMenu = () => <MenuMatrix />;
WithMenu.play = async ({ canvasElement }) => {
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        const [fill, ink, edge] = STATE_COLORS[appearance];
        const s = getComputedStyle(el);
        await expect(el.tagName, `${name} is a button`).toBe('BUTTON');
        await expect(el, `${name} announces a menu`).toHaveAttribute('aria-haspopup', 'menu');
        await expect(el, `${name} is closed`).toHaveAttribute('aria-expanded', 'false');
        await expect(el.getBoundingClientRect().height, `${name} height`).toBe(SIZE[size]);
        await expect(s.backgroundColor, `${name} fill`).toBe(tokenColor(canvasElement, fill));
        await expect(s.color, `${name} text`).toBe(tokenColor(canvasElement, ink));
        await expect(innerBorder(el), `${name} edge`).toBe(tokenColor(canvasElement, edge));

        const box = el.getBoundingClientRect();
        const label = within(el).getByText(appearance).getBoundingClientRect();
        const chevron = el.querySelector('.plus-status__chevron');
        const glyph = chevron.querySelector('i');

        const plain = plainLabelType(canvasElement, 'plus-status', size);
        const text = getComputedStyle(within(el).getByText(appearance));
        await expect(text.fontSize, `${name} label size matches a plain tag`).toBe(plain.fontSize);
        await expect(text.lineHeight, `${name} label line height matches a plain tag`).toBe(plain.lineHeight);
        await expect(getComputedStyle(glyph, '::before').content, `${name} draws angle-down`).toBe(glyphOf(canvasElement, 'fa-angle-down'));
        await expect(px(getComputedStyle(glyph).fontSize), `${name} chevron size`).toBe(CHEVRON_BOX[size]);
        await expect(label.left - box.left, `${name} leading padding`).toBe(PAD[size]);
        await expect(box.right - chevron.getBoundingClientRect().right, `${name} trailing padding`).toBe(PAD[size]);
        await expect(chevron.getBoundingClientRect().left - label.right, `${name} gap before the chevron`).toBe(MENU_GAP[size]);
    });
};

/** Rest: the tone's fill, the chevron down, in the tab order. */
export const MenuRest = () => <MenuMatrix />;
MenuRest.play = async ({ canvasElement }) => {
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await expect(el, `${name} is enabled`).toBeEnabled();
        await expect(el, `${name} is a tab stop`).not.toHaveAttribute('tabindex', '-1');
        await expect(getComputedStyle(el).cursor, `${name} cursor`).toBe('pointer');
        await expectGroundUnder(canvasElement, el, undefined, STATE_COLORS[appearance][0], name);
    });
};

/** Hovered: the tone's hovered background. The edge stays the pressed background. */
export const MenuHovered = () => <MenuMatrix />;
MenuHovered.play = async ({ canvasElement }) => {
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await expectGroundUnder(canvasElement, el, ':hover', HOVERED[appearance], name);
        await expect(innerBorder(el), `${name} keeps its edge`).toBe(tokenColor(canvasElement, STATE_COLORS[appearance][2]));
    });
};

/** Pressed: the tone's pressed background. */
export const MenuPressed = () => <MenuMatrix />;
MenuPressed.play = async ({ canvasElement }) => {
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await expectGroundUnder(canvasElement, el, ':active', STATE_COLORS[appearance][2], name);
    });
};

/** Focused: the standard focus ring, outside the edge, and the fill unchanged. */
export const MenuFocused = () => <MenuMatrix />;
MenuFocused.play = async ({ canvasElement }) => {
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await userEvent.tab();
        await expect(el, `${name} takes focus from Tab`).toHaveFocus();
        const s = getComputedStyle(el);
        await expect(s.outlineStyle, `${name} ring`).toBe('solid');
        await expect(s.outlineColor, `${name} ring color`).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        await expect(px(s.outlineWidth), `${name} ring width`).toBe(2);
        await expect(s.backgroundColor, `${name} fill`).toBe(tokenColor(canvasElement, STATE_COLORS[appearance][0]));
    });
};

/**
 * Open: the menu lists the statuses with the current one checked, the tag is
 * drawn selected (the pressed background) and the chevron flips to `angle-up`.
 */
export const MenuOpen = () => <MenuMatrix />;
MenuOpen.play = async ({ canvasElement }) => {
    const doc = inDocument(canvasElement);
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await userEvent.click(el);
        await waitFor(() => expect(el, `${name} reports open`).toHaveAttribute('aria-expanded', 'true'));
        await waitFor(async () => expect(await doc.findByRole('menuitem', { name: 'Late' }), `${name} lists the other statuses`).toBeVisible());
        await expect(doc.getByRole('menuitem', { name: 'Present' }), `${name} checks the current status`).toHaveAttribute('aria-current', 'true');
        await expectGroundUnder(canvasElement, el, undefined, STATE_COLORS[appearance][2], `${name} open`);
        await expect(getComputedStyle(el.querySelector('.plus-status__chevron i'), '::before').content, `${name} draws angle-up`)
            .toBe(glyphOf(canvasElement, 'fa-angle-up'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(doc.queryAllByRole('menu')).toHaveLength(0));
    });
};

/** Picking a row closes the menu and the tag shows the pick. */
export const MenuPick = () => {
    const [status, setStatus] = useState('Present');
    return (
        <StatusTag
            appearance={MENU_TONES[status]}
            aria-label={`Attendance, Hermione Granger: ${status}`}
            data-testid="pick"
            menu={MENU_STATUSES.map((value) => statusRow(value, status, { onClick: () => setStatus(value) }))}
        >
            {status}
        </StatusTag>
    );
};
MenuPick.play = async ({ canvasElement }) => {
    const doc = inDocument(canvasElement);
    const el = within(canvasElement).getByTestId('pick');
    await userEvent.click(el);
    await userEvent.click(await doc.findByRole('menuitem', { name: 'Late' }));
    await waitFor(() => expect(doc.queryAllByRole('menu')).toHaveLength(0));
    await expect(el, 'the trigger follows the pick').toHaveAccessibleName('Attendance, Hermione Granger: Late');
    await expect(within(el).getByText('Late')).toBeInTheDocument();
};

/** Loading: the content hides but keeps its width; one spinner, 12 on default and 16 on spacious, sits centered. */
export const MenuLoading = () => (
    <div style={grid}>
        <MenuMatrix tagProps={{ isLoading: true }} />
        <div style={row}>
            {STATUS_TAG_SPACINGS.map((size) => (
                <React.Fragment key={size}>
                    <StatusTag spacing={size} menu={menuRows()} aria-label="Attendance, at rest" data-testid={`rest-${size}`}>Present</StatusTag>
                    <StatusTag spacing={size} menu={menuRows()} aria-label="Attendance, loading" isLoading data-testid={`loading-${size}`}>Present</StatusTag>
                </React.Fragment>
            ))}
        </div>
    </div>
);
MenuLoading.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        await expect(el, `${name} is busy`).toHaveAttribute('aria-busy', 'true');
        await expect(el.querySelectorAll('.plus-spinner'), `${name} has one spinner`).toHaveLength(1);
        const spinner = el.querySelector('.plus-spinner');
        await expect(spinner.getBoundingClientRect().width, `${name} spinner size`).toBe(CHEVRON_BOX[size]);
        const box = el.getBoundingClientRect();
        const ring = spinner.getBoundingClientRect();
        await expect(Math.abs((ring.left + ring.width / 2) - (box.left + box.width / 2)), `${name} spinner centered across`).toBeLessThan(1);
        await expect(Math.abs((ring.top + ring.height / 2) - (box.top + box.height / 2)), `${name} spinner centered down`).toBeLessThan(1);
        await expect(getComputedStyle(el.querySelector('.plus-status__content')).opacity, `${name} content hidden`).toBe('0');
        await expect(getComputedStyle(el).backgroundColor, `${name} keeps its tone`).toBe(tokenColor(canvasElement, STATE_COLORS[appearance][0]));
    });
    for (const size of STATUS_TAG_SPACINGS) {
        await expect(canvas.getByTestId(`loading-${size}`).getBoundingClientRect().width, `${size} keeps its width while loading`)
            .toBe(canvas.getByTestId(`rest-${size}`).getBoundingClientRect().width);
    }
};

/** Disabled: the disabled background and text, never an opacity fade, and it does not open. */
export const MenuDisabled = () => <MenuMatrix tagProps={{ isDisabled: true }} />;
MenuDisabled.play = async ({ canvasElement }) => {
    const doc = inDocument(canvasElement);
    await eachMenuTag(canvasElement, async (el, appearance, size, name) => {
        const s = getComputedStyle(el);
        await expect(el, `${name} is disabled`).toBeDisabled();
        await expect(s.backgroundColor, `${name} fill`).toBe(tokenColor(canvasElement, '--ds-background-disabled'));
        await expect(s.color, `${name} text`).toBe(tokenColor(canvasElement, '--ds-text-disabled'));
        await expect(s.opacity, `${name} is never faded`).toBe('1');
        await expect(innerBorder(el), `${name} edge stays the pressed background`).toBe(tokenColor(canvasElement, STATE_COLORS[appearance][2]));
        await userEvent.click(el, { pointerEventsCheck: 0 });
        await expect(doc.queryAllByRole('menu'), `${name} does not open`).toHaveLength(0);
    });
};

/**
 * Keyboard: Enter, Space and ArrowDown open the menu; Escape closes it and
 * returns focus to the tag.
 */
export const MenuKeyboard = () => (
    <StatusTag appearance="success" menu={menuRows()} aria-label="Attendance, Hermione Granger: Present" data-testid="keyboard">Present</StatusTag>
);
MenuKeyboard.play = async ({ canvasElement }) => {
    const doc = inDocument(canvasElement);
    const el = within(canvasElement).getByTestId('keyboard');
    await userEvent.tab();
    await expect(el).toHaveFocus();
    for (const key of ['{Enter}', ' ', '{ArrowDown}']) {
        await userEvent.keyboard(key);
        await waitFor(() => expect(doc.queryAllByRole('menu').length, `${JSON.stringify(key)} opens the menu`).toBeGreaterThan(0));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(doc.queryAllByRole('menu')).toHaveLength(0));
        await expect(el, 'Escape returns focus to the tag').toHaveFocus();
    }
};

/** The accessible name reads "<field>, <record>: <status>". */
export const MenuAccessibleName = () => (
    <StatusTag appearance="success" menu={menuRows()} aria-label="Attendance, Hermione Granger: Present" data-testid="named">Present</StatusTag>
);
MenuAccessibleName.play = async ({ canvasElement }) => {
    const el = within(canvasElement).getByTestId('named');
    await expect(el).toHaveAccessibleName('Attendance, Hermione Granger: Present');
    await expect(el).toHaveAttribute('aria-haspopup', 'menu');
    await expect(el).toHaveAttribute('aria-expanded', 'false');
};

/** Interactive playground for the menu mode. */
export const InteractiveMenu = {
    args: {
        children: 'Present',
        appearance: 'success',
        spacing: 'default',
        isLoading: false,
        isDisabled: false,
    },
    argTypes: {
        appearance: { control: 'select', options: STATUS_TAG_APPEARANCES },
        spacing: { control: 'inline-radio', options: STATUS_TAG_SPACINGS },
    },
    render: (args) => <StatusTag {...args} aria-label={`Attendance, Hermione Granger: ${args.children}`} menu={menuRows(args.children)} />,
};
