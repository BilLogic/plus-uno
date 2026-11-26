import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { Button, Icon, IconButton } from '@/components';
import SplitButton from './SplitButton';
import { expectFocusRing, expectHovered, expectPressed } from '@/storybook-docs/lib/button-states.js';
import { px, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { LONG_SCHOOL, expectNoSilentClip, expectInsideWell } from '../../_internal/overflowPlays';

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--stack-xl) var(--inline-xl)', alignItems: 'center' };
const title = (name) => name.charAt(0).toUpperCase() + name.slice(1);
const angleDown = <Icon name="angle-down" size={12} />;

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
            <IconButton icon={angleDown} label="More save options" aria-haspopup="menu" aria-expanded={false} />
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
        await expect(px(getComputedStyle(menu.querySelector('.plus-btn-visual i')).fontSize), 'chevron trigger icon is --icon-sm').toBe(tokenLength(canvasElement, '--icon-sm'));
    },
};

export const Appearances = {
    render: () => (
        <div style={row}>
            {['default', 'primary'].map((appearance) => (
                <SplitButton key={appearance}>
                    <Button text={title(appearance)} appearance={appearance} />
                    <IconButton icon={angleDown} label={`More ${appearance} options`} appearance={appearance} aria-haspopup="menu" />
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
                <IconButton icon={angleDown} label="More default options" aria-haspopup="menu" />
            </SplitButton>
            <SplitButton>
                <Button text="Compact" spacing="compact" />
                <IconButton icon={angleDown} label="More compact options" spacing="compact" aria-haspopup="menu" />
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
                icon={angleDown}
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
                <IconButton icon={angleDown} label="More disabled options" isDisabled aria-haspopup="menu" />
            </SplitButton>
            <SplitButton>
                <Button text="Loading" isLoading />
                <IconButton icon={angleDown} label="More loading options" aria-haspopup="menu" />
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
            <IconButton icon={angleDown} label="More hover options" appearance="primary" aria-haspopup="menu" />
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
            <IconButton icon={angleDown} label="More press options" appearance="primary" aria-haspopup="menu" />
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
            <IconButton icon={angleDown} label="More focus options" aria-haspopup="menu" />
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
            <IconButton icon={angleDown} label="More save options" aria-haspopup="menu" />
        </SplitButton>
    ),
};

/** Truncate: the action's label ends in an ellipsis; the menu button keeps its place and both stay in the split button's well. */
export const Overflow = {
    render: () => (
        <div style={{ width: '220px' /* demo frame */ }}>
            <SplitButton>
                <Button text={LONG_SCHOOL} />
                <IconButton icon={angleDown} label="More save options" aria-haspopup="menu" aria-expanded={false} />
            </SplitButton>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const action = canvas.getByRole('button', { name: LONG_SCHOOL });
        const menu = canvas.getByRole('button', { name: 'More save options' });
        await expectNoSilentClip(canvasElement);
        await expectInsideWell(menu, canvasElement.firstElementChild);
        // The exception: a button label ends in an ellipsis with no Tooltip; the full label stays in the accessible name.
        await expect(action).toHaveAccessibleName(LONG_SCHOOL);
        await expect(Math.round(action.getBoundingClientRect().height)).toBe(32);
        await expect(menu.getBoundingClientRect().width).toBeGreaterThan(0);
        await expect(menu.getBoundingClientRect().left).toBeGreaterThanOrEqual(action.getBoundingClientRect().right - 1);
    },
};
