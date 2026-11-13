import React from 'react';
import { TokenTable } from '@/storybook-docs/foundation-blocks.jsx';
import { FoundationSection, FoundationSubsection } from '@/storybook-docs/foundation-page.jsx';
import { collectTokens, groupBySection } from '@/storybook-docs/lib/token-collections.mjs';
import scales from '@/tokens/_scales.scss?raw';
import type from '@/tokens/_type.scss?raw';
import frameLayers from '@/tokens/_frame_layers.scss?raw';
import palette from '@/tokens/color/_palette.scss?raw';
import semantic from '@/tokens/color/_semantic.scss?raw';
import elevation from '@/tokens/color/_elevation.scss?raw';
import components from '@/tokens/ladder/_components.scss?raw';
import layers from '@/tokens/ladder/_layers.scss?raw';
import patterns from '@/tokens/ladder/_patterns.scss?raw';
import semantics from '@/tokens/ladder/_semantics.scss?raw';
import springs from '@/tokens/ladder/_springs.scss?raw';

/**
 * The token sections of one Foundations ▸ Tokens collection page: Primitives,
 * then Semantics split into Global, Components and Templates. Rows come from the
 * token stylesheets through `lib/token-collections.mjs`, so a token added to
 * the source shows on its page with no edit here, and values are read as the
 * page resolves them, so they follow the Color mode.
 */

// A file name decides where a Components token with no named family lands.
const SOURCES = [
    ['_scales.scss', scales],
    ['_type.scss', type],
    ['_frame_layers.scss', frameLayers],
    ['color/_palette.scss', palette],
    ['color/_semantic.scss', semantic],
    ['color/_elevation.scss', elevation],
    ['ladder/_components.scss', components],
    ['ladder/_layers.scss', layers],
    ['ladder/_patterns.scss', patterns],
    ['ladder/_semantics.scss', semantics],
    ['ladder/_springs.scss', springs],
].map(([file, text]) => ({ file, text }));

const corpus = collectTokens(SOURCES);

const TWO_WORD = new Set(['focused', 'frame', 'font', 'line', 'scroll', 'option', 'menu', 'join', 'choice', 'progress', 'count', 'focus', 'ai', 'motion', 'grid', 'type']);

/** The family a token's rows are grouped under: `--ds-text-subtle` is text, `--card-pad-default` is card. */
const familyKey = (name) => {
    const parts = name.replace(/^--(ds-)?/, '').split('-');
    if (parts[0] === 'palette' || (TWO_WORD.has(parts[0]) && parts.length > 1 && !/^\d/.test(parts[1]))) {
        return `${parts[0]}-${parts[1]}`;
    }
    return parts[0];
};

const groupByFamily = (tokens) => {
    const groups = new Map();
    for (const t of tokens) {
        const key = familyKey(t.name);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(t);
    }
    return [...groups];
};

const Family = ({ title, tokens, swatch }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
        <h4 style={{ margin: 0, font: 'var(--heading-small)', color: 'var(--ds-text)' }}>{title}</h4>
        <TokenTable swatch={swatch} rows={tokens.map((t) => ({ token: t.name }))} />
    </div>
);

const Tables = ({ section, swatch }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
        {groupByFamily(section.tokens).map(([key, tokens]) => (
            <Family key={key} title={key} tokens={tokens} swatch={swatch} />
        ))}
    </div>
);

/**
 * @param {{ collection: 'color'|'typography'|'spacing'|'elevation'|'motion', swatch?: boolean, primitives?: React.ReactNode, semantics?: React.ReactNode }} props
 *   `primitives` and `semantics` are the lead-in sentences of the two sections.
 */
export const TokenCollection = ({ collection, swatch = false, primitives, semantics }) => {
    const sections = groupBySection(corpus, collection);
    const prim = sections.find((s) => s.tier === 'primitive');
    const sem = sections.filter((s) => s.tier === 'semantic');
    return (
        <>
            {prim && (
                <FoundationSection title="Primitives">
                    {primitives}
                    <Tables section={prim} swatch={swatch} />
                </FoundationSection>
            )}
            {sem.length > 0 && (
                <FoundationSection title="Semantics">
                    {semantics}
                    {sem.map((s) => (
                        <FoundationSubsection key={s.id} title={s.title}>
                            <Tables section={s} swatch={swatch && collection === 'color'} />
                        </FoundationSubsection>
                    ))}
                </FoundationSection>
            )}
        </>
    );
};
