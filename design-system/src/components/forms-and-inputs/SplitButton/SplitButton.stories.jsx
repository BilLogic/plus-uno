import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import SplitButton, { SPLIT_BUTTON_APPEARANCES } from './SplitButton';

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const title = (name) => name.charAt(0).toUpperCase() + name.slice(1);

export default {
    title: 'Components/Forms and inputs/Button/Split button',
    component: SplitButton,
    /** Hide CSF stories from the sidebar; docs live on SplitButton.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'added', summary: 'Split button: a button joined to a chevron that opens a menu, with `appearance` (default, primary), `spacing`, a required `menuLabel`, `onMenuClick` and `isMenuExpanded`.' },
        ],
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        text: { control: 'text', table: { category: 'Content' } },
        menuLabel: { control: 'text', description: 'The chevron\'s accessible name', table: { category: 'Content' } },
        appearance: { control: 'select', options: SPLIT_BUTTON_APPEARANCES, table: { category: 'Design' } },
        spacing: { control: 'inline-radio', options: ['default', 'compact'], table: { category: 'Design' } },
        isMenuExpanded: { control: 'boolean', table: { category: 'Behavior' } },
        isDisabled: { control: 'boolean', table: { category: 'Behavior' } },
        isLoading: { control: 'boolean', table: { category: 'Behavior' } },
        onClick: { table: { disable: true } },
        onMenuClick: { table: { disable: true } },
    },
    args: { text: 'Save', menuLabel: 'More save options', appearance: 'default', spacing: 'default' },
};

export const Overview = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.splitButton } } },
    render: (args) => <SplitButton {...args} />,
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
            {SPLIT_BUTTON_APPEARANCES.map((appearance) => (
                <SplitButton key={appearance} text={title(appearance)} menuLabel={`More ${appearance} options`} appearance={appearance} />
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
            <SplitButton text="Default" menuLabel="More default options" />
            <SplitButton text="Compact" menuLabel="More compact options" spacing="compact" />
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
    return <SplitButton text="Publish" menuLabel="More publish options" isMenuExpanded={open} onMenuClick={() => setOpen(!open)} />;
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
            <SplitButton text="Disabled" menuLabel="More disabled options" isDisabled />
            <SplitButton text="Loading" menuLabel="More loading options" isLoading />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Disabled' })).toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'More disabled options' })).toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
    },
};

export const Interactive = {
    render: (args) => <SplitButton {...args} />,
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.splitButton } } },
};
