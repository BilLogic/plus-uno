import React from 'react';
import { expect } from 'storybook/test';

/**
 * What each intent colour is FOR — the role layer, and the measurement it came
 * from.
 *
 * WHAT THIS PAGE IS. The evidence behind
 * `design-system/src/tokens/_color_roles.scss`, laid out so the argument can be
 * checked rather than taken. Every ratio below is computed from the tokens as
 * this page renders them, so it cannot describe a palette that has moved on.
 *
 * THE FINDING. All seven intents carry the same nine tokens — a base, a
 * container, a `-text`, six state overlays — which names two roles and uses
 * three. There is no `--color-warning-border` and no `--color-warning-icon`, so
 * an intent-coloured stroke or glyph reaches for the BASE, which is also the
 * ground. `_colors.scss` says as much in a comment beside the value ("for
 * borders/backgrounds"); a comment cannot enforce anything, and 108
 * declarations in this repository set a foreground from an intent base.
 *
 * WHY IT MATTERS MORE THAN #312 SUGGESTED. #312 found one failure, warning
 * filled at 3.70:1. Measured across the five surface steps this system actually
 * ships, the base is worse than that: `--color-warning` fails 4.5:1 on every
 * ground including white, `--color-tertiary` and `--color-info` fail on four of
 * five, and `--color-primary` fails on the two darkest. Every `--color-*-text`
 * token clears 4.5:1 on all five.
 *
 * WHAT ATLASSIAN DOES, read live on 2026-08-29: `color.text` 49 tokens,
 * `color.icon` 23, `color.border` 39 — three namespaces, because an icon and a
 * border are held to 3:1 under WCAG 1.4.11 where text is held to 4.5:1. Naming
 * the role is what lets a value be chosen against the right bar.
 *
 * AND 3:1 IS A FLOOR, NOT A VALUE. The first version of the role layer gave
 * every `-icon` the base, since the base already clears 3:1. Binding the tokens
 * to the real Alert component set in Figma showed what that would do: four of
 * its six variants already draw their icon from the `-text` colour, and the
 * base-valued token would have LIGHTENED them — danger 6.7:1 down to 5.0:1,
 * warning 8.7:1 down to 5.0:1. Clearing the icon bar is not a reason to stop
 * clearing the text one, so `-icon` resolves to `-text` and exists as its own
 * name so an icon can be lightened DELIBERATELY later, against a written bar.
 * `-border` keeps the base, where 3:1 is the right bar: a border as dark as its
 * own label reads as a heavier component than it is.
 *
 * THE BORDERS ARE REPOINTED NOW. 111 of the 137 border declarations moved onto
 * `-border` on 2026-08-29, and `npm run check:intent-roles` keeps them there;
 * the remaining 26 are recorded with a reason in
 * `docs/evals/intent-role-adoption.json`. Six of the seven roles alias their
 * base, so those 111 changed no pixel — what changed is that an edge now says
 * it is an edge, and the value can move for edges alone. The `-icon` roles
 * still have no users: an icon colour is usually set by `color:` on a glyph,
 * which `check:text-contrast` already measures against the 4.5:1 bar.
 *
 * The sweep also found the role that was missing rather than unused. 25 focus
 * rings were left behind because a focus indicator is not a border, and
 * measuring them found 29 rules whose ring could not be seen at all — see
 * Foundations/Focus ring, and `--color-focus-ring` beside these tokens.
 */
export default {
    title: 'Foundations/Intent colour roles',
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

/** Read a token as it renders, following aliases the way the browser does. */
const readToken = (name) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return null;
    if (raw.startsWith('#')) {
        return raw.length === 4
            ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
            : raw;
    }
    const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(raw);
    if (!rgb) return null;
    return `#${rgb.slice(1, 4).map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')}`;
};

/** WCAG: text 4.5:1 (1.4.3); icons, borders and other non-text 3:1 (1.4.11). */
const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

const INTENTS = ['primary', 'secondary', 'tertiary', 'danger', 'success', 'warning', 'info'];

/** The surface ladder every one of these colours has to survive. */
const GROUNDS = [
    ['lowest', '--color-surface-container-lowest'],
    ['low', '--color-surface-container-low'],
    ['container', '--color-surface-container'],
    ['high', '--color-surface-container-high'],
    ['highest', '--color-surface-container-highest'],
];

const grounds = () => GROUNDS.map(([label, token]) => [label, readToken(token)]).filter(([, hex]) => hex);

/** `{intent, role, hex, ratios: [{ground, ratio, passes}]}` for one token. */
const measure = (intent, role, bar) => {
    const hex = readToken(role === 'base' ? `--color-${intent}` : `--color-${intent}-${role}`);
    if (!hex) return null;
    return {
        intent,
        role,
        hex,
        bar,
        ratios: grounds().map(([ground, bg]) => {
            const ratio = contrast(hex, bg);
            return { ground, ratio, passes: ratio >= bar };
        }),
    };
};

/* ---------------------------------------------------------------- drawing */

const Cell = ({ ratio, passes }) => (
    <td
        style={{
            padding: '6px 10px',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            color: passes ? 'var(--color-on-surface)' : 'var(--color-danger-text)',
            fontWeight: passes ? 400 : 700,
        }}
    >
        {ratio.toFixed(2)}
        {passes ? '' : ' ✗'}
    </td>
);

const Matrix = ({ rows, bar, caption }) => (
    <table style={{ borderCollapse: 'collapse', margin: '0 0 28px' }}>
        <caption className="body2-txt" style={{ textAlign: 'left', padding: '0 0 8px' }}>
            {caption} — the bar is {bar}:1.
        </caption>
        <thead>
            <tr>
                <th className="body2-txt" style={{ textAlign: 'left', padding: '6px 10px' }}>
                    token
                </th>
                {GROUNDS.map(([label]) => (
                    <th key={label} className="body2-txt" style={{ padding: '6px 10px', textAlign: 'right' }}>
                        {label}
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>
            {rows.map((row) => (
                <tr key={`${row.intent}-${row.role}`} style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
                    <th
                        className="body2-txt"
                        style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 400 }}
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                marginRight: '8px',
                                borderRadius: '2px',
                                background: row.hex,
                            }}
                        />
                        <code>
                            --color-{row.intent}
                            {row.role === 'base' ? '' : `-${row.role}`}
                        </code>
                    </th>
                    {row.ratios.map((r) => (
                        <Cell key={r.ground} {...r} />
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
);

/* ----------------------------------------------------------------- story */

export const RolesAndBars = () => {
    const base = INTENTS.map((i) => measure(i, 'base', AA_TEXT)).filter(Boolean);
    const text = INTENTS.map((i) => measure(i, 'text', AA_TEXT)).filter(Boolean);
    const icon = INTENTS.map((i) => measure(i, 'icon', AA_NON_TEXT)).filter(Boolean);
    const border = INTENTS.map((i) => measure(i, 'border', AA_NON_TEXT)).filter(Boolean);

    return (
        <div style={{ maxWidth: '1000px', padding: '24px' }} data-testid="intent-roles">
            <h2 className="h4">What each intent colour is for</h2>
            <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                Every ratio is computed from the tokens as this page renders them, against the five
                surface steps the system ships. Nothing here has been repointed — the role tokens
                have no users yet.
            </p>

            <h3 className="h5" style={{ marginTop: '28px' }}>
                The base, used as text
            </h3>
            <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                108 declarations in this repository set a foreground from a base token today.
                <code> --color-warning</code> fails on every ground including white;
                <code> --color-tertiary</code> and <code>--color-info</code> fail on four of five;
                <code> --color-primary</code> fails on the two darkest.
            </p>
            <Matrix rows={base} bar={AA_TEXT} caption="Base token as a foreground" />

            <h3 className="h5">The `-text` role</h3>
            <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                Already in the system, and already correct: every one clears 4.5:1 on all five.
            </p>
            <Matrix rows={text} bar={AA_TEXT} caption="`-text` as a foreground" />

            <h3 className="h5">The new `-icon` and `-border` roles</h3>
            <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                Held to 3:1 rather than 4.5:1 — WCAG 1.4.11, non-text contrast — but 3:1 is the
                floor an icon must reach, not the value it should take. Every <code>-icon</code>
                resolves to its <code>-text</code> colour, which clears both bars on all five
                grounds; it exists as its own name so an icon can be lightened deliberately later,
                against a bar that is written down. Every <code>-border</code> keeps the base, where
                3:1 is the right bar.
                <strong> Warning is the exception</strong>: its base falls to 2.87:1 on the darkest
                ground, under even the border bar, so its <em>border</em> takes
                <code> #715c00</code> — the Figma warning value already used by the warning state
                layers. Its icon needs no exception.
            </p>
            <Matrix rows={icon} bar={AA_NON_TEXT} caption="`-icon`" />
            <Matrix rows={border} bar={AA_NON_TEXT} caption="`-border`" />
        </div>
    );
};

RolesAndBars.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-testid="intent-roles"]')).not.toBe(null);

    /*
     * The page must be reading the real tokens. A page that fell back to
     * literals would keep rendering a palette that had moved on, which is the
     * failure mode this whole file exists to avoid.
     */
    for (const intent of INTENTS) {
        await expect(readToken(`--color-${intent}`), `--color-${intent} is not defined`).not.toBe(null);
        await expect(readToken(`--color-${intent}-icon`), `--color-${intent}-icon is not defined`).not.toBe(null);
        await expect(readToken(`--color-${intent}-border`), `--color-${intent}-border is not defined`).not.toBe(null);
    }
    await expect(grounds().length, 'the surface ladder must resolve').toBe(GROUNDS.length);

    /*
     * The bars the role layer claims. These are the assertions that make the
     * file a promise rather than a description: an `-icon` or `-border` that
     * drops below 3:1 on ANY ground, or a `-text` below 4.5:1, fails here.
     */
    for (const intent of INTENTS) {
        for (const [role, bar] of [['icon', AA_NON_TEXT], ['border', AA_NON_TEXT], ['text', AA_TEXT]]) {
            const row = measure(intent, role, bar);
            for (const { ground, ratio } of row.ratios) {
                await expect(
                    ratio,
                    `--color-${intent}-${role} on surface-container-${ground} (${row.hex})`,
                ).toBeGreaterThanOrEqual(bar);
            }
        }
    }

    /*
     * And the marks on the base table have to be honest. Not "warning fails" —
     * that would go red on the day somebody fixes it, and a page that fails when
     * its subject is fixed is a page nobody keeps. This asserts only that what
     * is drawn as a failure IS one, in both directions.
     */
    for (const intent of INTENTS) {
        for (const { ground, ratio, passes } of measure(intent, 'base', AA_TEXT).ratios) {
            await expect(
                passes,
                `--color-${intent} on surface-container-${ground} is ${ratio.toFixed(2)} but marked ${passes ? 'passing' : 'failing'}`,
            ).toBe(ratio >= AA_TEXT);
        }
    }
};
