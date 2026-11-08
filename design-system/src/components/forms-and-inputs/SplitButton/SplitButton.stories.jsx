import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Button from '../Button/Button';
import IconButton from '../IconButton/IconButton';
import SplitButton from './SplitButton';
import { expectFocusRing, expectHovered, expectPressed } from '@/storybook-docs/lib/button-states.js';

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const title = (name) => name.charAt(0).toUpperCase() + name.slice(1);

export default {
    title: 'Components/Forms and inputs/Button/Split button',
    component: SplitButton,
    /** Hide CSF stories from the sidebar; docs live on SplitButton.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        children: { table: { disable: true } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

export const Overview = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.splitButton } } },
    render: () => (
        <SplitButton>
            <Button text="Save" />
            <IconButton icon="chevron-down" label="More save options" aria-haspopup="menu" aria-expanded={false} />
        </SplitButton>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const action = canvas.getByRole('button', { name: 'Save' });
        const menu = canvas.getByRole('button', { name: 'More save options' });
        await expect(action.getBoundingClientRect().height).toBe(32);
        await expect(menu.getBoundingClientRect().height).toBe(32);
        await expect(menu).toHaveAttribute('aria-haspopup', 'menu');
        // Inner corners are square; outer corners keep the radius.
        await expect(getComputedStyle(action).borderTopRightRadius).toBe('0px');
        await expect(getComputedStyle(menu).borderTopLeftRadius).toBe('0px');
        await expect(getComputedStyle(action).borderTopLeftRadius).not.toBe('0px');
        await expect(getComputedStyle(menu).borderTopRightRadius).not.toBe('0px');
    },
};

export const Appearances = {
    render: () => (
        <div style={row}>
            {['default', 'primary'].map((appearance) => (
                <SplitButton key={appearance}>
                    <Button text={title(appearance)} appearance={appearance} />
                    <IconButton icon="chevron-down" label={`More ${appearance} options`} appearance={appearance} aria-haspopup="menu" />
                </SplitButton>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Primary' })).toHaveClass('plus-btn--primary');
        await expect(canvas.getByRole('button', { name: 'More primary options' })).toHaveClass('plus-btn--primary');
    },
};

export const Spacing = {
    render: () => (
        <div style={row}>
            <SplitButton>
                <Button text="Default" />
                <IconButton icon="chevron-down" label="More default options" aria-haspopup="menu" />
            </SplitButton>
            <SplitButton>
                <Button text="Compact" spacing="compact" />
                <IconButton icon="chevron-down" label="More compact options" spacing="compact" aria-haspopup="menu" />
            </SplitButton>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'More compact options' }).getBoundingClientRect().height).toBe(24);
        await expect(canvas.getByRole('button', { name: 'Default' }).getBoundingClientRect().height).toBe(32);
    },
};

const WithMenuState = () => {
    const [open, setOpen] = useState(false);
    return (
        <SplitButton>
            <Button text="Publish" />
            <IconButton
                icon="chevron-down"
                label="More publish options"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            />
        </SplitButton>
    );
};

export const MenuState = {
    render: () => <WithMenuState />,
    play: async ({ canvasElement }) => {
        const menu = within(canvasElement).getByRole('button', { name: 'More publish options' });
        await expect(menu).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(menu);
        await expect(menu).toHaveAttribute('aria-expanded', 'true');
    },
};

export const States = {
    render: () => (
        <div style={row}>
            <SplitButton>
                <Button text="Disabled" isDisabled />
                <IconButton icon="chevron-down" label="More disabled options" isDisabled aria-haspopup="menu" />
            </SplitButton>
            <SplitButton>
                <Button text="Loading" isLoading />
                <IconButton icon="chevron-down" label="More loading options" aria-haspopup="menu" />
            </SplitButton>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Disabled' })).toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'More disabled options' })).toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
    },
};

/** Each half takes its own hovered step; the seam does not change either. */
export const HoveredState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <SplitButton>
            <Button text="Publish hover" appearance="primary" />
            <IconButton icon="chevron-down" label="More hover options" appearance="primary" aria-haspopup="menu" />
        </SplitButton>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectHovered(canvasElement, canvas.getByRole('button', { name: 'Publish hover' }), 'primary', 'primary action');
        await expectHovered(canvasElement, canvas.getByRole('button', { name: 'More hover options' }), 'primary', 'primary menu');
    },
};

/** Each half takes its own pressed step. */
export const PressedState = {
    parameters: { docs: { disable: true } },
    render: () => (
        <SplitButton>
            <Button text="Publish press" appearance="primary" />
            <IconButton icon="chevron-down" label="More press options" appearance="primary" aria-haspopup="menu" />
        </SplitButton>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectPressed(canvasElement, canvas.getByRole('button', { name: 'Publish press' }), 'primary', 'primary action');
        await expectPressed(canvasElement, canvas.getByRole('button', { name: 'More press options' }), 'primary', 'primary menu');
    },
};

/** Tabbing onto either half draws the 2px ring, raised above its neighbor. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => (
        <SplitButton>
            <Button text="Publish focus" />
            <IconButton icon="chevron-down" label="More focus options" aria-haspopup="menu" />
        </SplitButton>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectFocusRing(canvasElement, canvas.getByRole('button', { name: 'Publish focus' }), 'action');
        const menu = canvas.getByRole('button', { name: 'More focus options' });
        await expectFocusRing(canvasElement, menu, 'menu');
        menu.focus({ focusVisible: true });
        await expect(getComputedStyle(menu).zIndex, 'ring sits above the neighbor').toBe('1');
        menu.blur();
    },
};

export const Interactive = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.splitButton } } },
    render: () => (
        <SplitButton>
            <Button text="Save" />
            <IconButton icon="chevron-down" label="More save options" aria-haspopup="menu" />
        </SplitButton>
    ),
};
