import React from 'react';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './EmptyExamples.jsx';
import examplesSource from './EmptyExamples.jsx?raw';

/**
 * The live do and don't examples on the Empty pattern page: each one is an
 * example from `EmptyExamples.jsx`, staged on a `CaseSurface`, and Show code
 * prints the example's own source.
 */

export const CODE = showCode(examplesSource, ['WhatBelongsHere', 'BareString', 'ReplacedTable', 'HeaderOverNothing']);

/** Do: say what belongs here, why it is empty, and give the one action that fills it. */
export const WhatBelongsHereCase = () => <CaseSurface><Example.WhatBelongsHere /></CaseSurface>;

/** Don't: a bare string in an empty box reads as broken or still loading. */
export const BareStringCase = () => <CaseSurface><Example.BareString /></CaseSurface>;

/** Do: replace the whole table with the empty state while the header rows stay above. */
export const ReplacedTableCase = () => <CaseSurface><Example.ReplacedTable /></CaseSurface>;

/** Don't: column headers and a footer left sitting over a short centered line. */
export const HeaderOverNothingCase = () => <CaseSurface><Example.HeaderOverNothing /></CaseSurface>;
