import React, { useState } from 'react';
import { Icon, IconButton, InlineMessage, Popup } from '@/components';
import { messageIcon } from '@/components/messaging/messageAppearance';
import { DocsOverlayBoundary } from './docs-overlay-boundary.jsx';

export const fieldRow = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--inline-sm)',
};

/**
 * Shared live InlineMessage demo for the Best practices DoDontPair blocks on
 * `InlineMessage.mdx` and the `BestPracticesLive` story in `InlineMessage.stories.jsx`.
 *
 * It is an InlineMessage's trigger and card built on Popup directly, because
 * the demo needs Popup's `onToggle(next, details)`: an open-at-rest card
 * (`defaultOpen`) ignores an outside press, so pressing another example does
 * not close it, but only until the person first changes it. After a press on
 * its trigger or Escape it is an ordinary popup that an outside press closes.
 * Nothing here reopens a card: the open state is the only thing that does.
 */
export const LiveInlineMessage = ({
    field = 'Session length',
    appearance,
    defaultOpen = true,
    label,
    title,
    children,
}) => {
    const [open, setOpen] = useState(defaultOpen);
    const [atRest, setAtRest] = useState(defaultOpen);

    const handleToggle = (next, details) => {
        if (!next && atRest && details?.reason === 'outside-press') {
            details.cancel?.();
            return;
        }
        setAtRest(false);
        setOpen(next);
    };

    return (
        <DocsOverlayBoundary fit={false} containHeight>
            <div style={fieldRow}>
                <span>{field}</span>
                <Popup
                    trigger={(
                        <IconButton
                            icon={<Icon name={messageIcon(appearance)} style={{ color: `var(--ds-icon-${appearance === 'info' ? 'information' : appearance})` }} />}
                            label={label}
                            appearance="subtle"
                            spacing="compact"
                            className="plus-inline-message-trigger"
                        />
                    )}
                    placement="bottom"
                    show={open}
                    onToggle={handleToggle}
                    className="plus-inline-message"
                >
                    <div className="plus-inline-message-content">
                        <div className="plus-inline-message-heading">
                            <strong className="plus-inline-message-title">{title}</strong>
                        </div>
                        {children}
                    </div>
                </Popup>
            </div>
        </DocsOverlayBoundary>
    );
};

export const TintMeaningDo = () => (
    <LiveInlineMessage field="Session length" appearance="info" label="About this setting" title="Heads up">
        This setting applies to new sessions only.
    </LiveInlineMessage>
);

export const TintMeaningDont = () => (
    <LiveInlineMessage field="Session length" appearance="danger" label="About this setting" title="Heads up">
        This setting applies to new sessions only.
    </LiveInlineMessage>
);

export const ShortLineDo = () => (
    <LiveInlineMessage field="Availability" appearance="warning" label="About availability" title="Limited availability">
        Only 2 slots left this week.
    </LiveInlineMessage>
);

export const ShortLineDont = () => (
    <LiveInlineMessage
        field="Availability"
        appearance="warning"
        label="About availability"
        title="Limited availability"
    >
        Only 2 slots left this week. Slots open each Monday for the following week, and a slot is held for ten minutes while you book, so the count can change while this page is open.
    </LiveInlineMessage>
);

export const OnePerFieldDo = () => (
    <DocsOverlayBoundary fit={false} containHeight>
        <div style={fieldRow}>
            <span>Session length</span>
            <InlineMessage appearance="info" placement="bottom" label="About session length" title="Heads up">
                This setting applies to new sessions only.
            </InlineMessage>
        </div>
    </DocsOverlayBoundary>
);

export const OnePerFieldDont = () => (
    <DocsOverlayBoundary fit={false} containHeight>
        <div style={fieldRow}>
            <span>Session length</span>
            <InlineMessage appearance="info" placement="bottom" label="About session length" title="Heads up">
                This setting applies to new sessions only.
            </InlineMessage>
            <InlineMessage appearance="warning" placement="bottom" label="About availability" title="Limited availability">
                Only 2 slots left this week.
            </InlineMessage>
        </div>
    </DocsOverlayBoundary>
);
