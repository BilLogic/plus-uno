import React from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { expectNoStateChange } from '@/storybook-docs/lib/label-states.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Popup from './Popup';
import Button from '@/components/forms-and-inputs/Button/Button';
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

/** Rest: one surface on the overlay fill, lifted by the overlay shadow, with no border of its own. */
export const Rest = {
    render: () => <StatePopup />,
    play: async ({ canvasElement }) => {
        const popup = await openPopup(canvasElement);
        const style = getComputedStyle(popup);
        await expect(style.backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface-overlay'));
        await expect(style.boxShadow).not.toBe('none');
        await expect(parseFloat(style.borderTopWidth)).toBe(0);
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

/** The width tiers: sm 320 (the default), md 400 and lg 480. */
export const WidthSmall = { render: () => <OpenPopup width="sm" title="Session 12" /> };
export const WidthMedium = { render: () => <OpenPopup width="md" title="Session 12" /> };
export const WidthLarge = { render: () => <OpenPopup width="lg" title="Session 12" /> };

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
