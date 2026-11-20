import React from 'react';

import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './FilteringExamples.jsx';
import examplesSource from './FilteringExamples.jsx?raw';

/**
 * Live Do / Don't cases on the Filtering pattern page: each one is an example
 * from `FilteringExamples.jsx`, which keeps its own state. The case only sets
 * the surface and the heading level the page puts it under, so Show code
 * prints the Section a consumer writes.
 */

export const CODE = showCode(examplesSource, ['OneTier', 'TwoTiers', 'FiltersAtEnd', 'FiltersAmongViews', 'CountOnIcon', 'TagRow']);

const staged = (Example) => () => (
    <CaseSurface border="none" padding="md" surface={false}>
        <HeadingLevelContext.Provider value={4}>
            <Example />
        </HeadingLevelContext.Provider>
    </CaseSurface>
);

/** Live Do: one filter tier per bar (three quick filters, no Filter button). */
export const OneTierCase = staged(Example.OneTier);

/** Live Don't: mixing quick filters with a Filter icon in the same bar. */
export const TwoTiersCase = staged(Example.TwoTiers);

/** Live Do: views in the second row; Search and the filters in the third. */
export const FiltersAtEndCase = staged(Example.FiltersAtEnd);

/** Live Don't: the same triggers squeezed beside the views, in the views row instead of the third. */
export const FiltersAmongViewsCase = staged(Example.FiltersAmongViews);

/** Live Do: the active count shown on the Filter button's selected fill. */
export const CountOnIconCase = staged(Example.CountOnIcon);

/** Live Don't: a row of tags under the bar repeating what is on. */
export const TagRowCase = staged(Example.TagRow);
