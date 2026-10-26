import React, { useEffect, useState } from 'react';
import { DocsTable } from '@/storybook-docs/ds-docs-layout.jsx';

/**
 * Building blocks for the Foundations docs pages: token tables whose values are
 * read from the page, Do and Don't pairs, and a light and dark comparison.
 *
 * Every block styles itself with `--ds-*` and pattern tokens, so a page built
 * from them follows the toolbar's Color mode and Contrast switches.
 */

const MODE_ATTRIBUTES = ['data-color-mode', 'data-contrast-mode'];

/** Reads a custom property as the page resolves it now. */
const readVar = (name) => {
    if (typeof document === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

/**
 * The resolved value of each named token, read again whenever <html> changes
 * color or contrast mode, so a table never restates a value by hand.
 */
export const useTokenValues = (names) => {
    const key = names.join('|');
    const read = () => Object.fromEntries(names.map((n) => [n, readVar(n)]));
    const [values, setValues] = useState(read);
    useEffect(() => {
        const refresh = () => setValues(read());
        refresh();
        const observer = new MutationObserver(refresh);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: MODE_ATTRIBUTES });
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return values;
};

/** `16px` reads as `16`; anything else is shown as the page resolves it. */
const plain = (value) => (/^-?\d+(\.\d+)?px$/.test(value) ? value.replace(/px$/, '') : value);

const codeStyle = { font: 'var(--code)', color: 'var(--ds-text)', wordBreak: 'break-word' };

/** Inline code for JSX prose: `<C>--card-pad-md</C>`. */
export const C = ({ children }) => <code style={codeStyle}>{children}</code>;

/**
 * A reference table of tokens. Each row names the code token, and optionally
 * its Figma variable, a fixed value (for values that change with the screen),
 * and what it is for. A row with no `value` shows the value the page resolves.
 *
 * @param {{ token: string, figma?: string, value?: React.ReactNode, use?: React.ReactNode }[]} rows
 * @param {boolean} [swatch] draw a swatch of each token's color
 * @param {string} [valueHeader]
 * @param {boolean} [showFigma] show the Figma column when rows name one
 */
export const TokenTable = ({ rows, swatch = false, valueHeader = 'Value', showFigma = true }) => {
    const values = useTokenValues(rows.filter((r) => r.value === undefined).map((r) => r.token));
    const hasUse = rows.some((r) => r.use);
    const hasFigma = showFigma && rows.some((r) => r.figma);
    return (
        <DocsTable>
            <thead>
                <tr>
                    <th scope="col">Token</th>
                    {hasFigma && <th scope="col">Figma</th>}
                    <th scope="col">{valueHeader}</th>
                    {hasUse && <th scope="col">Use</th>}
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => (
                    <tr key={r.token}>
                        <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--element-inline-md)' }}>
                                {swatch && (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            width: 'var(--icon-lg)',
                                            height: 'var(--icon-lg)',
                                            flexShrink: 0,
                                            borderRadius: 'var(--element-radius-md)',
                                            background: `var(${r.token})`,
                                            boxShadow: 'inset 0 0 0 var(--border-default) var(--ds-border)',
                                        }}
                                    />
                                )}
                                <C>{r.token}</C>
                            </span>
                        </td>
                        {hasFigma && <td>{r.figma ? <C>{r.figma}</C> : '—'}</td>}
                        <td><C>{r.value !== undefined ? r.value : plain(values[r.token]) || '—'}</C></td>
                        {hasUse && <td>{r.use}</td>}
                    </tr>
                ))}
            </tbody>
        </DocsTable>
    );
};

/** A plain comparison table: `head` is the header row, `rows` the body. */
export const RefTable = ({ head, rows }) => (
    <DocsTable>
        <thead>
            <tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
        </thead>
        <tbody>
            {rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
            ))}
        </tbody>
    </DocsTable>
);

const pairCard = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    borderRadius: 'var(--card-radius)',
    background: 'var(--ds-surface-raised)',
    boxShadow: 'var(--ds-shadow-raised)',
    overflow: 'hidden',
};

const Verdict = ({ tone, caption, children }) => {
    const isDo = tone === 'do';
    return (
        <figure style={{ ...pairCard, margin: 0 }} data-verdict={tone}>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--card-pad-lg)',
                    background: 'var(--ds-surface-sunken)',
                    color: 'var(--ds-text)',
                    font: 'var(--body-default)',
                }}
            >
                <div style={{ width: '100%' }}>{children}</div>
            </div>
            <figcaption
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--card-stack-sm)',
                    padding: 'var(--card-pad-sm)',
                    font: 'var(--body-default)',
                    color: 'var(--ds-text)',
                }}
            >
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--element-inline-md)',
                        font: 'var(--heading-xsmall)',
                        color: isDo ? 'var(--ds-text-success)' : 'var(--ds-text-danger)',
                    }}
                >
                    <i
                        className={`fa-solid ${isDo ? 'fa-circle-check' : 'fa-circle-xmark'}`}
                        aria-hidden="true"
                        style={{ fontSize: 'var(--icon-md)', color: isDo ? 'var(--ds-icon-success)' : 'var(--ds-icon-danger)' }}
                    />
                    {isDo ? 'Do' : 'Don’t'}
                </span>
                <span>{caption}</span>
            </figcaption>
        </figure>
    );
};

/** The Do half of a pair: a live example over its caption. */
export const Do = ({ caption, children }) => <Verdict tone="do" caption={caption}>{children}</Verdict>;

/** The Don't half of a pair. */
export const Dont = ({ caption, children }) => <Verdict tone="dont" caption={caption}>{children}</Verdict>;

/** A Do and its Don't side by side, on the same topic. */
export const DoDont = ({ children }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-md), 1fr))',
            gap: 'var(--layout-gutter)',
            alignItems: 'stretch',
        }}
    >
        {children}
    </div>
);

/** The page's contrast mode, followed as the toolbar changes it. */
const usePageContrast = () => {
    const read = () => (typeof document === 'undefined'
        ? null
        : document.documentElement.getAttribute('data-contrast-mode'));
    const [contrast, setContrast] = useState(read);
    useEffect(() => {
        const observer = new MutationObserver(() => setContrast(read()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-contrast-mode'] });
        return () => observer.disconnect();
    }, []);
    return contrast;
};

const MODES = [
    { id: 'both', label: 'Light and dark' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
];

/**
 * Draws its children in light and dark at once, or in one of them, whatever
 * the toolbar is set to. Each pane sets `data-color-mode` on itself, and the
 * generated tokens key off that attribute on any element, so the pane reads
 * its own mode's values. The page's contrast setting carries into both panes.
 */
export const ModeCompare = ({ children, initial = 'both' }) => {
    const [mode, setMode] = useState(initial);
    const contrast = usePageContrast();
    const panes = mode === 'both' ? ['light', 'dark'] : [mode];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-sm)' }}>
            <div role="group" aria-label="Color mode for these examples" style={{ display: 'inline-flex', gap: 'var(--element-inline-sm)' }}>
                {MODES.map((m) => (
                    <button
                        key={m.id}
                        type="button"
                        aria-pressed={mode === m.id}
                        onClick={() => setMode(m.id)}
                        style={{
                            height: 'var(--item-height-md)',
                            padding: '0 var(--element-pad-x-md)',
                            borderRadius: 'var(--element-radius-item-md)',
                            border: 'var(--border-default) solid var(--ds-border)',
                            background: mode === m.id ? 'var(--ds-background-selected)' : 'var(--ds-background-neutral-subtle)',
                            color: mode === m.id ? 'var(--ds-text-selected)' : 'var(--ds-text-subtle)',
                            font: 'var(--body-default)',
                            fontWeight: 'var(--type-weight-medium)',
                            cursor: 'pointer',
                        }}
                    >
                        {m.label}
                    </button>
                ))}
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${panes.length}, minmax(0, 1fr))`,
                    gap: 'var(--layout-gutter)',
                }}
            >
                {panes.map((p) => (
                    <div
                        key={p}
                        data-color-mode={p}
                        data-bs-theme={p}
                        {...(contrast ? { 'data-contrast-mode': contrast } : {})}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--section-stack-sm)',
                            padding: 'var(--card-pad-lg)',
                            borderRadius: 'var(--card-radius)',
                            background: 'var(--ds-surface-sunken)',
                            color: 'var(--ds-text)',
                            font: 'var(--body-default)',
                        }}
                    >
                        <span style={{ font: 'var(--heading-xxsmall)', color: 'var(--ds-text-subtle)' }}>
                            {p === 'light' ? 'Light' : 'Dark'}
                        </span>
                        {typeof children === 'function' ? children(p) : children}
                    </div>
                ))}
            </div>
        </div>
    );
};
