import React from 'react';
import { expect, within } from 'storybook/test';

import BadgeVariants, { BADGE_APPEARANCES, formatCount, readableOn } from './BadgeVariants';

/**
 * `Badge` variants — the system-generated half of the label system (#276).
 *
 * The seam is story `play:` functions run by `check:storybook` in a real
 * browser, as #276 settled. What is asserted here is what a person could
 * observe, or what a computed style really is — never a class name.
 *
 * Contrast is deliberately not re-asserted: the a11y ratchet already tracks
 * `color-contrast` over every story rendered, and may fall but never rise. All
 * six mappings were measured and clear WCAG AA; five clear AAA.
 */

export default {
    title: 'Components/Status and loading/Badge variants',
    component: BadgeVariants,
    parameters: {
        docs: {
            description: {
                component:
                    'A badge shows system-generated data that people cannot change. To show a '
                    + 'value someone has picked, use a tag instead.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' };

/* ------------------------------------------------------------- appearance */

export const Appearances = () => (
    <div style={row}>
        {BADGE_APPEARANCES.map((a) => (
            <BadgeVariants key={a} variant="status" appearance={a}>{a}</BadgeVariants>
        ))}
    </div>
);

/**
 * Five appearances, five grounds.
 *
 * The point of closing the set is that the same state looks the same on every
 * screen — which is worth nothing if two of the five resolve to the same colour
 * because a token was missing. That is the failure this catches: a name with no
 * rule renders as the page background and passes every visual glance.
 */
Appearances.play = async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('.plus-badge-v');
    await expect(badges).toHaveLength(5);

    const grounds = new Set([...badges].map((b) => getComputedStyle(b).backgroundColor));
    await expect(grounds.size).toBe(5);
    // …and none of them transparent, which is what an unresolved token gives.
    for (const g of grounds) await expect(g).not.toBe('rgba(0, 0, 0, 0)');
};

/* ---------------------------------------------------------------- density */

export const Density = () => (
    <div style={row}>
        <BadgeVariants variant="status" appearance="information" spacing="default">Default</BadgeVariants>
        <BadgeVariants variant="status" appearance="information" spacing="spacious">Spacious</BadgeVariants>
    </div>
);

/**
 * Density changes PADDING and never TYPE.
 *
 * This is the rule that replaces the removed `size` prop, and the reason it was
 * removed: a badge whose type size moved with its density could disagree with
 * the text beside it. Assert both halves — that the box really did change, and
 * that the type really did not — because a rule with only one half asserted
 * passes when the whole thing is a no-op.
 */
Density.play = async ({ canvasElement }) => {
    const [d, s] = canvasElement.querySelectorAll('.plus-badge-v');
    const cd = getComputedStyle(d);
    const cs = getComputedStyle(s);

    await expect(cs.paddingLeft).not.toBe(cd.paddingLeft);
    await expect(parseFloat(cs.paddingLeft)).toBeGreaterThan(parseFloat(cd.paddingLeft));
    await expect(s.getBoundingClientRect().height).toBeGreaterThan(d.getBoundingClientRect().height);

    await expect(cs.fontSize).toBe(cd.fontSize);
    await expect(cs.lineHeight).toBe(cd.lineHeight);
};

/* ---------------------------------------------------------------- counter */

export const Counters = () => (
    <div style={row}>
        <BadgeVariants variant="counter" appearance="information">7</BadgeVariants>
        <BadgeVariants variant="counter" appearance="information" max={99}>1204</BadgeVariants>
        <BadgeVariants variant="counter" appearance="negative" label="Unread">{0}</BadgeVariants>
    </div>
);

/**
 * `max` caps the count, and an empty count becomes a dot.
 *
 * 1204 unread items rendering in full pushes a table column open — the failure
 * `max` exists for. And a counter with nothing to say is the notification dot,
 * folded in rather than made a second component to learn.
 */
Counters.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('7')).toBeInTheDocument();
    await expect(canvas.getByText('99+')).toBeInTheDocument();
    await expect(canvas.queryByText('1204')).toBeNull();

    // Zero is a dot, and a dot has no text — so without a name it is a coloured
    // circle assistive technology cannot describe.
    const dot = canvas.getByRole('status', { name: 'Unread' });
    await expect(dot).toBeInTheDocument();
    await expect(dot.textContent).toBe('');
    const c = getComputedStyle(dot);
    await expect(c.borderRadius).toBe('50%');
};

/**
 * `formatCount` leaves a non-numeric value alone rather than printing NaN.
 */
export const CounterFormatting = () => (
    <div style={row}>
        <BadgeVariants variant="counter" appearance="neutral">many</BadgeVariants>
    </div>
);

CounterFormatting.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('many')).toBeInTheDocument();
    await expect(formatCount('many', 99)).toBe('many');
    await expect(formatCount(1204, 99)).toBe('99+');
    await expect(formatCount(99, 99)).toBe('99');
};

/* --------------------------------------------------------- trailing metric */

export const TrailingMetric = () => (
    <div style={row}>
        <BadgeVariants variant="status" appearance="information" trailingMetric={12}>In progress</BadgeVariants>
        <BadgeVariants variant="status" appearance="positive" trailingMetric={1204} max={99}>Complete</BadgeVariants>
    </div>
);

/**
 * A status badge composes a counter badge inside itself.
 *
 * "In progress · 12" is one component call rather than hand-assembly, and the
 * inner appearance is DERIVED from the outer one — both grounds are ours, so
 * there is no cross-package mapping to get wrong. The count has to read against
 * a ground that is already tinted, which is why it is bold.
 */
TrailingMetric.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const outer = canvas.getByText('In progress').closest('.plus-badge-v');
    const metric = outer.querySelector('.plus-badge-v__metric');
    await expect(metric).not.toBeNull();
    await expect(metric.textContent).toBe('12');
    await expect(parseInt(getComputedStyle(metric).fontWeight, 10)).toBeGreaterThanOrEqual(600);

    // `max` reaches the inner counter too, or a four-digit metric reopens the
    // column the cap exists to protect.
    await expect(canvas.getByText('99+')).toBeInTheDocument();
};

/**
 * `trailingMetric` is gated to `status`.
 *
 * A count inside a counter is a counter inside a counter. The gate is behaviour,
 * not a type — propTypes validates the value, never whether the combination
 * means anything.
 */
export const TrailingMetricIsGatedToStatus = () => (
    <div style={row}>
        <BadgeVariants variant="counter" appearance="neutral" trailingMetric={5}>9</BadgeVariants>
    </div>
);

TrailingMetricIsGatedToStatus.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.plus-badge-v__metric')).toHaveLength(0);
};

/* ------------------------------------------------------------------ other */

export const DateAndCustom = () => (
    <div style={row}>
        <BadgeVariants variant="date" appearance="neutral" spacing="spacious">Due 12 Sept</BadgeVariants>
        <BadgeVariants variant="custom" color="#7f3fb1">Custom</BadgeVariants>
    </div>
);

/**
 * `custom` is the escape hatch, and the only place a non-semantic colour is
 * allowed in — so it must actually take one, and must not also claim an
 * appearance from the closed set.
 */
DateAndCustom.play = async ({ canvasElement }) => {
    const custom = canvasElement.querySelector('.plus-badge-v--custom');
    await expect(getComputedStyle(custom).backgroundColor).toBe('rgb(127, 63, 177)');
    await expect(custom.className).not.toContain('plus-badge-v--neutral');
};

export const Truncation = () => (
    <div style={row}>
        <BadgeVariants variant="status" appearance="neutral" maxWidth={120}>
            Waiting on external review
        </BadgeVariants>
    </div>
);

/**
 * A truncated status keeps its full text — CSS ellipsis leaves nothing behind
 * for a screen reader or a hover, and a status nobody can read is not a status.
 */
Truncation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByTitle('Waiting on external review');
    await expect(el).toBeInTheDocument();
    const text = el.querySelector('.plus-badge-v__text');
    await expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
};

export const WithIcon = () => (
    <div style={row}>
        <BadgeVariants variant="status" appearance="positive" iconBefore={<i className="fa-solid fa-check" />}>
            Passed
        </BadgeVariants>
    </div>
);

/**
 * The glyph is decoration; the word carries the meaning.
 *
 * It is there for the case colour cannot cover — `positive` and `information`
 * are 74° apart in hue but near-identical in lightness and saturation, so hue
 * carries all the differentiation and that is the axis deuteranopia collapses.
 * Announcing it as well would give a screen-reader user "check, Passed".
 */
WithIcon.play = async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('.plus-badge-v__icon');
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(within(canvasElement).getByText('Passed')).toBeInTheDocument();
};

/**
 * The escape hatch cannot be made unreadable.
 *
 * WHY THIS STORY EXISTS: the first version of `custom` set a background and let
 * the text inherit, and the a11y suite failed it on `color-contrast` — a purple
 * ground under near-black text. That is #276's own defect coming back through
 * the one door the spec leaves open, so the foreground is now derived from the
 * background rather than inherited.
 *
 * Both directions are asserted. A rule that only ever picks white passes the
 * dark case and quietly makes every light badge unreadable.
 */
export const CustomStaysReadable = () => (
    <div style={row}>
        <BadgeVariants variant="custom" color="#191c1e">On a dark ground</BadgeVariants>
        <BadgeVariants variant="custom" color="#f3f6f4">On a light ground</BadgeVariants>
        <BadgeVariants variant="custom" color="#7f3fb1">Purple</BadgeVariants>
    </div>
);

CustomStaysReadable.play = async ({ canvasElement }) => {
    const [dark, light] = canvasElement.querySelectorAll('.plus-badge-v--custom');

    // Dark ground takes white; light ground takes the design system's ink.
    await expect(getComputedStyle(dark).color).toBe('rgb(255, 255, 255)');
    await expect(getComputedStyle(light).color).not.toBe('rgb(255, 255, 255)');
    await expect(getComputedStyle(dark).color).not.toBe(getComputedStyle(light).color);

    await expect(readableOn('#000000')).toBe('#ffffff');
    await expect(readableOn('#ffffff')).not.toBe('#ffffff');
    await expect(readableOn('rgb(0, 0, 0)')).toBe('#ffffff');
    await expect(readableOn('#000')).toBe('#ffffff');

    // Unparsable returns null, so the caller sets nothing rather than guessing.
    await expect(readableOn('not-a-colour')).toBeNull();
    await expect(readableOn(undefined)).toBeNull();
};
