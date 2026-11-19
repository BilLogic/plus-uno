import React from 'react';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './ReadOnlyExamples.jsx';
import examplesSource from './ReadOnlyExamples.jsx?raw';

/**
 * The live do and don't examples on the Read-only pattern page: each one is an
 * example from `ReadOnlyExamples.jsx`, staged on a `CaseSurface`, and Show code
 * prints the example's own source.
 */

export const CODE = showCode(examplesSource, ['ReadableWithReason', 'FadedNoReason', 'PlainValue', 'FieldForFixedValue']);

/** Do: read-only at full contrast with its reason in the caption. */
export const ReadableWithReasonCase = () => <CaseSurface><Example.ReadableWithReason /></CaseSurface>;

/** Don't: a faded disabled value with no reason, out of the tab order and hard to read. */
export const FadedNoReasonCase = () => <CaseSurface><Example.FadedNoReason /></CaseSurface>;

/** Do: a value nobody changes here is plain label and value text. */
export const PlainValueCase = () => <CaseSurface><Example.PlainValue /></CaseSurface>;

/** Don't: putting a never-editable value in a read-only field promises an input. */
export const FieldForFixedValueCase = () => <CaseSurface><Example.FieldForFixedValue /></CaseSurface>;
