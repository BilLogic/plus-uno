import React, { useState } from 'react';
import { Button, ButtonItem, DropdownMenu, FooterActions, IconButton, Popup, TextField } from '@/components';
import { Modal } from '@/templates';

/**
 * The Popup page's do and don't examples, as PLUS parts only. Show code prints
 * each one from this file; the stage that holds a layer open lives in
 * `PopupCases.jsx`.
 */

const sessionMenu = (placement) => (
    <DropdownMenu placement={placement} trigger={<IconButton icon="ellipsis" label="More" />}>
        <ButtonItem>Reschedule</ButtonItem>
        <ButtonItem>Export notes</ButtonItem>
        <ButtonItem>Duplicate session</ButtonItem>
        <ButtonItem>Cancel session</ButtonItem>
    </DropdownMenu>
);

const sessionNotes = (width, trigger) => (
    <Popup width={width} placement="bottom-start" title="Session notes" trigger={trigger}>
        Notes stay with the session. The tutor sees them first, and parents never see them.
    </Popup>
);

const wideTrigger = (size) => <Button text="Session notes" spacing="compact" style={{ inlineSize: size }} />;

export const EndAligned = () => sessionMenu('bottom-end');

export const StartAlignedAtEnd = () => sessionMenu('bottom-start');

export const AsWideAsTrigger = () => sessionNotes('auto', wideTrigger('var(--panel-width-default)'));

export const NarrowerThanTrigger = () => sessionNotes('3-col', wideTrigger('var(--panel-width-default)'));

export const AtCap = () => sessionNotes('4-col', <Button text="Notes" spacing="compact" />);

export const LongReadInPopup = () => (
    <Popup width="4-col" placement="bottom-start" title="Session notes" trigger={<Button text="Notes" spacing="compact" />}>
        <p style={{ margin: 0 }}>Notes stay with the session. The tutor sees them first, and parents never see them.</p>
        <p style={{ margin: 0 }}>Each note keeps the date it was written and who wrote it, so a later session can see what changed and why.</p>
        <p style={{ margin: 0 }}>A note can be edited for a day after it is saved. After that it is locked, and a correction is a new note.</p>
    </Popup>
);

export const OneFlatMenu = () => sessionMenu('bottom-start');

export const PopupBesidePopup = () => (
    <DropdownMenu placement="bottom-start" trigger={<IconButton icon="ellipsis" label="More" />}>
        <ButtonItem>Reschedule</ButtonItem>
        <Popup placement="right-start" trigger={<ButtonItem>Export notes</ButtonItem>}>
            Choose a format.
        </Popup>
        <ButtonItem>Cancel session</ButtonItem>
    </DropdownMenu>
);

export const FieldsInModal = () => {
    const [open, setOpen] = useState(true);
    return (
        <Modal
            show={open}
            onClose={() => setOpen(false)}
            title="Add session"
            body={(
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--modal-stack-md)' }}>
                    <TextField label="Student" defaultValue="Ana Ruiz" />
                    <TextField label="Topic" defaultValue="Two-step equations" />
                </div>
            )}
            footer={(
                <FooterActions>
                    <Button text="Discard" onClick={() => setOpen(false)} />
                    <Button text="Save" appearance="primary" onClick={() => setOpen(false)} />
                </FooterActions>
            )}
        />
    );
};

export const FormInPopup = () => (
    <Popup placement="bottom-start" title="Add session" trigger={<Button text="Add session" spacing="compact" />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
            <TextField label="Student" defaultValue="Ana Ruiz" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--inline-md)' }}>
                <Button text="Cancel" appearance="subtle" spacing="compact" />
                <Button text="Save" appearance="primary" spacing="compact" />
            </div>
        </div>
    </Popup>
);
