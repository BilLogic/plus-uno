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
            sourceState="shown"
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
    return (
        <a 
            href={href || '#'} 
            target={href && href !== '#' ? "_blank" : undefined}
            rel={href && href !== '#' ? "noreferrer" : undefined}
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
 * Design + repo links above the docs body.
 * Figma: specs and tokens. GitHub: full source tree, history, and PR context — unlike the Overview code snippet,
 * which is usually a curated web-app/JSP-style excerpt, not the whole React implementation.
 */
export function ResourcesBlock({ figmaLink, githubLink }) {
    if (!figmaLink && !githubLink) return null;
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
        </div>
    );
}

/** Muted border + padded inner well — shared by DocsDemoBlock and DocsCanvasShell. */
export function DocsPreviewCard({ children, innerClassName = '' }) {
    return (
        <div
            className="sb-ds-docs-preview-well overflow-visible bg-muted/40 dark:bg-muted/25"
            style={{ borderRadius: 'var(--size-card-radius-sm)' }}
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
 * @param {boolean} [attachSourceBelow] — When true, the Canvas preview is a rounded card only;
 *   the “Show code” control and source block sit below it (visually attached), not inside the card.
 */
export function DocsCanvasShell({ description, children, attachSourceBelow = false }) {
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
    return (
        <div className="sb-docs-demo not-prose space-y-6 md:space-y-8">
            {description ? (
                <p className="sb-ds-canvas-description">{description}</p>
            ) : null}
            <div
                className="sb-ds-docs-preview-well sb-ds-docs-interactive-panel overflow-visible bg-muted/40 dark:bg-muted/25"
                style={{ borderRadius: 'var(--size-card-radius-sm)' }}
            >
                <div className="min-h-[100px] p-10 md:p-12 lg:p-14">
                    <Canvas of={ofStory} story={{ inline: true }} sourceState="none" />
                </div>
                <div className="sb-ds-docs-interactive-panel__controls border-t border-border/50 bg-muted/25 px-10 pb-8 pt-6 md:px-12 md:pb-10 md:pt-7 lg:px-14 dark:bg-muted/15">
                    <Controls of={ofStory} />
                </div>
            </div>
        </div>
    );
}
