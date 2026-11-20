import React from 'react';
import { ButtonItem, DropdownMenu, IconButton, Select, Tooltip } from '@/components';

/**
 * The Disabled page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file; the surface that holds them lives in
 * `DisabledCases.jsx`.
 */

export const ReasonInCaption = () => (
    <Select label="Group" options={[]} value={null} onChange={() => {}} isDisabled caption="Choose a school first." />
);

export const ReasonInTooltip = () => (
    <Tooltip text="Choose a school first." placement="bottom">
        <div style={{ inlineSize: '100%' }}>
            <Select label="Group" options={[]} value={null} onChange={() => {}} isDisabled />
        </div>
    </Tooltip>
);

const moreTrigger = <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={() => {}} />;

export const LeftOutOfMenu = () => (
    <DropdownMenu placement="bottom-end" minWidth="var(--menu-group-min-width)" trigger={moreTrigger}>
        <ButtonItem onClick={() => {}}>Edit</ButtonItem>
        <ButtonItem onClick={() => {}}>Remove from group</ButtonItem>
    </DropdownMenu>
);

export const DimmedInMenu = () => (
    <DropdownMenu placement="bottom-end" minWidth="var(--menu-group-min-width)" trigger={moreTrigger}>
        <ButtonItem onClick={() => {}}>Edit</ButtonItem>
        <ButtonItem onClick={() => {}}>Remove from group</ButtonItem>
        <ButtonItem isDisabled onClick={() => {}}>Delete school</ButtonItem>
    </DropdownMenu>
);
