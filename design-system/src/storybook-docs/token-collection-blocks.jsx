import React from 'react';
import { TokenTable, C } from '@/storybook-docs/foundation-blocks.jsx';
import { DocsTable } from '@/storybook-docs/ds-docs-layout.jsx';
import { SPRING_PRIMITIVES, MOTION_SEMANTICS } from '../../../scripts/lib/tokens/plan.mjs';
import { FoundationSection, FoundationSubsection } from '@/storybook-docs/foundation-page.jsx';
import { TOKEN_COLLECTIONS, TOKENS } from '@/storybook-docs/docs-tokens.js';
import { typeStyle } from './lib/type-style.js';

/**
 * The token sections of one Foundations ▸ Tokens collection page: Primitives,
 * then Semantics split into Global, Components and Templates. Rows come from the
 * generated token table through `docs-tokens.js`, so a token added to the
 * source shows on its page with no edit here, and values are read as the page
 * resolves them, so they follow the Color mode.
 */

/* ------------------------------------------------------------------ motion */

/** Each spring primitive's raw `linear()` easing and settle time, read from the token table. */
export const springValues = (tokens = TOKENS) => {
    const out = {};
    for (const { name, raw } of tokens) {
        const m = name.match(/^--motion-spring-([\w-]+?)(-duration)?$/);
        if (!m) continue;
        out[m[1]] ??= {};
        out[m[1]][m[2] ? 'duration' : 'easing'] = raw;
    }
    return out;
};

const SPRINGS = springValues();

/** Damping for a unit mass: critical damping is 2·√stiffness, scaled by the ratio. */
export const dampingOf = ({ stiffness, ratio }) => Math.round(2 * ratio * Math.sqrt(stiffness) * 10) / 10;

const RawValue = ({ value }) => (
    <details>
        <summary>Raw value</summary>
        <C>{value}</C>
    </details>
);

const springCells = (spring) => {
    const v = SPRINGS[spring.name] ?? {};
    return [
        spring.stiffness,
        dampingOf(spring),
        v.duration ?? '—',
        <RawValue key="raw" value={v.easing ?? '—'} />,
    ];
};

const SPRING_HEAD = ['Stiffness', 'Damping', 'Settle', 'Raw value'];

/** The spring primitives in readable columns: stiffness, damping and settle time, with the `linear()` curve folded away. */
export const SpringPrimitiveTable = () => (
    <DocsTable>
        <thead>
            <tr>
                <th scope="col">Token</th>
                {SPRING_HEAD.map((h) => <th key={h} scope="col">{h}</th>)}
            </tr>
        </thead>
        <tbody>
            {SPRING_PRIMITIVES.map((p) => (
                <tr key={p.name}>
                    <td><C>{`--motion-spring-${p.name}`}</C></td>
                    {springCells(p).map((cell, i) => <td key={i}>{cell}</td>)}
                </tr>
            ))}
        </tbody>
    </DocsTable>
);

const byName = (name) => SPRING_PRIMITIVES.find((p) => p.name === name);

/** The motion semantics by job: the spring each one aliases, its numbers and its use. */
export const SpringSemanticTable = () => (
    <DocsTable>
        <thead>
            <tr>
                <th scope="col">Token</th>
                <th scope="col">Spring</th>
                {SPRING_HEAD.slice(0, 3).map((h) => <th key={h} scope="col">{h}</th>)}
                <th scope="col">Expressive spring</th>
                <th scope="col">Use</th>
            </tr>
        </thead>
        <tbody>
            {MOTION_SEMANTICS.map((m) => {
                const p = byName(m.productive);
                const [stiffness, damping, settle] = springCells(p);
                return (
                    <tr key={m.name}>
                        <td><C>{`--ds-motion-${m.name.replace('.', '-')}`}</C></td>
                        <td><C>{`--motion-spring-${p.name}`}</C></td>
                        <td>{stiffness}</td>
                        <td>{damping}</td>
                        <td>{settle}</td>
                        <td>{m.expressive ? <C>{`--motion-spring-${m.expressive}`}</C> : '—'}</td>
                        <td>{m.use}</td>
                    </tr>
                );
            })}
        </tbody>
    </DocsTable>
);

const TWO_WORD = new Set(['frame', 'font', 'line', 'scroll', 'option', 'menu', 'join', 'choice', 'progress', 'count', 'focus', 'ai', 'motion', 'grid', 'type']);

/** The family a token's rows are grouped under: `--ds-text-subtle` is text, `--card-pad` is card. */
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
        <h4 style={{ margin: 0, ...typeStyle('heading-sm'), color: 'var(--ds-text)' }}>{title}</h4>
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
    const sections = TOKEN_COLLECTIONS.find((c) => c.collection === collection)?.sections ?? [];
    const prim = sections.find((s) => s.tier === 'primitive');
    const sem = sections.filter((s) => s.tier === 'semantic');
    return (
        <>
            {prim && (
                <FoundationSection title="Primitives">
                    {primitives}
                    {collection === 'motion' ? <SpringPrimitiveTable /> : <Tables section={prim} swatch={swatch} />}
                </FoundationSection>
            )}
            {sem.length > 0 && (
                <FoundationSection title="Semantics">
                    {semantics}
                    {collection === 'motion' ? <SpringSemanticTable /> : sem.map((s) => (
                        <FoundationSubsection key={s.id} title={s.title}>
                            <Tables section={s} swatch={swatch && collection === 'color'} />
                        </FoundationSubsection>
                    ))}
                </FoundationSection>
            )}
        </>
    );
};
