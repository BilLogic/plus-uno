import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { Dialog } from '@base-ui/react/dialog';
import { openOverlayCount } from '@/lib/overlay';
import { useKeyboardOpen } from '@/lib/overlayMotion';
import { useMotionReduced } from '@/lib/motionPreference';
import { Heading, Icon, IconButton } from '@/components';
import './Panel.scss';

/**
 * PanelProvider / usePanelManager: the width a Panel opens at and the setter
 * that changes it, shared with whatever opens the panel.
 */
const PanelContext = createContext(null);

/** The width a Panel opens at when nothing sets one: the Frame's Panel area default, 400. */
const DEFAULT_WIDTH = 'var(--panel-width-default)';

/**
 * Set by a host that owns the Panel's width, fill and edge (the Frame's Panel
 * area). Inside one, a PanelContainer fills the host and paints no fill or edge
 * of its own, so the host can paint them by state.
 */
export const PanelHostContext = createContext(false);

export const PanelProvider = ({ defaultWidth = DEFAULT_WIDTH, children }) => {
    const [width, setWidth] = useState(defaultWidth);
    const value = useMemo(() => ({ width, setWidth }), [width]);
    return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>;
};

PanelProvider.propTypes = {
    defaultWidth: PropTypes.string,
    children: PropTypes.node,
};

export const usePanelManager = () => {
    const context = useContext(PanelContext);
    if (!context) throw new Error('usePanelManager must be used within a PanelProvider');
    return context;
};

/** Where a PanelOverlay opens: `start` beside the Sidebar (the Inbox), `end` at the far edge. */
export const PANEL_PLACEMENTS = ['start', 'end'];

/** The dismiss attempts Base UI reports that a PanelOverlay acts on. */
const OVERLAY_DISMISS_REASONS = new Set(['outside-press', 'escape-key']);

/**
 * PanelOverlay: a Panel that floats over the Page with no Blanket, opened from
 * a trigger (the Sidebar's bell opens the Inbox).
 *
 * - `placement="start"` docks it on the Sidebar's end edge, 360 wide
 *   (`--inbox-width`), over the Page and never over the Sidebar; `"end"` opens
 *   at the far edge at `--panel-width-default`.
 * - Dismissal and focus are Base UI's: Escape and a press outside close it, a
 *   press on the trigger is the trigger's own toggle, and closing returns focus
 *   to the trigger unless the press landed on something else.
 * - It fades in and out on `appearance.fast`, like a menu: a keyboard open
 *   shows with no animation, and in-app Reduced mode shows it with none at all.
 *
 * Put a `PanelContainer` and its parts inside; the container fills the overlay.
 * The overlay sits in `container`, the host it is positioned against.
 */
export const PanelOverlay = ({
    isOpen,
    onOpenChange,
    placement = 'start',
    label,
    container,
    triggerRef,
    width,
    className,
    children,
}) => {
    const reduced = useMotionReduced();
    const keyboard = useKeyboardOpen(isOpen);
    const closedBy = useRef(null);
    // A new open forgets how the last one closed.
    useEffect(() => { if (isOpen) closedBy.current = null; }, [isOpen]);

    const handleOpenChange = (next, details) => {
        if (next) {
            onOpenChange?.(true);
            return;
        }
        const reason = details?.reason;
        const event = details?.event;
        const keep = () => {
            // An attempt this overlay ignores leaves the event alone for whatever else listens.
            details?.cancel?.();
            details?.allowPropagation?.();
        };
        if (OVERLAY_DISMISS_REASONS.has(reason)) {
            // An open modal owns Escape and presses; an Escape a control inside already handled stays handled.
            if (openOverlayCount() > 0) return keep();
            if (reason === 'escape-key' && event?.defaultPrevented) return keep();
            // A press on the trigger is its own toggle: closing here would let it reopen.
            if (reason === 'outside-press' && triggerRef?.current?.contains(event?.target)) return keep();
        }
        closedBy.current = reason ?? null;
        onOpenChange?.(false);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={handleOpenChange} modal={false}>
            <Dialog.Portal container={container}>
                <Dialog.Popup
                    role="complementary"
                    aria-label={label}
                    tabIndex={-1}
                    className={clsx('plus-panel-overlay', `plus-panel-overlay--${placement}`, className)}
                    data-reduced={reduced ? 'true' : undefined}
                    data-instant={keyboard ? 'keyboard' : undefined}
                    style={width ? { width } : undefined}
                    // Back to the trigger, unless the person pressed somewhere else on purpose.
                    finalFocus={() => (closedBy.current === 'outside-press' ? false : (triggerRef?.current ?? true))}
                >
                    <PanelHostContext.Provider value>{children}</PanelHostContext.Provider>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

PanelOverlay.propTypes = {
    /** Whether the overlay is open */
    isOpen: PropTypes.bool.isRequired,
    /** Called with the next open state: false on Escape, an outside press or a close action */
    onOpenChange: PropTypes.func,
    /** `start` beside the Sidebar at `--inbox-width`; `end` at the far edge at `--panel-width-default` */
    placement: PropTypes.oneOf(PANEL_PLACEMENTS),
    /** The complementary landmark's name, such as "Inbox" */
    label: PropTypes.string.isRequired,
    /** The positioned host the overlay opens in, an element the page owns */
    container: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any }), PropTypes.object]),
    /** The control that opened it, as a ref: focus returns to it and a press on it is not an outside press */
    triggerRef: PropTypes.shape({ current: PropTypes.any }),
    /** Overrides the placement's width */
    width: PropTypes.string,
    className: PropTypes.string,
    /**
     * @ds-context Used in: PanelOverlay.children (ds guide panel)
     */
    children: PropTypes.node,
};

/** PanelContainer: the panel's own surface, at a fixed or the provider's width. */
export const PanelContainer = ({ width, className, children, ...props }) => {
    const panelContext = useContext(PanelContext);
    const hosted = useContext(PanelHostContext);
    const resolvedWidth = hosted ? '100%' : (width ?? panelContext?.width ?? DEFAULT_WIDTH);

    return (
        <section
            className={clsx('plus-panel', hosted && 'plus-panel--hosted', className)}
            style={{ width: resolvedWidth }}
            {...props}
        >
            {children}
        </section>
    );
};

PanelContainer.propTypes = {
    /** Falls back to the nearest PanelProvider's width, then `--panel-width-default` (400). Inside the Frame's Panel area it fills the area instead. */
    width: PropTypes.string,
    className: PropTypes.string,
    /**
     * @ds-context Used in: Panel.children (ds guide panel)
     */
    children: PropTypes.node,
};

/** PanelHeader: back action, optional title icon, title, and an action group. */
export const PanelHeader = ({ backAction, titleIcon, title, actions, className, ...props }) => (
    <header className={clsx('plus-panel-header', className)} {...props}>
        {backAction && <div className="plus-panel-header-back">{backAction}</div>}
        {titleIcon && <div className="plus-panel-header-icon">{titleIcon}</div>}
        <div className="plus-panel-header-title"><Heading size="xs">{title}</Heading></div>
        {actions && <PanelActionGroup className="plus-panel-header-actions">{actions}</PanelActionGroup>}
    </header>
);

PanelHeader.propTypes = {
    backAction: PropTypes.node,
    titleIcon: PropTypes.node,
    title: PropTypes.node,
    actions: PropTypes.node,
    className: PropTypes.string,
};

/** PanelActionGroup: the row an action-component family (Close, More, …) sits in. */
export const PanelActionGroup = ({ className, children, ...props }) => (
    <div className={clsx('plus-panel-action-group', className)} {...props}>{children}</div>
);

PanelActionGroup.propTypes = { className: PropTypes.string, children: PropTypes.node };

/** PanelSubheader: a row of secondary content under the header. */
export const PanelSubheader = ({ className, children, ...props }) => (
    <div className={clsx('plus-panel-subheader', className)} {...props}>{children}</div>
);

PanelSubheader.propTypes = { className: PropTypes.string, children: PropTypes.node };

/** PanelBody: the panel's scrollable main content. */
export const PanelBody = ({ className, children, ...props }) => (
    <div className={clsx('plus-panel-body', className)} {...props}>{children}</div>
);

PanelBody.propTypes = { className: PropTypes.string, children: PropTypes.node };

/** PanelFooter: actions and an optional disclaimer line. */
export const PanelFooter = ({ className, children, ...props }) => (
    <footer className={clsx('plus-panel-footer', className)} {...props}>{children}</footer>
);

PanelFooter.propTypes = { className: PropTypes.string, children: PropTypes.node };

/** PanelDisclaimer: the small-print line a PanelFooter carries beside its actions. */
export const PanelDisclaimer = ({ className, children, ...props }) => (
    <p className={clsx('plus-panel-disclaimer', className)} {...props}>{children}</p>
);

PanelDisclaimer.propTypes = { className: PropTypes.string, children: PropTypes.node };

// `icon` is an icon name, drawn at `size` when one is given. The Icon element is made when the action renders, so
// this module does not read `Icon` while the components barrel is still loading (AI chat, in that barrel, imports it).
const actionIconButton = (icon, label, size) => {
    const Action = ({ onClick, ...props }) => (
        <IconButton icon={size ? <Icon name={icon} size={size} /> : icon} label={label} spacing="compact" onClick={onClick} {...props} />
    );
    Action.propTypes = { onClick: PropTypes.func };
    Action.displayName = `Panel${label.replace(/\s+/g, '')}Action`;
    return Action;
};

export const PanelBackAction = actionIconButton('arrow-left', 'Back');
export const PanelCloseAction = actionIconButton('xmark', 'Close');
export const PanelMoreAction = actionIconButton('ellipsis', 'More actions');
export const PanelUpAction = actionIconButton('chevron-up', 'Previous', 12);
export const PanelDownAction = actionIconButton('chevron-down', 'Next', 12);
export const PanelNewTabAction = actionIconButton('arrow-up-right-from-square', 'Open in new tab');
export const PanelViewSwitcher = actionIconButton('table-columns', 'Switch view');

export default PanelContainer;
