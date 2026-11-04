import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import Button from '@/components/forms-and-inputs/Button';
import { ButtonItem, LinkItem, Section } from '@/components/navigation/MenuGroup';
import DropdownMenu from './DropdownMenu';

export default {
    title: 'Components/Forms and inputs/Dropdown menu',
    component: DropdownMenu,
    tags: ['!dev', '!autodocs', 'new'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'added', summary: 'DropdownMenu replaced Dropdown: it opens the public Menu family (`MenuGroup`, `ButtonItem`, `LinkItem`, `CustomItem`, `Section`) on Base UI Menu, with `trigger`, `isOpen`/`onOpenChange`, `placement`, `shouldFlip`, `spacing` and `testId`.' },
        ],
        docs: {
            description: {
                component: 'A trigger that opens a menu of actions or navigation items.',
            },
        },
    },
};

const basicMenu = (
    <>
        <ButtonItem onClick={() => {}}>Action</ButtonItem>
        <ButtonItem onClick={() => {}}>Another action</ButtonItem>
        <ButtonItem onClick={() => {}}>Something else here</ButtonItem>
    </>
);

export const Overview = () => (
    <div style={{ padding: '100px 24px 160px' }}>
        <DropdownMenu trigger={<Button text="Dropdown" iconAfter={<i className="fa-solid fa-chevron-down" aria-hidden="true" />} />}>
            {basicMenu}
        </DropdownMenu>
    </div>
);

Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Dropdown' });

    // The default pattern (Button + chevron) shows selected while open.
    await expect(toggle).not.toHaveClass('plus-btn--selected');
    await userEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveClass('plus-btn--selected'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(toggle).not.toHaveClass('plus-btn--selected'));
};

export const Placements = () => (
    <div style={{ display: 'flex', gap: '48px', padding: '100px 24px 240px' }}>
        <DropdownMenu trigger={<Button>Bottom start</Button>} placement="bottom-start">
            {basicMenu}
        </DropdownMenu>
        <DropdownMenu trigger={<Button>Bottom end</Button>} placement="bottom-end">
            {basicMenu}
        </DropdownMenu>
        <DropdownMenu trigger={<Button>Top start</Button>} placement="top-start">
            {basicMenu}
        </DropdownMenu>
    </div>
);

export const Spacing = () => (
    <div style={{ display: 'flex', gap: '48px', padding: '24px 24px 240px' }}>
        <DropdownMenu trigger={<Button>Cozy</Button>} spacing="cozy">
            {basicMenu}
        </DropdownMenu>
        <DropdownMenu trigger={<Button>Compact</Button>} spacing="compact">
            {basicMenu}
        </DropdownMenu>
    </div>
);

Spacing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Cozy' }));
    const cozyRow = await body.findByRole('menuitem', { name: 'Action' });
    await expect(Math.round(cozyRow.getBoundingClientRect().height), 'cozy rows are 40').toBe(40);
    await userEvent.keyboard('{Escape}');

    await userEvent.click(canvas.getByRole('button', { name: 'Compact' }));
    const compactRow = await body.findByRole('menuitem', { name: 'Action' });
    await expect(Math.round(compactRow.getBoundingClientRect().height), 'compact rows are 32').toBe(32);
};

export const WithSections = () => (
    <div style={{ padding: '24px 24px 280px' }}>
        <DropdownMenu trigger={<Button>Views</Button>}>
            <Section title="Manage">
                <ButtonItem onClick={() => {}}>Rename</ButtonItem>
                <ButtonItem onClick={() => {}} isDisabled>Archive</ButtonItem>
            </Section>
            <Section title="Go to" hasSeparator>
                <LinkItem href="#report">Open report</LinkItem>
            </Section>
        </DropdownMenu>
    </div>
);

export const Loading = () => (
    <div style={{ padding: '24px 24px 200px' }}>
        <DropdownMenu trigger={<Button>Assignees</Button>} loading isOpen onOpenChange={() => {}} />
    </div>
);

/* ------------------------------------------------------------------ escape */

/** Open with the keyboard, move into the menu, then Escape: closed, focus on the trigger. */
export const EscapeCloses = () => (
    <div style={{ padding: '24px 24px 160px' }}>
        <DropdownMenu trigger={<Button>Actions</Button>}>
            <ButtonItem onClick={() => {}}>Rename</ButtonItem>
            <ButtonItem onClick={() => {}}>Archive</ButtonItem>
        </DropdownMenu>
    </div>
);

EscapeCloses.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(body.getByRole('menuitem', { name: 'Rename' })).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menuitem', { name: 'Rename' }), 'the menu is gone').toBeNull());
    await expect(trigger, 'focus is back on the trigger').toHaveFocus();
};

/* --------------------------------------------------------- keyboard nav */

/**
 * ArrowDown/ArrowUp move the roving cursor between rows; Enter picks the row
 * at the cursor.
 */
export const MenuKeyboardNavigation = () => {
    const [picked, setPicked] = React.useState('');
    return (
        <div style={{ padding: '24px 24px 200px' }}>
            <p data-testid="picked">{picked}</p>
            <DropdownMenu trigger={<Button>Actions</Button>}>
                <ButtonItem onClick={() => setPicked('Rename')}>Rename</ButtonItem>
                <ButtonItem onClick={() => setPicked('Duplicate')}>Duplicate</ButtonItem>
                <ButtonItem onClick={() => setPicked('Archive')}>Archive</ButtonItem>
            </DropdownMenu>
        </div>
    );
};

MenuKeyboardNavigation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');

    const rename = await body.findByRole('menuitem', { name: 'Rename' });
    rename.focus();
    await expect(rename).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect(body.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect(body.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    await expect(body.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByTestId('picked')).toHaveTextContent('Duplicate');
};

export const Interactive = {
    args: {
        placement: 'bottom-start',
        spacing: 'cozy',
        shouldFlip: true,
    },
    render: (args) => (
        <div style={{ padding: '100px 50px' }}>
            <DropdownMenu trigger={<Button>Dropdown</Button>} {...args}>
                {basicMenu}
            </DropdownMenu>
        </div>
    ),
};
