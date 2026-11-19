import React from 'react';
import { Button, ButtonItem, DropdownMenu, IconButton, Popup } from '@/components';

/**
 * The Popup page's do and don't examples, as PLUS parts only. Show code prints
 * each one from this file; the stage that holds a layer open lives in
 * `PopupCases.jsx`.
 */

const SessionMenu = ({ placement }) => (
    <DropdownMenu isOpen placement={placement} trigger={<IconButton icon="ellipsis" label="More" />}>
        <ButtonItem>Reschedule</ButtonItem>
        <ButtonItem>Export notes</ButtonItem>
        <ButtonItem>Duplicate session</ButtonItem>
        <ButtonItem>Cancel session</ButtonItem>
    </DropdownMenu>
);

const SessionNotes = ({ width, trigger }) => (
    <Popup show triggerType="manual" width={width} placement="bottom-start" title="Session notes" trigger={trigger}>
        Notes stay with the session. The tutor sees them first, and parents never see them.
    </Popup>
);

const wideTrigger = (size) => <Button text="Session notes" spacing="compact" style={{ inlineSize: size }} />;

export const EndAligned = () => <SessionMenu placement="bottom-end" />;

export const StartAlignedAtEnd = () => <SessionMenu placement="bottom-start" />;

export const AsWideAsTrigger = () => <SessionNotes width="auto" trigger={wideTrigger('var(--panel-width-default)')} />;

export const NarrowerThanTrigger = () => <SessionNotes width="3-col" trigger={wideTrigger('var(--panel-width-default)')} />;

export const AtCap = () => <SessionNotes width="4-col" trigger={<Button text="Notes" spacing="compact" />} />;

export const LongReadInPopup = () => (
    <Popup show triggerType="manual" width="4-col" placement="bottom-start" title="Session notes" trigger={<Button text="Notes" spacing="compact" />}>
        <p style={{ margin: 0 }}>Notes stay with the session. The tutor sees them first, and parents never see them.</p>
        <p style={{ margin: 0 }}>Each note keeps the date it was written and who wrote it, so a later session can see what changed and why.</p>
        <p style={{ margin: 0 }}>A note can be edited for a day after it is saved. After that it is locked, and a correction is a new note.</p>
    </Popup>
);

export const OneFlatMenu = () => <SessionMenu placement="bottom-start" />;

export const PopupBesidePopup = () => (
    <DropdownMenu isOpen placement="bottom-start" trigger={<IconButton icon="ellipsis" label="More" />}>
        <ButtonItem>Reschedule</ButtonItem>
        <Popup show triggerType="manual" placement="right-start" trigger={<ButtonItem>Export notes</ButtonItem>}>
            Choose a format.
        </Popup>
        <ButtonItem>Cancel session</ButtonItem>
    </DropdownMenu>
);
