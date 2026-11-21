import React from 'react';

import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './SearchExamples.jsx';
import examplesSource from './SearchExamples.jsx?raw';

/**
 * Live Do / Don't cases on the Search pattern page: each one is an example
 * from `SearchExamples.jsx`, which keeps its own state. The case only sets
 * the surface and the heading level the page puts it under, so Show code
 * prints the Section a consumer writes.
 */

export const CODE = showCode(examplesSource, ['ScopeNamed', 'ScopeUnnamed', 'CountInWords', 'CountBare']);

const staged = (Example) => () => (
    <CaseSurface border="none" padding="md" surface={false}>
        <HeadingLevelContext.Provider value={4}>
            <Example />
        </HeadingLevelContext.Provider>
    </CaseSurface>
);

/** Live Do: the placeholder names the scope. */
export const ScopeNamedCase = staged(Example.ScopeNamed);

/** Live Don't: a placeholder that names nothing. */
export const ScopeUnnamedCase = staged(Example.ScopeUnnamed);

/** Live Do: the count in words, "2 of 6 students". */
export const CountInWordsCase = staged(Example.CountInWords);

/** Live Don't: a bare count, "2 results". */
export const CountBareCase = staged(Example.CountBare);
