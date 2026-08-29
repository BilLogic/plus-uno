import React from 'react';
import { expect } from 'storybook/test';

/**
 * The type scale, measured — and three things it could become (#267).
 *
 * WHAT THIS PAGE IS. A decision aid in the same shape as
 * `ColourCandidates.stories.jsx` and `AiIdentity.stories.jsx`: the question is
 * Bill's, and shipping a default would make it the answer by inertia. Nothing
 * here changes a token. Every current size is READ FROM THE PAGE at render
 * time; every candidate is computed in front of you from a stated ratio.
 *
 * THE COUNT IS NOT THE PROBLEM. `--font-size-*` has 44 declarations, which
 * reads as bloat against Atlassian's 14 steps — and is the wrong measurement.
 * Twenty-seven of the 44 are FontAwesome icon sizes, and five more are aliases:
 * `--font-size-code` is `--font-size-body2`, and `--font-size-h5`,
 * `--font-size-lead` and `--font-size-blockquote` are all `--font-size-125`.
 * Twelve distinct text sizes remain, against fourteen steps. That is parity.
 *
 * THE SPACING IS THE PROBLEM. The twelve run
 *
 *     12 · 14 · 16 · 20 · 24 · 28 · 32 · 40 · 56 · 64 · 72 · 80
 *
 * and the ratio between each adjacent pair is
 *
 *     1.167 1.143 1.250 1.200 1.167 1.143 1.250 1.400 1.143 1.125 1.111
 *
 * The measure used below is the SPREAD — widest ratio over narrowest, 1.400 /
 * 1.111 = 1.260, where a scale scores 1.000. Not the count of distinct ratios,
 * which is the obvious metric and is wrong: font sizes round to whole pixels,
 * so a perfect 1.2 run from 16 renders as 16·19·23·28·33·40·48·57·69·83 and has
 * nine different rounded ratios — scoring worse, by that count, than the list it
 * replaces. Spread survives rounding. The 1.400 jump from 40 to 56 is the
 * largest gap in the system and sits directly beside the smallest.
 *
 * WHAT ATLASSIAN DOES, read live on 2026-08-29: fourteen steps —
 * seven heading, three body, three metric, one code — and each step is ONE
 * token carrying size, line-height and weight together. There is no
 * `font.lineHeight.*` namespace on their page at all. We ship 46 line-height
 * tokens beside the sizes, where the two can disagree; that is #346's defect
 * shape and it is a separate decision from this one.
 *
 * WHAT PINS THE BOTTOM OF THE SCALE. Measured across this repository, direct
 * `var()` uses: body2 54, body3 52, body1 40 — 146 of 192, or 76% — against 33
 * for every heading and display size combined. Moving 12, 14 or 16 is a change
 * to three quarters of the type in the product; moving 20 or 24 is not.
 */
export default {
    title: 'Foundations/Type scale candidates',
    tags: ['!dev', '!autodocs'],
};

/* -------------------------------------------------------------- measuring */

/** Resolve a size token to px as the browser renders it. */
const readPx = (name) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return null;
    const rem = /^([\d.]+)rem$/.exec(raw);
    if (rem) return Number(rem[1]) * 16;
    const px = /^([\d.]+)px$/.exec(raw);
    return px ? Number(px[1]) : null;
};

/**
 * The twelve. Named by the token that owns each size — the aliases are folded
 * in, because a scale is a set of SIZES and `--font-size-lead` is not a step.
 */
const SCALE_TOKENS = [
    '--font-size-body3',
    '--font-size-body2',
    '--font-size-body1',
    '--font-size-h5',
    '--font-size-h4',
    '--font-size-h3',
    '--font-size-h2',
    '--font-size-h1',
    '--font-size-display4',
    '--font-size-display3',
    '--font-size-display2',
    '--font-size-display1',
];

const ratios = (sizes) => sizes.slice(1).map((s, i) => Number((s / sizes[i]).toFixed(3)));

/**
 * Widest step over narrowest. 1.000 is a scale; the further above, the more the
 * sizes are a list. Robust to the whole-pixel rounding that makes a count of
 * distinct ratios useless here.
 */
const spread = (sizes) => {
    const rs = ratios(sizes);
    return rs.length ? Number((Math.max(...rs) / Math.min(...rs)).toFixed(3)) : 1;
};

/** A geometric run of `count` steps from `from`, rounded to whole px. */
const geometric = (from, ratio, count) =>
    Array.from({ length: count }, (_, i) => Math.round(from * ratio ** i));

/*
 * The candidates. Each is a function of the CURRENT bottom of the scale, so
 * none of them hard-codes a value the tokens own.
 */
const candidates = (current) => {
    const [b3, b2, b1] = current;
    return [
        {
            id: 'A',
            name: 'One ratio above 16, the body trio pinned',
            ratio: '1.2 from 16',
            sizes: [b3, b2, ...geometric(b1, 1.2, 10)],
            blast: 'the 33 heading and display uses; 20 -> 19, 24 -> 23, 32 -> 33, and the display run',
            note:
                'Keeps 12/14/16 exactly, which is 76% of the type in the product, and gives ' +
                'everything above 16 a single ratio. The pinned body pair is what stops it ' +
                'reaching 1.000 — 12 to 14 is 1.167 and 14 to 16 is 1.143, both of which are ' +
                'wider than anything above them.',
        },
        {
            id: 'B',
            name: 'One ratio throughout',
            ratio: '1.2 from 16, both directions',
            sizes: [...geometric(b1, 1 / 1.2, 3).reverse().slice(0, 2), ...geometric(b1, 1.2, 10)],
            blast: 'everything — body3 12 -> 11 and body2 14 -> 13, which is 106 direct uses',
            note:
                'The lowest spread on offer, because nothing is pinned. It also moves the two ' +
                'most-used sizes in the system — body3 12 -> 11 and body2 14 -> 13, 106 direct ' +
                'uses between them — and 11px is below where this product should be setting ' +
                'small copy.',
        },
        {
            id: 'C',
            name: 'Leave it',
            ratio: 'none — the current twelve',
            sizes: current,
            blast: 'nothing',
            note:
                'Worth stating as an option rather than assuming it away. The cost is not a ' +
                'rendering defect: it is that every new size is a judgement call, because ' +
                'there is no rule for the next one.',
        },
    ];
};

/* ---------------------------------------------------------------- drawing */

const Row = ({ sizes }) => {
    const rs = ratios(sizes);
    return (
        <table style={{ borderCollapse: 'collapse', margin: '12px 0 0' }}>
            <thead>
                <tr>
                    <th className="body2-txt" style={{ textAlign: 'left', padding: '4px 10px' }}>
                        px
                    </th>
                    {sizes.map((s, i) => (
                        <th
                            key={`${s}-${i}`}
                            className="body2-txt"
                            style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 400 }}
                        >
                            {s}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
                    <th className="body2-txt" style={{ textAlign: 'left', padding: '4px 10px', fontWeight: 400 }}>
                        ratio
                    </th>
                    <td />
                    {rs.map((r, i) => (
                        <td
                            key={`${r}-${i}`}
                            className="body2-txt"
                            style={{
                                padding: '4px 10px',
                                textAlign: 'right',
                                fontVariantNumeric: 'tabular-nums',
                                color: 'var(--color-on-surface-variant)',
                            }}
                        >
                            {r.toFixed(3)}
                        </td>
                    ))}
                </tr>
            </tbody>
        </table>
    );
};

const Specimen = ({ sizes }) => (
    <div style={{ margin: '12px 0 0' }}>
        {[...sizes].reverse().slice(0, 6).map((size, i) => (
            <div
                key={`${size}-${i}`}
                style={{
                    fontSize: `${size}px`,
                    lineHeight: 1.15,
                    fontFamily: 'var(--font-family-header, sans-serif)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                Sessions this week{' '}
                {/* A real token rather than an opacity: a faded label is a
                    contrast failure that axe reports and a reader experiences. */}
                <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
                    {size}px
                </span>
            </div>
        ))}
    </div>
);

/* ----------------------------------------------------------------- story */

export const Candidates = () => {
    const current = SCALE_TOKENS.map(readPx).filter((n) => n !== null);
    const options = candidates(current);

    return (
        <div style={{ maxWidth: '1000px', padding: '24px' }} data-testid="type-scale">
            <h2 className="h4">Twelve sizes, seven ratios</h2>
            <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                The scale below is read from the tokens as this page renders them.
                <strong> None of the candidates is a proposal</strong> — each is one answer with its
                cost written next to it. Atlassian ship fourteen steps to our twelve, so the count
                is already at parity; what differs is that theirs has a ratio and ours has a list.
            </p>

            <h3 className="h5" style={{ marginTop: '24px' }}>
                Today
            </h3>
            <Row sizes={current} />
            <p className="body2-txt" style={{ maxWidth: '62ch', marginTop: '10px' }}>
                <strong>spread {spread(current).toFixed(3)}</strong> across {current.length - 1}{' '}
                steps ({ratios(current).map((r) => r.toFixed(3)).join(' · ')}), where a scale scores
                1.000. The 1.400 from 40 to 56 is the largest gap in the system and it sits directly
                beside the smallest.
            </p>

            {options.map((option) => (
                <section key={option.id} style={{ marginTop: '32px' }} data-candidate={option.id}>
                    <h3 className="h5">
                        {option.id} — {option.name}
                    </h3>
                    <p className="body2-txt" style={{ maxWidth: '62ch' }}>
                        {option.note}
                    </p>
                    <Row sizes={option.sizes} />
                    <p className="body2-txt" style={{ maxWidth: '62ch', marginTop: '10px' }}>
                        <strong>spread {spread(option.sizes).toFixed(3)}</strong> · ratio{' '}
                        {option.ratio} · <em>moves</em>: {option.blast}
                    </p>
                    <Specimen sizes={option.sizes} />
                </section>
            ))}
        </div>
    );
};

Candidates.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-testid="type-scale"]')).not.toBe(null);

    /*
     * The page must be reading real tokens. A page that fell back to literals
     * would keep describing a scale that had moved on, which is the failure mode
     * a decision aid cannot have.
     */
    const current = SCALE_TOKENS.map(readPx);
    for (const [i, size] of current.entries()) {
        await expect(size, `${SCALE_TOKENS[i]} did not resolve`).not.toBe(null);
    }
    await expect(current.length, 'twelve steps').toBe(12);

    // Ascending and distinct: a "scale" with a repeat is an alias that slipped in.
    for (let i = 1; i < current.length; i += 1) {
        await expect(current[i], `${SCALE_TOKENS[i]} must be larger than the step below`)
            .toBeGreaterThan(current[i - 1]);
    }

    /*
     * The claim the page is built on. Not "seven" as a literal — that would go
     * stale silently the day someone changes a size. This asserts that the
     * number the page PRINTS is the number its own arithmetic produces, and
     * that today it is more than one, which is what makes the page worth having.
     */
    const today = spread(current);
    await expect(today, 'the current scale is not already regular').toBeGreaterThan(1);
    await expect(
        canvasElement.textContent,
        'the printed spread must match the measured one',
    ).toContain(`spread ${today.toFixed(3)}`);

    /* Each candidate renders, and each is arithmetically what it claims. */
    for (const option of candidates(current)) {
        const section = canvasElement.querySelector(`[data-candidate="${option.id}"]`);
        await expect(section, `candidate ${option.id} did not render`).not.toBe(null);
        await expect(option.sizes.length, `candidate ${option.id} step count`).toBe(current.length);
        for (let i = 1; i < option.sizes.length; i += 1) {
            await expect(option.sizes[i], `candidate ${option.id} must ascend`)
                .toBeGreaterThan(option.sizes[i - 1]);
        }
    }

    /*
     * The point of A and B is fewer ratios than today. If a candidate stops
     * beating the status quo it has stopped being a candidate, and saying so
     * here is cheaper than noticing it in review.
     */
    const [a, b] = candidates(current);
    await expect(spread(a.sizes), 'A must beat today').toBeLessThan(today);
    await expect(spread(b.sizes), 'B must beat A').toBeLessThanOrEqual(spread(a.sizes));

    /* A pins the body trio — that is its whole argument. */
    await expect(a.sizes.slice(0, 3), 'A must not move 12/14/16').toEqual(current.slice(0, 3));
};
