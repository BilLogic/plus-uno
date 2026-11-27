import React from 'react';
import { ColorPalette, ColorItem } from '@storybook/addon-docs/blocks';
import { TOKENS } from './docs-tokens.js';
import { accentGroups, chartGroups, typeGroups } from './lib/token-data.mjs';
import { typeStyle } from './lib/type-style.js';

/**
 * Foundations blocks fed from the generated token table. Rows come from
 * `lib/token-data.mjs`, so a token added to the table shows here with no edit
 * to the page. Swatches paint with `var(--ds-*)`, so they follow the Color mode.
 */

const Palette = ({ groups }) => (
    <div className="sb-docs-scroll">
        <ColorPalette>
            {groups.map((g) => (
                <ColorItem key={g.title} title={g.title} subtitle={g.subtitle} colors={g.colors} />
            ))}
        </ColorPalette>
    </div>
);

/** The eleven accent hues, each with its four background fills. */
export const AccentPalette = () => <Palette groups={accentGroups(TOKENS)} />;

/** The chart tokens, one row per job. */
export const ChartPalette = () => <Palette groups={chartGroups(TOKENS)} />;

const SAMPLE = { metric: '1,284 sessions', label: 'Upcoming sessions', code: '0:30 – 5:10 · v14' };

/** A specimen in its own text style: font, tracking, and the figures or case the style adds. */
const specimenStyle = (token) => ({
    ...typeStyle(token.slice(2)),
    color: 'var(--ds-text)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

/** The text styles, one group per family and weight, each specimen in its own style. */
export const TypeScaleBlocks = () => (
    <>
        {typeGroups(TOKENS).map((g) => (
            <section key={g.title} style={{ marginBlock: 'var(--stack-lg)' }}>
                <h4 style={{ ...typeStyle('heading-xs'), margin: 0, padding: 0 }}>
                    {g.title} · {g.family} {g.weight}
                </h4>
                <div className="sb-ds-type-scale" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', marginBlockStart: 'var(--stack-md)' }}>
                    {g.styles.map((s) => (
                        <div key={s.token} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', minWidth: 0 }}>
                            <span style={{ ...typeStyle('body-sm'), color: 'var(--ds-text-subtle)' }}>
                                {`${s.token} · ${s.size}/${s.lineHeight}${s.tracking ? ` · ${s.tracking.replace('-', '\u2212')}` : ''}`}
                            </span>
                            <p style={specimenStyle(s.token)}>{SAMPLE[g.category] ?? 'Tutors plan the week from here'}</p>
                        </div>
                    ))}
                </div>
            </section>
        ))}
    </>
);
