import React, { useState } from 'react';
import { Dialog, Fieldset, PanelBody, PanelCloseAction, PanelContainer, PanelFooter, PanelHeader, Select, TextField } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseBlanket, CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { Behind, FILLED, FormFields, FullBleedFooter } from './formDemo.jsx';

/**
 * The live do and don't field-layout examples on the Form template page,
 * built from `Fieldset`, `TextField`, `Select`, `PanelContainer` and `Dialog`.
 */

/** The height of the stage the edit sits in. Docs geometry, px. */
const EDIT_STAGE = 420; // docs-literal

const SITES = [
    { value: 'lincoln', label: 'Lincoln Middle' },
    { value: 'roosevelt', label: 'Roosevelt K-8' },
    { value: 'north', label: 'North High' },
];

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

/** A short edit in a Panel: the rows stay in view beside it. */
export const EditInPanel = () => {
    const [values, setValues] = useState(FILLED);
    return (
        <HeadingLevelContext.Provider value={4}>
            <CaseSurface padding="none" style={{ display: 'flex', blockSize: EDIT_STAGE, overflow: 'hidden' }}>
                <div style={{ flex: '1 1 auto', minInlineSize: 0, padding: 'var(--page-pad)' }}><Behind /></div>
                <PanelContainer width="var(--panel-width-default)">
                    <PanelHeader title="Ana Ruiz" actions={<PanelCloseAction onClick={() => {}} />} />
                    <PanelBody><FormFields values={values} onChange={setValues} /></PanelBody>
                    <PanelFooter><FullBleedFooter onSave={() => {}} onCancel={() => {}} primary="Save" /></PanelFooter>
                </PanelContainer>
            </CaseSurface>
        </HeadingLevelContext.Provider>
    );
};

/** The same short edit in a Modal: its Blanket covers the rows. */
export const EditInModal = () => {
    const [values, setValues] = useState(FILLED);
    return (
        <HeadingLevelContext.Provider value={4}>
            <CaseSurface padding="none" style={{ position: 'relative', blockSize: EDIT_STAGE, overflow: 'hidden' }}>
                <div style={{ padding: 'var(--page-pad)' }}><Behind /></div>
                <div style={{ position: 'absolute', inset: 0 }}>
                    <CaseBlanket height={EDIT_STAGE}>
                        <Dialog
                            title="Ana Ruiz"
                            onClose={() => {}}
                            style={{ inlineSize: '100%' }}
                            footer={<FullBleedFooter onSave={() => {}} onCancel={() => {}} primary="Save" />}
                        >
                            <FormFields values={values} onChange={setValues} />
                        </Dialog>
                    </CaseBlanket>
                </div>
            </CaseSurface>
        </HeadingLevelContext.Provider>
    );
};
