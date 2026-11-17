import React, { useLayoutEffect, useRef, useState } from 'react';
import { InlineMessage } from '@/components';
import { guardBoundaryMountFocus } from './docs-open-at-top.js';
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
    const [resetKey, setResetKey] = useState(0);
    const [host, setHost] = useState(null);
    const insideGestureRef = useRef(false);
    const userDismissedRef = useRef(!defaultOpen);

    const markInsideGesture = () => {
        insideGestureRef.current = true;
        setTimeout(() => {
            insideGestureRef.current = false;
        }, 0);
    };

    useLayoutEffect(() => {
        if (!defaultOpen || !host || typeof MutationObserver === 'undefined') return undefined;
        const boundary = host.closest('[data-docs-overlay-container]') ?? host;
        const observer = new MutationObserver(() => {
            const hasPopup = Boolean(boundary.querySelector('.plus-popup'));
            if (hasPopup) {
                userDismissedRef.current = false;
            } else if (insideGestureRef.current) {
                userDismissedRef.current = true;
            } else if (!userDismissedRef.current) {
                guardBoundaryMountFocus(boundary);
                setResetKey((k) => k + 1);
            }
        });
        observer.observe(boundary, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [defaultOpen, host]);

    return (
        <DocsOverlayBoundary containHeight>
            <div
                ref={setHost}
                style={fieldRow}
                onPointerDownCapture={markInsideGesture}
                onMouseDownCapture={markInsideGesture}
                onClickCapture={markInsideGesture}
                onKeyDownCapture={markInsideGesture}
            >
                <span>{field}</span>
                <InlineMessage
                    key={resetKey}
                    appearance={appearance}
                    defaultOpen={defaultOpen}
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
    <DocsOverlayBoundary containHeight>
        <div style={fieldRow}>
            <span>Session length</span>
            <InlineMessage appearance="info" label="About session length" title="Heads up">
                This setting applies to new sessions only.
            </InlineMessage>
        </div>
    </DocsOverlayBoundary>
);

export const OnePerFieldDont = () => (
    <DocsOverlayBoundary containHeight>
        <div style={fieldRow}>
            <span>Session length</span>
            <InlineMessage appearance="info" label="About session length" title="Heads up">
                This setting applies to new sessions only.
            </InlineMessage>
            <InlineMessage appearance="warning" label="About availability" title="Limited availability">
                Only 2 slots left this week.
            </InlineMessage>
        </div>
    </DocsOverlayBoundary>
);
