import React, { useEffect, useRef, useState } from 'react';
import { Button, ButtonItem, DropdownMenu, Icon } from '@/components';
import { DocsOverlayBoundary } from './docs-overlay-boundary.jsx';

const noop = () => {};

/**
 * Shared live DropdownMenu demo for the Best practices DoDontPair blocks on
 * `DropdownMenu.mdx` and the `BestPracticesLive` story in `DropdownMenu.stories.jsx`.
 *
 * Uses DropdownMenu's public controlled `isOpen` and `onOpenChange` API so each
 * demo starts open at rest inside `DocsOverlayBoundary` (`containHeight`) and
 * only closes when interacted with inside its own card (trigger click, row pick,
 * or Escape), never when another card is clicked.
 */
export const LiveMenu = ({
    label = 'Session actions',
    defaultOpen = true,
    minWidth = 'var(--field-width-md)',
    trigger,
    children,
    ...menuProps
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
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
                <DropdownMenu
                    isOpen={isOpen}
                    onOpenChange={(next) => {
                        if (next || insideGestureRef.current) {
                            insideGestureRef.current = false;
                            setIsOpen(next);
                        }
                    }}
                    placement="bottom-start"
                    minWidth={minWidth}
                    trigger={trigger ?? <Button text={label} iconAfter={<Icon name="chevron-down" size={12} />} />}
                    {...menuProps}
                >
                    {children}
                </DropdownMenu>
            </div>
        </DocsOverlayBoundary>
    );
};

export const OrderDo = () => (
    <LiveMenu>
        <ButtonItem onClick={noop}>Rename</ButtonItem>
        <ButtonItem onClick={noop}>Duplicate</ButtonItem>
        <ButtonItem onClick={noop}>Archive</ButtonItem>
        <ButtonItem onClick={noop}>Delete</ButtonItem>
    </LiveMenu>
);

export const OrderDont = () => (
    <LiveMenu>
        <ButtonItem onClick={noop}>Delete</ButtonItem>
        <ButtonItem onClick={noop}>Rename</ButtonItem>
        <ButtonItem onClick={noop}>Duplicate</ButtonItem>
        <ButtonItem onClick={noop}>Archive</ButtonItem>
    </LiveMenu>
);

export const VerbCaseDo = () => (
    <LiveMenu>
        <ButtonItem onClick={noop}>Rename</ButtonItem>
        <ButtonItem onClick={noop}>Duplicate</ButtonItem>
        <ButtonItem onClick={noop}>Archive</ButtonItem>
    </LiveMenu>
);

export const VerbCaseDont = () => (
    <LiveMenu>
        <ButtonItem onClick={noop}>NAME</ButtonItem>
        <ButtonItem onClick={noop}>COPY</ButtonItem>
        <ButtonItem onClick={noop}>FILE</ButtonItem>
    </LiveMenu>
);

export const ShortLabelsDo = () => (
    <LiveMenu>
        <ButtonItem onClick={noop}>Rename</ButtonItem>
        <ButtonItem onClick={noop}>Duplicate</ButtonItem>
        <ButtonItem onClick={noop}>Archive</ButtonItem>
    </LiveMenu>
);

export const ShortLabelsDont = () => (
    <LiveMenu>
        <ButtonItem onClick={noop}>Archive this session now</ButtonItem>
        <ButtonItem onClick={noop}>Archive this session later</ButtonItem>
        <ButtonItem onClick={noop}>Archive this session today</ButtonItem>
    </LiveMenu>
);
