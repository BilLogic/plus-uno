import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import MenuGroup, { ButtonItem, CustomItem, LinkItem, Section } from '@/components/navigation/MenuGroup';

export default {
    title: 'Components/Navigation/Menu group',
    component: MenuGroup,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        density: { control: 'select', options: ['regular', 'compact'], table: { category: 'Design' } },
    },
};

export const ButtonAndLinkItems = () => (
    <MenuGroup id="menu-basic">
        <Section title="Recent">
            <ButtonItem id="menu-item-recent">Recent board</ButtonItem>
            <LinkItem href="#" id="menu-item-recent-link">Recent doc</LinkItem>
        </Section>
        <Section title="Actions" hasSeparator>
            <ButtonItem iconBefore={<i className="fa-solid fa-plus" aria-hidden="true" />} id="menu-item-create">Create</ButtonItem>
            <ButtonItem isDisabled id="menu-item-disabled">Archive (disabled)</ButtonItem>
        </Section>
    </MenuGroup>
);

ButtonAndLinkItems.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByText('Recent board');
    await expect(first).toBeInTheDocument();
    const disabled = canvasElement.querySelector('#menu-item-disabled');
    await expect(disabled).toBeDisabled();
};

export const KeyboardNavigation = () => (
    <MenuGroup>
        <ButtonItem id="kbd-item-1">One</ButtonItem>
        <ButtonItem id="kbd-item-2">Two</ButtonItem>
        <ButtonItem id="kbd-item-3">Three</ButtonItem>
    </MenuGroup>
);

/** ArrowDown/ArrowUp move focus between items, wrapping at the ends. */
KeyboardNavigation.play = async ({ canvasElement }) => {
    const first = canvasElement.querySelector('#kbd-item-1');
    const second = canvasElement.querySelector('#kbd-item-2');
    first.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toBe(second);
    await userEvent.keyboard('{ArrowUp}');
    await expect(document.activeElement).toBe(first);
};

export const Selected = () => (
    <MenuGroup>
        <ButtonItem isSelected id="menu-item-selected">Current view</ButtonItem>
        <ButtonItem id="menu-item-other">Other view</ButtonItem>
    </MenuGroup>
);

function CustomRow() {
    const [checked, setChecked] = useState(false);
    return (
        <CustomItem component="label" description="A row rendered through the caller's own component">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /> Custom row
        </CustomItem>
    );
}

export const CustomRowExample = () => (
    <MenuGroup>
        <CustomRow />
    </MenuGroup>
);

export const Interactive = {
    args: { density: 'regular' },
    render: (args) => (
        <MenuGroup {...args}>
            <ButtonItem>Item one</ButtonItem>
            <ButtonItem>Item two</ButtonItem>
        </MenuGroup>
    ),
};
