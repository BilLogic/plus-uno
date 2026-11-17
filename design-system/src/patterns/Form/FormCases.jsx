import React, { useState } from 'react';
import { Fieldset, Select, TextField } from '@/components';

/**
 * The live do and don't field-layout examples on the Form template page,
 * built from `Fieldset`, `TextField` and `Select`.
 */

const SITES = [
    { value: 'lincoln', label: 'Lincoln Middle' },
    { value: 'roosevelt', label: 'Roosevelt K-8' },
    { value: 'north', label: 'North High' },
];

const CaseSurface = ({ children }) => (
    <div
        className="sb-unstyled"
        style={{
            inlineSize: '100%',
            padding: 'var(--pad-y-md) var(--pad-x-md)',
            border: 'var(--border-width-default) solid var(--ds-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--ds-surface)',
        }}
    >
        {children}
    </div>
);

/** One column down, pairing only date and time that belong together. */
export const OneColumnFields = () => {
    const [student, setStudent] = useState('Ana Ruiz');
    const [site, setSite] = useState('lincoln');
    const [date, setDate] = useState('Thu, Oct 24');
    const [time, setTime] = useState('4:00 PM');
    return (
        <CaseSurface>
            <Fieldset legend="Session">
                <TextField label="Student" isRequired value={student} onChange={(e) => setStudent(e.target.value)} />
                <Select label="Site" isRequired options={SITES} value={site} onChange={setSite} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--inline-md)' }}>
                    <TextField label="Session date" isRequired value={date} onChange={(e) => setDate(e.target.value)} />
                    <TextField label="Start time" isRequired value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
            </Fieldset>
        </CaseSurface>
    );
};

/** Unrelated fields scattered across two columns so the eye zigzags. */
export const TwoColumnFields = () => {
    const [student, setStudent] = useState('Ana Ruiz');
    const [site, setSite] = useState('lincoln');
    const [subject, setSubject] = useState('Algebra B');
    const [notes, setNotes] = useState('Worked through fractions');
    return (
        <CaseSurface>
            <Fieldset legend="Session">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--inline-md)' }}>
                    <TextField label="Student" isRequired value={student} onChange={(e) => setStudent(e.target.value)} />
                    <Select label="Site" isRequired options={SITES} value={site} onChange={setSite} />
                    <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    <TextField label="Notes" labelMarker="optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
            </Fieldset>
        </CaseSurface>
    );
};
