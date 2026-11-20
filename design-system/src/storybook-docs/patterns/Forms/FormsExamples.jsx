import React, { useState } from 'react';
import { Button, Fieldset, FooterActions, Select, Skeleton, TextField } from '@/components';
import { Modal, PanelBody, PanelCloseAction, PanelContainer, PanelFooter, PanelHeader, Section } from '@/templates';

/**
 * The Forms page's do and don't examples, as PLUS parts only. Show code prints
 * each one from this file; the surface that holds them (a stage, the rows a
 * Modal's Blanket covers) lives in `FormsCases.jsx` and `formsDemo.jsx`.
 */

const SITES = [
    { value: 'lincoln', label: 'Lincoln Middle' },
    { value: 'roosevelt', label: 'Roosevelt K-8' },
    { value: 'north', label: 'North High' },
];

const SessionFields = () => {
    const [student, setStudent] = useState('Ana Ruiz');
    const [site, setSite] = useState('lincoln');
    const [notes, setNotes] = useState('');
    return (
        <Fieldset legend="Session">
            <TextField
                label="Student"
                isRequired
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                caption="First and last name, as on the roster."
            />
            <Select label="Site" isRequired options={SITES} value={site} onChange={setSite} />
            <TextField label="Notes" labelMarker="optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Fieldset>
    );
};

const SessionsBehind = () => (
    <Section title="Sessions">
        <Skeleton shape="text" lines={3} />
    </Section>
);

const SaveFooter = () => (
    <FooterActions>
        <Button text="Discard" />
        <Button text="Save" appearance="primary" />
    </FooterActions>
);

const LogSessionFooter = () => (
    <FooterActions>
        <Button text="Cancel" />
        <Button text="Save session" appearance="primary" />
    </FooterActions>
);

export const OneColumnFields = () => {
    const [student, setStudent] = useState('Ana Ruiz');
    const [site, setSite] = useState('lincoln');
    const [date, setDate] = useState('Thu, Oct 24');
    const [time, setTime] = useState('4:00 PM');
    return (
        <Fieldset legend="Session">
            <TextField label="Student" isRequired value={student} onChange={(e) => setStudent(e.target.value)} />
            <Select label="Site" isRequired options={SITES} value={site} onChange={setSite} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--inline-md)' }}>
                <TextField label="Session date" isRequired value={date} onChange={(e) => setDate(e.target.value)} />
                <TextField label="Start time" isRequired value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
        </Fieldset>
    );
};

export const TwoColumnFields = () => {
    const [student, setStudent] = useState('Ana Ruiz');
    const [site, setSite] = useState('lincoln');
    const [subject, setSubject] = useState('Algebra B');
    const [notes, setNotes] = useState('Worked through fractions');
    return (
        <Fieldset legend="Session">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--inline-md)' }}>
                <TextField label="Student" isRequired value={student} onChange={(e) => setStudent(e.target.value)} />
                <Select label="Site" isRequired options={SITES} value={site} onChange={setSite} />
                <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <TextField label="Notes" labelMarker="optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
        </Fieldset>
    );
};

export const EditInPanel = () => (
    <>
        <div style={{ padding: 'var(--page-pad)' }}>
            <SessionsBehind />
        </div>
        <PanelContainer width="var(--panel-width-default)">
            <PanelHeader title="Ana Ruiz" actions={<PanelCloseAction onClick={() => {}} />} />
            <PanelBody><SessionFields /></PanelBody>
            <PanelFooter><SaveFooter /></PanelFooter>
        </PanelContainer>
    </>
);

export const EditInModal = () => (
    <Modal show title="Ana Ruiz" footer={<SaveFooter />}>
        <SessionFields />
    </Modal>
);

export const ErrorOnField = () => (
    <Modal show title="Log a session" footer={<LogSessionFooter />}>
        <TextField label="Student" isRequired defaultValue="" isInvalid errorMessage="Enter the student’s name" />
    </Modal>
);

export const ErrorInSecondDialog = () => (
    <>
        <Modal show title="Log a session" footer={<LogSessionFooter />}>
            <TextField label="Student" isRequired defaultValue="" isInvalid />
        </Modal>
        <Modal
            show
            width="4-col"
            title="Something went wrong"
            footer={<FooterActions><Button text="OK" appearance="primary" /></FooterActions>}
        >
            <p style={{ margin: 0 }}>The session was not saved.</p>
        </Modal>
    </>
);

export const MinorityMarked = () => (
    <>
        <TextField label="Student" isRequired defaultValue="Ana Ruiz" />
        <TextField label="Site" isRequired defaultValue="Lincoln Middle" />
        <TextField label="Notes" labelMarker="optional" placeholder="Anything we should know?" />
    </>
);

export const MajorityMarked = () => (
    <>
        <TextField label="Student" isRequired labelMarker="required" defaultValue="Ana Ruiz" />
        <TextField label="Site" isRequired labelMarker="required" defaultValue="Lincoln Middle" />
        <TextField label="Notes" labelMarker="optional" placeholder="Anything we should know?" />
    </>
);

export const HelpInCaption = () => (
    <TextField label="School email" defaultValue="ana.ruiz@lincoln.edu" caption="Shared with your site supervisor." />
);

export const HelpInTooltip = () => (
    <TextField label="School email" defaultValue="ana.ruiz@lincoln.edu" info="Shared with your site supervisor." />
);
