import React from 'react';
import { expect, spyOn, within } from 'storybook/test';

import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';

import BadgeVariants, { BADGE_APPEARANCES } from './BadgeVariants';
import Count from './Count';
import Status from './Status';
import Tag from './Tag';

/**
 * `BadgeVariants` — deprecated. A thin wrapper that renders Status, Count and
 * Tag, so existing calls keep working while they move.
 *
 * THE TEST SEAM IS THIS FILE: story `play:` functions run by `check:storybook`
 * in a real browser. Every assertion is something a person could observe or a
 * computed style, never a class name. The central one is parity: a
 * BadgeVariants call and the Status, Count or Tag it now stands for render the
 * same computed styles, side by side, found by the `data-testid` each story
 * gives them.
 *
 * Every render warns in development, so the console is watched for the whole
 * file: the warnings are asserted where they are the subject, and kept out of
 * the test output everywhere else.
 */

export default {
    title: 'Components/Status and loading/Badge variants',
    component: BadgeVariants,
    beforeEach: () => {
        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        return () => warn.mockRestore();
    },
    parameters: {
        changelog: [
            { date: '2026-09-29', kind: 'deprecated', summary: 'BadgeVariants was deprecated. It renders Status for `status` and `date`, Count for `counter` and a read-only Tag for `custom`, and warns in development with the replacement.' },
            { date: '2026-09-29', kind: 'changed', summary: 'Every variant took the look of the component it now renders: filled statuses with an inside border, outlined dates with a fixed icon, pill counts capped at 99, and `custom` as an outlined tag with its color on the swatch.' },
        ],
        docs: {
            description: {
                component:
                    'Deprecated. Is it a number? Count. Is it the condition something is in, and '
                    + 'can that condition change? Status. Otherwise, Tag. BadgeVariants renders '
                    + 'those three, so existing calls keep working while they move.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' };
const pairs = { display: 'grid', gridTemplateColumns: 'max-content max-content', gap: '12px 24px', alignItems: 'center' };

/* ------------------------------------------------------------------ helpers */

/** What a person could measure of a label: its box, its colors and its type. */
const PROPS = [
    'height', 'width', 'backgroundColor', 'color', 'boxShadow', 'borderTopWidth', 'borderTopColor',
    'borderTopLeftRadius', 'paddingLeft', 'paddingRight', 'fontSize', 'lineHeight', 'fontWeight',
];

const look = (el) => {
    const cs = getComputedStyle(el);
    return Object.fromEntries(PROPS.map((p) => [p, cs[p]]));
};

/** The same computed look for `old-<key>` and `new-<key>`, and for every label nested inside. */
const expectParity = async (canvas, keys) => {
    for (const key of keys) {
        const old = canvas.getByTestId(`old-${key}`);
        const current = canvas.getByTestId(`new-${key}`);
        await expect(old.textContent, `${key}: same text`).toBe(current.textContent);
        await expect(look(old), `${key}: same computed look`).toEqual(look(current));
        const inner = (el) => [...el.querySelectorAll('*')].filter((n) => n.childElementCount === 0 && n.textContent);
        const [oldInner, newInner] = [inner(old), inner(current)];
        await expect(oldInner.length, `${key}: same parts`).toBe(newInner.length);
        for (let i = 0; i < oldInner.length; i += 1) {
            await expect(look(oldInner[i]), `${key}: part ${i} looks the same`).toEqual(look(newInner[i]));
        }
    }
};

/** The old appearance names, and the Status and Count style each one became. */
const STYLE_OF = { positive: 'success', negative: 'danger', neutral: 'neutral', information: 'info', discovery: 'discovery' };

/* ------------------------------------------------------------- appearance */

export const Appearances = () => (
    <div style={pairs}>
        {BADGE_APPEARANCES.map((a) => (
            <React.Fragment key={a}>
                <BadgeVariants variant="status" appearance={a} data-testid={`old-${a}`}>{a}</BadgeVariants>
                <Status style={STYLE_OF[a] || a} data-testid={`new-${a}`}>{a}</Status>
            </React.Fragment>
        ))}
    </div>
);

/**
 * Each appearance renders exactly as the Status style that replaced it. The
 * old names (`positive`, `negative`, `information`) are aliases, so the same
 * state keeps its color without a caller changing a line, and `warning`, which
 * Badge variants never had, is accepted too.
 */
Appearances.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectParity(canvas, BADGE_APPEARANCES);
    await expect(getComputedStyle(canvas.getByTestId('old-positive')).backgroundColor, 'positive fills as success')
        .toBe(tokenColor(canvasElement, '--color-success-state-08'));
    await expect(getComputedStyle(canvas.getByTestId('old-warning')).backgroundColor, 'warning fills as warning')
        .toBe(tokenColor(canvasElement, '--color-warning-state-08'));
};

/* ---------------------------------------------------------------- density */

export const Density = () => (
    <div style={pairs}>
        <BadgeVariants variant="status" appearance="information" spacing="default" data-testid="old-default">Default</BadgeVariants>
        <Status style="info" size="medium" data-testid="new-default">Default</Status>
        <BadgeVariants variant="status" appearance="information" spacing="spacious" data-testid="old-spacious">Spacious</BadgeVariants>
        <Status style="info" size="large" data-testid="new-spacious">Spacious</Status>
    </div>
);

/** `spacing` is Status `size`: default is medium (20 tall), spacious is large (32). */
Density.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectParity(canvas, ['default', 'spacious']);
    await expect(px(getComputedStyle(canvas.getByTestId('old-default')).height)).toBe(20);
    await expect(px(getComputedStyle(canvas.getByTestId('old-spacious')).height)).toBe(32);
};

/* ---------------------------------------------------------------- counter */

export const Counters = () => (
    <div style={pairs}>
        <BadgeVariants variant="counter" appearance="information" data-testid="old-seven">7</BadgeVariants>
        <Count value={7} style="info" data-testid="new-seven" />
        <BadgeVariants variant="counter" appearance="negative" isBold max={99} data-testid="old-capped">1204</BadgeVariants>
        <Count value={1204} appearance="bold" style="danger" max={99} data-testid="new-capped" />
        <BadgeVariants variant="counter" appearance="negative" label="Unread" data-testid="old-dot">{0}</BadgeVariants>
        <Count appearance="dot" style="danger" label="Unread" data-testid="new-dot" />
    </div>
);

/**
 * A counter is a Count: `isBold` is the bold appearance, `max` still caps, and
 * a counter with nothing to say is still a dot, named by `label` ("New" by
 * default).
 */
Counters.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectParity(canvas, ['seven', 'capped', 'dot']);
    await expect(within(canvas.getByTestId('old-capped')).getByText('99+')).toBeInTheDocument();
    await expect(canvas.queryByText('1204')).toBeNull();
    const dot = canvas.getByTestId('old-dot');
    await expect(dot).toHaveAccessibleName('Unread');
    await expect(dot.textContent).toBe('');
};

/**
 * A counter takes a number. A word keeps rendering, as the Status a word
 * becomes, with one warning that says so rather than a deprecation and a
 * second complaint.
 */
export const CounterFormatting = () => (
    <div style={row}>
        <BadgeVariants variant="counter" appearance="neutral" data-testid="word">many</BadgeVariants>
    </div>
);

CounterFormatting.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('many')).toBeVisible();
    await expect(px(getComputedStyle(canvas.getByTestId('word')).height), 'a word renders as a 20-tall Status').toBe(20);
    const said = new Set(console.warn.mock.calls.map(([m]) => String(m)));
    await expect([...said], 'one warning, naming what it renders').toEqual([
        '[BadgeVariants] is deprecated; variant="counter" takes a number, so "many" renders as <Status style="neutral">. Use Status or Tag for a word.',
    ]);
};

/* --------------------------------------------------------- trailing metric */

export const TrailingMetric = () => (
    <div style={pairs}>
        <BadgeVariants variant="status" appearance="information" trailingMetric={12} data-testid="old-medium">In progress</BadgeVariants>
        <Status style="info" count={12} data-testid="new-medium">In progress</Status>
        <BadgeVariants variant="status" appearance="positive" spacing="spacious" trailingMetric={1204} data-testid="old-large">Complete</BadgeVariants>
        <Status style="success" size="large" count={1204} data-testid="new-large">Complete</Status>
    </div>
);

/**
 * `trailingMetric` is Status `count`: a Count of the same style nested inside
 * the label, 16 tall in a default status and 20 in a spacious one, capped at 99.
 */
TrailingMetric.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectParity(canvas, ['medium', 'large']);
    const heightOf = (text) => px(getComputedStyle(within(canvasElement).getAllByText(text)[0].parentElement).height);
    await expect(heightOf('12'), 'nested in a default status, the count is 16').toBe(16);
    await expect(heightOf('99+'), 'nested in a spacious status, the count is 20').toBe(20);
};

/**
 * `trailingMetric` is gated to `status`. A count inside a counter is a counter
 * inside a counter, so the counter renders on its own.
 */
export const TrailingMetricIsGatedToStatus = () => (
    <div style={row}>
        <BadgeVariants variant="counter" appearance="neutral" trailingMetric={5}>9</BadgeVariants>
    </div>
);

TrailingMetricIsGatedToStatus.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('9')).toBeInTheDocument();
    await expect(canvas.queryByText('5')).toBeNull();
};

/* ------------------------------------------------------------------ other */

export const DateAndCustom = () => (
    <div style={pairs}>
        <BadgeVariants variant="date" appearance="negative" data-testid="old-date">Due 12 Sept</BadgeVariants>
        <Status type="date" style="danger" data-testid="new-date">Due 12 Sept</Status>
        <BadgeVariants variant="date" appearance="neutral" spacing="spacious" data-testid="old-spacious-date">Due 14 Sept</BadgeVariants>
        <Status type="date" size="large" data-testid="new-spacious-date">Due 14 Sept</Status>
        <BadgeVariants variant="custom" color="#7f3fb1" data-testid="old-custom">Custom</BadgeVariants>
        <Tag swatchBefore="#7f3fb1" data-testid="new-custom">Custom</Tag>
    </div>
);

/**
 * A date is a date Status: outlined, with its fixed icon. `custom`, the escape
 * hatch for a color that means nothing, is a category, so it renders a
 * read-only Tag: outlined, neutral text, and the color it was given on the
 * swatch rather than the fill.
 */
DateAndCustom.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectParity(canvas, ['date', 'spacious-date', 'custom']);

    const custom = canvas.getByTestId('old-custom');
    await expect(px(getComputedStyle(custom).height), 'a tag is 22 tall').toBe(22);
    await expect(getComputedStyle(custom).backgroundColor, 'a read-only tag has no fill').not.toBe('rgb(127, 63, 177)');
    const swatches = [...custom.querySelectorAll('[aria-hidden="true"]')]
        .filter((el) => getComputedStyle(el).backgroundColor === 'rgb(127, 63, 177)');
    await expect(swatches, 'the color is on the swatch').toHaveLength(1);
    await expect(canvas.queryByRole('button')).toBeNull();
};

/**
 * A date takes neutral, warning and danger only. Any other appearance renders
 * a neutral date, and the one warning names that valid call, so nothing falls
 * back a second time.
 */
export const DateWithAStateAppearance = () => (
    <div style={pairs}>
        <BadgeVariants variant="date" appearance="positive" data-testid="old-date">Due 12 Sept</BadgeVariants>
        <Status type="date" data-testid="new-date">Due 12 Sept</Status>
    </div>
);

DateWithAStateAppearance.play = async ({ canvasElement }) => {
    await expectParity(within(canvasElement), ['date']);
    const said = new Set(console.warn.mock.calls.map(([m]) => String(m)));
    await expect([...said]).toEqual(['[BadgeVariants] is deprecated; use <Status type="date" style="neutral">.']);
};

/**
 * `label` still renames a status for a screen reader, without an
 * `aria-label` on a span that has no role, which ARIA does not allow: the
 * label is visually hidden text, and the visible words are hidden from
 * assistive technology.
 */
export const LabelledStatus = () => (
    <div style={row}>
        <BadgeVariants variant="status" appearance="positive" label="Session completed" data-testid="labelled">Done</BadgeVariants>
    </div>
);

LabelledStatus.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByTestId('labelled');
    await expect(status).not.toHaveAttribute('aria-label');
    await expect(canvas.getByText('Done')).toBeVisible();
    await expect(canvas.getByText('Done').closest('[aria-hidden="true"]'), 'the visible words are hidden from a screen reader').not.toBeNull();
    const spoken = canvas.getByText('Session completed');
    await expect(spoken.closest('[aria-hidden="true"]'), 'the label is what a screen reader reads').toBeNull();
    await expect(spoken.getBoundingClientRect().width, 'the label is not seen').toBeLessThanOrEqual(1);
};

export const Truncation = () => (
    <div style={row}>
        <BadgeVariants variant="status" appearance="neutral" maxWidth={120} data-testid="old">
            Waiting on external review
        </BadgeVariants>
    </div>
);

/**
 * A truncated status keeps its full text. It ends in an ellipsis at its cap,
 * and becomes a tab stop so a keyboard user can reach the tooltip that holds
 * the whole of it.
 */
Truncation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTestId('old');
    await expect(px(getComputedStyle(el).width)).toBeLessThanOrEqual(120);
    const text = canvas.getByText('Waiting on external review');
    await expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
    await expect(el.tabIndex, 'a clipped status is a tab stop').toBe(0);
};

export const WithIcon = () => (
    <div style={pairs}>
        <BadgeVariants variant="status" appearance="positive" iconBefore={<i className="fa-solid fa-check" />} data-testid="old-icon">
            Passed
        </BadgeVariants>
        <Status style="success" leadingVisual="check" data-testid="new-icon">Passed</Status>
    </div>
);

/**
 * `iconBefore` is Status `leadingVisual`. The glyph is decoration; the word
 * carries the meaning, so the status is announced as "Passed" alone.
 */
WithIcon.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectParity(canvas, ['icon']);
    const icon = canvas.getByTestId('old-icon').querySelector('i');
    await expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
    await expect(canvas.getByTestId('old-icon').textContent).toBe('Passed');
};

/* ------------------------------------------------------------ deprecation */

export const DeprecationWarnings = () => (
    <div style={row}>
        <BadgeVariants variant="status" appearance="positive">Completed</BadgeVariants>
        <BadgeVariants variant="date" appearance="negative">Due 12 Sept</BadgeVariants>
        <BadgeVariants variant="counter" appearance="information">7</BadgeVariants>
        <BadgeVariants variant="custom" color="#7f3fb1">Algebra</BadgeVariants>
    </div>
);

/** Every variant warns in development, and each warning names its replacement exactly. */
DeprecationWarnings.play = async () => {
    const said = (text) => expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(text));
    await said('[BadgeVariants] is deprecated; use <Status style="success">');
    await said('[BadgeVariants] is deprecated; use <Status type="date" style="danger">');
    await said('[BadgeVariants] is deprecated; use <Count style="info">');
    await said('[BadgeVariants] is deprecated; use <Tag>');
};

/* -------------------------------------------------------------- playground */

/**
 * Interactive playground. `trailingMetric` is left unset: it renders on
 * `status` and nowhere else, so a control that stops having an effect the
 * moment the variant changes reads as the prop being broken.
 */
export const Interactive = (args) => <BadgeVariants {...args} />;

Interactive.args = {
    variant: 'status',
    appearance: 'positive',
    spacing: 'default',
    text: 'In progress',
    isBold: false,
};
