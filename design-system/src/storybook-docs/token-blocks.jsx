import React from 'react';
import { ColorPalette, ColorItem, Typeset } from '@storybook/addon-docs/blocks';
import { TOKENS } from './docs-tokens.js';
import { accentGroups, chartGroups, typeGroups } from './lib/token-data.mjs';

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

const SAMPLE = { metric: '1,284 sessions' };

/** The Heading, Body and Metric text styles, one Typeset per family and weight. */
export const TypeScaleBlocks = () => (
    <>
        {typeGroups(TOKENS).map((g) => (
            <section key={g.title} style={{ marginBlock: 'var(--stack-lg)' }}>
                <h4 style={{ font: 'var(--heading-xs)', margin: 0 }}>
                    {g.title} · {g.family} {g.weight}
                </h4>
                <p style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)', margin: 0 }}>
                    {g.styles.map((s) => `${s.token} ${s.size}/${s.lineHeight}`).join(' · ')}
                </p>
                <Typeset
                    fontFamily={`var(${g.familyToken})`}
                    fontWeight={`var(${g.weightToken})`}
                    fontSizes={g.styles.map((s) => s.size)}
                    sampleText={SAMPLE[g.category] ?? 'Tutors plan the week from here'}
                />
            </section>
        ))}
    </>
);
