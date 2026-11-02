import React from 'react';
import { ModeCompare } from '@/storybook-docs/foundation-blocks.jsx';

/**
 * Specimens for AI/Color and elevation. Each AI token painted as what it is
 * for: the bold ground, the edge and the glyph, in a light and a dark pane.
 */
export default {
    title: 'AI/Color and elevation',
    tags: ['!dev', '!autodocs'],
};

const row = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'var(--layout-gutter)',
    padding: 'var(--card-pad-sm)',
    borderRadius: 'var(--card-radius)',
    background: 'var(--ds-surface)',
    color: 'var(--ds-text)',
};

const ground = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--element-inline-md)',
    padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
    borderRadius: 'var(--size-element-radius-md)',
    background: 'var(--ds-ai-background-bold)',
    color: 'var(--ds-text-inverse)',
    font: 'var(--body-small)',
};

const edge = {
    display: 'inline-flex',
    padding: 'var(--card-pad-sm)',
    borderRadius: 'var(--card-radius)',
    border: 'var(--border-default) solid var(--ds-ai-border)',
    font: 'var(--body-small)',
};

/** The three kinds of AI token, each as its one allowed use. */
export const Swatches = () => (
    <ModeCompare>
        <div style={row}>
            <span style={ground}>
                <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
                Ask PLUS AI
            </span>
            <span style={edge}>An edge marks generated content</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--element-inline-md)', font: 'var(--body-small)' }}>
                <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" style={{ color: 'var(--ds-ai-icon)' }} />
                A glyph, beside its label
            </span>
        </div>
    </ModeCompare>
);
