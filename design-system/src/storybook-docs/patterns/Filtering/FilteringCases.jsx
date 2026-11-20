import React from 'react';

import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './FilteringExamples.jsx';
import examplesSource from './FilteringExamples.jsx?raw';

/**
 * Live Do / Don't cases on the Filtering pattern page: each one is an example
 * from `FilteringExamples.jsx`, staged here on a `CaseSurface`, and Show code
 * prints the example's own source.
 */

export const CODE = showCode(examplesSource, ['OneTier', 'TwoTiers', 'FiltersAtEnd', 'FiltersAmongViews', 'CountOnIcon', 'TagRow']);

const Staged = ({ children }) => (
    <CaseSurface border="none" padding="md" surface={false}>
        <HeadingLevelContext.Provider value={4}>{children}</HeadingLevelContext.Provider>
    </CaseSurface>
);

/** Live Do: one filter tier per bar (three quick filters, no Filter button). */
export const OneTierCase = () => <Staged><Example.OneTier /></Staged>;

/** Live Don't: mixing quick filters with a Filter button in the same bar. */
export const TwoTiersCase = () => <Staged><Example.TwoTiers /></Staged>;

/** Live Do: views in the second row; Search and the filters in the third. */
export const FiltersAtEndCase = () => <Staged><Example.FiltersAtEnd /></Staged>;

/** Live Don't: the same triggers squeezed beside the views, in the views row instead of the third. */
export const FiltersAmongViewsCase = () => <Staged><Example.FiltersAmongViews /></Staged>;

/** Live Do: the active count shown on the Filter button's selected fill. */
export const CountOnIconCase = () => <Staged><Example.CountOnIcon /></Staged>;

/** Live Don't: a row of tags under the bar repeating what is on. */
export const TagRowCase = () => <Staged><Example.TagRow /></Staged>;
