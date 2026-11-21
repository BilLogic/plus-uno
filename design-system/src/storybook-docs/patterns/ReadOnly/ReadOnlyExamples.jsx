import React from 'react';
import { Facts, TextField } from '@/components';
import { Section } from '@/templates';

/**
 * The Read-only page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file; the surface that holds them lives in
 * `ReadOnlyCases.jsx`.
 */

const column = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' };

export const ReadableWithReason = () => (
    <div style={column}>
        <TextField label="Session time" value="Thursday at 4:00 PM" onChange={() => {}} isReadOnly caption="Set by your supervisor." />
    </div>
);

export const FadedNoReason = () => (
    <div style={column}>
        <TextField label="Session time" value="Thursday at 4:00 PM" onChange={() => {}} isDisabled />
    </div>
);

export const PlainValue = () => (
    <Section title="Details" description="Lincoln Middle">
        <Facts items={[
            { label: 'School', value: 'Lincoln Middle School' },
            { label: 'Created', value: 'Sep 3, 2026' },
        ]} />
    </Section>
);

export const FieldForFixedValue = () => (
    <Section title="Details" description="Lincoln Middle">
        <div style={column}>
            <TextField label="School" value="Lincoln Middle School" onChange={() => {}} isReadOnly />
            <TextField label="Created" value="Sep 3, 2026" onChange={() => {}} isReadOnly />
        </div>
    </Section>
);
