import React, { useEffect, useRef, useState } from 'react';

import { Button, PanelBody, PanelCloseAction, PanelContainer, PanelHeader, ProgressTracker, SectionMessage, Skeleton, TextField } from '@/components';
import { Blanket, FooterActions, PatternModal, PatternSection } from '@/patterns';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { stepItems } from '@/storybook-docs/lib/focused-task.jsx';
import { FormFields, FILLED } from '../Form/formDemo.jsx';

/**
 * The Modal template's examples: the real PLUS parts, placed the way each type
 * lays them out. Every footer uses the 4-track FooterActions layout inside the
 * container padding.
 */

/** The stand-in screen the docs draw the Blanket at (docs geometry, px). */
export const SCREEN = { width: 1024, height: 480 }; // docs-literal

const text = (copy) => <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>{copy}</p>;

/** A Modal at a width step, centered in its Blanket at the stand-in screen. */
export const ModalStage = ({ children, width = 'sm', height = SCREEN.height, screenWidth = SCREEN.width, ...modal }) => (
    <Blanket inline screenWidth={screenWidth} screenHeight={height}>
        <PatternModal width={width} onClose={() => {}} {...modal}>{children}</PatternModal>
    </Blanket>
);

/** Two buttons: 50/50 split across the full width, secondary (Default) left, Primary or Danger right. */
export const TwoCells = ({ secondary = 'Discard', cancel, action, appearance = 'primary', isDisabled = false, onAction, onSecondary, onCancel }) => (
    <FooterActions>
        <Button text={cancel ?? secondary} onClick={onSecondary ?? onCancel} />
        <Button text={action} appearance={appearance} isDisabled={isDisabled} onClick={onAction} />
    </FooterActions>
);

/** One button: the right half (tracks 3–4), or full width when narrow. */
export const OneCell = ({ action, onAction, narrow = false }) => (
    <FooterActions narrow={narrow}>
        <Button text={action} appearance="primary" onClick={onAction} />
    </FooterActions>
);

/** Three buttons: a quarter each in tracks 2, 3 and 4; only the rightmost is Primary. */
export const ThreeCells = ({ labels = ['Discard', 'Save draft', 'Schedule'] }) => (
    <FooterActions>
        <Button text={labels[0]} onClick={() => {}} />
        <Button text={labels[1]} onClick={() => {}} />
        <Button text={labels[2]} appearance="primary" onClick={() => {}} />
    </FooterActions>
);

/** Text (ghost) button hugging the left content edge; filled buttons in tracks 3 and 4. */
export const TextLeftCells = ({ ghost = 'Skip', secondary = 'Save draft', action = 'Schedule' }) => (
    <FooterActions>
        <Button text={ghost} appearance="subtle" onClick={() => {}} />
        <Button text={secondary} onClick={() => {}} />
        <Button text={action} appearance="primary" onClick={() => {}} />
    </FooterActions>
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

/** Steps at 10-col: the tracker in the body, Back and Next split 50/50 in the footer. */
export const Steps = ({ start = 1 }) => {
    const [at, setAt] = useState(start);
    const last = at === STEP_LABELS.length - 1;
    return (
        <ModalStage
            width="lg"
            title="Schedule a session"
            footer={(
                <FooterActions>
                    <Button text="Back" isDisabled={at === 0} onClick={() => setAt(at - 1)} />
                    <Button text={last ? 'Schedule' : 'Next'} appearance="primary" onClick={() => setAt(Math.min(at + 1, STEP_LABELS.length - 1))} />
                </FooterActions>
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
    <ModalStage title="Delete note?" footer={<TwoCells secondary="Archive instead" action="Delete note" appearance="danger" />}>
        {text('This removes the note from Ana’s record. This cannot be undone.')}
    </ModalStage>
);

const GROUP_NAME = 'Fractions group';

export const TierTypeName = () => {
    const [typed, setTyped] = useState('');
    return (
        <ModalStage
            title="Delete group?"
            footer={<TwoCells secondary="Archive instead" action="Delete group" appearance="danger" isDisabled={typed !== GROUP_NAME} />}
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
                ? <TwoCells secondary="Back" action="Delete session" appearance="danger" onSecondary={() => setConfirming(false)} />
                : <TwoCells secondary="Keep session" action="Delete session" appearance="danger" onAction={() => setConfirming(true)} />}
        >
            {confirming
                ? <SectionMessage appearance="warning" dismissible={false}>This removes Thursday’s session for Ana and her tutor. This cannot be undone.</SectionMessage>
                : text('Thursday · 4:00–5:00 PM with Ana Ruiz.')}
        </ModalStage>
    );
};

/** Long content: the body scrolls between the pinned header and footer. */
export const LongContent = () => (
    <ModalStage title="Session history" height={360} footer={<TwoCells secondary="Discard" action="Export" />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--modal-stack-md)' }}>
            {Array.from({ length: 14 }, (_, i) => text(`Session ${i + 1}: Ana Ruiz, fractions, 4:00–5:00 PM.`))}
        </div>
    </ModalStage>
);

/** Loading: no skeleton on the Modal itself; the body shows its content's own loading state. */
export const LoadingBody = () => (
    <ModalStage title="Session history" footer={<TwoCells secondary="Discard" action="Export" isDisabled />}>
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
 * and the confirm's own Blanket covering the Panel. The safer alternative or Escape
 * closes the confirm and hands focus back to the Panel's trigger.
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
                <div style={{ display: 'flex', blockSize: '100%', background: 'var(--ds-surface)' }}>
                    <div style={{ flex: '1 1 auto', minInlineSize: 0, padding: 'var(--page-pad)' }}><PageBehind /></div>
                    <PanelContainer width="var(--panel-width-default)">
                        <PanelHeader title="Ana Ruiz" actions={<PanelCloseAction onClick={() => {}} />} />
                        <PanelBody>
                            <Button text="Delete student" appearance="danger" onClick={() => setOpen(true)} />
                        </PanelBody>
                    </PanelContainer>
                </div>
                {open && (
                    <Blanket inline screenWidth={SCREEN.width} screenHeight={420} style={{ position: 'absolute', inset: 0, inlineSize: '100%' }}>
                        <PatternModal
                            width="sm"
                            title="Delete student?"
                            onClose={close}
                            footer={(
                                <FooterActions>
                                    <Button text="Archive instead" onClick={close} />
                                    <Button text="Delete student" appearance="danger" onClick={close} />
                                </FooterActions>
                            )}
                        >
                            {text('This removes Ana and her sessions. This cannot be undone.')}
                        </PatternModal>
                    </Blanket>
                )}
            </div>
        </BrowserWindow>
    );
};
