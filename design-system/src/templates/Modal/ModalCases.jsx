import React, { useState } from 'react';
import { Button, Dialog, FooterActions, ProgressTracker, TextField } from '@/components';
import { CaseBlanket } from '@/storybook-docs/lib/case-surface.jsx';
import { stepItems } from '@/storybook-docs/lib/multi-step-task.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { SCREEN } from './modalDemo.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './ModalExamples.jsx';
import examplesSource from './ModalExamples.jsx?raw';

/**
 * The live do and don't examples on the Modal template page, composed from
 * `CaseBlanket`, `Dialog`, `FooterActions`, `ProgressTracker` and `Button`.
 */

const SESSION_NOTES = [
    'Ana solved two-step linear equations with fractions.',
    'Reviewed common denominators before moving to word problems.',
    'Asked for extra practice sets on ratio tables for next Thursday.',
    'Checked quiz corrections from Monday and noted two sign errors.',
    'Confirmed 4:30 PM start time works for both student and parent.',
    'Assigned practice set 5 in the algebra workbook.',
];

/** Past the cap the body scrolls while header and footer stay pinned. */
export const FooterPinnedModal = () => (
    <CaseBlanket height={290}>
        <Dialog
            title="Session notes"
            height="fill"
            onClose={() => {}}
            style={{ inlineSize: '100%' }}
            footer={(
                <FooterActions>
                    <Button text="Discard" onClick={() => {}} />
                    <Button text="Save" appearance="primary" onClick={() => {}} />
                </FooterActions>
            )}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                {SESSION_NOTES.map((line, i) => (
                    <p key={i} style={{ margin: 0, font: 'var(--body-default)' }}>{line}</p>
                ))}
            </div>
        </Dialog>
    </CaseBlanket>
);

/** The Save button sits inside the scrolling body instead of a pinned footer. */
export const ButtonInBodyModal = () => (
    <CaseBlanket height={290}>
        <Dialog
            title="Session notes"
            height="fill"
            showBottomButtons={false}
            onClose={() => {}}
            style={{ inlineSize: '100%' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                {SESSION_NOTES.map((line, i) => (
                    <p key={i} style={{ margin: 0, font: 'var(--body-default)' }}>{line}</p>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button text="Save" appearance="primary" onClick={() => {}} />
                </div>
            </div>
        </Dialog>
    </CaseBlanket>
);

const STEP_LABELS = ['Student', 'When', 'Review'];

/** Sequential steps use ProgressTracker and Back / Next split across the footer. */
export const StepsFooterModal = () => {
    const [at, setAt] = useState(0);
    const [student, setStudent] = useState('Ana Ruiz');
    const [slot, setSlot] = useState('Thursday · 4:30 PM');
    const last = at === STEP_LABELS.length - 1;
    return (
        <CaseBlanket height={300}>
            <Dialog
                title="Schedule a session"
                onClose={() => {}}
                style={{ inlineSize: '100%' }}
                footer={(
                    <FooterActions>
                        <Button text="Back" isDisabled={at === 0} onClick={() => setAt(at - 1)} />
                        <Button
                            text={last ? 'Schedule' : 'Next'}
                            appearance="primary"
                            onClick={() => setAt(Math.min(at + 1, STEP_LABELS.length - 1))}
                        />
                    </FooterActions>
                )}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--modal-stack-md)' }}>
                    <ProgressTracker label="Steps" orientation="horizontal" items={stepItems(STEP_LABELS, at, setAt)} />
                    {at === 0 ? (
                        <TextField label="Student" value={student} onChange={(e) => setStudent(e.target.value)} />
                    ) : null}
                    {at === 1 ? (
                        <TextField label="Time" value={slot} onChange={(e) => setSlot(e.target.value)} />
                    ) : null}
                    {at === 2 ? (
                        <p style={{ margin: 0, font: 'var(--body-default)' }}>{`${student} · ${slot}`}</p>
                    ) : null}
                </div>
            </Dialog>
        </CaseBlanket>
    );
};

/** Numbered tabs used as steps with one Save button and no Back. */
export const TabsForStepsModal = () => {
    const [student, setStudent] = useState('Ana Ruiz');
    const [slot, setSlot] = useState('Thursday · 4:30 PM');
    const tabs = [
        {
            key: 'step1',
            label: '1. Student',
            content: <TextField label="Student" value={student} onChange={(e) => setStudent(e.target.value)} />,
        },
        {
            key: 'step2',
            label: '2. When',
            content: <TextField label="Time" value={slot} onChange={(e) => setSlot(e.target.value)} />,
        },
        {
            key: 'step3',
            label: '3. Review',
            content: <p style={{ margin: 0, font: 'var(--body-default)' }}>{`${student} · ${slot}`}</p>,
        },
    ];
    return (
        <CaseBlanket height={300}>
            <Dialog
                title="Schedule a session"
                onClose={() => {}}
                style={{ inlineSize: '100%' }}
                tabs={tabs}
                footer={(
                    <FooterActions>
                        <Button text="Save" appearance="primary" onClick={() => {}} />
                    </FooterActions>
                )}
            />
        </CaseBlanket>
    );
};

/** The Show code for each example, read from `ModalExamples.jsx`. */
export const CODE = showCode(examplesSource, ['ConfirmNarrow', 'ConfirmWide', 'ConfirmsInside', 'ModalOnModal']);

/** The stand-in screen the Blanket is drawn on, scaled to the example's card so the Modal's width step reads against it. */
const OnScreen = ({ children }) => (
    <FitStage width={SCREEN.width} reflow={false}>
        <div className="sb-ds-modal-stack" style={{ '--plus-overlay-screen': `${SCREEN.width}px`, '--plus-overlay-screen-height': '300px' }}>
            {children}
        </div>
    </FitStage>
);

/** A confirm at the narrow step: the title, one line and two buttons. */
export const ConfirmNarrow = () => <OnScreen><Example.ConfirmNarrow /></OnScreen>;

/** The same confirm at a wide step: empty width around one line. */
export const ConfirmWide = () => <OnScreen><Example.ConfirmWide /></OnScreen>;

/** One Modal that confirms inside itself, with a message and its own buttons. */
export const ConfirmsInside = () => <OnScreen><Example.ConfirmsInside /></OnScreen>;

/** A Modal opened on another Modal, a second Blanket dimming the first. */
export const ModalOnModal = () => <OnScreen><Example.ModalOnModal /></OnScreen>;
