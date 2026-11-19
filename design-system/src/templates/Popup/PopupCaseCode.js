/** The source shown behind Show code for each live example in PopupCases.jsx. */

const menu = (placement) => `<DropdownMenu
    isOpen
    placement="${placement}"
    trigger={<IconButton icon="ellipsis" label="More" />}
>
    <ButtonItem>Reschedule</ButtonItem>
    <ButtonItem>Export notes</ButtonItem>
    <ButtonItem>Duplicate session</ButtonItem>
    <ButtonItem>Cancel session</ButtonItem>
</DropdownMenu>`;

const content = (width, trigger) => `<Popup
    show
    triggerType="manual"
    width="${width}"
    placement="bottom-start"
    title="Session notes"
    trigger={${trigger}}
>
    Notes stay with the session. The tutor sees them first, and parents never see them.
</Popup>`;

const wide = (size) => `<Button text="Session notes" spacing="compact" style={{ inlineSize: ${size} }} />`;

export const CODE = {
    AsWideAsTrigger: content('auto', wide(360)),
    NarrowerThanTrigger: content('3-col', wide(360)),
    AtCap: content('4-col', '<Button text="Notes" spacing="compact" />'),
    LongReadInPopup: `<Popup
    show
    triggerType="manual"
    width="4-col"
    placement="bottom-start"
    title="Session notes"
    trigger={<Button text="Notes" spacing="compact" />}
>
    <p>Notes stay with the session. The tutor sees them first, and parents never see them.</p>
    <p>Each note keeps the date it was written and who wrote it, so a later session can see what changed and why.</p>
    <p>A note can be edited for a day after it is saved. After that it is locked, and a correction is a new note.</p>
</Popup>`,
    OneFlatMenu: menu('bottom-start'),
    PopupBesidePopup: `<DropdownMenu
    isOpen
    placement="bottom-start"
    trigger={<IconButton icon="ellipsis" label="More" />}
>
    <ButtonItem>Reschedule</ButtonItem>
    <Popup
        show
        triggerType="manual"
        placement="right-start"
        trigger={<ButtonItem>Export notes</ButtonItem>}
    >
        Choose a format.
    </Popup>
    <ButtonItem>Cancel session</ButtonItem>
</DropdownMenu>`,
    EndAligned: menu('bottom-end'),
    StartAlignedAtEnd: menu('bottom-start'),
};
