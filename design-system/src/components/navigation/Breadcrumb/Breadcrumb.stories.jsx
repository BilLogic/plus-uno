import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { decorationUnder, expectInk } from '@/storybook-docs/lib/navigation-states.js';
import { expectNoStateChange } from '@/storybook-docs/lib/label-states.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Breadcrumb from './Breadcrumb';
import { expectMenuFade } from '@/storybook-docs/lib/overlay-motion-plays';
import { DemoLabel } from '@/storybook-docs/lib/template-demo';
import { LONG_SCHOOL, LONG_TOPIC, expectNoSilentClip, expectInsideWell, expectFullTextReachable } from '../../_internal/overflowPlays';

const sampleItems = [
    { text: 'Home', href: '/' },
    { text: 'Training', href: '/training' },
    { text: 'Lessons', href: '/lessons' },
];

export default {
    title: 'Components/Navigation/Breadcrumbs',
    component: Breadcrumb,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Universal element component for navigation hierarchy. shows the parent pages of the page a person is on, with separators added by CSS.',
            },
        },
    },
    argTypes: {
        children: {
            storyOnly: true,
            table: { disable: true },
        },
        onClick: {
            storyOnly: true,
            table: { disable: true },
        },
        style: { table: { disable: true } },
        pathPreset: {
            storyOnly: true,
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

const breadcrumbCol = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-2xl)' };
const breadcrumbBlock = { display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' };

function BreadcrumbStandardDemo() {
    return (
        <div style={breadcrumbBlock}>
            <DemoLabel>STANDARD BREADCRUMB</DemoLabel>
            <Breadcrumb items={sampleItems} />
        </div>
    );
}

function BreadcrumbShortDemo() {
    return (
        <div style={breadcrumbBlock}>
            <DemoLabel>SHORT BREADCRUMB (2 LEVELS)</DemoLabel>
            <Breadcrumb items={[
                { text: 'Home', href: '/' },
                { text: 'Session plans', href: '/session-plans' }
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
                { text: 'Session plans', href: '/session-plans' }
            ],
            standard: sampleItems,
            deep: [
                { text: 'Home', href: '/' },
                { text: 'Training', href: '/training' },
                { text: 'Lessons', href: '/lessons' },
                { text: 'Grade 7 math', href: '/lessons/grade-7-math' }
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
});

/** Rest: every level a parent link, in the link color; no level is the current record. */
export const Rest = {
    render: () => <Breadcrumb items={sampleItems} />,
    play: async ({ canvasElement }) => {
        const { ancestor } = trailOf(canvasElement);
        await expectInk(canvasElement, ancestor, undefined, '--ds-link', 'ancestor');
        await expect(decorationUnder(ancestor), 'ancestor is not underlined at rest').toBe('none');
        await expect(canvasElement.querySelectorAll('.plus-breadcrumb-link a'), 'every level is a link').toHaveLength(sampleItems.length);
        await expect(canvasElement.querySelector('[aria-current]'), 'no level is the current record').toBeNull();
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
        const { ancestor } = trailOf(canvasElement);
        await expectNoStateChange(ancestor, ':active', 'ancestor');
    },
};

/** Focused: the 2px ring, 2px off an ancestor link. */
export const Focused = {
    render: () => <Breadcrumb items={sampleItems} />,
    play: async ({ canvasElement }) => {
        const { ancestor } = trailOf(canvasElement);
        await expectFocusRing(canvasElement, ancestor, 'ancestor link');
    },
};

/** Truncate: the trail stays on one line and a level longer than its room ends in an ellipsis; its full text opens in a Tooltip on hover and focus. */
export const Overflow = {
    render: () => (
        <div style={{ width: '360px' /* demo frame */ }}>
            <Breadcrumb items={[
                { text: 'Home', href: '#' },
                { text: LONG_SCHOOL, href: '#' },
                { text: LONG_TOPIC, href: '#' },
            ]} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByRole('link', { name: LONG_SCHOOL });
        await expect(link.scrollWidth).toBeGreaterThan(link.clientWidth);
        await expectNoSilentClip(canvasElement);
        await expectInsideWell(canvasElement.querySelector('.plus-breadcrumb-list'), canvasElement.firstElementChild);
        const list = canvasElement.querySelector('.plus-breadcrumb-list');
        await expect(Math.round(list.getBoundingClientRect().height), 'the trail never wraps').toBe(32);
        await expect(canvas.getByRole('link', { name: 'Home' }).scrollWidth).toBeLessThanOrEqual(canvas.getByRole('link', { name: 'Home' }).clientWidth);
        await expectFullTextReachable(canvasElement, link, LONG_SCHOOL);
        const last = canvas.getByRole('link', { name: LONG_TOPIC });
        await expect(last.scrollWidth).toBeGreaterThan(last.clientWidth);
        await expectFullTextReachable(canvasElement, last, LONG_TOPIC);
    },
};

const DEEP_TRAIL = [
    { text: 'Cohorts', href: '/cohorts' },
    { text: 'Autumn 2026', href: '/cohorts/a26' },
    { text: 'Lincoln Middle School', href: '/cohorts/a26/lincoln' },
    { text: 'Grade 7 math', href: '/cohorts/a26/lincoln/g7' },
    { text: 'Maya Chen', href: '/cohorts/a26/lincoln/g7/maya' },
    { text: 'Sessions', href: '/cohorts/a26/lincoln/g7/maya/sessions' },
];

/** Fold: with five or more levels the root and the last two stay, and the middle folds behind a "…" button that opens the hidden levels as links, in order. */
export const FoldedLevels = {
    render: () => <Breadcrumb items={DEEP_TRAIL} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);
        await expect(canvas.getByRole('link', { name: 'Cohorts' })).toBeVisible();
        await expect(canvas.getByRole('link', { name: 'Maya Chen' })).toBeVisible();
        await expect(canvas.getByRole('link', { name: 'Sessions' })).toBeVisible();
        for (const name of ['Autumn 2026', 'Lincoln Middle School', 'Grade 7 math']) {
            await expect(canvas.queryByRole('link', { name }), `${name} is folded`).toBeNull();
        }
        const fold = canvas.getByRole('button', { name: 'Show hidden levels' });
        await expect(fold).toHaveTextContent('');
        await userEvent.click(fold);
        const items = await body.findAllByRole('menuitem');
        await expect(items.map((i) => i.textContent)).toEqual(['Autumn 2026', 'Lincoln Middle School', 'Grade 7 math']);
        await expect(items.map((i) => i.getAttribute('href'))).toEqual(['/cohorts/a26', '/cohorts/a26/lincoln', '/cohorts/a26/lincoln/g7']);
        const menu = items[0].closest('.plus-dropdown-menu');
        await expectMenuFade(menu, 'enter');
        await waitFor(() => expect(body.getByRole('menuitem', { name: 'Lincoln Middle School' })).toBeVisible());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(menu.isConnected).toBe(false));

        // The same menu opens from the keyboard, with focus on the first hidden level.
        fold.focus();
        await userEvent.keyboard('{Enter}');
        const first = await body.findByRole('menuitem', { name: 'Autumn 2026' });
        await waitFor(() => expect(first).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(first.isConnected).toBe(false));
        fold.focus();
        await userEvent.keyboard('{ArrowDown}');
        const again = await body.findByRole('menuitem', { name: 'Autumn 2026' });
        await waitFor(() => expect(again).toHaveFocus());
        await userEvent.keyboard('{Escape}');
    },
};

/** Exactly five levels is the threshold: the two between the root and the last two fold. */
export const FoldedAtFive = {
    render: () => <Breadcrumb items={DEEP_TRAIL.slice(1)} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('listitem')).toHaveLength(4);
        await userEvent.click(canvas.getByRole('button', { name: 'Show hidden levels' }));
        const items = await within(canvasElement.ownerDocument.body).findAllByRole('menuitem');
        await expect(items.map((i) => i.textContent)).toEqual(['Lincoln Middle School', 'Grade 7 math']);
        await userEvent.keyboard('{Escape}');
    },
};

/** Fewer than five levels do not fold. */
export const NotFolded = {
    render: () => <Breadcrumb items={DEEP_TRAIL.slice(2)} />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).queryByRole('button', { name: 'Show hidden levels' })).toBeNull();
        await expect(within(canvasElement).getAllByRole('listitem')).toHaveLength(4);
    },
};
