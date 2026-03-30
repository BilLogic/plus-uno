import React from 'react';
import { Canvas, Controls } from '@storybook/addon-docs/blocks';

/**
 * Shared Storybook docs layout primitives (PLUS DS).
 * Use with Component.mdx + `.sb-ds-component-docs` / `.sb-ds-doc-section` wrappers.
 */

/** Muted border + padded inner well — shared by DocsDemoBlock and DocsCanvasShell. */
export function DocsPreviewCard({ children, innerClassName = '' }) {
    return (
        <div className="sb-ds-docs-preview-well overflow-visible rounded-xl border border-border bg-muted/40 shadow-sm dark:bg-muted/25">
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
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
            {chrome === 'none' ? (
                <div className={previewClassName}>{children}</div>
            ) : (
                <DocsPreviewCard innerClassName={previewClassName}>{children}</DocsPreviewCard>
            )}
        </div>
    );
}

/** Wrap Storybook Canvas in the same preview chrome + spacing as DocsDemoBlock. */
export function DocsCanvasShell({ description, children }) {
    return (
        <div className="sb-docs-demo not-prose space-y-6 md:space-y-8">
            {description ? (
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
            <DocsPreviewCard>{children}</DocsPreviewCard>
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
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
            <div className="sb-ds-docs-preview-well sb-ds-docs-interactive-panel overflow-visible rounded-xl border border-border bg-muted/40 shadow-sm dark:bg-muted/25">
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
