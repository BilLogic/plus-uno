import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expectGroundUnder } from '@/storybook-docs/lib/label-states.js';
import { expectInk } from '@/storybook-docs/lib/navigation-states.js';

import { px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Tabs from './Tabs';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';

export default {
    title: 'Components/Navigation/Tabs',
    component: Tabs,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Tabs is a WAI-ARIA tab strip built on Base UI\'s Tabs: a `role="tablist"` of buttons with roving tabindex, arrow-key navigation and a labelled panel per tab.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        appearance: {
            control: 'inline-radio',
            options: ['default', 'pill'],
            description: 'Underline indicator (default), or a pill-shaped selected fill.',
            table: { category: 'Design' }
        },
        spacing: {
            control: 'inline-radio',
            options: ['default', 'compact'],
            description: '`default` is a 32px tab; `compact` is 24px.',
            table: { category: 'Design' }
        },
        alignment: {
            control: 'select',
            options: ['left', 'center', 'right', 'justified'],
            description: 'Horizontal alignment of the tab strip',
            table: { category: 'Layout' }
        },
        activeKey: {
            table: { disable: true, category: 'Development' }
        },
        defaultActiveKey: {
            table: { disable: true, category: 'Development' }
        },
        onSelect: {
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};

const col = { display: 'flex', flexDirection: 'column', gap: '48px' };

export const Overview = () => {
    const [activeKey, setActiveKey] = useState('1');

    return (
        <Tabs activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
            <Tabs.Tab eventKey="1">Home</Tabs.Tab>
            <Tabs.Tab eventKey="2">Profile</Tabs.Tab>
            <Tabs.Tab eventKey="3">Messages</Tabs.Tab>
        </Tabs>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.tabs }
    }
};

/**
 * The selected tab is `text.selected` over the `border.selected` bar, the
 * Lagoon indicator; an unselected tab is `text.subtle` on the 1px
 * `color.border` baseline. Selection rests on the bar and the ink, never on a
 * fill. Held in every color mode; the tabs' color transition is switched off
 * first, so each mode is read settled rather than mid-fade.
 */
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selected = canvas.getByText('Home');
    const other = canvas.getByText('Profile');
    for (const tab of [selected, other]) tab.style.transition = 'none';

    await inEveryColorMode(async () => {
        const s = getComputedStyle(selected);
        await expect(s.borderBottomColor, 'the selected bar').toBe(tokenColor(canvasElement, '--ds-border-selected'));
        await expect(s.color, 'selected ink').toBe(tokenColor(canvasElement, '--ds-text-selected'));
        await expect(s.backgroundColor, 'and no fill').toBe('rgba(0, 0, 0, 0)');

        const o = getComputedStyle(other);
        await expect(o.color, 'an unselected tab is subtle').toBe(tokenColor(canvasElement, '--ds-text-subtle'));
        await expect(o.borderBottomColor, 'on the baseline').toBe(tokenColor(canvasElement, '--ds-border'));
        await expect(px(o.borderBottomWidth)).toBe(1);
    });
};

export const Layout = () => (
    <div style={col}>
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">JUSTIFIED</span>
            <Tabs alignment="justified" defaultActiveKey="1">
                <Tabs.Tab eventKey="1">Tab One</Tabs.Tab>
                <Tabs.Tab eventKey="2">Tab Two</Tabs.Tab>
                <Tabs.Tab eventKey="3">Tab Three</Tabs.Tab>
            </Tabs>
        </section>
    </div>
);

export const Alignment = () => (
    <div style={col}>
        {['left', 'center', 'right'].map((alignment) => (
            <section key={alignment}>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">{alignment.toUpperCase()}</span>
                <Tabs alignment={alignment} defaultActiveKey="1">
                    <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
                    <Tabs.Tab eventKey="2">Sessions</Tabs.Tab>
                    <Tabs.Tab eventKey="3">Reports</Tabs.Tab>
                </Tabs>
            </section>
        ))}
    </div>
);

export const Appearance = () => (
    <div style={col}>
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT (UNDERLINE)</span>
            <Tabs defaultActiveKey="1">
                <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
                <Tabs.Tab eventKey="2">Sessions</Tabs.Tab>
                <Tabs.Tab eventKey="3">Reports</Tabs.Tab>
            </Tabs>
        </section>
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">PILL</span>
            <Tabs appearance="pill" defaultActiveKey="1">
                <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
                <Tabs.Tab eventKey="2">Sessions</Tabs.Tab>
                <Tabs.Tab eventKey="3">Reports</Tabs.Tab>
            </Tabs>
        </section>
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">COMPACT</span>
            <Tabs spacing="compact" defaultActiveKey="1">
                <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
                <Tabs.Tab eventKey="2">Sessions</Tabs.Tab>
                <Tabs.Tab eventKey="3">Reports</Tabs.Tab>
            </Tabs>
        </section>
    </div>
);

/**
 * A tab wired to a panel: `aria-controls`/`aria-labelledby` are handled by
 * Base UI, and a disabled tab is still reachable by the arrow keys (so its
 * existence stays discoverable) but is never selected.
 */
export const WithPanels = () => {
    const [activeKey, setActiveKey] = useState('1');

    return (
        <Tabs activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
            <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
            <Tabs.Tab eventKey="2">Sessions</Tabs.Tab>
            <Tabs.Tab eventKey="3" isDisabled>
                Reports
            </Tabs.Tab>
            <Tabs.Panel eventKey="1">Everything at a glance.</Tabs.Panel>
            <Tabs.Panel eventKey="2">The sessions on the books.</Tabs.Panel>
            <Tabs.Panel eventKey="3">Nothing to report.</Tabs.Panel>
        </Tabs>
    );
};

function InteractionStatesDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">INTERACTION STATES</span>
            <p className="body2-txt" style={{ marginBottom: '24px', color: 'var(--ds-text-subtle)' }}>
                States below are artificially forced for demonstration.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                    <p className="body3-txt" style={{ marginBottom: '16px', fontWeight: 'bold' }}>Unselected tab states</p>
                    <Tabs defaultActiveKey="none">
                        <Tabs.Tab eventKey="default">Default</Tabs.Tab>
                        <Tabs.Tab eventKey="hover" className="pseudo-hover">Hovered</Tabs.Tab>
                        <Tabs.Tab eventKey="focus" className="pseudo-focus">Focused</Tabs.Tab>
                        <Tabs.Tab eventKey="pressed" className="pseudo-pressed">Pressed</Tabs.Tab>
                    </Tabs>
                </div>
                <div>
                    <p className="body3-txt" style={{ marginBottom: '16px', fontWeight: 'bold' }}>Disabled</p>
                    <Tabs defaultActiveKey="none">
                        <Tabs.Tab eventKey="disabled" isDisabled>Disabled</Tabs.Tab>
                    </Tabs>
                </div>
            </div>
        </section>
    );
}

export const InteractionStates = () => (
    <div style={col}>
        <InteractionStatesDemos />
    </div>
);

export const Interactive = (args) => {
    const [activeKey, setActiveKey] = useState('1');

    return (
        <Tabs
            appearance={args.appearance}
            spacing={args.spacing}
            alignment={args.alignment}
            activeKey={activeKey}
            onSelect={(k) => setActiveKey(k)}
        >
            <Tabs.Tab eventKey="1">Tab 1</Tabs.Tab>
            <Tabs.Tab eventKey="2">Tab 2</Tabs.Tab>
            <Tabs.Tab eventKey="3">Tab 3</Tabs.Tab>
        </Tabs>
    );
};

Interactive.args = {
    appearance: 'default',
    spacing: 'default',
    alignment: 'left'
};

/* ------------------------------------------------------------------- states */

const StateTabs = (props) => (
    <Tabs defaultActiveKey="1" {...props}>
        <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
        <Tabs.Tab eventKey="2">Sessions</Tabs.Tab>
        <Tabs.Tab eventKey="3" isDisabled>Reports</Tabs.Tab>
    </Tabs>
);
const tabOf = (canvasElement, name) => within(canvasElement).getByRole('tab', { name });

/** Rest: an unselected tab is subtle ink on a clear ground over the baseline. */
export const Rest = {
    render: () => <StateTabs />,
    play: async ({ canvasElement }) => {
        const tab = tabOf(canvasElement, 'Sessions');
        await expectInk(canvasElement, tab, undefined, '--ds-text-subtle', 'unselected tab');
        await expect(getComputedStyle(tab).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        await expect(tab).toHaveAttribute('aria-selected', 'false');
    },
};

/** Hovered: the subtle neutral hovered fill; the selected tab takes it too and keeps its bar and ink. */
export const Hovered = {
    render: () => <StateTabs />,
    play: async ({ canvasElement }) => {
        await expectGroundUnder(canvasElement, tabOf(canvasElement, 'Sessions'), ':hover', '--ds-background-neutral-subtle-hovered', 'unselected tab');
        const selected = tabOf(canvasElement, 'Overview');
        await expectGroundUnder(canvasElement, selected, ':hover', '--ds-background-neutral-subtle-hovered', 'selected tab');
        await expectInk(canvasElement, selected, ':hover', '--ds-text-selected', 'selected tab');
    },
};

/** Pressed: the subtle neutral pressed fill. */
export const Pressed = {
    render: () => <StateTabs />,
    play: async ({ canvasElement }) => {
        await expectGroundUnder(canvasElement, tabOf(canvasElement, 'Sessions'), ':active', '--ds-background-neutral-subtle-pressed', 'unselected tab');
    },
};

/** Focused: the 2px ring, 2px off the tab, with no fill. Arrow keys move selection with focus. */
export const Focused = {
    render: () => <StateTabs />,
    play: async ({ canvasElement }) => {
        const selected = tabOf(canvasElement, 'Overview');
        await expectFocusRing(canvasElement, selected, 'tab');
        selected.focus();
        await userEvent.keyboard('{ArrowRight}');
        await expect(tabOf(canvasElement, 'Sessions')).toHaveAttribute('aria-selected', 'true');
    },
};

/** Selected, underline: the selected ink over the selected bar; no fill. */
export const Selected = {
    render: () => <StateTabs />,
    play: async ({ canvasElement }) => {
        const selected = tabOf(canvasElement, 'Overview');
        await expectInk(canvasElement, selected, undefined, '--ds-text-selected', 'selected tab');
        const style = getComputedStyle(selected);
        await expect(style.borderBottomColor, 'the bar').toBe(tokenColor(canvasElement, '--ds-border-selected'));
        await expect(px(style.borderBottomWidth), 'bar width').toBe(tokenLength(canvasElement, '--border-selected'));
        await expect(selected).toHaveAttribute('aria-selected', 'true');
    },
};

/** Selected, pill: the bold selected fill with inverse ink; its hover and press step the bold fill. */
export const SelectedPill = {
    render: () => <StateTabs appearance="pill" />,
    play: async ({ canvasElement }) => {
        const selected = tabOf(canvasElement, 'Overview');
        await expectGroundUnder(canvasElement, selected, undefined, '--ds-background-selected-bold', 'selected pill');
        await expectInk(canvasElement, selected, undefined, '--ds-text-inverse', 'selected pill');
        await expectGroundUnder(canvasElement, selected, ':hover', '--ds-background-selected-bold-hovered', 'hovered selected pill');
        await expectGroundUnder(canvasElement, selected, ':active', '--ds-background-selected-bold-pressed', 'pressed selected pill');
    },
};

/** Disabled: disabled ink, no pointer events (so no hover or press), never selected. */
export const Disabled = {
    render: () => <StateTabs />,
    play: async ({ canvasElement }) => {
        const disabled = tabOf(canvasElement, 'Reports');
        await expect(disabled).toHaveAttribute('aria-disabled', 'true');
        await expectInk(canvasElement, disabled, undefined, '--ds-text-disabled', 'disabled tab');
        await expect(getComputedStyle(disabled).pointerEvents, 'a pointer never reaches a disabled tab').toBe('none');
        disabled.focus();
        await userEvent.keyboard('{Enter}');
        await expect(disabled).toHaveAttribute('aria-selected', 'false');
    },
};
