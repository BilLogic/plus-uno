import React, { useRef, useState } from 'react';
import { Button, Spotlight, SpotlightAction, SpotlightProvider, SpotlightTarget } from '@/components';
import { DocsOverlayBoundary } from './docs-overlay-boundary.jsx';

/**
 * Shared live Spotlight demo for the Best practices DoDontPair blocks on
 * `Spotlight.mdx` and the `BestPracticesLive` story in `Spotlight.stories.jsx`.
 *
 * Uses Spotlight's public `isOpen` and `onDismiss` API so each spotlight starts
 * open at rest inside `DocsOverlayBoundary` (`containHeight`) and only closes
 * when dismissed from inside its own card (Got it, Skip, Dismiss, target toggle,
 * or Escape), never when another card is clicked. For "Make the secondary
 * action a link", the Do half renders `SpotlightAction` with `href` as an
 * inline link (`textDecoration: 'underline'`, no button border) so the visual
 * contrast against the Don't half's two competing buttons is clear at rest.
 */
export const LiveSpotlight = ({
    targetText = 'Calendar',
    headline,
    children,
    stepCount,
    secondaryKind = 'skip',
    secondaryLabel = 'Skip',
    primaryLabel = 'Got it',
    defaultOpen = true,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const insideGestureRef = useRef(false);
    const markInsideGesture = () => {
        insideGestureRef.current = true;
        queueMicrotask(() => {
            insideGestureRef.current = false;
        });
    };

    const secondaryAction = secondaryKind === 'link'
        ? (
            <SpotlightAction
                appearance="secondary"
                href="#spotlight-tour-details"
                style={{ border: 'none', textDecoration: 'underline' }}
                onClick={(event) => event.preventDefault()}
            >
                {secondaryLabel}
            </SpotlightAction>
        )
        : secondaryKind === 'competing-primary'
            ? (
                <SpotlightAction appearance="primary" onClick={() => setIsOpen(false)}>
                    {secondaryLabel}
                </SpotlightAction>
            )
            : (
                <SpotlightAction appearance="secondary" onClick={() => setIsOpen(false)}>
                    {secondaryLabel}
                </SpotlightAction>
            );

    return (
        <DocsOverlayBoundary containHeight>
            <SpotlightProvider>
                <div
                    style={{ display: 'flex', justifyContent: 'center' }}
                    onPointerDownCapture={markInsideGesture}
                    onMouseDownCapture={markInsideGesture}
                    onClickCapture={markInsideGesture}
                    onKeyDownCapture={markInsideGesture}
                >
                    <SpotlightTarget>
                        <Button text={targetText} onClick={() => setIsOpen((open) => !open)} />
                    </SpotlightTarget>
                    <Spotlight
                        headline={headline}
                        stepCount={stepCount}
                        isOpen={isOpen}
                        onDismiss={() => {
                            if (insideGestureRef.current) {
                                insideGestureRef.current = false;
                                setIsOpen(false);
                            }
                        }}
                        secondaryAction={secondaryAction}
                        primaryAction={(
                            <SpotlightAction appearance="primary" onClick={() => setIsOpen(false)}>
                                {primaryLabel}
                            </SpotlightAction>
                        )}
                    >
                        {children}
                    </Spotlight>
                </div>
            </SpotlightProvider>
        </DocsOverlayBoundary>
    );
};

export const FeatureHeadlineDo = () => (
    <LiveSpotlight headline="Find sessions here" stepCount="1 of 3">
        Open the calendar to see this week.
    </LiveSpotlight>
);

export const FeatureHeadlineDont = () => (
    <LiveSpotlight headline="Welcome!" stepCount="1 of 3">
        Click here to learn about the new calendar view and everything else we changed this term.
    </LiveSpotlight>
);

export const StepCountTourDo = () => (
    <LiveSpotlight headline="Find sessions here" stepCount="1 of 3">
        Open the calendar to see this week.
    </LiveSpotlight>
);

export const StepCountTourDont = () => (
    <LiveSpotlight headline="Find sessions here" stepCount="1 of 1">
        Open the calendar to see this week.
    </LiveSpotlight>
);

export const SecondaryLinkDo = () => (
    <LiveSpotlight headline="Find sessions here" stepCount="1 of 3" secondaryKind="link" secondaryLabel="Learn more">
        Open the calendar to see this week.
    </LiveSpotlight>
);

export const SecondaryLinkDont = () => (
    <LiveSpotlight headline="Find sessions here" stepCount="1 of 3" secondaryKind="competing-primary" secondaryLabel="Learn more">
        Open the calendar to see this week.
    </LiveSpotlight>
);
