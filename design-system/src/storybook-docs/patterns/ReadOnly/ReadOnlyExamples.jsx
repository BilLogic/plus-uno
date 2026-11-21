import React from 'react';
import { TextField } from '@/components';
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
        <dl className="body-default" style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 'var(--stack-sm) var(--inline-lg)' }}>
            <dt>School</dt>
            <dd style={{ margin: 0 }}>Lincoln Middle School</dd>
            <dt>Created</dt>
            <dd style={{ margin: 0 }}>Sep 3, 2026</dd>
        </dl>
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
