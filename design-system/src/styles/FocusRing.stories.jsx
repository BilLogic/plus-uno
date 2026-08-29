import React from 'react';
import { expect } from 'storybook/test';

/**
 * The focus ring — what 29 of this system's focus styles looked like before
 * 2026-08-29, and what they look like now.
 *
 * WHAT THIS PAGE IS. The evidence behind `--color-focus-ring` and behind
 * `npm run check:focus-ring`, drawn rather than described. Every ratio below is
 * computed from the tokens as this page renders them, so it cannot describe a
 * palette that has moved on, and every ring is a real ring on a real element
 * rather than a swatch: a number can be argued with, a ring you cannot see
 * cannot.
 *
 * THE FINDING. Of 84 focus rules in the design system, 29 had no affordance
 * reaching WCAG 1.4.11's 3:1 against its own ground. Four colours did all the
 * damage:
 *
 *   --color-inverse-primary      1.62:1   14 rules — a tint meant for DARK grounds
 *   --color-outline-variant      1.62:1    6 rules — the same grey the field wears at rest
 *   --color-primary-container    2.22:1    4 rules
 *   --color-*-state-08           1.13:1    4 rules — an 8% tint, used alone
 *   --color-on-surface-state-12  1.28:1    1 rule
 *
 * `.plus-input:focus` is the one to look at: `outline: none; border-color:
 * var(--color-inverse-primary); box-shadow: none`. Focus a text input, and the
 * entire indication that you are there is a pale blue edge at 1.62:1.
 *
 * WHY NOTHING CAUGHT IT. `check:storybook` runs axe over all 416 story files,
 * and axe has no focus-appearance rule — it cannot fire an element's `:focus`
 * state, so 1.4.11 and 2.4.11 are outside what it measures. The stories all
 * passed. `check:text-contrast` measures `color:`, not rings. The defect sat in
 * the gap between two green checks, which is the shape of most of them.
 *
 * A GLOW BESIDE A BORDER IS NOT THE FINDING. Eleven other rules pair a 1.13:1
 * glow with `border-color: var(--color-primary-border)` at 5.02:1. There the
 * border is the indicator and the glow is decoration around it, exactly as
 * Bootstrap intends. The check scores a rule on its STRONGEST affordance for
 * that reason, and those eleven were never findings.
 *
 * WHY A TOKEN AND NOT A VALUE. `--color-focus-ring` aliases `--color-primary`
 * today, which was already the majority spelling — 14 of the 53 affordance
 * declarations. It exists as a name so the ring can STOP aliasing primary — a
 * different hue, or a lighter one on dark grounds — without hunting 29 call
 * sites, and so one check has one name to hold them to. Atlassian keep the same
 * separation: `color.border.focused` sits beside `color.border`.
 *
 * STILL OPEN, and deliberately not decided here: the ring's WIDTH. The 53
 * declarations spell it six ways — `2px`, `0.2rem`, `--size-element-stroke-sm`,
 * `-md`, `-lg`, `--size-border-stroke-stroke-150` and `--size-card-border-lg`.
 * WCAG 2.4.11 asks for at least a 2px perimeter, which all but the `sm` one
 * clear, so the spread is a consistency question rather than a defect, and it
 * is Bill's to settle.
 */
export default {
    title: 'Foundations/Focus ring',
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

/**
 * Read a token as it renders, compositing translucency over the page.
 *
 * The compositing is the point for half these tokens: `--color-primary-state-08`
 * is `rgba(0, 101, 142, 0.08)`, and its raw channels are primary's own. Read
 * without the ground it looks like a strong blue; drawn on the page it is a
 * whisper.
 */
const PAGE = '--color-surface';

const readToken = (name, over = null) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return null;
    if (raw.startsWith('#')) {
        return raw.length === 4
            ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
            : raw;
    }
    const parts = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/.exec(raw);
    if (!parts) return null;
    const [r, g, b] = parts.slice(1, 4).map(Number);
    const alpha = parts[4] === undefined ? 1 : Number(parts[4]);
    const ground = over ?? readToken(PAGE);
    if (alpha === 1 || !ground) {
        return `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;
    }
    const [gr, gg, gb] = channels(ground);
    const mix = (top, bottom) => Math.round(top * alpha + bottom * (1 - alpha));
    return `#${[mix(r, gr), mix(g, gg), mix(b, gb)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
};

/** WCAG 1.4.11 — a focus ring is a non-text indicator. */
const AA_NON_TEXT = 3;

/**
 * What each of the 29 rules used before, and how many used it. Written down
 * because the tokens themselves are unchanged — only the call sites moved — so
 * nothing else in the repository still records what the rings looked like.
 */
const BEFORE = [
    ['--color-inverse-primary', 14, 'a light tint meant for dark grounds'],
    ['--color-outline-variant', 6, 'the resting border of a readonly field'],
    ['--color-primary-container', 4, 'the container fill, on four textarea states'],
    ['--color-primary-state-08', 2, 'an 8% tint, used with nothing beside it'],
    ['--color-danger-state-08', 1, 'the same, on the invalid AM/PM toggle'],
    ['--color-success-state-08', 1, 'the same, on the valid one'],
    ['--color-on-surface-state-12', 1, 'a 12% ink tint on a lesson tab'],
];

/* ---------------------------------------------------------------- drawing */

const Ring = ({ token, label }) => {
    const hex = readToken(token);
    const page = readToken(PAGE);
    const ratio = hex && page ? contrast(hex, page) : null;
    const passes = ratio !== null && ratio >= AA_NON_TEXT;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 190 }}>
            <div
                style={{
                    height: 44,
                    borderRadius: 4,
                    background: 'var(--color-surface-container-lowest)',
                    border: '1px solid var(--color-outline-variant)',
                    outline: `2px solid ${hex}`,
                    outlineOffset: 2,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                }}
            >
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    focused
                </span>
            </div>
            <code className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                {token}
            </code>
            <span
                className="body3-txt"
                style={{
                    fontVariantNumeric: 'tabular-nums',
                    color: passes ? 'var(--color-on-surface)' : 'var(--color-danger-text)',
                    fontWeight: passes ? 400 : 700,
                }}
            >
                {ratio === null ? 'unresolved' : `${ratio.toFixed(2)}:1`}
                {passes ? '' : ' ✗ under 3:1'}
                {label ? ` — ${label}` : ''}
            </span>
        </div>
    );
};

const Section = ({ title, children }) => (
    <section style={{ margin: '0 0 40px' }}>
        <h2 className="h5" style={{ margin: '0 0 4px' }}>{title}</h2>
        {children}
    </section>
);

export const BeforeAndAfter = () => (
    <div
        data-testid="focus-ring"
        style={{ padding: 32, background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
    >
        <h1 className="h4" style={{ margin: '0 0 8px' }}>The focus ring</h1>
        <p className="body2-txt" style={{ maxWidth: 640, margin: '0 0 32px', color: 'var(--color-on-surface-variant)' }}>
            29 of this system&apos;s 84 focus rules had no affordance reaching 3:1 against their own
            ground. Each ring below is drawn with the colour those rules used, on the ground they
            used it on.
        </p>

        <Section title="What they were">
            <p className="body2-txt" style={{ margin: '0 0 16px', color: 'var(--color-on-surface-variant)' }}>
                Every one of these is a real focus indicator that shipped. The count is how many
                rules used it.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
                {BEFORE.map(([token, count, why]) => (
                    <Ring key={token} token={token} label={`${count} rule${count === 1 ? '' : 's'}, ${why}`} />
                ))}
            </div>
        </Section>

        <Section title="What they are">
            <p className="body2-txt" style={{ margin: '0 0 16px', color: 'var(--color-on-surface-variant)' }}>
                One token, aliasing primary — which 14 of the 53 affordance declarations already
                used. The alias is the part that can change later without touching a call site.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
                <Ring token="--color-focus-ring" label="the role" />
                <Ring token="--color-danger-border" label="kept for the invalid state" />
                <Ring token="--color-success-border" label="kept for the valid one" />
            </div>
        </Section>
    </div>
);

BeforeAndAfter.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-testid="focus-ring"]')).not.toBe(null);

    /*
     * The page must be reading real tokens. One that fell back to literals would
     * keep drawing rings this system no longer has.
     */
    await expect(readToken(PAGE), '--color-surface is not defined').not.toBe(null);
    await expect(readToken('--color-focus-ring'), '--color-focus-ring is not defined').not.toBe(null);

    const page = readToken(PAGE);

    /*
     * The claim this page exists to make: the ring the system now uses clears
     * the bar, and each of the three it may use clears it.
     */
    for (const token of ['--color-focus-ring', '--color-danger-border', '--color-success-border']) {
        await expect(contrast(readToken(token), page), `${token} on the page`).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }

    /*
     * And the "before" column has to still BE the before. Not "these fail" as a
     * fixed sentence — that would go red the day someone repaints
     * inverse-primary, and a page that fails when its subject improves is a page
     * nobody keeps. This asserts the drawn mark matches the measured value, in
     * both directions.
     */
    for (const [token] of BEFORE) {
        const hex = readToken(token);
        await expect(hex, `${token} is not defined`).not.toBe(null);
        const ratio = contrast(hex, page);
        await expect(
            ratio < AA_NON_TEXT,
            `${token} measures ${ratio.toFixed(2)}:1 and is drawn as a failure`,
        ).toBe(true);
    }
};
