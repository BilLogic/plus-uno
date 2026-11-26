import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expectGroundUnder } from '@/storybook-docs/lib/label-states.js';
import { expectInk } from '@/storybook-docs/lib/navigation-states.js';

import { px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { CountTag } from '@/components';
import Tabs from './Tabs';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { DemoLabel } from '@/storybook-docs/lib/template-demo';
import { LONG_TOPIC, expectNoSilentClip, expectInsideWell, expectFullTextReachable } from '../../_internal/overflowPlays';

export default {
    title: 'Components/Navigation/Tabs',
    component: Tabs,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Tabs is a WAI-ARIA tab strip built on Base UI\'s Tabs: a `role="tablist"` of buttons with roving tabindex, arrow-key navigation and a labeled panel per tab.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        style: {
            storyOnly: true,
            table: { disable: true },
        },
        appearance: {
            control: 'inline-radio',
            options: ['default', 'pill'],
            description: 'Underline indicator (default), or a pill-shaped selected fill.',
            table: { category: 'Design' }
        },
        overflow: {
            control: 'inline-radio',
            options: ['auto', 'collapse', 'wrap', 'scroll', 'menu'],
            description: '`auto` (default) folds what does not fit into More, and under 768 takes the narrow form: underline scrolls, pill becomes a menu. `collapse`, `scroll`, `menu` and `wrap` hold one form at every width.',
            table: { category: 'Layout' }
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

const col = { display: 'flex', flexDirection: 'column', gap: '48px' /* token gap: 48px */ };

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
    const selected = canvas.getByRole('tab', { name: 'Home' });
    const other = canvas.getByRole('tab', { name: 'Profile' });
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
            <DemoLabel>JUSTIFIED</DemoLabel>
            <Tabs alignment="justified" defaultActiveKey="1">
                <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
                <Tabs.Tab eventKey="2">Sessions</Tabs.Tab>
                <Tabs.Tab eventKey="3">Reports</Tabs.Tab>
            </Tabs>
        </section>
    </div>
);

/** Justified tabs split the whole row equally, each label on one line. */
Layout.play = async ({ canvasElement }) => {
    const list = canvasElement.querySelector('.plus-tabs-list');
    const row = list.closest('section').getBoundingClientRect().width;
    await expect(Math.round(list.getBoundingClientRect().width), 'the strip fills the row').toBe(Math.round(row));
    const tabs = [...list.querySelectorAll('.plus-tab')];
    const widths = tabs.map((tab) => Math.round(tab.getBoundingClientRect().width));
    await expect(new Set(widths).size, `equal shares: ${widths.join(', ')}`).toBe(1);
    for (const tab of tabs) {
        await expect(getComputedStyle(tab).whiteSpace, `${tab.textContent} stays on one line`).toBe('nowrap');
    }
};

export const Alignment = () => (
    <div style={col}>
        {['left', 'center', 'right'].map((alignment) => (
            <section key={alignment}>
                <DemoLabel>{alignment.toUpperCase()}</DemoLabel>
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
            <DemoLabel>DEFAULT (UNDERLINE)</DemoLabel>
            <Tabs overflow="collapse" defaultActiveKey="1">
                <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
                <Tabs.Tab eventKey="2">Sessions</Tabs.Tab>
                <Tabs.Tab eventKey="3">Reports</Tabs.Tab>
            </Tabs>
        </section>
        <section>
            <DemoLabel>PILL</DemoLabel>
            <Tabs appearance="pill" overflow="collapse" defaultActiveKey="1">
                <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
                <Tabs.Tab eventKey="2">Sessions</Tabs.Tab>
                <Tabs.Tab eventKey="3">Reports</Tabs.Tab>
            </Tabs>
        </section>
    </div>
);

/** One size: a 32 tab, padded --pad-x-lg, its top rounded by Radius / Control md. */
export const UnderlineRadius = () => (
    <div style={col}>
        <Tabs defaultActiveKey="1" data-testid="default">
            <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
            <Tabs.Tab eventKey="2">Sessions</Tabs.Tab>
        </Tabs>
    </div>
);
UnderlineRadius.play = async ({ canvasElement }) => {
    const tab = canvasElement.querySelector('.plus-tabs--appearance-default .plus-tab');
    const t = getComputedStyle(tab);
    await expect(tab.getBoundingClientRect().height, 'tab height').toBe(tokenLength(canvasElement, '--control-md'));
    await expect(px(t.paddingLeft), 'tab padding').toBe(tokenLength(canvasElement, '--pad-x-lg'));
    await expect(px(t.borderTopLeftRadius), 'tab top-left').toBe(tokenLength(canvasElement, '--radius-control-md'));
    await expect(px(t.borderTopRightRadius), 'tab top-right').toBe(tokenLength(canvasElement, '--radius-control-md'));
    await expect(px(t.borderBottomLeftRadius), 'bottom stays square').toBe(0);
};

/** A pill strip has no baseline: neither the list nor any tab draws a bottom border. */
Appearance.play = async ({ canvasElement }) => {
    const pill = canvasElement.querySelector('.plus-tabs--appearance-pill');
    const list = pill.querySelector('.plus-tabs-list');
    await expect(px(getComputedStyle(list).borderBottomWidth), 'no strip baseline').toBe(0);
    for (const tab of pill.querySelectorAll('.plus-tab')) {
        const t = getComputedStyle(tab);
        await expect(px(t.borderBottomWidth), `${tab.textContent}: no underline`).toBe(0);
        await expect(px(t.marginBottom), `${tab.textContent}: not pulled onto a baseline`).toBe(0);
    }
};

/** A trailing `CountTag` sits at 16 inside a 32 tab, underline or pill. */
export const WithCount = {
    render: () => (
        <div style={col}>
            <section>
                <DemoLabel>UNDERLINE</DemoLabel>
                <Tabs overflow="collapse" defaultActiveKey="1">
                    <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
                    <Tabs.Tab eventKey="2">Sessions <CountTag value={4} label="4 sessions" /></Tabs.Tab>
                    <Tabs.Tab eventKey="3">Messages <CountTag value={12} isBold appearance="danger" label="12 unread" /></Tabs.Tab>
                </Tabs>
            </section>
            <section>
                <DemoLabel>PILL</DemoLabel>
                <Tabs appearance="pill" overflow="collapse" defaultActiveKey="1">
                    <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
                    <Tabs.Tab eventKey="2">Sessions <CountTag value={4} label="4 sessions" /></Tabs.Tab>
                    <Tabs.Tab eventKey="3">Messages <CountTag value={12} isBold appearance="danger" label="12 unread" /></Tabs.Tab>
                </Tabs>
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const strips = [...canvasElement.querySelectorAll('.plus-tabs')];
        for (const [strip, expectedHeight] of [[strips[0], 32], [strips[1], 32]]) {
            for (const tab of strip.querySelectorAll('.plus-tab')) {
                const tabRect = tab.getBoundingClientRect();
                await expect(Math.round(tabRect.height), `${tab.textContent} tab height`).toBe(expectedHeight);
                const count = tab.querySelector('.plus-count');
                if (count) {
                    const countRect = count.getBoundingClientRect();
                    await expect(countRect.height, `${tab.textContent} count height`).toBe(16);
                    await expect(
                        Math.abs((countRect.top + countRect.bottom) / 2 - (tabRect.top + tabRect.bottom) / 2),
                        `${tab.textContent} count centered`,
                    ).toBeLessThanOrEqual(0.5);
                }
            }
        }
    },
};

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
            <DemoLabel>INTERACTION STATES</DemoLabel>
            <p className="body-default" style={{ marginBottom: 'var(--stack-2xl)', color: 'var(--ds-text-subtle)' }}>
                States below are artificially forced for demonstration.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' /* token gap: 32px */ }}>
                <div>
                    <p className="body-sm" style={{ marginBottom: 'var(--stack-xl)', fontWeight: 'var(--type-weight-medium)' }}>Unselected tab states</p>
                    <Tabs defaultActiveKey="none">
                        <Tabs.Tab eventKey="default">Default</Tabs.Tab>
                        <Tabs.Tab eventKey="hover" className="pseudo-hover">Hovered</Tabs.Tab>
                        <Tabs.Tab eventKey="focus" className="pseudo-focus">Focused</Tabs.Tab>
                        <Tabs.Tab eventKey="pressed" className="pseudo-pressed">Pressed</Tabs.Tab>
                    </Tabs>
                </div>
                <div>
                    <p className="body-sm" style={{ marginBottom: 'var(--stack-xl)', fontWeight: 'var(--type-weight-medium)' }}>Disabled</p>
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
            overflow={args.overflow}
            alignment={args.alignment}
            activeKey={activeKey}
            onSelect={(k) => setActiveKey(k)}
        >
            <Tabs.Tab eventKey="1">Overview</Tabs.Tab>
            <Tabs.Tab eventKey="2">Sessions</Tabs.Tab>
            <Tabs.Tab eventKey="3">Progress</Tabs.Tab>
        </Tabs>
    );
};

Interactive.args = {
    appearance: 'default',
    overflow: 'auto',
    alignment: 'left'
};

/* ------------------------------------------------------------------- states */

// The states are the wide strip's: held at `collapse`, so a narrow canvas does not swap in the narrow form.
const StateTabs = (props) => (
    <Tabs overflow="collapse" defaultActiveKey="1" {...props}>
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
        await expect(px(style.borderBottomWidth), 'bar width').toBe(tokenLength(canvasElement, '--border-width-selected'));
        await expect(selected).toHaveAttribute('aria-selected', 'true');
    },
};

/** Selected, pill: the neutral fill with the default ink; its hover and press step the neutral fill. */
export const SelectedPill = {
    render: () => <StateTabs appearance="pill" />,
    play: async ({ canvasElement }) => {
        const selected = tabOf(canvasElement, 'Overview');
        await expectGroundUnder(canvasElement, selected, undefined, '--ds-background-neutral', 'selected pill');
        await expectInk(canvasElement, selected, undefined, '--ds-text', 'selected pill');
        await expectGroundUnder(canvasElement, selected, ':hover', '--ds-background-neutral-hovered', 'hovered selected pill');
        await expectGroundUnder(canvasElement, selected, ':active', '--ds-background-neutral-pressed', 'pressed selected pill');
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

/** Truncate: a tab label longer than its cap keeps one line and ends in an ellipsis; its full text opens in a Tooltip on hover and focus, only while it is clipped. */
export const Overflow = {
    render: () => (
        <div style={{ width: '360px' /* demo frame */ }}>
            <Tabs overflow="collapse" defaultActiveKey="one">
                <Tabs.Tab eventKey="one">Overview</Tabs.Tab>
                <Tabs.Tab eventKey="two">{LONG_TOPIC}</Tabs.Tab>
            </Tabs>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const long = canvas.getByRole('tab', { name: LONG_TOPIC });
        const short = canvas.getByRole('tab', { name: 'Overview' });
        const label = long.querySelector('.plus-tab-label');
        await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
        await expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
        await expectNoSilentClip(canvasElement);
        await expectInsideWell(long, canvasElement.firstElementChild);
        await expect(Math.round(long.getBoundingClientRect().height)).toBe(Math.round(short.getBoundingClientRect().height));
        await userEvent.hover(short);
        await new Promise((resolve) => { setTimeout(resolve, 600); });
        await expect(within(canvasElement.ownerDocument.body).queryByRole('tooltip'), 'a tab that fits has no Tooltip').toBeNull();
        await userEvent.unhover(short);
        await expectFullTextReachable(canvasElement, long, LONG_TOPIC);
    },
};

const TOPICS = ['Overview', 'Sessions', 'Progress', 'Reflections', 'Feedback', 'Schedule', 'Students', 'Resources'];

export const OverflowMore = {
    render: () => (
        <div style={{ width: '440px' /* demo frame */ }}>
            <Tabs overflow="collapse" defaultActiveKey="Overview">
                {TOPICS.map((name) => <Tabs.Tab key={name} eventKey={name}>{name}</Tabs.Tab>)}
                {TOPICS.map((name) => <Tabs.Panel key={name} eventKey={name}>{name} view</Tabs.Panel>)}
            </Tabs>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);
        const more = await canvas.findByRole('tab', { name: /^More/ });
        const visible = canvas.getAllByRole('tab').filter((tab) => tab !== more);
        const hiddenCount = TOPICS.length - visible.length;
        await expect(hiddenCount, 'some tabs fold into More').toBeGreaterThan(0);
        await expect(more.getAttribute('aria-label')).toBe(`More, ${hiddenCount} more ${hiddenCount === 1 ? 'tab' : 'tabs'}`);
        await expect(more.textContent).toContain(String(hiddenCount));
        // Nothing wraps: every tab and More share one row, and the row stays in its well.
        const tops = [...visible, more].map((tab) => Math.round(tab.getBoundingClientRect().top));
        await expect(new Set(tops).size, 'tabs wrapped onto a second row').toBe(1);
        await expectNoSilentClip(canvasElement);
        await expectInsideWell(more, canvasElement.firstElementChild);
        // Every hidden tab is reachable by name in the menu.
        await userEvent.click(more);
        const rows = await body.findAllByRole('menuitemradio');
        await expect(rows.map((row) => row.textContent)).toEqual(TOPICS.slice(visible.length));
        // Choosing one selects it and More holds the selection.
        await userEvent.click(rows[rows.length - 1]);
        await waitFor(() => expect(body.queryAllByRole('menu')).toHaveLength(0));
        await expect(more.getAttribute('aria-selected'), 'More holds the selection once the menu closes').toBe('true');
        await expect(canvas.getByText(`${TOPICS[TOPICS.length - 1]} view`)).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('tab', { name: TOPICS[0] }));
        await waitFor(() => expect(more.getAttribute('aria-selected')).toBe('false'));
    },
};
OverflowMore.parameters = {
    docs: {
        description: {
            story: 'The strip keeps one row (`overflow="collapse"`, and `auto` from 768 up): the tabs that fit show, and the rest fold into a More tab that names how many it holds and opens a menu of them.'
        }
    }
};

/* ------------------------------------------------------------------- narrow */

const PAGE_TABS = ['Overview', 'Sessions', 'Students', 'Notes', 'Reflections', 'Feedback', 'Schedule'];
const VIEWS = ['Active', 'Inactive', 'All'];
// A phone-width row: under 768, so a collapsing strip takes its narrow form.
const narrowRow = { width: '360px' /* demo frame */ };

/**
 * Narrow page tabs: under 768 an underline strip keeps its bar and scrolls
 * sideways, its end fading while more lies past it. The selected tab scrolls
 * into view, and nothing folds into More.
 */
export const NarrowScroll = {
    render: () => (
        <div style={narrowRow}>
            <Tabs defaultActiveKey="Overview" aria-label="Student pages">
                {PAGE_TABS.map((name) => <Tabs.Tab key={name} eventKey={name}>{name}</Tabs.Tab>)}
                {PAGE_TABS.map((name) => <Tabs.Panel key={name} eventKey={name}>{name} page</Tabs.Panel>)}
            </Tabs>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const root = canvasElement.querySelector('.plus-tabs');
        await waitFor(() => expect(root).toHaveClass('plus-tabs--scroll'));
        const list = canvas.getByRole('tablist');
        await expect(canvas.queryByRole('tab', { name: /^More/ }), 'no More fold').toBeNull();
        await expect(canvas.getAllByRole('tab'), 'every tab stays in the strip').toHaveLength(PAGE_TABS.length);
        await expect(list.scrollWidth, 'the strip runs past its row').toBeGreaterThan(list.clientWidth);
        await expect(root, 'the end fades while more lies past it').toHaveAttribute('data-overflow-end');
        const tops = canvas.getAllByRole('tab').map((tab) => Math.round(tab.getBoundingClientRect().top));
        await expect(new Set(tops).size, 'one row').toBe(1);
        await expectInsideWell(list, canvasElement.firstElementChild);

        // The last tab, past the end, is selected and scrolls wholly into view.
        const last = canvas.getByRole('tab', { name: PAGE_TABS[PAGE_TABS.length - 1] });
        canvas.getByRole('tab', { name: PAGE_TABS[0] }).focus();
        await userEvent.keyboard('{End}');
        await expect(last).toHaveAttribute('aria-selected', 'true');
        await waitFor(() => {
            const strip = list.getBoundingClientRect();
            const tab = last.getBoundingClientRect();
            expect(tab.left, 'the selected tab starts inside the strip').toBeGreaterThanOrEqual(strip.left - 0.5);
            expect(tab.right, 'and ends inside it').toBeLessThanOrEqual(strip.right + 0.5);
        });
        await waitFor(() => expect(root, 'at the end, no fade').not.toHaveAttribute('data-overflow-end'));
        await expect(canvas.getByText(`${PAGE_TABS[PAGE_TABS.length - 1]} page`)).toBeInTheDocument();
    },
};

/**
 * Narrow pill views: under 768 only the selected pill shows, with a 12
 * angle-down. It is a menu button; its menu lists every view, the selected one
 * checked, and picking one selects it.
 */
export const NarrowMenu = {
    render: () => (
        <div style={narrowRow}>
            <Tabs appearance="pill" defaultActiveKey="Active">
                {VIEWS.map((name) => <Tabs.Tab key={name} eventKey={name}>{name}</Tabs.Tab>)}
                {VIEWS.map((name) => <Tabs.Panel key={name} eventKey={name}>{name} students</Tabs.Panel>)}
            </Tabs>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);
        const trigger = await canvas.findByRole('button', { name: 'Active' });
        await expect(canvas.queryByRole('tablist'), 'no strip, only the selected pill').toBeNull();
        await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        const chevron = trigger.querySelector('.fa-angle-down');
        await expect(chevron, 'a chevron after the label').not.toBeNull();
        await expect(chevron.getBoundingClientRect().width, '12 wide').toBeLessThanOrEqual(tokenLength(canvasElement, '--icon-sm'));
        await expect(Math.round(trigger.getBoundingClientRect().height), 'a 32 pill').toBe(tokenLength(canvasElement, '--control-md'));
        await expectGroundUnder(canvasElement, trigger, undefined, '--ds-background-neutral', 'the selected pill');

        await userEvent.click(trigger);
        const rows = await body.findAllByRole('menuitemradio');
        await expect(rows.map((row) => row.textContent), 'every view').toEqual(VIEWS);
        await expect(rows.map((row) => row.getAttribute('aria-checked')), 'the selected one checked').toEqual(['true', 'false', 'false']);
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');

        await userEvent.click(rows[2]);
        await waitFor(() => expect(body.queryAllByRole('menuitemradio')).toHaveLength(0));
        await expect(await canvas.findByRole('button', { name: 'All' }), 'the pill names the new view').toBeInTheDocument();
        await expect(canvas.getByText('All students')).toBeInTheDocument();
    },
};
