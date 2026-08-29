import React from 'react';
import { expect } from 'storybook/test';

/**
 * Four candidate register colours for a PLUS agent, measured (#269).
 *
 * WHAT THIS PAGE IS. A decision aid, not a proposal with a preferred answer.
 * #269 concluded that we have no AI brand and that this blocks the components
 * rather than the other way round; reading `@atlaskit/tokens` 16.9.0 sharpened
 * it — Rovo's identity is FOURTEEN tokens and they exist before any component:
 *
 *   color.rovo.background.brand.bold   #000000   (+ hovered, pressed)
 *   color.rovo.border|icon.lime        #6A9A23
 *   color.rovo.border|icon.saffron     #FCA700
 *   color.rovo.border|icon.blue        #1868DB
 *   color.rovo.border|icon.purple      #AF59E1
 *   elevation.rovo.surface.overlay     #F8F8F8   (+ hovered, pressed)
 *
 * Three things in that shape are decisions, and all three are copyable:
 *   1. ONE BOLD GROUND, AND IT IS BLACK — not a hue. AI is a different
 *      REGISTER, not another semantic colour competing with success and danger.
 *   2. THE ACCENTS ONLY EVER APPEAR AS BORDER AND ICON. There is no
 *      `rovo.text` and no `rovo.background` in those hues: the identity marks an
 *      edge and a glyph, it never floods a surface.
 *   3. IT HAS ITS OWN OVERLAY SURFACE, so an AI panel reads as AI before you
 *      read a word in it.
 *
 * WHY NO TOKENS ARE ADDED BY THIS FILE. Picking `--color-ai-bold` is picking a
 * brand, and that is Bill's call — #269 says so and I am not going to make it
 * by shipping a default that then becomes the answer by inertia. Every value
 * below is local to this story and labelled a candidate.
 *
 * WHAT IS MEASURED, because "these four look different" is not evidence:
 *   contrast   white text on the candidate, WCAG AA needs 4.5:1
 *   distance   how far the candidate is from the NEAREST colour this system
 *              already uses, on a weighted RGB metric. A register colour that
 *              sits next to `--color-mastering-content` would say the agent IS
 *              a curriculum domain, which is the borrowed-meaning mistake #269
 *              argues against.
 */
export default {
    title: 'Foundations/AI identity candidates',
    tags: ['!dev', '!autodocs'],
};

/**
 * The colours this system already uses, as grounds — every `--color-*` that is
 * a literal hex and is not a container, state layer, on-colour or surface. A
 * candidate is measured against all of them.
 */
const EXISTING = {
    '--color-primary': '#0472a8',
    '--color-secondary': '#445c6a',
    '--color-tertiary': '#0e8175',
    '--color-danger': '#ba1a1a',
    '--color-success': '#3e691a',
    '--color-warning': '#9f8205',
    '--color-social-emotional': '#8c6600',
    '--color-mastering-content': '#8659a9',
    '--color-advocacy': '#167745',
    '--color-relationship': '#c70b77',
    '--color-technology-tools': '#005cbd',
    '--color-outline': '#6f797a',
};

const CANDIDATES = [
    {
        name: 'Near-black',
        hex: '#1c1f21',
        argument:
            'Atlassian’s own answer. Says "different register" rather than "another hue", and cannot collide with a semantic colour because it is not one.',
    },
    {
        name: 'Indigo',
        hex: '#3b3fa8',
        argument:
            'Reads as a distinct product voice while staying in the blue family the app already speaks. Nearest neighbour is technology-tools.',
    },
    {
        name: 'Deep violet',
        hex: '#5b21b6',
        argument:
            'Furthest from the app’s blues. Sits in the same family as mastering-content, so the distance number below is the one to read.',
    },
    {
        name: 'Plum',
        hex: '#6d2f6b',
        argument:
            'Quieter than violet, still clearly not a status colour. No close neighbour in the current palette.',
    },
];

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
 * Weighted RGB distance (the "Compuphase" approximation). Not CIEDE2000 — this
 * runs in a story with no colour-science dependency, and the question it answers
 * is coarse: "could someone mistake this for a colour the system already uses?"
 * A finer metric would give more decimal places to the same answer.
 */
const distance = (a, b) => {
    const [r1, g1, b1] = channels(a);
    const [r2, g2, b2] = channels(b);
    const rm = (r1 + r2) / 2;
    return Math.sqrt(
        (2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2,
    );
};

const nearest = (hex) =>
    Object.entries(EXISTING)
        .map(([token, value]) => ({ token, value, d: distance(hex, value) }))
        .sort((p, q) => p.d - q.d)[0];

/**
 * The identity chip from the #269 proposal: mark, name, and what it can see.
 *
 * Uses the `-txt` classes rather than `--type-*`. Those composites are proposed
 * in #344 and not merged, and an unresolved `font: var(--type-body2)` renders
 * silently as the browser default — a page that looked fine while asserting
 * nothing. Depending on unmerged work is how that happens.
 */
const AgentChip = ({ hex }) => (
    <div
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--size-element-gap-sm)',
            padding: '6px 12px 6px 6px',
            borderRadius: 'var(--size-element-radius-full)',
            border: `1px solid ${hex}`,
            background: 'var(--surface-overlay)',
            boxShadow: 'var(--surface-overlay-shadow)',
        }}
    >
        <span
            aria-hidden="true"
            style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: hex,
                display: 'inline-block',
            }}
        />
        <span className="body2-txt">PLUS agent</span>
        <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            can see this session
        </span>
    </div>
);

export const Candidates = () => (
    <div style={{ maxWidth: '1000px', padding: '24px' }}>
        <h2 className="h4-txt">Four candidates, measured</h2>
        <p className="body2-txt" style={{ maxWidth: '62ch' }}>
            Each row shows the candidate as a bold ground, as the border-and-icon accent it would
            mostly appear as, and the two numbers that decide whether it is usable at all.
            <strong> None of these is a proposal.</strong> The colour is a branding decision; this
            page exists so it is made against evidence rather than a swatch.
        </p>

        {CANDIDATES.map(({ name, hex, argument }) => {
            const white = contrast('#ffffff', hex);
            const near = nearest(hex);
            return (
                <section
                    key={name}
                    data-candidate={name}
                    data-hex={hex}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
                        gap: '24px',
                        alignItems: 'start',
                        padding: '20px 0',
                        borderBottom: '1px solid var(--color-outline-variant)',
                    }}
                >
                    <div>
                        <div
                            style={{
                                background: hex,
                                color: '#ffffff',
                                padding: '16px',
                                borderRadius: 'var(--size-element-radius-md)',
                            }}
                            className="body1-txt"
                        >
                            {name} &middot; {hex}
                        </div>
                        <div style={{ marginTop: '12px' }}>
                            <AgentChip hex={hex} />
                        </div>
                    </div>
                    <div>
                        <p className="body2-txt" style={{ marginTop: 0 }}>
                            {argument}
                        </p>
                        <dl
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr',
                                gap: '4px 12px',
                                margin: 0,
                            }}
                            className="body3-txt"
                        >
                            <dt style={{ color: 'var(--color-on-surface-variant)' }}>white on it</dt>
                            <dd style={{ margin: 0 }} data-metric="contrast">
                                {white.toFixed(2)}:1
                            </dd>
                            <dt style={{ color: 'var(--color-on-surface-variant)' }}>nearest existing</dt>
                            <dd style={{ margin: 0 }} data-metric="nearest">
                                {near.token} &mdash; distance {Math.round(near.d)}
                            </dd>
                        </dl>
                    </div>
                </section>
            );
        })}

        <h3 className="h5-txt" style={{ marginTop: '32px' }}>
            Still yours to decide
        </h3>
        <ol className="body2-txt" style={{ maxWidth: '62ch' }}>
            <li>Which register colour, if any of these.</li>
            <li>
                What &ldquo;verified&rdquo; means for a PLUS agent. In a product touching student
                data that is a policy answer before a visual one.
            </li>
            <li>What must be disclosed, and whether a tutor or a student is being told.</li>
            <li>
                Whether the agent has a name. Rovo&rsquo;s nine components cohere because
                &ldquo;Rovo&rdquo; is a decided thing; without a name the chip above has nothing to
                put in it.
            </li>
        </ol>
    </div>
);

Candidates.play = async () => {
    for (const { name, hex } of CANDIDATES) {
        const white = contrast('#ffffff', hex);
        // A candidate that cannot carry white text cannot be a bold ground, so
        // showing it as one would be showing something unusable.
        await expect(white, `${name}: white on ${hex}`).toBeGreaterThanOrEqual(4.5);

        // And it must not be mistakable for a colour that already means
        // something. 60 is well below every pair in the current palette that
        // people distinguish in practice; a candidate under it would be arguing
        // that the agent IS whatever it sits next to.
        const near = nearest(hex);
        await expect(
            near.d,
            `${name} is only ${Math.round(near.d)} from ${near.token}`,
        ).toBeGreaterThan(60);

        // The measurement has to be on the page, not just in this function —
        // the page is the deliverable.
        const section = document.querySelector(`[data-candidate="${name}"]`);
        await expect(section, `${name} did not render`).not.toBe(null);
        await expect(section.querySelector('[data-metric="contrast"]').textContent).toContain(
            white.toFixed(2),
        );
    }
};
