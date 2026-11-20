import React, { useState } from 'react';
import { InlineMessage } from '@/components';
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
 * Open-at-rest pairs pass `defaultOpen` and stay open when another card is
 * clicked; interacting inside a card (clicking its trigger or pressing Escape)
 * closes and reopens that card's popup normally.
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

    // An open-at-rest card stays open when another card is pressed. Every
    // other change, a press on its own trigger or Escape, is Base UI's own.
    const handleOpenChange = (next, details) => {
        if (!next && defaultOpen && details?.reason === 'outside-press') {
            details.cancel?.();
            return;
        }
        setOpen(next);
    };

    return (
        <DocsOverlayBoundary fit={false} containHeight>
            <div style={fieldRow}>
                <span>{field}</span>
                <InlineMessage
                    appearance={appearance}
                    isOpen={open}
                    onOpenChange={handleOpenChange}
                    placement="bottom"
                    label={label}
                    title={title}
                >
                    {children}
                </InlineMessage>
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
