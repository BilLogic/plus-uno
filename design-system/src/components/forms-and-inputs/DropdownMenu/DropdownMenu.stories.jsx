import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import Button from '@/components/forms-and-inputs/Button';
import { ButtonItem, LinkItem, Section } from '@/components/forms-and-inputs/_internal/MenuGroup';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import DropdownMenu from './DropdownMenu';

export default {
    title: 'Components/Forms and inputs/Dropdown menu',
    component: DropdownMenu,
    tags: ['!dev', '!autodocs', 'new'],
    parameters: {
        docs: {
            description: {
                component: 'A trigger that opens a menu of actions or navigation items.',
            },
        },
    },
};

const onRetry = fn();

const basicMenu = (
    <>
        <ButtonItem onClick={() => {}}>Action</ButtonItem>
        <ButtonItem onClick={() => {}}>Another action</ButtonItem>
        <ButtonItem onClick={() => {}}>Something else here</ButtonItem>
    </>
);

export const Overview = () => (
    <div style={{ padding: 'var(--space-500) var(--space-150) var(--size-1000)' }}>
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
    <div style={{ display: 'flex', gap: 'var(--space-300)', padding: 'var(--space-500) var(--space-150) var(--size-1500)' }}>
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
    <div style={{ display: 'flex', gap: 'var(--space-300)', padding: 'var(--space-150) var(--space-150) var(--size-1500)' }}>
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
    <div style={{ padding: 'var(--space-150) var(--space-150) var(--size-1900)' }}>
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
    <div style={{ padding: 'var(--space-150) var(--space-150) var(--size-1400)' }}>
        <DropdownMenu trigger={<Button>Assignees</Button>} loading isOpen onOpenChange={() => {}} />
    </div>
);

Loading.play = async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByText('Loading options')).toBeInTheDocument();
    await expect(body.getByRole('menu', { hidden: true })).toHaveAttribute('aria-busy', 'true');
};

/** After a failed load the menu says so and offers Retry, which leaves the menu open. */
export const LoadFailed = () => (
    <div style={{ padding: 'var(--space-150) var(--space-150) var(--size-1400)' }}>
        <DropdownMenu trigger={<Button>Assignees</Button>} hasError onRetry={onRetry} isOpen onOpenChange={() => {}} />
    </div>
);

LoadFailed.play = async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByText("Couldn't load options")).toBeInTheDocument();
    await userEvent.click(body.getByRole('menuitem', { name: 'Retry' }));
    await expect(onRetry).toHaveBeenCalledTimes(1);
};

/* ------------------------------------------------------------------ escape */

/** Open with the keyboard, move into the menu, then Escape: closed, focus on the trigger. */
export const EscapeCloses = () => (
    <div style={{ padding: 'var(--space-150) var(--space-150) var(--size-1000)' }}>
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
        <div style={{ padding: 'var(--space-150) var(--space-150) var(--size-1400)' }}>
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
        <div style={{ padding: 'var(--space-500) var(--space-300)' }}>
            <DropdownMenu trigger={<Button>Dropdown</Button>} {...args}>
                {basicMenu}
            </DropdownMenu>
        </div>
    ),
};

/** One story per state, for the Examples tab. */
const body = (canvasElement) => within(canvasElement.ownerDocument.body);
const noop = () => {};

export const Default = {
    render: () => (
        <div style={{ padding: 'var(--space-150) var(--space-150) var(--space-150)' }}>
            <DropdownMenu trigger={<Button text="Actions" iconAfter={<i className="fa-solid fa-chevron-down" aria-hidden="true" />} />}>
                {basicMenu}
            </DropdownMenu>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByRole('button', { name: 'Actions' });
        await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    },
};

export const Open = {
    render: () => (
        <div style={{ padding: 'var(--space-150) var(--space-150) var(--size-1400)' }}>
            <DropdownMenu trigger={<Button text="Actions" />} isOpen onOpenChange={noop}>
                {basicMenu}
            </DropdownMenu>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(await body(canvasElement).findByRole('menuitem', { name: 'Action' })).toBeVisible();
        await expect(within(canvasElement).getByRole('button', { name: 'Actions' })).toHaveAttribute('aria-expanded', 'true');
    },
};

export const CompactRows = {
    render: () => (
        <div style={{ padding: 'var(--space-150) var(--space-150) var(--size-1400)' }}>
            <DropdownMenu trigger={<Button text="Compact" />} spacing="compact" isOpen onOpenChange={noop}>
                {basicMenu}
            </DropdownMenu>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const row = await body(canvasElement).findByRole('menuitem', { name: 'Action' });
        await expect(Math.round(row.getBoundingClientRect().height)).toBe(32);
    },
};

export const DisabledRow = {
    render: () => (
        <div style={{ padding: 'var(--space-150) var(--space-150) var(--size-1400)' }}>
            <DropdownMenu trigger={<Button text="Manage" />} isOpen onOpenChange={noop}>
                <ButtonItem onClick={noop}>Rename</ButtonItem>
                <ButtonItem onClick={noop} isDisabled>Archive</ButtonItem>
            </DropdownMenu>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const row = await body(canvasElement).findByRole('menuitem', { name: 'Archive' });
        await expect(row).toHaveAttribute('aria-disabled', 'true');
        await expect(getComputedStyle(row).color).toBe(tokenColor(canvasElement, '--ds-text-disabled'));
    },
};

/** A row disabled for a prerequisite the person can fix here; its description says what to do. */
export const DisabledRowWithReason = {
    render: () => (
        <div style={{ padding: 'var(--space-150) var(--space-150) var(--size-1400)' }}>
            <DropdownMenu trigger={<Button text="Manage" />} isOpen onOpenChange={noop}>
                <ButtonItem onClick={noop}>Rename</ButtonItem>
                <ButtonItem onClick={noop} isDisabled description="End the open session first">Archive</ButtonItem>
            </DropdownMenu>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const page = body(canvasElement);
        const row = await page.findByRole('menuitem', { name: /Archive/ });
        await expect(row).toHaveAttribute('aria-disabled', 'true');
        await expect(page.getByText('End the open session first')).toBeVisible();
    },
};

/** Hovered and pressed rows take the neutral subtle steps. */
export const HoveredState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={{ padding: 'var(--space-150) var(--space-150) var(--size-1400)' }}>
            <DropdownMenu trigger={<Button text="Actions" />} isOpen onOpenChange={noop}>
                {basicMenu}
            </DropdownMenu>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const row = await body(canvasElement).findByRole('menuitem', { name: 'Another action' });
        row.style.transition = 'none';
        await expect(withForcedPseudo(row, ':hover', () => getComputedStyle(row).backgroundColor), 'hovered row').toBe(tokenColor(canvasElement, '--ds-background-neutral-subtle-hovered'));
        await expect(withForcedPseudo(row, ':active', () => getComputedStyle(row).backgroundColor), 'pressed row').toBe(tokenColor(canvasElement, '--ds-background-neutral-subtle-pressed'));
    },
};

/** Keyboard focus on the trigger draws the 2px ring, 2px off the edge. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={{ padding: 'var(--space-150)' }}>
            <DropdownMenu trigger={<Button text="Actions" />}>{basicMenu}</DropdownMenu>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, within(canvasElement).getByRole('button', { name: 'Actions' }), 'trigger');
    },
};

Loading.play = async ({ canvasElement }) => {
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).queryAllByRole('menuitem')).toHaveLength(0));
    await expect(within(canvasElement).getByRole('button', { name: 'Assignees' })).toHaveAttribute('aria-expanded', 'true');
};

WithSections.play = async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Views' }));
    const page = within(canvasElement.ownerDocument.body);
    await expect(await page.findByRole('menuitem', { name: 'Rename' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('menuitem', { name: 'Open report' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
};
