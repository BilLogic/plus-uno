import React from 'react';
import { expect } from 'storybook/test';

/**
 * The two colour defects #312 measured, and what each one could become (#268).
 *
 * WHAT THIS PAGE IS. A decision aid, in the same shape as
 * `AiIdentity.stories.jsx` and for the same reason: both questions are Bill's,
 * and shipping a default would make it the answer by inertia. Nothing here adds
 * a token. Every current value is READ FROM THE PAGE at render time, so this
 * cannot quietly describe a palette that has moved on; every candidate is a
 * local constant, labelled as one.
 *
 * THE TWO FINDINGS, from #312's sweep of all 65 style x fill combinations:
 *
 *   1. `warning` filled is 3.70:1. The only one of the 65 below AA for text.
 *      Every other bold ground clears comfortably — success 6.48, danger 6.46,
 *      primary 5.28, tertiary 4.76 — so this is the warning ground
 *      specifically, and it is the shape of the problem rather than an
 *      oversight: `--color-warning` is a YELLOW, and a yellow dark enough to
 *      carry white text has stopped looking like a warning.
 *
 *   2. `info` and `tertiary` are the same colour. Not similar — the same. One
 *      line: `--color-info: var(--color-tertiary)`. Two names, one appearance,
 *      and a caller choosing between them is making a distinction the interface
 *      does not render.
 *
 * WHAT ATLASSIAN DOES, read from atlassian.design on 2026-08-29 rather than
 * remembered:
 *
 *   color.background.warning.bold        Orange300  (light)  Orange300 (dark)
 *   color.background.information.bold    Blue700    (light)  Blue400   (dark)
 *   color.text.warning.inverse           "for text when on bold warning backgrounds"
 *   color.text.warning.bolder            "to ensure accessibility"
 *
 * Two things follow, and neither needs the hex values. Their ramp runs light to
 * dark — `color.background.warning` is Orange100 in the light theme and
 * Orange1000 in the dark one — so the BOLD WARNING IS A LIGHT ORANGE (300) and
 * the BOLD INFORMATION IS A DARK BLUE (700). A light ground takes dark text,
 * which is what `text.warning.inverse` is for. That is candidate A below.
 *
 * And their `information` is BLUE while their `warning` is ORANGE: separate
 * palettes, not one aliased onto another. Ours aliases information onto the
 * teal we already use for `tertiary`.
 */
export default {
    title: 'Foundations/Colour candidates',
    tags: ['!dev', '!autodocs'],
};

/* -------------------------------------------------------------- measuring */

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const luminance = (hex) => {
    const [r, g, b] = channels(hex).map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
};

/** Hue in degrees, for the arc diagram. Saturation and lightness as percents. */
const hsl = (hex) => {
    const [r, g, b] = channels(hex).map((c) => c / 255);
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, Math.round(l * 100)];
    const d = mx - mn;
    const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
};

/**
 * A token's value as the browser resolves it — aliases followed, so
 * `--color-info` comes back as the teal it actually is rather than as
 * `var(--color-tertiary)`.
 */
const readToken = (name) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return null;
    if (raw.startsWith('#')) return raw.length === 4
        ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
        : raw;
    const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(raw);
    if (!rgb) return null;
    return `#${rgb.slice(1, 4).map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')}`;
};

const AA_TEXT = 4.5;

/* ------------------------------------------------------------ candidates */

/**
 * Three ways out of 3.70:1, and what each one costs.
 *
 * `ink` and `white` are not new colours — they are the two label choices the
 * system already has. Only `darkened` invents a value, and it is the same hue
 * at 85% of each channel, which is the smallest change that reaches AA with a
 * white label.
 */
const WARNING_CANDIDATES = [
    {
        id: 'A',
        name: 'Keep the yellow, use the ink',
        label: 'ink',
        argument:
            'Atlassian’s shape: a bold warning is a light ground with dark text, because a ' +
            'yellow dark enough for white text is no longer yellow. Costs no new colour at all — ' +
            'the ink is --color-on-warning-container, which the system already has.',
        cost: 'Filled warning surfaces change from white text to dark. Visible, and only on warning.',
    },
    {
        id: 'B',
        name: 'Darken the yellow, keep white',
        label: 'white',
        argument:
            'The same hue at 85% of each channel. Reaches AA with a white label and leaves every ' +
            'caller’s markup untouched.',
        cost: 'The warning colour itself moves, so containers, text and state layers derived from ' +
            'it all shift with it — and at 85% it is closer to olive than to a caution yellow.',
    },
    {
        id: 'C',
        name: 'Disallow filled warning',
        label: 'white',
        argument:
            'Warning keeps its value and its white label, and the filled fill is refused for this ' +
            'style. Tonal warning is already 7.72:1 and outline 8.66:1.',
        cost: 'An appearance the API advertises stops existing, which is a smaller system rather ' +
            'than a fixed one.',
    },
];

/** The same hue, each channel at 85%. */
const darken = (hex, k) =>
    `#${channels(hex).map((c) => Math.round(c * k).toString(16).padStart(2, '0')).join('')}`;

/**
 * A candidate `info`, in the arc the palette leaves empty.
 *
 * The existing semantic hues are danger 0, warning 49, success 93, tertiary
 * 174, primary 200 — and nothing at all between 200 and 360. This sits at 228,
 * which is 28 degrees from primary.
 *
 * That separation is deliberately modest, and the reason is measured: primary
 * against tertiary is 1.11:1. The palette differentiates by HUE, not by
 * lightness, so holding a new `info` to a high luminance contrast against
 * `primary` would be holding it to a standard no existing pair meets.
 */
const INFO_CANDIDATE = {
    bold: '#203eb6',
    container: '#d6deff',
    onContainer: '#000c3d',
    text: '#001d8f',
};

const swatch = (background, color, text, extra = {}) => (
    <div
        style={{
            background,
            color,
            padding: '14px 16px',
            borderRadius: 'var(--size-element-radius-md)',
            fontFamily: 'var(--font-family-body)',
            fontSize: 'var(--font-size-body2)',
            ...extra,
        }}
    >
        {text}
    </div>
);

const Metric = ({ label, value, pass }) => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>{label}</span>
        <span
            data-metric={label}
            className="body2-txt"
            style={{
                fontVariantNumeric: 'tabular-nums',
                color: pass === undefined
                    ? 'var(--color-on-surface)'
                    : pass ? 'var(--color-success)' : 'var(--color-danger)',
            }}
        >
            {value}
        </span>
    </div>
);

/* ---------------------------------------------------------------- stories */

/**
 * `warning` filled is 3.70:1 — three ways out, measured against the real token.
 */
export const WarningGround = () => {
    const warning = readToken('--color-warning') ?? '#9f8205';
    const ink = readToken('--color-on-warning-container') ?? '#231b00';
    const options = {
        A: { ground: warning, label: ink },
        B: { ground: darken(warning, 0.85), label: '#ffffff' },
        C: { ground: warning, label: '#ffffff' },
    };

    return (
        <div style={{ maxWidth: '1000px', padding: '24px' }}>
            <h2 className="h4">A filled warning button, three ways</h2>
            <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                Every ratio below is computed from <code>--color-warning</code> as this page
                renders it. <strong>None of these is a proposal.</strong> A and C keep the colour
                the system has; B moves it, and everything derived from it moves too.
            </p>

            {WARNING_CANDIDATES.map((candidate) => {
                const { ground, label } = options[candidate.id];
                const ratio = contrast(ground, label);
                const pass = ratio >= AA_TEXT;
                return (
                    <section
                        key={candidate.id}
                        data-candidate={candidate.id}
                        data-ground={ground}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)',
                            gap: '24px',
                            alignItems: 'start',
                            padding: '20px 0',
                            borderBottom: '1px solid var(--color-outline-variant)',
                        }}
                    >
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {swatch(ground, label, 'Unsaved changes', { textAlign: 'center' })}
                            <Metric label="contrast" value={`${ratio.toFixed(2)}:1`} pass={pass} />
                            <Metric label="ground" value={ground} />
                            <Metric label="label" value={label} />
                        </div>
                        <div>
                            <h3 className="h6" style={{ margin: '0 0 8px' }}>
                                {candidate.id} — {candidate.name}
                            </h3>
                            <p className="body2-txt" style={{ margin: '0 0 8px', maxWidth: '58ch' }}>
                                {candidate.argument}
                            </p>
                            <p
                                className="body3-txt"
                                style={{ margin: 0, maxWidth: '58ch', color: 'var(--color-on-surface-variant)' }}
                            >
                                <strong>Costs:</strong> {candidate.cost}
                            </p>
                        </div>
                    </section>
                );
            })}
        </div>
    );
};

/*
 * `color-contrast` is switched off FOR THIS STORY ONLY, and this is the case
 * `check:storybook` describes when it says to set a story's own `parameters.a11y`
 * and write the reason beside it.
 *
 * Candidate C renders the shipped pair — `--color-warning` with a white label,
 * 3.70:1 — on purpose. That IS the finding. axe is right about it, and a page
 * whose subject is a contrast failure cannot show its subject with the contrast
 * rule on. A and B are measured in `play` against the same 4.5 threshold axe
 * would apply, so the bar is still enforced here; it is enforced by the
 * assertions rather than by the scan.
 *
 * Every other rule stays on.
 */
WarningGround.parameters = {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
};

WarningGround.play = async () => {
    const warning = readToken('--color-warning');
    await expect(warning, 'the page must read the real token, not a literal').not.toBe(null);

    // The finding itself. If this stops being true, warning was fixed
    // elsewhere and this page is describing a palette that has moved on.
    const shipped = contrast(warning, '#ffffff');
    await expect(shipped, `white on ${warning}`).toBeLessThan(AA_TEXT);

    // A and B must actually clear the bar, or the page is offering a way out
    // that is not one.
    const ink = readToken('--color-on-warning-container');
    await expect(contrast(warning, ink), 'candidate A').toBeGreaterThanOrEqual(AA_TEXT);
    await expect(contrast(darken(warning, 0.85), '#ffffff'), 'candidate B').toBeGreaterThanOrEqual(AA_TEXT);

    // And the numbers have to be ON THE PAGE, not only in this function.
    for (const { id } of WARNING_CANDIDATES) {
        const section = document.querySelector(`[data-candidate="${id}"]`);
        await expect(section, `candidate ${id} did not render`).not.toBe(null);
    }
};

/**
 * `info` and `tertiary` are one colour — and the arc the palette leaves empty.
 */
export const InfoRegister = () => {
    const info = readToken('--color-info') ?? '#0e8175';
    const tertiary = readToken('--color-tertiary') ?? '#0e8175';
    const primary = readToken('--color-primary') ?? '#0472a8';
    const same = info === tertiary;
    const wheel = [
        ['danger', readToken('--color-danger') ?? '#ba1a1a'],
        ['warning', readToken('--color-warning') ?? '#9f8205'],
        ['success', readToken('--color-success') ?? '#3e691a'],
        ['tertiary', tertiary],
        ['primary', primary],
        ['info (candidate)', INFO_CANDIDATE.bold],
    ];

    return (
        <div style={{ maxWidth: '1000px', padding: '24px' }}>
            <h2 className="h4">Two names, one colour</h2>
            <div
                data-finding="info-equals-tertiary"
                data-same={String(same)}
                style={{ display: 'flex', gap: '16px', margin: '0 0 20px' }}
            >
                <div style={{ flex: '1 1 0' }}>
                    {swatch(info, '#ffffff', 'info', { textAlign: 'center' })}
                    <Metric label="info" value={info} />
                </div>
                <div style={{ flex: '1 1 0' }}>
                    {swatch(tertiary, '#ffffff', 'tertiary', { textAlign: 'center' })}
                    <Metric label="tertiary" value={tertiary} />
                </div>
            </div>
            <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                Not similar — identical, from one line: <code>--color-info: var(--color-tertiary)</code>.
                Atlassian keeps <code>information</code> in Blue and <code>warning</code> in Orange,
                separate palettes rather than one aliased onto another.
            </p>

            <h3 className="h6" style={{ margin: '24px 0 8px' }}>Where the hues sit</h3>
            <p className="body2-txt" style={{ maxWidth: '62ch', margin: '0 0 12px' }}>
                Nothing at all lives between 200° and 360°. The candidate sits at 228°, 28° from
                primary — deliberately modest, because <strong>primary against tertiary is
                1.11:1</strong>. This palette separates by hue and not by lightness, so holding a
                new register to a high luminance contrast against primary would hold it to a
                standard no existing pair meets.
            </p>
            <div style={{ display: 'grid', gap: '6px', maxWidth: '620px' }}>
                {wheel
                    .map(([name, hex]) => ({ name, hex, h: hsl(hex)[0] }))
                    .sort((a, b) => a.h - b.h)
                    .map(({ name, hex, h }) => (
                        <div key={name} style={{ display: 'grid', gridTemplateColumns: '150px 48px 1fr', gap: '12px', alignItems: 'center' }}>
                            <span className="body3-txt">{name}</span>
                            <span className="body3-txt" style={{ fontVariantNumeric: 'tabular-nums' }}>{h}°</span>
                            <div style={{ height: '20px', background: hex, borderRadius: '4px' }} />
                        </div>
                    ))}
            </div>

            <h3 className="h6" style={{ margin: '24px 0 8px' }}>The candidate family</h3>
            <div data-candidate="info" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                    {swatch(INFO_CANDIDATE.bold, '#ffffff', 'info bold')}
                    <Metric
                        label="white on bold"
                        value={`${contrast(INFO_CANDIDATE.bold, '#ffffff').toFixed(2)}:1`}
                        pass={contrast(INFO_CANDIDATE.bold, '#ffffff') >= AA_TEXT}
                    />
                </div>
                <div>
                    {swatch(INFO_CANDIDATE.container, INFO_CANDIDATE.onContainer, 'info container')}
                    <Metric
                        label="on container"
                        value={`${contrast(INFO_CANDIDATE.container, INFO_CANDIDATE.onContainer).toFixed(2)}:1`}
                        pass={contrast(INFO_CANDIDATE.container, INFO_CANDIDATE.onContainer) >= AA_TEXT}
                    />
                </div>
                <div>
                    {swatch('var(--color-surface)', INFO_CANDIDATE.text, 'info text')}
                    <Metric label="text" value={INFO_CANDIDATE.text} />
                </div>
            </div>
            <p className="body3-txt" style={{ maxWidth: '62ch', marginTop: '12px', color: 'var(--color-on-surface-variant)' }}>
                <strong>The other answer is subtraction.</strong> If nothing in the product needs a
                register distinct from <code>tertiary</code>, the honest fix is to delete the
                <code> info</code> alias rather than to give it a colour — two names for one thing
                is the defect, and a second colour is only one of the two ways to end it.
            </p>
        </div>
    );
};

InfoRegister.play = async () => {
    const info = readToken('--color-info');
    const tertiary = readToken('--color-tertiary');
    await expect(info, 'the page must read the real tokens').not.toBe(null);

    // The finding. When someone re-points `info`, this goes red — which is the
    // point: the page describes a decision that has not been made yet, and it
    // must not keep saying so after it has.
    await expect(info, 'info and tertiary are the same colour (#312)').toBe(tertiary);

    // The candidate has to be usable, or showing it is showing something that
    // could never ship.
    await expect(contrast(INFO_CANDIDATE.bold, '#ffffff')).toBeGreaterThanOrEqual(AA_TEXT);
    await expect(
        contrast(INFO_CANDIDATE.container, INFO_CANDIDATE.onContainer),
    ).toBeGreaterThanOrEqual(AA_TEXT);

    // And it must sit in the empty arc rather than on top of an existing hue.
    const gap = Math.abs(hsl(INFO_CANDIDATE.bold)[0] - hsl(readToken('--color-primary'))[0]);
    await expect(gap, 'the candidate must be a different hue from primary').toBeGreaterThan(15);

    await expect(document.querySelector('[data-finding="info-equals-tertiary"]')).not.toBe(null);
};
