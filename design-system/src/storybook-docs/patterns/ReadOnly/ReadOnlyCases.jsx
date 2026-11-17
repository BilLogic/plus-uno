import React from 'react';
import { TextField } from '@/components';
import { PatternSection } from '@/patterns';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { PlainText, ReadOnlyField } from './readOnlyDemo.jsx';

/**
 * The live do and don't examples on the Read-only pattern page, composed from
 * `ReadOnlyField`, `PlainText`, `TextField`, `PatternSection` and `CaseSurface`.
 */

const noop = () => {};

/** Do: read-only at full contrast with its reason in the caption. */
export const ReadableWithReasonCase = () => (
    <CaseSurface>
        <ReadOnlyField padded={false} />
    </CaseSurface>
);

/** Don't: a faded disabled value with no reason, out of the tab order and hard to read. */
export const FadedNoReasonCase = () => (
    <CaseSurface>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' }}>
            <TextField label="Session time" value="Thursday at 4:00 PM" onChange={noop} isDisabled />
        </div>
    </CaseSurface>
);

/** Do: a value nobody changes here is plain label and value text. */
export const PlainValueCase = () => (
    <CaseSurface>
        <PlainText padded={false} />
    </CaseSurface>
);

/** Don't: putting a never-editable value in a read-only field promises an input. */
export const FieldForFixedValueCase = () => (
    <CaseSurface>
        <PatternSection title="Details" description="Lincoln Middle">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' }}>
                <TextField label="School" value="Lincoln Middle School" onChange={noop} isReadOnly />
                <TextField label="Created" value="Sep 3, 2026" onChange={noop} isReadOnly />
            </div>
        </PatternSection>
    </CaseSurface>
);
