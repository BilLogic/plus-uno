import React from 'react';
import { expect, userEvent } from 'storybook/test';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { decorationUnder, expectInk } from '@/storybook-docs/lib/navigation-states.js';
import { expectNoStateChange } from '@/storybook-docs/lib/label-states.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Breadcrumb from './Breadcrumb';

const sampleItems = [
    { text: 'Home', href: '/' },
    { text: 'Training', href: '/training' },
    { text: 'Lessons', href: '/lessons' },
    { text: 'Current Page' },
];

export default {
    title: 'Components/Navigation/Breadcrumbs',
    component: Breadcrumb,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-23', kind: 'changed', summary: 'The trail is a 32 row in Body/default (14/20), down from body 1 (16/24).' },
        ],
        layout: 'padded',
        docs: {
            description: {
                component: 'Universal element component for navigation hierarchy. indicates the current page\'s location within a navigational hierarchy that automatically adds separators via CSS.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        pathPreset: {
            control: 'select',
            options: ['short', 'standard', 'deep'],
            description: 'Preset breadcrumb depth for the interactive demo',
            table: { category: 'Content' },
        },
        separator: {
            table: { disable: true, category: 'Design' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        items: {
            table: { disable: true, category: 'Development' },
        },
    },
};

const breadcrumbCol = { display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' };
const breadcrumbBlock = { display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md)' };

function BreadcrumbStandardDemo() {
    return (
        <div style={breadcrumbBlock}>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">STANDARD BREADCRUMB</span>
            <Breadcrumb items={sampleItems} />
        </div>
    );
}

function BreadcrumbShortDemo() {
    return (
        <div style={breadcrumbBlock}>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SHORT BREADCRUMB (2 LEVELS)</span>
            <Breadcrumb items={[
                { text: 'Home', href: '/' },
                { text: 'Current Page' }
            ]} />
        </div>
    );
}

export const Standard = () => (
    <div style={breadcrumbCol}>
        <BreadcrumbStandardDemo />
    </div>
);

export const Short = () => (
    <div style={breadcrumbCol}>
        <BreadcrumbShortDemo />
    </div>
);

export const Overview = () => <Breadcrumb items={sampleItems} />;
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.breadcrumb }
    }
};

/**
 * Interactive Breadcrumb
 * Interactive playground for testing breadcrumb props.
 */
export const Interactive = (args) => (
    <Breadcrumb
        {...args}
        items={{
            short: [
                { text: 'Home', href: '/' },
                { text: 'Current Page' }
            ],
            standard: sampleItems,
            deep: [
                { text: 'Home', href: '/' },
                { text: 'Training', href: '/training' },
                { text: 'Lessons', href: '/lessons' },
                { text: 'Module 3', href: '/lessons/module-3' },
                { text: 'Current Page' }
            ]
        }[args.pathPreset] || sampleItems}
    />
);
Interactive.args = {
    pathPreset: 'standard',
};

/* ------------------------------------------------------------------- states */

const trailOf = (canvasElement) => ({
    ancestor: canvasElement.querySelector('.plus-breadcrumb-link a'),
    current: canvasElement.querySelector('.plus-breadcrumb-current'),
});

/** Rest: linked ancestors in the link color, the current page plain and subtlest. */
export const Rest = {
    render: () => <Breadcrumb items={sampleItems} />,
    play: async ({ canvasElement }) => {
        const { ancestor, current } = trailOf(canvasElement);
        await expectInk(canvasElement, ancestor, undefined, '--ds-link', 'ancestor');
        await expect(decorationUnder(ancestor), 'ancestor is not underlined at rest').toBe('none');
        await expect(current).toHaveAttribute('aria-current', 'page');
        await expect(current.querySelector('a'), 'the current page is not a link').toBeNull();
        await expectInk(canvasElement, current, undefined, '--ds-text-subtlest', 'current page');
    },
};

/** Hovered: an ancestor link is underlined and keeps the link color. */
export const Hovered = {
    render: () => <Breadcrumb items={sampleItems} />,
    play: async ({ canvasElement }) => {
        const { ancestor } = trailOf(canvasElement);
        await expect(decorationUnder(ancestor, ':hover'), 'hovered ancestor').toBe('underline');
        await expectInk(canvasElement, ancestor, ':hover', '--ds-link', 'ancestor');
    },
};

/** Pressed: a link takes no pressed step of its own; the trail does not change under the pointer. */
export const Pressed = {
    render: () => <Breadcrumb items={sampleItems} />,
    play: async ({ canvasElement }) => {
        const { ancestor, current } = trailOf(canvasElement);
        await expectNoStateChange(ancestor, ':active', 'ancestor');
        await expectNoStateChange(current, ':active', 'current page');
    },
};

/** Focused: the 2px ring, 2px off an ancestor link. The current page is not focusable. */
export const Focused = {
    render: () => <Breadcrumb items={sampleItems} />,
    play: async ({ canvasElement }) => {
        const { ancestor, current } = trailOf(canvasElement);
        await expectFocusRing(canvasElement, ancestor, 'ancestor link');
        await userEvent.tab();
        await expect(current.contains(document.activeElement), 'the current page takes no focus').toBe(false);
    },
};
