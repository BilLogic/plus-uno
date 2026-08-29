import React from 'react';
import { expect, within } from 'storybook/test';

/**
 * The two surface models, side by side (#268).
 *
 * This page exists to make one decision comparable rather than arguable. #268
 * asks whether elevation in this system is carried by LIGHTNESS or by SHADOW,
 * and until now the answer could only be read: nine graded surfaces and a
 * five-step shadow ramp both exist, and nothing says which to reach for. So the
 * docs canvases pick a surface by eye.
 *
 * Measured against `@atlaskit/tokens` 16.9.0, read from the published package:
 * Atlassian's `elevation.surface`, `elevation.surface.raised` and
 * `elevation.surface.overlay` are ALL `#FFFFFF`. Elevation is the shadow. Only
 * `sunken` differs in fill. The role layer in `_elevation.scss` takes that
 * position — as an alias over values we already had, deleting nothing.
 *
 * WHAT THE `play` FUNCTIONS ASSERT, and why they are not decoration: the whole
 * claim of the role model is that a raised card is the SAME COLOUR as the page
 * and is lifted by its shadow. That is exactly the kind of statement a
 * screenshot cannot hold and a resolved computed style can. If someone later
 * "fixes" `--surface-raised` to a lighter grey — the intuitive edit, and the
 * wrong one under this model — the assertion below goes red and says so.
 */
export default {
    title: 'Foundations/Surface roles',
    tags: ['!dev', '!autodocs'],
};

const resolve = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * A token name, rendered as code.
 *
 * The colour is set here rather than inherited, and that is a finding rather
 * than a preference: Bootstrap's default `code` colour is `#d63384`, which
 * measures 4.28:1 on this ground — under AA's 4.5:1 — so a bare `<code>` in a
 * story canvas fails `check:storybook`'s a11y pass. The docs stylesheet is
 * fixed for docs pages (`.sbdocs code`), but a story canvas is not inside
 * `.sbdocs`, so a story that wants readable code has to say so.
 */
const Token = ({ children }) => (
    <code style={{ color: 'var(--color-secondary)', fontSize: '0.75rem' }}>{children}</code>
);

const Swatch = ({ label, fill, shadow, note }) => (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
            data-role={label}
            style={{
                background: fill,
                boxShadow: shadow || 'none',
                border: shadow ? 'none' : '1px solid var(--color-outline-variant)',
                borderRadius: 'var(--size-element-radius-md)',
                height: '84px',
            }}
        />
        <figcaption>
            <Token>{label}</Token>
            <p className="body3-txt" style={{ margin: '4px 0 0', color: 'var(--color-on-surface-variant)' }}>
                {note}
            </p>
        </figcaption>
    </figure>
);

const Grid = ({ children }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
        }}
    >
        {children}
    </div>
);

/**
 * The proposed model. Five roles, every value an alias of something that
 * already existed.
 */
export const RoleModel = () => (
    <div style={{ maxWidth: '1100px', padding: '24px', background: 'var(--surface-sunken)' }}>
        <h2 className="h4">By role — what a surface is for</h2>
        <p className="body2-txt" style={{ maxWidth: '62ch' }}>
            Three of these five are the same colour. That is the model, not a mistake: a raised
            card and an overlay are the page&rsquo;s own colour, lifted by shadow. Only{' '}
            <Token>sunken</Token> changes fill, and it goes down.
        </p>
        <Grid>
            <Swatch label="--surface-default" fill="var(--surface-default)" note="the page" />
            <Swatch label="--surface-sunken" fill="var(--surface-sunken)" note="the ground behind grouped things" />
            <Swatch
                label="--surface-raised"
                fill="var(--surface-raised)"
                shadow="var(--surface-raised-shadow)"
                note="cards that lift — paired with --surface-raised-shadow"
            />
            <Swatch
                label="--surface-overlay"
                fill="var(--surface-overlay)"
                shadow="var(--surface-overlay-shadow)"
                note="popovers, toasts — paired with --surface-overlay-shadow. Modals name --elevation-light-4 directly."
            />
            <Swatch label="--surface-container" fill="var(--surface-container)" note="a neutral well inside a card" />
        </Grid>
    </div>
);

RoleModel.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    void canvas;

    const page = resolve('--surface-default');
    // The claim the whole model rests on. If these ever diverge, the system has
    // quietly reverted to raising things with lightness and this page is lying.
    await expect(resolve('--surface-raised')).toBe(page);
    await expect(resolve('--surface-overlay')).toBe(page);

    // …and sunken must NOT be the page, or "grouped things" have no ground.
    await expect(resolve('--surface-sunken')).not.toBe(page);

    // Each raised role ships with its shadow. A role whose shadow resolved to
    // nothing would be a flat card claiming to be raised.
    for (const shadow of ['--surface-raised-shadow', '--surface-overlay-shadow']) {
        await expect(resolve(shadow).length).toBeGreaterThan(0);
    }

    // …and it ships with the RIGHT one. `raised` pointed at Light/1 when it
    // shipped, against a mapping table this repo already had that assigns
    // Light/2 to cards; a non-empty shadow was indistinguishable from a correct
    // one, which is how that got through. The token-name agreement is checked
    // in scripts/check-elevation-roles.test.mjs; here it is checked as VALUES,
    // in a browser, which is the only place a `var()` chain actually resolves.
    await expect(resolve('--surface-raised-shadow')).toBe(resolve('--elevation-light-2'));
    await expect(resolve('--surface-overlay-shadow')).toBe(resolve('--elevation-light-3'));

    // The overlay role stops short of modals on purpose — see _elevation.scss.
    await expect(resolve('--surface-overlay-shadow')).not.toBe(resolve('--elevation-light-4'));

    // Every role is an ALIAS. Nothing here introduced a colour, so each one has
    // to equal the level token it points at — that is what "nothing deleted,
    // nothing added" means, checked rather than asserted in a comment.
    await expect(resolve('--surface-default')).toBe(resolve('--color-surface-container-lowest'));
    await expect(resolve('--surface-sunken')).toBe(resolve('--color-surface'));
    await expect(resolve('--surface-container')).toBe(resolve('--color-surface-container'));
};

/**
 * The model we have. Nine surfaces graded by lightness, no roles, no pairing.
 */
export const LevelModel = () => (
    <div style={{ maxWidth: '1100px', padding: '24px' }}>
        <h2 className="h4">By level — what a surface is</h2>
        <p className="body2-txt" style={{ maxWidth: '62ch' }}>
            The nine that exist today, in lightness order. Each is a real, distinct value and
            none of them says what it is for, so a modal and a table header can legitimately
            pick the same one or different ones.
        </p>
        <Grid>
            {[
                ['--color-surface-container-lowest', 'lightest'],
                ['--color-surface-bright', ''],
                ['--color-surface', 'the current page ground'],
                ['--color-surface-container-low', ''],
                ['--color-surface-container', ''],
                ['--color-surface-container-high', ''],
                ['--color-surface-container-highest', ''],
                ['--color-surface-dim', 'darkest'],
                ['--color-surface-variant', 'off the ramp entirely'],
            ].map(([token, note]) => (
                <Swatch key={token} label={token} fill={`var(${token})`} note={note} />
            ))}
        </Grid>
        <h3 className="h5">and the five shadows, unattached to any of them</h3>
        <Grid>
            {[1, 2, 3, 4, 5].map((n) => (
                <Swatch
                    key={n}
                    label={`--elevation-light-${n}`}
                    fill="var(--color-surface-container-lowest)"
                    shadow={`var(--elevation-light-${n})`}
                    note=""
                />
            ))}
        </Grid>
    </div>
);

LevelModel.play = async () => {
    // The point of this story is that the nine are genuinely different values —
    // that is what makes "pick one by eye" possible at all. If two of them ever
    // collapse to the same colour, the ramp has a step that means nothing.
    const levels = [
        '--color-surface-container-lowest',
        '--color-surface',
        '--color-surface-container-low',
        '--color-surface-container',
        '--color-surface-container-high',
        '--color-surface-container-highest',
        '--color-surface-dim',
    ].map(resolve);
    await expect(new Set(levels).size).toBe(levels.length);
};
