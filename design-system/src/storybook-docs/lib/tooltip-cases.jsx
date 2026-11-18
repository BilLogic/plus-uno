import React, { useEffect, useRef, useState } from 'react';
import { Button, Popup, Tooltip } from '@/components';
import { DocsOverlayBoundary } from './docs-overlay-boundary.jsx';

/**
 * Live Do/Don't examples for Tooltip.mdx and Tooltip.stories.jsx.
 * Each overlay sits inside `DocsOverlayBoundary` (`containHeight`) so it
 * stays contained within its card without clipping or colliding with prose.
 */

const LiveTooltipCase = ({ text, triggerLabel }) => (
    <DocsOverlayBoundary fit={false} containHeight>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip text={text} placement="bottom" show>
                <Button appearance="default" text={triggerLabel} />
            </Tooltip>
        </div>
    </DocsOverlayBoundary>
);

export const LabelDo = () => (
    <LiveTooltipCase text="Opens the session notes" triggerLabel="Notes" />
);

export const LabelDont = () => (
    <LiveTooltipCase text="Notes" triggerLabel="Notes" />
);

export const ShortLineDo = () => (
    <LiveTooltipCase text="Moves this session out of the active list" triggerLabel="Archive" />
);

export const ShortLineDont = () => (
    <LiveTooltipCase
        text="Moves this session out of the active list. You can bring it back later from the archive, and its notes stay with it."
        triggerLabel="Archive"
    />
);

export const InteractivePopupDo = () => {
    const [open, setOpen] = useState(true);
    const insideGestureRef = useRef(false);
    const gestureTimerRef = useRef(0);
    const markInsideGesture = () => {
        insideGestureRef.current = true;
        window.clearTimeout(gestureTimerRef.current);
        gestureTimerRef.current = window.setTimeout(() => {
            insideGestureRef.current = false;
        }, 0);
    };
    useEffect(() => () => window.clearTimeout(gestureTimerRef.current), []);

    return (
        <DocsOverlayBoundary fit={false} containHeight>
            <div
                style={{ display: 'flex', justifyContent: 'center' }}
                onPointerDownCapture={markInsideGesture}
                onMouseDownCapture={markInsideGesture}
                onClickCapture={markInsideGesture}
                onKeyDownCapture={markInsideGesture}
            >
                <Popup
                    trigger={<Button appearance="default" text="Scheduling" />}
                    title="Scheduling"
                    placement="bottom"
                    show={open}
                    onToggle={(next) => {
                        if (next || insideGestureRef.current) {
                            insideGestureRef.current = false;
                            setOpen(next);
                        }
                    }}
                >
                    <a href="#help">Read the guide</a>
                </Popup>
            </div>
        </DocsOverlayBoundary>
    );
};

export const InteractiveTooltipDont = () => (
    <LiveTooltipCase
        text={<a href="#help" style={{ color: 'inherit' }}>Read the guide</a>}
        triggerLabel="Scheduling"
    />
);
