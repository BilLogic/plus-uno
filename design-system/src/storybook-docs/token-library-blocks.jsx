import React, { useMemo, useState } from 'react';
import { Button, SearchField, Select, Toggle } from '@/components';
import { C } from '@/storybook-docs/foundation-blocks.jsx';
import { DocsTable } from '@/storybook-docs/ds-docs-layout.jsx';
import { FoundationSection, FoundationSubsection } from '@/storybook-docs/foundation-page.jsx';
import { COLLECTION_TITLES, COLLECTIONS, SCOPES, SCOPE_TITLES, TIERS } from '@/storybook-docs/lib/token-collections.mjs';
import { buildLibrary, filterLibrary, groupLibrary } from '@/storybook-docs/lib/token-library.mjs';
import { SOURCES, corpus } from '@/storybook-docs/token-collection-blocks.jsx';
import registry from '../../agent-views/tokens.json';

/**
 * Foundations ▸ Tokens ▸ Library: one searchable list of every token. Rows come
 * from the same corpus and the same placement as the collection pages
 * (`lib/token-collections.mjs`), so a token added to the source shows here with
 * no edit. A color role reads its light and dark value from the token
 * stylesheets; every other row has one value.
 */

const intents = new Map(registry.tokens.map((t) => [t.name, t.intent ?? '']));
const darkSources = SOURCES.filter((s) => /^color\/_(semantic|elevation)\.scss$/.test(s.file));
const LIBRARY = buildLibrary(corpus, { darkSources, intents });

const ALL = 'all';
const options = (all, items) => [{ value: ALL, label: all }, ...items.map(([value, label]) => ({ value, label }))];
const COLLECTION_OPTIONS = options('All collections', COLLECTIONS.map((c) => [c, COLLECTION_TITLES[c]]));
const TIER_OPTIONS = options('All tiers', TIERS.map((t) => [t, t === 'primitive' ? 'Primitive' : 'Semantic']));
const SCOPE_OPTIONS = options('All scopes', SCOPES.map((s) => [s, SCOPE_TITLES[s]]));

const swatchStyle = {
    width: 'var(--icon-lg)',
    height: 'var(--icon-lg)',
    flexShrink: 0,
    borderRadius: 'var(--radius-md)',
    boxShadow: 'inset 0 0 0 var(--border-default) var(--ds-border)',
};

/** A swatch for a color, a shadow sample, a bar for a length, or nothing. */
const Preview = ({ row, value }) => {
    if (row.collection === 'color') return <span aria-hidden="true" style={{ ...swatchStyle, background: value }} />;
    if (/^--ds-shadow-/.test(row.name)) {
        return <span aria-hidden="true" style={{ ...swatchStyle, boxShadow: `var(${row.name})`, background: 'var(--ds-surface)' }} />;
    }
    if (row.collection === 'spacing' && /^-?[\d.]+(px|rem)$/.test(value)) {
        return (
            <span aria-hidden="true" style={{ display: 'inline-flex', width: 'var(--icon-lg)', alignItems: 'center' }}>
                <span style={{ width: `min(${value}, var(--icon-lg))`, height: 'var(--stroke-2)', background: 'var(--ds-icon)' }} />
            </span>
        );
    }
    return <span aria-hidden="true" style={{ ...swatchStyle, boxShadow: 'none' }} />;
};

const Value = ({ row }) =>
    row.dark === null ? (
        <C>{row.light}</C>
    ) : (
        <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
            <span><span style={{ color: 'var(--ds-text-subtle)' }}>Light </span><C>{row.light}</C></span>
            <span><span style={{ color: 'var(--ds-text-subtle)' }}>Dark </span><C>{row.dark}</C></span>
        </span>
    );

const Row = ({ row, onCopy }) => (
    <tr>
        <td>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-md)' }}>
                {row.dark === null ? (
                    <Preview row={row} value={row.light} />
                ) : (
                    <span style={{ display: 'inline-flex', gap: 'var(--inline-sm)' }}>
                        <Preview row={row} value={row.light} />
                        <Preview row={row} value={row.dark} />
                    </span>
                )}
                <Button appearance="subtle" spacing="compact" aria-label={`Copy ${row.name}`} onClick={() => onCopy(row.name)}>
                    <span data-token-name={row.name} style={{ font: 'var(--code)' }}>{row.name}</span>
                </Button>
            </span>
        </td>
        <td>{row.description || '—'}</td>
        <td><Value row={row} /></td>
    </tr>
);

const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

/** The Library: search with an exact-match toggle, three filters, a live count and results by collection. */
export const TokenLibrary = () => {
    const [query, setQuery] = useState('');
    const [exact, setExact] = useState(false);
    const [collection, setCollection] = useState(ALL);
    const [tier, setTier] = useState(ALL);
    const [scope, setScope] = useState(ALL);
    const [copied, setCopied] = useState('');

    const rows = useMemo(() => filterLibrary(LIBRARY, { query, exact, collection, tier, scope }), [query, exact, collection, tier, scope]);
    const groups = useMemo(() => groupLibrary(rows), [rows]);
    const onCopy = async (name) => setCopied((await copyText(name)) ? `Copied ${name}` : `Could not copy ${name}`);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--inline-lg)' }}>
                <div style={{ flex: '1 1 var(--card-min-width-md)' }}>
                    <SearchField placeholder="Search tokens" label="Search tokens" value={query} onValueChange={setQuery} />
                </div>
                <Toggle label="Exact match" isChecked={exact} onChange={(e) => setExact(e.target.checked)} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--inline-lg)' }}>
                <Select label="Collection" isSearchable={false} clearable={false} options={COLLECTION_OPTIONS} value={collection} onChange={setCollection} />
                <Select label="Tier" isSearchable={false} clearable={false} options={TIER_OPTIONS} value={tier} onChange={setTier} />
                <Select label="Scope" isSearchable={false} clearable={false} options={SCOPE_OPTIONS} value={scope} onChange={setScope} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--inline-lg)', font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>
                <p role="status" data-testid="token-count" style={{ margin: 0 }}>{rows.length.toLocaleString('en-US')} of {LIBRARY.length.toLocaleString('en-US')} tokens</p>
                <p role="status" aria-live="polite" data-testid="copy-status" style={{ margin: 0 }}>{copied}</p>
            </div>
            {groups.length === 0 && <p style={{ margin: 0, font: 'var(--body-default)' }}>No tokens match. Clear the search or loosen a filter.</p>}
            {groups.map((g) => (
                <FoundationSection key={g.collection} title={g.title}>
                    {g.sections.map((s) => (
                        <FoundationSubsection key={s.id} title={s.title}>
                            <DocsTable>
                                <thead>
                                    <tr>
                                        <th scope="col">Token</th>
                                        <th scope="col">Description</th>
                                        <th scope="col">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {s.rows.map((r) => <Row key={r.name} row={r} onCopy={onCopy} />)}
                                </tbody>
                            </DocsTable>
                        </FoundationSubsection>
                    ))}
                </FoundationSection>
            ))}
        </div>
    );
};
