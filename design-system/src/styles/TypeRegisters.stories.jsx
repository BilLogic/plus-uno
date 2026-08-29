import React from 'react';
import { expect } from 'storybook/test';

/**
 * The two ways to say "this is an h5" (#267).
 *
 * A register here is four independent picks — size, line-height, weight, family
 * — and only one of them has `h5` in its name. Atlassian's whole active type
 * surface is fourteen tokens, each a complete `font` shorthand, so their size
 * cannot be taken without their line-height. Measured from `@atlaskit/tokens`
 * 16.9.0 as published.
 *
 * The composite layer in `_fonts.scss` takes that position without renaming or
 * removing anything: `--type-h5` is a shorthand built from the same four
 * tokens. Both are live, which is what makes this page a comparison rather than
 * an announcement.
 *
 * WHAT THE `play` FUNCTIONS ASSERT. That the two produce the SAME computed type
 * — same family, size, weight, line-height. That is the whole claim of an
 * additive layer, and it is the claim that quietly stops being true the first
 * time someone edits one side. A screenshot cannot hold it; `getComputedStyle`
 * can.
 *
 * AND WHY THAT WAS NOT ENOUGH ON ITS OWN. `Axes` compares the composite against
 * a span this file builds out of the four tokens — which means it compares my
 * reading of the register against my reading of the register. It shipped green
 * while `--type-h4` was a whole weight heavier than `h4`: h4–h6 are TITLES
 * (`--font-weight-title`, 600) and the composites had all six at a literal 700.
 * Both sides of that comparison were wrong in the same direction, so it passed.
 *
 * `AgainstTheRules` closes that hole by comparing against the ELEMENTS — a real
 * `<h4>`, a real `.body1-txt` — which is the only side of this that users see
 * and the only one no token file can restate incorrectly.
 */
export default {
    title: 'Foundations/Type registers',
    tags: ['!dev', '!autodocs'],
};

/** Every register with a composite, and the four tokens it is built from. */
const REGISTERS = [
    { name: 'h1', composite: '--type-h1' },
    { name: 'h2', composite: '--type-h2' },
    { name: 'h3', composite: '--type-h3' },
    { name: 'h4', composite: '--type-h4' },
    { name: 'h5', composite: '--type-h5' },
    { name: 'h6', composite: '--type-h6' },
    { name: 'body1', composite: '--type-body1' },
    { name: 'body2', composite: '--type-body2' },
    { name: 'body3', composite: '--type-body3' },
];

const Row = ({ children, label, note }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(6rem, 8rem) 1fr',
            gap: '16px',
            alignItems: 'baseline',
            padding: '10px 0',
            borderBottom: '1px solid var(--color-outline-variant)',
        }}
    >
        <div>
            <code style={{ color: 'var(--color-secondary)', fontSize: '0.75rem' }}>{label}</code>
            {note && (
                <div className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {note}
                </div>
            )}
        </div>
        <div>{children}</div>
    </div>
);

/** One token, one declaration. */
export const Composite = () => (
    <div style={{ maxWidth: '900px', padding: '24px' }}>
        <h2 className="h4-txt">One token per register</h2>
        <p className="body2-txt" style={{ maxWidth: '62ch' }}>
            Each line below sets <code style={{ color: 'var(--color-secondary)' }}>font</code> and
            nothing else. Size, line-height, weight and family arrive together or not at all.
        </p>
        {REGISTERS.map(({ name, composite }) => (
            <Row key={name} label={composite}>
                <span data-composite={name} style={{ font: `var(${composite})` }}>
                    The quick brown fox jumps
                </span>
            </Row>
        ))}
    </div>
);

const computed = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const s = getComputedStyle(el);
    return {
        family: s.fontFamily,
        size: s.fontSize,
        weight: s.fontWeight,
        lineHeight: s.lineHeight,
    };
};

Composite.play = async () => {
    for (const { name, composite } of REGISTERS) {
        const style = computed(`[data-composite="${name}"]`);
        await expect(style, `${composite} rendered nothing`).not.toBe(null);

        // A composite that failed to parse leaves the browser's defaults —
        // 16px, weight 400, a serif family. That is indistinguishable from
        // "looks fine" in a screenshot and is exactly the failure this catches.
        await expect(style.size).not.toBe('');
        await expect(Number.parseFloat(style.size)).toBeGreaterThan(0);
        await expect(style.lineHeight).not.toBe('normal');
    }
};

/** The four axes, set separately, the way every rule in the system does today. */
export const Axes = () => (
    <div style={{ maxWidth: '900px', padding: '24px' }}>
        <h2 className="h4-txt">Four tokens per register</h2>
        <p className="body2-txt" style={{ maxWidth: '62ch' }}>
            The same nine registers, built the way the system builds them now. Three of the four
            token names below do not contain the register they belong to, which is why the
            binding lives in whichever rule happens to use them together.
        </p>
        {REGISTERS.map(({ name }) => {
            const isBody = name.startsWith('body');
            // h1-h3 are headlines (700), h4-h6 are titles (600). Reading that off
            // the name is exactly the step this page argues should not be needed.
            const weight = isBody
                ? '--font-weight-normal'
                : Number(name[1]) <= 3
                    ? '--font-weight-headline'
                    : '--font-weight-title';
            return (
                <Row
                    key={name}
                    label={`--font-size-${name}`}
                    note={`+ --font-line-height-${name}, ${weight}, --font-family-${isBody ? 'body' : 'header'}`}
                >
                    <span
                        data-axes={name}
                        style={{
                            fontSize: `var(--font-size-${name})`,
                            lineHeight: `var(--font-line-height-${name})`,
                            fontWeight: `var(${weight})`,
                            fontFamily: isBody ? 'var(--font-family-body)' : 'var(--font-family-header)',
                        }}
                    >
                        The quick brown fox jumps
                    </span>
                </Row>
            );
        })}
    </div>
);

Axes.play = async () => {
    // Render the composite row too, so both are in one document and can be
    // compared without trusting two separate runs.
    const probe = document.createElement('div');
    probe.setAttribute('data-probe', '');
    document.body.appendChild(probe);
    try {
        for (const { name, composite } of REGISTERS) {
            const span = document.createElement('span');
            span.style.font = `var(${composite})`;
            span.dataset.composite = `probe-${name}`;
            probe.appendChild(span);
        }

        for (const { name, composite } of REGISTERS) {
            const axes = computed(`[data-axes="${name}"]`);
            const comp = computed(`[data-composite="probe-${name}"]`);
            await expect(axes, `${name} axes row missing`).not.toBe(null);
            await expect(comp, `${composite} probe missing`).not.toBe(null);

            // The claim of an additive layer: the new name resolves to the same
            // type as the four it is built from. If someone edits one side, this
            // is where it is caught rather than in a design review months later.
            await expect(comp.size, `${composite} size`).toBe(axes.size);
            await expect(comp.weight, `${composite} weight`).toBe(axes.weight);
            await expect(comp.lineHeight, `${composite} line-height`).toBe(axes.lineHeight);
            await expect(comp.family, `${composite} family`).toBe(axes.family);
        }
    } finally {
        probe.remove();
    }
};

/**
 * The composites, checked against the rules they claim to name.
 *
 * Each row renders the REAL element on the left of the comparison — `h4` picks
 * up `%font-title`, `.body1-txt` picks up `%font-body` — and the assertion
 * probes a composite against it. Nothing here restates a token value, which is
 * the property that makes this catch what `Axes` could not.
 */
export const AgainstTheRules = () => (
    <div style={{ maxWidth: '900px', padding: '24px' }}>
        <h2 className="h4">The elements themselves</h2>
        <p className="body2-txt" style={{ maxWidth: '62ch' }}>
            Every line below is the plain element or class the system already ships. The{' '}
            <code style={{ color: 'var(--color-secondary)' }}>play</code> function builds a
            composite beside each one and asserts the two computed styles match — so a composite
            that drifts from its own rule fails here rather than in a design review.
        </p>
        {REGISTERS.map(({ name }) => {
            const isBody = name.startsWith('body');
            const Tag = isBody ? 'p' : name;
            return (
                <Row key={name} label={isBody ? `.${name}-txt` : `<${name}>`}>
                    <Tag data-rule={name} className={isBody ? `${name}-txt` : undefined}>
                        The quick brown fox jumps
                    </Tag>
                </Row>
            );
        })}
    </div>
);

AgainstTheRules.play = async () => {
    const probe = document.createElement('div');
    probe.setAttribute('data-probe', '');
    document.body.appendChild(probe);
    try {
        for (const { name, composite } of REGISTERS) {
            const span = document.createElement('span');
            span.style.font = `var(${composite})`;
            span.dataset.composite = `rule-${name}`;
            probe.appendChild(span);
        }

        for (const { name, composite } of REGISTERS) {
            const rule = computed(`[data-rule="${name}"]`);
            const comp = computed(`[data-composite="rule-${name}"]`);
            await expect(rule, `${name} element missing`).not.toBe(null);
            await expect(comp, `${composite} probe missing`).not.toBe(null);

            // Weight first, because that is the axis that was wrong: h4-h6 are
            // titles at 600 and the composites claimed 700.
            await expect(comp.weight, `${composite} weight vs ${name}`).toBe(rule.weight);
            await expect(comp.size, `${composite} size vs ${name}`).toBe(rule.size);
            await expect(comp.lineHeight, `${composite} line-height vs ${name}`).toBe(rule.lineHeight);
            await expect(comp.family, `${composite} family vs ${name}`).toBe(rule.family);
        }
    } finally {
        probe.remove();
    }
};
