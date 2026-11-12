import React, { useEffect, useRef, useState } from 'react';

import { Button, PanelBody, PanelCloseAction, PanelContainer, PanelHeader, ProgressTracker, SectionMessage, Skeleton, TextField } from '@/components';
import { Backdrop, PatternModal, PatternSection } from '@/patterns';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { CELL, FooterCells } from '@/storybook-docs/lib/full-bleed-footer.jsx';
import { stepItems } from '@/storybook-docs/lib/focused-task.jsx';
import { FormFields, FILLED } from '../Form/formDemo.jsx';

/**
 * The Modal template's examples: the real PLUS parts, placed the way each type
 * lays them out. A type picks its footer, and the footer is composed from Button
 * in full-bleed cells because the Modal has no footer prop for that yet
 * (Planned).
 */

/** The stand-in screen the docs draw the Backdrop at (docs geometry, px). */
export const SCREEN = { width: 1024, height: 480 }; // docs-literal

/** The Modal's own pad, which a full-bleed footer cancels. */
const MODAL_PAD = '--modal-pad-x-default';

const text = (copy) => <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>{copy}</p>;

/** A Modal at a width step, centered in its Backdrop at the stand-in screen. */
export const ModalStage = ({ children, width = 'sm', height = SCREEN.height, screenWidth = SCREEN.width, ...modal }) => (
    <Backdrop inline screenWidth={screenWidth} screenHeight={height}>
        <PatternModal width={width} onClose={() => {}} {...modal}>{children}</PatternModal>
    </Backdrop>
);

/** Full-bleed cells: Cancel (Default) left, the action (Primary or Danger) right, half each. */
export const TwoCells = ({ cancel = 'Cancel', action, appearance = 'primary', isDisabled = false, onAction, onCancel }) => (
    <FooterCells bleed={MODAL_PAD}>
        <Button text={cancel} shouldFitContainer style={CELL} onClick={onCancel} />
        <Button text={action} appearance={appearance} isDisabled={isDisabled} shouldFitContainer style={CELL} onClick={onAction} />
    </FooterCells>
);

/** One button fills the whole footer. */
export const OneCell = ({ action, onAction }) => (
    <FooterCells bleed={MODAL_PAD} columns="1fr">
        <Button text={action} appearance="primary" shouldFitContainer style={CELL} onClick={onAction} />
    </FooterCells>
);

/** A third each; only the last is Primary. */
export const ThreeCells = ({ labels = ['Cancel', 'Save draft', 'Schedule'] }) => (
    <FooterCells bleed={MODAL_PAD} columns="1fr 1fr 1fr">
        <Button text={labels[0]} shouldFitContainer style={CELL} onClick={() => {}} />
        <Button text={labels[1]} shouldFitContainer style={CELL} onClick={() => {}} />
        <Button text={labels[2]} appearance="primary" shouldFitContainer style={CELL} onClick={() => {}} />
    </FooterCells>
);

export const Passive = () => (
    <ModalStage title="Session notes">
        {text('Ana worked through fractions and asked to start ratios next week.')}
    </ModalStage>
);

export const Active = () => (
    <ModalStage title="Move session?" footer={<TwoCells action="Move session" />}>
        {text('Move Thursday’s session with Ana Ruiz to 4:30 PM? Ana and her tutor get an email with the new time.')}
    </ModalStage>
);

export const Acknowledge = () => (
    <ModalStage title="Your session was moved" footer={<OneCell action="Got it" />}>
        {text('Ana and her tutor have the new time: Thursday at 4:30 PM.')}
    </ModalStage>
);

const STEP_LABELS = ['Student', 'When', 'Review'];

/** Steps at 10-col: the tracker in the body, Cancel (Subtle) left, Back and Next on the right half. */
export const Steps = ({ start = 1 }) => {
    const [at, setAt] = useState(start);
    const last = at === STEP_LABELS.length - 1;
    return (
        <ModalStage
            width="lg"
            title="Schedule a session"
            footer={(
                <FooterCells bleed={MODAL_PAD} columns="2fr 1fr 1fr">
                    <Button text="Cancel" appearance="subtle" shouldFitContainer style={CELL} onClick={() => {}} />
                    <Button text="Back" isDisabled={at === 0} shouldFitContainer style={CELL} onClick={() => setAt(at - 1)} />
                    <Button text={last ? 'Schedule' : 'Next'} appearance="primary" shouldFitContainer style={CELL} onClick={() => setAt(Math.min(at + 1, STEP_LABELS.length - 1))} />
                </FooterCells>
            )}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--modal-stack-md)' }}>
                <ProgressTracker
                    label="Steps"
                    orientation="horizontal"
                    items={stepItems(STEP_LABELS, at, setAt)}
                />
                <Skeleton preset="text" lines={3} />
            </div>
        </ModalStage>
    );
};

/** Active, 8-col, with its fields: every part once. */
export const ActiveForm = () => (
    <ModalStage width="md" height={640} title="Log a session" footer={<TwoCells action="Save session" />}>
        <FormFieldsStatic />
    </ModalStage>
);

const FormFieldsStatic = () => {
    const [values, setValues] = useState(FILLED);
    return <FormFields values={values} onChange={setValues} />;
};

/** The three destructive tiers, in the words Common actions uses. */
export const TierActive = () => (
    <ModalStage title="Remove from this week?" footer={<TwoCells action="Remove from this week" />}>
        {text('Ana’s Thursday session moves to the waitlist. You can add it back.')}
    </ModalStage>
);

export const TierDanger = () => (
    <ModalStage title="Delete note?" footer={<TwoCells action="Delete note" appearance="danger" />}>
        {text('This removes the note from Ana’s record. This cannot be undone.')}
    </ModalStage>
);

const GROUP_NAME = 'Fractions group';

export const TierTypeName = () => {
    const [typed, setTyped] = useState('');
    return (
        <ModalStage
            title="Delete group?"
            footer={<TwoCells action="Delete group" appearance="danger" isDisabled={typed !== GROUP_NAME} />}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--modal-stack-md)' }}>
                {text('This removes the group and its sessions. This cannot be undone.')}
                <TextField label="Group name" value={typed} onChange={(e) => setTyped(e.target.value)} caption={`Type ${GROUP_NAME} to enable Delete group.`} />
            </div>
        </ModalStage>
    );
};

/** A Modal that confirms inside itself: the view swaps, a warning SectionMessage above the danger button. */
export const ConfirmInside = ({ start = 'details' }) => {
    const [confirming, setConfirming] = useState(start === 'confirm');
    return (
        <ModalStage
            title={confirming ? 'Delete session?' : 'Session details'}
            footer={confirming
                ? <TwoCells cancel="Back" action="Delete session" appearance="danger" onCancel={() => setConfirming(false)} />
                : <TwoCells cancel="Close" action="Delete session" appearance="danger" onAction={() => setConfirming(true)} />}
        >
            {confirming
                ? <SectionMessage appearance="warning">This removes Thursday’s session for Ana and her tutor. This cannot be undone.</SectionMessage>
                : text('Thursday · 4:00–5:00 PM with Ana Ruiz.')}
        </ModalStage>
    );
};

/** Long content: the body scrolls between the pinned header and footer. */
export const LongContent = () => (
    <ModalStage title="Session history" height={360} footer={<TwoCells cancel="Close" action="Export" />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--modal-stack-md)' }}>
            {Array.from({ length: 14 }, (_, i) => text(`Session ${i + 1}: Ana Ruiz, fractions, 4:00–5:00 PM.`))}
        </div>
    </ModalStage>
);

/** Loading: no skeleton on the Modal itself; the body shows its content's own loading state. */
export const LoadingBody = () => (
    <ModalStage title="Session history" footer={<TwoCells cancel="Close" action="Export" isDisabled />}>
        <Skeleton preset="text" lines={4} />
    </ModalStage>
);

/** A page behind the real dialogs: blocked out so the Modal is what reads. */
const PageBehind = () => (
    <PatternSection title="Sessions">
        <Skeleton preset="text" lines={3} />
    </PatternSection>
);

/**
 * A confirm Modal over a Panel, drawn open: the Panel open, the confirm over it,
 * and the confirm's own Backdrop covering the Panel. Cancel or Escape closes the
 * confirm and hands focus back to the Panel's trigger.
 */
export const ConfirmOverPanel = () => {
    const [open, setOpen] = useState(true);
    const root = useRef(null);
    const close = () => {
        setOpen(false);
        root.current?.querySelector('.plus-panel .plus-btn--danger')?.focus();
    };
    useEffect(() => {
        if (open) root.current?.querySelector('.plus-pattern-modal-footer button')?.focus();
    }, [open]);
    return (
        <BrowserWindow address="app.plus.org/students" height={420}>
            <div ref={root} style={{ position: 'relative', blockSize: '100%' }} onKeyDown={(e) => { if (open && e.key === 'Escape') close(); }}>
                <div style={{ display: 'flex', blockSize: '100%', background: 'var(--ds-surface-sunken)' }}>
                    <div style={{ flex: '1 1 auto', minInlineSize: 0, padding: 'var(--page-pad)' }}><PageBehind /></div>
                    <PanelContainer width="var(--panel-width-default)">
                        <PanelHeader title="Ana Ruiz" actions={<PanelCloseAction onClick={() => {}} />} />
                        <PanelBody>
                            <Button text="Delete student" appearance="danger" onClick={() => setOpen(true)} />
                        </PanelBody>
                    </PanelContainer>
                </div>
                {open && (
                    <Backdrop inline screenWidth={SCREEN.width} screenHeight={420} style={{ position: 'absolute', inset: 0, inlineSize: '100%' }}>
                        <PatternModal
                            width="sm"
                            title="Delete student?"
                            onClose={close}
                            footer={(
                                <FooterCells bleed={MODAL_PAD}>
                                    <Button text="Cancel" shouldFitContainer style={CELL} onClick={close} />
                                    <Button text="Delete student" appearance="danger" shouldFitContainer style={CELL} onClick={close} />
                                </FooterCells>
                            )}
                        >
                            {text('This removes Ana and her sessions. This cannot be undone.')}
                        </PatternModal>
                    </Backdrop>
                )}
            </div>
        </BrowserWindow>
    );
};
