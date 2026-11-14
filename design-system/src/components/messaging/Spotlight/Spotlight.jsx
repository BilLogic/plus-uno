import React, { createContext, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { Popover } from '@base-ui/react/popover';
import { useBoundedOverlay } from '@/lib/overlay';
import { Button } from '../../forms-and-inputs/Button/Button';
import CloseButton from '../../forms-and-inputs/CloseButton';
import './Spotlight.scss';

export const SPOTLIGHT_PLACEMENTS = [
    'top', 'top-start', 'top-end',
    'bottom', 'bottom-start', 'bottom-end',
    'left', 'right',
    'auto',
];

const PLACEMENT_TO_SIDE_ALIGN = {
    top: ['top', 'center'],
    'top-start': ['top', 'start'],
    'top-end': ['top', 'end'],
    bottom: ['bottom', 'center'],
    'bottom-start': ['bottom', 'start'],
    'bottom-end': ['bottom', 'end'],
    left: ['left', 'center'],
    right: ['right', 'center'],
    auto: ['bottom', 'center'],
};

/**
 * Shares one anchor ref between a `SpotlightTarget` and the `Spotlight`
 * anchored to it, so a caller never wires the ref through props itself.
 */
const SpotlightContext = createContext(null);

export const SpotlightProvider = ({ children }) => {
    const anchorRef = useRef(null);
    return <SpotlightContext.Provider value={anchorRef}>{children}</SpotlightContext.Provider>;
};

SpotlightProvider.propTypes = { children: PropTypes.node };

/** SpotlightTarget: the element a Spotlight points at. Renders its child as-is, with the shared ref attached. */
export const SpotlightTarget = ({ children }) => {
    const anchorRef = useContext(SpotlightContext);
    return React.cloneElement(React.Children.only(children), { ref: anchorRef });
};

SpotlightTarget.propTypes = { children: PropTypes.element.isRequired };

/** SpotlightHeader: the headline and its dismiss control, which is the dialog's first focusable element. */
const SpotlightHeader = ({ headline, dismissControl }) => (
    <div className="plus-spotlight-header">
        {dismissControl && <div className="plus-spotlight-dismiss">{dismissControl}</div>}
        <Popover.Title className="plus-spotlight-headline">{headline}</Popover.Title>
    </div>
);

SpotlightHeader.propTypes = { headline: PropTypes.node, dismissControl: PropTypes.node };

/** Each action's Button appearance and its inverse-ground class, spelled out so a search for either finds it. */
const ACTION = {
    primary: { appearance: 'default', className: 'plus-spotlight-action--primary' },
    secondary: { appearance: 'subtle', className: 'plus-spotlight-action--secondary' },
};

/** SpotlightAction: a footer Button, a link when `href` is given and a button otherwise. */
export const SpotlightAction = ({ appearance = 'primary', href, onClick, children, ...props }) => {
    const action = ACTION[appearance] ?? ACTION.primary;
    return (
        <Button
            appearance={action.appearance}
            className={clsx('plus-spotlight-action', action.className)}
            href={href}
            role={href ? 'link' : undefined}
            onClick={onClick}
            {...props}
        >
            {children}
        </Button>
    );
};

SpotlightAction.propTypes = {
    appearance: PropTypes.oneOf(['primary', 'secondary']),
    /** A link action when given; a button action otherwise. */
    href: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.node,
};

/**
 * Spotlight: a one-step onboarding callout anchored to a `SpotlightTarget`,
 * drawn on `Popover.Positioner` from `@base-ui/react`.
 */
export const Spotlight = ({
    target,
    placement = 'bottom',
    headline,
    children,
    media,
    stepCount,
    primaryAction,
    secondaryAction,
    dismissible = true,
    onDismiss,
    isOpen = true,
    className,
}) => {
    const contextAnchor = useContext(SpotlightContext);
    const anchor = target ?? contextAnchor;
    const anchorNode = typeof anchor === 'function' ? anchor() : (anchor?.current ?? anchor ?? null);
    const bounded = useBoundedOverlay({ fromNode: anchorNode });
    const [side, align] = PLACEMENT_TO_SIDE_ALIGN[placement] ?? PLACEMENT_TO_SIDE_ALIGN.bottom;

    const dismissControl = dismissible && (
        <CloseButton
            label="Dismiss"
            tone="inverse"
            isTooltipDisabled
            className="plus-spotlight-dismiss-button"
            onClick={onDismiss}
        />
    );

    return (
        <Popover.Root open={isOpen} onOpenChange={(open) => { if (!open) onDismiss?.(); }}>
            <Popover.Portal container={bounded ? bounded.container : undefined}>
                <Popover.Positioner
                    anchor={anchor}
                    side={side}
                    align={align}
                    sideOffset={8}
                    collisionBoundary={bounded?.collisionBoundary}
                    collisionAvoidance={bounded?.collisionAvoidance}
                >
                    <Popover.Popup className={clsx('plus-spotlight', className)}>
                        <SpotlightHeader headline={headline} dismissControl={dismissControl} />
                        {media && <div className="plus-spotlight-media">{media}</div>}
                        <Popover.Description className="plus-spotlight-body">{children}</Popover.Description>
                        <div className="plus-spotlight-footer">
                            {stepCount && <span className="plus-spotlight-step-count">{stepCount}</span>}
                            <div className="plus-spotlight-actions">
                                {secondaryAction}
                                {primaryAction}
                            </div>
                        </div>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
};

Spotlight.propTypes = {
    /** The anchor element, when not read from the nearest SpotlightProvider's SpotlightTarget. */
    target: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    placement: PropTypes.oneOf(SPOTLIGHT_PLACEMENTS),
    headline: PropTypes.node,
    children: PropTypes.node,
    media: PropTypes.node,
    stepCount: PropTypes.node,
    /** A `SpotlightAction`, rendered after `secondaryAction`. */
    primaryAction: PropTypes.node,
    secondaryAction: PropTypes.node,
    dismissible: PropTypes.bool,
    onDismiss: PropTypes.func,
    isOpen: PropTypes.bool,
    className: PropTypes.string,
};

export default Spotlight;
