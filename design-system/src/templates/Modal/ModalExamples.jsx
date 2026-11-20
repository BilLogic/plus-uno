import React, { useState } from 'react';
import { Button, FooterActions, ProgressTracker, SectionMessage, TextField } from '@/components';
import { Modal } from '@/templates';

/**
 * The Modal page's do and don't examples, as PLUS parts only. Show code prints
 * each one from this file; the stand-in screen they are drawn on lives in
 * `ModalCases.jsx`. Each Modal is the code a consumer writes: `show` is its
 * open state, and Close sets it back.
 */

const DeleteFooter = () => (
    <FooterActions>
        <Button text="Keep session" />
        <Button text="Delete session" appearance="danger" />
    </FooterActions>
);

export const ConfirmNarrow = () => {
    const [open, setOpen] = useState(true);
    return (
        <Modal
            show={open}
            onClose={() => setOpen(false)}
            width="4-col"
            title="Delete session?"
            body="This removes Thursday’s session for Ana and her tutor."
            footer={<DeleteFooter />}
        />
    );
};

export const ConfirmWide = () => {
    const [open, setOpen] = useState(true);
    return (
        <Modal
            show={open}
            onClose={() => setOpen(false)}
            width="10-col"
            title="Delete session?"
            body="This removes Thursday’s session for Ana and her tutor."
            footer={<DeleteFooter />}
        />
    );
};

export const ConfirmsInside = () => {
    const [open, setOpen] = useState(true);
    const [isConfirming, setIsConfirming] = useState(true);
    return (
        <Modal
            show={open}
            onClose={() => setOpen(false)}
            title={isConfirming ? 'Delete session?' : 'Session details'}
            body={isConfirming ? (
                <SectionMessage appearance="warning" dismissible={false}>
                    This removes Thursday’s session for Ana and her tutor. This cannot be undone.
                </SectionMessage>
            ) : 'Thursday · 4:00–5:00 PM with Ana Ruiz.'}
            footer={(
                <FooterActions>
                    <Button text={isConfirming ? 'Back' : 'Keep session'} onClick={isConfirming ? () => setIsConfirming(false) : undefined} />
                    <Button text="Delete session" appearance="danger" onClick={isConfirming ? undefined : () => setIsConfirming(true)} />
                </FooterActions>
            )}
        />
    );
};

export const ModalOnModal = () => {
    const [detailsOpen, setDetailsOpen] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(true);
    return (
        <>
            <Modal
                show={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                title="Session details"
                body="Thursday · 4:00–5:00 PM with Ana Ruiz."
                footer={<DeleteFooter />}
            />
            <Modal
                show={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                width="4-col"
                title="Delete session?"
                body="This removes Thursday’s session for Ana and her tutor."
                footer={<DeleteFooter />}
            />
        </>
    );
};

const SESSION_NOTES = [
    'Ana solved two-step linear equations with fractions.',
    'Reviewed common denominators before moving to word problems.',
    'Asked for extra practice sets on ratio tables for next Thursday.',
    'Checked quiz corrections from Monday and noted two sign errors.',
    'Confirmed 4:30 PM start time works for both student and parent.',
    'Assigned practice set 5 in the algebra workbook.',
];

const NotesList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
        {SESSION_NOTES.map((line) => <p key={line} style={{ margin: 0 }}>{line}</p>)}
    </div>
);

export const FooterPinned = () => {
    const [open, setOpen] = useState(true);
    return (
        <Modal
            show={open}
            onClose={() => setOpen(false)}
            height="fill"
            title="Session notes"
            body={<NotesList />}
            footer={(
                <FooterActions>
                    <Button text="Discard" onClick={() => setOpen(false)} />
                    <Button text="Save" appearance="primary" onClick={() => setOpen(false)} />
                </FooterActions>
            )}
        />
    );
};

export const ButtonInBody = () => {
    const [open, setOpen] = useState(true);
    return (
        <Modal
            show={open}
            onClose={() => setOpen(false)}
            height="fill"
            showBottomButtons={false}
            title="Session notes"
            body={(
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--modal-stack-md)' }}>
                    <NotesList />
                    <Button text="Save" appearance="primary" onClick={() => setOpen(false)} />
                </div>
            )}
        />
    );
};

const STEPS = ['Student', 'When', 'Review'];

const stepItems = (at, go) => STEPS.map((label, i) => ({
    id: label.toLowerCase(),
    label,
    status: i < at ? 'visited' : i === at ? 'current' : 'unvisited',
    ...(i < at ? { onClick: () => go(i) } : {}),
}));

export const StepsWithBackAndNext = () => {
    const [open, setOpen] = useState(true);
    const [at, setAt] = useState(0);
    const [student, setStudent] = useState('Ana Ruiz');
    const [slot, setSlot] = useState('Thursday · 4:30 PM');
    const last = at === STEPS.length - 1;
    return (
        <Modal
            show={open}
            onClose={() => setOpen(false)}
            title="Schedule a session"
            body={(
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--modal-stack-md)' }}>
                    <ProgressTracker label="Steps" orientation="horizontal" items={stepItems(at, setAt)} />
                    {at === 0 && <TextField label="Student" value={student} onChange={(e) => setStudent(e.target.value)} />}
                    {at === 1 && <TextField label="Time" value={slot} onChange={(e) => setSlot(e.target.value)} />}
                    {at === 2 && <p style={{ margin: 0 }}>{`${student} · ${slot}`}</p>}
                </div>
            )}
            footer={(
                <FooterActions>
                    <Button text="Back" isDisabled={at === 0} onClick={() => setAt(at - 1)} />
                    <Button
                        text={last ? 'Schedule' : 'Next'}
                        appearance="primary"
                        onClick={() => (last ? setOpen(false) : setAt(at + 1))}
                    />
                </FooterActions>
            )}
        />
    );
};

export const NumberedTabsAsSteps = () => {
    const [open, setOpen] = useState(true);
    const [student, setStudent] = useState('Ana Ruiz');
    const [slot, setSlot] = useState('Thursday · 4:30 PM');
    return (
        <Modal
            show={open}
            onClose={() => setOpen(false)}
            title="Schedule a session"
            tabs={[
                { key: 'student', label: '1. Student', content: <TextField label="Student" value={student} onChange={(e) => setStudent(e.target.value)} /> },
                { key: 'when', label: '2. When', content: <TextField label="Time" value={slot} onChange={(e) => setSlot(e.target.value)} /> },
                { key: 'review', label: '3. Review', content: <p style={{ margin: 0 }}>{`${student} · ${slot}`}</p> },
            ]}
            footer={(
                <FooterActions>
                    <Button text="Save" appearance="primary" onClick={() => setOpen(false)} />
                </FooterActions>
            )}
        />
    );
};
