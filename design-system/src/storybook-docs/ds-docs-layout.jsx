import React from 'react';
import { Canvas, Controls } from '@storybook/addon-docs/blocks';

/**
 * Shared Storybook docs layout primitives (PLUS DS).
 * Use with Component.mdx + `.sb-ds-component-docs` / `.sb-ds-doc-section` wrappers.
 */

/** Overview / hero canvases: inline story + source panel visible. */
export function DsCanvasHero({ of: ofStory, layout, ...rest }) {
    return (
        <Canvas
            of={ofStory}
            story={{ inline: true }}
            layout={layout}
            sourceState="hidden"
            {...rest}
        />
    );
}

/** Secondary sections: preview only (no source). */
export function DsCanvasQuiet({ of: ofStory, layout, ...rest }) {
    return (
        <Canvas
            of={ofStory}
            story={{ inline: true }}
            layout={layout}
            sourceState="none"
            {...rest}
        />
    );
}

/** A card link for the top of the MDX page */
export function ResourcesCard({ href, icon, title, description }) {
    const isExternalLink = typeof href === 'string' && /^https?:\/\//.test(href);
    return (
        <a 
            href={href || '#'} 
            target={isExternalLink ? "_blank" : undefined}
            rel={isExternalLink ? "noreferrer noopener" : undefined}
            className="group block p-4 border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md no-underline transition-all relative text-left"
            style={{
                width: '200px',
                textDecoration: 'none',
                borderRadius: 'var(--size-card-radius-sm)',
            }}
        >
            <i className="fa-solid fa-arrow-up-right-from-square absolute top-4 right-4 text-on-surface-variant opacity-50 text-sm group-hover:text-primary transition-colors"></i>
            <div className="mb-3 flex justify-start ml-[-2px]">
                {icon}
            </div>
            <strong className="text-[15px] leading-tight text-on-surface font-semibold m-0 p-0 block">{title}</strong>
        </a>
    );
}

/**
 * Build a Figma node URL from a file key + node id (e.g. "33:2470" → node-id=33-2470).
 * Falls back to a provided explicit url when available.
 */
function figmaNodeUrl({ url, fileKey, componentSetNodeId, nodeId }) {
    if (url) return url;
    const node = componentSetNodeId || nodeId;
    if (!fileKey || !node) return null;
    return `https://www.figma.com/design/${fileKey}/?node-id=${String(node).replace(':', '-')}`;
}

/**
 * Pick the rows worth showing in the Figma nodes table.
 * Drops the generic "storybook-resources" docs-page entry when real component
 * sets (variants/styles) exist; otherwise keeps the single available entry.
 */
function figmaVariantRows(sets) {
    if (!Array.isArray(sets) || sets.length === 0) return [];
    const variants = sets.filter((set) => set && set.id !== 'storybook-resources');
    return variants.length ? variants : sets;
}

/**
 * Maps each Figma component set (style/variant) of a component to its node id + link.
 * Sourced from the component MDX `figmaMeta.sets`.
 */
export function FigmaNodesTable({ sets, fileKey }) {
    const rows = figmaVariantRows(sets);
    if (rows.length === 0) return null;

    // One palette for every line, taken from what the Resources cards beside
    // this table actually render (1px #dee2e6). NOT --color-border: in the docs
    // iframe that resolves to a different zinc. Storybook injects its own
    // borders on ALL FOUR sides of th/td (its text colour at 15%); under the
    // border-collapse those merged away, but this table is border-separate
    // (see below), where they stack — doubled inner lines, and a thickened
    // top/left frame edge. Inline 'none' on every side Storybook draws zeroes
    // them; the row line and the two column dividers are added back explicitly.
    const lineColor = 'var(--bs-border-color, #dee2e6)';
    const cellStyle = {
        padding: '8px 12px',
        borderTop: 'none',
        borderBottom: `1px solid ${lineColor}`,
        borderLeft: 'none',
        borderRight: 'none',
        textAlign: 'left',
        verticalAlign: 'top',
        fontSize: '13px',
        lineHeight: 1.4,
    };
    const headStyle = { ...cellStyle, fontWeight: 600, whiteSpace: 'nowrap' };
    const dividerRight = { borderRight: `1px solid ${lineColor}` };

    return (
        <div className="sb-ds-figma-nodes not-prose" style={{ marginTop: '24px' }}>
            <div
                style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--color-on-surface-variant)',
                    margin: '0 0 8px',
                }}
            >
                Figma nodes
            </div>
            <div
                className="overflow-hidden border border-border bg-surface"
                style={{
                    borderRadius: 'var(--size-card-radius-sm)',
                    // The Resources cards' shadow, so the two read as one family.
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
            >
                <table
                    className="text-on-surface"
                    style={{
                        margin: 0,
                        width: '100%',
                        fontSize: '13px',
                        // separate: collapsed cell borders paint across the
                        // wrapper's rounded corners — the "cut corner" artifact.
                        borderCollapse: 'separate',
                        borderSpacing: 0,
                    }}
                >
                    <thead>
                        <tr className="bg-muted/40">
                            <th style={{ ...headStyle, ...dividerRight }}>Style / variant</th>
                            <th style={{ ...headStyle, ...dividerRight }}>Node ID</th>
                            <th style={headStyle}>Figma link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((set, index) => {
                            const nodeId = set.componentSetNodeId || set.nodeId || '—';
                            const href = figmaNodeUrl({
                                url: set.url,
                                fileKey: set.fileKey || fileKey,
                                componentSetNodeId: set.componentSetNodeId,
                                nodeId: set.nodeId,
                            });
                            const isLast = index === rows.length - 1;
                            const rowCell = isLast ? { ...cellStyle, borderBottom: 'none' } : cellStyle;
                            return (
                                <tr key={set.id || nodeId || index}>
                                    <td style={{ ...rowCell, ...dividerRight }} className="font-medium text-on-surface">
                                        {set.name || set.id || '—'}
                                    </td>
                                    <td style={{ ...rowCell, ...dividerRight, whiteSpace: 'nowrap' }}>
                                        <code style={{ fontSize: '12px' }} className="text-on-surface-variant">{nodeId}</code>
                                    </td>
                                    <td style={{ ...rowCell, whiteSpace: 'nowrap' }}>
                                        {href ? (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="text-primary no-underline hover:underline"
                                                style={{ color: 'var(--color-primary)' }}
                                            >
                                                Open in Figma{' '}
                                                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                                            </a>
                                        ) : (
                                            <span className="text-on-surface-variant">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Catalog / states table for MDX inside `.not-prose` wrappers.
 * Prefer this over Markdown pipe tables — those do not style under `not-prose` and look malformed.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - `<thead>` + `<tbody>`
 * @param {string} [props.className]
 */
export function DocsTable({ children, className = '' }) {
    const wrapClass = ['sb-ds-doc-table-wrap', className].filter(Boolean).join(' ');
    return (
        <div className={wrapClass}>
            <table className="sb-ds-doc-table">{children}</table>
        </div>
    );
}

/**
 * Design + repo links above the docs body.
 * Figma: specs and tokens. GitHub: full source tree, history, and PR context — unlike the Overview code snippet,
 * which is usually a curated web-app/JSP-style excerpt, not the whole React implementation.
 *
 * When `sets` is provided (a component's `figmaMeta.sets`), a table mapping each
 * style/variant to its Figma node id + link is rendered below the resource cards.
 */
export function ResourcesBlock({ figmaLink, githubLink, sets, figmaFileKey }) {
    if (!figmaLink && !githubLink && (!sets || sets.length === 0)) return null;
    return (
        <div style={{ marginTop: '48px', marginBottom: '40px' }}>
            <h3 className="h3 mb-4 mt-0">Resources</h3>
            <div className="sb-ds-resources-block flex flex-wrap gap-5">
                {figmaLink && (
                    <ResourcesCard 
                        href={figmaLink}
                        icon={<i className="fa-brands fa-figma text-3xl" style={{ color: 'var(--color-primary)' }}></i>}
                        title="Figma"
                    />
                )}
                {githubLink && (
                    <ResourcesCard 
                        href={githubLink}
                        icon={<i className="fa-brands fa-github text-3xl" style={{ color: 'var(--color-primary)' }}></i>}
                        title="GitHub"
                    />
                )}
            </div>
            <FigmaNodesTable sets={sets} fileKey={figmaFileKey} />
        </div>
    );
}

/** Filled + bordered padded inner well (surface-container-lowest, the lowest layer) —
 *  shared by DocsDemoBlock and DocsCanvasShell so every display block is distinguishable. */
export function DocsPreviewCard({ children, innerClassName = '' }) {
    return (
        <div
            className="sb-ds-docs-preview-well overflow-visible"
            style={{
                borderRadius: 'var(--size-card-radius-sm)',
                backgroundColor: 'var(--color-surface-container-lowest)',
                border: '1px solid var(--color-outline-variant)',
            }}
        >
            <div
                className={['min-h-[100px] p-10 md:p-12 lg:p-14', innerClassName].filter(Boolean).join(' ')}
            >
                {children}
            </div>
        </div>
    );
}

/**
 * Bordered preview well. Inner layout is left to children.
 *
 * @param {'card' | 'none'} [chrome='card'] — `none` skips the muted bordered box.
 */
export function DocsDemoBlock({ description, children, previewClassName = '', chrome = 'card' }) {
    return (
        <div className="sb-docs-demo not-prose space-y-6 md:space-y-8">
            {description ? (
                <p className="sb-ds-canvas-description">{description}</p>
            ) : null}
            {chrome === 'none' ? (
                <div className={previewClassName}>{children}</div>
            ) : (
                <DocsPreviewCard innerClassName={previewClassName}>{children}</DocsPreviewCard>
            )}
        </div>
    );
}

/**
 * Wrap Storybook Canvas in the same preview chrome + spacing as DocsDemoBlock.
 *
 * @param {boolean} [attachSourceBelow=true] — Preview is a rounded card; “Show code” /
 *   “Copy code” and the source block sit below it (attached), not overlaid on the preview.
 */
export function DocsCanvasShell({ description, children, attachSourceBelow = true }) {
    const shellClass = [
        'sb-docs-demo',
        'not-prose',
        'space-y-6',
        'md:space-y-8',
        attachSourceBelow && 'sb-ds-docs-canvas-shell--source-attached'
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={shellClass}>
            {description ? (
                <p className="sb-ds-canvas-description">{description}</p>
            ) : null}
            {attachSourceBelow ? (
                <div className="sb-ds-docs-canvas-attached-root">{children}</div>
            ) : (
                <DocsPreviewCard>{children}</DocsPreviewCard>
            )}
        </div>
    );
}

/**
 * Single card: inline Canvas + Controls so the playground reads as one panel.
 */
export function DocsInteractivePlayground({ description, of: ofStory }) {
    // The canvas region must hold the component's TALLEST state (an open menu,
    // an expanded panel) without scrolling or cropping it. Storybook's own
    // .docs-story / .sbdocs-preview stop clipping inside this panel (see
    // storybook-overrides.css), so an open overlay lands in the canvas's
    // scrollable overflow; this ratchets min-height up to the largest extent
    // seen, so the overlay gets real room instead of covering the controls.
    const canvasRef = React.useRef(null);
    const [canvasMinHeight, setCanvasMinHeight] = React.useState(null);
    React.useEffect(() => {
        const el = canvasRef.current;
        if (!el || typeof MutationObserver === 'undefined') return undefined;
        // scrollHeight misses overflow from absolutely-positioned descendants
        // whose containing block sits deeper in the story, so measure the union
        // of descendant rects instead. 12px keeps the tallest state off the
        // controls divider.
        const measure = () => {
            const base = el.getBoundingClientRect();
            let maxBottom = base.bottom;
            for (const child of el.querySelectorAll('*')) {
                const r = child.getBoundingClientRect();
                if (r.height > 0 && r.bottom > maxBottom) maxBottom = r.bottom;
            }
            if (maxBottom <= base.bottom) return;
            const needed = Math.ceil(el.clientHeight + (maxBottom - base.bottom)) + 12;
            setCanvasMinHeight((prev) => (prev == null || needed > prev ? needed : prev));
        };
        let raf = 0;
        const schedule = () => {
            if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
            raf = requestAnimationFrame(measure);
        };
        schedule();
        const observer = new MutationObserver(schedule);
        observer.observe(el, { subtree: true, attributes: true, childList: true });
        return () => {
            observer.disconnect();
            if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
        };
    }, []);
    return (
        <div className="sb-docs-demo not-prose space-y-6 md:space-y-8">
            {description ? (
                <p className="sb-ds-canvas-description">{description}</p>
            ) : null}
            <div
                className="sb-ds-docs-preview-well sb-ds-docs-interactive-panel overflow-visible"
                style={{
                    borderRadius: 'var(--size-card-radius-sm)',
                    backgroundColor: 'var(--color-surface-container-lowest)',
                    border: '1px solid var(--color-outline-variant)',
                }}
            >
                <div
                    ref={canvasRef}
                    className="min-h-[100px] p-10 md:p-12 lg:p-14"
                    style={canvasMinHeight != null ? { minHeight: `${canvasMinHeight}px` } : undefined}
                >
                    <Canvas
                        of={ofStory}
                        story={{ inline: true }}
                        layout="fullscreen"
                        sourceState="none"
                    />
                </div>
                <div
                    className="sb-ds-docs-interactive-panel__controls border-t px-10 pb-8 pt-6 md:px-12 md:pb-10 md:pt-7 lg:px-14"
                    style={{
                        borderColor: 'var(--color-outline-variant)',
                        backgroundColor: 'var(--color-surface-container-lowest)',
                        // The panel is overflow-visible (Controls popovers), so this
                        // last child's own background must follow the panel's curve
                        // or it squares off the bottom corners.
                        borderBottomLeftRadius: 'calc(var(--size-card-radius-sm) - 1px)',
                        borderBottomRightRadius: 'calc(var(--size-card-radius-sm) - 1px)',
                    }}
                >
                    <Controls of={ofStory} />
                </div>
            </div>
        </div>
    );
}
