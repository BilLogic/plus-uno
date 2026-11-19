import React, { useState } from 'react';
import { Button, Dialog, FooterActions, Popup, TextField } from '@/components';
import { CaseBlanket, CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { Menu, PopupStage } from './popupDemo.jsx';

/**
 * The live do and don't examples on the Popup template page, composed from
 * `CaseBlanket`, `Dialog`, `Popup`, `DropdownMenu`, `FooterActions`, `TextField` and `Button`.
 */

/** The height of the stage a held-open menu has room in. Docs geometry, px. */
const MENU_STAGE = 230; // docs-literal

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
    const [mount, setMount] = useState(null);
    const [student, setStudent] = useState('Ana Ruiz');
    return (
        <CaseSurface
            ref={setMount}
            style={{
                position: 'relative',
                boxSizing: 'border-box',
                minBlockSize: 280,
            }}
        >
            {mount ? (
                <Popup
                    show
                    triggerType="manual"
                    container={mount}
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
            ) : null}
        </CaseSurface>
    );
};

/** More sits at the end of the bar, so its menu aligns to its end edge and grows into the page. */
export const EndAligned = () => (
    <PopupStage height={MENU_STAGE} side="end">
        {(mount) => <Menu mount={mount} placement="bottom-end" />}
    </PopupStage>
);

/** An end trigger with a start-aligned menu: it runs off the edge of the page. */
export const StartAlignedAtEnd = () => (
    <PopupStage height={MENU_STAGE} side="end">
        {(mount) => <Menu mount={mount} placement="bottom-start" />}
    </PopupStage>
);
