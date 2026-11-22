import React, { useState } from 'react';
import { InlineMessage } from '@/components';
import { DocsOverlayBoundary } from './docs-overlay-boundary.jsx';

/**
 * Shared live InlineMessage demo for the Best practices DoDontPair blocks on
 * `InlineMessage.mdx` and the `BestPracticesLive` story in `InlineMessage.stories.jsx`.
 *
 * It renders the component once, controlled with `isOpen`. An open-at-rest
 * card (`defaultOpen`) ignores an outside press, so pressing another example
 * does not close it, but only until the person first changes it. After a press
 * on its trigger or Escape it is an ordinary popup that an outside press closes.
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

    const handleOpenChange = (next, details) => {
        if (!next && atRest && details?.reason === 'outside-press') {
            details.cancel?.();
            return;
        }
        setAtRest(false);
        setOpen(next);
    };

    return (
        <DocsOverlayBoundary fit={false} containHeight>
            <div className="sb-ds-field-row">
                <span>{field}</span>
                <InlineMessage
                    appearance={appearance}
                    label={label}
                    title={title}
                    placement="bottom"
                    isOpen={open}
                    onOpenChange={handleOpenChange}
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
        <div className="sb-ds-field-row">
            <span>Session length</span>
            <InlineMessage appearance="info" placement="bottom" label="About session length" title="Heads up">
                This setting applies to new sessions only.
            </InlineMessage>
        </div>
    </DocsOverlayBoundary>
);

export const OnePerFieldDont = () => (
    <DocsOverlayBoundary fit={false} containHeight>
        <div className="sb-ds-field-row">
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
