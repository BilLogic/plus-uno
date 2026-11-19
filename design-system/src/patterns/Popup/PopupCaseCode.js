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

export const CODE = {
    EndAligned: menu('bottom-end'),
    StartAlignedAtEnd: menu('bottom-start'),
};
