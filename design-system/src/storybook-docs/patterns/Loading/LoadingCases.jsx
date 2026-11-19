import React from 'react';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './LoadingExamples.jsx';
import examplesSource from './LoadingExamples.jsx?raw';

/**
 * The live do and don't examples on the Loading pattern page, built from
 * `LoadingExamples.jsx`, which Show code prints, and staged here.
 */

export const CODE = showCode(examplesSource, ['SkeletonInShape', 'SpinnerInBlank', 'MenuOneRow', 'MenuSkeletonRows']);

/** A held-open menu centered in a boundary that gives its layer room. */
const MenuStage = ({ children }) => (
    <DocsOverlayBoundary fit={false} containHeight>
        <div style={{ display: 'flex', justifyContent: 'center' }}>{children}</div>
    </DocsOverlayBoundary>
);

/** Do: a menu that waits shows one "Loading options" row with a spinner. */
export const MenuOneRowCase = () => <MenuStage><Example.MenuOneRow /></MenuStage>;

/** Don't: a menu filled with skeleton rows promises items it may not have. */
export const MenuSkeletonRowsCase = () => <MenuStage><Example.MenuSkeletonRows /></MenuStage>;

/** Do: a skeleton in the table's own shape, text bars throughout. */
export const SkeletonInShape = () => <Example.SkeletonInShape />;

/** Don't: one spinner in a blank area, so the layout jumps when the rows arrive. */
export const SpinnerInBlank = () => <Example.SpinnerInBlank />;
