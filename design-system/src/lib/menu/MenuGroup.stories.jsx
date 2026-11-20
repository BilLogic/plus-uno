import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expectGroundUnder } from '@/storybook-docs/lib/label-states.js';
import { expectInk } from '@/storybook-docs/lib/navigation-states.js';
import { MenuGroup, ButtonItem, CustomItem, LinkItem, Section } from '@/lib/menu';
import { Checkbox } from '@/components';
import { iconClass } from '../icon';

export default {
    title: 'Components/Forms and inputs/Menu items',
    component: MenuGroup,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        spacing: { control: 'select', options: ['default', 'compact', 'spacious'], table: { category: 'Design' } },
    },
};

export const ButtonAndLinkItems = () => (
    <MenuGroup id="menu-basic">
        <Section title="Recent">
            <ButtonItem id="menu-item-recent">Recent board</ButtonItem>
            <LinkItem href="#" id="menu-item-recent-link">Recent doc</LinkItem>
        </Section>
        <Section title="Actions" hasSeparator>
            <ButtonItem elemBefore={<i className={iconClass('plus')} aria-hidden="true" />} id="menu-item-create">Create</ButtonItem>
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
        <CustomItem component="span" description="A row rendered through the caller's own component">
            <Checkbox label="Custom row" isChecked={checked} onChange={(e) => setChecked(e.target.checked)} />
        </CustomItem>
    );
}

export const CustomRowExample = () => (
    <MenuGroup>
        <CustomRow />
    </MenuGroup>
);

/** Spacing: default rows (32), compact rows (24) and spacious rows (40). */
export const Spacing = () => (
    <div style={{ display: 'flex', gap: 'var(--inline-lg)', flexWrap: 'wrap' }}>
        {['default', 'compact', 'spacious'].map((spacing) => (
            <MenuGroup key={spacing} spacing={spacing} id={`menu-spacing-${spacing}`}>
                <ButtonItem>{spacing} one</ButtonItem>
                <ButtonItem>{spacing} two</ButtonItem>
            </MenuGroup>
        ))}
    </div>
);

Spacing.play = async ({ canvasElement }) => {
    for (const [spacing, height] of [['default', 32], ['compact', 24], ['spacious', 40]]) {
        const rows = canvasElement.querySelectorAll(`#menu-spacing-${spacing} .plus-menu-item`);
        for (const row of rows) await expect(row.getBoundingClientRect().height).toBe(height);
    }
};

/** A description grows past the spacing floor in every spacing. */
export const MultilineSpacing = {
    render: () => (
        <div>
            {['default', 'compact', 'spacious'].map((spacing) => (
                <MenuGroup key={spacing} spacing={spacing}>
                    <ButtonItem description="A second line">{spacing}</ButtonItem>
                </MenuGroup>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const rows = canvasElement.querySelectorAll('.plus-menu-item');
        await expect(rows[0].getBoundingClientRect().height).toBeGreaterThan(32);
        await expect(rows[1].getBoundingClientRect().height).toBeGreaterThan(24);
        await expect(rows[2].getBoundingClientRect().height).toBeGreaterThan(40);
    },
};

export const Interactive = {
    args: { spacing: 'default' },
    render: (args) => (
        <MenuGroup {...args}>
            <ButtonItem>Item one</ButtonItem>
            <ButtonItem>Item two</ButtonItem>
        </MenuGroup>
    ),
};

/* ------------------------------------------------------------------- states */

const StateMenu = () => (
    <MenuGroup>
        <ButtonItem id="state-item">Rename board</ButtonItem>
        <ButtonItem isSelected id="state-selected">Current board</ButtonItem>
        <ButtonItem isDisabled id="state-disabled">Archive board</ButtonItem>
        <LinkItem href="#" isDisabled id="state-disabled-link">Open archive</LinkItem>
        <LinkItem href="#" id="state-link">Open in a new view</LinkItem>
    </MenuGroup>
);
const itemOf = (canvasElement, id) => canvasElement.querySelector(`#state-${id}`);

/** Rest: a row is body ink on a clear ground; the selected row is marked with aria-current. */
export const Rest = {
    render: () => <StateMenu />,
    play: async ({ canvasElement }) => {
        const item = itemOf(canvasElement, 'item');
        await expectInk(canvasElement, item, undefined, '--ds-text', 'item');
        await expect(getComputedStyle(item).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        await expect(itemOf(canvasElement, 'selected')).toHaveAttribute('aria-current', 'true');
    },
};

/** Hovered: the subtle neutral hovered fill, on buttons and links alike. */
export const Hovered = {
    render: () => <StateMenu />,
    play: async ({ canvasElement }) => {
        for (const id of ['item', 'link']) {
            await expectGroundUnder(canvasElement, itemOf(canvasElement, id), ':hover', '--ds-background-neutral-subtle-hovered', `${id} row`);
        }
    },
};

/** Pressed: the subtle neutral pressed fill. */
export const Pressed = {
    render: () => <StateMenu />,
    play: async ({ canvasElement }) => {
        for (const id of ['item', 'link']) {
            await expectGroundUnder(canvasElement, itemOf(canvasElement, id), ':active', '--ds-background-neutral-subtle-pressed', `${id} row`);
        }
    },
};

/** Focused: the 2px ring, 2px off the row; Arrow Down moves it to the next enabled row. */
export const Focused = {
    render: () => <StateMenu />,
    play: async ({ canvasElement }) => {
        const item = itemOf(canvasElement, 'item');
        // Inset: a row spans the scrolling menu's full width, so a ring outside it would be clipped.
        await expectFocusRing(canvasElement, item, 'menu row', -2);
        item.focus();
        await userEvent.keyboard('{ArrowDown}');
        await expect(itemOf(canvasElement, 'selected')).toHaveFocus();
    },
};

/** Selected: the selected fill marks the current row. */
export const SelectedRow = {
    render: () => <StateMenu />,
    play: async ({ canvasElement }) => {
        await expectGroundUnder(canvasElement, itemOf(canvasElement, 'selected'), undefined, '--ds-background-selected', 'selected row');
    },
};

/** Disabled: disabled ink, no pointer events, skipped by the arrow keys. */
export const Disabled = {
    render: () => <StateMenu />,
    play: async ({ canvasElement }) => {
        const disabled = itemOf(canvasElement, 'disabled');
        await expect(disabled).toBeDisabled();
        await expectInk(canvasElement, disabled, undefined, '--ds-text-disabled', 'disabled row');
        await expect(getComputedStyle(disabled).pointerEvents, 'a pointer never reaches it').toBe('none');
        itemOf(canvasElement, 'selected').focus();
        await userEvent.keyboard('{ArrowDown}');
        await expect(itemOf(canvasElement, 'link'), 'disabled button and link rows are skipped').toHaveFocus();
        await expect(itemOf(canvasElement, 'disabled-link')).toHaveAttribute('aria-disabled', 'true');
    },
};
