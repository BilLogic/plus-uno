import React from 'react';
import { ArgTypes, Canvas, Controls, Source, Stories } from '@storybook/addon-docs/blocks';

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

/**
 * A component's props table, generated from its story meta (`argTypes` and the
 * component's own doc comments), so it cannot drift from the code the way a
 * hand-written table does. Use under a `## Properties` heading in place of a
 * `DocsTable`; descriptions, defaults and the allowed values belong in the
 * story's `argTypes`.
 *
 * @param {unknown} props.of - the story meta, as `<DocsProperties of={ButtonStories} />`
 * @param {string[]} [props.include] - props to show, in order
 * @param {string[]} [props.exclude] - props to hide
 */
export function DocsProperties({ of: ofMeta, include, exclude }) {
    return (
        <div className="sb-ds-docs-props not-prose">
            <ArgTypes of={ofMeta} include={include} exclude={exclude} />
        </div>
    );
}

/**
 * The source of one story, shown as code. Replaces a hand-copied snippet: it is
 * read from the story, so it is the code that renders above it.
 *
 * @param {unknown} [props.of] - a story export, as `<DocsSource of={ButtonStories.Icons} />`
 * @param {string} [props.code] - literal code, for a snippet that is not a story
 * @param {string} [props.language='jsx']
 */
export function DocsSource({ of: ofStory, code, language = 'jsx' }) {
    return (
        <div className="sb-ds-docs-source not-prose">
            <Source of={ofStory} code={code} language={language} dark={false} />
        </div>
    );
}

/**
 * Every story of a component as a canvas with its own heading and source: the
 * way to list variants without writing a `Canvas` per story.
 *
 * @param {boolean} [props.includePrimary=true]
 * @param {string} [props.title] - heading; omit to render none
 */
export function DocsStories({ title, includePrimary = true }) {
    return (
        <div className="sb-ds-docs-stories not-prose">
            <Stories title={title} includePrimary={includePrimary} />
        </div>
    );
}

/** A card link for the top of the MDX page */
export function ResourcesCard({ href, icon, title }) {
    const isExternalLink = typeof href === 'string' && /^https?:\/\//.test(href);
    return (
        <a
            href={href || '#'}
            target={isExternalLink ? '_blank' : undefined}
            rel={isExternalLink ? 'noreferrer noopener' : undefined}
            className="sb-ds-resource-card"
        >
            <i className="fa-solid fa-arrow-up-right-from-square sb-ds-resource-card__external" aria-hidden="true" />
            <span className="sb-ds-resource-card__icon">{icon}</span>
            <strong className="sb-ds-resource-card__title">{title}</strong>
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

    return (
        <div className="sb-ds-figma-nodes not-prose">
            <div className="sb-ds-figma-nodes__label">Figma nodes</div>
            <DocsTable>
                <thead>
                    <tr>
                        <th>Style / variant</th>
                        <th>Node ID</th>
                        <th>Figma link</th>
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
                        return (
                            <tr key={set.id || nodeId || index}>
                                <td>{set.name || set.id || '—'}</td>
                                <td><code>{nodeId}</code></td>
                                <td>
                                    {href ? (
                                        <a href={href} target="_blank" rel="noreferrer noopener">
                                            Open in Figma{' '}
                                            <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                                        </a>
                                    ) : '—'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </DocsTable>
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
        <div className="sb-ds-resources sb-docs-section">
            <h2>Resources</h2>
            <div className="sb-ds-resources-block">
                {figmaLink && (
                    <ResourcesCard 
                        href={figmaLink}
                        icon={<i className="fa-brands fa-figma" aria-hidden="true" />}
                        title="Figma"
                    />
                )}
                {githubLink && (
                    <ResourcesCard 
                        href={githubLink}
                        icon={<i className="fa-brands fa-github" aria-hidden="true" />}
                        title="GitHub"
                    />
                )}
            </div>
            <FigmaNodesTable sets={sets} fileKey={figmaFileKey} />
        </div>
    );
}

/** Filled + bordered padded inner well (`--ds-surface-container`) —
 *  shared by DocsDemoBlock and DocsCanvasShell so every display block is distinguishable. */
export function DocsPreviewCard({ children, innerClassName = '' }) {
    return (
        <div
            className="sb-ds-docs-preview-well overflow-visible"
            style={{
                borderRadius: 'var(--card-radius-sm)',
                backgroundColor: 'var(--ds-surface-container)',
                border: 'var(--border-default) solid var(--ds-border)',
            }}
        >
            <div
                className={['sb-ds-docs-preview-well__inner', innerClassName].filter(Boolean).join(' ')}
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
        <div className="sb-docs-demo not-prose">
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
 * One example of the Examples tab: one story, one appearance, state or size,
 * under an h3 and a one-line description (a fragment, so the heading stays a direct child of the section). The template for every
 * component page is Examples (these), Code (generated) and Usage.
 *
 * @param {unknown} props.of - the story export, as `<ComponentExample of={ButtonStories.Primary} />`
 * @param {string} props.title - the appearance, state or size the story shows
 * @param {React.ReactNode} [props.description] - when it applies, in one sentence
 */
export function ComponentExample({ of: ofStory, title, description }) {
    return (
        <>
            <h3>{title}</h3>
            <DocsCanvasShell description={description}>
                <Canvas of={ofStory} story={{ inline: true }} layout="padded" sourceState="hidden" />
            </DocsCanvasShell>
        </>
    );
}

/**
 * The breathing room between the canvas's tallest state and the Controls
 * divider. A design value, so it names a Token rather than a number:
 * `--stack-lg` is the design system's 12px element gap.
 */
const CANVAS_OVERLAY_GAP = 'var(--stack-lg)';

/**
 * One do or don't card: a live example above a one-line caption.
 * Compose with `DoDontPair`, or pass several pairs to `DoDontGrid`.
 *
 * @param {'do' | 'dont'} tone
 * @param {React.ReactNode} children - the live example, built from real components
 * @param {React.ReactNode} caption - the rule, in one sentence
 */
export function DoDontCard({ tone, children, caption }) {
    const isDo = tone === 'do';
    return (
        <figure
            className="sb-ds-dodont-card"
            style={{
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 'var(--card-radius)',
                backgroundColor: 'var(--ds-surface-raised)',
                boxShadow: 'var(--ds-shadow-raised)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--inline-md)',
                    padding: 'var(--pad-y-md) var(--pad-x-lg)',
                    backgroundColor: isDo ? 'var(--ds-background-success-subtler)' : 'var(--ds-background-danger-subtler)',
                    color: 'var(--ds-text)',
                    font: 'var(--heading-xsmall)',
                }}
            >
                <i
                    className={`fa-solid ${isDo ? 'fa-circle-check' : 'fa-circle-xmark'}`}
                    style={{ color: isDo ? 'var(--ds-icon-success)' : 'var(--ds-icon-danger)' }}
                    aria-hidden="true"
                />
                <span>{isDo ? 'Do' : "Don't"}</span>
            </div>
            <div
                style={{
                    flex: 1,
                    padding: 'var(--section-stack-lg) var(--pad-x-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--ds-surface)',
                }}
            >
                <div style={{ width: '100%' }}>{children}</div>
            </div>
            <figcaption style={{ padding: 'var(--stack-lg) var(--pad-x-lg)', font: 'var(--body-default)', color: 'var(--ds-text)' }}>{caption}</figcaption>
        </figure>
    );
}

/** A matched do and don't, side by side. */
export function DoDontPair({ doExample, doCaption, dontExample, dontCaption }) {
    return (
        <div
            className="sb-ds-dodont-pair"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--section-stack-md)', alignItems: 'stretch' }}
        >
            <DoDontCard tone="do" caption={doCaption}>{doExample}</DoDontCard>
            <DoDontCard tone="dont" caption={dontCaption}>{dontExample}</DoDontCard>
        </div>
    );
}

/** Several pairs, one under another, a Section group apart. `pairs` is an array of `DoDontPair` props. */
export function DoDontGrid({ pairs }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-lg)' }}>
            {pairs.map((pair, i) => (
                <DoDontPair key={i} {...pair} />
            ))}
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
    // storybook-overrides.css), so an open overlay would otherwise paint over
    // the Controls row; this sizes the canvas to whatever the current state
    // needs.
    //
    // WHY IT MEASURES THE NATURAL HEIGHT EVERY PASS RATHER THAN RATCHETING UP.
    // A one-way ratchet (`needed > prev`) shipped first and had two faults. It
    // never released: one transiently-open menu inflated the canvas for the rest
    // of the page's life, with no reset when the story or its args changed. And
    // `needed` is derived from the element's own height, so re-measuring while
    // the write was still applied compounded the pad every pass. Clearing the
    // inline min-height, measuring, and restoring it inside the same animation
    // frame reads the height the content actually wants right now: it grows when
    // the menu opens, releases when it closes, and cannot compound, because no
    // pass ever measures a previous pass's output. Nothing paints between the
    // clear and the restore, so there is no flicker.
    const canvasRef = React.useRef(null);
    const [canvasMinHeight, setCanvasMinHeight] = React.useState(null);
    React.useEffect(() => {
        const el = canvasRef.current;
        if (!el || typeof MutationObserver === 'undefined') return undefined;
        // scrollHeight misses overflow from absolutely-positioned descendants
        // whose containing block sits deeper in the story, so measure the union
        // of descendant rects instead.
        const measure = () => {
            const applied = el.style.minHeight;
            el.style.minHeight = '';
            let needed = null;
            try {
                const base = el.getBoundingClientRect();
                let maxBottom = base.bottom;
                for (const child of el.querySelectorAll('*')) {
                    const r = child.getBoundingClientRect();
                    if (r.height > 0 && r.bottom > maxBottom) maxBottom = r.bottom;
                }
                if (maxBottom > base.bottom) {
                    needed = Math.ceil(el.clientHeight + (maxBottom - base.bottom));
                }
            } finally {
                // React owns this property, but it only rewrites it on a re-render
                // and the state may not have changed — so put it back by hand.
                el.style.minHeight = applied;
            }
            setCanvasMinHeight((prev) => (prev === needed ? prev : needed));
        };
        let raf = 0;
        const schedule = () => {
            if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
            raf = requestAnimationFrame(measure);
        };
        schedule();
        // Our own min-height write lands as an `attributes` record on `el`. Left
        // unfiltered it re-entered `measure`, which is the loop the comment above
        // describes; every other mutation in the subtree is real news.
        const observer = new MutationObserver((records) => {
            const ours = (record) =>
                record.type === 'attributes' && record.target === el && record.attributeName === 'style';
            if (records.every(ours)) return;
            schedule();
        });
        observer.observe(el, { subtree: true, attributes: true, childList: true });
        return () => {
            observer.disconnect();
            if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
        };
    }, [ofStory]);
    return (
        <div className="sb-docs-demo not-prose">
            {description ? (
                <p className="sb-ds-canvas-description">{description}</p>
            ) : null}
            <div
                className="sb-ds-docs-preview-well sb-ds-docs-interactive-panel overflow-visible"
                style={{
                    borderRadius: 'var(--card-radius-sm)',
                    backgroundColor: 'var(--ds-surface-container)',
                    border: 'var(--border-default) solid var(--ds-border)',
                }}
            >
                <div
                    ref={canvasRef}
                    className="sb-ds-docs-preview-well__inner"
                    style={
                        canvasMinHeight != null
                            ? { minHeight: `calc(${canvasMinHeight}px + ${CANVAS_OVERLAY_GAP})` }
                            : undefined
                    }
                >
                    <Canvas
                        of={ofStory}
                        story={{ inline: true }}
                        layout="fullscreen"
                        sourceState="none"
                    />
                </div>
                <div
                    className="sb-ds-docs-interactive-panel__controls"
                    style={{
                        padding: 'var(--page-stack-md) var(--page-stack-lg)',
                        // Canvas and controls are two groups in one well; the line separates them.
                        borderTop: 'var(--border-default) solid var(--ds-border)',
                        backgroundColor: 'var(--ds-surface-container)',
                        // The panel is overflow-visible (Controls popovers), so this
                        // last child's own background must follow the panel's curve
                        // or it squares off the bottom corners.
                        borderBottomLeftRadius: 'calc(var(--card-radius-sm) - var(--border-default))',
                        borderBottomRightRadius: 'calc(var(--card-radius-sm) - var(--border-default))',
                    }}
                >
                    <Controls of={ofStory} />
                </div>
            </div>
        </div>
    );
}
