import React from 'react';
import { expect } from 'storybook/test';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { decorationUnder, expectInk } from '@/storybook-docs/lib/navigation-states.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Link, { LINK_APPEARANCES } from '@/components/navigation/Link';

export default {
    title: 'Components/Navigation/Link',
    component: Link,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        appearance: { control: 'select', options: LINK_APPEARANCES, table: { category: 'Design' } },
        href: { control: 'text', table: { category: 'Design' } },
        isOpenInNewWindow: { control: 'boolean', table: { category: 'Design' } },
    },
};

export const Appearances = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {LINK_APPEARANCES.map((appearance) => (
            <Link key={appearance} href="#" appearance={appearance} id={`link-${appearance}`}>
                {appearance} link
            </Link>
        ))}
    </div>
);

Appearances.play = async ({ canvasElement }) => {
    for (const appearance of LINK_APPEARANCES) {
        const node = canvasElement.querySelector(`#link-${appearance}`);
        await expect(node, `${appearance} renders an anchor`).toBeTruthy();
        await expect(node.tagName).toBe('A');
    }
};

export const OpenInNewWindow = () => (
    <Link href="https://example.com" isOpenInNewWindow id="link-new-window">
        Opens elsewhere
    </Link>
);

OpenInNewWindow.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#link-new-window');
    await expect(node.target).toBe('_blank');
    await expect(node.rel).toContain('noopener');
};

export const Interactive = {
    args: { href: '#', appearance: 'default', children: 'Link text', isOpenInNewWindow: false },
    render: (args) => <Link {...args} />,
};

/* ------------------------------------------------------------------- states */

const Row = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
        <Link href="#" id="state-default">Default link</Link>
        <Link href="#" appearance="subtle" id="state-subtle">Subtle link</Link>
        <div style={{ background: 'var(--ds-background-neutral-bold)', padding: 'var(--pad-x-lg)' }}>
            <Link href="#" appearance="inverse" id="state-inverse">Inverse link</Link>
        </div>
    </div>
);
const at = (canvasElement, appearance) => canvasElement.querySelector(`#state-${appearance}`);

/** Rest: default is link-colored and underlined; subtle is body ink with no underline; inverse is inverse ink. */
export const Rest = {
    render: () => <Row />,
    play: async ({ canvasElement }) => {
        await expectInk(canvasElement, at(canvasElement, 'default'), undefined, '--ds-link', 'default');
        await expect(decorationUnder(at(canvasElement, 'default'))).toBe('underline');
        await expectInk(canvasElement, at(canvasElement, 'subtle'), undefined, '--ds-text', 'subtle');
        await expect(decorationUnder(at(canvasElement, 'subtle'))).toBe('none');
        await expectInk(canvasElement, at(canvasElement, 'inverse'), undefined, '--ds-text-inverse', 'inverse');
    },
};

/** Hovered: subtle gains its underline; default is already underlined and keeps its color. */
export const Hovered = {
    render: () => <Row />,
    play: async ({ canvasElement }) => {
        await expect(decorationUnder(at(canvasElement, 'subtle'), ':hover'), 'subtle hovered').toBe('underline');
        await expect(decorationUnder(at(canvasElement, 'default'), ':hover'), 'default hovered').toBe('underline');
        await expectInk(canvasElement, at(canvasElement, 'default'), ':hover', '--ds-link', 'default');
    },
};

/** Pressed: default and subtle take the pressed link ink. */
export const Pressed = {
    render: () => <Row />,
    play: async ({ canvasElement }) => {
        await expectInk(canvasElement, at(canvasElement, 'default'), ':active', '--ds-link-pressed', 'default');
        await expectInk(canvasElement, at(canvasElement, 'subtle'), ':active', '--ds-link-pressed', 'subtle');
    },
};

/** Focused: the 2px ring, 2px off the link; inverse draws the inverse ring color. */
export const Focused = {
    render: () => <Row />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, at(canvasElement, 'default'), 'default link');
        const inverse = at(canvasElement, 'inverse');
        inverse.focus({ focusVisible: true });
        await expect(getComputedStyle(inverse).outlineColor, 'inverse ring').toBe(tokenColor(canvasElement, '--ds-border-focused-inverse'));
        inverse.blur();
    },
};
