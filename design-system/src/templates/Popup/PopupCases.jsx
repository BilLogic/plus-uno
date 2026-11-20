import React, { useState } from 'react';
import { Button, Dialog, FooterActions, Popup, TextField } from '@/components';
import { OverlayContainer } from '@/lib/overlay';
import { CaseBlanket } from '@/storybook-docs/lib/case-surface.jsx';
import { PopupStage } from './popupDemo.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './PopupExamples.jsx';
import examplesSource from './PopupExamples.jsx?raw';

/**
 * The live do and don't examples on the Popup template page, composed from
 * `CaseBlanket`, `Dialog`, `Popup`, `DropdownMenu`, `FooterActions`, `TextField` and `Button`.
 */

/** The height of the stage a held-open menu has room in. Docs geometry, px. */
const MENU_STAGE = 230; // docs-literal

/** The height of the stage a form in a Popup has room in. Docs geometry, px. */
const FORM_STAGE = 300; // docs-literal

/** The height of the stage a long read has room in. Docs geometry, px. */
const LONG_READ_STAGE = 330; // docs-literal

/** Fields the person must finish sit in a Modal over a Blanket. */
export const FieldsInModalCase = () => {
    const [student, setStudent] = useState('Ana Ruiz');
    const [topic, setTopic] = useState('Two-step equations');
    return (
        <CaseBlanket height={280}>
            <Dialog
                title="Add session"
                onClose={() => {}}
                style={{ inlineSize: '100%' }}
                footer={(
                    <FooterActions>
                        <Button text="Discard" onClick={() => {}} />
                        <Button text="Save" appearance="primary" onClick={() => {}} />
                    </FooterActions>
                )}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                    <TextField label="Student" value={student} onChange={(e) => setStudent(e.target.value)} />
                    <TextField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
                </div>
            </Dialog>
        </CaseBlanket>
    );
};

/** A form placed inside a Popup closes on an outside click and loses edits. */
export const FormInPopupCase = () => {
    const [student, setStudent] = useState('Ana Ruiz');
    return (
        <PopupStage height={FORM_STAGE}>
            {(mount) => (
                <OverlayContainer container={mount} boundary={null}>
                    <Popup
                        show
                        triggerType="manual"
                        placement="bottom-start"
                        title="Add session"
                        trigger={<Button text="Add session" spacing="compact" onClick={() => {}} />}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                            <TextField label="Student" value={student} onChange={(e) => setStudent(e.target.value)} />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--inline-md)' }}>
                                <Button text="Cancel" appearance="subtle" spacing="compact" onClick={() => {}} />
                                <Button text="Save" appearance="primary" spacing="compact" onClick={() => {}} />
                            </div>
                        </div>
                    </Popup>
                </OverlayContainer>
            )}
        </PopupStage>
    );
};

/** The Show code for each example, read from `PopupExamples.jsx`. */
export const CODE = showCode(examplesSource, [
    'EndAligned',
    'StartAlignedAtEnd',
    'AsWideAsTrigger',
    'NarrowerThanTrigger',
    'AtCap',
    'LongReadInPopup',
    'OneFlatMenu',
    'PopupBesidePopup',
]);

/** A stage that holds the example's layer open inside its own box, with room under the trigger. */
const Held = ({ side, height = MENU_STAGE, children }) => (
    <PopupStage height={height} side={side}>
        {(mount) => <OverlayContainer container={mount} boundary={null}>{children}</OverlayContainer>}
    </PopupStage>
);

/** More sits at the end of the bar, so its menu aligns to its end edge and grows into the page. */
export const EndAligned = () => <Held side="end"><Example.EndAligned /></Held>;

/** An end trigger with a start-aligned menu: it runs off the edge of the page. */
export const StartAlignedAtEnd = () => <Held side="end"><Example.StartAlignedAtEnd /></Held>;

/** The Popup is at least as wide as the trigger it hangs off, so their edges line up. */
export const AsWideAsTrigger = () => <Held><Example.AsWideAsTrigger /></Held>;

/** A 3-col step under a wider trigger: the Popup ends short of it. */
export const NarrowerThanTrigger = () => <Held><Example.NarrowerThanTrigger /></Held>;

/** A content Popup at 4-col, the cap. */
export const AtCap = () => <Held><Example.AtCap /></Held>;

/** A long read in a Popup: three paragraphs at the cap. */
export const LongReadInPopup = () => <Held height={LONG_READ_STAGE}><Example.LongReadInPopup /></Held>;

/** One flat menu: a choice with two forms is two rows. */
export const OneFlatMenu = () => <Held><Example.OneFlatMenu /></Held>;

/** A menu row that opens a second Popup beside it: two layers off one trigger. */
export const PopupBesidePopup = () => <Held><Example.PopupBesidePopup /></Held>;
