import React, { useEffect, useRef, useState } from 'react';
import { ArgTypes, Canvas, Controls, Source, Stories, useOf } from '@storybook/addon-docs/blocks';
import { typeStyle } from './lib/type-style.js';

/**
 * Shared Storybook docs layout primitives (PLUS DS).
 * Use with Component.mdx + `.sb-ds-component-docs` / `.sb-ds-doc-section` wrappers.
 */

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
 * Every prop the component declares, read from its propTypes by the docgen
 * and not from the story's `argTypes`, so a prop a story hides from Controls
 * (a callback, an escape hatch, a label string) still shows up here. A prop
 * tagged `@ignore` in its doc comment stays out. Folded under the playground
 * by `DocsInteractivePlayground`; a page needs no markup of its own.
 *
 * @param {unknown} props.of - a story export or the story meta
 */
export function DocsAllProps({ of: ofStory }) {
    const resolved = useOf(ofStory);
    const component = resolved.type === 'story' ? resolved.story.component : resolved.preparedMeta?.component;
    if (!component) return null;
    return (
        <details className="sb-ds-docs-all-props not-prose">
            <summary>All props</summary>
            <ArgTypes of={component} />
        </details>
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
            {/* Source throws when `of` is present but undefined, so pass only the one given. */}
            <Source {...(ofStory === undefined ? {} : { of: ofStory })} {...(code === undefined ? {} : { code })} language={language} dark={false} />
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
 * Catalog / states table for MDX inside `.not-prose` wrappers.
 * Prefer this over Markdown pipe tables — those do not style under `not-prose` and look malformed.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - `<thead>` + `<tbody>`
 * @param {string} [props.className]
 */
export function DocsTable({ children, className = '' }) {
    const wrapClass = ['sb-ds-doc-table-wrap', 'sb-unstyled', className].filter(Boolean).join(' ');
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
 */
export function ResourcesBlock({ figmaLink, githubLink }) {
    if (!figmaLink && !githubLink) return null;
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
        </div>
    );
}

/** Filled + bordered padded inner well (`--ds-surface-sunken`) —
 *  shared by DocsDemoBlock and DocsCanvasShell so every display block is distinguishable. */
export function DocsPreviewCard({ children, innerClassName = '' }) {
    return (
        <div
            className="sb-ds-docs-preview-well"
            style={{
                overflow: 'visible',
                borderRadius: 'var(--card-radius)',
                backgroundColor: 'var(--ds-surface-sunken)',
                border: 'var(--border-width-default) solid var(--ds-border)',
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

export const exampleSlug = (text) => (typeof text === 'string'
    ? text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || undefined
    : undefined);

/**
 * One example of the Examples tab: one story, one appearance, state or size,
 * under an h3 and a one-line description (a fragment, so the heading stays a direct child of the section). The template for every
 * component page is Examples (these), Code (generated) and Usage.
 *
 * @param {unknown} props.of - the story export, as `<ComponentExample of={ButtonStories.Primary} />`
 * @param {string} [props.title] - the appearance, state or size the story shows; leave it out when
 *   the example is the section's only one and its heading already names it, so the page does not repeat itself
 * @param {React.ReactNode} [props.description] - when it applies, in one sentence
 */
export function ComponentExample({ of: ofStory, title, description }) {
    return (
        <>
            {title ? <h3 id={exampleSlug(title)}>{title}</h3> : null}
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
 * The filled Do or Don't caption block below an example well or a motion demo stage.
 *
 * @param {'do' | 'dont'} tone
 * @param {React.ReactNode} children - the rule, in one sentence
 * @param {React.CSSProperties} [style]
 */
export function DoDontCaption({ tone, children, style }) {
    const isDo = tone === 'do';
    return (
        <figcaption
            className="sb-ds-dodont-caption"
            data-verdict={tone}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--inline-lg)',
                padding: 'var(--card-pad)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isDo
                    ? 'var(--ds-background-success-subtler)'
                    : 'var(--ds-background-danger-subtler)',
                color: 'var(--ds-text)',
                ...typeStyle('body-default'),
                ...style,
            }}
        >
            <span
                className="sb-ds-dodont-caption__icon"
                aria-hidden="true"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'var(--icon-md)',
                    height: 'var(--type-line-height-125)',
                    flexShrink: 0,
                    color: 'var(--ds-text)',
                    fontSize: 'var(--icon-md)',
                }}
            >
                <i className={`fa-solid ${isDo ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
            </span>
            <span
                className="sb-ds-dodont-caption__body"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--stack-md)',
                    minWidth: 0,
                    flex: 1,
                }}
            >
                <strong style={{ ...typeStyle('heading-xs'), color: 'var(--ds-text)' }}>
                    {isDo ? 'Do' : "Don't"}
                </strong>
                <span style={{ ...typeStyle('body-default'), color: 'var(--ds-text)' }}>
                    {children}
                </span>
            </span>
        </figcaption>
    );
}

/**
 * Whether a scroll box's content is wider than the box, and a name for it.
 *
 * Measured again when the box or the example inside changes size (a ResizeObserver
 * on both) and when anything is added or removed under it (a MutationObserver), so
 * a demo that renders late or deep (a chart, a lazily loaded table) is still seen.
 * The box takes focus and a name only while it scrolls sideways: a keyboard user
 * is not given a tab stop that scrolls nothing.
 *
 * @param {React.RefObject<HTMLElement>} ref - the scroll box
 * @param {(box: HTMLElement) => string} getLabel - its name, read from the page
 * @returns {{ scrolls: boolean, label: string }}
 */
export function useScrollsSideways(ref, getLabel) {
    const [state, setState] = useState({ scrolls: false, label: '' });
    useEffect(() => {
        const box = ref.current;
        if (!box || typeof ResizeObserver === 'undefined') return undefined;
        const measure = () => {
            const scrolls = box.scrollWidth > box.clientWidth + 1;
            const label = scrolls ? getLabel(box) : '';
            setState((prev) => (prev.scrolls === scrolls && prev.label === label ? prev : { scrolls, label }));
        };
        measure();
        const resizes = new ResizeObserver(measure);
        resizes.observe(box);
        // The example's own box and its parts: the content that can outgrow the box.
        box.querySelectorAll(':scope > *, :scope > * > *').forEach((node) => resizes.observe(node));
        const mutations = new MutationObserver(() => {
            measure();
            box.querySelectorAll(':scope > *, :scope > * > *').forEach((node) => resizes.observe(node));
        });
        mutations.observe(box, { childList: true, subtree: true });
        return () => {
            resizes.disconnect();
            mutations.disconnect();
        };
    }, [ref, getLabel]);
    return state;
}

/** A well's name: its verdict and its caption, read from the card around it. */
function wellLabel(well) {
    const card = well.closest('.sb-ds-dodont-card');
    const verdict = card?.dataset.verdict === 'do' ? 'Do' : "Don't";
    const caption = card?.querySelector('.sb-ds-dodont-caption__body > span')?.textContent?.trim();
    return caption ? `${verdict} example: ${caption}` : `${verdict} example`;
}

/**
 * One do or don't card: a sunken example well above a filled caption block.
 * Compose with `DoDontPair`, or pass several pairs to `DoDontGrid`.
 *
 * @param {'do' | 'dont'} tone
 * @param {React.ReactNode} children - the live example, built from real components
 * @param {React.ReactNode} caption - the rule, in one sentence
 * @param {string} [code] - the example's source, folded under the caption behind Show code
 * @param {string} [fullSize] - a Storybook link (`?path=/story/...`) to the same live example at 100% in the page view, for a card that draws a whole screen scaled into the column
 */
export function DoDontCard({ tone, children, caption, code, fullSize }) {
    const wellRef = useRef(null);
    const { scrolls, label } = useScrollsSideways(wellRef, wellLabel);
    return (
        <figure
            className="sb-ds-dodont-card"
            data-verdict={tone}
            style={{
                margin: 0,
                // Subgrid rows: both cards in a pair share the well row and the
                // caption row, so wells and captions line up across the pair.
                display: 'grid',
                // One column as wide as the card: an implicit column sizes to
                // its widest content, so opened code would push the card wide.
                gridTemplateColumns: 'minmax(0, 1fr)',
                gridTemplateRows: 'subgrid',
                gridRow: code ? 'span 3' : 'span 2',
                rowGap: 'var(--section-stack-md)',
                minInlineSize: 0,
                boxSizing: 'border-box',
                padding: 'var(--card-pad)',
                borderRadius: 'var(--card-radius)',
                border: 'var(--border-width-default) solid var(--ds-border)',
                backgroundColor: 'var(--ds-surface-raised)',
                boxShadow: 'var(--ds-shadow-raised)',
            }}
        >
            <div
                ref={wellRef}
                className="sb-ds-dodont-card__well"
                // A well that scrolls sideways takes focus, so the keyboard can scroll it.
                data-scrolls={scrolls ? '' : undefined}
                {...(scrolls ? { role: 'region', 'aria-label': label, tabIndex: 0 } : {})}
                style={{
                    flex: 1,
                    minHeight: 'calc(var(--field-min-height-sm) * 2)',
                    padding: 'var(--card-pad)',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--ds-surface-sunken)',
                    color: 'var(--ds-text)',
                    ...typeStyle('body-default'),
                }}
            >
                <div className="sb-ds-dodont-card__example sb-unstyled" style={{ inlineSize: '100%' }}>{children}</div>
            </div>
            {fullSize ? (
                // The caption keeps its own row; the link joins it in the same grid cell so the pair's rows still line up.
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', minInlineSize: 0 }}>
                    <DoDontCaption tone={tone}>{caption}</DoDontCaption>
                    <a className="sb-ds-dodont-card__full-size" href={fullSize} style={{ ...typeStyle('body-default'), color: 'var(--ds-link)', textDecoration: 'underline' }}>
                        Open full size
                    </a>
                </div>
            ) : (
                <DoDontCaption tone={tone}>{caption}</DoDontCaption>
            )}
            {code ? (
                <details className="sb-ds-dodont-card__code">
                    <summary>Show code</summary>
                    <DocsSource code={code} />
                </details>
            ) : null}
        </figure>
    );
}

const FIGURE_GAPS = { none: 0, sm: 'var(--inline-sm)', md: 'var(--inline-md)', lg: 'var(--inline-lg)' };
const FIGURE_STACK_GAPS = { none: 0, sm: 'var(--stack-sm)', md: 'var(--stack-md)', lg: 'var(--stack-lg)' };
const FIGURE_WIDTHS = { narrow: 'var(--field-width-md)', medium: 'var(--field-width-lg)' };

/**
 * Several parts of one Do or Don't figure side by side, wrapping when the card
 * is narrow. The card owns the frame; a page arranges its parts with this, never with `style`.
 *
 * @param {'none' | 'sm' | 'md' | 'lg'} [gap] - `none` draws parts touching, for a figure about spacing
 * @param {'center' | 'start' | 'end' | 'stretch'} [align]
 * @param {'between' | 'end'} [justify]
 * @param {boolean} [isRoomy] - leave room under the row for a character drawing: its limbs reach past the Illustration's own box, which a figure row cannot size, so the row holds the room
 */
export function FigureRow({ gap = 'md', align = 'center', justify, isRoomy, children }) {
    return (
        <div
            className="sb-ds-figure-row"
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: align === 'start' || align === 'end' ? `flex-${align}` : align,
                justifyContent: justify === 'between' ? 'space-between' : justify === 'end' ? 'flex-end' : undefined,
                gap: FIGURE_GAPS[gap],
                paddingBlockEnd: isRoomy ? 'var(--stack-lg)' : undefined,
            }}
        >
            {children}
        </div>
    );
}

/**
 * Several parts of one Do or Don't figure one above the other, full width of the card.
 *
 * @param {'none' | 'sm' | 'md' | 'lg'} [gap]
 * @param {'narrow' | 'medium'} [width] - cap the figure's width, for a field or a card that should not span the well
 * @param {'start' | 'center' | 'stretch'} [align]
 */
export function FigureStack({ gap = 'md', width, align = 'stretch', children }) {
    return (
        <div
            className="sb-ds-figure-stack"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: align === 'start' ? 'flex-start' : align,
                gap: FIGURE_STACK_GAPS[gap],
                inlineSize: '100%',
                maxInlineSize: width ? FIGURE_WIDTHS[width] : undefined,
                marginInline: width ? 'auto' : undefined,
            }}
        >
            {children}
        </div>
    );
}

/**
 * A plain region inside a figure: a bordered box (or a raised card) that holds
 * the part under test, for a figure about what sits in a region.
 *
 * @param {'outline' | 'raised' | 'surface'} [tone] - `outline` is a bare edge, `raised` a card, `surface` a message-like row
 * @param {'row' | 'between' | 'column'} [arrange] - how the parts inside sit
 * @param {boolean} [inset] - sit in from the edge of the parent region
 * @param {boolean} [tall] - a taller box, for a region that fills its container
 * @param {boolean} [clip] - a short box that clips its contents, for a figure about clipping
 */
export function FigureBox({ tone = 'outline', arrange, inset = false, tall = false, clip = false, children }) {
    const padded = tone !== 'outline';
    return (
        <div
            className="sb-ds-figure-box"
            style={{
                boxSizing: 'border-box',
                border: 'var(--border-width-default) solid var(--ds-border)',
                borderRadius: tone === 'raised' ? 'var(--radius-xxl)' : 'var(--radius-md)',
                background: tone === 'raised' ? 'var(--ds-surface-raised)' : tone === 'surface' ? 'var(--ds-surface)' : undefined,
                color: 'var(--ds-text)',
                padding: tone === 'raised' ? 'var(--card-pad)' : padded ? 'var(--pad-y-md) var(--pad-x-md)' : undefined,
                margin: inset ? 'var(--pad-y-lg) var(--pad-x-md)' : undefined,
                height: tall ? 'calc(var(--field-min-height-lg) * 2)' : clip ? 'var(--image-lg)' : undefined,
                overflow: clip ? 'hidden' : undefined,
                display: arrange ? 'flex' : undefined,
                flexDirection: arrange === 'column' ? 'column' : undefined,
                justifyContent: arrange === 'between' ? 'space-between' : undefined,
                alignItems: arrange === 'between' ? 'flex-start' : undefined,
                gap: arrange ? 'var(--inline-md)' : undefined,
            }}
        >
            {children}
        </div>
    );
}

/**
 * A narrow screen for an overlay in a figure, so a Dialog sized for a phone
 * reads at figure width.
 *
 * @param {boolean} [short] - also cap the overlay's height
 */
export function FigureScreen({ short = false, children }) {
    return (
        <div
            className="sb-ds-figure-screen"
            style={{
                '--plus-overlay-screen': 'var(--field-width-xl)',
                '--dialog-max-height': short ? '320px' /* token gap: 320px; docs-literal: a short Dialog's cap, no height role token holds it */ : undefined,
                inlineSize: '100%',
            }}
        >
            {children}
        </div>
    );
}

const FIGURE_GROUNDS = {
    brand: 'var(--ds-background-brand-bold)',
    neutral: 'var(--ds-background-neutral-bold)',
    inverse: 'var(--ds-background-inverse-subtle)',
};

/**
 * A bold ground behind a part drawn for one, such as a spinner or a count on a brand fill.
 * The ground belongs to the figure, so the page never paints it.
 *
 * @param {'brand' | 'neutral' | 'inverse'} ground
 */
export function FigureGround({ ground, children }) {
    return (
        <div
            className="sb-ds-figure-ground"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 'var(--pad-y-lg) var(--pad-x-md)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: FIGURE_GROUNDS[ground],
            }}
        >
            {children}
        </div>
    );
}

/**
 * A matched do and don't, side by side at docs width and one above the other when narrow.
 * `stacked` is the reason a figure needs the full width (a string); it puts the pair one above the other at every width.
 *
 * @param {string} [stacked] - why the figure cannot be halved
 * @param {string} [doFullSize] - `?path=/story/...` link to the do example at 100% in the page view; set it, with `dontFullSize`, on a pair that draws a whole screen scaled into the half-width column
 * @param {string} [dontFullSize] - the same for the don't example
 */
export function DoDontPair({ doExample, doCaption, doCode, doFullSize, dontExample, dontCaption, dontCode, dontFullSize, stacked = '' }) {
    return (
        <div
            className="sb-ds-dodont-pair"
            style={{
                display: 'grid',
                gridTemplateColumns: stacked
                    ? 'minmax(0, 1fr)'
                    : 'repeat(auto-fit, minmax(max(min(100%, var(--card-min-width-md)), calc((100% - var(--section-stack-lg)) / 2)), 1fr))',
                gap: 'var(--section-stack-lg)',
                alignItems: 'stretch',
            }}
        >
            <DoDontCard tone="do" caption={doCaption} code={doCode} fullSize={doFullSize}>{doExample}</DoDontCard>
            <DoDontCard tone="dont" caption={dontCaption} code={dontCode} fullSize={dontFullSize}>{dontExample}</DoDontCard>
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
                className="sb-ds-docs-preview-well sb-ds-docs-interactive-panel"
                style={{
                    overflow: 'visible',
                    borderRadius: 'var(--card-radius)',
                    backgroundColor: 'var(--ds-surface-sunken)',
                    border: 'var(--border-width-default) solid var(--ds-border)',
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
                        borderTop: 'var(--border-width-default) solid var(--ds-border)',
                        backgroundColor: 'var(--ds-surface-sunken)',
                        // The panel is overflow-visible (Controls popups), so this
                        // last child's own background must follow the panel's curve
                        // or it squares off the bottom corners.
                        borderBottomLeftRadius: 'calc(var(--card-radius) - var(--border-width-default))',
                        borderBottomRightRadius: 'calc(var(--card-radius) - var(--border-width-default))',
                    }}
                >
                    <Controls of={ofStory} />
                </div>
            </div>
            <DocsAllProps of={ofStory} />
        </div>
    );
}
