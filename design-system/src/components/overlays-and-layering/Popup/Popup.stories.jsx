import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { expectNoStateChange } from '@/storybook-docs/lib/label-states.js';
import { px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { emulateReducedMotion } from '@/storybook-docs/lib/test-viewport.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Popup from './Popup';
import { Button } from '@/components';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

export default {
    title: 'Components/Overlays and layering/Popup',
    component: Popup,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'A small panel of secondary content anchored to a trigger, built on Base UI.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        triggerLabel: {
            control: 'text',
            description: 'Button label used as the popup trigger',
            table: { category: 'Content' }
        },
        title: {
            control: 'text',
            description: 'Popup title',
            table: { category: 'Content' }
        },
        placement: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right'],
            description: 'Popup placement',
            table: { category: 'Layout' }
        },
        triggerType: {
            control: 'select',
            options: ['click', 'hover', 'focus', ['hover', 'focus']],
            description: 'Trigger behavior',
            table: { category: 'Behavior' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        trigger: {
            table: { disable: true, category: 'Development' }
        }
    }
};

const col = { display: 'flex', flexDirection: 'column', gap: 'var(--space-400)', padding: 'var(--space-300)', alignItems: 'center' };

function PopupLayoutDemos() {
    return (
        <section style={{ display: 'flex', gap: 'var(--space-200)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Popup
                trigger={<Button text="Popup on Top" />}
                placement="top"
                title="Popup Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popup>
            <Popup
                trigger={<Button text="Popup on Bottom" />}
                placement="bottom"
                title="Popup Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popup>
            <Popup
                trigger={<Button text="Popup on Left" />}
                placement="left"
                title="Popup Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popup>
            <Popup
                trigger={<Button text="Popup on Right" />}
                placement="right"
                title="Popup Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popup>
        </section>
    );
}

function PopupContentDemo() {
    return (
        <section>
            <DemoLabel>NO TITLE</DemoLabel>
            <Popup
                trigger={<Button text="Content Only" appearance="primary" />}
                placement="right"
            >
                This popup has no title, only body content.
            </Popup>
        </section>
    );
}

function PopupInteractionStatesDemos() {
    return (
        <section>
            <DemoLabel>TRIGGER TYPES</DemoLabel>
            <div style={{ display: 'flex', gap: 'var(--space-100)', flexWrap: 'wrap' }}>
                <Popup
                    trigger={<Button text="Click (Default)" appearance="primary" />}
                    triggerType="click"
                >
                    Clicked to toggle.
                </Popup>
                <Popup
                    trigger={<Button text="Hover" appearance="primary" />}
                    triggerType="hover"
                >
                    Hovered to show.
                </Popup>
                <Popup
                    trigger={<Button text="Focus" appearance="primary" />}
                    triggerType="focus"
                >
                    Focus to show (tab to this button).
                </Popup>
            </div>
        </section>
    );
}

export const Layout = () => (
    <div style={col}>
        <PopupLayoutDemos />
    </div>
);

export const Content = () => (
    <div style={col}>
        <PopupContentDemo />
    </div>
);

export const InteractionStates = () => (
    <div style={col}>
        <PopupInteractionStatesDemos />
    </div>
);

export const Overview = () => (
    <div className="plus-popup-overview-static">
        <Button type="button" text="Toggle popup" appearance="primary" />
        <div className="plus-popup">
            <div className="plus-popup-title">Popup title</div>
            <div className="plus-popup-body">
                Body content appears below the title. This overview is non-interactive; use Interactive for
                click/hover behavior.
            </div>
        </div>
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.popup }
    }
};

export const Interactive = {
    args: {
        triggerLabel: 'Interactive Trigger',
        title: 'Interactive Popup',
        children: 'Change my placement or title in the controls.',
        placement: 'top',
        triggerType: 'click'
    },
    render: (args) => {
        const { triggerLabel, ...popupProps } = args;
        return (
            <div style={{ padding: 'var(--space-300)', display: 'flex', justifyContent: 'center' }}>
                <Popup
                    {...popupProps}
                    trigger={<Button text={triggerLabel} appearance="primary" />}
                />
            </div>
        );
    }
};

/**
 * The popup portals out of the canvas, so the state stories read it from the
 * document. Waits for the open popup and for the focus it takes on opening: Base UI
 * queues that focus on the next animation frame, so a play that moves focus
 * before the frame runs has it taken back a moment later — on a busy machine,
 * between two reads of the same style.
 */
const openPopup = async (canvasElement) => {
    const doc = canvasElement.ownerDocument;
    await waitFor(() => expect(doc.querySelector('.plus-popup')).not.toBeNull());
    const popup = doc.querySelector('.plus-popup');
    await waitFor(() => expect(popup.contains(doc.activeElement)).toBe(true));
    return popup;
};

const StatePopup = () => (
    <div style={{ padding: 'var(--space-400)', display: 'flex', justifyContent: 'center' }}>
        <Popup trigger={<Button appearance="primary" text="Details" />} title="Session 12" triggerType="manual" show>
            Ran 45 minutes over.
        </Popup>
    </div>
);

/** Rest: one surface on the overlay fill, lifted by the overlay shadow, with no painted border (a transparent one keeps an edge in forced colors). */
export const Rest = {
    render: () => <StatePopup />,
    play: async ({ canvasElement }) => {
        const popup = await openPopup(canvasElement);
        const style = getComputedStyle(popup);
        await expect(style.backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface-overlay'));
        await expect(style.boxShadow).not.toBe('none');
        await expect(style.borderTopColor).toBe('rgba(0, 0, 0, 0)');
    },
};

/** Hovered: the popup does not react to a pointer. */
export const Hovered = {
    render: () => <StatePopup />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(await openPopup(canvasElement), ':hover', 'popup');
    },
};

/** Pressed: nothing changes under a press. */
export const Pressed = {
    render: () => <StatePopup />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(await openPopup(canvasElement), ':active', 'popup');
    },
};

/** Focused: focus back on the trigger shows the 2px ring while the popup stays open. */
export const Focused = {
    render: () => <StatePopup />,
    play: async ({ canvasElement }) => {
        await openPopup(canvasElement);
        const trigger = within(canvasElement).getByRole('button', { name: 'Details' });
        trigger.focus({ focusVisible: true });
        await expect(trigger.matches(':focus-visible')).toBe(true);
        const style = getComputedStyle(trigger);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(trigger).toHaveFocus();
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        await expect(canvasElement.ownerDocument.querySelector('.plus-popup'), 'the popup stays open').not.toBeNull();
        trigger.blur();
    },
};

/** Open: the trigger announces the popup it controls. */
export const Open = {
    render: () => <StatePopup />,
    play: async ({ canvasElement }) => {
        await openPopup(canvasElement);
        const trigger = within(canvasElement).getByRole('button', { name: 'Details' });
        await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    },
};

/** Where the popup opens, one story per side. It stays open so the page can show it. */
const OpenPopup = ({ placement = 'top', width, title, children = 'Ran 45 minutes over.' }) => (
    <div style={{ padding: 'calc(var(--space-400) * 4) var(--space-400)', display: 'flex', justifyContent: 'center' }}>
        <Popup
            trigger={<Button appearance="primary" text="Details" />}
            title={title}
            placement={placement}
            width={width}
            triggerType="manual"
            show
        >
            {children}
        </Popup>
    </div>
);

export const PlacementTop = { render: () => <OpenPopup placement="top" title="Session 12" /> };
export const PlacementBottom = { render: () => <OpenPopup placement="bottom" title="Session 12" /> };
export const PlacementLeft = { render: () => <OpenPopup placement="left" title="Session 12" /> };
export const PlacementRight = { render: () => <OpenPopup placement="right" title="Session 12" /> };

/** The popup a held-open width story draws, found in the document it portals to. */
const openedPopup = async (canvasElement, id) => waitFor(() => {
    const node = canvasElement.ownerDocument.getElementById(id);
    if (!node) throw new Error(`${id} not open`);
    return node;
});

const longBody = 'Ran 45 minutes over. The tutor stayed on to finish the practice set and wrote up what the student still needs.';

/** Auto, the default: it hugs a short body, never narrower than its trigger or 160. */
export const WidthAuto = {
    render: () => <OpenPopup title="Session 12"><span id="popup-width-auto-body">Ran over.</span></OpenPopup>,
    play: async ({ canvasElement }) => {
        const body = await openedPopup(canvasElement, 'popup-width-auto-body');
        const popup = body.closest('.plus-popup');
        const trigger = within(canvasElement).getByRole('button', { name: 'Details' });
        const width = popup.getBoundingClientRect().width;
        await expect(width, 'at least --popup-min-width').toBeGreaterThanOrEqual(tokenLength(canvasElement, '--popup-min-width'));
        await expect(width, 'at least the trigger').toBeGreaterThanOrEqual(trigger.getBoundingClientRect().width);
        await expect(width, 'hugs a short body').toBeLessThan(tokenLength(canvasElement, '--popup-max-width'));
    },
};

/** Auto with a long body: it grows with its content and stops at 320, then wraps. */
export const WidthAutoCaps = {
    render: () => <OpenPopup title="Session 12"><span id="popup-width-auto-long">{longBody}</span></OpenPopup>,
    play: async ({ canvasElement }) => {
        const popup = (await openedPopup(canvasElement, 'popup-width-auto-long')).closest('.plus-popup');
        await expect(popup.getBoundingClientRect().width, 'stops at --popup-max-width')
            .toBeCloseTo(tokenLength(canvasElement, '--popup-max-width'), 0);
    },
};

/**
 * The column steps, for a menu of several categories: 3 and 4 screen-grid
 * columns plus the popup pad, worked out by the same rule as Modal's widths.
 * One more column adds one column and one gutter, whatever the screen.
 */
export const WidthColumns = {
    render: () => (
        <div style={{ padding: 'calc(var(--space-400) * 4) var(--space-400)', display: 'flex', gap: 'var(--space-400)', justifyContent: 'center' }}>
            {['3-col', '4-col'].map((width) => (
                <Popup
                    key={width}
                    id={`popup-width-${width}`}
                    trigger={<Button appearance="primary" text={width} />}
                    title="Filters"
                    placement="bottom"
                    width={width}
                    triggerType="manual"
                    show
                >
                    Subject, grade and tutor.
                </Popup>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const three = (await openedPopup(canvasElement, 'popup-width-3-col')).getBoundingClientRect().width;
        const four = (await openedPopup(canvasElement, 'popup-width-4-col')).getBoundingClientRect().width;
        const gutter = tokenLength(canvasElement, '--grid-gutter');
        const pad = px(getComputedStyle(canvasElement.ownerDocument.getElementById('popup-width-3-col')).paddingLeft);
        const column = (three - 2 * gutter - 2 * pad) / 3;
        await expect(four - three, 'one more column and its gutter').toBeCloseTo(column + gutter, 0);
    },
};

/** Opened by a pointer, it clips out from the trigger's corner; only clip-path and opacity move, never the width. */
export const OpensWithAClip = {
    render: () => (
        <div style={{ padding: 'calc(var(--space-400) * 4) var(--space-400)', display: 'flex', justifyContent: 'center' }}>
            <Popup id="popup-motion-pointer" trigger={<Button appearance="primary" text="Details" />} title="Session 12" placement="bottom-start">
                Ran 45 minutes over.
            </Popup>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Details' }));
        const popup = await openedPopup(canvasElement, 'popup-motion-pointer');
        const style = getComputedStyle(popup);
        await expect(style.animationName, 'opens with the clip').toContain('plus-popup-clip-open');
        // The width never animates: no transition that covers it runs for any time.
        const properties = style.transitionProperty.split(',').map((p) => p.trim());
        const durations = style.transitionDuration.split(',').map((d) => parseFloat(d));
        const widthMoves = properties.some((p, i) => /^(all|width|min-width|max-width)$/.test(p) && durations[i % durations.length] > 0);
        await expect(widthMoves, 'the width never animates').toBe(false);
        await expect(style.getPropertyValue('--plus-popup-clip-bottom').trim(), 'collapsed onto the edge facing the trigger').toBe('100%');
        await expect(style.getPropertyValue('--plus-popup-clip-right').trim(), 'at the start corner').toBe('100%');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvasElement.ownerDocument.getElementById('popup-motion-pointer')).toBeNull());
    },
};

/** Opened from the keyboard, it appears at once. */
export const KeyboardOpenIsInstant = {
    render: () => (
        <div style={{ padding: 'calc(var(--space-400) * 4) var(--space-400)', display: 'flex', justifyContent: 'center' }}>
            <Popup id="popup-motion-keyboard" trigger={<Button appearance="primary" text="Details" />} title="Session 12" placement="bottom-start">
                Ran 45 minutes over.
            </Popup>
        </div>
    ),
    play: async ({ canvasElement }) => {
        within(canvasElement).getByRole('button', { name: 'Details' }).focus();
        await userEvent.keyboard('{Enter}');
        const popup = await openedPopup(canvasElement, 'popup-motion-keyboard');
        await expect(popup).toHaveAttribute('data-instant', 'click');
        await expect(getComputedStyle(popup).animationName, 'no clip from the keyboard').toBe('none');
        await userEvent.keyboard('{Escape}');
    },
};

const MotionStory = ({ id }) => (
    <div style={{ padding: 'calc(var(--space-400) * 4) var(--space-400)', display: 'flex', justifyContent: 'center' }}>
        <Popup id={id} trigger={<Button appearance="primary" text="Details" />} title="Session 12" placement="bottom-start">
            Ran 45 minutes over.
        </Popup>
    </div>
);

/**
 * The motion's end states: after a click it is open and focus is inside it;
 * after Escape it is gone. Only the settled state is read, never a frame between.
 */
export const OpensAndCloses = {
    render: () => <MotionStory id="popup-motion-ends" />,
    play: async ({ canvasElement }) => {
        const doc = canvasElement.ownerDocument;
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Details' }));
        const popup = await openedPopup(canvasElement, 'popup-motion-ends');
        await waitFor(() => expect(popup.contains(doc.activeElement)).toBe(true));
        await waitFor(() => expect(popup).toBeVisible());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(doc.getElementById('popup-motion-ends')).toBeNull());
    },
};

/** It opens on the Popup motion tokens: the fast spatial spring, read from `--ds-motion-*`. */
export const OpensOnTheMotionTokens = {
    render: () => <MotionStory id="popup-motion-tokens" />,
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Details' }));
        const popup = await openedPopup(canvasElement, 'popup-motion-tokens');
        const style = getComputedStyle(popup);
        const root = getComputedStyle(canvasElement.ownerDocument.documentElement);
        const raw = root.getPropertyValue('--ds-motion-spatial-fast-duration').trim();
        const seconds = parseFloat(raw) / (raw.endsWith('ms') ? 1000 : 1);
        await expect(style.animationName).toContain('plus-popup-clip-open');
        await expect(parseFloat(style.animationDuration)).toBeCloseTo(seconds, 3);
        await userEvent.keyboard('{Escape}');
    },
};

/** Under reduced motion it still opens to visible, as a fade with no clip. */
export const ReducedMotion = {
    render: () => <MotionStory id="popup-motion-reduced" />,
    beforeEach: async () => async () => { await emulateReducedMotion(null); },
    play: async ({ canvasElement }) => {
        if (!(await emulateReducedMotion('reduce'))) return;
        const doc = canvasElement.ownerDocument;
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Details' }));
        const popup = await openedPopup(canvasElement, 'popup-motion-reduced');
        await expect(getComputedStyle(popup).animationName, 'a fade, not the clip').not.toContain('plus-popup-clip-open');
        await waitFor(() => expect(popup.contains(doc.activeElement)).toBe(true));
        await waitFor(() => expect(popup).toBeVisible());
        await userEvent.keyboard('{Escape}');
    },
};

/** Without a title the body stands alone. */
export const BodyOnly = { render: () => <OpenPopup>Ran 45 minutes over.</OpenPopup> };

const TriggerStory = ({ triggerType, text }) => (
    <div style={{ padding: 'var(--space-400)', display: 'flex', justifyContent: 'center' }}>
        <Popup trigger={<Button appearance="primary" text={text} />} title="Session 12" triggerType={triggerType}>
            Ran 45 minutes over.
        </Popup>
    </div>
);

export const TriggerClick = { render: () => <TriggerStory triggerType="click" text="Click me" /> };
export const TriggerHover = { render: () => <TriggerStory triggerType="hover" text="Hover me" /> };
export const TriggerFocus = { render: () => <TriggerStory triggerType="focus" text="Tab to me" /> };
export const TriggerHoverAndClick = { render: () => <TriggerStory triggerType={['hover', 'click']} text="Hover or click me" /> };
