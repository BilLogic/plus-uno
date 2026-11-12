import React, { useRef, useState } from 'react';

import { Button, Fieldset, PanelBody, PanelCloseAction, PanelContainer, PanelFooter, PanelHeader, SectionMessage, Select, Skeleton, TextField } from '@/components';
import { Backdrop, PatternModal, PatternSection } from '@/patterns';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { CELL, FooterCells } from '@/storybook-docs/lib/full-bleed-footer.jsx';
import { BAR_TOKEN, FocusedType, WINDOW_HEIGHT } from '@/storybook-docs/lib/focused-task.jsx';

/**
 * The Form template's examples. There is no Form component: a form is the
 * fields, grouped in a Fieldset, inside one of four hosts, and the host sets the
 * footer. Everything here composes real PLUS components; the full-bleed footer
 * and the in-place sending button are composed from Button, because the Modal
 * and the Panel have no footer prop for either yet.
 */

/** The Modal's own pad, which a full-bleed footer cancels. */
const MODAL_PAD = '--modal-pad-x-default';

/** The Modal's corner radius, which the full-bleed footer's bottom corners follow. */
const HOST_RADIUS = '--modal-radius';


/** The Modal's stand-in screen on the docs page: docs geometry, in px. */
/** A page form needs more room than the other windows: the fields, the footer below them, and a server message above. */
const PAGE_HEIGHT = 540; // docs-literal

export const SCREEN = { width: 1024, height: 580 }; // docs-literal

const SUBJECTS = [
    { value: 'algebra', label: 'Algebra I' },
    { value: 'geometry', label: 'Geometry' },
    { value: 'reading', label: 'Reading' },
];

/** The form's fields, the same in every host. `errors` marks a field; `values` and `onChange` make it live. */
export const FormFields = ({ values, onChange, errors = {}, onBlurField, subjectWaits = false, setRef }) => (
    <Fieldset legend="Session">
        <TextField
            label="Student"
            isRequired
            value={values.student}
            onChange={(e) => onChange({ ...values, student: e.target.value })}
            onBlur={() => onBlurField?.('student')}
            isInvalid={Boolean(errors.student)}
            errorMessage={errors.student}
            caption="First and last name, as on the roster."
            inputRef={setRef?.('student')}
        />
        <Select
            label="Subject"
            isRequired
            options={SUBJECTS}
            value={values.subject}
            onChange={(v) => onChange({ ...values, subject: v })}
            isDisabled={subjectWaits}
            isInvalid={Boolean(errors.subject)}
            errorMessage={errors.subject}
            caption={subjectWaits ? 'Choose a student first.' : undefined}
        />
        <TextField
            label="Notes (optional)"
            value={values.notes}
            onChange={(e) => onChange({ ...values, notes: e.target.value })}
        />
    </Fieldset>
);

export const EMPTY = { student: '', subject: '', notes: '' };
export const FILLED = { student: 'Ana Ruiz', subject: 'algebra', notes: '' };

/** Every required field the form is missing, as `{ field: message }`. */
export const missing = (values) => ({
    ...(values.student.trim() ? {} : { student: 'Enter the student’s name.' }),
    ...(values.subject ? {} : { subject: 'Choose a subject.' }),
});

/** A docs picture's after-state: the missing fields, all of them or only those named. */
const marksFor = (values, marked) => {
    const found = missing(values);
    if (marked === true) return found;
    return Object.fromEntries(Object.entries(found).filter(([name]) => [].concat(marked).includes(name)));
};

/** A server's refusal, shown at the top of the form. */
export const SERVER_MESSAGE = 'The session was not saved. Ana Ruiz already has a session at 4:00 PM on Thursday. Pick another time.';

/** The message slot at the top of a form: a danger SectionMessage, announced when it appears. */
export const FormMessage = ({ children }) => (
    <div data-probe="message">
        <SectionMessage appearance="danger" title="Could not save">{children}</SectionMessage>
    </div>
);

/** Left-aligned under the fields, Primary first, Cancel Subtle: a form on its own page. */
export const PageFooter = ({ sending, onSave }) => (
    <div data-probe="footer" style={{ display: 'flex', gap: 'var(--stack-md)', marginBlockStart: `var(${BAR_TOKEN})` }}>
        <Button text="Save session" appearance="primary" isLoading={sending} onClick={onSave} />
        <Button text="Cancel" appearance="subtle" onClick={() => {}} />
    </div>
);

/**
 * Full bleed: two fixed cells, 48 high, each button filling its half. Primary
 * is furthest right. A sending button swaps its label for a spinner in place,
 * so the cells never change size, and only that button disables.
 */
export const FullBleedFooter = ({ sending, onSave, onCancel, primary = 'Save session', cancel = 'Cancel', cancelAppearance = 'default', bleed }) => (
    <FooterCells bleed={bleed} radius={HOST_RADIUS}>
        <Button text={cancel} appearance={cancelAppearance} shouldFitContainer onClick={onCancel} style={CELL} />
        <Button text={primary} appearance="primary" shouldFitContainer isLoading={sending} onClick={onSave} style={CELL} />
    </FooterCells>
);

/** A page body made of placeholder bars, so the form is what reads. */
const Behind = () => (
    <PatternSection title="Sessions">
        <Skeleton preset="text" lines={3} />
    </PatternSection>
);

/** The fields' state, with the blur, submit and server rules each host shares. */
const useFormState = ({ initial = EMPTY, sendingForever = false, server = false, marked = false, sending: sendingNow = false } = {}) => {
    const [values, setValues] = useState(initial);
    // `marked` draws the state after a press or a blur, for a docs picture that cannot run a play.
    const [errors, setErrors] = useState(() => (marked ? marksFor(initial, marked) : {}));
    const [sending, setSending] = useState(sendingNow);
    const [serverError, setServerError] = useState(server);
    const refs = useRef({});
    const setRef = (name) => (el) => { refs.current[name] = el; };
    const onBlurField = (name) => setErrors((e) => ({ ...e, [name]: missing(values)[name] }));
    const submit = () => {
        const found = missing(values);
        setErrors(found);
        const first = Object.keys(found)[0];
        if (first) { refs.current[first]?.focus(); return false; }
        if (sendingForever) setSending(true);
        return true;
    };
    return { values, setValues, errors, sending, serverError, setServerError, setRef, onBlurField, submit };
};

/** A form in a page: in a Section with the subtle fill, buttons left under the fields. */
export const FormInPage = ({ initial, server, subjectWaits, sendingForever, marked, sending }) => {
    const f = useFormState({ initial, server, sendingForever, marked, sending });
    return (
        <BrowserWindow address="app.plus.org/settings/sessions" height={PAGE_HEIGHT}>
            <InAppFrame height="100%" panelStorageKey={null}>
                <PatternSection title="Log a session" fill="subtle">
                    {f.serverError && <FormMessage>{SERVER_MESSAGE}</FormMessage>}
                    <FormFields values={f.values} onChange={f.setValues} errors={f.errors} onBlurField={f.onBlurField} subjectWaits={subjectWaits} setRef={f.setRef} />
                    <PageFooter sending={f.sending} onSave={f.submit} />
                </PatternSection>
            </InAppFrame>
        </BrowserWindow>
    );
};

/** A form in a Panel: the page stays in view, the footer is full bleed and shows only while editing. */
export const FormInPanel = () => {
    const f = useFormState();
    return (
        <BrowserWindow address="app.plus.org/students" height={WINDOW_HEIGHT}>
            <div style={{ display: 'flex', blockSize: '100%', background: 'var(--ds-surface-sunken)' }}>
                <div style={{ flex: '1 1 auto', minInlineSize: 0, padding: 'var(--page-pad)' }}><Behind /></div>
                <PanelContainer width="var(--panel-width-default)">
                    <PanelHeader title="Ana Ruiz" actions={<PanelCloseAction onClick={() => {}} />} />
                    <PanelBody data-probe="body">
                        <FormFields values={f.values} onChange={f.setValues} errors={f.errors} onBlurField={f.onBlurField} setRef={f.setRef} />
                    </PanelBody>
                    <PanelFooter style={{ padding: 0 }}>
                        <FullBleedFooter onSave={f.submit} onCancel={() => {}} primary="Save" />
                    </PanelFooter>
                </PanelContainer>
            </div>
        </BrowserWindow>
    );
};

/**
 * A form in a Modal, 8-col: header and footer pinned, the body scrolling between.
 * A blocked submit keeps it open, a server refusal puts a danger message at the
 * top of the body, and Close with edits asks first in the same Modal.
 */
export const FormInModal = ({ initial, server, sendingForever, marked, sending, height = 'hug', stageHeight = SCREEN.height, screenHeight = stageHeight }) => {
    const f = useFormState({ initial, server, sendingForever, marked, sending });
    const [confirming, setConfirming] = useState(false);
    const dirty = f.values.student !== '' || f.values.notes !== '';
    const close = () => { if (dirty) setConfirming(true); };
    return (
        <BrowserWindow address="app.plus.org/students" height={stageHeight}>
            <Backdrop inline screenWidth={SCREEN.width} screenHeight={screenHeight}>
                {confirming ? (
                    <PatternModal
                        width="sm"
                        title="Discard changes?"
                        onClose={() => setConfirming(false)}
                        footer={(
                            <FullBleedFooter
                                bleed={MODAL_PAD}
                                primary="Discard"
                                cancel="Back"
                                onCancel={() => setConfirming(false)}
                                onSave={() => { f.setValues(EMPTY); setConfirming(false); }}
                            />
                        )}
                    >
                        <SectionMessage appearance="warning">Your edits to this session will be lost.</SectionMessage>
                    </PatternModal>
                ) : (
                    <PatternModal
                        width="md"
                        height={height}
                        title="Log a session"
                        onClose={close}
                        footer={<FullBleedFooter bleed={MODAL_PAD} sending={f.sending} onSave={f.submit} onCancel={close} />}
                    >
                        {f.serverError && <FormMessage>{SERVER_MESSAGE}</FormMessage>}
                        <FormFields values={f.values} onChange={f.setValues} errors={f.errors} onBlurField={f.onBlurField} setRef={f.setRef} />
                    </PatternModal>
                )}
            </Backdrop>
        </BrowserWindow>
    );
};

/** A form in steps: Frame · focused, the form's groups one per step in the body. */
export const FormInSteps = ({ start = 0 }) => {
    const f = useFormState();
    return (
        <FocusedType address="app.plus.org/sessions/new" labels={['Student', 'Schedule', 'Notes', 'Review']} start={start} title="Log a session">
            <FormFields values={f.values} onChange={f.setValues} errors={f.errors} onBlurField={f.onBlurField} setRef={f.setRef} />
        </FocusedType>
    );
};
