import React from 'react';
import { DocsDemoBlock } from '@/storybook-docs/ds-docs-layout.jsx';
import Button from './Button';

const SEMANTIC_STYLES = ['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger'];
const FILLS = ['filled', 'tonal', 'outline', 'ghost'];

const inlineCode = (children) => (
    <code className="rounded-md border border-border bg-muted/80 px-1.5 py-0.5 font-mono text-[0.875em] text-foreground">
        {children}
    </code>
);

/** Lead copy for Button.mdx “Sizes”. */
export function SizesDocDescription() {
    return (
        <>
            Use the {inlineCode('size')} prop to change button scale: {inlineCode('small')},{' '}
            {inlineCode('medium')}, or {inlineCode('large')}.
        </>
    );
}

/** Sizes row for Button.mdx — embedded via Storybook Canvas (`SizesFilledRow` story). */
export function ButtonSizesFilledRowContainer() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button text="Small" size="small" style="primary" fill="filled" />
            <Button text="Medium" size="medium" style="primary" fill="filled" />
            <Button text="Large" size="large" style="primary" fill="filled" />
        </div>
    );
}

/** Color styles (primary, secondary, ...) at default filled treatment. */
export function ColorStylesSection() {
    return (
        <DocsDemoBlock
            description={
                <>
                    Use the {inlineCode('style')} prop for semantic color roles. Shown with the default{' '}
                    {inlineCode('filled')} treatment.
                </>
            }
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {SEMANTIC_STYLES.map(style => (
                    <Button
                        key={style}
                        text={style.charAt(0).toUpperCase() + style.slice(1)}
                        style={style}
                        fill="filled"
                    />
                ))}
            </div>
        </DocsDemoBlock>
    );
}

/** Fill treatments (filled, tonal, outline, ghost) on primary. */
export function FillTreatmentsSection() {
    return (
        <DocsDemoBlock
            description={
                <>
                    Use the {inlineCode('fill')} prop for surface treatment. Examples use{' '}
                    {inlineCode('style="primary"')}.
                </>
            }
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {FILLS.map(fill => (
                    <Button
                        key={fill}
                        text={fill.charAt(0).toUpperCase() + fill.slice(1)}
                        style="primary"
                        fill={fill}
                    />
                ))}
            </div>
        </DocsDemoBlock>
    );
}

/** Disabled, loading, active. */
export function InteractionStatesSection() {
    return (
        <DocsDemoBlock
            description={
                <>
                    {inlineCode('disabled')}, {inlineCode('loading')}, and {inlineCode('active')} cover non-default interaction
                    presentation.
                </>
            }
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <Button text="Disabled" disabled style="primary" />
                <Button text="Loading" loading style="primary" />
                <Button text="Active" active style="secondary" />
            </div>
        </DocsDemoBlock>
    );
}

/** Leading / trailing / icon-only — render full Button so `.plus-btn` flex + gap apply. */
export function ButtonContentSection() {
    const demoProps = { style: 'primary', fill: 'outline' };
    return (
        <DocsDemoBlock
            description={
                <>
                    Use {inlineCode('Button.Content')} inside {inlineCode('Button')} for the same slots, or pass{' '}
                    {inlineCode('leadingVisual')} / {inlineCode('trailingVisual')} on {inlineCode('Button')} directly.
                    {inlineCode('Button.Content')} alone is a fragment and does not provide button layout.
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
                <Button {...demoProps} text="Text only" />
                <Button {...demoProps} text="Text + leading visual" leadingVisual="star" />
                <Button {...demoProps} text="Text + trailing visual" trailingVisual="arrow-right" />
                <Button
                    {...demoProps}
                    text="Leading + trailing visual"
                    leadingVisual="user"
                    trailingVisual="arrow-right"
                />
                <Button {...demoProps} leadingVisual="user" aria-label="Icon only" />
            </div>
        </DocsDemoBlock>
    );
}

/** Block width and vertical (stacked) content. */
export function LayoutSection() {
    return (
        <DocsDemoBlock
            description={
                <>
                    Use {inlineCode('block')} for full width in a container, and {inlineCode('vertical')} to stack icon
                    and label (often with {inlineCode('block')} in fixed tiles).
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%' }}>
                <div className="w-full space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Block</p>
                    <div className="max-w-md">
                        <Button text="Block button" block style="primary" fill="outline" />
                    </div>
                </div>
                <div className="w-full space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vertical</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '32px' }}>
                        <div style={{ width: '100px', height: '100px' }}>
                            <Button
                                text="Add item"
                                vertical
                                block
                                leadingVisual="plus"
                                style="primary"
                                fill="outline"
                            />
                        </div>
                        <Button
                            text="Upload"
                            vertical
                            leadingVisual="upload"
                            style="secondary"
                            fill="tonal"
                        />
                    </div>
                </div>
            </div>
        </DocsDemoBlock>
    );
}
